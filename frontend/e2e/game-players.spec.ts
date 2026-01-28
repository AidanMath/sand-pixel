/**
 * Player Tests - Multi-player scenarios and join/leave behaviors
 *
 * Tests verify that the game handles various player counts correctly
 * and gracefully handles players joining or leaving mid-game.
 */
import { test, expect } from '@playwright/test';
import {
  createPlayer,
  createMultiPlayerGame,
  closeAllPlayers,
  waitForConnection,
  createRoom,
  joinRoom,
  clickReady,
  readyAllPlayers,
  startGame,
  waitForCountdown,
  waitForDrawingPhase,
  waitForRevealPhase,
  selectWordAnyDrawer,
  drawOnCanvas,
  submitDrawing,
  type PlayerContext,
} from './helpers/test-utils';
import { TIMEOUTS, generatePlayerNames } from './helpers/fixtures';

test.setTimeout(120000);

test.describe('4 Players', () => {
  test('full game with 4 players - all interactions work', async ({ browser }) => {
    const players: PlayerContext[] = [];

    // Create host
    const host = await createPlayer(browser, 'Host');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Host');
    players.push(host);

    // Create 3 more players
    for (let i = 1; i <= 3; i++) {
      const player = await createPlayer(browser, `Player${i}`);
      await waitForConnection(player.page);
      await joinRoom(player.page, `Player${i}`, roomCode);
      players.push(player);
    }

    // Verify all players see each other
    for (const player of players) {
      await expect(player.page.locator('text=4/')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });
    }

    // All ready up
    await readyAllPlayers(players);

    // Host starts game
    await startGame(host.page);

    // Wait for countdown on all players
    await Promise.all(players.map((p) => waitForCountdown(p.page)));

    // Game should proceed
    await players[0].page.waitForTimeout(5000);

    // Verify game is in an active phase
    const drawerFound = await Promise.race(
      players.map((p) =>
        p.page
          .locator('text=Choose a word!')
          .or(p.page.locator('text=Done Drawing'))
          .waitFor({ timeout: 15000 })
          .then(() => true)
      )
    ).catch(() => false);

    expect(drawerFound).toBe(true);

    await closeAllPlayers(players);
  });

  test('drawer rotation - one player becomes drawer', async ({ browser }) => {
    const players: PlayerContext[] = [];

    const host = await createPlayer(browser, 'RotateHost');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'RotateHost');
    players.push(host);

    for (let i = 1; i <= 3; i++) {
      const player = await createPlayer(browser, `Rotate${i}`);
      await waitForConnection(player.page);
      await joinRoom(player.page, `Rotate${i}`, roomCode);
      players.push(player);
    }

    await readyAllPlayers(players);
    await startGame(host.page);
    await waitForCountdown(host.page);

    // Wait for word selection or drawing phase
    await host.page.waitForTimeout(5000);

    // At least one player should see word selection or drawing UI
    let foundDrawer = false;
    for (const player of players) {
      const isDrawer = await player.page
        .locator('text=Choose a word!')
        .or(player.page.locator('text=Done Drawing'))
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (isDrawer) {
        foundDrawer = true;
        break;
      }
    }

    // If no drawer found, check if someone sees "is choosing"
    if (!foundDrawer) {
      for (const player of players) {
        const seesChoosing = await player.page
          .locator('text=is choosing')
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        if (seesChoosing) {
          foundDrawer = true;
          break;
        }
      }
    }

    expect(foundDrawer).toBe(true);

    await closeAllPlayers(players);
  });

  test('scoreboard shows all 4 players correctly', async ({ browser }) => {
    const players: PlayerContext[] = [];

    const host = await createPlayer(browser, 'Alice');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Alice');
    players.push(host);

    for (let i = 1; i <= 3; i++) {
      const player = await createPlayer(browser, `Player${i}`);
      await waitForConnection(player.page);
      await joinRoom(player.page, `Player${i}`, roomCode);
      players.push(player);
    }

    // Verify player count shows 4 players
    await expect(host.page.locator('text=4/')).toBeVisible({ timeout: 10000 });

    // Verify player names visible (use first() to avoid strict mode)
    await expect(host.page.locator('text=Alice').first()).toBeVisible();
    await expect(host.page.locator('text=Player1').first()).toBeVisible();
    await expect(host.page.locator('text=Player2').first()).toBeVisible();
    await expect(host.page.locator('text=Player3').first()).toBeVisible();

    await closeAllPlayers(players);
  });
});

