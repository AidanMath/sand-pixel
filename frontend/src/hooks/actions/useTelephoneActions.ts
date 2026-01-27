import { useCallback } from 'react';
import { wsService } from '../../services/websocket';

export function useTelephoneActions() {
  const submitTelephoneDrawing = useCallback((roomId: string, drawingBase64: string) => {
    wsService.submitTelephoneDrawing(roomId, drawingBase64);
  }, []);

  const submitTelephoneGuess = useCallback((roomId: string, text: string) => {
    wsService.submitTelephoneGuess(roomId, text);
  }, []);

  return {
    submitTelephoneDrawing,
    submitTelephoneGuess,
  };
}
