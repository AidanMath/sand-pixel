import { motion } from 'motion/react';
import { PlayerList } from '../PlayerList';
import { SandParticles } from '../ui/SandParticles';
import { springBouncy, buttonHover, buttonTap } from '../../utils/animations';
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
    <div className="min-h-screen bg-zinc-900 text-white p-8 relative overflow-hidden">
      <SandParticles count={20} />

      <motion.div
        className="max-w-2xl mx-auto relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Room: {room.id}</h1>
            <p className="text-zinc-400">
              {players.length}/{room.settings.maxPlayers} players
            </p>
          </div>
          <motion.button
            onClick={onLeaveRoom}
            className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition"
            whileHover={buttonHover}
            whileTap={buttonTap}
            transition={springBouncy}
          >
            Leave Room
          </motion.button>
        </div>

        {error && (
          <motion.div
            className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            {error}
            <button
              onClick={onClearError}
              className="ml-4 text-red-400 hover:text-red-300"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        <div className="mb-8">
          <PlayerList
            players={players}
            hostId={room.hostId}
            currentDrawerId={null}
            myPlayerId={myPlayer?.id}
          />
        </div>

        <div className="mb-8 p-4 panel-sand">
          <h3 className="font-semibold mb-3">Game Settings</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-zinc-400">
            <div>Rounds: {room.settings.totalRounds}</div>
            <div>Draw time: {room.settings.drawTime}s</div>
            <div>Max players: {room.settings.maxPlayers}</div>
          </div>
        </div>

        <div className="flex gap-4">
          <motion.button
            onClick={onToggleReady}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
              myPlayer?.ready
                ? 'bg-gradient-to-r from-green-700 to-green-500 shadow-lg shadow-green-500/10'
                : 'bg-zinc-700 hover:bg-zinc-600'
            }`}
            whileHover={buttonHover}
            whileTap={buttonTap}
            transition={springBouncy}
          >
            {myPlayer?.ready ? 'Ready!' : 'Click when ready'}
          </motion.button>

          {isHost && (
            <motion.button
              onClick={onStartGame}
              disabled={!canStart}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                canStart
                  ? 'bg-gradient-to-r from-ocean-dark to-ocean shadow-lg shadow-ocean/20'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
              whileHover={canStart ? buttonHover : undefined}
              whileTap={canStart ? buttonTap : undefined}
              transition={springBouncy}
            >
              {canStart ? 'Start Game' : 'Waiting for players...'}
            </motion.button>
          )}
        </div>

        {!canStart && (
          <p className="text-center text-zinc-500 mt-4">
            {players.length < 2
              ? 'Need at least 2 players to start'
              : 'Waiting for all players to be ready'}
          </p>
        )}
      </motion.div>
    </div>
  );
}
