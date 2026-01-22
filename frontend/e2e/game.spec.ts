import { test, expect, Page, Browser } from '@playwright/test';

// Helper to create a player page
async function createPlayer(browser: Browser, name: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  return page;
}

// Helper to wait for WebSocket connection
async function waitForConnection(page: Page) {
  await expect(page.locator('text=Create Room')).toBeVisible({ timeout: 10000 });
}

// Helper to create a room and return the room code
async function createRoom(page: Page, playerName: string): Promise<string> {
  await page.click('text=Create Room');
  await page.fill('input[placeholder="Enter your name"]', playerName);
  await page.click('button:has-text("Create Room")');

  // Wait for room to be created and get room code
  const roomHeader = page.locator('h1:has-text("Room:")');
  await expect(roomHeader).toBeVisible({ timeout: 10000 });
  const headerText = await roomHeader.textContent();
  const roomCode = headerText?.replace('Room: ', '').trim() || '';
  return roomCode;
}

// Helper to join a room
async function joinRoom(page: Page, playerName: string, roomCode: string) {
  await page.click('text=Join Room');
  await page.fill('input[placeholder="Enter your name"]', playerName);
  await page.fill('input[placeholder*="code"]', roomCode);
  await page.click('button:has-text("Join Room")');

  // Wait for room view
  await expect(page.locator(`h1:has-text("Room: ${roomCode}")`)).toBeVisible({ timeout: 10000 });
}

// Helper to click ready
async function clickReady(page: Page) {
  await page.click('button:has-text("Click when ready")');
  await expect(page.locator('button:has-text("Ready!")')).toBeVisible();
}

