package com.sandpixel.model.game;

import lombok.Data;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Data
public class GameState {
    private GamePhase phase = GamePhase.LOBBY;
    private int currentRound = 0;
    private int totalRounds;
    private String currentDrawerId;
    private String currentWord;
    private String[] wordOptions;
    private String drawingBase64;
    private Set<String> correctGuessers = new HashSet<>();
    private Instant phaseStartTime;
    private int drawerIndex = -1;

    public GameState(int totalRounds) {
        this.totalRounds = totalRounds;
    }

    public void startNewRound(String drawerId, String[] wordOptions) {
        this.currentRound++;
        this.currentDrawerId = drawerId;
        this.wordOptions = wordOptions;
        this.currentWord = null;
        this.drawingBase64 = null;
        this.correctGuessers.clear();
        this.phase = GamePhase.WORD_SELECTION;
        this.phaseStartTime = Instant.now();
    }

    public void setWordSelected(String word) {
        this.currentWord = word;
        this.wordOptions = null;
        this.phase = GamePhase.DRAWING;
        this.phaseStartTime = Instant.now();
    }

    public void startReveal(String drawingBase64) {
        this.drawingBase64 = drawingBase64;
        this.phase = GamePhase.REVEAL;
        this.phaseStartTime = Instant.now();
    }

    public void showResults() {
        this.phase = GamePhase.RESULTS;
        this.phaseStartTime = Instant.now();
    }

    public void endGame() {
        this.phase = GamePhase.GAME_OVER;
        this.phaseStartTime = Instant.now();
    }

    public boolean hasGuessedCorrectly(String playerId) {
        return correctGuessers.contains(playerId);
    }

    public void addCorrectGuesser(String playerId) {
        correctGuessers.add(playerId);
    }

    public int getCorrectGuessCount() {
        return correctGuessers.size();
    }

    public String getWordHint() {
        if (currentWord == null) return "";
        return currentWord.replaceAll("[a-zA-Z]", "_ ").trim();
    }

    public int getWordLength() {
        return currentWord != null ? currentWord.length() : 0;
    }
}
