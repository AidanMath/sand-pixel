package com.sandpixel.service;

import com.sandpixel.model.game.Player;
import com.sandpixel.model.game.Room;
import com.sandpixel.service.validation.GuessValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Handles point calculation for guessers and drawers.
 * Validation logic has been extracted to GuessValidator.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ScoringService {

    private final GuessValidator guessValidator;

    private static final int MAX_GUESSER_POINTS = 500;
    private static final int FIRST_GUESS_BONUS = 100;
    private static final int MAX_DRAWER_POINTS = 300;

    public int calculateGuesserPoints(Instant phaseStartTime, int totalTime, boolean isFirstGuesser) {
        long elapsed = Duration.between(phaseStartTime, Instant.now()).toSeconds();
        double timeRatio = 1.0 - Math.min((double) elapsed / totalTime, 1.0);

        int points = (int) (MAX_GUESSER_POINTS * timeRatio);

        if (isFirstGuesser) {
            points += FIRST_GUESS_BONUS;
        }

        return Math.max(points, 50); // Minimum 50 points for correct guess
    }

    public int calculateDrawerPoints(int correctGuessers, int totalPlayers) {
        if (totalPlayers <= 1 || correctGuessers == 0) {
            return 0;
        }

        // Drawer gets points based on how many players guessed correctly
        double ratio = (double) correctGuessers / (totalPlayers - 1); // exclude drawer
        return (int) (MAX_DRAWER_POINTS * ratio);
    }

    public List<Map<String, Object>> getRoundScores(Room room) {
        return room.getPlayerList().stream()
            .sorted(Comparator.comparingInt(Player::getScore).reversed())
            .map(p -> {
                Map<String, Object> scoreEntry = new LinkedHashMap<>();
                scoreEntry.put("playerId", p.getId());
                scoreEntry.put("playerName", p.getName());
                scoreEntry.put("score", p.getScore());
                scoreEntry.put("isDrawer", p.getId().equals(room.getGameState().getCurrentDrawerId()));
                scoreEntry.put("guessedCorrectly", room.getGameState().hasGuessedCorrectly(p.getId()));
                return scoreEntry;
            })
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getFinalScores(Room room) {
        return room.getPlayerList().stream()
            .sorted(Comparator.comparingInt(Player::getScore).reversed())
            .map(p -> {
                Map<String, Object> scoreEntry = new LinkedHashMap<>();
                scoreEntry.put("playerId", p.getId());
                scoreEntry.put("playerName", p.getName());
                scoreEntry.put("score", p.getScore());
                scoreEntry.put("rank", 0); // Will be set below
                return scoreEntry;
            })
            .collect(Collectors.toList());
    }

    // Delegation methods to GuessValidator for backward compatibility
    // New code should use GuessValidator directly

    /**
     * @deprecated Use GuessValidator.levenshteinDistance instead
     */
    @Deprecated
    public int levenshteinDistance(String s1, String s2) {
        return guessValidator.levenshteinDistance(s1, s2);
    }

    /**
     * @deprecated Use GuessValidator.isCloseGuess instead
     */
    @Deprecated
    public boolean isCloseGuess(String guess, String word) {
        return guessValidator.isCloseGuess(guess, word);
    }

    /**
     * @deprecated Use GuessValidator.isCorrectGuess instead
     */
    @Deprecated
    public boolean isCorrectGuess(String guess, String word) {
        return guessValidator.isCorrectGuess(guess, word);
    }
}
