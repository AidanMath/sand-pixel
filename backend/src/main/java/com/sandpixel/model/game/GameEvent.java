package com.sandpixel.model.game;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class GameEvent {
    private String type;
    private Object payload;

    public GameEvent(String type, Object payload) {
        this.type = type;
        this.payload = payload;
    }

    // Room events
    public static GameEvent roomState(Room room) {
        return new GameEvent("ROOM_STATE", room);
    }

    public static GameEvent playerJoined(Room room, Player player) {
        return new GameEvent("PLAYER_JOINED", Map.of(
            "room", room,
            "player", player
        ));
    }

    public static GameEvent playerLeft(Room room, Player player) {
        return new GameEvent("PLAYER_LEFT", Map.of(
            "room", room,
            "player", player
        ));
    }

    // Game phase events
    public static GameEvent countdown(int seconds) {
        return new GameEvent("COUNTDOWN", Map.of("seconds", seconds));
    }

    public static GameEvent roundStart(int round, String drawerId, int wordLength, String wordHint) {
        return new GameEvent("ROUND_START", Map.of(
            "round", round,
            "drawerId", drawerId,
            "wordLength", wordLength,
            "wordHint", wordHint
        ));
    }

    public static GameEvent wordOptions(String[] words) {
        return new GameEvent("WORD_OPTIONS", Map.of("words", words));
    }

    public static GameEvent drawingPhase(int drawTime, int wordLength, String wordHint) {
        return new GameEvent("DRAWING_PHASE", Map.of(
            "drawTime", drawTime,
            "wordLength", wordLength,
            "wordHint", wordHint
        ));
    }

    public static GameEvent revealPhase(String word) {
        return new GameEvent("REVEAL_PHASE", Map.of("word", word != null ? word : ""));
    }

    public static GameEvent correctGuess(Player player, int points, int totalGuessers) {
        return new GameEvent("CORRECT_GUESS", Map.of(
            "playerId", player.getId(),
            "playerName", player.getName(),
            "points", points,
            "totalGuessers", totalGuessers
        ));
    }

    public static GameEvent closeGuess(String playerId) {
        return new GameEvent("CLOSE_GUESS", Map.of("playerId", playerId));
    }

    public static GameEvent roundEnd(String word, List<Map<String, Object>> scores) {
        return new GameEvent("ROUND_END", Map.of(
            "word", word,
            "scores", scores
        ));
    }

    public static GameEvent gameOver(List<Map<String, Object>> finalScores) {
        return new GameEvent("GAME_OVER", Map.of("finalScores", finalScores));
    }

    // Chat
    public static GameEvent chat(ChatMessage message) {
        return new GameEvent("CHAT", message);
    }

    // Utility
    public static GameEvent error(String message) {
        return new GameEvent("ERROR", Map.of("message", message));
    }

    public static GameEvent hint(String hint) {
        return new GameEvent("HINT", Map.of("hint", hint));
    }

    public static GameEvent wordSelected(String word) {
        return new GameEvent("WORD_SELECTED", Map.of("word", word));
    }
}
