import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { springBouncy } from '../utils/animations';
import { TIMER } from '../constants';

interface GameTimerProps {
  duration: number;
  startTime?: number;
  onTimeUp?: () => void;
  className?: string;
}

export function GameTimer({
  duration,
  startTime,
  onTimeUp,
  className = '',
}: GameTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const start = startTime || Date.now();

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0 && onTimeUp) {
        onTimeUp();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [duration, startTime, onTimeUp]);

  const percentage = (timeLeft / duration) * 100;
  const isLow = timeLeft <= TIMER.LOW_TIME_THRESHOLD;

  // Gradient color: ocean -> sand-warm -> red as time depletes
  const getBarGradient = () => {
    if (percentage > TIMER.BAR_WARNING_PERCENT) {
      return 'bg-gradient-to-r from-ocean-dark to-ocean';
    }
    if (percentage > TIMER.BAR_DANGER_PERCENT) {
      return 'bg-gradient-to-r from-sand-dark to-sand-warm';
    }
    return 'bg-gradient-to-r from-red-700 to-red-500';
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Timer bar */}
      <div className="flex-1 h-3 bg-zinc-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${getBarGradient()}`}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Time display */}
      <motion.span
        className={`font-mono text-lg min-w-[3ch] text-right ${
          isLow ? 'text-red-400' : 'text-white'
        }`}
        animate={isLow ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={isLow ? { duration: 0.5, repeat: Infinity } : springBouncy}
      >
        {timeLeft}
      </motion.span>
    </div>
  );
}
