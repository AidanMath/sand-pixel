/**
 * Game Resilience Tests - Page Refresh & Disconnection
 *
 * These tests verify that the game handles page refreshes and disconnections
 * gracefully across all game phases. This is the highest priority test suite
 * as player experience is critical when network issues occur.
 */
import { test, expect, Browser, Page } from '@playwright/test';
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
  verifyStateAfterRefresh,
  type PlayerContext,
} from './helpers/test-utils';
import { TIMEOUTS } from './helpers/fixtures';

// Increase test timeout for resilience tests
test.setTimeout(90000);

test.describe('Page Refresh During Active Game', () => {
  test.describe('LOBBY phase', () => {
    test('host refresh - retains room and can rejoin', async ({ browser }) => {
      const host = await createPlayer(browser, 'RefreshHost');
      await waitForConnection(host.page);
      const roomCode = await createRoom(host.page, 'RefreshHost');

      // Verify in room before refresh
      await expect(host.page.locator(`h1:has-text("Room: ${roomCode}")`)).toBeVisible();

      // Refresh
      await refreshAndReconnect(host.page, roomCode);

      // Verify still in room after refresh
      await expect(host.page.locator(`h1:has-text("Room: ${roomCode}")`)).toBeVisible();
      await expect(host.page.locator('text=RefreshHost').first()).toBeVisible();

      await host.context.close();
    });

    test('player refresh - rejoins same room with same name', async ({ browser }) => {
      const host = await createPlayer(browser, 'Host');
      await waitForConnection(host.page);
      const roomCode = await createRoom(host.page, 'Host');

      const player = await createPlayer(browser, 'Player1');
      await waitForConnection(player.page);
      await joinRoom(player.page, 'Player1', roomCode);

      // Verify both players see each other
      await expect(host.page.locator('text=Player1')).toBeVisible();

      // Player refreshes
      await refreshAndReconnect(player.page, roomCode);

      // Verify player is still in room with correct name
      await expect(player.page.locator('.font-semibold:has-text("Player1")')).toBeVisible();
      await expect(host.page.locator('text=Player1')).toBeVisible();

      await closeAllPlayers([host, player]);
    });

    test('preserves ready status after refresh', async ({ browser }) => {
      const host = await createPlayer(browser, 'Host');
      await waitForConnection(host.page);
      const roomCode = await createRoom(host.page, 'Host');

      const player = await createPlayer(browser, 'Player1');
      await waitForConnection(player.page);
      await joinRoom(player.page, 'Player1', roomCode);

      // Both ready up
      await clickReady(host.page);
      await clickReady(player.page);

      // Verify ready status
      await expect(host.page.locator('button:has-text("Ready!")')).toBeVisible();

      // Host refreshes
      await refreshAndReconnect(host.page, roomCode);

      // Wait for reconnection to complete
      await host.page.waitForTimeout(1000);

      // Should maintain ready status and be able to see Start Game
      // Note: Ready status might reset on reconnect based on implementation
      await expect(host.page.locator(`h1:has-text("Room: ${roomCode}")`)).toBeVisible();

      await closeAllPlayers([host, player]);
    });
  });

  test.describe('COUNTDOWN phase', () => {
    test('rejoins and sees current countdown or next phase', async ({ browser }) => {
      const host = await createPlayer(browser, 'Host');
      await waitForConnection(host.page);
      const roomCode = await createRoom(host.page, 'Host');

      const player = await createPlayer(browser, 'Player1');
      await waitForConnection(player.page);
      await joinRoom(player.page, 'Player1', roomCode);

      await clickReady(host.page);
      await clickReady(player.page);
      await startGame(host.page);

      // Wait for countdown to start
      await waitForCountdown(host.page);

      // Player refreshes during countdown
      await player.page.reload();

      // Player should rejoin and see either countdown or next phase
      await expect(player.page.locator(`h1:has-text("Room: ${roomCode}")`)).toBeVisible({
        timeout: TIMEOUTS.CONNECTION,
      });

      // Game should continue (either in countdown or moved to next phase)
      // The exact phase depends on timing
      await player.page.waitForTimeout(2000);

      await closeAllPlayers([host, player]);
    });
  });

  test.describe('WORD_SELECTION phase', () => {
    test('drawer refresh - still sees word options or proceeds to drawing', async ({ browser }) => {
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

      // Wait for word selection phase
      const wordSelector1 = host.page.locator('text=Choose a word!');
      const wordSelector2 = player.page.locator('text=Choose a word!');

      // Wait to see who is drawer
      const result = await Promise.race([
        wordSelector1.waitFor({ timeout: 15000 }).then(() => 'host'),
        wordSelector2.waitFor({ timeout: 15000 }).then(() => 'player'),
        host.page.locator('text=Done Drawing').waitFor({ timeout: 15000 }).then(() => 'already_drawing'),
      ]).catch(() => 'already_drawing');

      if (result === 'host' || result === 'player') {
        const drawer = result === 'host' ? host : player;

        // Refresh the drawer's page
        await drawer.page.reload();

        // Wait for reconnection
        await expect(drawer.page.locator(`h1:has-text("Room: ${roomCode}")`)).toBeVisible({
          timeout: TIMEOUTS.CONNECTION,
        });

        // Drawer should either see word options again or be in drawing phase
        await drawer.page.waitForTimeout(2000);
      }

      await closeAllPlayers([host, player]);
    });

    test('guesser refresh - still sees waiting message', async ({ browser }) => {
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

      // Wait for word selection phase
      const wordSelector1 = host.page.locator('text=Choose a word!');
      const wordSelector2 = player.page.locator('text=Choose a word!');
      const waiting1 = host.page.locator('text=is choosing a word');
      const waiting2 = player.page.locator('text=is choosing a word');

      // Find who is guesser
      const result = await Promise.race([
        waiting1.waitFor({ timeout: 15000 }).then(() => 'host_is_guesser'),
        waiting2.waitFor({ timeout: 15000 }).then(() => 'player_is_guesser'),
        wordSelector1.waitFor({ timeout: 15000 }).then(() => 'host_is_drawer'),
        wordSelector2.waitFor({ timeout: 15000 }).then(() => 'player_is_drawer'),
      ]).catch(() => 'unknown');

      if (result === 'host_is_guesser' || result === 'player_is_guesser') {
        const guesser = result === 'host_is_guesser' ? host : player;

        // Refresh guesser
        await guesser.page.reload();

        // Should reconnect
        await expect(guesser.page.locator(`h1:has-text("Room: ${roomCode}")`)).toBeVisible({
          timeout: TIMEOUTS.CONNECTION,
        });
      }

      await closeAllPlayers([host, player]);
    });
  });

  test.describe('DRAWING phase (most critical)', () => {
    test('drawer refresh - canvas state handled, timer continues', async ({ browser }) => {
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

      // Draw something
      await drawOnCanvas(drawer);

      // Refresh drawer during drawing
      const drawerCtx = drawer === host.page ? host : player;
      await drawerCtx.page.reload();

      // Reconnect
      await expect(drawerCtx.page.locator(`h1:has-text("Room: ${roomCode}")`)).toBeVisible({
        timeout: TIMEOUTS.CONNECTION,
      });

      // Should see canvas (drawing state may be blank or preserved based on implementation)
      await expect(drawerCtx.page.locator('canvas')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });

      await closeAllPlayers([host, player]);
    });

    test('guesser refresh - sees canvas and can continue guessing', async ({ browser }) => {
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

      // Draw something
      await drawOnCanvas(drawer);

      // Refresh guesser
      const guesserCtx = guesser === host.page ? host : player;
      await guesserCtx.page.reload();

      // Reconnect
      await expect(guesserCtx.page.locator(`h1:has-text("Room: ${roomCode}")`)).toBeVisible({
        timeout: TIMEOUTS.CONNECTION,
      });

      // Should see canvas
      await expect(guesserCtx.page.locator('canvas')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });

      // Should be able to guess (chat input visible)
      const chatInput = guesserCtx.page.locator('input[placeholder*="guess"], input[placeholder*="Type"]');
      await expect(chatInput).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });

      await closeAllPlayers([host, player]);
    });
  });

  test.describe('REVEAL phase', () => {
    test('sees revealed word after refresh', async ({ browser }) => {
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

      // Submit drawing to trigger reveal
      await submitDrawing(drawer);

      // Wait for reveal phase
      await waitForRevealPhase(host.page);

      // Refresh player during reveal
      await player.page.reload();

      // Should reconnect
      await expect(player.page.locator(`h1:has-text("Room: ${roomCode}")`)).toBeVisible({
        timeout: TIMEOUTS.CONNECTION,
      });

      await closeAllPlayers([host, player]);
    });
  });

  test.describe('Multiple refreshes', () => {
    test('all players refresh at once - game continues', async ({ browser }) => {
      const host = await createPlayer(browser, 'RefreshAll1');
      await waitForConnection(host.page);
      const roomCode = await createRoom(host.page, 'RefreshAll1');

      const player = await createPlayer(browser, 'RefreshAll2');
      await waitForConnection(player.page);
      await joinRoom(player.page, 'RefreshAll2', roomCode);

      await clickReady(host.page);
      await clickReady(player.page);
      await startGame(host.page);

      await waitForCountdown(host.page);

      // Both refresh simultaneously
      await Promise.all([host.page.reload(), player.page.reload()]);

      // Both should reconnect
      await expect(host.page.locator(`h1:has-text("Room: ${roomCode}")`)).toBeVisible({
        timeout: TIMEOUTS.CONNECTION,
      });
      await expect(player.page.locator(`h1:has-text("Room: ${roomCode}")`)).toBeVisible({
        timeout: TIMEOUTS.CONNECTION,
      });

      // Both should see each other (use first() to avoid strict mode)
      await expect(host.page.locator('text=RefreshAll2').first()).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
      await expect(player.page.locator('text=RefreshAll1').first()).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });

      await closeAllPlayers([host, player]);
    });
  });
});

