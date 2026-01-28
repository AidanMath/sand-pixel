package com.sandpixel.service;

import com.sandpixel.model.game.GamePhase;
import com.sandpixel.model.game.GameState;
import com.sandpixel.model.game.Player;
import com.sandpixel.model.game.Room;
import com.sandpixel.model.game.RoomSettings;
import com.sandpixel.service.validation.GuessValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

@DisplayName("ScoringService")
class ScoringServiceTest {

    private ScoringService scoringService;
    private GuessValidator guessValidator;

    @BeforeEach
    void setUp() {
        guessValidator = new GuessValidator();
        scoringService = new ScoringService(guessValidator);
    }

    @Nested
    @DisplayName("getStreakMultiplier")
    class GetStreakMultiplier {

        @Test
        @DisplayName("returns 1.0 for streak of 0 or 1")
        void noStreakMultiplier() {
            assertThat(scoringService.getStreakMultiplier(0)).isEqualTo(1.0);
            assertThat(scoringService.getStreakMultiplier(1)).isEqualTo(1.0);
        }

        @Test
        @DisplayName("returns 1.25 for streak of 2")
        void streak2Multiplier() {
            assertThat(scoringService.getStreakMultiplier(2)).isEqualTo(1.25);
        }

        @Test
        @DisplayName("returns 1.5 for streak of 3")
        void streak3Multiplier() {
            assertThat(scoringService.getStreakMultiplier(3)).isEqualTo(1.5);
        }

        @Test
        @DisplayName("returns 2.0 for streak of 4 or more")
        void streak4PlusMultiplier() {
            assertThat(scoringService.getStreakMultiplier(4)).isEqualTo(2.0);
            assertThat(scoringService.getStreakMultiplier(5)).isEqualTo(2.0);
            assertThat(scoringService.getStreakMultiplier(10)).isEqualTo(2.0);
            assertThat(scoringService.getStreakMultiplier(100)).isEqualTo(2.0);
        }

        @Test
        @DisplayName("handles negative streak gracefully")
        void negativeStreak() {
            assertThat(scoringService.getStreakMultiplier(-1)).isEqualTo(1.0);
            assertThat(scoringService.getStreakMultiplier(-10)).isEqualTo(1.0);
        }
    }

    @Nested
    @DisplayName("calculateDrawerPoints")
    class CalculateDrawerPoints {

        @Test
        @DisplayName("returns 0 when no correct guessers")
        void noCorrectGuessers() {
            assertThat(scoringService.calculateDrawerPoints(0, 5)).isEqualTo(0);
        }

        @Test
        @DisplayName("returns 0 when only 1 player (drawer only)")
        void onlyDrawer() {
            assertThat(scoringService.calculateDrawerPoints(0, 1)).isEqualTo(0);
            assertThat(scoringService.calculateDrawerPoints(1, 1)).isEqualTo(0);
        }

        @Test
        @DisplayName("returns max points (300) when all non-drawers guess correctly")
        void allCorrect() {
            // 4 correct guessers out of 5 total (1 drawer)
            assertThat(scoringService.calculateDrawerPoints(4, 5)).isEqualTo(300);
            // 9 correct guessers out of 10 total (1 drawer)
            assertThat(scoringService.calculateDrawerPoints(9, 10)).isEqualTo(300);
        }

        @Test
        @DisplayName("returns proportional points based on correct ratio")
        void proportionalPoints() {
            // 2 correct out of 5 total (4 non-drawers) = 50% = 150 points
            assertThat(scoringService.calculateDrawerPoints(2, 5)).isEqualTo(150);

            // 1 correct out of 5 total (4 non-drawers) = 25% = 75 points
            assertThat(scoringService.calculateDrawerPoints(1, 5)).isEqualTo(75);

            // 3 correct out of 5 total (4 non-drawers) = 75% = 225 points
            assertThat(scoringService.calculateDrawerPoints(3, 5)).isEqualTo(225);
        }

        @Test
        @DisplayName("returns correct points for 2-player game")
        void twoPlayerGame() {
            // 1 correct guesser out of 2 total (1 non-drawer) = 100% = 300 points
            assertThat(scoringService.calculateDrawerPoints(1, 2)).isEqualTo(300);

            // 0 correct guessers
            assertThat(scoringService.calculateDrawerPoints(0, 2)).isEqualTo(0);
        }

