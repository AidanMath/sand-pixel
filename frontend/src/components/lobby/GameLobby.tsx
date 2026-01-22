import { useState, useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useGameStore } from '../../stores/gameStore';
import { LobbyHome } from './LobbyHome';
import { CreateRoomView } from './CreateRoomView';
import { JoinRoomView } from './JoinRoomView';
import { RoomView } from './RoomView';
import type { RoomSettings } from '../../types/game.types';
import { DEFAULT_ROOM_SETTINGS } from '../../types/game.types';

interface GameLobbyProps {
  onGameStart?: () => void;
}

export function GameLobby({ onGameStart }: GameLobbyProps) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [view, setView] = useState<'home' | 'create' | 'join' | 'room'>('home');
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_ROOM_SETTINGS);

  const {
    connect,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
  } = useWebSocket();

  const {
    connectionStatus,
    room,
    error,
    clearError,
    isHost,
    getPlayerList,
    getMyPlayer,
    getPersistedSession,
    persistSession,
    clearPersistedSession,
  } = useGameStore();

  // Connect on mount and try to rejoin if we have a persisted session
  useEffect(() => {
    const initConnection = async () => {
      await connect();

      const persisted = getPersistedSession();
      if (persisted && !room) {
        setPlayerName(persisted.playerName);
        setRoomCode(persisted.roomId);
        joinRoom(persisted.roomId, persisted.playerName);
      }
    };
    initConnection();
  }, [connect, getPersistedSession, joinRoom, room]);

  // Switch to room view when room is set and persist session
  useEffect(() => {
    if (room && playerName) {
      setView('room');
      persistSession(room.id, playerName);
    }
  }, [room, playerName, persistSession]);

  // Call onGameStart when game starts
  useEffect(() => {
    if (room?.gameState.phase === 'COUNTDOWN' && onGameStart) {
      onGameStart();
    }
  }, [room?.gameState.phase, onGameStart]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) return;
    createRoom(playerName.trim(), settings);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  const handleLeaveRoom = () => {
    if (room) {
      leaveRoom(room.id);
      clearPersistedSession();
      setView('home');
    }
  };

  const handleToggleReady = () => {
    if (room) toggleReady(room.id);
  };

  const handleStartGame = () => {
    if (room) startGame(room.id);
  };

  const players = getPlayerList();
  const myPlayer = getMyPlayer();
  const canStart = players.length >= 2 && players.every((p) => p.ready);

  if (connectionStatus === 'connecting') {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-400 animate-pulse">Connecting...</div>
      </div>
    );
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Disconnected from server</div>
          <button
            onClick={connect}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  if (view === 'room' && room) {
    return (
      <RoomView
        room={room}
        players={players}
        myPlayer={myPlayer}
        isHost={isHost()}
        canStart={canStart}
        error={error}
        onLeaveRoom={handleLeaveRoom}
        onToggleReady={handleToggleReady}
        onStartGame={handleStartGame}
        onClearError={clearError}
      />
    );
  }

  if (view === 'create') {
    return (
      <CreateRoomView
        playerName={playerName}
        settings={settings}
        error={error}
        onPlayerNameChange={setPlayerName}
        onSettingsChange={setSettings}
        onCreateRoom={handleCreateRoom}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'join') {
    return (
      <JoinRoomView
        playerName={playerName}
        roomCode={roomCode}
        error={error}
        onPlayerNameChange={setPlayerName}
        onRoomCodeChange={setRoomCode}
        onJoinRoom={handleJoinRoom}
        onBack={() => setView('home')}
      />
    );
  }

  return (
    <LobbyHome
      onCreateRoom={() => setView('create')}
      onJoinRoom={() => setView('join')}
    />
  );
}
