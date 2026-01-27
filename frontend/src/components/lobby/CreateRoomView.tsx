import { motion } from 'motion/react';
import { springBouncy, buttonHover, buttonTap, staggerContainer, staggerItem } from '../../utils/animations';
import type { RoomSettings, GameMode } from '../../types/game.types';

interface CreateRoomViewProps {
  playerName: string;
  settings: RoomSettings;
  error: string | null;
  onPlayerNameChange: (name: string) => void;
  onSettingsChange: (settings: RoomSettings) => void;
  onCreateRoom: () => void;
  onBack: () => void;
}

export function CreateRoomView({
  playerName,
  settings,
  error,
  onPlayerNameChange,
  onSettingsChange,
  onCreateRoom,
  onBack,
}: CreateRoomViewProps) {
  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">
      <div className="max-w-md mx-auto">
        <motion.button
          onClick={onBack}
          className="mb-8 text-zinc-400 hover:text-white transition"
          whileHover={{ x: -4 }}
          transition={springBouncy}
        >
          ← Back
        </motion.button>

        <motion.h1
          className="text-3xl font-bold mb-8 bg-sand-gradient bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Create Room
        </motion.h1>

        {error && (
          <motion.div
            className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            {error}
          </motion.div>
        )}

        <motion.div
          className="space-y-6"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={staggerItem} transition={springBouncy}>
            <label className="block text-sm text-zinc-400 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => onPlayerNameChange(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus-sand transition-shadow"
            />
          </motion.div>

          <motion.div variants={staggerItem} transition={springBouncy}>
            <label className="block text-sm text-zinc-400 mb-2">Rounds</label>
            <select
              value={settings.totalRounds}
              onChange={(e) =>
                onSettingsChange({ ...settings, totalRounds: Number(e.target.value) })
              }
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus-sand transition-shadow"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n} round{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div variants={staggerItem} transition={springBouncy}>
            <label className="block text-sm text-zinc-400 mb-2">
              Draw Time
            </label>
            <select
              value={settings.drawTime}
              onChange={(e) =>
                onSettingsChange({ ...settings, drawTime: Number(e.target.value) })
              }
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus-sand transition-shadow"
            >
              {[30, 45, 60, 80, 100, 120, 150, 180].map((n) => (
                <option key={n} value={n}>
                  {n} seconds
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div variants={staggerItem} transition={springBouncy}>
            <label className="block text-sm text-zinc-400 mb-2">
              Game Mode
            </label>
            <select
              value={settings.gameMode}
              onChange={(e) =>
                onSettingsChange({ ...settings, gameMode: e.target.value as GameMode })
              }
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus-sand transition-shadow"
            >
              <option value="CLASSIC">Classic - One drawer per round</option>
              <option value="COLLABORATIVE">Collaborative - Multiple drawers</option>
              <option value="TELEPHONE">Telephone - Draw, guess, repeat!</option>
            </select>
          </motion.div>

          {settings.gameMode === 'COLLABORATIVE' && (
            <motion.div
              variants={staggerItem}
              transition={springBouncy}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <label className="block text-sm text-zinc-400 mb-2">
                Number of Drawers
              </label>
              <select
                value={settings.collaborativeDrawerCount}
                onChange={(e) =>
                  onSettingsChange({ ...settings, collaborativeDrawerCount: Number(e.target.value) })
                }
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus-sand transition-shadow"
              >
                {[2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} drawers
                  </option>
                ))}
              </select>
            </motion.div>
          )}

          <motion.button
            onClick={onCreateRoom}
            disabled={!playerName.trim()}
            className="w-full py-4 bg-gradient-to-r from-ocean-dark to-ocean disabled:bg-zinc-700 disabled:text-zinc-500 disabled:from-zinc-700 disabled:to-zinc-700 rounded-lg font-semibold shadow-lg shadow-ocean/10"
            variants={staggerItem}
            whileHover={playerName.trim() ? buttonHover : undefined}
            whileTap={playerName.trim() ? buttonTap : undefined}
            transition={springBouncy}
          >
            Create Room
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
