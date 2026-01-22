/**
 * Connection state types for WebSocket management
 */

/** Connection status states */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

/** Full connection state */
export interface ConnectionState {
  status: ConnectionStatus;
  error: string | null;
  reconnectAttempts: number;
}

/** Initial connection state */
export const INITIAL_CONNECTION_STATE: ConnectionState = {
  status: 'disconnected',
  error: null,
  reconnectAttempts: 0,
};

/** Check if connection is active */
export function isConnected(state: ConnectionState): boolean {
  return state.status === 'connected';
}

/** Check if connection is in progress */
export function isConnecting(state: ConnectionState): boolean {
  return state.status === 'connecting';
}
