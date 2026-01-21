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
}

export function ScoreBoard({
  scores,
  title = 'Round Results',
  word,
  showGuessStatus = false,
  onContinue,
  isGameOver = false,
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl">
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
            <div
              key={entry.playerId}
              className={`flex items-center justify-between p-3 rounded-lg ${
                index === 0 && isGameOver
                  ? 'bg-yellow-500/20 border border-yellow-500/30'
                  : 'bg-zinc-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
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
              <span className="font-mono text-xl text-white">{entry.score}</span>
            </div>
          ))}
        </div>

        {onContinue && (
          <button
            onClick={onContinue}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            {isGameOver ? 'Back to Lobby' : 'Next Round'}
          </button>
        )}

        {!onContinue && (
          <p className="text-center text-zinc-500 text-sm">
            {isGameOver ? 'Returning to lobby...' : 'Next round starting soon...'}
          </p>
        )}
      </div>
    </div>
  );
}
