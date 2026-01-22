interface JoinRoomViewProps {
  playerName: string;
  roomCode: string;
  error: string | null;
  onPlayerNameChange: (name: string) => void;
  onRoomCodeChange: (code: string) => void;
  onJoinRoom: () => void;
  onBack: () => void;
}

export function JoinRoomView({
  playerName,
  roomCode,
  error,
  onPlayerNameChange,
  onRoomCodeChange,
  onJoinRoom,
  onBack,
}: JoinRoomViewProps) {
  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">
      <div className="max-w-md mx-auto">
        <button
          onClick={onBack}
          className="mb-8 text-zinc-400 hover:text-white transition"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold mb-8">Join Room</h1>

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
            <label className="block text-sm text-zinc-400 mb-2">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => onRoomCodeChange(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code"
              maxLength={6}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:border-blue-500 uppercase tracking-widest text-center text-xl"
            />
          </div>

          <button
            onClick={onJoinRoom}
            disabled={!playerName.trim() || roomCode.length !== 6}
            className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded font-semibold transition"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}
