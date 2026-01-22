package com.sandpixel.service.game;

import com.sandpixel.model.game.*;
import com.sandpixel.service.BroadcastService;
import com.sandpixel.service.ScoringService;
import com.sandpixel.service.validation.GuessValidator;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class GuessProcessor {

    private final ScoringService scoringService;
    private final GuessValidator guessValidator;
    private final BroadcastService broadcastService;

    @Getter
    public enum GuessResultType {
        CORRECT,
        CLOSE,
        WRONG
    }

    @Getter
    public static class GuessResult {
        private final GuessResultType type;
        private final int points;
        private final String message;

        public GuessResult(GuessResultType type, int points, String message) {
            this.type = type;
            this.points = points;
            this.message = message;
        }
    }

    public GuessResult processGuess(Room room, Player player, String guess) {
        GameState state = room.getGameState();
        String word = state.getCurrentWord();

        if (word == null) {
            return new GuessResult(GuessResultType.WRONG, 0, null);
        }

        if (guessValidator.isCorrectGuess(guess, word)) {
            boolean isFirst = state.getCorrectGuessCount() == 0;
            int totalTime = state.getPhase() == GamePhase.DRAWING
                ? room.getSettings().getDrawTime()
                : room.getSettings().getRevealTime();

            int points = scoringService.calculateGuesserPoints(
                state.getPhaseStartTime(), totalTime, isFirst);

            player.addScore(points);
            state.addCorrectGuesser(player.getId());

            log.info("Correct guess: roomId={}, player={}, points={}",
                room.getId(), player.getName(), points);

            broadcastService.broadcastToRoom(room.getId(), GameEvent.correctGuess(
                player, points, state.getCorrectGuessCount()));

            return new GuessResult(GuessResultType.CORRECT, points,
                player.getName() + " guessed correctly!");

        } else if (guessValidator.isCloseGuess(guess, word)) {
            broadcastService.sendToPlayer(player.getSessionId(),
                GameEvent.closeGuess(player.getId()));

            return new GuessResult(GuessResultType.CLOSE, 0, "Close guess!");

        } else {
            // Wrong guess - show in chat
            ChatMessage chatMsg = new ChatMessage();
            chatMsg.setPlayerId(player.getId());
            chatMsg.setPlayerName(player.getName());
            chatMsg.setText(guess);
            chatMsg.setTimestamp(System.currentTimeMillis());

            broadcastService.broadcastToRoom(room.getId(), GameEvent.chat(chatMsg));

            return new GuessResult(GuessResultType.WRONG, 0, null);
        }
    }

    public boolean canPlayerGuess(Room room, String sessionId) {
        GameState state = room.getGameState();
        Player player = room.getPlayer(sessionId);

        if (player == null) return false;

        // Can't guess if you're the drawer
        if (sessionId.equals(state.getCurrentDrawerSessionId())) {
            return false;
        }

        // Can only guess during drawing or reveal phases
        if (state.getPhase() != GamePhase.DRAWING && state.getPhase() != GamePhase.REVEAL) {
            return false;
        }

        // Already guessed correctly
        if (state.hasGuessedCorrectly(player.getId())) {
            return false;
        }

        return true;
    }

    public boolean allPlayersGuessed(Room room) {
        GameState state = room.getGameState();
        int guessersCount = room.getPlayerCount() - 1; // exclude drawer
        return state.getCorrectGuessCount() >= guessersCount;
    }
}
