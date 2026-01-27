import { PlayerList } from '../../PlayerList';
import { ChatBox } from '../../ChatBox';
import { ReactionPicker, ReactionOverlay } from '../../ui';
import { useCountdown } from '../../../hooks/useCountdown';
import type { Room, Player, ChatMessage, Reaction } from '../../../types/game.types';

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
  activeReactions: Reaction[];
  onReact: (emoji: string) => void;
}

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
  activeReactions,
  onReact,
}: RevealPhaseProps) {
  const hasGuessed = myPlayer && room.gameState.correctGuessers?.includes(myPlayer.id);
  const revealTime = room.settings.revealTime || 30;
  const { timeLeft } = useCountdown(revealTime);

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
          {/* Drawing display */}
          <div className="bg-zinc-800 rounded-lg overflow-hidden relative" style={{ height: 500 }}>
            <div className="w-full h-full flex items-center justify-center bg-white">
              {capturedDrawing ? (
                <img
                  src={capturedDrawing}
                  alt="Drawing"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-zinc-400">No drawing available</div>
              )}
            </div>
            <ReactionOverlay reactions={activeReactions} />
          </div>

          <div className="flex flex-col gap-4 h-[500px]">
            <PlayerList
              players={players}
              hostId={room.hostId}
              currentDrawerId={room.gameState.currentDrawerId}
              currentDrawerIds={room.gameState.currentDrawerIds || []}
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
            <ReactionPicker onReact={onReact} />
          </div>
        </div>

        {/* Word reveal overlay */}
        <div className="mt-4 text-center">
          <div className="text-zinc-400">The word was</div>
          <div className="text-4xl font-bold text-green-400">{revealWord}</div>
          <div className="text-zinc-500 mt-2">Next round in {timeLeft}s</div>
        </div>
      </div>
    </div>
  );
}
