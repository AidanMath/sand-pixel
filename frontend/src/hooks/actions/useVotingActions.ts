import { useCallback } from 'react';
import { wsService } from '../../services/websocket';
import { useGameStore } from '../../stores/gameStore';

export function useVotingActions() {
  const { setHasVoted } = useGameStore();

  const submitVote = useCallback((roomId: string, drawingDrawerId: string) => {
    wsService.submitVote(roomId, drawingDrawerId);
    setHasVoted(true);
  }, [setHasVoted]);

  return {
    submitVote,
  };
}
