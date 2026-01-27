import { create } from 'zustand';
import type {
  Room,
  Player,
  GamePhase,
  ChatMessage,
  RoundStartPayload,
  CorrectGuessPayload,
  RoundEndPayload,
  GameOverPayload,
  Reaction,
  DrawingEntry,
  VotingResult,
  TelephoneChainEntry,
} from '../types/game.types';
import type { ConnectionStatus } from '../types/connection.types';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { LIMITS } from '../constants/limits.constants';
import { DEFAULT_GAME_SETTINGS } from '../constants/game.constants';

interface GameStore {
  // Connection
  connectionStatus: ConnectionStatus;
  error: string | null;

  // Room state
  room: Room | null;
  mySessionId: string | null;

  // Game UI state
  countdown: number | null;
  wordOptions: string[] | null;
  currentWordHint: string;
  currentWordLength: number;
  drawTime: number;
  revealWord: string | null;
  closeGuess: boolean;
  roundEndData: RoundEndPayload | null;
  gameOverData: GameOverPayload | null;

  // Chat
  chatMessages: ChatMessage[];

  // Reactions
  activeReactions: Reaction[];

  // Voting
  votingDrawings: DrawingEntry[];
  votingTime: number;
  hasVoted: boolean;
  votingResults: VotingResult[] | null;
  votingWinnerId: string | null;

  // Telephone mode
  telephoneCurrentPlayerId: string | null;
  telephoneCurrentPlayerName: string | null;
  telephonePrompt: string | null;
  telephonePromptType: 'word' | 'guess' | 'drawing' | null;
  telephoneTime: number;
  telephoneRemainingPlayers: number;
  telephoneChain: TelephoneChainEntry[] | null;
  telephoneOriginalWord: string | null;

  // Actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setRoom: (room: Room | null) => void;
  setMySessionId: (sessionId: string) => void;
  updatePlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  setCountdown: (seconds: number) => void;
  setRoundInfo: (info: RoundStartPayload) => void;
  setWordOptions: (words: string[]) => void;
  setDrawingPhase: (drawTime: number, wordLength?: number, wordHint?: string) => void;
  setRevealPhase: (word: string) => void;
  addCorrectGuesser: (data: CorrectGuessPayload) => void;
  setCloseGuess: (value: boolean) => void;
  handleCloseGuess: (playerId: string) => void;
  setRoundEnd: (data: RoundEndPayload) => void;
  setGameOver: (data: GameOverPayload) => void;
  addChatMessage: (message: ChatMessage) => void;
  setHint: (hint: string) => void;
  setSelectedWord: (word: string) => void;
  addReaction: (reaction: Reaction) => void;
  removeReaction: (reactionId: string) => void;
  setVotingStart: (drawings: DrawingEntry[], votingTime: number) => void;
  setHasVoted: (hasVoted: boolean) => void;
  setVotingResults: (results: VotingResult[], winnerId: string) => void;
  setTelephoneDraw: (playerId: string, playerName: string, drawTime: number, remainingPlayers: number) => void;
  setTelephoneGuess: (playerId: string, playerName: string, guessTime: number, remainingPlayers: number) => void;
  setTelephonePrompt: (prompt: string, type: 'word' | 'guess' | 'drawing') => void;
  setTelephoneReveal: (originalWord: string, chain: TelephoneChainEntry[]) => void;
  reset: () => void;

  // Computed helpers
  getMyPlayer: () => Player | null;
  isHost: () => boolean;
  isDrawer: () => boolean;
  getPlayerList: () => Player[];
  getPhase: () => GamePhase;

  // Persistence
  getPersistedSession: () => PersistedSession | null;
  persistSession: (roomId: string, playerName: string) => void;
  clearPersistedSession: () => void;
}

// Persistence types and helpers
interface PersistedSession {
  roomId: string;
  playerName: string;
}

function loadPersistedSession(): PersistedSession | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GAME_SESSION);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function savePersistedSession(roomId: string, playerName: string) {
  localStorage.setItem(STORAGE_KEYS.GAME_SESSION, JSON.stringify({ roomId, playerName }));
}

function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEYS.GAME_SESSION);
}

