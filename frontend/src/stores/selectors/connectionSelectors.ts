/**
 * Connection selectors
 * Provides memoized access to connection state
 */

import { useGameStore } from '../gameStore';
import type { ConnectionStatus } from '../../types/connection.types';

/** Get connection status */
export function useConnectionStatus(): ConnectionStatus {
  return useGameStore((state) => state.connectionStatus);
}

/** Check if connected */
export function useIsConnected(): boolean {
  return useGameStore((state) => state.connectionStatus === 'connected');
}

/** Check if connecting */
export function useIsConnecting(): boolean {
  return useGameStore((state) => state.connectionStatus === 'connecting');
}

/** Get connection error */
export function useConnectionError(): string | null {
  return useGameStore((state) => state.error);
}

/** Check if there's an error */
export function useHasError(): boolean {
  return useGameStore((state) => state.error !== null);
}
