package com.sandpixel.model.game;

import lombok.Data;
import java.util.UUID;

@Data
public class Player {
    private String id;
    private String name;
    private String sessionId;
    private int score;
    private boolean ready;
    private boolean connected;
    private int currentStreak;
    private int maxStreak;

    public Player(String name, String sessionId) {
        this.id = UUID.randomUUID().toString().substring(0, 8);
        this.name = name;
        this.sessionId = sessionId;
        this.score = 0;
        this.ready = false;
        this.connected = true;
        this.currentStreak = 0;
        this.maxStreak = 0;
    }

    public void addScore(int points) {
        this.score += points;
    }

    public void incrementStreak() {
        this.currentStreak++;
        if (this.currentStreak > this.maxStreak) {
            this.maxStreak = this.currentStreak;
        }
    }

    public void resetStreak() {
        this.currentStreak = 0;
    }
}
