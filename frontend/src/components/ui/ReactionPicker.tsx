import { motion } from 'motion/react';
import { ALLOWED_EMOJIS } from '../../types/game.types';

interface ReactionPickerProps {
  onReact: (emoji: string) => void;
  disabled?: boolean;
}

export function ReactionPicker({ onReact, disabled = false }: ReactionPickerProps) {
  return (
    <div className="flex items-center gap-1 bg-zinc-800 rounded-lg px-2 py-1.5">
      {ALLOWED_EMOJIS.map((emoji, index) => (
        <motion.button
          key={emoji}
          onClick={() => onReact(emoji)}
          disabled={disabled}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.03 }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-zinc-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}
