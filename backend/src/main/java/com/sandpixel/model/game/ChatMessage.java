package com.sandpixel.model.game;

import lombok.Data;

@Data
public class ChatMessage {
    private String playerId;
    private String playerName;
    private String text;
    private long timestamp;
    private boolean system;  // For system messages like "X guessed correctly!"
}
