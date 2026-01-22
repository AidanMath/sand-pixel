import { PlayerList } from '../PlayerList';
import type { Room, Player } from '../../types/game.types';

interface RoomViewProps {
  room: Room;
  players: Player[];
  myPlayer: Player | null;
  isHost: boolean;
  canStart: boolean;
  error: string | null;
  onLeaveRoom: () => void;
  onToggleReady: () => void;
  onStartGame: () => void;
  onClearError: () => void;
}

export function RoomView({
  room,
  players,
  myPlayer,
  isHost,
  canStart,
  error,
  onLeaveRoom,
  onToggleReady,
  onStartGame,
  onClearError,
}: RoomViewProps) {
  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Room: {room.id}</h1>
            <p className="text-zinc-400">
              {players.length}/{room.settings.maxPlayers} players
            </p>
          </div>
          <button
            onClick={onLeaveRoom}
            className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 transition"
          >
            Leave Room
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300">
            {error}
            <button
              onClick={onClearError}
              className="ml-4 text-red-400 hover:text-red-300"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mb-8">
          <PlayerList
            players={players}
            hostId={room.hostId}
            currentDrawerId={null}
            myPlayerId={myPlayer?.id}
          />
        </div>

        <div className="mb-8 p-4 bg-zinc-800 rounded-lg">
          <h3 className="font-semibold mb-3">Game Settings</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-zinc-400">
            <div>Rounds: {room.settings.totalRounds}</div>
            <div>Draw time: {room.settings.drawTime}s</div>
            <div>Max players: {room.settings.maxPlayers}</div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onToggleReady}
            className={`flex-1 py-3 rounded font-semibold transition ${
              myPlayer?.ready
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-zinc-700 hover:bg-zinc-600'
            }`}
          >
            {myPlayer?.ready ? 'Ready!' : 'Click when ready'}
          </button>

          {isHost && (
            <button
              onClick={onStartGame}
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
