package com.sandpixel.model.game;

import lombok.Data;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Data
public class Room {
    private String id;
    private String hostId;
    private Map<String, Player> players = new ConcurrentHashMap<>();
    private GameState gameState;
    private RoomSettings settings;
    private Instant createdAt;
    private Instant lastActivity;

    private static final String ROOM_ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final Random random = new Random();

    public Room(RoomSettings settings) {
        this.id = generateRoomId();
        this.settings = settings != null ? settings : new RoomSettings();
        this.gameState = new GameState(this.settings.getTotalRounds());
        this.createdAt = Instant.now();
        this.lastActivity = Instant.now();
    }

    private static String generateRoomId() {
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(ROOM_ID_CHARS.charAt(random.nextInt(ROOM_ID_CHARS.length())));
        }
        return sb.toString();
    }

    public Player addPlayer(String name, String sessionId) {
        if (players.size() >= settings.getMaxPlayers()) {
            throw new IllegalStateException("Room is full");
        }

        Player player = new Player(name, sessionId);
        players.put(sessionId, player);

        if (hostId == null) {
            hostId = sessionId;
        }

        lastActivity = Instant.now();
        return player;
    }

    public Player removePlayer(String sessionId) {
        Player removed = players.remove(sessionId);

        // Transfer host if host left
        if (sessionId.equals(hostId) && !players.isEmpty()) {
            hostId = players.keySet().iterator().next();
        }

        lastActivity = Instant.now();
        return removed;
    }

    public Player getPlayer(String sessionId) {
        return players.get(sessionId);
    }

    public Player getPlayerById(String playerId) {
        return players.values().stream()
            .filter(p -> p.getId().equals(playerId))
            .findFirst()
            .orElse(null);
    }

    public Player findPlayerByName(String name) {
        return players.values().stream()
            .filter(p -> p.getName().equalsIgnoreCase(name))
            .findFirst()
            .orElse(null);
    }

    public void updatePlayerSession(String oldSessionId, String newSessionId) {
        Player player = players.remove(oldSessionId);
        if (player != null) {
            player.setSessionId(newSessionId);
            players.put(newSessionId, player);

            // Update hostId if needed
            if (oldSessionId.equals(hostId)) {
                hostId = newSessionId;
            }
        }
    }

    public List<Player> getPlayerList() {
        return new ArrayList<>(players.values());
    }

    public int getPlayerCount() {
        return players.size();
    }

    public boolean isEmpty() {
        return players.isEmpty();
    }

    public boolean allPlayersReady() {
        if (players.size() < 2) return false;
        return players.values().stream().allMatch(Player::isReady);
    }

    public String getNextDrawerId() {
        List<String> sessionIds = new ArrayList<>(players.keySet());
        if (sessionIds.isEmpty()) return null;

        int nextIndex = (gameState.getDrawerIndex() + 1) % sessionIds.size();
        gameState.setDrawerIndex(nextIndex);
        return sessionIds.get(nextIndex);
    }

    public void resetForNewGame() {
        players.values().forEach(p -> {
            p.setScore(0);
            p.setReady(false);
        });
        this.gameState = new GameState(settings.getTotalRounds());
    }

    public void touchActivity() {
        this.lastActivity = Instant.now();
    }

    public boolean isInactive(int minutes) {
        return lastActivity.plusSeconds(minutes * 60L).isBefore(Instant.now());
    }
}
