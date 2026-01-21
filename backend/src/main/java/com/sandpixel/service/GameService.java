package com.sandpixel.service;

import com.sandpixel.controller.GameWebSocketController;
import com.sandpixel.model.game.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class GameService {

    private final RoomService roomService;
    private final WordBankService wordBankService;
    private final ScoringService scoringService;
    private final TaskScheduler taskScheduler;

    // Store scheduled tasks per room for cancellation
    private final Map<String, ScheduledFuture<?>> roomTimers = new ConcurrentHashMap<>();

    // Reference to controller - will be set via setter injection to avoid circular dependency
    private GameWebSocketController wsController;

    public void setWebSocketController(GameWebSocketController controller) {
        this.wsController = controller;
    }

    public void startGame(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        if (room.getPlayerCount() < 2) {
            log.warn("Cannot start game with fewer than 2 players");
            return;
        }

        GameState state = room.getGameState();
        state.setPhase(GamePhase.COUNTDOWN);

        // Broadcast countdown
        wsController.broadcastToRoom(roomId, GameEvent.countdown(3));

        // Schedule round start after countdown
        scheduleTask(roomId, () -> startNextRound(roomId), 3);
    }

    public void startNextRound(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();

        // Check if game is over
        if (state.getCurrentRound() >= state.getTotalRounds()) {
            endGame(roomId);
            return;
        }

        // Get next drawer
        String nextDrawerId = room.getNextDrawerId();
        if (nextDrawerId == null) return;

        // Get word options
        String[] wordOptions = wordBankService.getWordOptions(
            room.getSettings().getDifficulty(), 3);

        state.startNewRound(nextDrawerId, wordOptions);

        log.info("Round {} started: roomId={}, drawer={}",
            state.getCurrentRound(), roomId, nextDrawerId);

        // Broadcast round start to all
        Player drawer = room.getPlayer(nextDrawerId);
        wsController.broadcastToRoom(roomId, GameEvent.roundStart(
            state.getCurrentRound(),
            drawer.getId(),
            0, // word length not known yet
            ""  // hint not known yet
        ));

        // Send word options to drawer only
        wsController.sendToPlayer(nextDrawerId, GameEvent.wordOptions(wordOptions));

        // Schedule auto-select if drawer doesn't choose
        scheduleTask(roomId, () -> autoSelectWord(roomId), 15);
    }

    private void autoSelectWord(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();
        if (state.getPhase() != GamePhase.WORD_SELECTION) return;

        // Auto-select first word
        selectWord(roomId, state.getCurrentDrawerId(), 0);
    }

    public void selectWord(String roomId, String sessionId, int wordIndex) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();

        if (!sessionId.equals(state.getCurrentDrawerId())) {
            log.warn("Non-drawer tried to select word");
            return;
        }

        if (state.getPhase() != GamePhase.WORD_SELECTION) {
            return;
        }

        String[] options = state.getWordOptions();
        if (options == null || wordIndex < 0 || wordIndex >= options.length) {
            wordIndex = 0;
        }

        String selectedWord = options[wordIndex];
        state.setWordSelected(selectedWord);
        wordBankService.markWordUsed(selectedWord);

        log.info("Word selected: roomId={}, word={}", roomId, selectedWord);

        // Cancel word selection timer
        cancelTimer(roomId);

        // Broadcast drawing phase start
        wsController.broadcastToRoom(roomId, GameEvent.drawingPhase(
            room.getSettings().getDrawTime()));

        // Send word hint to guessers
        wsController.broadcastToRoom(roomId, GameEvent.roundStart(
            state.getCurrentRound(),
            room.getPlayer(state.getCurrentDrawerId()).getId(),
            state.getWordLength(),
            state.getWordHint()
        ));

        // Schedule drawing timeout
        scheduleTask(roomId, () -> timeoutDrawing(roomId),
            room.getSettings().getDrawTime());
    }

    private void timeoutDrawing(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();
        if (state.getPhase() != GamePhase.DRAWING) return;

        // Force submit with empty drawing (drawer didn't submit)
        submitDrawing(roomId, state.getCurrentDrawerId(), null);
    }

    public void submitDrawing(String roomId, String sessionId, String drawingBase64) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();

        if (!sessionId.equals(state.getCurrentDrawerId())) {
            return;
        }

        if (state.getPhase() != GamePhase.DRAWING) {
            return;
        }

        cancelTimer(roomId);

        state.startReveal(drawingBase64);

        log.info("Drawing submitted, starting reveal: roomId={}", roomId);

        // Broadcast reveal phase with drawing
        wsController.broadcastToRoom(roomId, GameEvent.revealPhase(
            drawingBase64,
            state.getCurrentWord()
        ));

        // Schedule reveal timeout
        scheduleTask(roomId, () -> endRound(roomId),
            room.getSettings().getRevealTime());
    }

    public void processGuess(String roomId, String sessionId, String guess) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();
        Player player = room.getPlayer(sessionId);

        if (player == null) return;

        // Can't guess if you're the drawer
        if (sessionId.equals(state.getCurrentDrawerId())) {
            return;
        }

        // Can only guess during drawing or reveal phases
        if (state.getPhase() != GamePhase.DRAWING && state.getPhase() != GamePhase.REVEAL) {
            return;
        }

        // Already guessed correctly
        if (state.hasGuessedCorrectly(player.getId())) {
            return;
        }

        String word = state.getCurrentWord();
        if (word == null) return;

        if (scoringService.isCorrectGuess(guess, word)) {
            // Correct guess!
            boolean isFirst = state.getCorrectGuessCount() == 0;
            int totalTime = state.getPhase() == GamePhase.DRAWING
                ? room.getSettings().getDrawTime()
                : room.getSettings().getRevealTime();

            int points = scoringService.calculateGuesserPoints(
                state.getPhaseStartTime(), totalTime, isFirst);

            player.addScore(points);
            state.addCorrectGuesser(player.getId());

            log.info("Correct guess: roomId={}, player={}, points={}",
                roomId, player.getName(), points);

            wsController.broadcastToRoom(roomId, GameEvent.correctGuess(
                player, points, state.getCorrectGuessCount()));

            // Check if everyone guessed
            int guessersCount = room.getPlayerCount() - 1; // exclude drawer
            if (state.getCorrectGuessCount() >= guessersCount) {
                // Everyone guessed, end round early
                cancelTimer(roomId);
                scheduleTask(roomId, () -> endRound(roomId), 2);
            }
        } else if (scoringService.isCloseGuess(guess, word)) {
            // Close guess - notify only the guesser
            wsController.sendToPlayer(sessionId, GameEvent.closeGuess(player.getId()));
        } else {
            // Wrong guess - show in chat
            ChatMessage chatMsg = new ChatMessage();
            chatMsg.setPlayerId(player.getId());
            chatMsg.setPlayerName(player.getName());
            chatMsg.setText(guess);
            chatMsg.setTimestamp(System.currentTimeMillis());

            wsController.broadcastToRoom(roomId, GameEvent.chat(chatMsg));
        }
    }

    private void endRound(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();
        cancelTimer(roomId);

        // Award drawer points
        Player drawer = room.getPlayer(state.getCurrentDrawerId());
        if (drawer != null && state.getCorrectGuessCount() > 0) {
            int drawerPoints = scoringService.calculateDrawerPoints(
                state.getCorrectGuessCount(),
                room.getPlayerCount()
            );
            drawer.addScore(drawerPoints);
        }

        state.showResults();

        log.info("Round {} ended: roomId={}, word={}",
            state.getCurrentRound(), roomId, state.getCurrentWord());

        // Broadcast round results
        wsController.broadcastToRoom(roomId, GameEvent.roundEnd(
            state.getCurrentWord(),
            scoringService.getRoundScores(room)
        ));

        // Schedule next round or game end
        scheduleTask(roomId, () -> startNextRound(roomId), 5);
    }

    private void endGame(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();
        state.endGame();

        log.info("Game ended: roomId={}", roomId);

        wsController.broadcastToRoom(roomId, GameEvent.gameOver(
            scoringService.getFinalScores(room)
        ));

        // Reset room for new game after delay
        scheduleTask(roomId, () -> {
            Room r = roomService.getRoom(roomId);
            if (r != null) {
                r.resetForNewGame();
                wsController.broadcastToRoom(roomId, GameEvent.roomState(r));
            }
        }, 10);
    }

    private void scheduleTask(String roomId, Runnable task, int delaySeconds) {
        cancelTimer(roomId);
        ScheduledFuture<?> future = taskScheduler.schedule(
            task,
            Instant.now().plusSeconds(delaySeconds)
        );
        roomTimers.put(roomId, future);
    }

    private void cancelTimer(String roomId) {
        ScheduledFuture<?> existing = roomTimers.remove(roomId);
        if (existing != null) {
            existing.cancel(false);
        }
    }
}
