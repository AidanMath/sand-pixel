package com.sandpixel.model.game;

import lombok.Data;

@Data
public class RoomResponse {
    private boolean success;
    private String error;
    private Room room;

    public static RoomResponse success(Room room) {
        RoomResponse response = new RoomResponse();
        response.setSuccess(true);
        response.setRoom(room);
        return response;
    }

    public static RoomResponse error(String message) {
        RoomResponse response = new RoomResponse();
        response.setSuccess(false);
        response.setError(message);
        return response;
    }
}
