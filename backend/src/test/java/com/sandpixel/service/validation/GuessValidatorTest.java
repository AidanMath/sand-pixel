package com.sandpixel.service.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("GuessValidator")
class GuessValidatorTest {

    private GuessValidator validator;

    @BeforeEach
    void setUp() {
        validator = new GuessValidator();
    }

    @Nested
    @DisplayName("isCorrectGuess")
    class IsCorrectGuess {

        @Test
        @DisplayName("returns true for exact match")
        void exactMatch() {
            assertThat(validator.isCorrectGuess("apple", "apple")).isTrue();
        }

        @Test
        @DisplayName("returns true for case-insensitive match")
        void caseInsensitive() {
            assertThat(validator.isCorrectGuess("APPLE", "apple")).isTrue();
            assertThat(validator.isCorrectGuess("Apple", "APPLE")).isTrue();
            assertThat(validator.isCorrectGuess("aPpLe", "ApPlE")).isTrue();
        }

        @Test
        @DisplayName("returns true for match with whitespace")
        void handlesWhitespace() {
            assertThat(validator.isCorrectGuess("  apple  ", "apple")).isTrue();
            assertThat(validator.isCorrectGuess("apple", "  apple  ")).isFalse(); // word should not have whitespace
        }

        @Test
        @DisplayName("returns false for different words")
        void differentWords() {
            assertThat(validator.isCorrectGuess("apple", "orange")).isFalse();
            assertThat(validator.isCorrectGuess("cat", "car")).isFalse();
        }

        @Test
        @DisplayName("returns false for null inputs")
        void nullInputs() {
            assertThat(validator.isCorrectGuess(null, "apple")).isFalse();
            assertThat(validator.isCorrectGuess("apple", null)).isFalse();
            assertThat(validator.isCorrectGuess(null, null)).isFalse();
        }
    }

    @Nested
    @DisplayName("isCloseGuess")
    class IsCloseGuess {

        @Test
        @DisplayName("returns false for exact match (not close, it's correct)")
        void exactMatchIsNotClose() {
            assertThat(validator.isCloseGuess("apple", "apple")).isFalse();
            assertThat(validator.isCloseGuess("APPLE", "apple")).isFalse();
        }

        @Test
        @DisplayName("returns false for short words (3 chars or less)")
        void shortWordsRequireExact() {
            assertThat(validator.isCloseGuess("ca", "cat")).isFalse();
            assertThat(validator.isCloseGuess("ct", "cat")).isFalse();
            assertThat(validator.isCloseGuess("the", "teh")).isFalse();
        }

        @Test
        @DisplayName("returns true for one-char typo in longer words (6+ chars)")
        void oneCharTypoLongerWords() {
            // For 6+ char words, maxDistance = 2
            // "elephnt" vs "elephant" = 1 deletion = distance 1 <= 2 ✓
            assertThat(validator.isCloseGuess("elephnt", "elephant")).isTrue();
            // "elefant" vs "elephant" = ph->f = 2 changes? Actually distance should be 2 (delete p, h->f)
            assertThat(validator.isCloseGuess("eleephant", "elephant")).isTrue(); // extra e = distance 1
        }

        @Test
        @DisplayName("returns false for large differences in words")
        void largeDifferences() {
            // Very different words should not be close
            assertThat(validator.isCloseGuess("xyz", "apple")).isFalse();
            assertThat(validator.isCloseGuess("banana", "apple")).isFalse();
            assertThat(validator.isCloseGuess("completely different", "elephant")).isFalse();
        }

        @Test
        @DisplayName("returns true for up to two-char typo in longer words (6+ chars)")
        void twoCharTypoLongWords() {
            assertThat(validator.isCloseGuess("elephnt", "elephant")).isTrue();  // missing a
            assertThat(validator.isCloseGuess("elefant", "elephant")).isTrue();  // ph -> f
            assertThat(validator.isCloseGuess("eleephant", "elephant")).isTrue(); // extra e
        }

