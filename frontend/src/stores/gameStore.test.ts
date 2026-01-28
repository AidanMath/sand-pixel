/**
 * Unit tests for gameStore
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from './gameStore';
import type { Room, Player, GameState, RoomSettings } from '../types/game.types';

// Create a minimal mock room for testing
function createMockRoom(overrides: Partial<Room> = {}): Room {
  const defaultSettings: RoomSettings = {
    maxPlayers: 8,
    totalRounds: 3,
    drawTime: 80,
    revealTime: 5,
    gameMode: 'CLASSIC',
    collaborativeDrawerCount: 2,
  };

  const defaultGameState: GameState = {
    phase: 'LOBBY',
    currentRound: 0,
    totalRounds: 3,
    currentDrawerId: null,
    currentDrawerIds: [],
    currentWord: null,
    wordOptions: null,
    drawingBase64: null,
    correctGuessers: [],
    phaseStartTime: Date.now(),
    drawerIndex: 0,
  };

  return {
    id: 'test-room-id',
    hostId: 'host-session-id',
    players: {},
    gameState: defaultGameState,
    settings: defaultSettings,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    ...overrides,
  };
}

function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player-1',
    name: 'TestPlayer',
    sessionId: 'session-1',
    score: 0,
    ready: false,
    connected: true,
    currentStreak: 0,
    maxStreak: 0,
    ...overrides,
  };
}

describe('gameStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useGameStore.getState().reset();
  });

  describe('Connection Management', () => {
    it('setConnectionStatus updates connection status', () => {
      const store = useGameStore.getState();

      expect(store.connectionStatus).toBe('disconnected');

      store.setConnectionStatus('connecting');
      expect(useGameStore.getState().connectionStatus).toBe('connecting');

      store.setConnectionStatus('connected');
      expect(useGameStore.getState().connectionStatus).toBe('connected');
    });

    it('setError sets error message', () => {
      const store = useGameStore.getState();

      store.setError('Connection failed');
      expect(useGameStore.getState().error).toBe('Connection failed');
    });

    it('clearError clears error message', () => {
      const store = useGameStore.getState();

      store.setError('Some error');
      expect(useGameStore.getState().error).toBe('Some error');

      store.clearError();
      expect(useGameStore.getState().error).toBeNull();
    });
  });

  describe('Room Management', () => {
    it('setRoom sets room state', () => {
      const store = useGameStore.getState();
      const room = createMockRoom();

      store.setRoom(room);
      expect(useGameStore.getState().room).toEqual(room);
    });

    it('setRoom resets game state', () => {
      const store = useGameStore.getState();

      // Set some game state
      store.setCountdown(3);
      store.setWordOptions(['cat', 'dog', 'bird']);

      // Set new room
      const room = createMockRoom();
      store.setRoom(room);

      expect(useGameStore.getState().countdown).toBeNull();
      expect(useGameStore.getState().wordOptions).toBeNull();
    });

    it('setMySessionId sets session ID', () => {
      const store = useGameStore.getState();

      store.setMySessionId('my-session-id');
      expect(useGameStore.getState().mySessionId).toBe('my-session-id');
    });
  });

  describe('Player Management', () => {
    it('updatePlayer adds or updates a player', () => {
      const store = useGameStore.getState();
      const room = createMockRoom();
      store.setRoom(room);

      const player = createMockPlayer({ sessionId: 'player-session' });
      store.updatePlayer(player);

      expect(useGameStore.getState().room?.players['player-session']).toEqual(player);
    });

    it('removePlayer removes a player by ID', () => {
      const store = useGameStore.getState();
      const player = createMockPlayer({ id: 'player-to-remove', sessionId: 'session-to-remove' });
      const room = createMockRoom({
        players: { 'session-to-remove': player },
      });
      store.setRoom(room);

      store.removePlayer('player-to-remove');

      expect(useGameStore.getState().room?.players['session-to-remove']).toBeUndefined();
    });
  });

  describe('Phase Transitions', () => {
    it('setCountdown sets phase to COUNTDOWN', () => {
      const store = useGameStore.getState();
      store.setRoom(createMockRoom());

      store.setCountdown(3);

      expect(useGameStore.getState().countdown).toBe(3);
      expect(useGameStore.getState().room?.gameState.phase).toBe('COUNTDOWN');
    });

    it('setRoundInfo sets phase to WORD_SELECTION', () => {
      const store = useGameStore.getState();
      store.setRoom(createMockRoom());

      store.setRoundInfo({
        round: 1,
        drawerId: 'drawer-id',
        drawerIds: ['drawer-id'],
        wordLength: 5,
        wordHint: '_____',
      });

      expect(useGameStore.getState().room?.gameState.phase).toBe('WORD_SELECTION');
      expect(useGameStore.getState().room?.gameState.currentRound).toBe(1);
      expect(useGameStore.getState().room?.gameState.currentDrawerId).toBe('drawer-id');
    });

    it('setWordOptions sets word options', () => {
      const store = useGameStore.getState();
      store.setRoom(createMockRoom());

      store.setWordOptions(['cat', 'dog', 'bird']);

      expect(useGameStore.getState().wordOptions).toEqual(['cat', 'dog', 'bird']);
      expect(useGameStore.getState().room?.gameState.phase).toBe('WORD_SELECTION');
    });

    it('setDrawingPhase sets phase to DRAWING', () => {
      const store = useGameStore.getState();
      store.setRoom(createMockRoom());

      store.setDrawingPhase(80, 5, '_____');

      expect(useGameStore.getState().room?.gameState.phase).toBe('DRAWING');
      expect(useGameStore.getState().drawTime).toBe(80);
      expect(useGameStore.getState().wordOptions).toBeNull();
    });

    it('setRevealPhase sets phase to REVEAL', () => {
      const store = useGameStore.getState();
      store.setRoom(createMockRoom());

      store.setRevealPhase('elephant');

      expect(useGameStore.getState().room?.gameState.phase).toBe('REVEAL');
      expect(useGameStore.getState().revealWord).toBe('elephant');
    });

    it('setRoundEnd sets phase to RESULTS', () => {
      const store = useGameStore.getState();
      const player = createMockPlayer({ id: 'p1', sessionId: 's1' });
      store.setRoom(createMockRoom({ players: { s1: player } }));

      store.setRoundEnd({
        word: 'elephant',
        scores: [
          {
            playerId: 'p1',
            playerName: 'TestPlayer',
            score: 100,
            isDrawer: false,
            guessedCorrectly: true,
            currentStreak: 1,
          },
        ],
      });

      expect(useGameStore.getState().room?.gameState.phase).toBe('RESULTS');
      expect(useGameStore.getState().revealWord).toBe('elephant');
      expect(useGameStore.getState().room?.players.s1.score).toBe(100);
    });

    it('setGameOver sets phase to GAME_OVER', () => {
      const store = useGameStore.getState();
      store.setRoom(createMockRoom());

      store.setGameOver({
        finalScores: [
          {
            playerId: 'p1',
            playerName: 'TestPlayer',
            score: 500,
            rank: 1,
            maxStreak: 3,
          },
        ],
      });

      expect(useGameStore.getState().room?.gameState.phase).toBe('GAME_OVER');
      expect(useGameStore.getState().gameOverData).toBeDefined();
    });
  });

  describe('Streak Handling', () => {
    it('addCorrectGuesser updates player score and streak', () => {
      const store = useGameStore.getState();
      const player = createMockPlayer({
        id: 'guesser-id',
        sessionId: 'guesser-session',
        score: 0,
        currentStreak: 0,
      });
      const room = createMockRoom({
        players: { 'guesser-session': player },
        gameState: {
          ...createMockRoom().gameState,
          correctGuessers: [],
        },
      });
      store.setRoom(room);

      store.addCorrectGuesser({
        playerId: 'guesser-id',
        playerName: 'TestPlayer',
        points: 100,
        totalGuessers: 1,
        streak: 1,
        multiplier: 1.0,
      });

      const state = useGameStore.getState();
      expect(state.room?.players['guesser-session'].score).toBe(100);
      expect(state.room?.players['guesser-session'].currentStreak).toBe(1);
      expect(state.room?.gameState.correctGuessers).toContain('guesser-id');
    });

    it('addCorrectGuesser applies streak multiplier', () => {
      const store = useGameStore.getState();
      const player = createMockPlayer({
        id: 'guesser-id',
        sessionId: 'guesser-session',
        score: 100,
        currentStreak: 2,
      });
      const room = createMockRoom({
        players: { 'guesser-session': player },
        gameState: {
          ...createMockRoom().gameState,
          correctGuessers: [],
        },
      });
      store.setRoom(room);

      // Add correct guess with streak multiplier
      store.addCorrectGuesser({
        playerId: 'guesser-id',
        playerName: 'TestPlayer',
        points: 125, // 100 * 1.25x multiplier
        totalGuessers: 1,
        streak: 3,
        multiplier: 1.25,
      });

      const state = useGameStore.getState();
      expect(state.room?.players['guesser-session'].score).toBe(225); // 100 + 125
      expect(state.room?.players['guesser-session'].currentStreak).toBe(3);
    });
  });

  describe('Close Guess', () => {
    it('setCloseGuess sets closeGuess flag', () => {
      const store = useGameStore.getState();

      store.setCloseGuess(true);
      expect(useGameStore.getState().closeGuess).toBe(true);

      store.setCloseGuess(false);
      expect(useGameStore.getState().closeGuess).toBe(false);
    });

    it('handleCloseGuess sets closeGuess for current player only', () => {
      const store = useGameStore.getState();
      const player = createMockPlayer({ id: 'my-player-id', sessionId: 'my-session' });
      store.setRoom(createMockRoom({ players: { 'my-session': player } }));
      store.setMySessionId('my-session');

      // Close guess for my player
      store.handleCloseGuess('my-player-id');
      expect(useGameStore.getState().closeGuess).toBe(true);

      // Reset
      store.setCloseGuess(false);

      // Close guess for different player - should not set
      store.handleCloseGuess('other-player-id');
      expect(useGameStore.getState().closeGuess).toBe(false);
    });
  });

  describe('Chat Messages', () => {
    it('addChatMessage adds message to list', () => {
      const store = useGameStore.getState();

      store.addChatMessage({
        playerId: 'p1',
        playerName: 'Player1',
        text: 'Hello!',
        timestamp: Date.now(),
      });

      expect(useGameStore.getState().chatMessages).toHaveLength(1);
      expect(useGameStore.getState().chatMessages[0].text).toBe('Hello!');
    });

    it('addChatMessage limits message history', () => {
      const store = useGameStore.getState();

      // Add many messages (limit is typically 100)
      for (let i = 0; i < 150; i++) {
        store.addChatMessage({
          playerId: 'p1',
          playerName: 'Player1',
          text: `Message ${i}`,
          timestamp: Date.now() + i,
        });
      }

      // Should be capped at limit
      const messages = useGameStore.getState().chatMessages;
      expect(messages.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Reactions', () => {
    it('addReaction adds reaction to list', () => {
      const store = useGameStore.getState();

      store.addReaction({
        id: 'reaction-1',
        playerId: 'p1',
        playerName: 'Player1',
        emoji: '🔥',
        timestamp: Date.now(),
      });

      expect(useGameStore.getState().activeReactions).toHaveLength(1);
    });

    it('removeReaction removes reaction by ID', () => {
      const store = useGameStore.getState();

      store.addReaction({
        id: 'reaction-1',
        playerId: 'p1',
        playerName: 'Player1',
        emoji: '🔥',
        timestamp: Date.now(),
      });

      store.removeReaction('reaction-1');

      expect(useGameStore.getState().activeReactions).toHaveLength(0);
    });
  });

  describe('Voting', () => {
    it('setVotingStart sets phase to VOTING', () => {
      const store = useGameStore.getState();
      store.setRoom(createMockRoom());

      store.setVotingStart(
        [
          {
            drawerId: 'd1',
            drawerName: 'Drawer1',
            word: 'cat',
            drawingBase64: 'base64...',
          },
        ],
        30
      );

      expect(useGameStore.getState().room?.gameState.phase).toBe('VOTING');
      expect(useGameStore.getState().votingDrawings).toHaveLength(1);
      expect(useGameStore.getState().votingTime).toBe(30);
      expect(useGameStore.getState().hasVoted).toBe(false);
    });

    it('setHasVoted updates voted status', () => {
      const store = useGameStore.getState();

      store.setHasVoted(true);
      expect(useGameStore.getState().hasVoted).toBe(true);
    });

    it('setVotingResults sets results and winner', () => {
      const store = useGameStore.getState();

      store.setVotingResults(
        [
          {
            drawerId: 'd1',
            drawerName: 'Drawer1',
            word: 'cat',
            votes: 3,
            isWinner: true,
          },
        ],
        'd1'
      );

      expect(useGameStore.getState().votingResults).toHaveLength(1);
      expect(useGameStore.getState().votingWinnerId).toBe('d1');
    });
  });

  describe('Telephone Mode', () => {
    it('setTelephoneDraw sets phase to TELEPHONE_DRAW', () => {
      const store = useGameStore.getState();
      store.setRoom(createMockRoom());

      store.setTelephoneDraw('player-id', 'PlayerName', 45, 3);

      expect(useGameStore.getState().room?.gameState.phase).toBe('TELEPHONE_DRAW');
      expect(useGameStore.getState().telephoneCurrentPlayerId).toBe('player-id');
      expect(useGameStore.getState().telephoneTime).toBe(45);
      expect(useGameStore.getState().telephoneRemainingPlayers).toBe(3);
    });

    it('setTelephoneGuess sets phase to TELEPHONE_GUESS', () => {
      const store = useGameStore.getState();
      store.setRoom(createMockRoom());

      store.setTelephoneGuess('player-id', 'PlayerName', 30, 2);

      expect(useGameStore.getState().room?.gameState.phase).toBe('TELEPHONE_GUESS');
      expect(useGameStore.getState().telephoneTime).toBe(30);
    });

    it('setTelephonePrompt sets prompt and type', () => {
      const store = useGameStore.getState();

      store.setTelephonePrompt('Draw a cat', 'word');

      expect(useGameStore.getState().telephonePrompt).toBe('Draw a cat');
      expect(useGameStore.getState().telephonePromptType).toBe('word');
    });

    it('setTelephoneReveal sets phase to TELEPHONE_REVEAL', () => {
      const store = useGameStore.getState();
      store.setRoom(createMockRoom());

      store.setTelephoneReveal('elephant', [
        { type: 'word', content: 'elephant', playerId: 'p1', playerName: 'Player1' },
        { type: 'draw', content: 'base64...', playerId: 'p2', playerName: 'Player2' },
      ]);

      expect(useGameStore.getState().room?.gameState.phase).toBe('TELEPHONE_REVEAL');
      expect(useGameStore.getState().telephoneOriginalWord).toBe('elephant');
      expect(useGameStore.getState().telephoneChain).toHaveLength(2);
    });
  });

  describe('Computed Helpers', () => {
    it('getMyPlayer returns current player', () => {
      const store = useGameStore.getState();
      const player = createMockPlayer({ sessionId: 'my-session' });
      store.setRoom(createMockRoom({ players: { 'my-session': player } }));
      store.setMySessionId('my-session');

      expect(store.getMyPlayer()).toEqual(player);
    });

    it('getMyPlayer returns null if not in room', () => {
      const store = useGameStore.getState();

      expect(store.getMyPlayer()).toBeNull();
    });

    it('isHost returns true for host', () => {
      const store = useGameStore.getState();
      store.setRoom(createMockRoom({ hostId: 'my-session' }));
      store.setMySessionId('my-session');

      expect(store.isHost()).toBe(true);
    });

    it('isHost returns false for non-host', () => {
      const store = useGameStore.getState();
      store.setRoom(createMockRoom({ hostId: 'other-session' }));
      store.setMySessionId('my-session');

      expect(store.isHost()).toBe(false);
    });

    it('isDrawer returns true when current player is drawer', () => {
      const store = useGameStore.getState();
      const player = createMockPlayer({ id: 'my-player-id', sessionId: 'my-session' });
      const room = createMockRoom({
        players: { 'my-session': player },
        gameState: {
          ...createMockRoom().gameState,
          currentDrawerId: 'my-player-id',
          currentDrawerIds: ['my-player-id'],
        },
      });
      store.setRoom(room);
      store.setMySessionId('my-session');

      expect(store.isDrawer()).toBe(true);
    });

    it('isDrawer returns false when not drawer', () => {
      const store = useGameStore.getState();
      const player = createMockPlayer({ id: 'my-player-id', sessionId: 'my-session' });
      const room = createMockRoom({
        players: { 'my-session': player },
        gameState: {
          ...createMockRoom().gameState,
          currentDrawerId: 'other-player-id',
          currentDrawerIds: ['other-player-id'],
        },
      });
      store.setRoom(room);
      store.setMySessionId('my-session');

      expect(store.isDrawer()).toBe(false);
    });

    it('getPlayerList returns array of players', () => {
      const store = useGameStore.getState();
      const player1 = createMockPlayer({ id: 'p1', sessionId: 's1', name: 'Player1' });
      const player2 = createMockPlayer({ id: 'p2', sessionId: 's2', name: 'Player2' });
      store.setRoom(createMockRoom({ players: { s1: player1, s2: player2 } }));

      const players = store.getPlayerList();
      expect(players).toHaveLength(2);
    });

    it('getPhase returns current phase', () => {
      const store = useGameStore.getState();
      store.setRoom(
        createMockRoom({
          gameState: { ...createMockRoom().gameState, phase: 'DRAWING' },
        })
      );

      expect(store.getPhase()).toBe('DRAWING');
    });

    it('getPhase returns LOBBY when no room', () => {
      const store = useGameStore.getState();

      expect(store.getPhase()).toBe('LOBBY');
    });
  });

  describe('Session Persistence', () => {
    const STORAGE_KEY = 'sand-pixel-session';

    beforeEach(() => {
      localStorage.clear();
    });

    it('persistSession saves to localStorage', () => {
      const store = useGameStore.getState();

      store.persistSession('room-123', 'PlayerName');

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed.roomId).toBe('room-123');
      expect(parsed.playerName).toBe('PlayerName');
    });

    it('getPersistedSession retrieves from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ roomId: 'room-456', playerName: 'TestPlayer' }));

      const store = useGameStore.getState();
      const session = store.getPersistedSession();

      expect(session?.roomId).toBe('room-456');
      expect(session?.playerName).toBe('TestPlayer');
    });

    it('getPersistedSession returns null when no session', () => {
      const store = useGameStore.getState();
      const session = store.getPersistedSession();

      expect(session).toBeNull();
    });

    it('clearPersistedSession removes from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ roomId: 'room-789', playerName: 'Player' }));

      const store = useGameStore.getState();
      store.clearPersistedSession();

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('Reset', () => {
    it('reset returns store to initial state', () => {
      const store = useGameStore.getState();

      // Set various state
      store.setRoom(createMockRoom());
      store.setMySessionId('session-id');
      store.setCountdown(3);
      store.setError('Some error');
      store.addChatMessage({ playerId: 'p1', playerName: 'P', text: 'Hi', timestamp: Date.now() });

      // Reset
      store.reset();

      const state = useGameStore.getState();
      expect(state.room).toBeNull();
      expect(state.mySessionId).toBeNull();
      expect(state.countdown).toBeNull();
      expect(state.error).toBeNull();
      expect(state.chatMessages).toHaveLength(0);
      expect(state.connectionStatus).toBe('disconnected');
    });
  });
});
