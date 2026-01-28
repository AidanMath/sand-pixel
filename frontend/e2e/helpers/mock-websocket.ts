/**
 * WebSocket mocking utilities for e2e tests
 *
 * Use cases:
 * - Simulating disconnections mid-game
 * - Testing timing edge cases (auto-submit at 0s)
 * - Simulating network latency
 * - Intercepting and inspecting messages
 *
 * Note: Most tests should use the real backend. Use mocking only for:
 * - Disconnection scenarios
 * - Precise timing edge cases
 * - Network failure simulation
 */
import { Page } from '@playwright/test';

// ============================================
// Types
// ============================================

export interface MockedMessage {
  type: string;
  payload: unknown;
  timestamp: number;
}

export interface GameEvent {
  type: string;
  payload: unknown;
}

// ============================================
// Mock WebSocket Controller
// ============================================

export class MockWebSocketController {
  private page: Page;
  private outgoingMessages: MockedMessage[] = [];
  private incomingMessages: MockedMessage[] = [];
  private isInstalled = false;
  private latencyMs = 0;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Installs WebSocket interception on the page
   */
  async install(): Promise<void> {
    if (this.isInstalled) return;

    await this.page.addInitScript(() => {
      // Store original WebSocket
      const OriginalWebSocket = window.WebSocket;

      // Track active connections
      (window as unknown as { __mockWsConnections: WebSocket[] }).__mockWsConnections = [];

      // Message queues for external access
      (window as unknown as { __mockWsOutgoing: { type: string; data: string; timestamp: number }[] }).__mockWsOutgoing =
        [];
      (
        window as unknown as { __mockWsIncoming: { type: string; data: string; timestamp: number }[] }
      ).__mockWsIncoming = [];

      // Control flags
      (window as unknown as { __mockWsDisconnected: boolean }).__mockWsDisconnected = false;
      (window as unknown as { __mockWsLatency: number }).__mockWsLatency = 0;

      // Create mock WebSocket class
      class MockWebSocket extends EventTarget {
        private _ws: WebSocket | null = null;
        private _url: string;
        private _protocols?: string | string[];

        // WebSocket properties
        readyState: number = WebSocket.CONNECTING;
        bufferedAmount: number = 0;
        extensions: string = '';
        protocol: string = '';
        binaryType: BinaryType = 'blob';
        url: string;

        // Event handlers
        onopen: ((ev: Event) => void) | null = null;
        onclose: ((ev: CloseEvent) => void) | null = null;
        onmessage: ((ev: MessageEvent) => void) | null = null;
        onerror: ((ev: Event) => void) | null = null;

        static readonly CONNECTING = 0;
        static readonly OPEN = 1;
        static readonly CLOSING = 2;
        static readonly CLOSED = 3;

        constructor(url: string, protocols?: string | string[]) {
          super();
          this._url = url;
          this._protocols = protocols;
          this.url = url;

          // Store reference
          (window as unknown as { __mockWsConnections: MockWebSocket[] }).__mockWsConnections.push(this);

          // Create real connection unless disconnected
          if (!(window as unknown as { __mockWsDisconnected: boolean }).__mockWsDisconnected) {
            this._connect();
          } else {
            // Simulate failed connection
            setTimeout(() => {
              this.readyState = WebSocket.CLOSED;
              const closeEvent = new CloseEvent('close', { code: 1006, reason: 'Simulated disconnect' });
              this.onclose?.(closeEvent);
              this.dispatchEvent(closeEvent);
            }, 100);
          }
        }

        private _connect() {
          this._ws = new OriginalWebSocket(this._url, this._protocols);

          this._ws.onopen = (ev) => {
            this.readyState = WebSocket.OPEN;
            this.protocol = this._ws?.protocol || '';
            this.onopen?.(ev);
            this.dispatchEvent(new Event('open'));
          };

          this._ws.onclose = (ev) => {
            this.readyState = WebSocket.CLOSED;
            this.onclose?.(ev);
            this.dispatchEvent(new CloseEvent('close', { code: ev.code, reason: ev.reason }));
          };

          this._ws.onerror = (ev) => {
            this.onerror?.(ev);
            this.dispatchEvent(new Event('error'));
          };

          this._ws.onmessage = (ev) => {
            const latency = (window as unknown as { __mockWsLatency: number }).__mockWsLatency;

            // Log incoming message
            (
              window as unknown as { __mockWsIncoming: { type: string; data: string; timestamp: number }[] }
            ).__mockWsIncoming.push({
              type: 'incoming',
              data: ev.data,
              timestamp: Date.now(),
            });

            const deliver = () => {
              this.onmessage?.(ev);
              this.dispatchEvent(new MessageEvent('message', { data: ev.data }));
            };

            if (latency > 0) {
              setTimeout(deliver, latency);
            } else {
              deliver();
            }
          };
        }

        send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
          // Log outgoing message
          (
            window as unknown as { __mockWsOutgoing: { type: string; data: string; timestamp: number }[] }
          ).__mockWsOutgoing.push({
            type: 'outgoing',
            data: typeof data === 'string' ? data : '[binary]',
            timestamp: Date.now(),
          });

          const latency = (window as unknown as { __mockWsLatency: number }).__mockWsLatency;

          const doSend = () => {
            if (this._ws && this._ws.readyState === WebSocket.OPEN) {
              this._ws.send(data);
            }
          };

          if (latency > 0) {
            setTimeout(doSend, latency);
          } else {
            doSend();
          }
        }

        close(code?: number, reason?: string): void {
          this.readyState = WebSocket.CLOSING;
          this._ws?.close(code, reason);
        }

        // Force disconnect (for testing)
        _forceDisconnect() {
          if (this._ws) {
            this._ws.close(1006, 'Simulated disconnect');
          }
          this.readyState = WebSocket.CLOSED;
        }

        // Reconnect (for testing)
        _reconnect() {
          if (this.readyState === WebSocket.CLOSED) {
            this.readyState = WebSocket.CONNECTING;
            this._connect();
          }
        }
      }

      // Replace global WebSocket
      (window as unknown as { WebSocket: typeof MockWebSocket }).WebSocket = MockWebSocket as unknown as {
        new (url: string, protocols?: string | string[]): WebSocket;
        prototype: WebSocket;
        readonly CONNECTING: 0;
        readonly OPEN: 1;
        readonly CLOSING: 2;
        readonly CLOSED: 3;
      };
    });

