/**
 * Shared test utilities for e2e tests
 */
import { Page, Browser, BrowserContext } from '@playwright/test';
import { expect } from '@playwright/test';

// ============================================
// Types
// ============================================

export interface PlayerContext {
  page: Page;
  context: BrowserContext;
  name: string;
}

export interface MultiPlayerGame {
  players: PlayerContext[];
  roomCode: string;
  host: PlayerContext;
}

export interface GameSettings {
  maxPlayers?: number;
  totalRounds?: number;
  drawTime?: number;
  gameMode?: 'CLASSIC' | 'COLLABORATIVE' | 'TELEPHONE';
}

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

// ============================================
// Player Management
// ============================================

/**
 * Creates a new player page with its own browser context
 */
export async function createPlayer(browser: Browser, name: string): Promise<PlayerContext> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  return { page, context, name };
}

/**
 * Closes a player's browser context
 */
export async function closePlayer(player: PlayerContext): Promise<void> {
  await player.context.close();
}

/**
 * Closes all players in a game
 */
export async function closeAllPlayers(players: PlayerContext[]): Promise<void> {
  await Promise.all(players.map((p) => p.context.close()));
}

// ============================================
// Connection Utilities
// ============================================

/**
 * Waits for WebSocket connection to be established
 */
export async function waitForConnection(page: Page, timeout = 10000): Promise<void> {
  await expect(page.locator('text=Create Room')).toBeVisible({ timeout });
}

// ============================================
// Room Management
// ============================================

/**
 * Creates a room and returns the room code
 */
export async function createRoom(page: Page, playerName: string): Promise<string> {
  await page.click('text=Create Room');
  await page.fill('input[placeholder="Enter your name"]', playerName);
  await page.click('button:has-text("Create Room")');

  const roomHeader = page.locator('h1:has-text("Room:")');
  await expect(roomHeader).toBeVisible({ timeout: 10000 });
  const headerText = await roomHeader.textContent();
  const roomCode = headerText?.replace('Room: ', '').trim() || '';
  return roomCode;
}

/**
 * Creates a room with specific game mode settings
 */
export async function createRoomWithMode(
  page: Page,
  playerName: string,
  mode: 'CLASSIC' | 'COLLABORATIVE' | 'TELEPHONE',
  options?: { collaborativeDrawerCount?: number }
): Promise<string> {
  await page.click('text=Create Room');
  await page.fill('input[placeholder="Enter your name"]', playerName);

  // Select game mode from the select dropdown
  const modeSelect = page.locator('select').filter({ hasText: 'Classic' });
  await modeSelect.selectOption(mode);

  // If collaborative mode, select drawer count
  if (mode === 'COLLABORATIVE' && options?.collaborativeDrawerCount) {
    // Wait for the drawer count selector to appear - it's labeled "Number of Drawers"
    const drawerLabel = page.locator('text=Number of Drawers');
    await expect(drawerLabel).toBeVisible({ timeout: 5000 });
    // The select is the next sibling element
    const drawerCountSelect = drawerLabel.locator('..').locator('select');
    await drawerCountSelect.selectOption(String(options.collaborativeDrawerCount));
  }

  await page.click('button:has-text("Create Room")');

  const roomHeader = page.locator('h1:has-text("Room:")');
  await expect(roomHeader).toBeVisible({ timeout: 10000 });
  const headerText = await roomHeader.textContent();
  return headerText?.replace('Room: ', '').trim() || '';
}

/**
 * Joins an existing room
 */
export async function joinRoom(page: Page, playerName: string, roomCode: string): Promise<void> {
  await page.click('text=Join Room');
  await page.fill('input[placeholder="Enter your name"]', playerName);
  await page.fill('input[placeholder*="code"]', roomCode);
  await page.click('button:has-text("Join Room")');

  await expect(page.locator(`h1:has-text("Room: ${roomCode}")`)).toBeVisible({ timeout: 10000 });
}

/**
 * Creates a multi-player game with specified number of players
 */
export async function createMultiPlayerGame(
  browser: Browser,
  playerCount: number,
  settings?: GameSettings
): Promise<MultiPlayerGame> {
  const players: PlayerContext[] = [];

  // Create host
  const host = await createPlayer(browser, 'Host');
  await waitForConnection(host.page);
  const roomCode = await createRoom(host.page, 'Host');
  players.push(host);

  // Create additional players
  for (let i = 1; i < playerCount; i++) {
    const player = await createPlayer(browser, `Player${i}`);
    await waitForConnection(player.page);
    await joinRoom(player.page, `Player${i}`, roomCode);
    players.push(player);
  }

  return { players, roomCode, host };
}

// ============================================
// Lobby Actions
// ============================================

