import { useState, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { useCountdown } from '../../../hooks/useCountdown';

interface TelephoneGuessPhaseProps {
  prompt: string; // Base64 drawing to guess
  guessTime: number;
  currentPlayerName: string;
  isMyTurn: boolean;
  remainingPlayers: number;
  onSubmitGuess: (guess: string) => void;
}

export function TelephoneGuessPhase({
  prompt,
  guessTime,
  currentPlayerName,
  isMyTurn,
  remainingPlayers,
  onSubmitGuess,
}: TelephoneGuessPhaseProps) {
  const [guess, setGuess] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const guessRef = useRef(guess);
  guessRef.current = guess;

  const handleAutoSubmit = useCallback(() => {
    if (guessRef.current.trim() && !hasSubmitted) {
      setHasSubmitted(true);
      onSubmitGuess(guessRef.current.trim());
    }
  }, [hasSubmitted, onSubmitGuess]);

  const { timeLeft, isLow } = useCountdown(guessTime, {
    enabled: isMyTurn && !hasSubmitted,
    onComplete: handleAutoSubmit,
  });

  const handleSubmit = useCallback(() => {
    if (hasSubmitted || !guess.trim()) return;
    setHasSubmitted(true);
    onSubmitGuess(guess.trim());
  }, [hasSubmitted, guess, onSubmitGuess]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isMyTurn) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white p-4 flex items-center justify-center">
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-800 rounded-lg p-8"
          >
            <div className="text-6xl mb-4">🤔</div>
            <div className="text-2xl font-bold mb-2">
              {currentPlayerName} is guessing...
            </div>
            <div className="text-zinc-400 mb-4">
              {remainingPlayers} player{remainingPlayers !== 1 ? 's' : ''} remaining in the chain
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-100" />
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-200" />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-zinc-800 rounded-lg p-4 mb-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-zinc-400 text-sm">What do you think this is?</div>
              <div className="text-xl font-bold text-amber-400">Guess the drawing!</div>
            </div>
            <div className="text-right">
              <div className="text-zinc-400 text-sm">Time left</div>
              <div className={`text-3xl font-mono ${isLow ? 'text-red-400' : ''}`}>
                {timeLeft}s
              </div>
            </div>
          </div>
        </motion.div>

        {/* Drawing display */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-lg overflow-hidden shadow-lg mb-4"
          style={{ aspectRatio: '800/600' }}
        >
          {prompt && (
            <img
              src={prompt}
              alt="Drawing to guess"
              className="w-full h-full object-contain"
            />
          )}
        </motion.div>

        {/* Guess input */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-zinc-800 rounded-lg p-4"
        >
          <div className="flex gap-4">
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={hasSubmitted}
              placeholder="Type your guess..."
              className="flex-1 px-4 py-3 bg-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
              autoFocus
            />
            <button
              onClick={handleSubmit}
              disabled={hasSubmitted || !guess.trim()}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-600 text-white font-semibold rounded-lg transition"
            >
              {hasSubmitted ? 'Submitted!' : 'Submit'}
            </button>
          </div>
        </motion.div>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center text-zinc-400"
        >
          {remainingPlayers} player{remainingPlayers !== 1 ? 's' : ''} remaining in the chain
        </motion.div>
      </div>
    </div>
  );
}
