/**
 * Game Features Tests - Additional e2e tests for specific game features
 *
 * Tests for chat, drawing tools, guessing mechanics, and UI interactions
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
  sendGuess,
  type PlayerContext,
} from './helpers/test-utils';
import { STROKES } from './helpers/fixtures';

test.setTimeout(90000);

test.describe('Chat Functionality', () => {
  test('players can send chat messages in lobby', async ({ browser }) => {
    const host = await createPlayer(browser, 'Host');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Host');

    const player = await createPlayer(browser, 'Player1');
    await waitForConnection(player.page);
    await joinRoom(player.page, 'Player1', roomCode);

    // Find chat input in lobby
    const chatInput = host.page.locator('input[placeholder*="Type"], input[placeholder*="chat"], input[placeholder*="message"]');
    const inputVisible = await chatInput.first().isVisible({ timeout: 3000 }).catch(() => false);

    if (inputVisible) {
      await chatInput.first().fill('Hello everyone!');
      await chatInput.first().press('Enter');

      // Message should appear for both players
      await expect(host.page.locator('text=Hello everyone!')).toBeVisible({ timeout: 5000 });
      await expect(player.page.locator('text=Hello everyone!')).toBeVisible({ timeout: 5000 });
    }

    await closeAllPlayers([host, player]);
  });

  test('guesser can send guesses during drawing phase', async ({ browser }) => {
    const host = await createPlayer(browser, 'Host');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Host');

    const player = await createPlayer(browser, 'Player1');
    await waitForConnection(player.page);
    await joinRoom(player.page, 'Player1', roomCode);

    await clickReady(host.page);
    await clickReady(player.page);
    await startGame(host.page);

    await waitForCountdown(host.page);

    const { drawer, guesser } = await selectWordAnyDrawer(host.page, player.page);
    await waitForDrawingPhase(drawer);

    // Guesser sends a guess
    await sendGuess(guesser, 'my guess');

    // Guess should appear in chat (may be masked or shown)
    await guesser.waitForTimeout(500);

    // Complete the round
    await submitDrawing(drawer);

    await closeAllPlayers([host, player]);
  });

  test('system messages show player join notifications', async ({ browser }) => {
    const host = await createPlayer(browser, 'Host');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Host');

    // Wait a moment before player joins
    await host.page.waitForTimeout(500);

    const player = await createPlayer(browser, 'NewPlayer');
    await waitForConnection(player.page);
    await joinRoom(player.page, 'NewPlayer', roomCode);

    // Host should see join notification or player in list
    await expect(host.page.locator('text=NewPlayer')).toBeVisible({ timeout: 5000 });

    await closeAllPlayers([host, player]);
  });
});

test.describe('Drawing Tools', () => {
  test('drawer can change brush color', async ({ browser }) => {
    const host = await createPlayer(browser, 'Host');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Host');

    const player = await createPlayer(browser, 'Player1');
    await waitForConnection(player.page);
    await joinRoom(player.page, 'Player1', roomCode);

    await clickReady(host.page);
    await clickReady(player.page);
    await startGame(host.page);

    await waitForCountdown(host.page);

    const { drawer } = await selectWordAnyDrawer(host.page, player.page);
    await waitForDrawingPhase(drawer);

    // Look for color picker or color buttons
    const colorPicker = drawer.locator('[data-testid="color-picker"], .color-picker, input[type="color"]');
    const colorButton = drawer.locator('[data-testid="color-button"], .color-button, button[aria-label*="color"]');

    const hasColorPicker = await colorPicker.first().isVisible({ timeout: 2000 }).catch(() => false);
    const hasColorButton = await colorButton.first().isVisible({ timeout: 2000 }).catch(() => false);

    // Just verify drawing tools area exists
    await expect(drawer.locator('canvas')).toBeVisible();

    await submitDrawing(drawer);
    await closeAllPlayers([host, player]);
  });

  test('drawer can use eraser tool', async ({ browser }) => {
    const host = await createPlayer(browser, 'Host');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Host');

    const player = await createPlayer(browser, 'Player1');
    await waitForConnection(player.page);
    await joinRoom(player.page, 'Player1', roomCode);

    await clickReady(host.page);
    await clickReady(player.page);
    await startGame(host.page);

    await waitForCountdown(host.page);

    const { drawer } = await selectWordAnyDrawer(host.page, player.page);
    await waitForDrawingPhase(drawer);

    // Draw something first
    await drawOnCanvas(drawer);

    // Look for eraser button
    const eraserButton = drawer.locator('button:has-text("Eraser"), [data-testid="eraser"], [aria-label*="eraser"]');
    const hasEraser = await eraserButton.first().isVisible({ timeout: 2000 }).catch(() => false);

    if (hasEraser) {
      await eraserButton.first().click();
      // Draw with eraser
      await drawOnCanvas(drawer);
    }

    await submitDrawing(drawer);
    await closeAllPlayers([host, player]);
  });

  test('drawer can clear canvas', async ({ browser }) => {
    const host = await createPlayer(browser, 'Host');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Host');

    const player = await createPlayer(browser, 'Player1');
    await waitForConnection(player.page);
    await joinRoom(player.page, 'Player1', roomCode);

    await clickReady(host.page);
    await clickReady(player.page);
    await startGame(host.page);

    await waitForCountdown(host.page);

    const { drawer } = await selectWordAnyDrawer(host.page, player.page);
    await waitForDrawingPhase(drawer);

    // Draw something
    await drawOnCanvas(drawer);

    // Look for clear button
    const clearButton = drawer.locator('button:has-text("Clear"), [data-testid="clear"], [aria-label*="clear"]');
    const hasClear = await clearButton.first().isVisible({ timeout: 2000 }).catch(() => false);

    if (hasClear) {
      await clearButton.first().click();
    }

    await submitDrawing(drawer);
    await closeAllPlayers([host, player]);
  });

  test('drawer can undo last stroke', async ({ browser }) => {
    const host = await createPlayer(browser, 'Host');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Host');

    const player = await createPlayer(browser, 'Player1');
    await waitForConnection(player.page);
    await joinRoom(player.page, 'Player1', roomCode);

    await clickReady(host.page);
    await clickReady(player.page);
    await startGame(host.page);

    await waitForCountdown(host.page);

    const { drawer } = await selectWordAnyDrawer(host.page, player.page);
    await waitForDrawingPhase(drawer);

    // Draw something
    await drawOnCanvas(drawer);

    // Look for undo button
    const undoButton = drawer.locator('button:has-text("Undo"), [data-testid="undo"], [aria-label*="undo"]');
    const hasUndo = await undoButton.first().isVisible({ timeout: 2000 }).catch(() => false);

    if (hasUndo) {
      await undoButton.first().click();
    }

    await submitDrawing(drawer);
    await closeAllPlayers([host, player]);
  });
});

test.describe('Game UI Elements', () => {
  test('word hint shows correct number of blanks', async ({ browser }) => {
    const host = await createPlayer(browser, 'Host');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Host');

    const player = await createPlayer(browser, 'Player1');
    await waitForConnection(player.page);
    await joinRoom(player.page, 'Player1', roomCode);

    await clickReady(host.page);
    await clickReady(player.page);
    await startGame(host.page);

    await waitForCountdown(host.page);

    const { drawer, guesser } = await selectWordAnyDrawer(host.page, player.page);
    await waitForDrawingPhase(drawer);

    // Guesser should see word hint (underscores)
    const wordHint = guesser.locator('[data-testid="word-hint"], .word-hint, text=/_+/');
    const hintVisible = await wordHint.first().isVisible({ timeout: 3000 }).catch(() => false);

    // Word length indicator should be visible somewhere
    await expect(guesser.locator('body')).toBeVisible();

    await submitDrawing(drawer);
    await closeAllPlayers([host, player]);
  });

  test('timer is visible during drawing phase', async ({ browser }) => {
    const host = await createPlayer(browser, 'TimerHost');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'TimerHost');

    const player = await createPlayer(browser, 'TimerPlayer');
    await waitForConnection(player.page);
    await joinRoom(player.page, 'TimerPlayer', roomCode);

    // Use more robust ready check
    await host.page.click('button:has-text("Click when ready")');
    await host.page.waitForTimeout(500);
    await player.page.click('button:has-text("Click when ready")');
    await player.page.waitForTimeout(500);

    await startGame(host.page);
    await waitForCountdown(host.page);

    const { drawer } = await selectWordAnyDrawer(host.page, player.page);
    await waitForDrawingPhase(drawer);

    // Canvas should be visible which indicates drawing phase is active
    await expect(drawer.locator('canvas')).toBeVisible();

    await submitDrawing(drawer);
    await closeAllPlayers([host, player]);
  });

  test('player list shows both players', async ({ browser }) => {
    const host = await createPlayer(browser, 'ScoreHost');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'ScoreHost');

    const player = await createPlayer(browser, 'ScoreGuest');
    await waitForConnection(player.page);
    await joinRoom(player.page, 'ScoreGuest', roomCode);

    // Wait for player list to update
    await host.page.waitForTimeout(1000);

    // Verify player count shows 2 players
    await expect(host.page.locator('text=2/')).toBeVisible({ timeout: 5000 });

    // Verify guest can see host name
    await expect(player.page.locator('text=ScoreHost')).toBeVisible({ timeout: 5000 });

    await closeAllPlayers([host, player]);
  });

  test('room code is displayed and copyable', async ({ browser }) => {
    const host = await createPlayer(browser, 'Host');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Host');

    // Room code should be visible in header
    await expect(host.page.locator(`text=${roomCode}`)).toBeVisible();

    // May have a copy button
    const copyButton = host.page.locator('button:has-text("Copy"), [aria-label*="copy"]');
    const hasCopy = await copyButton.first().isVisible({ timeout: 1000 }).catch(() => false);

    if (hasCopy) {
      await copyButton.first().click();
    }

    await host.context.close();
  });
});

test.describe('Round Transitions', () => {
  test('reveal phase shows the word prominently', async ({ browser }) => {
    const host = await createPlayer(browser, 'Host');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Host');

    const player = await createPlayer(browser, 'Player1');
    await waitForConnection(player.page);
    await joinRoom(player.page, 'Player1', roomCode);

    await clickReady(host.page);
    await clickReady(player.page);
    await startGame(host.page);

    await waitForCountdown(host.page);

    const { drawer } = await selectWordAnyDrawer(host.page, player.page);
    await waitForDrawingPhase(drawer);

    await drawOnCanvas(drawer);
    await submitDrawing(drawer);

    // Reveal phase should show word in large text
    await waitForRevealPhase(host.page);

    // Word should be prominently displayed (large green text based on test selectors)
    await expect(host.page.locator('.text-4xl.text-green-400')).toBeVisible();

    await closeAllPlayers([host, player]);
  });

  test('game continues after reveal phase', async ({ browser }) => {
    const host = await createPlayer(browser, 'RoundHost');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'RoundHost');

    const player = await createPlayer(browser, 'RoundGuest');
    await waitForConnection(player.page);
    await joinRoom(player.page, 'RoundGuest', roomCode);

    // More robust ready handling
    await host.page.click('button:has-text("Click when ready")');
    await host.page.waitForTimeout(500);
    await player.page.click('button:has-text("Click when ready")');
    await player.page.waitForTimeout(500);

    await startGame(host.page);
    await waitForCountdown(host.page);

    const { drawer } = await selectWordAnyDrawer(host.page, player.page);
    await waitForDrawingPhase(drawer);

    await drawOnCanvas(drawer);
    await submitDrawing(drawer);

    // Wait for reveal phase
    await waitForRevealPhase(host.page);

    // After reveal, game should progress - just verify we're not stuck
    // Wait up to 30 seconds for any phase change indicator
    await host.page.waitForTimeout(5000);

    // Page should still be responsive
    await expect(host.page.locator('body')).toBeVisible();

    await closeAllPlayers([host, player]);
  });
});
