/**
 * Chat action hooks
 * Handles chat and guess interactions
 */

import { useCallback } from 'react';
import { wsService } from '../../services/websocket';

export function useChatActions() {
  /** Send a guess during drawing/reveal phase */
  const sendGuess = useCallback((roomId: string, text: string) => {
    wsService.sendGuess(roomId, text);
  }, []);

  /** Send a chat message */
  const sendChat = useCallback((roomId: string, text: string) => {
    wsService.sendChat(roomId, text);
  }, []);

  return {
    sendGuess,
    sendChat,
  };
}
