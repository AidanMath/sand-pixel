import { useState, useEffect, useCallback } from 'react';
import { TIMER } from '../constants';

interface UseCountdownOptions {
  /** Callback when countdown reaches zero */
  onComplete?: () => void;
  /** Whether the countdown should be running */
  enabled?: boolean;
  /** Auto-start when mounted (default: true) */
  autoStart?: boolean;
}

interface UseCountdownReturn {
  /** Current time remaining in seconds */
  timeLeft: number;
  /** Whether the countdown is currently running */
  isRunning: boolean;
  /** Whether time is low (<=10 seconds by default) */
  isLow: boolean;
  /** Percentage of time remaining (0-100) */
  percentage: number;
  /** Reset the countdown to initial time */
  reset: () => void;
  /** Pause the countdown */
  pause: () => void;
  /** Resume the countdown */
  resume: () => void;
}

/**
 * Reusable countdown timer hook
 * @param initialTime - Starting time in seconds
 * @param options - Configuration options
 */
export function useCountdown(
  initialTime: number,
  options: UseCountdownOptions = {}
): UseCountdownReturn {
  const { onComplete, enabled = true, autoStart = true } = options;

  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart && enabled);

  // Reset when initialTime changes
  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  // Countdown logic
  useEffect(() => {
    if (!isRunning || !enabled || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, enabled, onComplete, timeLeft]);

  const reset = useCallback(() => {
    setTimeLeft(initialTime);
    setIsRunning(autoStart && enabled);
  }, [initialTime, autoStart, enabled]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (timeLeft > 0) {
      setIsRunning(true);
    }
  }, [timeLeft]);

  return {
    timeLeft,
    isRunning,
    isLow: timeLeft <= TIMER.LOW_TIME_THRESHOLD,
    percentage: initialTime > 0 ? (timeLeft / initialTime) * 100 : 0,
    reset,
    pause,
    resume,
  };
}
