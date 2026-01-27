import { ScoreBoard } from '../../ScoreBoard';
import { SandParticles } from '../../ui/SandParticles';
import type { GameOverPayload } from '../../../types/game.types';

interface GameOverPhaseProps {
  gameOverData: GameOverPayload;
}

export function GameOverPhase({ gameOverData }: GameOverPhaseProps) {
  return (
    <div className="min-h-screen bg-zinc-900 relative overflow-hidden">
      <SandParticles count={50} />
      <ScoreBoard
        scores={gameOverData.finalScores}
        title="Final Results"
        isGameOver
      />
    </div>
  );
}
