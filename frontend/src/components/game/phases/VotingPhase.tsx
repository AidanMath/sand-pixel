import { useState } from 'react';
import { motion } from 'motion/react';
import { DrawingCard } from '../../ui/DrawingCard';
import { useCountdown } from '../../../hooks/useCountdown';
import type { DrawingEntry, VotingResult } from '../../../types/game.types';

interface VotingPhaseProps {
  drawings: DrawingEntry[];
  votingTime: number;
  hasVoted: boolean;
  votingResults: VotingResult[] | null;
  myPlayerId: string | null;
  onVote: (drawerId: string) => void;
}

export function VotingPhase({
  drawings,
  votingTime,
  hasVoted,
  votingResults,
  myPlayerId,
  onVote,
}: VotingPhaseProps) {
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const { timeLeft, isLow } = useCountdown(votingTime, { enabled: !votingResults });

  const handleVote = (drawerId: string) => {
    if (hasVoted || drawerId === myPlayerId) return;
    setVotedFor(drawerId);
    onVote(drawerId);
  };

  const showResults = votingResults !== null;

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {showResults ? 'Voting Results' : 'Vote for Best Drawing'}
            </div>
            {!showResults && (
              <div className="flex items-center gap-2">
                <div className="text-zinc-400">Time left:</div>
                <div className={`text-2xl font-mono ${isLow ? 'text-red-400' : ''}`}>
                  {timeLeft}s
                </div>
              </div>
            )}
          </div>
          {!showResults && (
            <div className="mt-2 text-zinc-400">
              {hasVoted
                ? 'Thanks for voting! Waiting for other players...'
                : "Vote for your favorite drawing (you can't vote for yourself)"}
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {showResults
            ? votingResults.map((result, index) => {
                const drawing = drawings.find((d) => d.drawerId === result.drawerId);
                if (!drawing) return null;
                return (
                  <motion.div
                    key={result.drawerId}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <DrawingCard
                      drawing={drawing}
                      onVote={() => {}}
                      disabled={true}
                      voted={false}
                      isWinner={result.isWinner}
                      votes={result.votes}
                      showResults={true}
                    />
                  </motion.div>
                );
              })
            : drawings.map((drawing, index) => (
                <motion.div
                  key={drawing.drawerId}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <DrawingCard
                    drawing={drawing}
                    onVote={() => handleVote(drawing.drawerId)}
                    disabled={hasVoted || drawing.drawerId === myPlayerId}
                    voted={votedFor === drawing.drawerId}
                  />
                </motion.div>
              ))}
        </motion.div>

        {showResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center text-zinc-400"
          >
            Returning to lobby...
          </motion.div>
        )}
      </div>
    </div>
  );
}
