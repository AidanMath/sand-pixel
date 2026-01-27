package com.sandpixel.controller;

import com.sandpixel.model.game.*;
import com.sandpixel.service.BroadcastService;
import com.sandpixel.service.GameService;
import com.sandpixel.service.RoomService;
import com.sandpixel.service.game.VotingManager;
import com.sandpixel.service.game.TelephoneManager;
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
    private final BroadcastService broadcastService;
    private final VotingManager votingManager;
    private final TelephoneManager telephoneManager;

    @EventListener
    public void handleWebSocketConnect(SessionConnectEvent event) {
        String sessionId = event.getMessage().getHeaders().get("simpSessionId", String.class);
        log.info("WebSocket connected: sessionId={}", sessionId);
    }

    @EventListener
    public void handleWebSocketDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        log.info("WebSocket disconnected: sessionId={}", sessionId);

        // Get room before handling disconnect
        String roomId = roomService.getRoomIdForSession(sessionId);
        if (roomId != null) {
            gameService.handlePlayerDisconnect(roomId, sessionId);
        }

        roomService.handleDisconnect(sessionId);
    }

    @MessageMapping("/room/create")
    @SendToUser("/queue/room")
    public RoomResponse createRoom(@Payload CreateRoomRequest request,
                                   SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        log.info("Creating room: playerName={}, sessionId={}", request.getPlayerName(), sessionId);

        Room room = roomService.createRoom(request.getPlayerName(), sessionId, request.getSettings());
        return RoomResponse.success(room, sessionId);
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

            broadcastService.broadcastToRoom(room.getId(),
                GameEvent.playerJoined(room, room.getPlayer(sessionId)));

            return RoomResponse.success(room, sessionId);
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
            broadcastService.broadcastToRoom(roomId, GameEvent.playerLeft(room, player));
        }
    }

    @MessageMapping("/room/{roomId}/ready")
    public void toggleReady(@DestinationVariable String roomId,
                           SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        Room room = roomService.toggleReady(roomId, sessionId);

        if (room != null) {
            broadcastService.broadcastToRoom(roomId, GameEvent.roomState(room));
        }
    }

    @MessageMapping("/room/{roomId}/start")
    public void startGame(@DestinationVariable String roomId,
                         SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        Room room = roomService.getRoom(roomId);

        if (room == null) {
            broadcastService.sendError(sessionId, "Room not found");
            return;
        }

        if (!room.getHostId().equals(sessionId)) {
            broadcastService.sendError(sessionId, "Only host can start the game");
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
        // Allow drawing if player is any of the drawers (for collaborative mode)
        if (state == null || !state.isDrawer(sessionId)) {
            return;
        }

        messagingTemplate.convertAndSend(
            "/topic/room/" + roomId + "/draw",
            stroke
        );
    }

    @MessageMapping("/room/{roomId}/submit-drawing")
    public void submitDrawing(@DestinationVariable String roomId,
                              SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        log.info("submitDrawing received: roomId={}, sessionId={}", roomId, sessionId);
        gameService.submitDrawing(roomId, sessionId);
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

            broadcastService.broadcastToRoom(roomId, GameEvent.chat(message));
        }
    }

    private static final java.util.Set<String> ALLOWED_EMOJIS = java.util.Set.of(
        "\uD83D\uDC4D", "\uD83D\uDC4F", "\uD83D\uDE02", "\uD83D\uDD25", "❤️",
        "\uD83D\uDE2E", "\uD83E\uDD14", "\uD83D\uDE2D", "\uD83D\uDC80", "\uD83C\uDFA8"
    );

    @MessageMapping("/room/{roomId}/react")
    public void sendReaction(@DestinationVariable String roomId,
                             @Payload ReactionRequest request,
                             SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        Player player = roomService.getPlayerBySession(sessionId);
        Room room = roomService.getRoom(roomId);

        if (player == null || room == null) return;

        // Validate emoji is allowed
        if (!ALLOWED_EMOJIS.contains(request.getEmoji())) {
            return;
        }

        Reaction reaction = new Reaction(player.getId(), player.getName(), request.getEmoji());
        broadcastService.broadcastToRoom(roomId, GameEvent.reaction(reaction));
    }

    @MessageMapping("/room/{roomId}/vote")
    public void submitVote(@DestinationVariable String roomId,
                           @Payload VoteRequest request,
                           SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        votingManager.processVote(roomId, sessionId, request.getDrawingDrawerId());
    }

    @MessageMapping("/room/{roomId}/telephone-draw")
    public void submitTelephoneDrawing(@DestinationVariable String roomId,
                                       @Payload SubmitDrawingRequest request,
                                       SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        String drawingBase64 = request.getDrawingBase64();
        telephoneManager.submitTelephoneDrawing(roomId, sessionId, drawingBase64);
    }

    @MessageMapping("/room/{roomId}/telephone-guess")
    public void submitTelephoneGuess(@DestinationVariable String roomId,
                                     @Payload GuessRequest request,
                                     SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        telephoneManager.submitTelephoneGuess(roomId, sessionId, request.getText());
    }
}
