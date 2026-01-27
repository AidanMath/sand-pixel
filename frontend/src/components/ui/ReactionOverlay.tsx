import { AnimatePresence } from 'motion/react';
import type { Reaction } from '../../types/game.types';
import { FloatingReaction } from './FloatingReaction';

interface ReactionOverlayProps {
  reactions: Reaction[];
}

export function ReactionOverlay({ reactions }: ReactionOverlayProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      <AnimatePresence>
        {reactions.map((reaction) => (
          <FloatingReaction key={reaction.id} reaction={reaction} />
        ))}
      </AnimatePresence>
    </div>
  );
}
