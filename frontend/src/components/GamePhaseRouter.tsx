import { useState, useCallback, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { GameLobby } from './GameLobby';
import { DrawingCanvas } from './DrawingCanvas';
import { DrawingTools } from './DrawingTools';
import { PlayerList } from './PlayerList';
import { ChatBox } from './ChatBox';
import { WordSelector } from './WordSelector';
import { GameHeader } from './GameHeader';
import { ScoreBoard } from './ScoreBoard';
import { SandCanvas } from './SandCanvas';
import { drawingToRevealGrains } from '../utils/drawingToGrains';
import { useSandStore } from '../stores/sandStore';
import type { DrawStroke } from '../types/game.types';

export function GamePhaseRouter() {
  const {
    room,
    wordOptions,
    currentWordHint,
    currentWordLength,
    drawTime,
    revealDrawing,
    revealWord,
    closeGuess,
    roundEndData,
    gameOverData,
    chatMessages,
    getPlayerList,
    getMyPlayer,
    isDrawer,
    getPhase,
  } = useGameStore();

  const {
    selectWord,
    sendDrawStroke,
    submitDrawing,
    sendGuess,
    sendChat,
    setOnDrawStroke,
  } = useWebSocket();

  const { setGrains, setPlaying } = useSandStore();

  // Drawing state
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(8);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
  const [remoteStrokes, setRemoteStrokes] = useState<DrawStroke[]>([]);
  const [currentDrawingData, setCurrentDrawingData] = useState<string | null>(null);
  const [undoTrigger, setUndoTrigger] = useState(0);
  const [clearTrigger, setClearTrigger] = useState(0);

  const phase = getPhase();
  const myPlayer = getMyPlayer();
  const players = getPlayerList();
  const amDrawer = isDrawer();

  // Handle remote draw strokes
  useEffect(() => {
    setOnDrawStroke((stroke: DrawStroke) => {
      if (!amDrawer) {
        setRemoteStrokes((prev) => [...prev, stroke]);
      }
    });
  }, [amDrawer, setOnDrawStroke]);

  // Clear remote strokes on new round
  useEffect(() => {
    if (phase === 'WORD_SELECTION' || phase === 'LOBBY') {
      setRemoteStrokes([]);
    }
  }, [phase]);

  // Handle reveal phase - convert drawing to sand grains
  useEffect(() => {
    if (phase === 'REVEAL' && revealDrawing) {
      const loadReveal = async () => {
        try {
          const grains = await drawingToRevealGrains(
            revealDrawing,
            800,
            600
          );
          setGrains(grains);
          setPlaying(true);
        } catch (error) {
          console.error('Failed to convert drawing to grains:', error);
        }
      };
      loadReveal();
    }
  }, [phase, revealDrawing, setGrains, setPlaying]);

  const handleWordSelect = useCallback(
    (index: number) => {
      if (room) {
        selectWord(room.id, index);
      }
    },
    [room, selectWord]
  );

  const handleDrawStroke = useCallback(
    (stroke: DrawStroke) => {
      if (room && amDrawer) {
        sendDrawStroke(room.id, stroke);
      }
    },
    [room, amDrawer, sendDrawStroke]
  );

  const handleSubmitDrawing = useCallback(() => {
    if (room && currentDrawingData) {
      submitDrawing(room.id, currentDrawingData);
    }
  }, [room, currentDrawingData, submitDrawing]);

  const handleDrawingChange = useCallback((dataUrl: string) => {
    setCurrentDrawingData(dataUrl);
  }, []);

  const handleChat = useCallback(
    (text: string) => {
      if (room) {
        // If in guessing phase, treat as guess; otherwise as chat
        if (phase === 'DRAWING' || phase === 'REVEAL') {
          sendGuess(room.id, text);
        } else {
          sendChat(room.id, text);
        }
      }
    },
    [room, phase, sendGuess, sendChat]
  );

  const handleUndo = useCallback(() => {
    setUndoTrigger((prev) => prev + 1);
  }, []);

  const handleClear = useCallback(() => {
    setClearTrigger((prev) => prev + 1);
  }, []);

  // LOBBY phase - show lobby
  if (phase === 'LOBBY' || !room) {
    return <GameLobby />;
  }

  // COUNTDOWN phase
  if (phase === 'COUNTDOWN') {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">Get Ready!</h1>
          <p className="text-zinc-400 text-xl">Game starting soon...</p>
        </div>
      </div>
    );
  }

  // WORD_SELECTION phase - show word selector for drawer
  if (phase === 'WORD_SELECTION' && wordOptions && amDrawer) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <WordSelector words={wordOptions} onSelect={handleWordSelect} />
      </div>
    );
  }

  // WORD_SELECTION phase - waiting for drawer (non-drawer)
  if (phase === 'WORD_SELECTION') {
    const drawer = players.find((p) => p.id === room.gameState.currentDrawerId);
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

  // DRAWING phase
  if (phase === 'DRAWING') {
    const drawer = players.find((p) => p.id === room.gameState.currentDrawerId);
    const hasGuessed = myPlayer && room.gameState.correctGuessers?.includes(myPlayer.id);

    return (
      <div className="min-h-screen bg-zinc-900 text-white p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <GameHeader
            round={room.gameState.currentRound}
            totalRounds={room.gameState.totalRounds}
            wordHint={currentWordHint}
            wordLength={currentWordLength}
            drawTime={drawTime}
            isDrawer={amDrawer}
            currentWord={amDrawer ? room.gameState.currentWord || '' : undefined}
            drawerName={drawer?.name}
          />

          {/* Main game area */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Drawing tools (drawer only) */}
              {amDrawer && (
                <div className="lg:w-48">
                  <DrawingTools
                    brushColor={brushColor}
                    brushSize={brushSize}
                    tool={tool}
                    onColorChange={setBrushColor}
                    onSizeChange={setBrushSize}
                    onToolChange={setTool}
                    onUndo={handleUndo}
                    onClear={handleClear}
                  />
                  <button
                    onClick={handleSubmitDrawing}
                    className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                  >
                    Done Drawing
                  </button>
                </div>
              )}

              {/* Canvas */}
              <div className="flex-1">
                <DrawingCanvas
                  brushColor={brushColor}
                  brushSize={brushSize}
                  tool={tool}
                  onStroke={handleDrawStroke}
                  onDrawingChange={handleDrawingChange}
                  disabled={!amDrawer}
                  remoteStrokes={amDrawer ? [] : remoteStrokes}
                  undoTrigger={undoTrigger}
                  clearTrigger={clearTrigger}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-4 h-[600px]">
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
                  onSendMessage={handleChat}
                  disabled={amDrawer || !!hasGuessed}
                  placeholder={
                    amDrawer
                      ? "You're drawing!"
                      : hasGuessed
                      ? 'You guessed it!'
                      : 'Type your guess...'
                  }
                  closeGuessWarning={closeGuess}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // REVEAL phase - show sand animation
  if (phase === 'REVEAL') {
    const hasGuessed = myPlayer && room.gameState.correctGuessers?.includes(myPlayer.id);

    return (
      <div className="min-h-screen bg-zinc-900 text-white p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header with revealed word */}
          <div className="bg-zinc-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="text-zinc-400">
                Round {room.gameState.currentRound} of {room.gameState.totalRounds}
              </div>
              <div className="text-2xl font-bold text-green-400">
                {revealWord}
              </div>
            </div>
          </div>

          {/* Sand reveal */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
            <div className="bg-white rounded-lg overflow-hidden" style={{ height: 600 }}>
              <SandCanvas />
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-4 h-[600px]">
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
                  onSendMessage={handleChat}
                  disabled={amDrawer || !!hasGuessed}
                  placeholder={hasGuessed ? 'You guessed it!' : 'Still guessing?'}
                  closeGuessWarning={closeGuess}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RESULTS phase
  if (phase === 'RESULTS' && roundEndData) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <ScoreBoard
          scores={roundEndData.scores}
          word={roundEndData.word}
          showGuessStatus
        />
      </div>
    );
  }

  // GAME_OVER phase
  if (phase === 'GAME_OVER' && gameOverData) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <ScoreBoard
          scores={gameOverData.finalScores}
          title="Final Results"
          isGameOver
        />
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>
  );
}
