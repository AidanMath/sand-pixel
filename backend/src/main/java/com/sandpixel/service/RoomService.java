package com.sandpixel.service;

import com.sandpixel.model.game.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class RoomService {

    private final Map<String, Room> rooms = new ConcurrentHashMap<>();
    private final Map<String, String> sessionToRoom = new ConcurrentHashMap<>();

    public Room createRoom(String playerName, String sessionId, RoomSettings settings) {
        Room room = new Room(settings);
        room.addPlayer(playerName, sessionId);
        rooms.put(room.getId(), room);
        sessionToRoom.put(sessionId, room.getId());

        log.info("Room created: id={}, host={}", room.getId(), playerName);
        return room;
    }

    public Room joinRoom(String roomId, String playerName, String sessionId) {
        Room room = rooms.get(roomId.toUpperCase());

        if (room == null) {
            throw new IllegalArgumentException("Room not found");
        }

        if (room.getGameState().getPhase() != GamePhase.LOBBY) {
            throw new IllegalStateException("Game already in progress");
        }

        if (room.getPlayerCount() >= room.getSettings().getMaxPlayers()) {
            throw new IllegalStateException("Room is full");
        }

        room.addPlayer(playerName, sessionId);
        sessionToRoom.put(sessionId, room.getId());

        log.info("Player joined room: roomId={}, player={}", roomId, playerName);
        return room;
    }

    public Room leaveRoom(String roomId, String sessionId) {
        Room room = rooms.get(roomId);
        if (room == null) return null;

        room.removePlayer(sessionId);
        sessionToRoom.remove(sessionId);

        if (room.isEmpty()) {
            rooms.remove(roomId);
            log.info("Room deleted (empty): id={}", roomId);
            return null;
        }

        return room;
    }

    public Room toggleReady(String roomId, String sessionId) {
        Room room = rooms.get(roomId);
        if (room == null) return null;

        Player player = room.getPlayer(sessionId);
        if (player != null) {
            player.setReady(!player.isReady());
        }

        return room;
    }

    public void handleDisconnect(String sessionId) {
        String roomId = sessionToRoom.get(sessionId);
        if (roomId != null) {
            Room room = rooms.get(roomId);
            if (room != null) {
                Player player = room.getPlayer(sessionId);
                if (player != null) {
                    player.setConnected(false);
                    log.info("Player disconnected: roomId={}, player={}", roomId, player.getName());
                }
            }
        }
    }

    public Room getRoom(String roomId) {
        return rooms.get(roomId);
    }

    public Player getPlayerBySession(String sessionId) {
        String roomId = sessionToRoom.get(sessionId);
        if (roomId == null) return null;

        Room room = rooms.get(roomId);
        if (room == null) return null;

        return room.getPlayer(sessionId);
    }

    public String getRoomIdForSession(String sessionId) {
        return sessionToRoom.get(sessionId);
    }

    public List<Room> getPublicRooms() {
        return rooms.values().stream()
            .filter(r -> r.getGameState().getPhase() == GamePhase.LOBBY)
            .filter(r -> r.getPlayerCount() < r.getSettings().getMaxPlayers())
            .toList();
    }

    @Scheduled(fixedRate = 60000) // Every minute
    public void cleanupInactiveRooms() {
        List<String> toRemove = rooms.entrySet().stream()
            .filter(e -> e.getValue().isInactive(30)) // 30 minutes
            .map(Map.Entry::getKey)
            .toList();

        for (String roomId : toRemove) {
            Room room = rooms.remove(roomId);
            if (room != null) {
                room.getPlayers().keySet().forEach(sessionToRoom::remove);
                log.info("Room expired: id={}", roomId);
            }
        }
    }
}
