/**
 * Room lifecycle action hooks
 * Handles room creation, joining, and leaving
 */

import { useCallback } from 'react';
import { wsService } from '../../services/websocket';
import { useGameStore } from '../../stores/gameStore';
import type { RoomSettings } from '../../types/game.types';

export function useRoomActions() {
  const { setRoom } = useGameStore();

  /** Create a new room */
  const createRoom = useCallback(
    (playerName: string, settings?: Partial<RoomSettings>) => {
      wsService.createRoom(playerName, settings);
    },
    []
  );

  /** Join an existing room */
  const joinRoom = useCallback((roomId: string, playerName: string) => {
    wsService.joinRoom(roomId, playerName);
  }, []);

  /** Leave the current room */
  const leaveRoom = useCallback(
    (roomId: string) => {
      wsService.leaveRoom(roomId);
      setRoom(null);
    },
    [setRoom]
  );

  return {
    createRoom,
    joinRoom,
    leaveRoom,
  };
}
