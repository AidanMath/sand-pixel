import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { countdownNumber, springBouncy } from '../../../utils/animations';

export function CountdownPhase() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) return;
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center relative overflow-hidden">
      {/* Pulsing glow circle */}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-sand/10 blur-[60px]"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="text-center relative z-10">
        <AnimatePresence mode="wait">
          {count > 0 ? (
            <motion.div
              key={count}
              variants={countdownNumber}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={springBouncy}
              className="text-9xl font-bold text-white"
            >
              {count}
            </motion.div>
          ) : (
            <motion.div
              key="draw"
              variants={countdownNumber}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={springBouncy}
              className="text-7xl font-bold bg-sand-gradient bg-clip-text text-transparent"
            >
              Draw!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
