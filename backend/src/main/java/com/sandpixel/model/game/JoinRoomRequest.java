package com.sandpixel.model.game;

import lombok.Data;

@Data
public class JoinRoomRequest {
    private String roomId;
    private String playerName;
}
