package com.sandpixel.service.game;

import com.sandpixel.model.game.*;
import com.sandpixel.service.BroadcastService;
import com.sandpixel.service.RoomService;
import com.sandpixel.service.ScoringService;
import com.sandpixel.service.WordBankService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoundManager {

    private final RoomService roomService;
    private final WordBankService wordBankService;
    private final ScoringService scoringService;
    private final BroadcastService broadcastService;
    private final TimerManager timerManager;
    private final PhaseManager phaseManager;

    public boolean startNextRound(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return false;

        GameState state = room.getGameState();

        // Check if game is over
        if (state.getCurrentRound() >= state.getTotalRounds()) {
            return false;
        }

        // Get next drawer
        String nextDrawerSessionId = room.getNextDrawerId();
        if (nextDrawerSessionId == null) return false;

        Player drawer = room.getPlayer(nextDrawerSessionId);
        if (drawer == null) return false;

        // Get word options
        String[] wordOptions = wordBankService.getWordOptions(3);

        // Start the round
        state.startNewRound(nextDrawerSessionId, drawer.getId(), wordOptions);
        timerManager.notifyPhaseChange(roomId, GamePhase.WORD_SELECTION);

        log.info("Round {} started: roomId={}, drawer={} ({})",
            state.getCurrentRound(), roomId, drawer.getName(), drawer.getId());

        // Broadcast round start to all
        broadcastService.broadcastToRoom(roomId, GameEvent.roundStart(
            state.getCurrentRound(),
            drawer.getId(),
            0,
            ""
        ));

        // Send word options to drawer only
        broadcastService.sendToPlayer(nextDrawerSessionId, GameEvent.wordOptions(wordOptions));

        return true;
    }

    public void endRound(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();
        timerManager.cancelTimer(roomId);

        // Award drawer points
        Player drawer = room.getPlayer(state.getCurrentDrawerSessionId());
        if (drawer != null && state.getCorrectGuessCount() > 0) {
            int drawerPoints = scoringService.calculateDrawerPoints(
                state.getCorrectGuessCount(),
                room.getPlayerCount()
            );
            drawer.addScore(drawerPoints);
        }

        state.showResults();
        timerManager.notifyPhaseChange(roomId, GamePhase.RESULTS);

        log.info("Round {} ended: roomId={}, word={}",
            state.getCurrentRound(), roomId, state.getCurrentWord());

        // Broadcast round results
        broadcastService.broadcastToRoom(roomId, GameEvent.roundEnd(
            state.getCurrentWord(),
            scoringService.getRoundScores(room)
        ));
    }

    public void endGame(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();
        state.endGame();
        timerManager.notifyPhaseChange(roomId, GamePhase.GAME_OVER);

        log.info("Game ended: roomId={}", roomId);

        broadcastService.broadcastToRoom(roomId, GameEvent.gameOver(
            scoringService.getFinalScores(room)
        ));
    }

    public void resetRoom(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room != null) {
            room.resetForNewGame();
            timerManager.notifyPhaseChange(roomId, GamePhase.LOBBY);
            broadcastService.broadcastToRoom(roomId, GameEvent.roomState(room));
        }
    }

    public boolean isGameOver(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return true;
        GameState state = room.getGameState();
        return state.getCurrentRound() >= state.getTotalRounds();
    }

    public void handleDrawerDisconnect(String roomId, String drawerSessionId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();

        // Only handle if we're in a phase where drawer matters
        if (!phaseManager.isInPhase(state, GamePhase.WORD_SELECTION, GamePhase.DRAWING)) {
            return;
        }

        // Check if disconnected player was the drawer
        if (!drawerSessionId.equals(state.getCurrentDrawerSessionId())) {
            return;
        }

        log.info("Drawer disconnected during active phase: roomId={}", roomId);

        timerManager.cancelTimer(roomId);

        // Broadcast notification
        broadcastService.broadcastToRoom(roomId, GameEvent.chat(
            createSystemMessage("Drawer disconnected, skipping to next round...")
        ));

        // Skip to results then next round after delay
        state.showResults();
        timerManager.notifyPhaseChange(roomId, GamePhase.RESULTS);

        broadcastService.broadcastToRoom(roomId, GameEvent.roundEnd(
            state.getCurrentWord() != null ? state.getCurrentWord() : "(skipped)",
            scoringService.getRoundScores(room)
        ));
    }

    private ChatMessage createSystemMessage(String text) {
        ChatMessage msg = new ChatMessage();
        msg.setPlayerId("system");
        msg.setPlayerName("System");
        msg.setText(text);
        msg.setTimestamp(System.currentTimeMillis());
        return msg;
    }
}
