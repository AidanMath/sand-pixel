/**
 * Lobby action hooks
 * Handles pre-game lobby interactions
 */

import { useCallback } from 'react';
import { wsService } from '../../services/websocket';

export function useLobbyActions() {
  /** Toggle ready state */
  const toggleReady = useCallback((roomId: string) => {
    wsService.toggleReady(roomId);
  }, []);

  /** Start the game (host only) */
  const startGame = useCallback((roomId: string) => {
    wsService.startGame(roomId);
  }, []);

  return {
    toggleReady,
    startGame,
  };
}
