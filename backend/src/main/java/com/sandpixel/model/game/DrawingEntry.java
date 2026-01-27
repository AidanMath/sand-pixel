package com.sandpixel.model.game;

import lombok.Data;

@Data
public class DrawingEntry {
    private int round;
    private String drawerId;
    private String drawerName;
    private String word;
    private String drawingBase64;
    private int votes;

    public DrawingEntry(int round, String drawerId, String drawerName, String word, String drawingBase64) {
        this.round = round;
        this.drawerId = drawerId;
        this.drawerName = drawerName;
        this.word = word;
        this.drawingBase64 = drawingBase64;
        this.votes = 0;
    }

    public void addVote() {
        this.votes++;
    }
}
