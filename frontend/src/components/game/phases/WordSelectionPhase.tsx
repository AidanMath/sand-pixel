import { WordSelector } from '../../WordSelector';
import type { Player } from '../../../types/game.types';

interface WordSelectionPhaseProps {
  isDrawer: boolean;
  wordOptions: string[] | null;
  drawer: Player | undefined;
  onWordSelect: (index: number) => void;
}

export function WordSelectionPhase({
  isDrawer,
  wordOptions,
  drawer,
  onWordSelect,
}: WordSelectionPhaseProps) {
  if (isDrawer && wordOptions) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <WordSelector words={wordOptions} onSelect={onWordSelect} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          {drawer?.name} is choosing a word...
        </h1>
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}