        @ParameterizedTest
        @CsvSource({
            "1, 3, 150",   // 1 of 2 non-drawers = 50%
            "2, 4, 200",   // 2 of 3 non-drawers = 67%
            "5, 8, 214",   // 5 of 7 non-drawers = 71%
            "7, 8, 300",   // 7 of 7 non-drawers = 100%
        })
        @DisplayName("calculates points correctly for various scenarios")
        void variousScenarios(int correctGuessers, int totalPlayers, int expectedPoints) {
            assertThat(scoringService.calculateDrawerPoints(correctGuessers, totalPlayers))
                .isEqualTo(expectedPoints);
        }
    }

    @Nested
    @DisplayName("calculateGuesserPoints")
    class CalculateGuesserPoints {

        // Note: These tests use Instant.now() internally, so we use phaseStartTime
        // set to specific times in the past to create deterministic test conditions

        @Test
        @DisplayName("returns max points (500) for instant guess")
        void instantGuess() {
            // Start time is now, so elapsed = 0
            Instant startTime = Instant.now();
            int totalTime = 60;

            int points = scoringService.calculateGuesserPoints(startTime, totalTime, false);

            // Should be very close to 500 (within a few points due to test execution time)
            assertThat(points).isBetween(495, 500);
        }

        @Test
        @DisplayName("returns max points + bonus (600) for first instant guess")
        void firstInstantGuess() {
            Instant startTime = Instant.now();
            int totalTime = 60;

            int points = scoringService.calculateGuesserPoints(startTime, totalTime, true);

            // Should be ~500 + 100 bonus
            assertThat(points).isBetween(595, 600);
        }

        @Test
        @DisplayName("returns minimum 50 points for very late guess")
        void veryLateGuess() {
            // Start time was 2 minutes ago for a 60-second round (way over)
            Instant startTime = Instant.now().minusSeconds(120);
            int totalTime = 60;

            int points = scoringService.calculateGuesserPoints(startTime, totalTime, false);

            assertThat(points).isEqualTo(50); // Minimum points
        }

        @Test
        @DisplayName("returns first guesser bonus (100) for very late guess")
        void veryLateFirstGuess() {
            // When time is up (elapsed > totalTime), base points = 0
            // First guesser bonus adds 100, then Math.max(100, 50) = 100
            Instant startTime = Instant.now().minusSeconds(120);
            int totalTime = 60;

            int points = scoringService.calculateGuesserPoints(startTime, totalTime, true);

            assertThat(points).isEqualTo(100); // 0 base + 100 bonus = 100 (> min 50)
        }

        @Test
        @DisplayName("returns approximately half points at half time")
        void halfTimeGuess() {
            // 30 seconds ago for a 60-second round
            Instant startTime = Instant.now().minusSeconds(30);
            int totalTime = 60;

            int points = scoringService.calculateGuesserPoints(startTime, totalTime, false);

            // Should be around 250 (50% of 500)
            assertThat(points).isBetween(240, 260);
        }
    }

    @Nested
    @DisplayName("calculateGuesserPointsWithStreak")
    class CalculateGuesserPointsWithStreak {

        @Test
        @DisplayName("returns base points with no multiplier for first correct guess")
        void firstCorrectGuess() {
            Instant startTime = Instant.now();
            int totalTime = 60;
            int currentStreak = 0; // No streak yet

            double[] result = scoringService.calculateGuesserPointsWithStreak(startTime, totalTime, false, currentStreak);

            // [basePoints, multipliedPoints, multiplier]
            assertThat(result[2]).isEqualTo(1.0); // No multiplier for streak of 1
            assertThat(result[0]).isEqualTo(result[1]); // Base equals multiplied
        }

        @Test
        @DisplayName("applies 1.25x multiplier for second consecutive correct guess")
        void secondCorrectGuess() {
            Instant startTime = Instant.now();
            int totalTime = 60;
            int currentStreak = 1; // Will become streak of 2

            double[] result = scoringService.calculateGuesserPointsWithStreak(startTime, totalTime, false, currentStreak);

            assertThat(result[2]).isEqualTo(1.25);
            assertThat(result[1]).isCloseTo(result[0] * 1.25, within(1.0));
        }

        @Test
        @DisplayName("applies 1.5x multiplier for third consecutive correct guess")
        void thirdCorrectGuess() {
            Instant startTime = Instant.now();
            int totalTime = 60;
            int currentStreak = 2; // Will become streak of 3

            double[] result = scoringService.calculateGuesserPointsWithStreak(startTime, totalTime, false, currentStreak);

            assertThat(result[2]).isEqualTo(1.5);
        }

