package com.sandpixel.service.game;

import com.sandpixel.model.game.*;
import com.sandpixel.service.BroadcastService;
import com.sandpixel.service.RoomService;
import com.sandpixel.service.WordBankService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TelephoneManager {

    private static final int TELEPHONE_DRAW_TIME = 60;
    private static final int TELEPHONE_GUESS_TIME = 30;

    private final RoomService roomService;
    private final WordBankService wordBankService;
    private final BroadcastService broadcastService;
    private final TimerManager timerManager;

    public void startTelephoneRound(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();

        // Get a random word
        String[] words = wordBankService.getWordOptions(1);
        String word = words[0];
        wordBankService.markWordUsed(word);

        // Create player queue (shuffled)
        List<String> playerQueue = new ArrayList<>(room.getPlayers().keySet());
        Collections.shuffle(playerQueue);

        // Start the telephone chain
        state.startTelephoneChain(word, playerQueue);

        log.info("Telephone round {} started: roomId={}, word={}", state.getCurrentRound(), roomId, word);

        // Start with the first player drawing
        advanceToNextTelephonePlayer(roomId);
    }

    public void advanceToNextTelephonePlayer(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();
        TelephoneChain chain = state.getTelephoneChain();

        if (chain == null || chain.isComplete()) {
            // Chain is complete, show reveal
            startTelephoneReveal(roomId);
            return;
        }

        String nextSessionId = chain.getCurrentPlayerSessionId();
        if (nextSessionId == null) {
            startTelephoneReveal(roomId);
            return;
        }

        Player player = room.getPlayer(nextSessionId);
        if (player == null) {
            // Player disconnected, skip them
            chain.advanceToNextPlayer();
            advanceToNextTelephonePlayer(roomId);
            return;
        }

        state.setCurrentTelephonePlayer(nextSessionId, player.getId());
        TelephoneEntry.Type actionType = chain.getNextActionType();
        String prompt = chain.getCurrentPrompt();

        if (actionType == TelephoneEntry.Type.DRAW) {
            state.setPhase(GamePhase.TELEPHONE_DRAW);
            timerManager.notifyPhaseChange(roomId, GamePhase.TELEPHONE_DRAW);

            // Broadcast to room that this player is drawing
            broadcastService.broadcastToRoom(roomId, GameEvent.telephoneDraw(
                player.getId(),
                player.getName(),
                TELEPHONE_DRAW_TIME,
                chain.getRemainingPlayers()
            ));

            // Send prompt (word or previous guess) to the drawer only
            boolean isFirstDraw = chain.getEntries().isEmpty();
            broadcastService.sendToPlayer(nextSessionId, GameEvent.telephonePrompt(
                prompt,
                isFirstDraw ? "word" : "guess"
            ));

            timerManager.scheduleTask(roomId, GamePhase.TELEPHONE_DRAW,
                () -> handleTelephoneTimeout(roomId), TELEPHONE_DRAW_TIME);

        } else {
            state.setPhase(GamePhase.TELEPHONE_GUESS);
            timerManager.notifyPhaseChange(roomId, GamePhase.TELEPHONE_GUESS);

            // Broadcast to room that this player is guessing
            broadcastService.broadcastToRoom(roomId, GameEvent.telephoneGuess(
                player.getId(),
                player.getName(),
                TELEPHONE_GUESS_TIME,
                chain.getRemainingPlayers()
            ));

            // Send the drawing to the guesser
            broadcastService.sendToPlayer(nextSessionId, GameEvent.telephonePrompt(
                prompt,  // This is the base64 drawing
                "drawing"
            ));

            timerManager.scheduleTask(roomId, GamePhase.TELEPHONE_GUESS,
                () -> handleTelephoneTimeout(roomId), TELEPHONE_GUESS_TIME);
        }
    }

    public void submitTelephoneDrawing(String roomId, String sessionId, String drawingBase64) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();
        if (state.getPhase() != GamePhase.TELEPHONE_DRAW) return;
        if (!state.isCurrentTelephonePlayer(sessionId)) return;

        Player player = room.getPlayer(sessionId);
        if (player == null) return;

        TelephoneChain chain = state.getTelephoneChain();
        chain.addEntry(new TelephoneEntry(player.getId(), player.getName(), TelephoneEntry.Type.DRAW, drawingBase64));
        chain.advanceToNextPlayer();

        timerManager.cancelTimer(roomId);

        log.info("Telephone drawing submitted: roomId={}, player={}", roomId, player.getName());

        advanceToNextTelephonePlayer(roomId);
    }

    public void submitTelephoneGuess(String roomId, String sessionId, String guess) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();
        if (state.getPhase() != GamePhase.TELEPHONE_GUESS) return;
        if (!state.isCurrentTelephonePlayer(sessionId)) return;

        Player player = room.getPlayer(sessionId);
        if (player == null) return;

        TelephoneChain chain = state.getTelephoneChain();
        chain.addEntry(new TelephoneEntry(player.getId(), player.getName(), TelephoneEntry.Type.GUESS, guess));
        chain.advanceToNextPlayer();

        timerManager.cancelTimer(roomId);

        log.info("Telephone guess submitted: roomId={}, player={}, guess={}", roomId, player.getName(), guess);

        advanceToNextTelephonePlayer(roomId);
    }

    private void handleTelephoneTimeout(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();
        TelephoneChain chain = state.getTelephoneChain();
        Player currentPlayer = room.getPlayer(state.getCurrentTelephonePlayerSessionId());

        if (chain == null || currentPlayer == null) {
            startTelephoneReveal(roomId);
            return;
        }

        // Add a placeholder entry for timeout
        TelephoneEntry.Type actionType = chain.getNextActionType();
        String content = actionType == TelephoneEntry.Type.DRAW ? "" : "(timed out)";
        chain.addEntry(new TelephoneEntry(currentPlayer.getId(), currentPlayer.getName(), actionType, content));
        chain.advanceToNextPlayer();

        log.info("Telephone timeout: roomId={}, player={}", roomId, currentPlayer.getName());

        advanceToNextTelephonePlayer(roomId);
    }

    public void startTelephoneReveal(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();
        TelephoneChain chain = state.getTelephoneChain();

        state.setPhase(GamePhase.TELEPHONE_REVEAL);
        timerManager.notifyPhaseChange(roomId, GamePhase.TELEPHONE_REVEAL);

        // Convert chain entries to reveal data
        List<Map<String, Object>> chainData = new ArrayList<>();
        chainData.add(Map.of(
            "type", "word",
            "content", chain.getOriginalWord(),
            "playerId", "",
            "playerName", "Original Word"
        ));

        for (TelephoneEntry entry : chain.getEntries()) {
            chainData.add(Map.of(
                "type", entry.getType().name().toLowerCase(),
                "content", entry.getContent(),
                "playerId", entry.getPlayerId(),
                "playerName", entry.getPlayerName()
            ));
        }

        // Calculate scores based on how well the word survived
        calculateTelephoneScores(room, chain);

        log.info("Telephone reveal started: roomId={}", roomId);

        broadcastService.broadcastToRoom(roomId, GameEvent.telephoneReveal(
            chain.getOriginalWord(),
            chainData
        ));

        // Schedule transition to results after viewing the reveal
        int revealTime = 5 + (chain.getEntries().size() * 3); // 3 seconds per entry
        timerManager.scheduleTask(roomId, () -> endTelephoneRound(roomId), revealTime);
    }

    private void calculateTelephoneScores(Room room, TelephoneChain chain) {
        String originalWord = chain.getOriginalWord().toLowerCase();
        List<TelephoneEntry> entries = chain.getEntries();

        // Check if any guesses matched the original word
        for (int i = 0; i < entries.size(); i++) {
            TelephoneEntry entry = entries.get(i);
            Player player = room.getPlayerById(entry.getPlayerId());
            if (player == null) continue;

            if (entry.getType() == TelephoneEntry.Type.GUESS) {
                String guess = entry.getContent().toLowerCase().trim();
                if (guess.equals(originalWord)) {
                    // Correct guess gets bonus points
                    player.addScore(100);
                    player.incrementStreak();
                } else {
                    player.resetStreak();
                }
            } else {
                // Drawers get participation points
                player.addScore(25);
            }
        }

        // Check final guess vs original word for bonus
        TelephoneEntry lastEntry = chain.getLastEntry();
        if (lastEntry != null && lastEntry.getType() == TelephoneEntry.Type.GUESS) {
            if (lastEntry.getContent().toLowerCase().trim().equals(originalWord)) {
                // The word survived! Everyone gets bonus
                for (TelephoneEntry entry : entries) {
                    Player player = room.getPlayerById(entry.getPlayerId());
                    if (player != null) {
                        player.addScore(50);
                    }
                }
            }
        }
    }

    private void endTelephoneRound(String roomId) {
        Room room = roomService.getRoom(roomId);
        if (room == null) return;

        GameState state = room.getGameState();
        state.setPhase(GamePhase.RESULTS);
        timerManager.notifyPhaseChange(roomId, GamePhase.RESULTS);

        // Broadcast round results
        List<Map<String, Object>> scores = room.getPlayerList().stream()
            .sorted((a, b) -> b.getScore() - a.getScore())
            .map(p -> Map.<String, Object>of(
                "playerId", p.getId(),
                "playerName", p.getName(),
                "score", p.getScore(),
                "isDrawer", false,
                "guessedCorrectly", false,
                "currentStreak", p.getCurrentStreak()
            ))
            .collect(Collectors.toList());

        broadcastService.broadcastToRoom(roomId, GameEvent.roundEnd(
            state.getTelephoneChain().getOriginalWord(),
            scores
        ));

        log.info("Telephone round ended: roomId={}", roomId);
    }
}
