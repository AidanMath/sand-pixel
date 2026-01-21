import { useEffect, useCallback, useRef } from 'react';
import { wsService } from '../services/websocket';
import { useGameStore } from '../stores/gameStore';
import type {
  GameEvent,
  RoomResponse,
  DrawStroke,
  PlayerJoinedPayload,
  PlayerLeftPayload,
  CountdownPayload,
  RoundStartPayload,
  WordOptionsPayload,
  DrawingPhasePayload,
  RevealPhasePayload,
  CorrectGuessPayload,
  CloseGuessPayload,
  RoundEndPayload,
  GameOverPayload,
  HintPayload,
  ErrorPayload,
  ChatMessage,
  Room,
} from '../types/game.types';

export function useWebSocket() {
  const {
    setRoom,
    setConnectionStatus,
    setError,
    removePlayer,
    setCountdown,
    setRoundInfo,
    setWordOptions,
    setDrawingPhase,
    setRevealPhase,
    addCorrectGuesser,
    setCloseGuess,
    setRoundEnd,
    setGameOver,
    addChatMessage,
    setHint,
    clearError,
  } = useGameStore();

  const onDrawStrokeRef = useRef<((stroke: DrawStroke) => void) | null>(null);

  const handleGameEvent = useCallback(
    (event: GameEvent) => {
      console.log('[GameEvent]', event.type, event.payload);

      switch (event.type) {
        case 'ROOM_STATE':
          setRoom(event.payload as Room);
          break;

        case 'PLAYER_JOINED': {
          const { room } = event.payload as PlayerJoinedPayload;
          setRoom(room);
          break;
        }

        case 'PLAYER_LEFT': {
          const { room, player } = event.payload as PlayerLeftPayload;
          setRoom(room);
          removePlayer(player.id);
          break;
        }

        case 'COUNTDOWN': {
          const { seconds } = event.payload as CountdownPayload;
          setCountdown(seconds);
          break;
        }

        case 'ROUND_START': {
          const payload = event.payload as RoundStartPayload;
          setRoundInfo(payload);
          break;
        }

        case 'WORD_OPTIONS': {
          const { words } = event.payload as WordOptionsPayload;
          setWordOptions(words);
          break;
        }

        case 'DRAWING_PHASE': {
          const { drawTime } = event.payload as DrawingPhasePayload;
          setDrawingPhase(drawTime);
          break;
        }

        case 'REVEAL_PHASE': {
          const payload = event.payload as RevealPhasePayload;
          setRevealPhase(payload.drawingBase64, payload.word);
          break;
        }

        case 'CORRECT_GUESS': {
          const payload = event.payload as CorrectGuessPayload;
          addCorrectGuesser(payload);
          // Add system message
          addChatMessage({
            playerId: 'system',
            playerName: 'System',
            text: `${payload.playerName} guessed correctly! (+${payload.points})`,
            timestamp: Date.now(),
            system: true,
          });
          break;
        }

        case 'CLOSE_GUESS': {
          const { playerId } = event.payload as CloseGuessPayload;
          setCloseGuess(playerId);
          break;
        }

        case 'ROUND_END': {
          const payload = event.payload as RoundEndPayload;
          setRoundEnd(payload);
          break;
        }

        case 'GAME_OVER': {
          const payload = event.payload as GameOverPayload;
          setGameOver(payload);
          break;
        }

        case 'CHAT': {
          const message = event.payload as ChatMessage;
          addChatMessage(message);
          break;
        }

        case 'HINT': {
          const { hint } = event.payload as HintPayload;
          setHint(hint);
          break;
        }

        case 'ERROR': {
          const { message } = event.payload as ErrorPayload;
          setError(message);
          break;
        }
      }
    },
    [
      setRoom,
      removePlayer,
      setCountdown,
      setRoundInfo,
      setWordOptions,
      setDrawingPhase,
      setRevealPhase,
      addCorrectGuesser,
      setCloseGuess,
      setRoundEnd,
      setGameOver,
      addChatMessage,
      setHint,
      setError,
    ]
  );

  const handleRoomResponse = useCallback(
    (response: RoomResponse) => {
      console.log('[RoomResponse]', response);

      if (response.success && response.room) {
        setRoom(response.room);
        wsService.subscribeToRoom(response.room.id);
        clearError();
      } else if (response.error) {
        setError(response.error);
      }
    },
    [setRoom, setError, clearError]
  );

  const connect = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      await wsService.connect();
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('disconnected');
      setError(error instanceof Error ? error.message : 'Failed to connect');
    }
  }, [setConnectionStatus, setError]);

  const disconnect = useCallback(() => {
    wsService.disconnect();
    setConnectionStatus('disconnected');
  }, [setConnectionStatus]);

  // Setup event listeners
  useEffect(() => {
    const unsubEvent = wsService.onGameEvent(handleGameEvent);
    const unsubRoom = wsService.onRoomResponse(handleRoomResponse);
    const unsubDraw = wsService.onDrawStroke((stroke) => {
      if (onDrawStrokeRef.current) {
        onDrawStrokeRef.current(stroke);
      }
    });

    return () => {
      unsubEvent();
      unsubRoom();
      unsubDraw();
    };
  }, [handleGameEvent, handleRoomResponse]);

  // Actions
  const createRoom = useCallback((playerName: string, settings?: Parameters<typeof wsService.createRoom>[1]) => {
    wsService.createRoom(playerName, settings);
  }, []);

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    wsService.joinRoom(roomId, playerName);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    wsService.leaveRoom(roomId);
    setRoom(null);
  }, [setRoom]);

  const toggleReady = useCallback((roomId: string) => {
    wsService.toggleReady(roomId);
  }, []);

  const startGame = useCallback((roomId: string) => {
    wsService.startGame(roomId);
  }, []);

  const selectWord = useCallback((roomId: string, wordIndex: number) => {
    wsService.selectWord(roomId, wordIndex);
  }, []);

  const sendDrawStroke = useCallback((roomId: string, stroke: DrawStroke) => {
    wsService.sendDrawStroke(roomId, stroke);
  }, []);

  const submitDrawing = useCallback((roomId: string, drawingBase64: string) => {
    wsService.submitDrawing(roomId, drawingBase64);
  }, []);

  const sendGuess = useCallback((roomId: string, text: string) => {
    wsService.sendGuess(roomId, text);
  }, []);

  const sendChat = useCallback((roomId: string, text: string) => {
    wsService.sendChat(roomId, text);
  }, []);

  const setOnDrawStroke = useCallback((callback: (stroke: DrawStroke) => void) => {
    onDrawStrokeRef.current = callback;
  }, []);

  return {
    connect,
    disconnect,
    isConnected: wsService.isConnected,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
    selectWord,
    sendDrawStroke,
    submitDrawing,
    sendGuess,
    sendChat,
    setOnDrawStroke,
  };
}
