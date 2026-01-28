package com.sandpixel.service;

import com.sandpixel.model.game.*;
import com.sandpixel.service.game.GuessProcessor;
import com.sandpixel.service.game.PhaseManager;
import com.sandpixel.service.game.RoundManager;
import com.sandpixel.service.game.TimerManager;
import com.sandpixel.service.game.VotingManager;
import com.sandpixel.service.game.TelephoneManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class GameService {

    private final RoomService roomService;
    private final WordBankService wordBankService;
    private final BroadcastService broadcastService;
    private final TimerManager timerManager;
    private final PhaseManager phaseManager;
    private final RoundManager roundManager;
    private final GuessProcessor guessProcessor;
    private final VotingManager votingManager;
    private final TelephoneManager telephoneManager;

    public void startGame(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        if (room.getPlayerCount() < 2) {
            log.warn("Cannot start game with fewer than 2 players");
            return;
        }

        GameState state = room.getGameState();
        if (!phaseManager.validateAndTransition(state, GamePhase.COUNTDOWN)) {
            return;
        }
        timerManager.notifyPhaseChange(roomId, GamePhase.COUNTDOWN);

        // Send countdown starting at 3, wait 4 seconds for 3-2-1-Draw! sequence
        broadcastService.broadcastToRoom(roomId, GameEvent.countdown(3));

        timerManager.scheduleTask(roomId, GamePhase.COUNTDOWN,
            () -> startNextRound(roomId), 4);
    }

    public void startNextRound(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        if (roundManager.isGameOver(roomId)) {
            roundManager.endGame(roomId);
            // Schedule voting phase after showing game over results
            timerManager.scheduleTask(roomId, () -> votingManager.startVotingPhase(roomId), 8);
            return;
        }

        // Check if this is telephone mode
        if (room.getSettings().getGameMode() == GameMode.TELEPHONE) {
            telephoneManager.startTelephoneRound(roomId);
            return;
        }

        if (!roundManager.startNextRound(roomId)) {
            return;
        }

        timerManager.scheduleTask(roomId, GamePhase.WORD_SELECTION,
            () -> autoSelectWord(roomId), 10);
    }

    private void autoSelectWord(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();
        if (state.getPhase() != GamePhase.WORD_SELECTION) return;

        selectWord(roomId, state.getCurrentDrawerSessionId(), 0);
    }

    public void selectWord(String roomId, String sessionId, int wordIndex) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();

        // Allow any drawer to select the word
        if (!state.isDrawer(sessionId)) {
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
        timerManager.notifyPhaseChange(roomId, GamePhase.DRAWING);

        log.info("Word selected: roomId={}, word={}", roomId, selectedWord);

        timerManager.cancelTimer(roomId);

        broadcastService.broadcastToRoom(roomId, GameEvent.drawingPhase(
            room.getSettings().getDrawTime(),
            state.getWordLength(),
            state.getWordHint()
        ));

        // Send word to all drawers
        for (String drawerSessionId : state.getCurrentDrawerSessionIds()) {
            broadcastService.sendToPlayer(drawerSessionId, GameEvent.wordSelected(selectedWord));
        }

        timerManager.scheduleTask(roomId, GamePhase.DRAWING,
            () -> timeoutDrawing(roomId),
            room.getSettings().getDrawTime());
    }

    private void timeoutDrawing(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();
        if (state.getPhase() != GamePhase.DRAWING) return;

        submitDrawing(roomId, state.getCurrentDrawerSessionId());
    }

    public void submitDrawing(String roomId, String sessionId) {
        log.info("submitDrawing: roomId={}, sessionId={}", roomId, sessionId);

        Room room = roomService.getRoom(roomId);
        if (room == null) {
            log.warn("submitDrawing: room not found roomId={}", roomId);
            return;
        }

        GameState state = room.getGameState();
        log.info("submitDrawing: drawerSessionIds={}, currentPhase={}",
            state.getCurrentDrawerSessionIds(), state.getPhase());

        // Allow any drawer to submit the drawing
        if (!state.isDrawer(sessionId)) {
            log.warn("submitDrawing: non-drawer tried to submit. sessionId={}, drawerSessionIds={}",
                sessionId, state.getCurrentDrawerSessionIds());
            return;
        }

        if (state.getPhase() != GamePhase.DRAWING) {
            log.warn("submitDrawing: wrong phase {} roomId={}", state.getPhase(), roomId);
            return;
        }

        timerManager.cancelTimer(roomId);
        state.startReveal();
        timerManager.notifyPhaseChange(roomId, GamePhase.REVEAL);

        int revealTime = room.getSettings().getRevealTime();
        log.info("Drawing submitted, starting reveal: roomId={}, revealTime={}s", roomId, revealTime);

        // Just send the word - clients already have the drawing from real-time strokes
        broadcastService.broadcastToRoom(roomId, GameEvent.revealPhase(state.getCurrentWord()));

        timerManager.scheduleTask(roomId, GamePhase.REVEAL,
            () -> endRound(roomId),
            revealTime);
    }

    public void processGuess(String roomId, String sessionId, String guess) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        if (!guessProcessor.canPlayerGuess(room, sessionId)) {
            return;
        }

        Player player = room.getPlayer(sessionId);
        GuessProcessor.GuessResult result = guessProcessor.processGuess(room, player, guess);

        if (result.getType() == GuessProcessor.GuessResultType.CORRECT) {
            if (guessProcessor.allPlayersGuessed(room)) {
                timerManager.cancelTimer(roomId);
                timerManager.scheduleTask(roomId, () -> endRound(roomId), 2);
            }
        }
    }

    private void endRound(String roomId) {
        log.info("endRound called: roomId={}", roomId);
        roundManager.endRound(roomId);
        log.info("Scheduling next round in 3 seconds: roomId={}", roomId);
        timerManager.scheduleTask(roomId, GamePhase.RESULTS,
            () -> startNextRound(roomId), 3);
    }

    public void handlePlayerDisconnect(String roomId, String sessionId) {
        // Disabled for now - WebSocket reconnections trigger false disconnects
        // TODO: Add delay before triggering drawer disconnect to allow for reconnection
        // roundManager.handleDrawerDisconnect(roomId, sessionId);
        log.debug("Player disconnect ignored (reconnection expected): roomId={}, sessionId={}", roomId, sessionId);
    }
}
