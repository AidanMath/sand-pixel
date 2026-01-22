/**
 * Hook to handle close guess auto-clearing side effect
 * Separates side effects from store actions following best practices
 */

import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';

const CLOSE_GUESS_DISPLAY_MS = 2000;

/**
 * Auto-clears close guess warning after timeout
 * Should be used in a component that's rendered during the guessing phase
 */
export function useCloseGuessEffect() {
  const closeGuess = useGameStore((state) => state.closeGuess);
  const setCloseGuess = useGameStore((state) => state.setCloseGuess);

  useEffect(() => {
    if (closeGuess) {
      const timer = setTimeout(() => {
        setCloseGuess(false);
      }, CLOSE_GUESS_DISPLAY_MS);

      return () => clearTimeout(timer);
    }
  }, [closeGuess, setCloseGuess]);
}
