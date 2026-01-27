package com.sandpixel.service.game;

import com.sandpixel.model.game.*;
import com.sandpixel.service.BroadcastService;
import com.sandpixel.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VotingManager {

    private static final int VOTING_TIME_SECONDS = 30;
    private static final int VOTING_WINNER_BONUS = 100;

    private final RoomService roomService;
    private final BroadcastService broadcastService;
    private final TimerManager timerManager;

    public void startVotingPhase(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();

        // Only start voting if there are drawings to vote on
        if (state.getRoundDrawings().isEmpty()) {
            log.info("No drawings to vote on, skipping voting phase: roomId={}", roomId);
            resetRoom(roomId);
            return;
        }

        state.startVoting();
        timerManager.notifyPhaseChange(roomId, GamePhase.VOTING);

        log.info("Voting phase started: roomId={}, drawings={}", roomId, state.getRoundDrawings().size());

        // Broadcast voting start
        broadcastService.broadcastToRoom(roomId, GameEvent.votingStart(
            state.getRoundDrawings(),
            VOTING_TIME_SECONDS
        ));

        // Schedule voting end
        timerManager.scheduleTask(roomId, GamePhase.VOTING, () -> endVotingPhase(roomId), VOTING_TIME_SECONDS);
    }

    public boolean processVote(String roomId, String sessionId, String drawingDrawerId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return false;

        GameState state = room.getGameState();
        Player voter = room.getPlayer(sessionId);

        if (voter == null) return false;

        // Validate phase
        if (state.getPhase() != GamePhase.VOTING) {
            log.warn("Vote rejected: not in voting phase, roomId={}", roomId);
            return false;
        }

        // Can't vote for yourself
        if (voter.getId().equals(drawingDrawerId)) {
            log.warn("Vote rejected: player tried to vote for themselves, roomId={}, playerId={}", roomId, voter.getId());
            return false;
        }

        // Can't vote twice
        if (state.hasVoted(voter.getId())) {
            log.warn("Vote rejected: player already voted, roomId={}, playerId={}", roomId, voter.getId());
            return false;
        }

        // Record the vote
        state.recordVote(voter.getId(), drawingDrawerId);
        log.info("Vote recorded: roomId={}, voter={}, votedFor={}", roomId, voter.getName(), drawingDrawerId);

        // Broadcast vote update
        broadcastService.broadcastToRoom(roomId, GameEvent.voteReceived(
            voter.getId(),
            voter.getName(),
            state.getVotedPlayers().size(),
            room.getPlayerCount()
        ));

        // Check if all players have voted
        if (state.getVotedPlayers().size() >= room.getPlayerCount()) {
            timerManager.cancelTimer(roomId);
            endVotingPhase(roomId);
        }

        return true;
    }

    public void endVotingPhase(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();
        timerManager.cancelTimer(roomId);

        // Find the winner (most votes)
        DrawingEntry winner = state.getRoundDrawings().stream()
            .max(Comparator.comparingInt(DrawingEntry::getVotes))
            .orElse(null);

        if (winner != null && winner.getVotes() > 0) {
            // Award bonus points to winner
            Player winnerPlayer = room.getPlayerList().stream()
                .filter(p -> p.getId().equals(winner.getDrawerId()))
                .findFirst()
                .orElse(null);

            if (winnerPlayer != null) {
                winnerPlayer.addScore(VOTING_WINNER_BONUS);
                log.info("Voting winner: roomId={}, winner={}, bonus={}", roomId, winnerPlayer.getName(), VOTING_WINNER_BONUS);
            }
        }

        // Prepare results
        List<Map<String, Object>> votingResults = state.getRoundDrawings().stream()
            .sorted(Comparator.comparingInt(DrawingEntry::getVotes).reversed())
            .map(entry -> Map.<String, Object>of(
                "drawerId", entry.getDrawerId(),
                "drawerName", entry.getDrawerName(),
                "word", entry.getWord(),
                "votes", entry.getVotes(),
                "isWinner", winner != null && entry.getDrawerId().equals(winner.getDrawerId())
            ))
            .collect(Collectors.toList());

        // Broadcast results
        broadcastService.broadcastToRoom(roomId, GameEvent.votingResults(
            votingResults,
            winner != null ? winner.getDrawerId() : null,
            VOTING_WINNER_BONUS
        ));

        log.info("Voting phase ended: roomId={}", roomId);

        // Schedule transition to lobby
        timerManager.scheduleTask(roomId, () -> resetRoom(roomId), 5);
    }

    private void resetRoom(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room != null) {
            room.resetForNewGame();
            timerManager.notifyPhaseChange(roomId, GamePhase.LOBBY);
            broadcastService.broadcastToRoom(roomId, GameEvent.roomState(room));
        }
    }
}
