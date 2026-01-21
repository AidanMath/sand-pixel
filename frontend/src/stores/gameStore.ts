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
} from '../types/game.types';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

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
  revealDrawing: string | null;
  revealWord: string | null;
  closeGuess: boolean;
  roundEndData: RoundEndPayload | null;
  gameOverData: GameOverPayload | null;

  // Chat
  chatMessages: ChatMessage[];

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
  setDrawingPhase: (drawTime: number) => void;
  setRevealPhase: (drawing: string, word: string) => void;
  addCorrectGuesser: (data: CorrectGuessPayload) => void;
  setCloseGuess: (playerId: string) => void;
  setRoundEnd: (data: RoundEndPayload) => void;
  setGameOver: (data: GameOverPayload) => void;
  addChatMessage: (message: ChatMessage) => void;
  setHint: (hint: string) => void;
  reset: () => void;

  // Computed helpers
  getMyPlayer: () => Player | null;
  isHost: () => boolean;
  isDrawer: () => boolean;
  getPlayerList: () => Player[];
  getPhase: () => GamePhase;
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
  drawTime: 80,
  revealDrawing: null,
  revealWord: null,
  closeGuess: false,
  roundEndData: null,
  gameOverData: null,
  chatMessages: [],
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

  setCountdown: (seconds) => set({ countdown: seconds }),

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
          },
        },
        currentWordHint: info.wordHint,
        currentWordLength: info.wordLength,
        countdown: null,
        wordOptions: null,
        closeGuess: false,
      };
    }),

  setWordOptions: (words) => set({ wordOptions: words }),

  setDrawingPhase: (drawTime) =>
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
      };
    }),

  setRevealPhase: (drawing, word) =>
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
        revealDrawing: drawing,
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
      // Update player score
      const players = { ...state.room.players };
      const sessionId = Object.keys(players).find(
        (sid) => players[sid].id === data.playerId
      );
      if (sessionId) {
        players[sessionId] = {
          ...players[sessionId],
          score: players[sessionId].score + data.points,
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

  setCloseGuess: (playerId) => {
    const state = get();
    const myPlayer = state.getMyPlayer();
    if (myPlayer && myPlayer.id === playerId) {
      set({ closeGuess: true });
      // Clear after 2 seconds
      setTimeout(() => set({ closeGuess: false }), 2000);
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
      chatMessages: [...state.chatMessages.slice(-99), message],
    })),

  setHint: (hint) => set({ currentWordHint: hint }),

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
    return myPlayer?.id === state.room.gameState.currentDrawerId;
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
}));
