import { useState, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { DrawingCanvas } from '../../DrawingCanvas';
import { DrawingTools } from '../../DrawingTools';
import { useCountdown } from '../../../hooks/useCountdown';
import type { DrawStroke } from '../../../types/game.types';

interface TelephoneDrawPhaseProps {
  prompt: string;
  promptType: 'word' | 'guess';
  drawTime: number;
  currentPlayerName: string;
  isMyTurn: boolean;
  remainingPlayers: number;
  onSubmitDrawing: (drawingBase64: string) => void;
}

export function TelephoneDrawPhase({
  prompt,
  promptType,
  drawTime,
  currentPlayerName,
  isMyTurn,
  remainingPlayers,
  onSubmitDrawing,
}: TelephoneDrawPhaseProps) {
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(8);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
  const [undoTrigger, setUndoTrigger] = useState(0);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const drawingDataRef = useRef<string | null>(null);

  const handleAutoSubmit = useCallback(() => {
    if (drawingDataRef.current && !hasSubmitted) {
      setHasSubmitted(true);
      onSubmitDrawing(drawingDataRef.current);
    }
  }, [hasSubmitted, onSubmitDrawing]);

  const { timeLeft, isLow } = useCountdown(drawTime, {
    enabled: isMyTurn && !hasSubmitted,
    onComplete: handleAutoSubmit,
  });

  const handleDrawingChange = useCallback((dataUrl: string) => {
    drawingDataRef.current = dataUrl;
  }, []);

  const handleSubmit = useCallback(() => {
    if (hasSubmitted || !drawingDataRef.current) return;
    handleAutoSubmit();
  }, [hasSubmitted, handleAutoSubmit]);

  const handleUndo = useCallback(() => setUndoTrigger((prev) => prev + 1), []);
  const handleClear = useCallback(() => setClearTrigger((prev) => prev + 1), []);

  // Dummy stroke handler (telephone mode doesn't broadcast strokes in real-time)
  const handleStroke = useCallback((_stroke: DrawStroke) => {
    // In telephone mode, we don't broadcast strokes - only the final drawing
  }, []);

  if (!isMyTurn) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white p-4 flex items-center justify-center">
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-800 rounded-lg p-8"
          >
            <div className="text-6xl mb-4">🎨</div>
            <div className="text-2xl font-bold mb-2">
              {currentPlayerName} is drawing...
            </div>
            <div className="text-zinc-400 mb-4">
              {remainingPlayers} player{remainingPlayers !== 1 ? 's' : ''} remaining in the chain
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-100" />
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-200" />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-zinc-800 rounded-lg p-4 mb-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-zinc-400 text-sm">
                {promptType === 'word' ? 'Draw this word:' : 'Draw what you see:'}
              </div>
              <div className="text-3xl font-bold text-amber-400">{prompt}</div>
            </div>
            <div className="text-right">
              <div className="text-zinc-400 text-sm">Time left</div>
              <div className={`text-3xl font-mono ${isLow ? 'text-red-400' : ''}`}>
                {timeLeft}s
              </div>
            </div>
          </div>
        </motion.div>

        {/* Drawing area */}
        <div className="flex flex-col lg:flex-row gap-4">
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
              onClick={handleSubmit}
              disabled={hasSubmitted}
              className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-zinc-600 text-white font-semibold rounded-lg transition"
            >
              {hasSubmitted ? 'Submitted!' : 'Done Drawing'}
            </button>
          </div>

          <div className="flex-1">
            <DrawingCanvas
              brushColor={brushColor}
              brushSize={brushSize}
              tool={tool}
              onStroke={handleStroke}
              onDrawingChange={handleDrawingChange}
              disabled={hasSubmitted}
              undoTrigger={undoTrigger}
              clearTrigger={clearTrigger}
            />
          </div>
        </div>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center text-zinc-400"
        >
          {remainingPlayers} player{remainingPlayers !== 1 ? 's' : ''} remaining in the chain
        </motion.div>
      </div>
    </div>
  );
}
