package com.sandpixel.model.game;

import lombok.Data;
import java.util.List;

@Data
public class DrawStroke {
    private String type;  // "start", "move", "end"
    private List<Point> points;
    private String color;
    private int brushSize;
    private boolean eraser;
    private boolean fill;

    @Data
    public static class Point {
        private double x;
        private double y;
    }
}
