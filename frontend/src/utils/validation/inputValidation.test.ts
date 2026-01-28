import { describe, it, expect } from 'vitest';
import {
  validatePlayerName,
  validateRoomCode,
  validateTextInput,
  validateEmoji,
  validateWordIndex,
  validateDrawingData,
  validatePlayerId,
  validateDrawStroke,
  LIMITS,
} from './inputValidation';

describe('inputValidation', () => {
  describe('validatePlayerName', () => {
    it('returns valid for normal names', () => {
      expect(validatePlayerName('John')).toEqual({ valid: true });
      expect(validatePlayerName('Player 1')).toEqual({ valid: true });
      expect(validatePlayerName('A')).toEqual({ valid: true });
    });

    it('returns invalid for empty or null names', () => {
      expect(validatePlayerName('')).toEqual({ valid: false, error: 'Name is required' });
      expect(validatePlayerName('   ')).toEqual({ valid: false, error: 'Name cannot be empty' });
      expect(validatePlayerName(null)).toEqual({ valid: false, error: 'Name is required' });
      expect(validatePlayerName(undefined)).toEqual({ valid: false, error: 'Name is required' });
    });

    it('returns invalid for names too long', () => {
      const longName = 'a'.repeat(LIMITS.PLAYER_NAME_MAX + 1);
      const result = validatePlayerName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('characters or less');
    });

    it('returns invalid for names with script tags or HTML', () => {
      // Short names with HTML characters
      expect(validatePlayerName('John<')).toEqual({
        valid: false,
        error: 'Name contains invalid characters',
      });
      expect(validatePlayerName('<b>Bob</b>')).toEqual({
        valid: false,
        error: 'Name contains invalid characters',
      });
      expect(validatePlayerName('a>b')).toEqual({
        valid: false,
        error: 'Name contains invalid characters',
      });
    });
  });

  describe('validateRoomCode', () => {
    it('returns valid for correct room codes', () => {
      // Room codes use A-H, J-N, P-Z, 2-9 (excluding 0, 1, I, O to avoid confusion)
      expect(validateRoomCode('ABC234')).toEqual({ valid: true });
      expect(validateRoomCode('XYZNPQ')).toEqual({ valid: true });
      expect(validateRoomCode('abc234')).toEqual({ valid: true }); // case insensitive
      expect(validateRoomCode('HJK789')).toEqual({ valid: true });
    });

    it('returns invalid for wrong length', () => {
      expect(validateRoomCode('ABC')).toEqual({
        valid: false,
        error: 'Room code must be 6 characters',
      });
      expect(validateRoomCode('ABCDEFGH')).toEqual({
        valid: false,
        error: 'Room code must be 6 characters',
      });
    });

    it('returns invalid for codes with ambiguous characters', () => {
      // 0, O, I, 1 are excluded to avoid confusion
      expect(validateRoomCode('ABC0DE').valid).toBe(false);
      expect(validateRoomCode('OOOIII').valid).toBe(false);
      expect(validateRoomCode('111111').valid).toBe(false);
    });

    it('returns invalid for null/empty', () => {
      expect(validateRoomCode(null)).toEqual({ valid: false, error: 'Room code is required' });
      expect(validateRoomCode('')).toEqual({ valid: false, error: 'Room code is required' });
    });
  });

  describe('validateTextInput', () => {
    it('returns valid for normal text', () => {
      expect(validateTextInput('hello')).toEqual({ valid: true });
      expect(validateTextInput('This is a guess!')).toEqual({ valid: true });
    });

    it('returns invalid for empty text', () => {
      expect(validateTextInput('')).toEqual({ valid: false, error: 'Text is required' });
      expect(validateTextInput('   ')).toEqual({ valid: false, error: 'Text cannot be empty' });
      expect(validateTextInput(null)).toEqual({ valid: false, error: 'Text is required' });
    });

    it('returns invalid for text exceeding max length', () => {
      const longText = 'a'.repeat(LIMITS.GUESS_MAX_LENGTH + 1);
      const result = validateTextInput(longText);
      expect(result.valid).toBe(false);
    });

    it('respects custom max length', () => {
      expect(validateTextInput('hello', 3)).toEqual({
        valid: false,
        error: 'Text must be 3 characters or less',
      });
      expect(validateTextInput('hi', 3)).toEqual({ valid: true });
    });
  });

  describe('validateEmoji', () => {
    it('returns valid for allowed emojis', () => {
      expect(validateEmoji('👍')).toEqual({ valid: true });
      expect(validateEmoji('🔥')).toEqual({ valid: true });
      expect(validateEmoji('😂')).toEqual({ valid: true });
    });

    it('returns invalid for non-allowed emojis', () => {
      expect(validateEmoji('🚀')).toEqual({ valid: false, error: 'Invalid emoji' });
      expect(validateEmoji('💩')).toEqual({ valid: false, error: 'Invalid emoji' });
    });

    it('returns invalid for non-emoji strings', () => {
      expect(validateEmoji('hello')).toEqual({ valid: false, error: 'Invalid emoji' });
      expect(validateEmoji('')).toEqual({ valid: false, error: 'Emoji is required' });
      expect(validateEmoji(null)).toEqual({ valid: false, error: 'Emoji is required' });
    });
  });

  describe('validateWordIndex', () => {
    it('returns valid for valid indices', () => {
      expect(validateWordIndex(0)).toEqual({ valid: true });
      expect(validateWordIndex(1)).toEqual({ valid: true });
      expect(validateWordIndex(2)).toEqual({ valid: true });
    });

    it('returns invalid for out of range indices', () => {
      expect(validateWordIndex(-1)).toEqual({ valid: false, error: 'Invalid word selection' });
      expect(validateWordIndex(3)).toEqual({ valid: false, error: 'Invalid word selection' });
      expect(validateWordIndex(100)).toEqual({ valid: false, error: 'Invalid word selection' });
    });

    it('returns invalid for non-integer values', () => {
      expect(validateWordIndex(1.5)).toEqual({ valid: false, error: 'Invalid word selection' });
      expect(validateWordIndex(null)).toEqual({ valid: false, error: 'Word index is required' });
      expect(validateWordIndex(undefined)).toEqual({ valid: false, error: 'Word index is required' });
    });
  });

  describe('validateDrawingData', () => {
    it('returns valid for proper base64 image data', () => {
      const smallBase64 = 'data:image/png;base64,iVBORw0KGgo=';
      expect(validateDrawingData(smallBase64)).toEqual({ valid: true });
    });

    it('returns invalid for non-data-url strings', () => {
      expect(validateDrawingData('not-a-data-url')).toEqual({
        valid: false,
        error: 'Invalid drawing format',
      });
      expect(validateDrawingData('http://example.com/image.png')).toEqual({
        valid: false,
        error: 'Invalid drawing format',
      });
    });

    it('returns invalid for empty/null data', () => {
      expect(validateDrawingData('')).toEqual({ valid: false, error: 'Drawing data is required' });
      expect(validateDrawingData(null)).toEqual({ valid: false, error: 'Drawing data is required' });
    });

    it('returns invalid for data exceeding size limit', () => {
      // Create a string that exceeds 512KB
      const largeData = 'data:image/png;base64,' + 'A'.repeat(700 * 1024);
      const result = validateDrawingData(largeData);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Drawing is too large');
    });
  });

  describe('validatePlayerId', () => {
    it('returns valid for normal player IDs', () => {
      expect(validatePlayerId('abc12345')).toEqual({ valid: true });
      expect(validatePlayerId('player-uuid-here')).toEqual({ valid: true });
    });

    it('returns invalid for empty/null IDs', () => {
      expect(validatePlayerId('')).toEqual({ valid: false, error: 'Player ID is required' });
      expect(validatePlayerId('   ')).toEqual({ valid: false, error: 'Player ID cannot be empty' });
      expect(validatePlayerId(null)).toEqual({ valid: false, error: 'Player ID is required' });
    });

    it('returns invalid for very long IDs', () => {
      const longId = 'a'.repeat(51);
      expect(validatePlayerId(longId)).toEqual({ valid: false, error: 'Invalid player ID' });
    });
  });

  describe('validateDrawStroke', () => {
    it('returns valid for proper stroke data', () => {
      const stroke = {
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        color: '#FF0000',
        size: 5,
      };
      expect(validateDrawStroke(stroke)).toEqual({ valid: true });
    });

    it('returns valid for named colors', () => {
      const stroke = {
        points: [{ x: 0, y: 0 }],
        color: 'red',
        size: 3,
      };
      expect(validateDrawStroke(stroke)).toEqual({ valid: true });
    });

    it('returns invalid for missing points', () => {
      expect(validateDrawStroke({ color: '#FF0000', size: 5 })).toEqual({
        valid: false,
        error: 'Stroke must have points',
      });
      expect(validateDrawStroke({ points: [], color: '#FF0000', size: 5 })).toEqual({
        valid: false,
        error: 'Stroke must have points',
      });
    });

    it('returns invalid for missing color', () => {
      expect(validateDrawStroke({ points: [{ x: 0, y: 0 }], size: 5 })).toEqual({
        valid: false,
        error: 'Stroke must have a color',
      });
    });

    it('returns invalid for missing size', () => {
      expect(validateDrawStroke({ points: [{ x: 0, y: 0 }], color: '#FF0000' })).toEqual({
        valid: false,
        error: 'Stroke must have a valid size',
      });
    });

    it('returns invalid for invalid point coordinates', () => {
      const stroke = {
        points: [{ x: 'not a number', y: 10 }],
        color: '#FF0000',
        size: 5,
      };
      expect(validateDrawStroke(stroke)).toEqual({
        valid: false,
        error: 'Points must have x and y coordinates',
      });
    });

    it('returns invalid for null/undefined stroke', () => {
      expect(validateDrawStroke(null)).toEqual({ valid: false, error: 'Stroke data is required' });
      expect(validateDrawStroke(undefined)).toEqual({ valid: false, error: 'Stroke data is required' });
    });
  });
});
