import { useEffect, useRef } from 'react';
import { PlayerList } from '../../PlayerList';
import { ChatBox } from '../../ChatBox';
import { SandCanvas } from '../../SandCanvas';
import { useSandStore } from '../../../stores/sandStore';
import { drawingToRevealGrains } from '../../../utils/drawingToGrains';
import type { Room, Player, ChatMessage } from '../../../types/game.types';

interface RevealPhaseProps {
  room: Room;
  players: Player[];
  myPlayer: Player | null;
  isDrawer: boolean;
  revealWord: string | null;
  chatMessages: ChatMessage[];
  closeGuess: boolean;
  onChat: (text: string) => void;
  capturedDrawing: string | null;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export function RevealPhase({
  room,
  players,
  myPlayer,
  isDrawer,
  revealWord,
  chatMessages,
  closeGuess,
  onChat,
  capturedDrawing,
}: RevealPhaseProps) {
  const hasGuessed = myPlayer && room.gameState.correctGuessers?.includes(myPlayer.id);
  const { setGrains, setCanvasSize, setPlaying } = useSandStore();
  const hasInitialized = useRef(false);

  // Convert captured drawing to sand grains and start animation
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Set canvas size for the sand simulation
    setCanvasSize(CANVAS_WIDTH, CANVAS_HEIGHT);

    if (capturedDrawing) {
      // Convert drawing to sand grains
      drawingToRevealGrains(capturedDrawing, CANVAS_WIDTH, CANVAS_HEIGHT)
        .then((grains) => {
          setGrains(grains);
          setPlaying(true);
        })
        .catch((err) => {
          console.error('Failed to convert drawing to grains:', err);
          // Show empty canvas on error
          setGrains([]);
          setPlaying(true);
        });
    } else {
      // No drawing captured - create a simple white background grain pattern
      const grains = createWhiteGrains(CANVAS_WIDTH, CANVAS_HEIGHT);
      setGrains(grains);
      setPlaying(true);
    }

    // Cleanup when unmounting
    return () => {
      setGrains([]);
      setPlaying(false);
    };
  }, [capturedDrawing, setGrains, setCanvasSize, setPlaying]);

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-zinc-800 rounded-lg p-6 mb-4">
          <div className="flex items-center justify-between">
            <div className="text-zinc-400">
              Round {room.gameState.currentRound} of {room.gameState.totalRounds}
            </div>
            <div className="text-center">
              <div className="text-sm text-zinc-400 mb-1">The word was</div>
              <div className="text-3xl font-bold text-green-400">
                {revealWord}
              </div>
            </div>
            <div className="text-zinc-400">Reveal</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          {/* Sand animation canvas */}
          <div className="bg-zinc-800 rounded-lg overflow-hidden" style={{ height: 500 }}>
            <div className="w-full h-full flex items-center justify-center bg-white">
              <SandCanvas />
            </div>
          </div>

          <div className="flex flex-col gap-4 h-[500px]">
            <PlayerList
              players={players}
              hostId={room.hostId}
              currentDrawerId={room.gameState.currentDrawerId}
              myPlayerId={myPlayer?.id}
              showScores
            />
            <div className="flex-1 min-h-0">
              <ChatBox
                messages={chatMessages}
                onSendMessage={onChat}
                disabled={isDrawer || !!hasGuessed}
                placeholder={hasGuessed ? 'You guessed it!' : 'Chat...'}
                closeGuessWarning={closeGuess}
              />
            </div>
          </div>
        </div>

        {/* Word reveal overlay */}
        <div className="mt-4 text-center">
          <div className="text-zinc-400">The word was</div>
          <div className="text-4xl font-bold text-green-400">{revealWord}</div>
          <div className="text-zinc-500 mt-2">Next round starting soon...</div>
        </div>
      </div>
    </div>
  );
}

// Create white grain pattern when no drawing is available
function createWhiteGrains(width: number, height: number) {
  const grains = [];
  const pixelSize = 4;
  const cols = Math.floor(width / pixelSize);
  const rows = Math.floor(height / pixelSize);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Only create grains for a sparse pattern
      if (Math.random() > 0.1) continue;

      const x = col * pixelSize;
      const startY = -pixelSize * (2 + Math.random() * 5);
      const rowDelay = row * 80 * 0.05;
      const scatter = Math.random() * 80 * 0.2;

      grains.push({
        x,
        y: startY,
        vy: 0.5,
        color: [0.9, 0.9, 0.9, 1.0] as [number, number, number, number],
        settled: false,
        active: false,
        delay: rowDelay + scatter,
      });
    }
  }

  return grains;
}
