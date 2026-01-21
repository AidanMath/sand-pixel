interface WordSelectorProps {
  words: string[];
  onSelect: (index: number) => void;
  timeLeft?: number;
}

export function WordSelector({ words, onSelect, timeLeft }: WordSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Choose a word!</h2>
          {timeLeft !== undefined && (
            <p className="text-zinc-400">
              Time left: <span className="text-yellow-400 font-mono">{timeLeft}s</span>
            </p>
          )}
        </div>
        <div className="space-y-3">
          {words.map((word, index) => (
            <button
              key={index}
              onClick={() => onSelect(index)}
              className="w-full py-4 px-6 bg-zinc-700 hover:bg-blue-600 text-white text-xl font-medium rounded-lg transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
