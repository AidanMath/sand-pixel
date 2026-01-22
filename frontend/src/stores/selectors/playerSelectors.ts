import { useGameStore } from '../gameStore';
import type { Player } from '../../types/game.types';

export function usePlayerById(playerId: string | null): Player | null {
  return useGameStore((state) => {
    if (!state.room || !playerId) return null;
    return Object.values(state.room.players).find((p) => p.id === playerId) || null;
  });
}

export function usePlayerBySessionId(sessionId: string | null): Player | null {
  return useGameStore((state) => {
    if (!state.room || !sessionId) return null;
    return state.room.players[sessionId] || null;
  });
}

export function useCurrentDrawer(): Player | null {
  return useGameStore((state) => {
    if (!state.room) return null;
    const drawerId = state.room.gameState.currentDrawerId;
    if (!drawerId) return null;
    return Object.values(state.room.players).find((p) => p.id === drawerId) || null;
  });
}

export function usePlayers(): Player[] {
  return useGameStore((state) => {
    if (!state.room) return [];
    return Object.values(state.room.players);
  });
}

export function usePlayerCount(): number {
  return useGameStore((state) => {
    if (!state.room) return 0;
    return Object.keys(state.room.players).length;
  });
}

export function useIsHost(): boolean {
  return useGameStore((state) => {
    if (!state.room || !state.mySessionId) return false;
    return state.room.hostId === state.mySessionId;
  });
}

export function useIsDrawer(): boolean {
  return useGameStore((state) => {
    if (!state.room || !state.mySessionId) return false;
    const myPlayer = state.room.players[state.mySessionId];
    return myPlayer?.id === state.room.gameState.currentDrawerId;
  });
}

export function useMyPlayer(): Player | null {
  return useGameStore((state) => {
    if (!state.room || !state.mySessionId) return null;
    return state.room.players[state.mySessionId] || null;
  });
}

export function useHasGuessedCorrectly(playerId: string | null): boolean {
  return useGameStore((state) => {
    if (!state.room || !playerId) return false;
    return state.room.gameState.correctGuessers?.includes(playerId) || false;
  });
}
