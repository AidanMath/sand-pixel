import { useState, useEffect } from 'react';

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
  const isLow = timeLeft <= 10;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Timer bar */}
      <div className="flex-1 h-3 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isLow ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Time display */}
      <span
        className={`font-mono text-lg min-w-[3ch] text-right ${
          isLow ? 'text-red-400 animate-pulse' : 'text-white'
        }`}
      >
        {timeLeft}
      </span>
    </div>
  );
}