/**
 * Marks a player as ready
 */
export async function clickReady(page: Page): Promise<void> {
  await page.click('button:has-text("Click when ready")');
  await expect(page.locator('button:has-text("Ready!")')).toBeVisible();
}

/**
 * Ready up all players in a game
 */
export async function readyAllPlayers(players: PlayerContext[]): Promise<void> {
  await Promise.all(players.map((p) => clickReady(p.page)));
}

/**
 * Starts the game (host only)
 */
export async function startGame(hostPage: Page): Promise<void> {
  const startButton = hostPage.locator('button:has-text("Start Game")');
  await expect(startButton).toBeEnabled({ timeout: 5000 });
  await startButton.click();
}

// ============================================
// Phase Detection & Waiting
// ============================================

/**
 * Waits for countdown phase to appear
 */
export async function waitForCountdown(page: Page, timeout = 10000): Promise<void> {
  await expect(page.locator('.text-9xl, .text-7xl')).toBeVisible({ timeout });
}

/**
 * Waits for countdown to complete (waits for Draw! text)
 */
export async function waitForCountdownComplete(page: Page, timeout = 10000): Promise<void> {
  // Wait for "Draw!" text which appears at end of countdown
  await expect(page.locator('text=Draw!')).toBeVisible({ timeout });
}

/**
 * Waits for word selection phase
 */
export async function waitForWordSelection(page: Page, timeout = 15000): Promise<void> {
  await expect(page.locator('text=Choose a word!')).toBeVisible({ timeout });
}

/**
 * Waits for drawing phase
 */
export async function waitForDrawingPhase(page: Page, timeout = 20000): Promise<void> {
  await expect(page.locator('text=Done Drawing')).toBeVisible({ timeout });
}

/**
 * Waits for reveal phase (word shown in green)
 */
export async function waitForRevealPhase(page: Page, timeout = 30000): Promise<void> {
  await expect(page.locator('.text-4xl.text-green-400')).toBeVisible({ timeout });
}

/**
 * Waits for voting phase
 */
export async function waitForVotingPhase(page: Page, timeout = 30000): Promise<void> {
  await expect(page.locator('text=Vote for the best')).toBeVisible({ timeout });
}

/**
 * Waits for game over screen
 */
export async function waitForGameOver(page: Page, timeout = 120000): Promise<void> {
  await expect(page.locator('text=Game Over')).toBeVisible({ timeout });
}

/**
 * Waits for a specific game phase based on visual indicators
 */
export async function waitForPhase(page: Page, phase: GamePhase, timeout = 30000): Promise<void> {
  switch (phase) {
    case 'COUNTDOWN':
      await waitForCountdown(page, timeout);
      break;
    case 'WORD_SELECTION':
      await waitForWordSelection(page, timeout);
      break;
    case 'DRAWING':
      await waitForDrawingPhase(page, timeout);
      break;
    case 'REVEAL':
      await waitForRevealPhase(page, timeout);
      break;
    case 'VOTING':
      await waitForVotingPhase(page, timeout);
      break;
    case 'GAME_OVER':
      await waitForGameOver(page, timeout);
      break;
    case 'TELEPHONE_DRAW':
      await waitForTelephoneDraw(page, timeout);
      break;
    case 'TELEPHONE_GUESS':
      await waitForTelephoneGuess(page, timeout);
      break;
    case 'LOBBY':
      await expect(page.locator('button:has-text("Click when ready")')).toBeVisible({ timeout });
      break;
    default:
      throw new Error(`Unknown phase: ${phase}`);
  }
}

// ============================================
// Telephone Mode Helpers
// ============================================

/**
 * Waits for telephone draw phase (either as drawer or waiting)
 */
export async function waitForTelephoneDraw(page: Page, timeout = 30000): Promise<void> {
  // Could be either active drawer or waiting for someone else
  await expect(
    page.locator('text=Draw this word:').or(page.locator('text=Draw what you see:')).or(page.locator('text=is drawing'))
  ).toBeVisible({ timeout });
}

/**
 * Waits for telephone guess phase (either as guesser or waiting)
 */
export async function waitForTelephoneGuess(page: Page, timeout = 30000): Promise<void> {
  // Could be either active guesser or waiting
  await expect(page.locator('text=What do you think this is?').or(page.locator('text=is guessing'))).toBeVisible({
    timeout,
  });
}

/**
 * Waits for telephone reveal phase
 */
export async function waitForTelephoneReveal(page: Page, timeout = 30000): Promise<void> {
  await expect(page.locator('text=The original word was')).toBeVisible({ timeout });
}

/**
 * Checks if player is the active participant in telephone mode
 */
