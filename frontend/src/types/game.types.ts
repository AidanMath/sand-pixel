import { DEFAULT_GAME_SETTINGS } from '../constants';

// Game phases
export type GamePhase =
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'WORD_SELECTION'
  | 'DRAWING'
  | 'REVEAL'
  | 'RESULTS'
  | 'GAME_OVER'
  | 'VOTING'
  | 'TELEPHONE_DRAW'
  | 'TELEPHONE_GUESS'
  | 'TELEPHONE_REVEAL';

// Player
export interface Player {
  id: string;
  name: string;
  sessionId: string;
  score: number;
  ready: boolean;
  connected: boolean;
  currentStreak: number;
  maxStreak: number;
}

// Game modes
export type GameMode = 'CLASSIC' | 'COLLABORATIVE' | 'TELEPHONE';

// Room settings
export interface RoomSettings {
  maxPlayers: number;
  totalRounds: number;
  drawTime: number;
  revealTime: number;
  gameMode: GameMode;
  collaborativeDrawerCount: number;
}

// Game state
export interface GameState {
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  currentDrawerId: string | null;
  currentDrawerIds: string[];
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
  | 'WORD_SELECTED'
  | 'DRAWING_PHASE'
  | 'REVEAL_PHASE'
  | 'CORRECT_GUESS'
  | 'CLOSE_GUESS'
  | 'ROUND_END'
  | 'GAME_OVER'
  | 'CHAT'
  | 'HINT'
  | 'ERROR'
  | 'REACTION'
  | 'VOTING_START'
  | 'VOTE_RECEIVED'
  | 'VOTING_RESULTS'
  | 'TELEPHONE_DRAW'
  | 'TELEPHONE_GUESS'
  | 'TELEPHONE_PROMPT'
  | 'TELEPHONE_REVEAL';

// Allowed emojis for reactions
export const ALLOWED_EMOJIS = ['👍', '👏', '😂', '🔥', '❤️', '😮', '🤔', '😭', '💀', '🎨'] as const;
export type AllowedEmoji = typeof ALLOWED_EMOJIS[number];

// Reaction
export interface Reaction {
  id: string;
  playerId: string;
  playerName: string;
  emoji: string;
  timestamp: number;
}

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
  drawerIds: string[];
  wordLength: number;
  wordHint: string;
}

export interface WordOptionsPayload {
  words: string[];
}

export interface WordSelectedPayload {
  word: string;
}

export interface DrawingPhasePayload {
  drawTime: number;
  wordLength: number;
  wordHint: string;
}

export interface RevealPhasePayload {
  word: string;
}

export interface CorrectGuessPayload {
  playerId: string;
  playerName: string;
  points: number;
  totalGuessers: number;
  streak: number;
  multiplier: number;
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
    currentStreak: number;
  }>;
}

export interface GameOverPayload {
  finalScores: Array<{
    playerId: string;
    playerName: string;
    score: number;
    rank: number;
    maxStreak: number;
  }>;
}

export interface HintPayload {
  hint: string;
}

export interface ErrorPayload {
  message: string;
}

export interface ReactionPayload {
  playerId: string;
  playerName: string;
  emoji: string;
  timestamp: number;
}

// Voting types
export interface DrawingEntry {
  drawerId: string;
  drawerName: string;
  word: string;
  drawingBase64: string;
}

export interface VotingStartPayload {
  drawings: DrawingEntry[];
  votingTime: number;
}

export interface VoteReceivedPayload {
  voterId: string;
  voterName: string;
  totalVotes: number;
  totalPlayers: number;
}

export interface VotingResult {
  drawerId: string;
  drawerName: string;
  word: string;
  votes: number;
  isWinner: boolean;
}

export interface VotingResultsPayload {
  results: VotingResult[];
  winnerId: string;
  bonusPoints: number;
}

// Telephone mode types
export interface TelephoneDrawPayload {
  playerId: string;
  playerName: string;
  drawTime: number;
  remainingPlayers: number;
}

export interface TelephoneGuessPayload {
  playerId: string;
  playerName: string;
  guessTime: number;
  remainingPlayers: number;
}

export interface TelephonePromptPayload {
  prompt: string;
  type: 'word' | 'guess' | 'drawing';
}

export interface TelephoneChainEntry {
  type: 'word' | 'draw' | 'guess';
  content: string;
  playerId: string;
  playerName: string;
}

export interface TelephoneRevealPayload {
  originalWord: string;
  chain: TelephoneChainEntry[];
}

// Room response
export interface RoomResponse {
  success: boolean;
  error?: string;
  room?: Room;
  sessionId?: string;
}

// Default settings - uses constants for single source of truth
export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  maxPlayers: DEFAULT_GAME_SETTINGS.MAX_PLAYERS,
  totalRounds: DEFAULT_GAME_SETTINGS.ROUNDS,
  drawTime: DEFAULT_GAME_SETTINGS.DRAW_TIME,
  revealTime: DEFAULT_GAME_SETTINGS.REVEAL_TIME,
  gameMode: 'CLASSIC',
  collaborativeDrawerCount: 2,
};
