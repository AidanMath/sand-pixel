import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '../../../stores/gameStore';
import { countdownNumber, springBouncy } from '../../../utils/animations';

export function CountdownPhase() {
  // Use countdown from store (synced with backend)
  const backendCountdown = useGameStore((state) => state.countdown);

  // Local state for display - start with backend value or 3 as fallback
  // Backend sends countdown(3) for 3-2-1-Draw! sequence
  const [displayCount, setDisplayCount] = useState<number | 'draw'>(() => {
    return backendCountdown ?? 3;
  });
  const lastBackendCount = useRef<number | null>(backendCountdown);
  const hasReceivedBackend = useRef(backendCountdown !== null);

  // Sync with backend countdown when it arrives
  useEffect(() => {
    if (backendCountdown !== null && backendCountdown !== lastBackendCount.current) {
      lastBackendCount.current = backendCountdown;
      hasReceivedBackend.current = true;
      setDisplayCount(backendCountdown);
    }
  }, [backendCountdown]);

  // If backend hasn't sent a value yet but we're in countdown phase,
  // start local countdown from a reasonable default
  useEffect(() => {
    if (!hasReceivedBackend.current && typeof displayCount === 'number' && displayCount > 3) {
      // Cap at 3 if somehow started higher
      setDisplayCount(3);
    }
  }, []);

  // Local countdown timer (fallback if backend doesn't send updates)
  useEffect(() => {
    if (typeof displayCount !== 'number' || displayCount <= 0) return;

    const timer = setTimeout(() => {
      if (displayCount === 1) {
        setDisplayCount('draw');
      } else {
        setDisplayCount(displayCount - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [displayCount]);

  // Auto-clear "Draw!" after a short moment (in case phase doesn't change)
  useEffect(() => {
    if (displayCount !== 'draw') return;

    const timer = setTimeout(() => {
      // Keep showing "Draw!" - phase transition will handle removal
    }, 1500);

    return () => clearTimeout(timer);
  }, [displayCount]);

  const showNumber = typeof displayCount === 'number' && displayCount > 0;
  const showDraw = displayCount === 'draw' || displayCount === 0;

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
          {showNumber ? (
            <motion.div
              key={displayCount}
              variants={countdownNumber}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={springBouncy}
              className="text-9xl font-bold text-white"
            >
              {displayCount}
            </motion.div>
          ) : showDraw ? (
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
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
