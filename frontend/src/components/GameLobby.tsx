import { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGameStore } from '../stores/gameStore';
import { PlayerList } from './PlayerList';
import type { RoomSettings } from '../types/game.types';
import { DEFAULT_ROOM_SETTINGS } from '../types/game.types';

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
    setMySessionId,
    isHost,
    getPlayerList,
    getMyPlayer,
  } = useGameStore();

  // Connect on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // Switch to room view when room is set
  useEffect(() => {
    if (room) {
      setView('room');
    }
  }, [room]);

  // Call onGameStart when game starts
  useEffect(() => {
    if (room?.gameState.phase === 'COUNTDOWN' && onGameStart) {
      onGameStart();
    }
  }, [room?.gameState.phase, onGameStart]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) return;
    // Generate a unique session ID for this client
    const sessionId = crypto.randomUUID();
    setMySessionId(sessionId);
    createRoom(playerName.trim(), settings);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    const sessionId = crypto.randomUUID();
    setMySessionId(sessionId);
    joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  const handleLeaveRoom = () => {
    if (room) {
      leaveRoom(room.id);
      setView('home');
    }
  };

  const handleToggleReady = () => {
    if (room) {
      toggleReady(room.id);
    }
  };

  const handleStartGame = () => {
    if (room) {
      startGame(room.id);
    }
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

  // Room view
  if (view === 'room' && room) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white p-8">
        <div className="max-w-2xl mx-auto">
          {/* Room header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">Room: {room.id}</h1>
              <p className="text-zinc-400">
                {players.length}/{room.settings.maxPlayers} players
              </p>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 transition"
            >
              Leave Room
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300">
              {error}
              <button
                onClick={clearError}
                className="ml-4 text-red-400 hover:text-red-300"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Player list */}
          <div className="mb-8">
            <PlayerList
              players={players}
              hostId={room.hostId}
              currentDrawerId={null}
              myPlayerId={myPlayer?.id}
            />
          </div>

          {/* Settings display */}
          <div className="mb-8 p-4 bg-zinc-800 rounded-lg">
            <h3 className="font-semibold mb-3">Game Settings</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-zinc-400">
              <div>Rounds: {room.settings.totalRounds}</div>
              <div>Draw time: {room.settings.drawTime}s</div>
              <div>Difficulty: {room.settings.difficulty}</div>
              <div>Max players: {room.settings.maxPlayers}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleToggleReady}
              className={`flex-1 py-3 rounded font-semibold transition ${
                myPlayer?.ready
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              {myPlayer?.ready ? 'Ready!' : 'Click when ready'}
            </button>

            {isHost() && (
              <button
                onClick={handleStartGame}
                disabled={!canStart}
                className={`flex-1 py-3 rounded font-semibold transition ${
                  canStart
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {canStart ? 'Start Game' : 'Waiting for players...'}
              </button>
            )}
          </div>

          {!canStart && (
            <p className="text-center text-zinc-500 mt-4">
              {players.length < 2
                ? 'Need at least 2 players to start'
                : 'Waiting for all players to be ready'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Create room view
  if (view === 'create') {
    return (
      <div className="min-h-screen bg-zinc-900 text-white p-8">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setView('home')}
            className="mb-8 text-zinc-400 hover:text-white transition"
          >
            ← Back
          </button>

          <h1 className="text-3xl font-bold mb-8">Create Room</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Rounds</label>
              <select
                value={settings.totalRounds}
                onChange={(e) =>
                  setSettings({ ...settings, totalRounds: Number(e.target.value) })
                }
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:border-blue-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} round{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Draw Time
              </label>
              <select
                value={settings.drawTime}
                onChange={(e) =>
                  setSettings({ ...settings, drawTime: Number(e.target.value) })
                }
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:border-blue-500"
              >
                {[30, 45, 60, 80, 100, 120, 150, 180].map((n) => (
                  <option key={n} value={n}>
                    {n} seconds
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Difficulty
              </label>
              <select
                value={settings.difficulty}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    difficulty: e.target.value as 'easy' | 'medium' | 'hard',
                  })
                }
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={!playerName.trim()}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded font-semibold transition"
            >
              Create Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Join room view
  if (view === 'join') {
    return (
      <div className="min-h-screen bg-zinc-900 text-white p-8">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setView('home')}
            className="mb-8 text-zinc-400 hover:text-white transition"
          >
            ← Back
          </button>

          <h1 className="text-3xl font-bold mb-8">Join Room</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                maxLength={6}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:border-blue-500 uppercase tracking-widest text-center text-xl"
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={!playerName.trim() || roomCode.length !== 6}
              className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded font-semibold transition"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Home view
  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">Sand Draw</h1>
        <p className="text-zinc-400 mb-12">Draw, guess, watch it fall!</p>

        <div className="flex flex-col gap-4 max-w-xs mx-auto">
          <button
            onClick={() => setView('create')}
            className="py-4 px-8 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition"
          >
            Create Room
          </button>
          <button
            onClick={() => setView('join')}
            className="py-4 px-8 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-lg transition"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}
