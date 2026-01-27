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
        RoomSettings settings = room.getSettings();

        // Check if game is over
        if (state.getCurrentRound() >= state.getTotalRounds()) {
            return false;
        }

        // Get word options
        String[] wordOptions = wordBankService.getWordOptions(3);

        if (settings.getGameMode() == GameMode.COLLABORATIVE) {
            return startCollaborativeRound(room, state, settings, wordOptions);
        } else {
            return startClassicRound(room, state, wordOptions);
        }
    }

    private boolean startClassicRound(Room room, GameState state, String[] wordOptions) {
        // Get next drawer
        String nextDrawerSessionId = room.getNextDrawerId();
        if (nextDrawerSessionId == null) return false;

        Player drawer = room.getPlayer(nextDrawerSessionId);
        if (drawer == null) return false;

        // Start the round
        state.startNewRound(nextDrawerSessionId, drawer.getId(), wordOptions);
        timerManager.notifyPhaseChange(room.getId(), GamePhase.WORD_SELECTION);

        log.info("Round {} started: roomId={}, drawer={} ({})",
            state.getCurrentRound(), room.getId(), drawer.getName(), drawer.getId());

        // Broadcast round start to all
        broadcastService.broadcastToRoom(room.getId(), GameEvent.roundStart(
            state.getCurrentRound(),
            drawer.getId(),
            0,
            ""
        ));

        // Send word options to drawer only
        broadcastService.sendToPlayer(nextDrawerSessionId, GameEvent.wordOptions(wordOptions));

        return true;
    }

    private boolean startCollaborativeRound(Room room, GameState state, RoomSettings settings, String[] wordOptions) {
        int drawerCount = Math.min(settings.getCollaborativeDrawerCount(), room.getPlayerCount());
        if (drawerCount < 2) drawerCount = 2;

        java.util.Set<String> drawerSessionIds = new java.util.HashSet<>();
        java.util.Set<String> drawerPlayerIds = new java.util.HashSet<>();
        java.util.List<Player> selectedDrawers = new java.util.ArrayList<>();

        // Select multiple drawers
        for (int i = 0; i < drawerCount; i++) {
            String nextDrawerSessionId = room.getNextDrawerId();
            if (nextDrawerSessionId == null) break;

            Player drawer = room.getPlayer(nextDrawerSessionId);
            if (drawer != null && !drawerSessionIds.contains(nextDrawerSessionId)) {
                drawerSessionIds.add(nextDrawerSessionId);
                drawerPlayerIds.add(drawer.getId());
                selectedDrawers.add(drawer);
            }
        }

        if (drawerSessionIds.size() < 2) {
            log.warn("Not enough players for collaborative mode, falling back to classic");
            return startClassicRound(room, state, wordOptions);
        }

        // Start the round with multiple drawers
        state.startNewRoundCollaborative(drawerSessionIds, drawerPlayerIds, wordOptions);
        timerManager.notifyPhaseChange(room.getId(), GamePhase.WORD_SELECTION);

        String drawerNames = selectedDrawers.stream()
            .map(Player::getName)
            .collect(java.util.stream.Collectors.joining(" & "));

        log.info("Collaborative round {} started: roomId={}, drawers={}",
            state.getCurrentRound(), room.getId(), drawerNames);

        // Broadcast round start with multiple drawer IDs
        broadcastService.broadcastToRoom(room.getId(), GameEvent.roundStartCollaborative(
            state.getCurrentRound(),
            new java.util.ArrayList<>(drawerPlayerIds),
            0,
            ""
        ));

        // Send word options to all drawers
        for (String sessionId : drawerSessionIds) {
            broadcastService.sendToPlayer(sessionId, GameEvent.wordOptions(wordOptions));
        }

        return true;
    }

    public void endRound(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();
        timerManager.cancelTimer(roomId);

        // Award drawer points and save drawing for voting
        Player drawer = room.getPlayer(state.getCurrentDrawerSessionId());
        if (drawer != null) {
            // Save drawing for end-of-game voting
            if (state.getCurrentWord() != null) {
                state.saveDrawing(
                    drawer.getId(),
                    drawer.getName(),
                    state.getCurrentWord(),
                    state.getDrawingBase64()
                );
            }

            if (state.getCorrectGuessCount() > 0) {
                int drawerPoints = scoringService.calculateDrawerPoints(
                    state.getCorrectGuessCount(),
                    room.getPlayerCount()
                );
                drawer.addScore(drawerPoints);
            }
        }

        // Reset streaks for players who didn't guess correctly this round
        // The drawer doesn't lose streak (they couldn't guess)
        for (Player player : room.getPlayerList()) {
            if (player.getSessionId().equals(state.getCurrentDrawerSessionId())) {
                // Drawer keeps their streak
                continue;
            }
            if (!state.hasGuessedCorrectly(player.getId())) {
                player.resetStreak();
            }
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