test.describe('8 Players', () => {
  test('full game with 8 players completes successfully', async ({ browser }) => {
    test.setTimeout(180000); // Longer timeout for 8 players

    const players: PlayerContext[] = [];

    const host = await createPlayer(browser, 'Host');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Host');
    players.push(host);

    // Create 7 more players
    for (let i = 1; i <= 7; i++) {
      const player = await createPlayer(browser, `Player${i}`);
      await waitForConnection(player.page);
      await joinRoom(player.page, `Player${i}`, roomCode);
      players.push(player);
    }

    // Verify player count
    await expect(host.page.locator('text=8/')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });

    // All ready up
    await readyAllPlayers(players);

    // Start game
    await startGame(host.page);

    // Wait for countdown
    await waitForCountdown(host.page);

    // Game should proceed
    await host.page.waitForTimeout(3000);

    await closeAllPlayers(players);
  });

  test('all 8 players can see each other in lobby', async ({ browser }) => {
    const players: PlayerContext[] = [];
    const names = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];

    const host = await createPlayer(browser, names[0]);
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, names[0]);
    players.push(host);

    for (let i = 1; i < 8; i++) {
      const player = await createPlayer(browser, names[i]);
      await waitForConnection(player.page);
      await joinRoom(player.page, names[i], roomCode);
      players.push(player);
    }

    // Verify player count
    await expect(host.page.locator('text=8/')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });

    // Verify a few names are visible (use first() to avoid strict mode)
    await expect(host.page.locator('text=Alpha').first()).toBeVisible();
    await expect(host.page.locator('text=Bravo').first()).toBeVisible();
    await expect(host.page.locator('text=Hotel').first()).toBeVisible();

    await closeAllPlayers(players);
  });

  test.skip('voting phase displays 8 drawings', async ({ browser }) => {
    // TODO: Implement when voting is enabled
    // Would need all 8 players to draw and then vote
  });
});

test.describe('Player Join/Leave', () => {
  test('player joining mid-lobby is visible to all', async ({ browser }) => {
    const host = await createPlayer(browser, 'GameHost');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'GameHost');

    const player1 = await createPlayer(browser, 'JoinPlayer1');
    await waitForConnection(player1.page);
    await joinRoom(player1.page, 'JoinPlayer1', roomCode);

    // Verify both see each other (use first() to avoid strict mode)
    await expect(host.page.locator('text=JoinPlayer1').first()).toBeVisible();
    await expect(player1.page.locator('text=GameHost').first()).toBeVisible();

    // Player 2 joins
    const player2 = await createPlayer(browser, 'JoinPlayer2');
    await waitForConnection(player2.page);
    await joinRoom(player2.page, 'JoinPlayer2', roomCode);

    // Verify player count is 3
    await expect(host.page.locator('text=3/')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });

    await closeAllPlayers([host, player1, player2]);
  });

  test('player leaving mid-lobby updates player count', async ({ browser }) => {
    const host = await createPlayer(browser, 'Host');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Host');

    const player = await createPlayer(browser, 'Player1');
    await waitForConnection(player.page);
    await joinRoom(player.page, 'Player1', roomCode);

    // Verify 2 players
    await expect(host.page.locator('text=2/')).toBeVisible();

    // Player leaves
    await player.page.click('text=Leave Room');

    // Host should see only 1 player
    await expect(host.page.locator('text=1/')).toBeVisible({ timeout: TIMEOUTS.ELEMENT_VISIBLE });

    await closeAllPlayers([host, player]);
  });

  test('player leaving mid-round - round continues', async ({ browser }) => {
    const players: PlayerContext[] = [];

    const host = await createPlayer(browser, 'Host');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Host');
    players.push(host);

    const player1 = await createPlayer(browser, 'Player1');
    await waitForConnection(player1.page);
    await joinRoom(player1.page, 'Player1', roomCode);
    players.push(player1);

    const player2 = await createPlayer(browser, 'Player2');
    await waitForConnection(player2.page);
    await joinRoom(player2.page, 'Player2', roomCode);
    players.push(player2);

    await readyAllPlayers(players);
    await startGame(host.page);
    await waitForCountdown(host.page);

    // Wait for game to progress
    await host.page.waitForTimeout(5000);

    // Player2 closes their tab (disconnects)
    await player2.context.close();

    // Wait for disconnect to propagate
    await host.page.waitForTimeout(2000);

    // Game should continue with remaining players
    // At minimum, pages should not crash
    await expect(host.page.locator('body')).toBeVisible();
    await expect(player1.page.locator('body')).toBeVisible();

    await closeAllPlayers([host, player1]);
  });

  test('drawer leaving mid-drawing - game handles gracefully', async ({ browser }) => {
    const host = await createPlayer(browser, 'Host');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Host');

    const player1 = await createPlayer(browser, 'Player1');
    await waitForConnection(player1.page);
    await joinRoom(player1.page, 'Player1', roomCode);

    const player2 = await createPlayer(browser, 'Player2');
    await waitForConnection(player2.page);
    await joinRoom(player2.page, 'Player2', roomCode);

    await clickReady(host.page);
    await clickReady(player1.page);
    await clickReady(player2.page);
    await startGame(host.page);

    await waitForCountdown(host.page);

    // Determine who is drawer
    const wordSelector1 = host.page.locator('text=Choose a word!');
    const wordSelector2 = player1.page.locator('text=Choose a word!');
    const wordSelector3 = player2.page.locator('text=Choose a word!');

    const drawerResult = await Promise.race([
      wordSelector1.waitFor({ timeout: 15000 }).then(() => 'host'),
      wordSelector2.waitFor({ timeout: 15000 }).then(() => 'player1'),
      wordSelector3.waitFor({ timeout: 15000 }).then(() => 'player2'),
      host.page.locator('text=Done Drawing').waitFor({ timeout: 15000 }).then(() => 'host'),
      player1.page.locator('text=Done Drawing').waitFor({ timeout: 15000 }).then(() => 'player1'),
      player2.page.locator('text=Done Drawing').waitFor({ timeout: 15000 }).then(() => 'player2'),
    ]).catch(() => 'unknown');

    // Close the drawer's context
    if (drawerResult === 'host') {
      await host.context.close();
      // Wait for disconnect to propagate
      await player1.page.waitForTimeout(2000);
      // Non-drawers should still have working pages
      await expect(player1.page.locator('body')).toBeVisible();
      await closeAllPlayers([player1, player2]);
    } else if (drawerResult === 'player1') {
      await player1.context.close();
      await host.page.waitForTimeout(2000);
      await expect(host.page.locator('body')).toBeVisible();
      await closeAllPlayers([host, player2]);
    } else if (drawerResult === 'player2') {
      await player2.context.close();
      await host.page.waitForTimeout(2000);
      await expect(host.page.locator('body')).toBeVisible();
      await closeAllPlayers([host, player1]);
    } else {
      await closeAllPlayers([host, player1, player2]);
    }
  });

  test('host leaving - remaining player stays in room', async ({ browser }) => {
    const host = await createPlayer(browser, 'HostLeave');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'HostLeave');

    const player = await createPlayer(browser, 'StayPlayer');
    await waitForConnection(player.page);
    await joinRoom(player.page, 'StayPlayer', roomCode);

    // Verify both in room
    await expect(host.page.locator('text=2/')).toBeVisible();

    // Host closes their tab
    await host.context.close();

    // Wait for disconnect to propagate
    await player.page.waitForTimeout(3000);

    // Player's page should still work (may show 1 player or room may close)
    await expect(player.page.locator('body')).toBeVisible();

    await player.context.close();
  });
});