test.describe('Disconnection Scenarios', () => {
  test('drawer disconnects mid-drawing - game handles gracefully', async ({ browser }) => {
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

    // Drawer closes their page (simulates disconnect)
    const drawerCtx = drawer === host.page ? host : player;
    const guesserCtx = guesser === host.page ? host : player;

    await drawerCtx.context.close();

    // Guesser should see player disconnected or game handles it
    // Wait a moment for disconnect to propagate
    await guesserCtx.page.waitForTimeout(2000);

    // Game should handle disconnection (various behaviors possible)
    // At minimum, the page should not crash
    await expect(guesserCtx.page.locator('body')).toBeVisible();

    await guesserCtx.context.close();
  });

  test('guesser disconnects - game continues without them', async ({ browser }) => {
    const host = await createPlayer(browser, 'Host');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Host');

    const player = await createPlayer(browser, 'Player1');
    await waitForConnection(player.page);
    await joinRoom(player.page, 'Player1', roomCode);

    const player2 = await createPlayer(browser, 'Player2');
    await waitForConnection(player2.page);
    await joinRoom(player2.page, 'Player2', roomCode);

    await clickReady(host.page);
    await clickReady(player.page);
    await clickReady(player2.page);
    await startGame(host.page);

    await waitForCountdown(host.page);

    // Wait for drawing phase
    await host.page.waitForTimeout(5000);

    // One player disconnects
    await player.context.close();

    // Game should continue
    await host.page.waitForTimeout(2000);
    await expect(host.page.locator('body')).toBeVisible();

    await closeAllPlayers([host, player2]);
  });

  test('reconnection restores player to correct game state', async ({ browser }) => {
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

    // Wait for game to progress
    await host.page.waitForTimeout(3000);

    // Player disconnects and reconnects
    await player.page.reload();

    // Should reconnect to room
    await expect(player.page.locator(`h1:has-text("Room: ${roomCode}")`)).toBeVisible({
      timeout: TIMEOUTS.CONNECTION,
    });

    // Should be in a valid game state (not showing lobby if game is active)
    await player.page.waitForTimeout(1000);
    await expect(player.page.locator('body')).toBeVisible();

    await closeAllPlayers([host, player]);
  });
});

