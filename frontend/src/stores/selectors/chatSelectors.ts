/**
 * Chat selectors
 * Provides memoized access to chat messages
 */

import { useGameStore } from '../gameStore';
import type { ChatMessage } from '../../types/game.types';

/** Get all chat messages */
export function useChatMessages(): ChatMessage[] {
  return useGameStore((state) => state.chatMessages);
}

/** Get recent messages (last N) */
export function useRecentMessages(count: number = 10): ChatMessage[] {
  return useGameStore((state) => state.chatMessages.slice(-count));
}

/** Get system messages only */
export function useSystemMessages(): ChatMessage[] {
  return useGameStore((state) => state.chatMessages.filter((m) => m.system));
}

/** Get player messages only */
export function usePlayerMessages(): ChatMessage[] {
  return useGameStore((state) => state.chatMessages.filter((m) => !m.system));
}

/** Get message count */
export function useMessageCount(): number {
  return useGameStore((state) => state.chatMessages.length);
}
