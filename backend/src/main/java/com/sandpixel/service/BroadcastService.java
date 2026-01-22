package com.sandpixel.service;

import com.sandpixel.model.game.GameEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class BroadcastService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastToRoom(String roomId, GameEvent event) {
        messagingTemplate.convertAndSend("/topic/room/" + roomId, event);
    }

    public void sendToPlayer(String sessionId, GameEvent event) {
        messagingTemplate.convertAndSend("/topic/player/" + sessionId, event);
    }

    public void sendError(String sessionId, String message) {
        messagingTemplate.convertAndSendToUser(sessionId, "/queue/error",
            GameEvent.error(message));
    }
}
