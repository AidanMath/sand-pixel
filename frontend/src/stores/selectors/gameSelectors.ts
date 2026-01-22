/**
 * Game state selectors
 * Provides memoized access to game phase and round information
 */

import { useGameStore } from '../gameStore';
import type { GamePhase } from '../../types/game.types';

/** Get current game phase */
export function useGamePhase(): GamePhase {
  return useGameStore((state) => state.room?.gameState.phase || 'LOBBY');
}

/** Check if game is in an active playing phase */
export function useIsActivePhase(): boolean {
  return useGameStore((state) => {
    const phase = state.room?.gameState.phase;
    return phase === 'DRAWING' || phase === 'REVEAL';
  });
}

/** Check if game is in lobby phase */
export function useIsLobbyPhase(): boolean {
  return useGameStore((state) => {
    return !state.room || state.room.gameState.phase === 'LOBBY';
  });
}

/** Get current round info */
export function useRoundInfo(): { current: number; total: number; percentage: number } {
  return useGameStore((state) => {
    if (!state.room) return { current: 0, total: 0, percentage: 0 };
    const { currentRound } = state.room.gameState;
    const { totalRounds } = state.room.settings;
    return {
      current: currentRound,
      total: totalRounds,
      percentage: totalRounds > 0 ? Math.round((currentRound / totalRounds) * 100) : 0,
    };
  });
}

/** Get word display (hint or underscores) */
export function useWordDisplay(): string {
  return useGameStore((state) => {
    const { currentWordHint, currentWordLength } = state;
    if (currentWordHint) return currentWordHint;
    if (currentWordLength > 0) {
      return '_'.repeat(currentWordLength).split('').join(' ');
    }
    return '';
  });
}

/** Check if current player can guess */
export function useCanGuess(): boolean {
  return useGameStore((state) => {
    if (!state.room || !state.mySessionId) return false;
    const myPlayer = state.room.players[state.mySessionId];
    const { phase, currentDrawerId, correctGuessers } = state.room.gameState;
    return (
      phase === 'DRAWING' &&
      myPlayer?.id !== currentDrawerId &&
      !correctGuessers.includes(myPlayer?.id || '')
    );
  });
}

/** Get draw time remaining */
export function useDrawTime(): number {
  return useGameStore((state) => state.drawTime);
}

/** Get countdown seconds */
export function useCountdown(): number | null {
  return useGameStore((state) => state.countdown);
}

/** Get word options for drawer */
export function useWordOptions(): string[] | null {
  return useGameStore((state) => state.wordOptions);
}

/** Get reveal word */
export function useRevealWord(): string | null {
  return useGameStore((state) => state.revealWord);
}

/** Get close guess warning state */
export function useCloseGuess(): boolean {
  return useGameStore((state) => state.closeGuess);
}

/** Get round end data */
export function useRoundEndData() {
  return useGameStore((state) => state.roundEndData);
}

/** Get game over data */
export function useGameOverData() {
  return useGameStore((state) => state.gameOverData);
}
