/**
 * Room selectors
 * Provides memoized access to room state
 */

import { useGameStore } from '../gameStore';
import type { Room, RoomSettings } from '../../types/game.types';

/** Get current room */
export function useRoom(): Room | null {
  return useGameStore((state) => state.room);
}

/** Get room ID */
export function useRoomId(): string | null {
  return useGameStore((state) => state.room?.id || null);
}

/** Get room settings */
export function useRoomSettings(): RoomSettings | null {
  return useGameStore((state) => state.room?.settings || null);
}

/** Check if user is in a room */
export function useIsInRoom(): boolean {
  return useGameStore((state) => state.room !== null);
}

/** Get host ID */
export function useHostId(): string | null {
  return useGameStore((state) => state.room?.hostId || null);
}

/** Get max players setting */
export function useMaxPlayers(): number {
  return useGameStore((state) => state.room?.settings.maxPlayers || 8);
}

/** Check if room is full */
export function useIsRoomFull(): boolean {
  return useGameStore((state) => {
    if (!state.room) return false;
    const playerCount = Object.keys(state.room.players).length;
    return playerCount >= state.room.settings.maxPlayers;
  });
}

/** Check if all players are ready */
export function useAllPlayersReady(): boolean {
  return useGameStore((state) => {
    if (!state.room) return false;
    const players = Object.values(state.room.players);
    return players.length >= 2 && players.every((p) => p.ready);
  });
}

/** Get my session ID */
export function useMySessionId(): string | null {
  return useGameStore((state) => state.mySessionId);
}
