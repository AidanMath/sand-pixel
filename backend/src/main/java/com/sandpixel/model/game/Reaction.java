package com.sandpixel.model.game;

import lombok.Data;

@Data
public class Reaction {
    private String playerId;
    private String playerName;
    private String emoji;
    private long timestamp;

    public Reaction(String playerId, String playerName, String emoji) {
        this.playerId = playerId;
        this.playerName = playerName;
        this.emoji = emoji;
        this.timestamp = System.currentTimeMillis();
    }
}