// Helper to wait for word selection and select a word (or detect already in drawing phase)
// Returns which player is the drawer
async function selectWord(player1: Page, player2: Page): Promise<{ drawer: Page; guesser: Page }> {
  // Race between word selection phase and drawing phase (in case word was auto-selected)
  const wordSelector1 = player1.locator('text=Choose a word!');
  const wordSelector2 = player2.locator('text=Choose a word!');
  const doneDrawing1 = player1.locator('text=Done Drawing');
  const doneDrawing2 = player2.locator('text=Done Drawing');

  const result = await Promise.race([
    wordSelector1.waitFor({ timeout: 15000 }).then(() => ({ phase: 'word', drawer: 'player1' })),
    wordSelector2.waitFor({ timeout: 15000 }).then(() => ({ phase: 'word', drawer: 'player2' })),
    doneDrawing1.waitFor({ timeout: 15000 }).then(() => ({ phase: 'drawing', drawer: 'player1' })),
    doneDrawing2.waitFor({ timeout: 15000 }).then(() => ({ phase: 'drawing', drawer: 'player2' })),
  ]);

  const drawer = result.drawer === 'player1' ? player1 : player2;
  const guesser = result.drawer === 'player1' ? player2 : player1;

  // If still in word selection, click the first word
  if (result.phase === 'word') {
    const wordButtons = drawer.locator('.space-y-3 button');
    await expect(wordButtons.first()).toBeVisible({ timeout: 5000 });
    await wordButtons.first().click();
  }

  return { drawer, guesser };
}

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
    await player1.goto('/');
    await waitForConnection(player1);
    const roomCode = await createRoom(player1, 'Player1');

    // Player 2 joins room
    const player2 = await createPlayer(browser, 'Player2');
    await player2.goto('/');
    await waitForConnection(player2);
    await joinRoom(player2, 'Player2', roomCode);

    // Both players should see each other
    await expect(player1.locator('text=Player2')).toBeVisible({ timeout: 5000 });
    await expect(player2.locator('text=Player1')).toBeVisible();
    await expect(player1.locator('text=2/')).toBeVisible(); // 2/X players

    await player1.context().close();
    await player2.context().close();
  });

  test('players can ready up', async ({ browser }) => {
    const player1 = await createPlayer(browser, 'Host');
    await player1.goto('/');
    await waitForConnection(player1);
    const roomCode = await createRoom(player1, 'Host');

    const player2 = await createPlayer(browser, 'Guest');
    await player2.goto('/');
    await waitForConnection(player2);
    await joinRoom(player2, 'Guest', roomCode);

    // Both ready up
    await clickReady(player1);
    await clickReady(player2);

    // Host should see Start Game button enabled
    const startButton = player1.locator('button:has-text("Start Game")');
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();

    await player1.context().close();
    await player2.context().close();
  });

  test('host can start game and drawer sees word options', async ({ browser }) => {
    const player1 = await createPlayer(browser, 'Alice');
    await player1.goto('/');
    await waitForConnection(player1);
    const roomCode = await createRoom(player1, 'Alice');

    const player2 = await createPlayer(browser, 'Bob');
    await player2.goto('/');
    await waitForConnection(player2);
    await joinRoom(player2, 'Bob', roomCode);

    // Both ready up
    await clickReady(player1);
    await clickReady(player2);

    // Host starts game
    await player1.click('button:has-text("Start Game")');

    // Wait for countdown on both players
    await expect(player1.locator('text=Get Ready!')).toBeVisible({ timeout: 5000 });
    await expect(player2.locator('text=Get Ready!')).toBeVisible({ timeout: 5000 });

    // Wait for word selection phase - race to see which player gets word options first
    // Also handle case where game auto-selected a word and is already in drawing phase
    const wordSelector1 = player1.locator('text=Choose a word!');
    const wordSelector2 = player2.locator('text=Choose a word!');
    const doneDrawing1 = player1.locator('text=Done Drawing');
    const doneDrawing2 = player2.locator('text=Done Drawing');

    const result = await Promise.race([
      wordSelector1.waitFor({ timeout: 15000 }).then(() => ({ phase: 'word', drawer: 'player1' })),
      wordSelector2.waitFor({ timeout: 15000 }).then(() => ({ phase: 'word', drawer: 'player2' })),
      doneDrawing1.waitFor({ timeout: 15000 }).then(() => ({ phase: 'drawing', drawer: 'player1' })),
      doneDrawing2.waitFor({ timeout: 15000 }).then(() => ({ phase: 'drawing', drawer: 'player2' })),
    ]);

    const drawerResult = result.drawer;

    const drawer = drawerResult === 'player1' ? player1 : player2;
    const guesser = drawerResult === 'player1' ? player2 : player1;

    // If still in word selection phase, verify the drawer sees 3 word options
    if (result.phase === 'word') {
      const wordButtons = drawer.locator('.space-y-3 button');
      await expect(wordButtons).toHaveCount(3);

      // Guesser should see waiting message
      await expect(guesser.locator('text=is choosing a word')).toBeVisible();
    } else {
      // Already in drawing phase, verify drawer sees Done Drawing
      await expect(drawer.locator('text=Done Drawing')).toBeVisible();
    }

    await player1.context().close();
    await player2.context().close();
  });

  test('full game round flow', async ({ browser }) => {
    const player1 = await createPlayer(browser, 'Alice');
    await player1.goto('/');
    await waitForConnection(player1);
    const roomCode = await createRoom(player1, 'Alice');

    const player2 = await createPlayer(browser, 'Bob');
    await player2.goto('/');
    await waitForConnection(player2);
    await joinRoom(player2, 'Bob', roomCode);

    // Both ready up and start
    await clickReady(player1);
    await clickReady(player2);
    await player1.click('button:has-text("Start Game")');

    // Wait for countdown
    await expect(player1.locator('text=Get Ready!')).toBeVisible({ timeout: 5000 });

    // Wait for word selection and select a word
    const { drawer, guesser } = await selectWord(player1, player2);

    // Wait for drawing phase to start (Done Drawing button appears)
    await expect(drawer.locator('text=Done Drawing')).toBeVisible({ timeout: 10000 });

    // Drawing phase - drawer should see canvas and tools
    await expect(drawer.locator('canvas')).toBeVisible();

    // Guesser should see the canvas (disabled)
    await expect(guesser.locator('canvas')).toBeVisible({ timeout: 5000 });

    // Drawer submits drawing
    await drawer.click('text=Done Drawing');

    // Reveal phase - should show the word in large green text
    await expect(player1.locator('.text-4xl.text-green-400')).toBeVisible({ timeout: 20000 });
    await expect(player2.locator('.text-4xl.text-green-400')).toBeVisible({ timeout: 20000 });

    await player1.context().close();
    await player2.context().close();
  });

  test('drawing on canvas works', async ({ browser }) => {
    const player1 = await createPlayer(browser, 'Alice');
    await player1.goto('/');
    await waitForConnection(player1);
    const roomCode = await createRoom(player1, 'Alice');

    const player2 = await createPlayer(browser, 'Bob');
    await player2.goto('/');
    await waitForConnection(player2);
    await joinRoom(player2, 'Bob', roomCode);

    await clickReady(player1);
    await clickReady(player2);
    await player1.click('button:has-text("Start Game")');

    // Wait for countdown
    await expect(player1.locator('text=Get Ready!')).toBeVisible({ timeout: 5000 });

    // Wait for word selection and select a word
    const { drawer } = await selectWord(player1, player2);

    // Wait for drawing phase to start (Done Drawing button appears)
    await expect(drawer.locator('text=Done Drawing')).toBeVisible({ timeout: 10000 });

    // Wait for canvas
    const canvas = drawer.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // Draw on canvas
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      await drawer.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
      await drawer.mouse.down();
      await drawer.mouse.move(canvasBox.x + 200, canvasBox.y + 200);
      await drawer.mouse.move(canvasBox.x + 300, canvasBox.y + 100);
      await drawer.mouse.up();
    }

    // Small wait to ensure drawing state is captured
    await drawer.waitForTimeout(500);

    // Submit and verify reveal (word shown in green text)
    const doneButton = drawer.locator('button:has-text("Done Drawing")');
    await expect(doneButton).toBeVisible();
    await doneButton.click();

    // Wait for reveal on both players
    await expect(player1.locator('.text-4xl.text-green-400')).toBeVisible({ timeout: 20000 });

    await player1.context().close();
    await player2.context().close();
  });

  test('player can leave room', async ({ browser }) => {
    const player1 = await createPlayer(browser, 'Host');
    await player1.goto('/');
    await waitForConnection(player1);
    const roomCode = await createRoom(player1, 'Host');

    const player2 = await createPlayer(browser, 'Guest');
    await player2.goto('/');
    await waitForConnection(player2);
    await joinRoom(player2, 'Guest', roomCode);

    // Guest leaves
    await player2.click('text=Leave Room');

    // Guest should be back at home
    await expect(player2.locator('h1:has-text("Sand Draw")')).toBeVisible();

    // Host should see only 1 player
    await expect(player1.locator('text=1/')).toBeVisible({ timeout: 5000 });

    await player1.context().close();
    await player2.context().close();
  });

  test('page refresh reconnects to room', async ({ browser }) => {
    const player1 = await createPlayer(browser, 'RefreshTest');
    await player1.goto('/');
    await waitForConnection(player1);
    const roomCode = await createRoom(player1, 'RefreshTest');

    // Refresh the page
    await player1.reload();

    // Should automatically rejoin
    await expect(player1.locator(`h1:has-text("Room: ${roomCode}")`)).toBeVisible({ timeout: 10000 });
    // Check player name is visible (use more specific selector)
    await expect(player1.locator('.font-semibold:has-text("RefreshTest")')).toBeVisible();

    await player1.context().close();
  });

});
