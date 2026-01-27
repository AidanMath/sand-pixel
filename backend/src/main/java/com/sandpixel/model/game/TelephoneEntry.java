package com.sandpixel.model.game;

import lombok.Data;

@Data
public class TelephoneEntry {
    public enum Type {
        DRAW,
        GUESS
    }

    private String playerId;
    private String playerName;
    private Type type;
    private String content;  // Either drawingBase64 or guess text
    private long timestamp;

    public TelephoneEntry(String playerId, String playerName, Type type, String content) {
        this.playerId = playerId;
        this.playerName = playerName;
        this.type = type;
        this.content = content;
        this.timestamp = System.currentTimeMillis();
    }
}