        @Test
        @DisplayName("returns false for null inputs")
        void nullInputs() {
            assertThat(validator.isCloseGuess(null, "apple")).isFalse();
            assertThat(validator.isCloseGuess("apple", null)).isFalse();
        }
    }

    @Nested
    @DisplayName("levenshteinDistance")
    class LevenshteinDistance {

        @Test
        @DisplayName("returns 0 for identical strings")
        void identicalStrings() {
            assertThat(validator.levenshteinDistance("apple", "apple")).isEqualTo(0);
            assertThat(validator.levenshteinDistance("", "")).isEqualTo(0);
        }

        @Test
        @DisplayName("returns 0 for case-insensitive identical strings")
        void caseInsensitive() {
            assertThat(validator.levenshteinDistance("Apple", "apple")).isEqualTo(0);
            assertThat(validator.levenshteinDistance("HELLO", "hello")).isEqualTo(0);
        }

        @Test
        @DisplayName("returns length of other string when one is empty")
        void emptyString() {
            assertThat(validator.levenshteinDistance("", "abc")).isEqualTo(3);
            assertThat(validator.levenshteinDistance("hello", "")).isEqualTo(5);
        }

        @Test
        @DisplayName("returns 1 for single insertion")
        void singleInsertion() {
            assertThat(validator.levenshteinDistance("apple", "appple")).isEqualTo(1);
            assertThat(validator.levenshteinDistance("cat", "cart")).isEqualTo(1);
        }

        @Test
        @DisplayName("returns 1 for single deletion")
        void singleDeletion() {
            assertThat(validator.levenshteinDistance("apple", "aple")).isEqualTo(1);
            assertThat(validator.levenshteinDistance("hello", "helo")).isEqualTo(1);
        }

        @Test
        @DisplayName("returns 1 for single substitution")
        void singleSubstitution() {
            assertThat(validator.levenshteinDistance("cat", "car")).isEqualTo(1);
            assertThat(validator.levenshteinDistance("apple", "xpple")).isEqualTo(1);
        }

        @Test
        @DisplayName("returns correct distance for multiple edits")
        void multipleEdits() {
            assertThat(validator.levenshteinDistance("kitten", "sitting")).isEqualTo(3);
            assertThat(validator.levenshteinDistance("saturday", "sunday")).isEqualTo(3);
        }

        @Test
        @DisplayName("returns MAX_VALUE for null inputs")
        void nullInputs() {
            assertThat(validator.levenshteinDistance(null, "apple")).isEqualTo(Integer.MAX_VALUE);
            assertThat(validator.levenshteinDistance("apple", null)).isEqualTo(Integer.MAX_VALUE);
            assertThat(validator.levenshteinDistance(null, null)).isEqualTo(Integer.MAX_VALUE);
        }
    }

    @Nested
    @DisplayName("isValidGuess")
    class IsValidGuess {

        @Test
        @DisplayName("returns true for normal text")
        void normalText() {
            assertThat(validator.isValidGuess("apple")).isTrue();
            assertThat(validator.isValidGuess("two words")).isTrue();
            assertThat(validator.isValidGuess("a")).isTrue();
        }

        @Test
        @DisplayName("returns true for text with leading/trailing whitespace")
        void handlesWhitespace() {
            assertThat(validator.isValidGuess("  apple  ")).isTrue();
        }

        @Test
        @DisplayName("returns false for null")
        void nullInput() {
            assertThat(validator.isValidGuess(null)).isFalse();
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {"", "   ", "\t", "\n"})
        @DisplayName("returns false for empty or whitespace-only strings")
        void emptyOrWhitespace(String input) {
            if (input != null) {
                assertThat(validator.isValidGuess(input)).isFalse();
            }
        }

        @Test
        @DisplayName("returns false for strings over 100 characters")
        void tooLong() {
            String longString = "a".repeat(101);
            assertThat(validator.isValidGuess(longString)).isFalse();
        }

        @Test
        @DisplayName("returns true for exactly 100 characters")
        void exactlyMaxLength() {
            String maxString = "a".repeat(100);
            assertThat(validator.isValidGuess(maxString)).isTrue();
        }
    }
}
