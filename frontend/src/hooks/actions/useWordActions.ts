/**
 * Word action hooks
 * Handles word selection phase interactions
 */

import { useCallback } from 'react';
import { wsService } from '../../services/websocket';

export function useWordActions() {
  /** Select a word (drawer only) */
  const selectWord = useCallback((roomId: string, wordIndex: number) => {
    wsService.selectWord(roomId, wordIndex);
  }, []);

  return {
    selectWord,
  };
}