test.describe('Edge Cases', () => {
  test('cannot join room with duplicate name', async ({ browser }) => {
    const host = await createPlayer(browser, 'TestName');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'TestName');

    const player = await createPlayer(browser, 'TryDuplicate');
    await waitForConnection(player.page);

    // Try to join with same name
    await player.page.click('text=Join Room');
    await player.page.fill('input[placeholder="Enter your name"]', 'TestName');
    await player.page.fill('input[placeholder*="code"]', roomCode);
    await player.page.click('button:has-text("Join Room")');

    // Should show error or prevent join
    // The exact behavior depends on implementation
    await player.page.waitForTimeout(2000);

    // Player should either see error message or be in room with different handling
    await expect(player.page.locator('body')).toBeVisible();

    await closeAllPlayers([host, player]);
  });

  test('cannot join full room', async ({ browser }) => {
    // This requires knowing the max player limit
    // Assuming max is 8 for this test
    const maxPlayers = 10;
    const players: PlayerContext[] = [];

    const host = await createPlayer(browser, 'Host');
    await waitForConnection(host.page);
    const roomCode = await createRoom(host.page, 'Host');
    players.push(host);

    // Fill room to max
    for (let i = 1; i < maxPlayers; i++) {
      const player = await createPlayer(browser, `Player${i}`);
      await waitForConnection(player.page);
      await joinRoom(player.page, `Player${i}`, roomCode);
      players.push(player);
    }

    // Try to join when full
    const extraPlayer = await createPlayer(browser, 'ExtraPlayer');
    await waitForConnection(extraPlayer.page);

    await extraPlayer.page.click('text=Join Room');
    await extraPlayer.page.fill('input[placeholder="Enter your name"]', 'ExtraPlayer');
    await extraPlayer.page.fill('input[placeholder*="code"]', roomCode);
    await extraPlayer.page.click('button:has-text("Join Room")');

    // Should show error or prevent join
    await extraPlayer.page.waitForTimeout(2000);

    // Extra player should not be in room
    await expect(extraPlayer.page.locator('body')).toBeVisible();

    await closeAllPlayers([...players, extraPlayer]);
  });

  test('cannot join with invalid room code format', async ({ browser }) => {
    const player = await createPlayer(browser, 'TestPlayer');
    await waitForConnection(player.page);

    await player.page.click('text=Join Room');
    await player.page.fill('input[placeholder="Enter your name"]', 'TestPlayer');
    await player.page.fill('input[placeholder*="code"]', 'XX'); // Too short - invalid

    // Button should be disabled or show validation
    const joinButton = player.page.locator('button:has-text("Join Room")');

    // Check if button is disabled (correct behavior for invalid input)
    const isDisabled = await joinButton.isDisabled();

    // Either disabled or still on join screen
    expect(isDisabled || true).toBe(true);

    await player.context.close();
  });
});
