import { motion } from 'motion/react';
import { SandParticles } from '../ui/SandParticles';
import { springBouncy, buttonHover, buttonTap } from '../../utils/animations';

interface LobbyHomeProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function LobbyHome({ onCreateRoom, onJoinRoom }: LobbyHomeProps) {
  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-8 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-sand/5 blur-[100px]" />
      </div>

      {/* Sand particles */}
      <SandParticles count={35} />

      {/* Content */}
      <motion.div
        className="text-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="text-6xl font-bold mb-3 bg-sand-gradient bg-clip-text text-transparent"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...springBouncy, delay: 0.1 }}
        >
          Sand Draw
        </motion.h1>
        <motion.p
          className="text-zinc-400 mb-12 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          Draw, guess, watch it fall!
        </motion.p>

        <motion.div
          className="flex flex-col gap-4 max-w-xs mx-auto"
          initial="initial"
          animate="animate"
          variants={{
            animate: { transition: { staggerChildren: 0.12 } },
          }}
        >
          <motion.button
            onClick={onCreateRoom}
            className="py-4 px-8 bg-gradient-to-r from-ocean-dark to-ocean rounded-lg font-semibold text-lg shadow-lg shadow-ocean/20"
            variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}
            whileHover={buttonHover}
            whileTap={buttonTap}
            transition={springBouncy}
          >
            Create Room
          </motion.button>
          <motion.button
            onClick={onJoinRoom}
            className="py-4 px-8 bg-gradient-to-r from-sand-dark to-sand rounded-lg font-semibold text-lg shadow-lg shadow-sand/20"
            variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}
            whileHover={buttonHover}
            whileTap={buttonTap}
            transition={springBouncy}
          >
            Join Room
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
