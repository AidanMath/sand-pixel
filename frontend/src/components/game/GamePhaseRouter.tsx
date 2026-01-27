import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useGameStore } from '../../stores/gameStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useCloseGuessEffect } from '../../hooks/useCloseGuessEffect';
import { GameLobby } from '../lobby/GameLobby';
import {
  CountdownPhase,
  WordSelectionPhase,
  DrawingPhase,
  RevealPhase,
  ResultsPhase,
  GameOverPhase,
  VotingPhase,
  TelephoneDrawPhase,
  TelephoneGuessPhase,
  TelephoneRevealPhase,
} from './phases';
import { pageTransition, pageTransitionProps } from '../../utils/animations';
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
    activeReactions,
    votingDrawings,
    votingTime,
    hasVoted,
    votingResults,
    telephoneCurrentPlayerId,
    telephoneCurrentPlayerName,
    telephonePrompt,
    telephonePromptType,
    telephoneTime,
    telephoneRemainingPlayers,
    telephoneChain,
    telephoneOriginalWord,
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
    sendReaction,
    submitVote,
    submitTelephoneDrawing,
    submitTelephoneGuess,
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

  const handleReaction = useCallback(
    (emoji: string) => {
      if (room) sendReaction(room.id, emoji);
    },
    [room, sendReaction]
  );

  const handleVote = useCallback(
    (drawerId: string) => {
      if (room) submitVote(room.id, drawerId);
    },
    [room, submitVote]
  );

  const handleTelephoneDrawingSubmit = useCallback(
    (drawingBase64: string) => {
      if (room) submitTelephoneDrawing(room.id, drawingBase64);
    },
    [room, submitTelephoneDrawing]
  );

  const handleTelephoneGuessSubmit = useCallback(
    (guess: string) => {
      if (room) submitTelephoneGuess(room.id, guess);
    },
    [room, submitTelephoneGuess]
  );

  // Determine content based on phase
  const renderPhase = () => {
    if (phase === 'LOBBY' || !room) {
      return <GameLobby key="lobby" />;
    }

    if (phase === 'COUNTDOWN') {
      return <CountdownPhase key="countdown" />;
    }

    if (phase === 'WORD_SELECTION') {
      const drawer = players.find((p) => p.id === room.gameState.currentDrawerId);
      return (
        <WordSelectionPhase
          key="word-selection"
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
          key="drawing"
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
          activeReactions={activeReactions}
          onReact={handleReaction}
        />
      );
    }

    if (phase === 'REVEAL') {
      return (
        <RevealPhase
          key="reveal"
          room={room}
          players={players}
          myPlayer={myPlayer}
          isDrawer={amDrawer}
          revealWord={revealWord}
          chatMessages={chatMessages}
          closeGuess={closeGuess}
          onChat={handleChat}
          capturedDrawing={capturedDrawing}
          activeReactions={activeReactions}
          onReact={handleReaction}
        />
      );
    }

    if (phase === 'RESULTS' && roundEndData) {
      return <ResultsPhase key="results" roundEndData={roundEndData} />;
    }

    if (phase === 'GAME_OVER' && gameOverData) {
      return <GameOverPhase key="game-over" gameOverData={gameOverData} />;
    }

    if (phase === 'VOTING') {
      return (
        <VotingPhase
          key="voting"
          drawings={votingDrawings}
          votingTime={votingTime}
          hasVoted={hasVoted}
          votingResults={votingResults}
          myPlayerId={myPlayer?.id || null}
          onVote={handleVote}
        />
      );
    }

    if (phase === 'TELEPHONE_DRAW') {
      const isMyTurn = myPlayer?.id === telephoneCurrentPlayerId;
      return (
        <TelephoneDrawPhase
          key="telephone-draw"
          prompt={telephonePrompt || ''}
          promptType={telephonePromptType === 'word' ? 'word' : 'guess'}
          drawTime={telephoneTime}
          currentPlayerName={telephoneCurrentPlayerName || ''}
          isMyTurn={isMyTurn}
          remainingPlayers={telephoneRemainingPlayers}
          onSubmitDrawing={handleTelephoneDrawingSubmit}
        />
      );
    }

    if (phase === 'TELEPHONE_GUESS') {
      const isMyTurn = myPlayer?.id === telephoneCurrentPlayerId;
      return (
        <TelephoneGuessPhase
          key="telephone-guess"
          prompt={telephonePrompt || ''}
          guessTime={telephoneTime}
          currentPlayerName={telephoneCurrentPlayerName || ''}
          isMyTurn={isMyTurn}
          remainingPlayers={telephoneRemainingPlayers}
          onSubmitGuess={handleTelephoneGuessSubmit}
        />
      );
    }

    if (phase === 'TELEPHONE_REVEAL' && telephoneChain) {
      return (
        <TelephoneRevealPhase
          key="telephone-reveal"
          originalWord={telephoneOriginalWord || ''}
          chain={telephoneChain}
        />
      );
    }

    // Fallback
    return (
      <div key="loading" className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        variants={pageTransition}
        {...pageTransitionProps}
        className="min-h-screen"
      >
        {renderPhase()}
      </motion.div>
    </AnimatePresence>
  );
}
