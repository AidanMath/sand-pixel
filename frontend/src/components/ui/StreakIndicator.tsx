import { motion } from 'motion/react';

interface StreakIndicatorProps {
  streak: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function StreakIndicator({ streak, showLabel = false, size = 'sm' }: StreakIndicatorProps) {
  if (streak < 2) return null;

  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';

  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1 bg-orange-500/20 text-orange-400 rounded ${sizeClasses}`}
    >
      <span className="text-orange-500">🔥</span>
      {showLabel ? `${streak} streak` : streak}
    </motion.span>
  );
}
