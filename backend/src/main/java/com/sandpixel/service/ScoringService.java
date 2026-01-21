package com.sandpixel.service;

import com.sandpixel.model.game.Player;
import com.sandpixel.model.game.Room;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ScoringService {

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
                scoreEntry.put("isDrawer", p.getSessionId().equals(room.getGameState().getCurrentDrawerId()));
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

    public int levenshteinDistance(String s1, String s2) {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();

        int[] costs = new int[s2.length() + 1];
        for (int i = 0; i <= s1.length(); i++) {
            int lastValue = i;
            for (int j = 0; j <= s2.length(); j++) {
                if (i == 0) {
                    costs[j] = j;
                } else if (j > 0) {
                    int newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) {
                costs[s2.length()] = lastValue;
            }
        }
        return costs[s2.length()];
    }

    public boolean isCloseGuess(String guess, String word) {
        guess = guess.trim().toLowerCase();
        word = word.toLowerCase();

        // Exact match
        if (guess.equals(word)) {
            return false; // Not "close", it's correct
        }

        // Very short words need exact match
        if (word.length() <= 3) {
            return false;
        }

        // Allow distance proportional to word length
        int maxDistance = word.length() <= 5 ? 1 : 2;
        return levenshteinDistance(guess, word) <= maxDistance;
    }

    public boolean isCorrectGuess(String guess, String word) {
        return guess.trim().equalsIgnoreCase(word);
    }
}
