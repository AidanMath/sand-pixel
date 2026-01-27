import { motion } from 'motion/react';
import { springBouncy, buttonHover, buttonTap, staggerContainer, staggerItem } from '../../utils/animations';

interface JoinRoomViewProps {
  playerName: string;
  roomCode: string;
  error: string | null;
  onPlayerNameChange: (name: string) => void;
  onRoomCodeChange: (code: string) => void;
  onJoinRoom: () => void;
  onBack: () => void;
}

export function JoinRoomView({
  playerName,
  roomCode,
  error,
  onPlayerNameChange,
  onRoomCodeChange,
  onJoinRoom,
  onBack,
}: JoinRoomViewProps) {
  const canJoin = playerName.trim() && roomCode.length === 6;

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
          Join Room
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
            <label className="block text-sm text-zinc-400 mb-2">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => onRoomCodeChange(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code"
              maxLength={6}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus-sand uppercase tracking-widest text-center text-xl transition-shadow"
            />
          </motion.div>

          <motion.button
            onClick={onJoinRoom}
            disabled={!canJoin}
            className="w-full py-4 bg-gradient-to-r from-sand-dark to-sand disabled:bg-zinc-700 disabled:text-zinc-500 disabled:from-zinc-700 disabled:to-zinc-700 rounded-lg font-semibold shadow-lg shadow-sand/10"
            variants={staggerItem}
            whileHover={canJoin ? buttonHover : undefined}
            whileTap={canJoin ? buttonTap : undefined}
            transition={springBouncy}
          >
            Join Room
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
