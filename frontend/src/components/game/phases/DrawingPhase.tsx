import { DrawingCanvas } from '../../DrawingCanvas';
import { DrawingTools } from '../../DrawingTools';
import { PlayerList } from '../../PlayerList';
import { ChatBox } from '../../ChatBox';
import { GameHeader } from '../../GameHeader';
import { ReactionPicker, ReactionOverlay } from '../../ui';
import type { Room, Player, ChatMessage, DrawStroke, Reaction } from '../../../types/game.types';

interface DrawingPhaseProps {
  room: Room;
  players: Player[];
  myPlayer: Player | null;
  isDrawer: boolean;
  drawer: Player | undefined;
  currentWordHint: string;
  currentWordLength: number;
  drawTime: number;
  chatMessages: ChatMessage[];
  closeGuess: boolean;
  brushColor: string;
  brushSize: number;
  tool: 'brush' | 'eraser' | 'fill';
  remoteStrokes: DrawStroke[];
  undoTrigger: number;
  clearTrigger: number;
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  onToolChange: (tool: 'brush' | 'eraser' | 'fill') => void;
  onUndo: () => void;
  onClear: () => void;
  onStroke: (stroke: DrawStroke) => void;
  onSubmitDrawing: () => void;
  onChat: (text: string) => void;
  onDrawingChange?: (dataUrl: string) => void;
  activeReactions: Reaction[];
  onReact: (emoji: string) => void;
}

export function DrawingPhase({
  room,
  players,
  myPlayer,
  isDrawer,
  drawer,
  currentWordHint,
  currentWordLength,
  drawTime,
  chatMessages,
  closeGuess,
  brushColor,
  brushSize,
  tool,
  remoteStrokes,
  undoTrigger,
  clearTrigger,
  onColorChange,
  onSizeChange,
  onToolChange,
  onUndo,
  onClear,
  onStroke,
  onSubmitDrawing,
  onChat,
  onDrawingChange,
  activeReactions,
  onReact,
}: DrawingPhaseProps) {
  const hasGuessed = myPlayer && room.gameState.correctGuessers?.includes(myPlayer.id);

  // In collaborative mode, drawers should also receive other drawers' strokes
  const isCollaborativeMode = room.settings.gameMode === 'COLLABORATIVE';
  const shouldReceiveRemoteStrokes = !isDrawer || isCollaborativeMode;

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <GameHeader
          round={room.gameState.currentRound}
          totalRounds={room.gameState.totalRounds}
          wordHint={currentWordHint}
          wordLength={currentWordLength}
          drawTime={drawTime}
          isDrawer={isDrawer}
          currentWord={isDrawer ? room.gameState.currentWord || '' : undefined}
          drawerName={drawer?.name}
        />

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {isDrawer && (
              <div className="lg:w-48">
                <DrawingTools
                  brushColor={brushColor}
                  brushSize={brushSize}
                  tool={tool}
                  onColorChange={onColorChange}
                  onSizeChange={onSizeChange}
                  onToolChange={onToolChange}
                  onUndo={onUndo}
                  onClear={onClear}
                />
                <button
                  onClick={onSubmitDrawing}
                  className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                >
                  Done Drawing
                </button>
              </div>
            )}

            <div className="flex-1 relative">
              <DrawingCanvas
                brushColor={brushColor}
                brushSize={brushSize}
                tool={tool}
                onStroke={onStroke}
                onDrawingChange={onDrawingChange}
                disabled={!isDrawer}
                remoteStrokes={shouldReceiveRemoteStrokes ? remoteStrokes : []}
                undoTrigger={undoTrigger}
                clearTrigger={clearTrigger}
              />
              <ReactionOverlay reactions={activeReactions} />
            </div>
          </div>

          <div className="flex flex-col gap-4 h-[600px]">
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
                placeholder={
                  isDrawer
                    ? "You're drawing!"
                    : hasGuessed
                    ? 'You guessed it!'
                    : 'Type your guess...'
                }
                closeGuessWarning={closeGuess}
              />
            </div>
            <ReactionPicker onReact={onReact} />
          </div>
        </div>
      </div>
    </div>
  );
}