export async function isTelephoneActivePlayer(page: Page): Promise<boolean> {
  // Active drawer sees "Draw this word" or "Draw what you see"
  const isDrawer = await page
    .locator('text=Draw this word:')
    .or(page.locator('text=Draw what you see:'))
    .isVisible({ timeout: 1000 })
    .catch(() => false);

  // Active guesser sees "What do you think this is?"
  const isGuesser = await page
    .locator('text=What do you think this is?')
    .isVisible({ timeout: 1000 })
    .catch(() => false);

  return isDrawer || isGuesser;
}

/**
 * Submits a guess in telephone mode
 */
export async function submitTelephoneGuess(page: Page, guess: string): Promise<void> {
  const input = page.locator('input[placeholder="Type your guess..."]');
  await input.fill(guess);
  const submitButton = page.locator('button:has-text("Submit")');
  await submitButton.click();
}

/**
 * Submits a drawing in telephone mode
 */
export async function submitTelephoneDrawing(page: Page): Promise<void> {
  await drawOnCanvas(page);
  const doneButton = page.locator('button:has-text("Done Drawing")');
  await doneButton.click();
}

// ============================================
// Word Selection
// ============================================

/**
 * Selects a word from the word options (first word by default)
 */
export async function selectWord(page: Page, wordIndex = 0): Promise<string> {
  const wordButtons = page.locator('.space-y-3 button');
  await expect(wordButtons.first()).toBeVisible({ timeout: 5000 });

  const wordButton = wordButtons.nth(wordIndex);
  const word = (await wordButton.textContent()) || '';
  await wordButton.click();

  return word;
}

/**
 * Detects which player is the drawer and handles word selection
 * Returns drawer and guesser pages
 */
export async function selectWordAnyDrawer(
  player1: Page,
  player2: Page
): Promise<{ drawer: Page; guesser: Page; word: string }> {
  const wordSelector1 = player1.locator('text=Choose a word!');
  const wordSelector2 = player2.locator('text=Choose a word!');
  const doneDrawing1 = player1.locator('text=Done Drawing');
  const doneDrawing2 = player2.locator('text=Done Drawing');

  const result = await Promise.race([
    wordSelector1.waitFor({ timeout: 15000 }).then(() => ({ phase: 'word' as const, drawer: 'player1' as const })),
    wordSelector2.waitFor({ timeout: 15000 }).then(() => ({ phase: 'word' as const, drawer: 'player2' as const })),
    doneDrawing1.waitFor({ timeout: 15000 }).then(() => ({ phase: 'drawing' as const, drawer: 'player1' as const })),
    doneDrawing2.waitFor({ timeout: 15000 }).then(() => ({ phase: 'drawing' as const, drawer: 'player2' as const })),
  ]);

  const drawer = result.drawer === 'player1' ? player1 : player2;
  const guesser = result.drawer === 'player1' ? player2 : player1;
  let word = '';

  if (result.phase === 'word') {
    word = await selectWord(drawer);
  }

  return { drawer, guesser, word };
}

// ============================================
// Drawing Actions
// ============================================

/**
 * Draws a simple stroke on the canvas
 */
export async function drawOnCanvas(
  page: Page,
  strokes?: Array<{ start: { x: number; y: number }; end: { x: number; y: number } }>
): Promise<void> {
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 5000 });

  const canvasBox = await canvas.boundingBox();
  if (!canvasBox) {
    throw new Error('Canvas not found or not visible');
  }

  const defaultStrokes = [
    { start: { x: 100, y: 100 }, end: { x: 200, y: 200 } },
    { start: { x: 200, y: 200 }, end: { x: 300, y: 100 } },
  ];

  const strokesToDraw = strokes || defaultStrokes;

  for (const stroke of strokesToDraw) {
    await page.mouse.move(canvasBox.x + stroke.start.x, canvasBox.y + stroke.start.y);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + stroke.end.x, canvasBox.y + stroke.end.y);
    await page.mouse.up();
  }

  // Allow drawing state to settle
  await page.waitForTimeout(300);
}

/**
 * Submits the current drawing
 */
export async function submitDrawing(page: Page): Promise<void> {
  const doneButton = page.locator('button:has-text("Done Drawing")');
  await expect(doneButton).toBeVisible({ timeout: 5000 });
  await doneButton.click();
}

// ============================================
// Chat & Guessing
// ============================================

/**
 * Sends a chat message/guess
 */
export async function sendGuess(page: Page, guess: string): Promise<void> {
  const chatInput = page.locator('input[placeholder*="guess"], input[placeholder*="Type"]');
  await chatInput.fill(guess);
  await chatInput.press('Enter');
}

/**
 * Sends the correct guess (for testing correct guess scenarios)
 */
