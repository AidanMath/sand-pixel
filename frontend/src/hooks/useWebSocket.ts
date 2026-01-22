import { useEffect, useCallback, useRef } from 'react';
import { wsService } from '../services/websocket';
import { useGameStore } from '../stores/gameStore';
import { useGameEvents } from './useGameEvents';
import { useGameActions } from './useGameActions';
import type { DrawStroke } from '../types/game.types';

export function useWebSocket() {
  const { setConnectionStatus, setError } = useGameStore();
  const { handleGameEvent, handleRoomResponse } = useGameEvents();
  const actions = useGameActions();

  const onDrawStrokeRef = useRef<((stroke: DrawStroke) => void) | null>(null);

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

  const setOnDrawStroke = useCallback((callback: (stroke: DrawStroke) => void) => {
    onDrawStrokeRef.current = callback;
  }, []);

  return {
    connect,
    disconnect,
    isConnected: wsService.isConnected,
    setOnDrawStroke,
    ...actions,
  };
}
