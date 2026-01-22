/**
 * Game actions facade hook
 * Composes domain-specific action hooks for backward compatibility
 *
 * For new code, prefer importing domain-specific hooks directly:
 * - useRoomActions: createRoom, joinRoom, leaveRoom
 * - useLobbyActions: toggleReady, startGame
 * - useDrawingActions: sendDrawStroke, submitDrawing
 * - useWordActions: selectWord
 * - useChatActions: sendGuess, sendChat
 */

import { useRoomActions } from './actions/useRoomActions';
import { useLobbyActions } from './actions/useLobbyActions';
import { useDrawingActions } from './actions/useDrawingActions';
import { useWordActions } from './actions/useWordActions';
import { useChatActions } from './actions/useChatActions';

export function useGameActions() {
  const roomActions = useRoomActions();
  const lobbyActions = useLobbyActions();
  const drawingActions = useDrawingActions();
  const wordActions = useWordActions();
  const chatActions = useChatActions();

  return {
    ...roomActions,
    ...lobbyActions,
    ...drawingActions,
    ...wordActions,
    ...chatActions,
  };
}

// Re-export individual hooks for direct usage
export { useRoomActions } from './actions/useRoomActions';
export { useLobbyActions } from './actions/useLobbyActions';
export { useDrawingActions } from './actions/useDrawingActions';
export { useWordActions } from './actions/useWordActions';
export { useChatActions } from './actions/useChatActions';
