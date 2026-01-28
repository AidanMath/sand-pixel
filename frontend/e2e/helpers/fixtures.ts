/**
 * Test data factories and fixtures for e2e tests
 */

// ============================================
// Game Settings Fixtures
// ============================================

export const DEFAULT_TEST_SETTINGS = {
  maxPlayers: 8,
  totalRounds: 3,
  drawTime: 80,
  revealTime: 5,
  gameMode: 'CLASSIC' as const,
  collaborativeDrawerCount: 2,
};

export const QUICK_GAME_SETTINGS = {
  maxPlayers: 4,
  totalRounds: 1,
  drawTime: 30,
  revealTime: 3,
  gameMode: 'CLASSIC' as const,
  collaborativeDrawerCount: 2,
};

export const COLLABORATIVE_SETTINGS = {
  ...DEFAULT_TEST_SETTINGS,
  gameMode: 'COLLABORATIVE' as const,
  collaborativeDrawerCount: 2,
};

export const TELEPHONE_SETTINGS = {
  ...DEFAULT_TEST_SETTINGS,
  gameMode: 'TELEPHONE' as const,
  totalRounds: 1,
};

// ============================================
// Timing Constants (matches backend)
// ============================================

export const TIMING = {
  /** Countdown before round starts (3, 2, 1, Draw!) */
  COUNTDOWN_SECONDS: 3,
  /** Time to choose a word */
  WORD_SELECTION_SECONDS: 15,
  /** Default drawing time */
  DEFAULT_DRAW_TIME: 80,
  /** Time to show revealed word */
  REVEAL_TIME: 5,
  /** Time to show results */
  RESULTS_TIME: 10,
  /** Time for voting phase */
  VOTING_TIME: 30,
  /** Telephone mode draw time */
  TELEPHONE_DRAW_TIME: 45,
  /** Telephone mode guess time */
  TELEPHONE_GUESS_TIME: 30,
};

// ============================================
// Test Timeouts
// ============================================

export const TIMEOUTS = {
  /** Standard timeout for element visibility */
  ELEMENT_VISIBLE: 10000,
  /** Timeout for connection establishment */
  CONNECTION: 15000,
  /** Timeout for phase transitions */
  PHASE_TRANSITION: 20000,
  /** Timeout for full round completion */
  ROUND_COMPLETE: 120000,
  /** Timeout for full game completion */
  GAME_COMPLETE: 300000,
  /** Short timeout for quick checks */
  QUICK: 5000,
};

// ============================================
// Player Name Generators
// ============================================

const adjectives = ['Swift', 'Clever', 'Brave', 'Calm', 'Eager', 'Wise', 'Noble', 'Bold'];
const nouns = ['Fox', 'Owl', 'Bear', 'Wolf', 'Hawk', 'Lion', 'Eagle', 'Tiger'];

/**
 * Generates a random player name
 */
