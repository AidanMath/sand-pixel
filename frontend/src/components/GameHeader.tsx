import { GameTimer } from './GameTimer';

interface GameHeaderProps {
  round: number;
  totalRounds: number;
  wordHint: string;
  wordLength: number;
  drawTime: number;
  isDrawer: boolean;
  currentWord?: string;
  drawerName?: string;
  phaseStartTime?: number;
}

export function GameHeader({
  round,
  totalRounds,
  wordHint,
  wordLength,
  drawTime,
  isDrawer,
  currentWord,
  drawerName,
  phaseStartTime,
}: GameHeaderProps) {
  return (
    <div className="bg-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-zinc-400">
          Round <span className="text-white font-semibold">{round}</span> of{' '}
          <span className="text-white">{totalRounds}</span>
        </div>
        <GameTimer duration={drawTime} startTime={phaseStartTime} />
      </div>

      <div className="text-center">
        {isDrawer ? (
          <div>
            <div className="text-zinc-400 text-sm mb-1">Your word is:</div>
            <div className="text-3xl font-bold text-green-400">{currentWord}</div>
          </div>
        ) : (
          <div>
            <div className="text-zinc-400 text-sm mb-1">
              <span className="text-blue-400 font-medium">{drawerName}</span> is drawing:
            </div>
            <div className="text-3xl font-mono tracking-widest text-white">
              {wordHint || '_ '.repeat(wordLength).trim()}
            </div>
            <div className="text-zinc-500 text-sm mt-1">
              {wordLength} letters
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
