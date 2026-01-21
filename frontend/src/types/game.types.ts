// Game phases
export type GamePhase =
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'WORD_SELECTION'
  | 'DRAWING'
  | 'REVEAL'
  | 'RESULTS'
  | 'GAME_OVER';

// Player
export interface Player {
  id: string;
  name: string;
  sessionId: string;
  score: number;
  ready: boolean;
  connected: boolean;
}

// Room settings
export interface RoomSettings {
  maxPlayers: number;
  totalRounds: number;
  drawTime: number;
  revealTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Game state
export interface GameState {
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  currentDrawerId: string | null;
  currentWord: string | null;
  wordOptions: string[] | null;
  drawingBase64: string | null;
  correctGuessers: string[];
  phaseStartTime: number;
  drawerIndex: number;
}

// Room
export interface Room {
  id: string;
  hostId: string;
  players: Record<string, Player>;
  gameState: GameState;
  settings: RoomSettings;
  createdAt: number;
  lastActivity: number;
}

// Chat message
export interface ChatMessage {
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
  system?: boolean;
}

// Draw stroke
export interface DrawStroke {
  type: 'start' | 'move' | 'end';
  points: Array<{ x: number; y: number }>;
  color: string;
  brushSize: number;
  eraser: boolean;
  fill: boolean;
}

// WebSocket events
export type GameEventType =
  | 'ROOM_STATE'
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'COUNTDOWN'
  | 'ROUND_START'
  | 'WORD_OPTIONS'
  | 'DRAWING_PHASE'
  | 'REVEAL_PHASE'
  | 'CORRECT_GUESS'
  | 'CLOSE_GUESS'
  | 'ROUND_END'
  | 'GAME_OVER'
  | 'CHAT'
  | 'HINT'
  | 'ERROR';

export interface GameEvent<T = unknown> {
  type: GameEventType;
  payload: T;
}

// Event payloads
export interface PlayerJoinedPayload {
  room: Room;
  player: Player;
}

export interface PlayerLeftPayload {
  room: Room;
  player: Player;
}

export interface CountdownPayload {
  seconds: number;
}

export interface RoundStartPayload {
  round: number;
  drawerId: string;
  wordLength: number;
  wordHint: string;
}

export interface WordOptionsPayload {
  words: string[];
}

export interface DrawingPhasePayload {
  drawTime: number;
}

export interface RevealPhasePayload {
  drawingBase64: string;
  word: string;
}

export interface CorrectGuessPayload {
  playerId: string;
  playerName: string;
  points: number;
  totalGuessers: number;
}

export interface CloseGuessPayload {
  playerId: string;
}

export interface RoundEndPayload {
  word: string;
  scores: Array<{
    playerId: string;
    playerName: string;
    score: number;
    isDrawer: boolean;
    guessedCorrectly: boolean;
  }>;
}

export interface GameOverPayload {
  finalScores: Array<{
    playerId: string;
    playerName: string;
    score: number;
    rank: number;
  }>;
}

export interface HintPayload {
  hint: string;
}

export interface ErrorPayload {
  message: string;
}

// Room response
export interface RoomResponse {
  success: boolean;
  error?: string;
  room?: Room;
}

// Default settings
export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  maxPlayers: 8,
  totalRounds: 3,
  drawTime: 80,
  revealTime: 30,
  difficulty: 'medium',
};
