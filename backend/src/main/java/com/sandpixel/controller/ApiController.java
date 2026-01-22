package com.sandpixel.controller;

import com.sandpixel.model.game.Room;
import com.sandpixel.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ApiController {

    private final RoomService roomService;
    private final Instant startTime = Instant.now();

    @GetMapping("/")
    public Map<String, Object> index() {
        return Map.of(
            "name", "Sand Pixel API",
            "status", "running",
            "websocket", "/ws"
        );
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        long uptimeSeconds = Instant.now().getEpochSecond() - startTime.getEpochSecond();
        return Map.of(
            "status", "healthy",
            "uptime", formatUptime(uptimeSeconds)
        );
    }

    @GetMapping("/api/rooms")
    public Map<String, Object> listRooms() {
        List<Room> publicRooms = roomService.getPublicRooms();
        return Map.of(
            "count", publicRooms.size(),
            "rooms", publicRooms.stream().map(this::roomSummary).toList()
        );
    }

    @GetMapping("/api/rooms/{roomId}")
    public Map<String, Object> getRoom(@PathVariable String roomId) {
        Room room = roomService.getRoom(roomId.toUpperCase());
        if (room == null) {
            return Map.of("error", "Room not found");
        }
        return roomSummary(room);
    }

    private Map<String, Object> roomSummary(Room room) {
        return Map.of(
            "id", room.getId(),
            "players", room.getPlayerCount(),
            "maxPlayers", room.getSettings().getMaxPlayers(),
            "phase", room.getGameState().getPhase().name(),
            "round", room.getGameState().getCurrentRound(),
            "totalRounds", room.getGameState().getTotalRounds()
        );
    }

    private String formatUptime(long seconds) {
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;
        long secs = seconds % 60;
        if (hours > 0) {
            return String.format("%dh %dm %ds", hours, minutes, secs);
        } else if (minutes > 0) {
            return String.format("%dm %ds", minutes, secs);
        }
        return String.format("%ds", secs);
    }
}
