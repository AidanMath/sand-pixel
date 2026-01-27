import { motion } from 'motion/react';
import {
  modalBackdrop,
  modalContent,
  springBouncy,
  springGentle,
  scoreEntryVariants,
  buttonHover,
  buttonTap,
} from '../utils/animations';

interface ScoreEntry {
  playerId: string;
  playerName: string;
  score: number;
  isDrawer?: boolean;
  guessedCorrectly?: boolean;
  rank?: number;
}

interface ScoreBoardProps {
  scores: ScoreEntry[];
  title?: string;
  word?: string;
  showGuessStatus?: boolean;
  onContinue?: () => void;
  isGameOver?: boolean;
  timeLeft?: number;
}

export function ScoreBoard({
  scores,
  title = 'Round Results',
  word,
  showGuessStatus = false,
  onContinue,
  isGameOver = false,
  timeLeft,
}: ScoreBoardProps) {
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  const getMedal = (index: number) => {
    if (!isGameOver) return null;
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      variants={modalBackdrop}
      initial="initial"
      animate="animate"
    >
      <motion.div
        className="bg-zinc-800 rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl"
        variants={modalContent}
        initial="initial"
        animate="animate"
        transition={springBouncy}
      >
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          {title}
        </h2>

        {word && (
          <p className="text-center text-zinc-400 mb-6">
            The word was: <span className="text-green-400 font-semibold">{word}</span>
          </p>
        )}

        <div className="space-y-2 mb-6">
          {sortedScores.map((entry, index) => (
            <motion.div
              key={entry.playerId}
              variants={scoreEntryVariants}
              initial="initial"
              animate="animate"
              transition={{ ...springGentle, delay: index * 0.1 }}
              className={`flex items-center justify-between p-3 rounded-lg relative overflow-hidden ${
                index === 0 && isGameOver
                  ? 'bg-yellow-500/20 border border-yellow-500/30'
                  : 'bg-zinc-700/50'
              }`}
            >
              {/* Winner shimmer */}
              {index === 0 && isGameOver && (
                <div className="absolute inset-0 shimmer-bg" />
              )}
              <div className="flex items-center gap-3 relative z-10">
                <span className="text-zinc-400 w-6 text-center">
                  {getMedal(index) || `#${index + 1}`}
                </span>
                <span className="text-white font-medium">{entry.playerName}</span>
                {entry.isDrawer && (
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                    Drawer
                  </span>
                )}
                {showGuessStatus && entry.guessedCorrectly && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                    Guessed
                  </span>
                )}
              </div>
              <span className="font-mono text-xl text-white relative z-10">{entry.score}</span>
            </motion.div>
          ))}
        </div>

        {onContinue && (
          <motion.button
            onClick={onContinue}
            className="w-full py-3 bg-gradient-to-r from-ocean-dark to-ocean text-white font-semibold rounded-lg"
            whileHover={buttonHover}
            whileTap={buttonTap}
            transition={springBouncy}
          >
            {isGameOver ? 'Back to Lobby' : 'Next Round'}
          </motion.button>
        )}

        {!onContinue && (
          <p className="text-center text-zinc-500 text-sm">
            {isGameOver
              ? 'Returning to lobby...'
              : timeLeft !== undefined
                ? `Next round in ${timeLeft}s`
                : 'Next round starting soon...'}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
