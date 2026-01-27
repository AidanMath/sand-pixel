/**
 * Game-related constants
 * Consolidates game settings defaults and thresholds
 */

/** Timer thresholds */
export const TIMER = {
  /** Time threshold (seconds) to consider "low time" - triggers warning UI */
  LOW_TIME_THRESHOLD: 10,
  /** Percentage thresholds for timer bar color changes */
  BAR_WARNING_PERCENT: 50,
  BAR_DANGER_PERCENT: 25,
} as const;

/** Default game settings */
export const DEFAULT_GAME_SETTINGS = {
  /** Default time for drawing phase (seconds) */
  DRAW_TIME: 80,
  /** Default time for reveal phase (seconds) */
  REVEAL_TIME: 30,
  /** Default time for results phase (seconds) */
  RESULTS_TIME: 10,
  /** Default time for voting phase (seconds) */
  VOTING_TIME: 30,
  /** Default number of rounds */
  ROUNDS: 3,
  /** Maximum players per room */
  MAX_PLAYERS: 10,
} as const;

/** Room code configuration */
export const ROOM_CODE = {
  /** Length of room codes */
  LENGTH: 4,
} as const;

/** Reaction system constants */
export const REACTIONS = {
  /** How long reactions stay visible (ms) */
  DISPLAY_DURATION_MS: 2000,
  /** Allowed reaction emojis */
  ALLOWED_EMOJIS: ['👍', '👏', '😂', '🔥', '❤️', '😮', '🤔', '😭', '💀', '🎨'] as const,
} as const;
