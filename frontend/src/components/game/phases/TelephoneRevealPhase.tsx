import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { TelephoneChainEntry } from '../../../types/game.types';

interface TelephoneRevealPhaseProps {
  originalWord: string;
  chain: TelephoneChainEntry[];
}

export function TelephoneRevealPhase({
  originalWord,
  chain,
}: TelephoneRevealPhaseProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-reveal entries one by one
  useEffect(() => {
    if (!isAutoPlaying || revealedCount >= chain.length) return;

    const timer = setTimeout(() => {
      setRevealedCount((prev) => prev + 1);
    }, 2000);

    return () => clearTimeout(timer);
  }, [revealedCount, chain.length, isAutoPlaying]);

  const handleRevealAll = () => {
    setIsAutoPlaying(false);
    setRevealedCount(chain.length);
  };

  const handleRestart = () => {
    setRevealedCount(0);
    setIsAutoPlaying(true);
  };

  // Get the final guess to compare with original word
  const finalGuess = chain.filter((e) => e.type === 'guess').pop()?.content;
  const matchesOriginal = finalGuess?.toLowerCase() === originalWord.toLowerCase();

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4 overflow-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-zinc-800 rounded-lg p-6 mb-6 text-center"
        >
          <div className="text-zinc-400 text-sm mb-2">The original word was</div>
          <div className="text-4xl font-bold text-amber-400">{originalWord}</div>

          {revealedCount >= chain.length && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4"
            >
              {matchesOriginal ? (
                <div className="text-green-400 text-lg">
                  The chain survived! The final guess matched!
                </div>
              ) : (
                <div className="text-red-400 text-lg">
                  The word transformed into: "{finalGuess || '???'}"
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={handleRevealAll}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition"
          >
            Show All
          </button>
          <button
            onClick={handleRestart}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition"
          >
            Replay
          </button>
        </div>

        {/* Chain entries */}
        <div className="space-y-4">
          <AnimatePresence>
            {chain.slice(0, revealedCount).map((entry, index) => (
              <motion.div
                key={index}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-zinc-800 rounded-lg overflow-hidden"
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Entry number */}
                  <div className="w-10 h-10 flex items-center justify-center bg-zinc-700 rounded-full text-lg font-bold">
                    {index + 1}
                  </div>

                  {/* Player info */}
                  <div className="flex-shrink-0 w-32">
                    <div className="font-medium">{entry.playerName}</div>
                    <div className="text-sm text-zinc-400">
                      {entry.type === 'word' && 'Started with'}
                      {entry.type === 'draw' && 'Drew'}
                      {entry.type === 'guess' && 'Guessed'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {entry.type === 'draw' ? (
                      <div className="bg-white rounded-lg overflow-hidden" style={{ maxWidth: '300px', aspectRatio: '4/3' }}>
                        <img
                          src={entry.content}
                          alt={`Drawing by ${entry.playerName}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="text-xl font-semibold text-amber-400">
                        "{entry.content}"
                      </div>
                    )}
                  </div>

                  {/* Type icon */}
                  <div className="text-3xl">
                    {entry.type === 'word' && '📝'}
                    {entry.type === 'draw' && '🎨'}
                    {entry.type === 'guess' && '💭'}
                  </div>
                </div>

                {/* Connection line */}
                {index < chain.length - 1 && index < revealedCount - 1 && (
                  <div className="flex justify-center pb-2">
                    <div className="w-0.5 h-8 bg-zinc-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator for next entry */}
          {revealedCount < chain.length && isAutoPlaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center"
            >
              <div className="flex items-center gap-2 text-zinc-400">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-100" />
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-200" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Summary after all revealed */}
        {revealedCount >= chain.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center text-zinc-400"
          >
            Next round coming up...
          </motion.div>
        )}
      </div>
    </div>
  );
}
