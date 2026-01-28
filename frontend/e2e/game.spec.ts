/**
 * Core Game Tests - Basic happy-path tests for Sand Draw multiplayer game
 *
 * These tests verify the fundamental game mechanics work correctly
 * using the real backend WebSocket connection.
 */
import { test, expect } from '@playwright/test';
import {
  createPlayer,
  closeAllPlayers,
  waitForConnection,
  createRoom,
  joinRoom,
  clickReady,
  startGame,
  waitForCountdown,
  waitForDrawingPhase,
  waitForRevealPhase,
  selectWordAnyDrawer,
  drawOnCanvas,
  submitDrawing,
  refreshAndReconnect,
  type PlayerContext,
} from './helpers/test-utils';

test.describe('Sand Pixel Multiplayer Game', () => {
  test('home page loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1:has-text("Sand Draw")')).toBeVisible();
    await expect(page.locator('text=Create Room')).toBeVisible();
    await expect(page.locator('text=Join Room')).toBeVisible();
  });

  test('can create a room', async ({ page }) => {
    await page.goto('/');
    await waitForConnection(page);

    const roomCode = await createRoom(page, 'TestPlayer');

    expect(roomCode).toHaveLength(6);
    await expect(page.locator('text=TestPlayer')).toBeVisible();
    await expect(page.locator('text=1/')).toBeVisible(); // 1/X players
  });

  test('can join an existing room', async ({ browser }) => {
    // Player 1 creates room
    const player1 = await createPlayer(browser, 'Player1');
    await waitForConnection(player1.page);
    const roomCode = await createRoom(player1.page, 'Player1');

    // Player 2 joins room
    const player2 = await createPlayer(browser, 'Player2');
    await waitForConnection(player2.page);
    await joinRoom(player2.page, 'Player2', roomCode);

    // Both players should see each other
    await expect(player1.page.locator('text=Player2')).toBeVisible({ timeout: 5000 });
    await expect(player2.page.locator('text=Player1')).toBeVisible();
    await expect(player1.page.locator('text=2/')).toBeVisible(); // 2/X players

    await closeAllPlayers([player1, player2]);
  });

  test('players can ready up', async ({ browser }) => {
    const player1 = await createPlayer(browser, 'Host');
    await waitForConnection(player1.page);
    const roomCode = await createRoom(player1.page, 'Host');

    const player2 = await createPlayer(browser, 'Guest');
    await waitForConnection(player2.page);
    await joinRoom(player2.page, 'Guest', roomCode);

    // Both ready up
    await clickReady(player1.page);
    await clickReady(player2.page);

    // Host should see Start Game button enabled
    const startButton = player1.page.locator('button:has-text("Start Game")');
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();

    await closeAllPlayers([player1, player2]);
  });

  test('host can start game and drawer sees word options', async ({ browser }) => {
    const player1 = await createPlayer(browser, 'Alice');
    await waitForConnection(player1.page);
    const roomCode = await createRoom(player1.page, 'Alice');

    const player2 = await createPlayer(browser, 'Bob');
    await waitForConnection(player2.page);
    await joinRoom(player2.page, 'Bob', roomCode);

    // Both ready up
    await clickReady(player1.page);
    await clickReady(player2.page);

    // Host starts game
    await startGame(player1.page);

    // Wait for countdown on both players
    await waitForCountdown(player1.page);
    await waitForCountdown(player2.page);

    // Wait for word selection phase - race to see which player gets word options first
    // Also handle case where game auto-selected a word and is already in drawing phase
    const wordSelector1 = player1.page.locator('text=Choose a word!');
    const wordSelector2 = player2.page.locator('text=Choose a word!');
    const doneDrawing1 = player1.page.locator('text=Done Drawing');
    const doneDrawing2 = player2.page.locator('text=Done Drawing');

    const result = await Promise.race([
      wordSelector1.waitFor({ timeout: 15000 }).then(() => ({ phase: 'word', drawer: 'player1' })),
      wordSelector2.waitFor({ timeout: 15000 }).then(() => ({ phase: 'word', drawer: 'player2' })),
      doneDrawing1.waitFor({ timeout: 15000 }).then(() => ({ phase: 'drawing', drawer: 'player1' })),
      doneDrawing2.waitFor({ timeout: 15000 }).then(() => ({ phase: 'drawing', drawer: 'player2' })),
    ]);

    const drawer = result.drawer === 'player1' ? player1 : player2;
    const guesser = result.drawer === 'player1' ? player2 : player1;

    // If still in word selection phase, verify the drawer sees 3 word options
    if (result.phase === 'word') {
      const wordButtons = drawer.page.locator('.space-y-3 button');
      await expect(wordButtons).toHaveCount(3);

      // Guesser should see waiting message
      await expect(guesser.page.locator('text=is choosing a word')).toBeVisible();
    } else {
      // Already in drawing phase, verify drawer sees Done Drawing
      await expect(drawer.page.locator('text=Done Drawing')).toBeVisible();
    }

    await closeAllPlayers([player1, player2]);
  });

  test('full game round flow', async ({ browser }) => {
    const player1 = await createPlayer(browser, 'Alice');
    await waitForConnection(player1.page);
    const roomCode = await createRoom(player1.page, 'Alice');

    const player2 = await createPlayer(browser, 'Bob');
    await waitForConnection(player2.page);
    await joinRoom(player2.page, 'Bob', roomCode);

    // Both ready up and start
    await clickReady(player1.page);
    await clickReady(player2.page);
    await startGame(player1.page);

    // Wait for countdown
    await waitForCountdown(player1.page);

    // Wait for word selection and select a word
    const { drawer, guesser } = await selectWordAnyDrawer(player1.page, player2.page);

    // Wait for drawing phase to start
    await waitForDrawingPhase(drawer);

    // Drawing phase - drawer should see canvas and tools
    await expect(drawer.locator('canvas')).toBeVisible();

    // Guesser should see the canvas (disabled)
    await expect(guesser.locator('canvas')).toBeVisible({ timeout: 5000 });

    // Drawer submits drawing
    await submitDrawing(drawer);

    // Reveal phase - should show the word in large green text
    await waitForRevealPhase(player1.page);
    await waitForRevealPhase(player2.page);

    await closeAllPlayers([player1, player2]);
  });

  test('drawing on canvas works', async ({ browser }) => {
    const player1 = await createPlayer(browser, 'Alice');
    await waitForConnection(player1.page);
    const roomCode = await createRoom(player1.page, 'Alice');

    const player2 = await createPlayer(browser, 'Bob');
    await waitForConnection(player2.page);
    await joinRoom(player2.page, 'Bob', roomCode);

    await clickReady(player1.page);
    await clickReady(player2.page);
    await startGame(player1.page);

    // Wait for countdown
    await waitForCountdown(player1.page);

    // Wait for word selection and select a word
    const { drawer } = await selectWordAnyDrawer(player1.page, player2.page);

    // Wait for drawing phase to start
    await waitForDrawingPhase(drawer);

    // Draw on canvas
    await drawOnCanvas(drawer);

    // Submit and verify reveal
    await submitDrawing(drawer);

    // Wait for reveal on both players
    await waitForRevealPhase(player1.page);

    await closeAllPlayers([player1, player2]);
  });

  test('player can leave room', async ({ browser }) => {
    const player1 = await createPlayer(browser, 'Host');
    await waitForConnection(player1.page);
    const roomCode = await createRoom(player1.page, 'Host');

    const player2 = await createPlayer(browser, 'Guest');
    await waitForConnection(player2.page);
    await joinRoom(player2.page, 'Guest', roomCode);

    // Guest leaves
    await player2.page.click('text=Leave Room');

    // Guest should be back at home
    await expect(player2.page.locator('h1:has-text("Sand Draw")')).toBeVisible();

    // Host should see only 1 player
    await expect(player1.page.locator('text=1/')).toBeVisible({ timeout: 5000 });

    await closeAllPlayers([player1, player2]);
  });

  test('page refresh reconnects to room', async ({ browser }) => {
    const player1 = await createPlayer(browser, 'RefreshTest');
    await waitForConnection(player1.page);
    const roomCode = await createRoom(player1.page, 'RefreshTest');

    // Refresh the page
    await refreshAndReconnect(player1.page, roomCode);

    // Check player name is visible
    await expect(player1.page.locator('.font-semibold:has-text("RefreshTest")')).toBeVisible();

    await player1.context.close();
  });
});