const initialState = {
  connectionStatus: 'disconnected' as ConnectionStatus,
  error: null,
  room: null,
  mySessionId: null,
  countdown: null,
  wordOptions: null,
  currentWordHint: '',
  currentWordLength: 0,
  drawTime: DEFAULT_GAME_SETTINGS.DRAW_TIME,
  revealWord: null,
  closeGuess: false,
  roundEndData: null,
  gameOverData: null,
  chatMessages: [],
  activeReactions: [],
  votingDrawings: [],
  votingTime: DEFAULT_GAME_SETTINGS.VOTING_TIME,
  hasVoted: false,
  votingResults: null,
  votingWinnerId: null,
  telephoneCurrentPlayerId: null,
  telephoneCurrentPlayerName: null,
  telephonePrompt: null,
  telephonePromptType: null,
  telephoneTime: 60,
  telephoneRemainingPlayers: 0,
  telephoneChain: null,
  telephoneOriginalWord: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  setRoom: (room) =>
    set({
      room,
      countdown: null,
      wordOptions: null,
      closeGuess: false,
      roundEndData: null,
      gameOverData: null,
    }),

  setMySessionId: (sessionId) => set({ mySessionId: sessionId }),

  updatePlayer: (player) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          players: {
            ...state.room.players,
            [player.sessionId]: player,
          },
        },
      };
    }),

  removePlayer: (playerId) =>
    set((state) => {
      if (!state.room) return state;
      const players = { ...state.room.players };
      // Find and remove player by ID
      const sessionId = Object.keys(players).find(
        (sid) => players[sid].id === playerId
      );
      if (sessionId) {
        delete players[sessionId];
      }
      return {
        room: {
          ...state.room,
          players,
        },
      };
    }),

  setCountdown: (seconds) =>
    set((state) => {
      if (!state.room) return { countdown: seconds };
      return {
        countdown: seconds,
        room: {
          ...state.room,
          gameState: {
            ...state.room.gameState,
            phase: 'COUNTDOWN',
          },
        },
      };
    }),

  setRoundInfo: (info) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          gameState: {
            ...state.room.gameState,
            currentRound: info.round,
            currentDrawerId: info.drawerId,
            currentDrawerIds: info.drawerIds || [info.drawerId],
            phase: 'WORD_SELECTION',
          },
        },
        currentWordHint: info.wordHint,
        currentWordLength: info.wordLength,
        countdown: null,
        wordOptions: null,
        closeGuess: false,
      };
    }),

  setWordOptions: (words) =>
    set((state) => {
      if (!state.room) return { wordOptions: words };
      return {
        wordOptions: words,
        room: {
          ...state.room,
          gameState: {
            ...state.room.gameState,
            phase: 'WORD_SELECTION',
          },
        },
      };
    }),

  setDrawingPhase: (drawTime, wordLength, wordHint) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          gameState: {
            ...state.room.gameState,
            phase: 'DRAWING',
          },
        },
        drawTime,
        wordOptions: null,
        currentWordLength: wordLength ?? state.currentWordLength,
        currentWordHint: wordHint ?? state.currentWordHint,
      };
    }),

  setRevealPhase: (word: string) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          gameState: {
            ...state.room.gameState,
            phase: 'REVEAL',
          },
        },
        revealWord: word,
      };
    }),

  addCorrectGuesser: (data) =>
    set((state) => {
      if (!state.room) return state;
      const correctGuessers = [
        ...state.room.gameState.correctGuessers,
        data.playerId,
      ];
      // Update player score and streak
      const players = { ...state.room.players };
      const sessionId = Object.keys(players).find(
        (sid) => players[sid].id === data.playerId
      );
      if (sessionId) {
        players[sessionId] = {
          ...players[sessionId],
          score: players[sessionId].score + data.points,
          currentStreak: data.streak ?? players[sessionId].currentStreak,
        };
      }
      return {
        room: {
          ...state.room,
          players,
          gameState: {
            ...state.room.gameState,
            correctGuessers,
          },
        },
      };
    }),

  // Note: Side effect (auto-clear timeout) moved to useCloseGuessEffect hook
  setCloseGuess: (value: boolean) => set({ closeGuess: value }),

  // Check if close guess applies to current player and set it
  handleCloseGuess: (playerId: string) => {
    const state = get();
    const myPlayer = state.getMyPlayer();
    if (myPlayer && myPlayer.id === playerId) {
      set({ closeGuess: true });
    }
  },

  setRoundEnd: (data) =>
    set((state) => {
      if (!state.room) return state;
      // Update scores from round end data
      const players = { ...state.room.players };
      data.scores.forEach((score) => {
        const sessionId = Object.keys(players).find(
          (sid) => players[sid].id === score.playerId
        );
        if (sessionId) {
          players[sessionId] = {
            ...players[sessionId],
            score: score.score,
          };
        }
      });
      return {
        room: {
          ...state.room,
          players,
          gameState: {
            ...state.room.gameState,
            phase: 'RESULTS',
          },
        },
        roundEndData: data,
        revealWord: data.word,
      };
    }),

  setGameOver: (data) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          gameState: {
            ...state.room.gameState,
            phase: 'GAME_OVER',
          },
        },
        gameOverData: data,
      };
    }),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages.slice(-(LIMITS.MAX_CHAT_MESSAGES - 1)), message],
    })),

  setHint: (hint) => set({ currentWordHint: hint }),

  addReaction: (reaction) =>
    set((state) => ({
      activeReactions: [...state.activeReactions, reaction],
    })),

  removeReaction: (reactionId) =>
    set((state) => ({
      activeReactions: state.activeReactions.filter((r) => r.id !== reactionId),
    })),

  setVotingStart: (drawings, votingTime) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          gameState: {
            ...state.room.gameState,
            phase: 'VOTING',
          },
        },
        votingDrawings: drawings,
        votingTime,
        hasVoted: false,
        votingResults: null,
        votingWinnerId: null,
      };
    }),

  setHasVoted: (hasVoted) => set({ hasVoted }),

  setVotingResults: (results, winnerId) =>
    set({
      votingResults: results,
      votingWinnerId: winnerId,
    }),

  setTelephoneDraw: (playerId, playerName, drawTime, remainingPlayers) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          gameState: {
            ...state.room.gameState,
            phase: 'TELEPHONE_DRAW',
          },
        },
        telephoneCurrentPlayerId: playerId,
        telephoneCurrentPlayerName: playerName,
        telephoneTime: drawTime,
        telephoneRemainingPlayers: remainingPlayers,
        telephonePrompt: null,
        telephonePromptType: null,
      };
    }),

  setTelephoneGuess: (playerId, playerName, guessTime, remainingPlayers) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          gameState: {
            ...state.room.gameState,
            phase: 'TELEPHONE_GUESS',
          },
        },
        telephoneCurrentPlayerId: playerId,
        telephoneCurrentPlayerName: playerName,
        telephoneTime: guessTime,
        telephoneRemainingPlayers: remainingPlayers,
        telephonePrompt: null,
        telephonePromptType: null,
      };
    }),

  setTelephonePrompt: (prompt, type) =>
    set({
      telephonePrompt: prompt,
      telephonePromptType: type,
    }),

  setTelephoneReveal: (originalWord, chain) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          gameState: {
            ...state.room.gameState,
            phase: 'TELEPHONE_REVEAL',
          },
        },
        telephoneOriginalWord: originalWord,
        telephoneChain: chain,
      };
    }),

  setSelectedWord: (word) =>
    set((state) => {
      if (!state.room) return state;
      return {
        room: {
          ...state.room,
          gameState: {
            ...state.room.gameState,
            currentWord: word,
          },
        },
      };
    }),

  reset: () => set(initialState),

  // Computed helpers
  getMyPlayer: () => {
    const state = get();
    if (!state.room || !state.mySessionId) return null;
    return state.room.players[state.mySessionId] || null;
  },

  isHost: () => {
    const state = get();
    if (!state.room || !state.mySessionId) return false;
    return state.room.hostId === state.mySessionId;
  },

  isDrawer: () => {
    const state = get();
    if (!state.room || !state.mySessionId) return false;
    const myPlayer = state.room.players[state.mySessionId];
    if (!myPlayer) return false;
    // Check both single drawer ID (for compatibility) and multiple drawer IDs
    const drawerIds = state.room.gameState.currentDrawerIds || [];
    return drawerIds.includes(myPlayer.id) || myPlayer.id === state.room.gameState.currentDrawerId;
  },

  getPlayerList: () => {
    const state = get();
    if (!state.room) return [];
    return Object.values(state.room.players);
  },

  getPhase: () => {
    const state = get();
    return state.room?.gameState.phase || 'LOBBY';
  },

  // Persistence
  getPersistedSession: () => loadPersistedSession(),
  persistSession: (roomId, playerName) => savePersistedSession(roomId, playerName),
  clearPersistedSession: () => clearStoredSession(),
}));
