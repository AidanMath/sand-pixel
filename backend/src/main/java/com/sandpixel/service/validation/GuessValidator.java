package com.sandpixel.service.validation;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Validates guesses against the target word.
 * Handles exact matching and close guess detection using Levenshtein distance.
 */
@Service
@Slf4j
public class GuessValidator {

    /**
     * Check if guess exactly matches the word (case-insensitive)
     */
    public boolean isCorrectGuess(String guess, String word) {
        if (guess == null || word == null) {
            return false;
        }
        return guess.trim().equalsIgnoreCase(word);
    }

    /**
     * Check if guess is close to the word (typo tolerance)
     * Returns true if the guess is within acceptable Levenshtein distance
     */
    public boolean isCloseGuess(String guess, String word) {
        if (guess == null || word == null) {
            return false;
        }

        guess = guess.trim().toLowerCase();
        word = word.toLowerCase();

        // Exact match is not "close", it's correct
        if (guess.equals(word)) {
            return false;
        }

        // Very short words need exact match
        if (word.length() <= 3) {
            return false;
        }

        // Allow distance proportional to word length
        int maxDistance = word.length() <= 5 ? 1 : 2;
        return levenshteinDistance(guess, word) <= maxDistance;
    }

    /**
     * Calculate Levenshtein (edit) distance between two strings.
     * Lower distance means more similar strings.
     */
    public int levenshteinDistance(String s1, String s2) {
        if (s1 == null || s2 == null) {
            return Integer.MAX_VALUE;
        }

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

    /**
     * Validate that a guess is not empty and within length limits
     */
    public boolean isValidGuess(String guess) {
        if (guess == null) {
            return false;
        }
        String trimmed = guess.trim();
        return !trimmed.isEmpty() && trimmed.length() <= 100;
    }
}
