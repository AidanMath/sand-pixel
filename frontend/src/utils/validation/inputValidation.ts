/**
 * Input validation utilities for WebSocket messages.
 * Validates user input before sending to prevent malformed data
 * and provide early feedback.
 */

// Constants for validation limits
export const LIMITS = {
  PLAYER_NAME_MIN: 1,
  PLAYER_NAME_MAX: 20,
  ROOM_CODE_LENGTH: 6,
  GUESS_MAX_LENGTH: 100,
  CHAT_MAX_LENGTH: 200,
  ALLOWED_EMOJIS: ['👍', '👏', '😂', '🔥', '❤️', '😮', '🤔', '😭', '💀', '🎨'],
  MAX_DRAWING_SIZE_BYTES: 512 * 1024, // 512KB
  WORD_OPTIONS_COUNT: 3,
} as const;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates player name
 */
export function validatePlayerName(name: string | undefined | null): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length < LIMITS.PLAYER_NAME_MIN) {
    return { valid: false, error: 'Name cannot be empty' };
  }

  if (trimmed.length > LIMITS.PLAYER_NAME_MAX) {
    return { valid: false, error: `Name must be ${LIMITS.PLAYER_NAME_MAX} characters or less` };
  }

  // Check for potentially problematic characters (basic XSS prevention)
  if (/<|>|script/i.test(trimmed)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Validates room code format
 */
export function validateRoomCode(roomId: string | undefined | null): ValidationResult {
  if (!roomId || typeof roomId !== 'string') {
    return { valid: false, error: 'Room code is required' };
  }

  const trimmed = roomId.trim().toUpperCase();

  if (trimmed.length !== LIMITS.ROOM_CODE_LENGTH) {
    return { valid: false, error: `Room code must be ${LIMITS.ROOM_CODE_LENGTH} characters` };
  }

  // Room codes are alphanumeric (excluding confusing characters like 0, O, I, 1)
  if (!/^[A-HJ-NP-Z2-9]+$/.test(trimmed)) {
    return { valid: false, error: 'Invalid room code format' };
  }

  return { valid: true };
}

/**
 * Validates guess/chat text input
 */
export function validateTextInput(
  text: string | undefined | null,
  maxLength: number = LIMITS.GUESS_MAX_LENGTH
): ValidationResult {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Text is required' };
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Text cannot be empty' };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Text must be ${maxLength} characters or less` };
  }

  return { valid: true };
}

/**
 * Validates emoji reaction
 */
export function validateEmoji(emoji: string | undefined | null): ValidationResult {
  if (!emoji || typeof emoji !== 'string') {
    return { valid: false, error: 'Emoji is required' };
  }

  if (!LIMITS.ALLOWED_EMOJIS.includes(emoji)) {
    return { valid: false, error: 'Invalid emoji' };
  }

  return { valid: true };
}

/**
 * Validates word selection index
 */
export function validateWordIndex(index: number | undefined | null): ValidationResult {
  if (index === undefined || index === null || typeof index !== 'number') {
    return { valid: false, error: 'Word index is required' };
  }

  if (!Number.isInteger(index) || index < 0 || index >= LIMITS.WORD_OPTIONS_COUNT) {
    return { valid: false, error: 'Invalid word selection' };
  }

  return { valid: true };
}

/**
 * Validates drawing data (base64)
 */
export function validateDrawingData(data: string | undefined | null): ValidationResult {
  if (!data || typeof data !== 'string') {
    return { valid: false, error: 'Drawing data is required' };
  }

  // Check if it looks like base64 data URL
  if (!data.startsWith('data:image/')) {
    return { valid: false, error: 'Invalid drawing format' };
  }

  // Check size limit
  const sizeInBytes = Math.ceil((data.length * 3) / 4);
  if (sizeInBytes > LIMITS.MAX_DRAWING_SIZE_BYTES) {
    return { valid: false, error: 'Drawing is too large' };
  }

  return { valid: true };
}

/**
 * Validates player/drawer ID format
 */
export function validatePlayerId(id: string | undefined | null): ValidationResult {
  if (id === null || id === undefined || typeof id !== 'string') {
    return { valid: false, error: 'Player ID is required' };
  }

  // Empty string check (before trim)
  if (id === '') {
    return { valid: false, error: 'Player ID is required' };
  }

  if (id.trim().length === 0) {
    return { valid: false, error: 'Player ID cannot be empty' };
  }

  // IDs are typically 8-char UUIDs or similar
  if (id.length > 50) {
    return { valid: false, error: 'Invalid player ID' };
  }

  return { valid: true };
}

/**
 * Validates draw stroke data structure
 */
export function validateDrawStroke(stroke: unknown): ValidationResult {
  if (!stroke || typeof stroke !== 'object') {
    return { valid: false, error: 'Stroke data is required' };
  }

  const s = stroke as Record<string, unknown>;

  // Check required fields exist
  if (!Array.isArray(s.points) || s.points.length === 0) {
    return { valid: false, error: 'Stroke must have points' };
  }

  if (typeof s.color !== 'string' || !s.color) {
    return { valid: false, error: 'Stroke must have a color' };
  }

  if (typeof s.size !== 'number' || s.size <= 0) {
    return { valid: false, error: 'Stroke must have a valid size' };
  }

  // Validate color format (hex or named)
  if (!/^#[0-9A-Fa-f]{6}$|^#[0-9A-Fa-f]{3}$|^[a-z]+$/i.test(s.color)) {
    return { valid: false, error: 'Invalid color format' };
  }

  // Validate points are numbers
  for (const point of s.points) {
    if (typeof point !== 'object' || point === null) {
      return { valid: false, error: 'Invalid point data' };
    }
    const p = point as Record<string, unknown>;
    if (typeof p.x !== 'number' || typeof p.y !== 'number') {
      return { valid: false, error: 'Points must have x and y coordinates' };
    }
  }

  return { valid: true };
}
