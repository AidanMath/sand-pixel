/**
 * Unit tests for useCountdown hook
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from './useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('initializes with provided time', () => {
      const { result } = renderHook(() => useCountdown(60));

      expect(result.current.timeLeft).toBe(60);
    });

    it('starts running by default when autoStart is true', () => {
      const { result } = renderHook(() => useCountdown(60, { autoStart: true }));

      expect(result.current.isRunning).toBe(true);
    });

    it('does not start running when autoStart is false', () => {
      const { result } = renderHook(() => useCountdown(60, { autoStart: false }));

      expect(result.current.isRunning).toBe(false);
    });

    it('does not run when enabled is false', () => {
      const { result } = renderHook(() => useCountdown(60, { enabled: false }));

      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('countdown behavior', () => {
    it('counts down by 1 each second', () => {
      const { result } = renderHook(() => useCountdown(60));

      expect(result.current.timeLeft).toBe(60);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeLeft).toBe(59);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeLeft).toBe(58);
    });

    it('stops at 0', () => {
      const { result } = renderHook(() => useCountdown(3));

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.timeLeft).toBe(0);
      expect(result.current.isRunning).toBe(false);

      // Should not go negative
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeLeft).toBe(0);
    });

    it('calls onComplete when reaching 0', () => {
      const onComplete = vi.fn();
      renderHook(() => useCountdown(3, { onComplete }));

      expect(onComplete).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('does not call onComplete multiple times', () => {
      const onComplete = vi.fn();
      renderHook(() => useCountdown(2, { onComplete }));

      // Advance to exactly when countdown completes
      act(() => {
        vi.advanceTimersByTime(1000); // 2 -> 1
      });
      act(() => {
        vi.advanceTimersByTime(1000); // 1 -> 0, onComplete called
      });

      expect(onComplete).toHaveBeenCalledTimes(1);

      // Advance more time - should not call again
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('reset', () => {
    it('reset() restarts from initial time', () => {
      const { result } = renderHook(() => useCountdown(60));

      // Count down some
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.timeLeft).toBe(50);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.timeLeft).toBe(60);
      expect(result.current.isRunning).toBe(true);
    });

    it('reset() restarts running state based on autoStart', () => {
      const { result } = renderHook(() => useCountdown(10, { autoStart: false }));

      expect(result.current.isRunning).toBe(false);

      // Manually resume
      act(() => {
        result.current.resume();
      });

      expect(result.current.isRunning).toBe(true);

      // Reset should go back to not running (since autoStart is false)
      act(() => {
        result.current.reset();
      });

      expect(result.current.timeLeft).toBe(10);
      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('pause and resume', () => {
    it('pause() stops the countdown', () => {
      const { result } = renderHook(() => useCountdown(60));

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeLeft).toBe(55);

      act(() => {
        result.current.pause();
      });

      expect(result.current.isRunning).toBe(false);

      // Time should not decrease while paused
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeLeft).toBe(55);
    });

    it('resume() continues the countdown', () => {
      const { result } = renderHook(() => useCountdown(60));

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      act(() => {
        result.current.pause();
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeLeft).toBe(55);

      act(() => {
        result.current.resume();
      });

      expect(result.current.isRunning).toBe(true);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeLeft).toBe(50);
    });

    it('resume() does nothing if time is 0', () => {
      const { result } = renderHook(() => useCountdown(2));

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.timeLeft).toBe(0);
      expect(result.current.isRunning).toBe(false);

      act(() => {
        result.current.resume();
      });

      // Should still not be running
      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('isLow', () => {
    it('isLow is false when time > 10 seconds', () => {
      const { result } = renderHook(() => useCountdown(60));

      expect(result.current.isLow).toBe(false);
    });

    it('isLow is true when time <= 10 seconds', () => {
      const { result } = renderHook(() => useCountdown(60));

      act(() => {
        vi.advanceTimersByTime(50000);
      });

      expect(result.current.timeLeft).toBe(10);
      expect(result.current.isLow).toBe(true);
    });

    it('isLow is true at exactly 10 seconds', () => {
      const { result } = renderHook(() => useCountdown(15));

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeLeft).toBe(10);
      expect(result.current.isLow).toBe(true);
    });

    it('isLow is true at 1 second', () => {
      const { result } = renderHook(() => useCountdown(5));

      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(result.current.timeLeft).toBe(1);
      expect(result.current.isLow).toBe(true);
    });
  });

  describe('percentage', () => {
    it('percentage is 100 at start', () => {
      const { result } = renderHook(() => useCountdown(60));

      expect(result.current.percentage).toBe(100);
    });

    it('percentage decreases as time passes', () => {
      const { result } = renderHook(() => useCountdown(100));

      act(() => {
        vi.advanceTimersByTime(50000);
      });

      expect(result.current.timeLeft).toBe(50);
      expect(result.current.percentage).toBe(50);
    });

    it('percentage is 0 when time runs out', () => {
      const { result } = renderHook(() => useCountdown(10));

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.timeLeft).toBe(0);
      expect(result.current.percentage).toBe(0);
    });

    it('percentage handles edge case of 0 initial time', () => {
      const { result } = renderHook(() => useCountdown(0));

      // Should not divide by zero
      expect(result.current.percentage).toBe(0);
    });
  });

  describe('initialTime changes', () => {
    it('updates timeLeft when initialTime prop changes', () => {
      const { result, rerender } = renderHook(({ time }) => useCountdown(time), {
        initialProps: { time: 60 },
      });

      expect(result.current.timeLeft).toBe(60);

      rerender({ time: 30 });

      expect(result.current.timeLeft).toBe(30);
    });
  });

  describe('enabled changes', () => {
    it('stops running when enabled becomes false', () => {
      const { result, rerender } = renderHook(({ enabled }) => useCountdown(60, { enabled }), {
        initialProps: { enabled: true },
      });

      expect(result.current.isRunning).toBe(true);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeLeft).toBe(55);

      rerender({ enabled: false });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Should not have decremented while disabled
      expect(result.current.timeLeft).toBe(55);
    });
  });
});
