import type { RoomSettings } from '../../types/game.types';

interface CreateRoomViewProps {
  playerName: string;
  settings: RoomSettings;
  error: string | null;
  onPlayerNameChange: (name: string) => void;
  onSettingsChange: (settings: RoomSettings) => void;
  onCreateRoom: () => void;
  onBack: () => void;
}

export function CreateRoomView({
  playerName,
  settings,
  error,
  onPlayerNameChange,
  onSettingsChange,
  onCreateRoom,
  onBack,
}: CreateRoomViewProps) {
  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">
      <div className="max-w-md mx-auto">
        <button
          onClick={onBack}
          className="mb-8 text-zinc-400 hover:text-white transition"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold mb-8">Create Room</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => onPlayerNameChange(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Rounds</label>
            <select
              value={settings.totalRounds}
              onChange={(e) =>
                onSettingsChange({ ...settings, totalRounds: Number(e.target.value) })
              }
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:border-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n} round{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Draw Time
            </label>
            <select
              value={settings.drawTime}
              onChange={(e) =>
                onSettingsChange({ ...settings, drawTime: Number(e.target.value) })
              }
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:border-blue-500"
            >
              {[30, 45, 60, 80, 100, 120, 150, 180].map((n) => (
                <option key={n} value={n}>
                  {n} seconds
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onCreateRoom}
            disabled={!playerName.trim()}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded font-semibold transition"
          >
            Create Room
          </button>
        </div>
      </div>
    </div>
  );
}
