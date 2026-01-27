import { motion } from 'motion/react';
import { modalBackdrop, modalContent, springBouncy, staggerContainer, staggerItem, buttonHover, buttonTap } from '../utils/animations';

interface WordSelectorProps {
  words: string[];
  onSelect: (index: number) => void;
  timeLeft?: number;
}

export function WordSelector({ words, onSelect, timeLeft }: WordSelectorProps) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      variants={modalBackdrop}
      initial="initial"
      animate="animate"
    >
      <motion.div
        className="bg-zinc-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl"
        variants={modalContent}
        initial="initial"
        animate="animate"
        transition={springBouncy}
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Choose a word!</h2>
          {timeLeft !== undefined && (
            <p className="text-zinc-400">
              Time left: <span className="text-yellow-400 font-mono">{timeLeft}s</span>
            </p>
          )}
        </div>
        <motion.div
          className="space-y-3"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {words.map((word, index) => (
            <motion.button
              key={index}
              onClick={() => onSelect(index)}
              className="w-full py-4 px-6 bg-zinc-700 hover:bg-gradient-to-r hover:from-ocean-dark hover:to-ocean text-white text-xl font-medium rounded-lg transition-colors"
              variants={staggerItem}
              whileHover={buttonHover}
              whileTap={buttonTap}
              transition={springBouncy}
            >
              {word}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
