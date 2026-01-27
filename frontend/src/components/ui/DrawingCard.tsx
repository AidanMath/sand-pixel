import { motion } from 'motion/react';
import type { DrawingEntry } from '../../types/game.types';

interface DrawingCardProps {
  drawing: DrawingEntry;
  onVote: () => void;
  disabled: boolean;
  voted: boolean;
  isWinner?: boolean;
  votes?: number;
  showResults?: boolean;
}

export function DrawingCard({
  drawing,
  onVote,
  disabled,
  voted,
  isWinner = false,
  votes = 0,
  showResults = false,
}: DrawingCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`bg-zinc-800 rounded-lg overflow-hidden ${
        isWinner ? 'ring-2 ring-yellow-500' : ''
      }`}
    >
      <div className="aspect-square bg-white flex items-center justify-center">
        {drawing.drawingBase64 ? (
          <img
            src={drawing.drawingBase64}
            alt={`Drawing by ${drawing.drawerName}`}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-zinc-400 text-sm">No drawing</div>
        )}
      </div>
      <div className="p-3">
        <div className="text-center mb-2">
          <div className="text-sm text-zinc-400">Drawn by</div>
          <div className="font-semibold">{drawing.drawerName}</div>
          <div className="text-xs text-zinc-500">"{drawing.word}"</div>
        </div>
        {showResults ? (
          <div className="text-center">
            <div className={`text-2xl font-bold ${isWinner ? 'text-yellow-400' : 'text-zinc-400'}`}>
              {votes} {votes === 1 ? 'vote' : 'votes'}
            </div>
            {isWinner && (
              <div className="text-yellow-400 text-sm mt-1">Winner! 🏆</div>
            )}
          </div>
        ) : (
          <button
            onClick={onVote}
            disabled={disabled || voted}
            className={`w-full py-2 rounded font-semibold transition ${
              voted
                ? 'bg-green-600 text-white cursor-not-allowed'
                : disabled
                ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {voted ? 'Voted!' : 'Vote'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
