import { motion } from 'motion/react';
import type { Reaction } from '../../types/game.types';

interface FloatingReactionProps {
  reaction: Reaction;
}

export function FloatingReaction({ reaction }: FloatingReactionProps) {
  // Random horizontal position within the container
  const randomX = Math.random() * 80 + 10; // 10-90% from left

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: `${randomX}%`, scale: 0.5 }}
      animate={{ opacity: 0, y: -150, scale: 1.2 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2, ease: 'easeOut' }}
      className="absolute bottom-4 pointer-events-none flex flex-col items-center"
      style={{ left: 0 }}
    >
      <span className="text-3xl">{reaction.emoji}</span>
      <span className="text-xs text-white/80 bg-black/40 px-1.5 py-0.5 rounded mt-1 whitespace-nowrap">
        {reaction.playerName}
      </span>
    </motion.div>
  );
}
