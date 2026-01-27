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

    // Streak multipliers
    private static final double STREAK_2_MULTIPLIER = 1.25;
    private static final double STREAK_3_MULTIPLIER = 1.5;
    private static final double STREAK_4_PLUS_MULTIPLIER = 2.0;

    public int calculateGuesserPoints(Instant phaseStartTime, int totalTime, boolean isFirstGuesser) {
        long elapsed = Duration.between(phaseStartTime, Instant.now()).toSeconds();
        double timeRatio = 1.0 - Math.min((double) elapsed / totalTime, 1.0);

        int points = (int) (MAX_GUESSER_POINTS * timeRatio);

        if (isFirstGuesser) {
            points += FIRST_GUESS_BONUS;
        }

        return Math.max(points, 50); // Minimum 50 points for correct guess
    }

    /**
     * Calculate guesser points with streak multiplier applied.
     * @param phaseStartTime Start time of the current phase
     * @param totalTime Total time for the phase
     * @param isFirstGuesser Whether this is the first correct guess
     * @param currentStreak The player's current streak (before incrementing)
     * @return Array of [basePoints, multipliedPoints, multiplier]
     */
    public double[] calculateGuesserPointsWithStreak(Instant phaseStartTime, int totalTime, boolean isFirstGuesser, int currentStreak) {
        int basePoints = calculateGuesserPoints(phaseStartTime, totalTime, isFirstGuesser);

        // Streak is about to be incremented, so newStreak = currentStreak + 1
        int newStreak = currentStreak + 1;
        double multiplier = getStreakMultiplier(newStreak);
        int multipliedPoints = (int) Math.round(basePoints * multiplier);

        return new double[] { basePoints, multipliedPoints, multiplier };
    }

    public double getStreakMultiplier(int streak) {
        if (streak >= 4) {
            return STREAK_4_PLUS_MULTIPLIER;
        } else if (streak == 3) {
            return STREAK_3_MULTIPLIER;
        } else if (streak == 2) {
            return STREAK_2_MULTIPLIER;
        }
        return 1.0;
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
                scoreEntry.put("currentStreak", p.getCurrentStreak());
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
                scoreEntry.put("maxStreak", p.getMaxStreak());
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
