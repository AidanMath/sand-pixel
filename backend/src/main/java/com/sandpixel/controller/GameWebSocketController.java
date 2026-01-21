package com.sandpixel.controller;

import com.sandpixel.model.game.*;
import com.sandpixel.service.GameService;
import com.sandpixel.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Controller
@RequiredArgsConstructor
@Slf4j
public class GameWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;
    private final GameService gameService;

    @EventListener
    public void handleWebSocketConnect(SessionConnectEvent event) {
        String sessionId = event.getMessage().getHeaders().get("simpSessionId", String.class);
        log.info("WebSocket connected: sessionId={}", sessionId);
    }

    @EventListener
    public void handleWebSocketDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        log.info("WebSocket disconnected: sessionId={}", sessionId);
        roomService.handleDisconnect(sessionId);
    }

    @MessageMapping("/room/create")
    @SendToUser("/queue/room")
    public RoomResponse createRoom(@Payload CreateRoomRequest request,
                                   SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        log.info("Creating room: playerName={}, sessionId={}", request.getPlayerName(), sessionId);

        Room room = roomService.createRoom(request.getPlayerName(), sessionId, request.getSettings());
        return RoomResponse.success(room);
    }

    @MessageMapping("/room/join")
    @SendToUser("/queue/room")
    public RoomResponse joinRoom(@Payload JoinRoomRequest request,
                                 SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        log.info("Joining room: roomId={}, playerName={}, sessionId={}",
                request.getRoomId(), request.getPlayerName(), sessionId);

        try {
            Room room = roomService.joinRoom(request.getRoomId(), request.getPlayerName(), sessionId);

            // Broadcast player joined to all in room
            broadcastToRoom(room.getId(), GameEvent.playerJoined(room, room.getPlayer(sessionId)));

            return RoomResponse.success(room);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return RoomResponse.error(e.getMessage());
        }
    }

    @MessageMapping("/room/{roomId}/leave")
    public void leaveRoom(@DestinationVariable String roomId,
                         SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        log.info("Leaving room: roomId={}, sessionId={}", roomId, sessionId);

        Player player = roomService.getPlayerBySession(sessionId);
        Room room = roomService.leaveRoom(roomId, sessionId);

        if (room != null && player != null) {
            broadcastToRoom(roomId, GameEvent.playerLeft(room, player));
        }
    }

    @MessageMapping("/room/{roomId}/ready")
    public void toggleReady(@DestinationVariable String roomId,
                           SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        Room room = roomService.toggleReady(roomId, sessionId);

        if (room != null) {
            broadcastToRoom(roomId, GameEvent.roomState(room));
        }
    }

    @MessageMapping("/room/{roomId}/start")
    public void startGame(@DestinationVariable String roomId,
                         SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        Room room = roomService.getRoom(roomId);

        if (room == null) {
            sendError(sessionId, "Room not found");
            return;
        }

        if (!room.getHostId().equals(sessionId)) {
            sendError(sessionId, "Only host can start the game");
            return;
        }

        gameService.startGame(roomId);
    }

    @MessageMapping("/room/{roomId}/word-select")
    public void selectWord(@DestinationVariable String roomId,
                          @Payload WordSelectRequest request,
                          SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        gameService.selectWord(roomId, sessionId, request.getWordIndex());
    }

    @MessageMapping("/room/{roomId}/draw-stroke")
    public void sendDrawStroke(@DestinationVariable String roomId,
                               @Payload DrawStroke stroke,
                               SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        Room room = roomService.getRoom(roomId);

        if (room == null) return;

        GameState state = room.getGameState();
        if (state == null || !sessionId.equals(state.getCurrentDrawerId())) {
            return; // Only drawer can send strokes
        }

        // Broadcast stroke to all other players (not back to drawer)
        messagingTemplate.convertAndSend(
            "/topic/room/" + roomId + "/draw",
            stroke
        );
    }

    @MessageMapping("/room/{roomId}/submit-drawing")
    public void submitDrawing(@DestinationVariable String roomId,
                              @Payload SubmitDrawingRequest request,
                              SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        gameService.submitDrawing(roomId, sessionId, request.getDrawingBase64());
    }

    @MessageMapping("/room/{roomId}/guess")
    public void submitGuess(@DestinationVariable String roomId,
                           @Payload GuessRequest request,
                           SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        gameService.processGuess(roomId, sessionId, request.getText());
    }

    @MessageMapping("/room/{roomId}/chat")
    public void sendChat(@DestinationVariable String roomId,
                        @Payload ChatMessage message,
                        SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        Player player = roomService.getPlayerBySession(sessionId);

        if (player != null) {
            message.setPlayerId(player.getId());
            message.setPlayerName(player.getName());
            message.setTimestamp(System.currentTimeMillis());

            broadcastToRoom(roomId, GameEvent.chat(message));
        }
    }

    public void broadcastToRoom(String roomId, GameEvent event) {
        messagingTemplate.convertAndSend("/topic/room/" + roomId, event);
    }

    public void sendToPlayer(String sessionId, GameEvent event) {
        messagingTemplate.convertAndSendToUser(sessionId, "/queue/game", event);
    }

    private void sendError(String sessionId, String message) {
        messagingTemplate.convertAndSendToUser(sessionId, "/queue/error",
            GameEvent.error(message));
    }
}
