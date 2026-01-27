import { useCallback } from 'react';
import { wsService } from '../../services/websocket';

export function useReactionActions() {
  const sendReaction = useCallback((roomId: string, emoji: string) => {
    wsService.sendReaction(roomId, emoji);
  }, []);

  return {
    sendReaction,
  };
}
