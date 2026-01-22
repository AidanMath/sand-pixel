/**
 * Discriminated union types for game events
 * Provides type-safe event handling without unsafe casts
 */

import type {
  Room,
  Player,
  ChatMessage,
  PlayerJoinedPayload,
  PlayerLeftPayload,
  CountdownPayload,
  RoundStartPayload,
  WordOptionsPayload,
  WordSelectedPayload,
  DrawingPhasePayload,
  RevealPhasePayload,
  CorrectGuessPayload,
  CloseGuessPayload,
  RoundEndPayload,
  GameOverPayload,
  HintPayload,
  ErrorPayload,
} from './game.types';

/**
 * Discriminated union of all game events
 * Each event type has a specific payload type, eliminating unsafe casts
 */
export type GameEventUnion =
  | { type: 'ROOM_STATE'; payload: Room }
  | { type: 'PLAYER_JOINED'; payload: PlayerJoinedPayload }
  | { type: 'PLAYER_LEFT'; payload: PlayerLeftPayload }
  | { type: 'COUNTDOWN'; payload: CountdownPayload }
  | { type: 'ROUND_START'; payload: RoundStartPayload }
  | { type: 'WORD_OPTIONS'; payload: WordOptionsPayload }
  | { type: 'WORD_SELECTED'; payload: WordSelectedPayload }
  | { type: 'DRAWING_PHASE'; payload: DrawingPhasePayload }
  | { type: 'REVEAL_PHASE'; payload: RevealPhasePayload }
  | { type: 'CORRECT_GUESS'; payload: CorrectGuessPayload }
  | { type: 'CLOSE_GUESS'; payload: CloseGuessPayload }
  | { type: 'ROUND_END'; payload: RoundEndPayload }
  | { type: 'GAME_OVER'; payload: GameOverPayload }
  | { type: 'CHAT'; payload: ChatMessage }
  | { type: 'HINT'; payload: HintPayload }
  | { type: 'ERROR'; payload: ErrorPayload };

/**
 * Type guard to check if an event matches a specific type
 * Usage: if (isEventType(event, 'ROOM_STATE')) { event.payload // typed as Room }
 */
export function isEventType<T extends GameEventUnion['type']>(
  event: GameEventUnion,
  type: T
): event is Extract<GameEventUnion, { type: T }> {
  return event.type === type;
}

/**
 * Extract payload type for a given event type
 */
export type EventPayload<T extends GameEventUnion['type']> = Extract<
  GameEventUnion,
  { type: T }
>['payload'];

/**
 * Event handler function type for a specific event
 */
export type EventHandler<T extends GameEventUnion['type']> = (
  payload: EventPayload<T>
) => void;

/**
 * Map of event type to handler function
 */
export type EventHandlerMap = {
  [K in GameEventUnion['type']]?: EventHandler<K>;
};
