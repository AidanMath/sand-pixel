package com.sandpixel.model.game;

import lombok.Data;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
public class GameState {
    private GamePhase phase = GamePhase.LOBBY;
    private int currentRound = 0;
    private int totalRounds;
    private String currentDrawerId;  // Player ID (for frontend) - kept for backward compatibility
    private transient String currentDrawerSessionId;  // Session ID (for backend routing, not serialized)
    private Set<String> currentDrawerIds = new HashSet<>();  // Multiple drawer IDs for collaborative mode
    private transient Set<String> currentDrawerSessionIds = new HashSet<>();  // Multiple session IDs
    private String currentWord;
    private String[] wordOptions;
    private String drawingBase64;
    private Set<String> correctGuessers = new HashSet<>();
    private Instant phaseStartTime;
    private int drawerIndex = -1;

    // Voting-related state
    private List<DrawingEntry> roundDrawings = new ArrayList<>();
    private Set<String> votedPlayers = new HashSet<>();

    // Telephone mode state
    private TelephoneChain telephoneChain;
    private String currentTelephonePlayerId;
    private transient String currentTelephonePlayerSessionId;

    public GameState(int totalRounds) {
        this.totalRounds = totalRounds;
    }

    public void startNewRound(String drawerSessionId, String drawerPlayerId, String[] wordOptions) {
        this.currentRound++;
        this.currentDrawerSessionId = drawerSessionId;
        this.currentDrawerId = drawerPlayerId;
        this.currentDrawerSessionIds.clear();
        this.currentDrawerSessionIds.add(drawerSessionId);
        this.currentDrawerIds.clear();
        this.currentDrawerIds.add(drawerPlayerId);
        this.wordOptions = wordOptions;
        this.currentWord = null;
        this.drawingBase64 = null;
        this.correctGuessers.clear();
        this.phase = GamePhase.WORD_SELECTION;
        this.phaseStartTime = Instant.now();
    }

    public void startNewRoundCollaborative(Set<String> drawerSessionIds, Set<String> drawerPlayerIds, String[] wordOptions) {
        this.currentRound++;
        this.currentDrawerSessionIds = new HashSet<>(drawerSessionIds);
        this.currentDrawerIds = new HashSet<>(drawerPlayerIds);
        // For backward compatibility, set the first drawer
        if (!drawerSessionIds.isEmpty()) {
            this.currentDrawerSessionId = drawerSessionIds.iterator().next();
        }
        if (!drawerPlayerIds.isEmpty()) {
            this.currentDrawerId = drawerPlayerIds.iterator().next();
        }
        this.wordOptions = wordOptions;
        this.currentWord = null;
        this.drawingBase64 = null;
        this.correctGuessers.clear();
        this.phase = GamePhase.WORD_SELECTION;
        this.phaseStartTime = Instant.now();
    }

    public boolean isDrawer(String sessionId) {
        return currentDrawerSessionIds.contains(sessionId);
    }

    public boolean isDrawerById(String playerId) {
        return currentDrawerIds.contains(playerId);
    }

    public void setWordSelected(String word) {
        this.currentWord = word;
        this.wordOptions = null;
        this.phase = GamePhase.DRAWING;
        this.phaseStartTime = Instant.now();
    }

    public void startReveal() {
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

    public void saveDrawing(String drawerId, String drawerName, String word, String drawingBase64) {
        roundDrawings.add(new DrawingEntry(currentRound, drawerId, drawerName, word, drawingBase64));
    }

    public boolean hasVoted(String playerId) {
        return votedPlayers.contains(playerId);
    }

    public void recordVote(String voterId, String drawingDrawerId) {
        votedPlayers.add(voterId);
        for (DrawingEntry entry : roundDrawings) {
            if (entry.getDrawerId().equals(drawingDrawerId)) {
                entry.addVote();
                break;
            }
        }
    }

    public void startVoting() {
        this.phase = GamePhase.VOTING;
        this.phaseStartTime = Instant.now();
        this.votedPlayers.clear();
    }

    public void resetForNewGame() {
        this.phase = GamePhase.LOBBY;
        this.currentRound = 0;
        this.currentDrawerId = null;
        this.currentDrawerSessionId = null;
        this.currentDrawerIds.clear();
        this.currentDrawerSessionIds.clear();
        this.currentWord = null;
        this.wordOptions = null;
        this.drawingBase64 = null;
        this.correctGuessers.clear();
        this.drawerIndex = -1;
        this.roundDrawings.clear();
        this.votedPlayers.clear();
        this.telephoneChain = null;
        this.currentTelephonePlayerId = null;
        this.currentTelephonePlayerSessionId = null;
    }

    public void startTelephoneChain(String word, List<String> playerQueue) {
        this.currentRound++;
        this.telephoneChain = new TelephoneChain(word, playerQueue);
        this.currentWord = word;
        this.phase = GamePhase.TELEPHONE_DRAW;
        this.phaseStartTime = Instant.now();
    }

    public void setCurrentTelephonePlayer(String sessionId, String playerId) {
        this.currentTelephonePlayerSessionId = sessionId;
        this.currentTelephonePlayerId = playerId;
    }

    public boolean isCurrentTelephonePlayer(String sessionId) {
        return sessionId != null && sessionId.equals(currentTelephonePlayerSessionId);
    }
}
