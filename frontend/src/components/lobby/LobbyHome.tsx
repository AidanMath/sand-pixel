interface LobbyHomeProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function LobbyHome({ onCreateRoom, onJoinRoom }: LobbyHomeProps) {
  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">Sand Draw</h1>
        <p className="text-zinc-400 mb-12">Draw, guess, watch it fall!</p>

        <div className="flex flex-col gap-4 max-w-xs mx-auto">
          <button
            onClick={onCreateRoom}
            className="py-4 px-8 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition"
          >
            Create Room
          </button>
          <button
            onClick={onJoinRoom}
            className="py-4 px-8 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-lg transition"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}
