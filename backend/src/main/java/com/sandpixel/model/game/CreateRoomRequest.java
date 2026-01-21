package com.sandpixel.model.game;

import lombok.Data;

@Data
public class CreateRoomRequest {
    private String playerName;
    private RoomSettings settings;
}
