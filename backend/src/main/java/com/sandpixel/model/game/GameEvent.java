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
            "drawerIds", List.of(drawerId),
            "wordLength", wordLength,
            "wordHint", wordHint
        ));
    }

    public static GameEvent roundStartCollaborative(int round, List<String> drawerIds, int wordLength, String wordHint) {
        return new GameEvent("ROUND_START", Map.of(
            "round", round,
            "drawerId", drawerIds.isEmpty() ? "" : drawerIds.get(0),
            "drawerIds", drawerIds,
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
        return correctGuess(player, points, totalGuessers, 0, 1.0);
    }

    public static GameEvent correctGuess(Player player, int points, int totalGuessers, int streak, double multiplier) {
        return new GameEvent("CORRECT_GUESS", Map.of(
            "playerId", player.getId(),
            "playerName", player.getName(),
            "points", points,
            "totalGuessers", totalGuessers,
            "streak", streak,
            "multiplier", multiplier
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

    // Reaction
    public static GameEvent reaction(Reaction reaction) {
        return new GameEvent("REACTION", Map.of(
            "playerId", reaction.getPlayerId(),
            "playerName", reaction.getPlayerName(),
            "emoji", reaction.getEmoji(),
            "timestamp", reaction.getTimestamp()
        ));
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

    // Voting events
    public static GameEvent votingStart(List<DrawingEntry> drawings, int votingTime) {
        return new GameEvent("VOTING_START", Map.of(
            "drawings", drawings.stream().map(d -> Map.of(
                "drawerId", d.getDrawerId(),
                "drawerName", d.getDrawerName(),
                "word", d.getWord(),
                "drawingBase64", d.getDrawingBase64() != null ? d.getDrawingBase64() : ""
            )).toList(),
            "votingTime", votingTime
        ));
    }

    public static GameEvent voteReceived(String voterId, String voterName, int totalVotes, int totalPlayers) {
        return new GameEvent("VOTE_RECEIVED", Map.of(
            "voterId", voterId,
            "voterName", voterName,
            "totalVotes", totalVotes,
            "totalPlayers", totalPlayers
        ));
    }

    public static GameEvent votingResults(List<Map<String, Object>> results, String winnerId, int bonusPoints) {
        return new GameEvent("VOTING_RESULTS", Map.of(
            "results", results,
            "winnerId", winnerId != null ? winnerId : "",
            "bonusPoints", bonusPoints
        ));
    }

    // Telephone mode events
    public static GameEvent telephoneDraw(String playerId, String playerName, int drawTime, int remainingPlayers) {
        return new GameEvent("TELEPHONE_DRAW", Map.of(
            "playerId", playerId,
            "playerName", playerName,
            "drawTime", drawTime,
            "remainingPlayers", remainingPlayers
        ));
    }

    public static GameEvent telephoneGuess(String playerId, String playerName, int guessTime, int remainingPlayers) {
        return new GameEvent("TELEPHONE_GUESS", Map.of(
            "playerId", playerId,
            "playerName", playerName,
            "guessTime", guessTime,
            "remainingPlayers", remainingPlayers
        ));
    }

    public static GameEvent telephonePrompt(String prompt, String type) {
        return new GameEvent("TELEPHONE_PROMPT", Map.of(
            "prompt", prompt,
            "type", type  // "word", "guess", or "drawing"
        ));
    }

    public static GameEvent telephoneReveal(String originalWord, List<Map<String, Object>> chain) {
        return new GameEvent("TELEPHONE_REVEAL", Map.of(
            "originalWord", originalWord,
            "chain", chain
        ));
    }
}
