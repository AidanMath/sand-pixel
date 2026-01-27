package com.sandpixel.model.game;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class TelephoneChain {
    private String originalWord;
    private List<TelephoneEntry> entries;
    private List<String> playerQueue;  // Session IDs of players in order
    private int currentPlayerIndex;

    public TelephoneChain(String originalWord, List<String> playerQueue) {
        this.originalWord = originalWord;
        this.playerQueue = new ArrayList<>(playerQueue);
        this.entries = new ArrayList<>();
        this.currentPlayerIndex = 0;
    }

    public void addEntry(TelephoneEntry entry) {
        entries.add(entry);
    }

    public String getCurrentPlayerSessionId() {
        if (currentPlayerIndex >= playerQueue.size()) {
            return null;
        }
        return playerQueue.get(currentPlayerIndex);
    }

    public void advanceToNextPlayer() {
        currentPlayerIndex++;
    }

    public boolean isComplete() {
        return currentPlayerIndex >= playerQueue.size();
    }

    public TelephoneEntry.Type getNextActionType() {
        // Alternates: DRAW, GUESS, DRAW, GUESS...
        // First player draws, second guesses, third draws their guess, etc.
        return (entries.size() % 2 == 0) ? TelephoneEntry.Type.DRAW : TelephoneEntry.Type.GUESS;
    }

    public String getCurrentPrompt() {
        if (entries.isEmpty()) {
            return originalWord;  // First player draws the original word
        }
        // Return the last entry's content (previous drawing or guess)
        return entries.get(entries.size() - 1).getContent();
    }

    public TelephoneEntry getLastEntry() {
        if (entries.isEmpty()) return null;
        return entries.get(entries.size() - 1);
    }

    public int getRemainingPlayers() {
        return playerQueue.size() - currentPlayerIndex;
    }
}