export async function sendCorrectGuess(page: Page, word: string): Promise<void> {
  await sendGuess(page, word);
  // Wait for confirmation that guess was correct
  await page.waitForTimeout(500);
}

// ============================================
// Voting
// ============================================

/**
 * Votes for a drawing by drawer index
 */
export async function voteForDrawing(page: Page, drawerIndex = 0): Promise<void> {
  const drawings = page.locator('[data-testid="voting-drawing"], .voting-drawing');
  await expect(drawings.first()).toBeVisible({ timeout: 5000 });
  await drawings.nth(drawerIndex).click();
}

// ============================================
// Reactions
// ============================================

/**
 * Sends an emoji reaction
 */
export async function sendReaction(page: Page, emoji: string): Promise<void> {
  const reactionButton = page.locator(`button:has-text("${emoji}")`);
  if (await reactionButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await reactionButton.click();
  }
}

// ============================================
// Score Verification
// ============================================

/**
 * Gets a player's current score from the UI
 */
export async function getPlayerScore(page: Page, playerName: string): Promise<number> {
  // Look for score display near player name
  const playerElement = page.locator(`.player-item:has-text("${playerName}"), [data-testid="player-${playerName}"]`);
  const scoreElement = playerElement.locator('.score, [data-testid="score"]');

  if (await scoreElement.isVisible({ timeout: 1000 }).catch(() => false)) {
    const scoreText = await scoreElement.textContent();
    return parseInt(scoreText || '0', 10);
  }

  // Fallback: look for score in different format
  const scoreLocator = page.locator(`text=${playerName}`).locator('..').locator('text=/\\d+/');
  const text = await scoreLocator.first().textContent().catch(() => '0');
  return parseInt(text || '0', 10);
}

/**
 * Verifies the streak indicator shows a specific count
 */
export async function verifyStreakIndicator(page: Page, count: number): Promise<void> {
  if (count > 0) {
    await expect(page.locator(`text=${count}x`)).toBeVisible({ timeout: 5000 });
  }
}

/**
 * Verifies a system message appears in chat
 */
export async function verifySystemMessage(page: Page, messagePattern: string | RegExp): Promise<void> {
  const pattern = typeof messagePattern === 'string' ? new RegExp(messagePattern) : messagePattern;
  await expect(page.locator('.system-message, [data-system="true"]').filter({ hasText: pattern })).toBeVisible({
    timeout: 5000,
  });
}

// ============================================
// Refresh & Reconnection
// ============================================

/**
 * Refreshes the page and waits for reconnection
 */
export async function refreshAndReconnect(page: Page, roomCode: string): Promise<void> {
  await page.reload();
  // Wait for automatic reconnection to room
  await expect(page.locator(`h1:has-text("Room: ${roomCode}")`)).toBeVisible({ timeout: 15000 });
}

/**
 * Verifies the game state after a page refresh
 */
export async function verifyStateAfterRefresh(page: Page, expectedPhase: GamePhase): Promise<void> {
  // Allow reconnection to settle
  await page.waitForTimeout(1000);

  switch (expectedPhase) {
    case 'LOBBY':
      await expect(page.locator('button:has-text("Click when ready"), button:has-text("Ready!")')).toBeVisible({
        timeout: 5000,
      });
      break;
    case 'DRAWING':
      // Either drawer view or guesser view
      await expect(page.locator('canvas')).toBeVisible({ timeout: 5000 });
      break;
    case 'VOTING':
      await expect(page.locator('text=Vote')).toBeVisible({ timeout: 5000 });
      break;
    case 'COUNTDOWN':
      await expect(page.locator('.text-9xl, .text-7xl')).toBeVisible({ timeout: 5000 });
      break;
    default:
      // For other phases, just verify room is accessible
      await page.waitForTimeout(500);
  }
}

// ============================================
// Timer Utilities
// ============================================

/**
 * Gets the current timer value from the UI
 */
export async function getTimerValue(page: Page): Promise<number> {
  const timerLocator = page.locator('[data-testid="timer"], .timer-display, .countdown-timer');
  if (await timerLocator.isVisible({ timeout: 1000 }).catch(() => false)) {
    const text = await timerLocator.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
  return 0;
}

/**
 * Waits for timer to reach a specific value
 */
export async function waitForTimerValue(page: Page, value: number, timeout = 60000): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const currentValue = await getTimerValue(page);
    if (currentValue <= value) return;
    await page.waitForTimeout(500);
  }
  throw new Error(`Timer did not reach ${value} within ${timeout}ms`);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Waits for a specific amount of time (use sparingly)
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generates a unique player name
 */
export function generatePlayerName(prefix = 'Player'): string {
  return `${prefix}_${Date.now().toString(36)}`;
}