    this.isInstalled = true;
  }

  /**
   * Simulates a WebSocket disconnect
   */
  async simulateDisconnect(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { __mockWsDisconnected: boolean }).__mockWsDisconnected = true;
      const connections = (window as unknown as { __mockWsConnections: { _forceDisconnect: () => void }[] })
        .__mockWsConnections;
      connections.forEach((ws) => ws._forceDisconnect());
    });
  }

  /**
   * Simulates reconnection after disconnect
   */
  async simulateReconnect(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { __mockWsDisconnected: boolean }).__mockWsDisconnected = false;
    });
    // Page refresh will establish new connection
    await this.page.reload();
  }

  /**
   * Sets artificial latency on WebSocket messages
   */
  async simulateLatency(ms: number): Promise<void> {
    this.latencyMs = ms;
    await this.page.evaluate((latency) => {
      (window as unknown as { __mockWsLatency: number }).__mockWsLatency = latency;
    }, ms);
  }

  /**
   * Emits a game event to the client (simulates server message)
   */
  async emitGameEvent(event: GameEvent): Promise<void> {
    await this.page.evaluate((evt) => {
      const connections = (
        window as unknown as {
          __mockWsConnections: { onmessage: ((ev: { data: string }) => void) | null; readyState: number }[];
        }
      ).__mockWsConnections;
      const activeWs = connections.find((ws) => ws.readyState === 1); // OPEN

      if (activeWs && activeWs.onmessage) {
        const messageEvent = { data: JSON.stringify(evt) };
        activeWs.onmessage(messageEvent);
      }
    }, event);
  }

  /**
   * Gets all outgoing messages sent by the client
   */
  async getOutgoingMessages(): Promise<MockedMessage[]> {
    const messages = await this.page.evaluate(() => {
      return (window as unknown as { __mockWsOutgoing: { type: string; data: string; timestamp: number }[] })
        .__mockWsOutgoing;
    });

    return messages.map((m) => ({
      type: 'outgoing',
      payload: this.tryParseJson(m.data),
      timestamp: m.timestamp,
    }));
  }

  /**
   * Gets all incoming messages received by the client
   */
  async getIncomingMessages(): Promise<MockedMessage[]> {
    const messages = await this.page.evaluate(() => {
      return (window as unknown as { __mockWsIncoming: { type: string; data: string; timestamp: number }[] })
        .__mockWsIncoming;
    });

    return messages.map((m) => ({
      type: 'incoming',
      payload: this.tryParseJson(m.data),
      timestamp: m.timestamp,
    }));
  }

  /**
   * Clears message logs
   */
  async clearMessages(): Promise<void> {
    await this.page.evaluate(() => {
      (window as unknown as { __mockWsOutgoing: unknown[] }).__mockWsOutgoing = [];
      (window as unknown as { __mockWsIncoming: unknown[] }).__mockWsIncoming = [];
    });
  }

  /**
   * Checks if WebSocket is currently connected
   */
  async isConnected(): Promise<boolean> {
    return this.page.evaluate(() => {
      const connections = (window as unknown as { __mockWsConnections: { readyState: number }[] }).__mockWsConnections;
      return connections.some((ws) => ws.readyState === 1); // OPEN
    });
  }

  private tryParseJson(data: string): unknown {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Creates a mock WebSocket controller for a page
 */
export async function createMockWebSocket(page: Page): Promise<MockWebSocketController> {
  const controller = new MockWebSocketController(page);
  await controller.install();
  return controller;
}

/**
 * Creates mock game events for testing
 */
export const mockEvents = {
  countdown: (seconds: number): GameEvent => ({
    type: 'COUNTDOWN',
    payload: { seconds },
  }),

  roundStart: (round: number, drawerId: string): GameEvent => ({
    type: 'ROUND_START',
    payload: {
      round,
      drawerId,
      drawerIds: [drawerId],
      wordLength: 5,
      wordHint: '_____',
    },
  }),

  wordOptions: (words: string[]): GameEvent => ({
    type: 'WORD_OPTIONS',
    payload: { words },
  }),

  drawingPhase: (drawTime: number, wordLength: number, wordHint: string): GameEvent => ({
    type: 'DRAWING_PHASE',
    payload: { drawTime, wordLength, wordHint },
  }),

  revealPhase: (word: string): GameEvent => ({
    type: 'REVEAL_PHASE',
    payload: { word },
  }),

  correctGuess: (playerId: string, playerName: string, points: number, streak: number): GameEvent => ({
    type: 'CORRECT_GUESS',
    payload: {
      playerId,
      playerName,
      points,
      totalGuessers: 1,
      streak,
      multiplier: streak >= 4 ? 2.0 : streak >= 3 ? 1.5 : streak >= 2 ? 1.25 : 1.0,
    },
  }),

  roundEnd: (word: string, scores: { playerId: string; playerName: string; score: number }[]): GameEvent => ({
    type: 'ROUND_END',
    payload: {
      word,
      scores: scores.map((s) => ({
        ...s,
        isDrawer: false,
        guessedCorrectly: true,
        currentStreak: 1,
      })),
    },
  }),

  gameOver: (
    finalScores: { playerId: string; playerName: string; score: number; rank: number; maxStreak: number }[]
  ): GameEvent => ({
    type: 'GAME_OVER',
    payload: { finalScores },
  }),

  telephoneDraw: (playerId: string, playerName: string, drawTime: number, remainingPlayers: number): GameEvent => ({
    type: 'TELEPHONE_DRAW',
    payload: { playerId, playerName, drawTime, remainingPlayers },
  }),

  telephoneGuess: (playerId: string, playerName: string, guessTime: number, remainingPlayers: number): GameEvent => ({
    type: 'TELEPHONE_GUESS',
    payload: { playerId, playerName, guessTime, remainingPlayers },
  }),

  votingStart: (
    drawings: { drawerId: string; drawerName: string; word: string; drawingBase64: string }[],
    votingTime: number
  ): GameEvent => ({
    type: 'VOTING_START',
    payload: { drawings, votingTime },
  }),

  votingResults: (
    results: { drawerId: string; drawerName: string; word: string; votes: number; isWinner: boolean }[],
    winnerId: string
  ): GameEvent => ({
    type: 'VOTING_RESULTS',
    payload: { results, winnerId, bonusPoints: 50 },
  }),

  error: (message: string): GameEvent => ({
    type: 'ERROR',
    payload: { message },
  }),

  playerJoined: (
    playerId: string,
    playerName: string,
    room: { id: string; hostId: string; players: Record<string, unknown> }
  ): GameEvent => ({
    type: 'PLAYER_JOINED',
    payload: {
      player: { id: playerId, name: playerName, sessionId: playerId, score: 0, ready: false, connected: true },
      room,
    },
  }),

  playerLeft: (
    playerId: string,
    playerName: string,
    room: { id: string; hostId: string; players: Record<string, unknown> }
  ): GameEvent => ({
    type: 'PLAYER_LEFT',
    payload: {
      player: { id: playerId, name: playerName },
      room,
    },
  }),
};