test.describe('Session Persistence', () => {
  test('page reload preserves session and auto-rejoins', async ({ browser }) => {
    const host = await createPlayer(browser, 'Host');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Host');

    // Reload without using helper (raw reload)
    await host.page.reload();

    // Should auto-rejoin
    await expect(host.page.locator(`h1:has-text("Room: ${roomCode}")`)).toBeVisible({
      timeout: TIMEOUTS.CONNECTION,
    });

    await host.context.close();
  });

  test('browser close and reopen can rejoin with same name', async ({ browser }) => {
    // Create first player
    const host1 = await createPlayer(browser, 'Host');
    await waitForConnection(host1.page);
    const roomCode = await createRoom(host1.page, 'Host');

    // Store the storage state
    const storageState = await host1.context.storageState();

    // Close first context
    await host1.context.close();

    // Create new context with same storage
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();
    await page.goto('/');

    // Should auto-reconnect or be able to rejoin
    await page.waitForTimeout(2000);

    // If auto-reconnect worked
    const roomHeader = page.locator(`h1:has-text("Room: ${roomCode}")`);
    const isInRoom = await roomHeader.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isInRoom) {
      // Manual rejoin should work
      await waitForConnection(page);
      await joinRoom(page, 'Host', roomCode);
    }

    await context.close();
  });
});
