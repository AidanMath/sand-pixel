/**
 * Application limits and thresholds
 * Consolidates magic numbers for limits throughout the application
 */

export const LIMITS = {
  /** Maximum number of sand grains allowed */
  MAX_GRAINS: 200000,
  /** Minimum time between grain spawns (ms) */
  SPAWN_THROTTLE_MS: 50,
  /** Maximum undo stack depth */
  MAX_UNDO_STACK: 10,
  /** Maximum chat messages to keep */
  MAX_CHAT_MESSAGES: 100,
  /** Maximum WebSocket reconnection attempts */
  MAX_RECONNECT_ATTEMPTS: 5,
  /** Reconnection delay (ms) */
  RECONNECT_DELAY_MS: 1000,
} as const;
