import { ScoreBoard } from '../../ScoreBoard';
import type { RoundEndPayload } from '../../../types/game.types';

interface ResultsPhaseProps {
  roundEndData: RoundEndPayload;
}

export function ResultsPhase({ roundEndData }: ResultsPhaseProps) {
  return (
    <div className="min-h-screen bg-zinc-900">
      <ScoreBoard
        scores={roundEndData.scores}
        word={roundEndData.word}
        showGuessStatus
      />
    </div>
  );
}
