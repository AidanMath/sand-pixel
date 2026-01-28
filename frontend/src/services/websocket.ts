import { Client } from '@stomp/stompjs';
import type { IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type {
  GameEvent,
  RoomResponse,
  RoomSettings,
  DrawStroke,
} from '../types/game.types';
import {
  validatePlayerName,
  validateRoomCode,
  validateTextInput,
  validateEmoji,
  validateWordIndex,
  validateDrawingData,
  validatePlayerId,
  validateDrawStroke,
  LIMITS,
} from '../utils/validation/inputValidation';

type EventCallback = (event: GameEvent) => void;
type RoomCallback = (response: RoomResponse) => void;
type DrawCallback = (stroke: DrawStroke) => void;

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

class WebSocketService {
  private client: Client | null = null;
  private connected = false;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private eventCallbacks: Set<EventCallback> = new Set();
  private roomCallbacks: Set<RoomCallback> = new Set();
  private drawCallbacks: Set<DrawCallback> = new Set();
  private currentRoomId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected && this.client?.connected) {
        resolve();
        return;
      }

      this.client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug: (str) => {
          // Only log important STOMP messages, not heartbeats
          if (str.includes('SEND') || str.includes('MESSAGE') || str.includes('ERROR') || str.includes('CONNECT')) {
            console.log('[STOMP]', str);
          }
        },
        onConnect: () => {
          console.log('WebSocket connected');
          this.connected = true;
          this.reconnectAttempts = 0;
          this.setupUserSubscriptions();
          resolve();
        },
        onDisconnect: () => {
          console.log('WebSocket disconnected');
          this.connected = false;
        },
        onStompError: (frame) => {
          console.error('STOMP error:', frame.headers.message);
          reject(new Error(frame.headers.message));
        },
        onWebSocketClose: () => {
          console.log('WebSocket closed');
          this.connected = false;
          this.handleReconnect();
        },
      });

      this.client.activate();
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    }
  }

  private setupUserSubscriptions() {
    // Subscribe to user-specific room responses
    this.subscribe('/user/queue/room', (message: IMessage) => {
      const response: RoomResponse = JSON.parse(message.body);
      this.roomCallbacks.forEach((cb) => cb(response));
    });

    // Note: Player-specific game events (like word options) are subscribed
    // via subscribeToPlayerEvents() after we know our session ID

    // Subscribe to error messages
    this.subscribe('/user/queue/error', (message: IMessage) => {
      const event: GameEvent = JSON.parse(message.body);
      this.eventCallbacks.forEach((cb) => cb(event));
    });
  }

  private subscribe(destination: string, callback: (msg: IMessage) => void) {
    if (!this.client || !this.connected) return;

    const existing = this.subscriptions.get(destination);
    if (existing) {
      existing.unsubscribe();
    }

    const subscription = this.client.subscribe(destination, callback);
    this.subscriptions.set(destination, subscription);
  }

  disconnect() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    this.client?.deactivate();
    this.client = null;
    this.connected = false;
    this.currentRoomId = null;
  }

  isConnected(): boolean {
    return this.connected && this.client?.connected === true;
  }

  // Event listeners
  onGameEvent(callback: EventCallback): () => void {
    this.eventCallbacks.add(callback);
    return () => this.eventCallbacks.delete(callback);
  }

  onRoomResponse(callback: RoomCallback): () => void {
    this.roomCallbacks.add(callback);
    return () => this.roomCallbacks.delete(callback);
  }

  onDrawStroke(callback: DrawCallback): () => void {
    this.drawCallbacks.add(callback);
    return () => this.drawCallbacks.delete(callback);
  }

  // Room subscriptions
  subscribeToRoom(roomId: string) {
    if (this.currentRoomId === roomId) return;

    // Unsubscribe from previous room
    if (this.currentRoomId) {
      this.unsubscribeFromRoom(this.currentRoomId);
    }

    this.currentRoomId = roomId;

    // Subscribe to room events
    this.subscribe(`/topic/room/${roomId}`, (message: IMessage) => {
      const event: GameEvent = JSON.parse(message.body);
      this.eventCallbacks.forEach((cb) => cb(event));
    });

    // Subscribe to draw strokes
    this.subscribe(`/topic/room/${roomId}/draw`, (message: IMessage) => {
      const stroke: DrawStroke = JSON.parse(message.body);
      this.drawCallbacks.forEach((cb) => cb(stroke));
    });
  }

  // Subscribe to player-specific events (like word options)
  subscribeToPlayerEvents(sessionId: string) {
    this.subscribe(`/topic/player/${sessionId}`, (message: IMessage) => {
      const event: GameEvent = JSON.parse(message.body);
      this.eventCallbacks.forEach((cb) => cb(event));
    });
  }

  unsubscribeFromRoom(roomId: string) {
    const roomSub = this.subscriptions.get(`/topic/room/${roomId}`);
    if (roomSub) {
      roomSub.unsubscribe();
      this.subscriptions.delete(`/topic/room/${roomId}`);
    }

    const drawSub = this.subscriptions.get(`/topic/room/${roomId}/draw`);
    if (drawSub) {
      drawSub.unsubscribe();
      this.subscriptions.delete(`/topic/room/${roomId}/draw`);
    }

    if (this.currentRoomId === roomId) {
      this.currentRoomId = null;
    }
  }

  // Actions
  private send(destination: string, body: object): boolean {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected');
      return false;
    }
    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
    return true;
  }

  createRoom(playerName: string, settings?: Partial<RoomSettings>): boolean {
    const validation = validatePlayerName(playerName);
    if (!validation.valid) {
      console.error('Validation failed:', validation.error);
      return false;
    }
    return this.send('/app/room/create', { playerName: playerName.trim(), settings });
  }

  joinRoom(roomId: string, playerName: string): boolean {
    const roomValidation = validateRoomCode(roomId);
    if (!roomValidation.valid) {
      console.error('Room code validation failed:', roomValidation.error);
      return false;
    }

    const nameValidation = validatePlayerName(playerName);
    if (!nameValidation.valid) {
      console.error('Name validation failed:', nameValidation.error);
      return false;
    }

    return this.send('/app/room/join', {
      roomId: roomId.trim().toUpperCase(),
      playerName: playerName.trim()
    });
  }

  leaveRoom(roomId: string): void {
    this.send(`/app/room/${roomId}/leave`, {});
    this.unsubscribeFromRoom(roomId);
  }

  toggleReady(roomId: string): boolean {
    return this.send(`/app/room/${roomId}/ready`, {});
  }

  startGame(roomId: string): boolean {
    return this.send(`/app/room/${roomId}/start`, {});
  }

  selectWord(roomId: string, wordIndex: number): boolean {
    const validation = validateWordIndex(wordIndex);
    if (!validation.valid) {
      console.error('Word selection validation failed:', validation.error);
      return false;
    }
    return this.send(`/app/room/${roomId}/word-select`, { wordIndex });
  }

  sendDrawStroke(roomId: string, stroke: DrawStroke): boolean {
    const validation = validateDrawStroke(stroke);
    if (!validation.valid) {
      console.error('Stroke validation failed:', validation.error);
      return false;
    }
    return this.send(`/app/room/${roomId}/draw-stroke`, stroke);
  }

  submitDrawing(roomId: string): boolean {
    return this.send(`/app/room/${roomId}/submit-drawing`, {});
  }

  sendGuess(roomId: string, text: string): boolean {
    const validation = validateTextInput(text, LIMITS.GUESS_MAX_LENGTH);
    if (!validation.valid) {
      console.error('Guess validation failed:', validation.error);
      return false;
    }
    return this.send(`/app/room/${roomId}/guess`, { text: text.trim() });
  }

  sendChat(roomId: string, text: string): boolean {
    const validation = validateTextInput(text, LIMITS.CHAT_MAX_LENGTH);
    if (!validation.valid) {
      console.error('Chat validation failed:', validation.error);
      return false;
    }
    return this.send(`/app/room/${roomId}/chat`, { text: text.trim() });
  }

  sendReaction(roomId: string, emoji: string): boolean {
    const validation = validateEmoji(emoji);
    if (!validation.valid) {
      console.error('Reaction validation failed:', validation.error);
      return false;
    }
    return this.send(`/app/room/${roomId}/react`, { emoji });
  }

  submitVote(roomId: string, drawingDrawerId: string): boolean {
    const validation = validatePlayerId(drawingDrawerId);
    if (!validation.valid) {
      console.error('Vote validation failed:', validation.error);
      return false;
    }
    return this.send(`/app/room/${roomId}/vote`, { drawingDrawerId });
  }

  submitTelephoneDrawing(roomId: string, drawingBase64: string): boolean {
    const validation = validateDrawingData(drawingBase64);
    if (!validation.valid) {
      console.error('Drawing validation failed:', validation.error);
      return false;
    }
    return this.send(`/app/room/${roomId}/telephone-draw`, { drawingBase64 });
  }

  submitTelephoneGuess(roomId: string, text: string): boolean {
    const validation = validateTextInput(text, LIMITS.GUESS_MAX_LENGTH);
    if (!validation.valid) {
      console.error('Telephone guess validation failed:', validation.error);
      return false;
    }
    return this.send(`/app/room/${roomId}/telephone-guess`, { text: text.trim() });
  }
}

// Singleton instance
export const wsService = new WebSocketService();
