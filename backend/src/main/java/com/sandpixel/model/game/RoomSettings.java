package com.sandpixel.model.game;

import lombok.Data;

@Data
public class RoomSettings {
    private int maxPlayers = 12;
    private int totalRounds = 3;
    private int drawTime = 80;      // seconds
    private int revealTime = 30;    // seconds for guessing during reveal
    private String difficulty = "medium"; // easy, medium, hard

    public RoomSettings() {}

    public RoomSettings(int maxPlayers, int totalRounds, int drawTime) {
        this.maxPlayers = Math.min(Math.max(maxPlayers, 2), 12);
        this.totalRounds = Math.min(Math.max(totalRounds, 1), 10);
        this.drawTime = Math.min(Math.max(drawTime, 30), 180);
    }
}