export function generatePlayerName(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${noun}${num}`;
}

/**
 * Generates an array of unique player names
 */
export function generatePlayerNames(count: number): string[] {
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    names.push(`Player${i + 1}`);
  }
  return names;
}

// ============================================
// Drawing Stroke Presets
// ============================================

export const STROKES = {
  /** Simple diagonal line */
  DIAGONAL: [{ start: { x: 100, y: 100 }, end: { x: 200, y: 200 } }],

  /** V-shape */
  V_SHAPE: [
    { start: { x: 100, y: 100 }, end: { x: 200, y: 200 } },
    { start: { x: 200, y: 200 }, end: { x: 300, y: 100 } },
  ],

  /** Square */
  SQUARE: [
    { start: { x: 100, y: 100 }, end: { x: 200, y: 100 } },
    { start: { x: 200, y: 100 }, end: { x: 200, y: 200 } },
    { start: { x: 200, y: 200 }, end: { x: 100, y: 200 } },
    { start: { x: 100, y: 200 }, end: { x: 100, y: 100 } },
  ],

  /** Triangle */
  TRIANGLE: [
    { start: { x: 150, y: 100 }, end: { x: 200, y: 200 } },
    { start: { x: 200, y: 200 }, end: { x: 100, y: 200 } },
    { start: { x: 100, y: 200 }, end: { x: 150, y: 100 } },
  ],

  /** Circle approximation */
  CIRCLE: [
    { start: { x: 200, y: 100 }, end: { x: 250, y: 150 } },
    { start: { x: 250, y: 150 }, end: { x: 250, y: 200 } },
    { start: { x: 250, y: 200 }, end: { x: 200, y: 250 } },
    { start: { x: 200, y: 250 }, end: { x: 150, y: 200 } },
    { start: { x: 150, y: 200 }, end: { x: 150, y: 150 } },
    { start: { x: 150, y: 150 }, end: { x: 200, y: 100 } },
  ],

  /** Complex scribble for realistic drawing */
  SCRIBBLE: [
    { start: { x: 100, y: 150 }, end: { x: 150, y: 100 } },
    { start: { x: 150, y: 100 }, end: { x: 200, y: 150 } },
    { start: { x: 200, y: 150 }, end: { x: 180, y: 200 } },
    { start: { x: 180, y: 200 }, end: { x: 120, y: 180 } },
    { start: { x: 120, y: 180 }, end: { x: 100, y: 150 } },
  ],
};

// ============================================
// Test Words
// ============================================

export const TEST_WORDS = {
  /** Simple words for testing */
  SIMPLE: ['cat', 'dog', 'sun', 'tree', 'car'],
  /** Words likely to appear in word selection */
  COMMON: ['apple', 'house', 'fish', 'bird', 'star'],
};

// ============================================
// Scoring Constants (matches backend)
// ============================================

export const SCORING = {
  /** Base points for correct guess */
  BASE_POINTS: 100,
  /** Streak multiplier thresholds */
  STREAK_MULTIPLIERS: {
    2: 1.25,
    3: 1.5,
    4: 2.0,
  },
  /** Points deduction per second late */
  TIME_PENALTY_PER_SECOND: 1,
  /** Bonus for voting winner */
  VOTING_BONUS: 50,
};

// ============================================
// Phase Indicators (CSS selectors)
// ============================================

export const PHASE_SELECTORS = {
  LOBBY: {
    ready: 'button:has-text("Click when ready")',
    readied: 'button:has-text("Ready!")',
    startGame: 'button:has-text("Start Game")',
    playerCount: 'text=/\\d+\\//i',
  },
  COUNTDOWN: {
    number: '.text-9xl, .text-7xl',
    draw: 'text=Draw!',
  },
  WORD_SELECTION: {
    choose: 'text=Choose a word!',
    wordButtons: '.space-y-3 button',
    waiting: 'text=is choosing a word',
  },
  DRAWING: {
    canvas: 'canvas',
    doneButton: 'button:has-text("Done Drawing")',
    timer: '[data-testid="draw-timer"], .draw-timer',
    tools: '[data-testid="drawing-tools"]',
  },
  REVEAL: {
    word: '.text-4xl.text-green-400',
  },
  RESULTS: {
    scores: '[data-testid="round-scores"]',
  },
  VOTING: {
    title: 'text=Vote for the best',
    drawings: '[data-testid="voting-drawing"], .voting-drawing',
  },
  GAME_OVER: {
    title: 'text=Game Over',
    finalScores: '[data-testid="final-scores"]',
    playAgain: 'button:has-text("Play Again")',
  },
  TELEPHONE: {
    drawPrompt: 'text=Draw:',
    guessPrompt: 'text=What do you see',
    waiting: 'text=waiting',
  },
};

// ============================================
// Error Messages
// ============================================

export const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: 'Room not found',
  NAME_TAKEN: 'Name already taken',
  ROOM_FULL: 'Room is full',
  GAME_IN_PROGRESS: 'Game already in progress',
};

// ============================================
// Reaction Emojis
// ============================================

export const REACTIONS = ['thumbs_up', 'clap', 'laugh', 'fire', 'heart', 'wow', 'think', 'cry', 'skull', 'art'] as const;

export const EMOJI_MAP: Record<string, string> = {
  thumbs_up: '👍',
  clap: '👏',
  laugh: '😂',
  fire: '🔥',
  heart: '❤️',
  wow: '😮',
  think: '🤔',
  cry: '😭',
  skull: '💀',
  art: '🎨',
};