        @Test
        @DisplayName("applies 2.0x multiplier for fourth+ consecutive correct guess")
        void fourthPlusCorrectGuess() {
            Instant startTime = Instant.now();
            int totalTime = 60;

            // Streak of 3 becoming 4
            double[] result4 = scoringService.calculateGuesserPointsWithStreak(startTime, totalTime, false, 3);
            assertThat(result4[2]).isEqualTo(2.0);

            // Streak of 10 becoming 11
            double[] result11 = scoringService.calculateGuesserPointsWithStreak(startTime, totalTime, false, 10);
            assertThat(result11[2]).isEqualTo(2.0);
        }

        @Test
        @DisplayName("includes first guesser bonus in calculations")
        void firstGuesserBonus() {
            Instant startTime = Instant.now();
            int totalTime = 60;

            double[] withBonus = scoringService.calculateGuesserPointsWithStreak(startTime, totalTime, true, 0);
            double[] withoutBonus = scoringService.calculateGuesserPointsWithStreak(startTime, totalTime, false, 0);

            // First guesser should have 100 more base points
            assertThat(withBonus[0] - withoutBonus[0]).isBetween(95.0, 105.0);
        }
    }

    @Nested
    @DisplayName("getRoundScores")
    class GetRoundScores {

        @Test
        @DisplayName("returns players sorted by score descending")
        void sortedByScore() {
            Room room = createTestRoom();
            Player p1 = room.getPlayer("session1");
            Player p2 = room.getPlayer("session2");
            Player p3 = room.getPlayer("session3");

            p1.setScore(100);
            p2.setScore(300);
            p3.setScore(200);

            List<Map<String, Object>> scores = scoringService.getRoundScores(room);

            assertThat(scores).hasSize(3);
            // Verify order by score
            assertThat((Integer) scores.get(0).get("score")).isEqualTo(300);
            assertThat((Integer) scores.get(1).get("score")).isEqualTo(200);
            assertThat((Integer) scores.get(2).get("score")).isEqualTo(100);
        }

        @Test
        @DisplayName("includes all required fields")
        void includesRequiredFields() {
            Room room = createTestRoom();
            Player p1 = room.getPlayer("session1");
            p1.setScore(100);
            p1.setCurrentStreak(2);
            room.getGameState().setCurrentDrawerId(p1.getId());

            List<Map<String, Object>> scores = scoringService.getRoundScores(room);
            Map<String, Object> p1Score = scores.stream()
                .filter(s -> p1.getId().equals(s.get("playerId")))
                .findFirst()
                .orElseThrow();

            assertThat(p1Score).containsKeys(
                "playerId", "playerName", "score", "isDrawer",
                "guessedCorrectly", "currentStreak"
            );
            assertThat(p1Score.get("score")).isEqualTo(100);
            assertThat(p1Score.get("isDrawer")).isEqualTo(true);
            assertThat(p1Score.get("currentStreak")).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("getFinalScores")
    class GetFinalScores {

        @Test
        @DisplayName("returns players sorted by score descending")
        void sortedByScore() {
            Room room = createTestRoom();
            room.getPlayer("session1").setScore(500);
            room.getPlayer("session2").setScore(800);
            room.getPlayer("session3").setScore(650);

            List<Map<String, Object>> scores = scoringService.getFinalScores(room);

            // Verify order by score
            assertThat((Integer) scores.get(0).get("score")).isEqualTo(800);
            assertThat((Integer) scores.get(1).get("score")).isEqualTo(650);
            assertThat((Integer) scores.get(2).get("score")).isEqualTo(500);
        }

        @Test
        @DisplayName("includes maxStreak for each player")
        void includesMaxStreak() {
            Room room = createTestRoom();
            Player p1 = room.getPlayer("session1");
            p1.setMaxStreak(5);
            room.getPlayer("session2").setMaxStreak(3);

            List<Map<String, Object>> scores = scoringService.getFinalScores(room);

            Map<String, Object> p1Score = scores.stream()
                .filter(s -> p1.getId().equals(s.get("playerId")))
                .findFirst()
                .orElseThrow();

            assertThat(p1Score.get("maxStreak")).isEqualTo(5);
        }
    }

    // Helper method to create a test room with players
    private Room createTestRoom() {
        RoomSettings settings = new RoomSettings();
        Room room = new Room(settings);

        // Add players using room.addPlayer(name, sessionId) - returns Player
        Player p1 = room.addPlayer("Player One", "session1");
        Player p2 = room.addPlayer("Player Two", "session2");
        Player p3 = room.addPlayer("Player Three", "session3");

        // Game state is auto-initialized by Room constructor
        room.getGameState().setPhase(GamePhase.DRAWING);

        return room;
    }

    // Helper to get player by session ID
    private Player getPlayerBySession(Room room, String sessionId) {
        return room.getPlayer(sessionId);
    }
}
