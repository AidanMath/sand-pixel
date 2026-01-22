/**
 * Drawing action hooks
 * Handles drawing phase interactions
 */

import { useCallback } from 'react';
import { wsService } from '../../services/websocket';
import type { DrawStroke } from '../../types/game.types';

export function useDrawingActions() {
  /** Send a draw stroke to other players */
  const sendDrawStroke = useCallback((roomId: string, stroke: DrawStroke) => {
    wsService.sendDrawStroke(roomId, stroke);
  }, []);

  /** Submit the completed drawing */
  const submitDrawing = useCallback((roomId: string) => {
    console.log('[useDrawingActions] submitDrawing called:', { roomId });
    wsService.submitDrawing(roomId);
  }, []);

  return {
    sendDrawStroke,
    submitDrawing,
  };
}
