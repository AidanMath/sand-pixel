import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useCloseGuessEffect } from '../../hooks/useCloseGuessEffect';
import { GameLobby } from '../GameLobby';
import {
  CountdownPhase,
  WordSelectionPhase,
  DrawingPhase,
  RevealPhase,
  ResultsPhase,
  GameOverPhase,
} from './phases';
import type { DrawStroke } from '../../types/game.types';

export function GamePhaseRouter() {
  const {
    room,
    wordOptions,
    currentWordHint,
    currentWordLength,
    drawTime,
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

  // Drawing state
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(8);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
  const [remoteStrokes, setRemoteStrokes] = useState<DrawStroke[]>([]);
  const [undoTrigger, setUndoTrigger] = useState(0);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [capturedDrawing, setCapturedDrawing] = useState<string | null>(null);

  const phase = getPhase();
  const myPlayer = getMyPlayer();
  const players = getPlayerList();
  const amDrawer = isDrawer();

  // Handle close guess auto-clearing
  useCloseGuessEffect();

  // Handle remote draw strokes
  useEffect(() => {
    setOnDrawStroke((stroke: DrawStroke) => {
      if (!amDrawer) {
        setRemoteStrokes((prev) => [...prev, stroke]);
      }
    });
  }, [amDrawer, setOnDrawStroke]);

  // Clear strokes and captured drawing on new round
  useEffect(() => {
    if (phase === 'WORD_SELECTION' || phase === 'LOBBY') {
      setRemoteStrokes([]);
      setCapturedDrawing(null);
    }
  }, [phase]);

  const handleWordSelect = useCallback(
    (index: number) => {
      if (room) selectWord(room.id, index);
    },
    [room, selectWord]
  );

  const handleDrawStroke = useCallback(
    (stroke: DrawStroke) => {
      if (room && amDrawer) sendDrawStroke(room.id, stroke);
    },
    [room, amDrawer, sendDrawStroke]
  );

  const handleSubmitDrawing = useCallback(() => {
    if (room) {
      console.log('[GamePhaseRouter] Submitting drawing');
      submitDrawing(room.id);
    }
  }, [room, submitDrawing]);

  const handleChat = useCallback(
    (text: string) => {
      if (room) {
        if (phase === 'DRAWING' || phase === 'REVEAL') {
          sendGuess(room.id, text);
        } else {
          sendChat(room.id, text);
        }
      }
    },
    [room, phase, sendGuess, sendChat]
  );

  const handleUndo = useCallback(() => setUndoTrigger((prev) => prev + 1), []);
  const handleClear = useCallback(() => setClearTrigger((prev) => prev + 1), []);

  const handleDrawingChange = useCallback((dataUrl: string) => {
    setCapturedDrawing(dataUrl);
  }, []);

  // Route to appropriate phase component
  if (phase === 'LOBBY' || !room) {
    return <GameLobby />;
  }

  if (phase === 'COUNTDOWN') {
    return <CountdownPhase />;
  }

  if (phase === 'WORD_SELECTION') {
    const drawer = players.find((p) => p.id === room.gameState.currentDrawerId);
    return (
      <WordSelectionPhase
        isDrawer={amDrawer}
        wordOptions={wordOptions}
        drawer={drawer}
        onWordSelect={handleWordSelect}
      />
    );
  }

  if (phase === 'DRAWING') {
    const drawer = players.find((p) => p.id === room.gameState.currentDrawerId);
    return (
      <DrawingPhase
        room={room}
        players={players}
        myPlayer={myPlayer}
        isDrawer={amDrawer}
        drawer={drawer}
        currentWordHint={currentWordHint}
        currentWordLength={currentWordLength}
        drawTime={drawTime}
        chatMessages={chatMessages}
        closeGuess={closeGuess}
        brushColor={brushColor}
        brushSize={brushSize}
        tool={tool}
        remoteStrokes={remoteStrokes}
        undoTrigger={undoTrigger}
        clearTrigger={clearTrigger}
        onColorChange={setBrushColor}
        onSizeChange={setBrushSize}
        onToolChange={setTool}
        onUndo={handleUndo}
        onClear={handleClear}
        onStroke={handleDrawStroke}
        onSubmitDrawing={handleSubmitDrawing}
        onChat={handleChat}
        onDrawingChange={handleDrawingChange}
      />
    );
  }

  if (phase === 'REVEAL') {
    return (
      <RevealPhase
        room={room}
        players={players}
        myPlayer={myPlayer}
        isDrawer={amDrawer}
        revealWord={revealWord}
        chatMessages={chatMessages}
        closeGuess={closeGuess}
        onChat={handleChat}
        capturedDrawing={capturedDrawing}
      />
    );
  }

  if (phase === 'RESULTS' && roundEndData) {
    return <ResultsPhase roundEndData={roundEndData} />;
  }

  if (phase === 'GAME_OVER' && gameOverData) {
    return <GameOverPhase gameOverData={gameOverData} />;
  }

  // Fallback
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>
  );
}
