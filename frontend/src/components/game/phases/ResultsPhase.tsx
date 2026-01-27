import { ScoreBoard } from '../../ScoreBoard';
import { useCountdown } from '../../../hooks/useCountdown';
import { DEFAULT_GAME_SETTINGS } from '../../../constants';
import type { RoundEndPayload } from '../../../types/game.types';

interface ResultsPhaseProps {
  roundEndData: RoundEndPayload;
  resultsTime?: number;
}

export function ResultsPhase({
  roundEndData,
  resultsTime = DEFAULT_GAME_SETTINGS.RESULTS_TIME,
}: ResultsPhaseProps) {
  const { timeLeft } = useCountdown(resultsTime);

  return (
    <div className="min-h-screen bg-zinc-900">
      <ScoreBoard
        scores={roundEndData.scores}
        word={roundEndData.word}
        showGuessStatus
        timeLeft={timeLeft}
      />
    </div>
  );
}
