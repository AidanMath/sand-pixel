import { useRef, useEffect, useState, useCallback } from 'react';
import type { DrawStroke } from '../types/game.types';

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  brushColor: string;
  brushSize: number;
  tool: 'brush' | 'eraser' | 'fill';
  onStroke?: (stroke: DrawStroke) => void;
  onDrawingChange?: (dataUrl: string) => void;
  disabled?: boolean;
  remoteStrokes?: DrawStroke[];
  undoTrigger?: number;
  clearTrigger?: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export function DrawingCanvas({
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT,
  brushColor,
  brushSize,
  tool,
  onStroke,
  onDrawingChange,
  disabled = false,
  remoteStrokes = [],
  undoTrigger = 0,
  clearTrigger = 0,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);
  const undoStackRef = useRef<ImageData[]>([]);
  const processedStrokesRef = useRef(0);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctxRef.current = ctx;
    saveToUndoStack();
  }, [width, height]);

  // Process remote strokes
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx || remoteStrokes.length <= processedStrokesRef.current) return;

    const newStrokes = remoteStrokes.slice(processedStrokesRef.current);
    newStrokes.forEach((stroke) => {
      applyStroke(ctx, stroke);
    });
    processedStrokesRef.current = remoteStrokes.length;

    // Notify about drawing changes from remote strokes
    notifyDrawingChange();
  }, [remoteStrokes]);

  const saveToUndoStack = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStackRef.current.push(imageData);

    // Limit undo stack to 10 items
    if (undoStackRef.current.length > 10) {
      undoStackRef.current.shift();
    }
  }, []);

  const applyStroke = (ctx: CanvasRenderingContext2D, stroke: DrawStroke) => {
    if (stroke.fill) {
      // Fill operation
      const point = stroke.points[0];
      if (point) {
        floodFill(ctx, Math.floor(point.x), Math.floor(point.y), stroke.color);
      }
      return;
    }

    ctx.strokeStyle = stroke.eraser ? '#FFFFFF' : stroke.color;
    ctx.lineWidth = stroke.brushSize;

    if (stroke.points.length === 1) {
      // Single point (dot)
      ctx.beginPath();
      ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = stroke.eraser ? '#FFFFFF' : stroke.color;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  };

  const floodFill = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    fillColor: string
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Parse fill color
    const tempDiv = document.createElement('div');
    tempDiv.style.color = fillColor;
    document.body.appendChild(tempDiv);
    const computedColor = getComputedStyle(tempDiv).color;
    document.body.removeChild(tempDiv);
    const rgbMatch = computedColor.match(/\d+/g);
    if (!rgbMatch) return;
    const fillR = parseInt(rgbMatch[0]);
    const fillG = parseInt(rgbMatch[1]);
    const fillB = parseInt(rgbMatch[2]);

    // Get target color
    const startIdx = (startY * canvas.width + startX) * 4;
    const targetR = data[startIdx];
    const targetG = data[startIdx + 1];
    const targetB = data[startIdx + 2];

    // Don't fill if clicking on same color
    if (targetR === fillR && targetG === fillG && targetB === fillB) return;

    const colorMatch = (idx: number) => {
      return (
        Math.abs(data[idx] - targetR) < 10 &&
        Math.abs(data[idx + 1] - targetG) < 10 &&
        Math.abs(data[idx + 2] - targetB) < 10
      );
    };

    const setColor = (idx: number) => {
      data[idx] = fillR;
      data[idx + 1] = fillG;
      data[idx + 2] = fillB;
      data[idx + 3] = 255;
    };

    const stack: Array<[number, number]> = [[startX, startY]];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;

      if (
        x < 0 ||
        x >= canvas.width ||
        y < 0 ||
        y >= canvas.height ||
        visited.has(key)
      ) {
        continue;
      }

      const idx = (y * canvas.width + x) * 4;
      if (!colorMatch(idx)) continue;

      visited.add(key);
      setColor(idx);

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();

    const point = getCanvasPoint(e);
    if (!point) return;

    const ctx = ctxRef.current;
    if (!ctx) return;

    if (tool === 'fill') {
      saveToUndoStack();
      const stroke: DrawStroke = {
        type: 'end',
        points: [point],
        color: brushColor,
        brushSize: 1,
        eraser: false,
        fill: true,
      };
      floodFill(ctx, Math.floor(point.x), Math.floor(point.y), brushColor);
      onStroke?.(stroke);
      notifyDrawingChange();
      return;
    }

    setIsDrawing(true);
    setCurrentPath([point]);
    saveToUndoStack();

    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : brushColor;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);

    // Draw a dot for single clicks
    ctx.beginPath();
    ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? '#FFFFFF' : brushColor;
    ctx.fill();

    onStroke?.({
      type: 'start',
      points: [point],
      color: brushColor,
      brushSize,
      eraser: tool === 'eraser',
      fill: false,
    });
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();

    const point = getCanvasPoint(e);
    if (!point) return;

    const ctx = ctxRef.current;
    if (!ctx) return;

    setCurrentPath((prev) => [...prev, point]);

    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);

    onStroke?.({
      type: 'move',
      points: [point],
      color: brushColor,
      brushSize,
      eraser: tool === 'eraser',
      fill: false,
    });
  };

  const handleEnd = () => {
    if (!isDrawing) return;

    setIsDrawing(false);

    if (currentPath.length > 0) {
      onStroke?.({
        type: 'end',
        points: currentPath,
        color: brushColor,
        brushSize,
        eraser: tool === 'eraser',
        fill: false,
      });
    }

    setCurrentPath([]);
    notifyDrawingChange();
  };

  const notifyDrawingChange = () => {
    const canvas = canvasRef.current;
    if (canvas && onDrawingChange) {
      onDrawingChange(canvas.toDataURL('image/png'));
    }
  };

  const undo = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas || undoStackRef.current.length <= 1) return;

    undoStackRef.current.pop(); // Remove current state
    const previousState = undoStackRef.current[undoStackRef.current.length - 1];
    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
      notifyDrawingChange();
    }
  }, []);

  const clear = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    saveToUndoStack();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    notifyDrawingChange();
  }, [saveToUndoStack]);

  const getDrawingData = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  }, []);

  // Expose methods via ref
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      (canvas as any).undo = undo;
      (canvas as any).clear = clear;
      (canvas as any).getDrawingData = getDrawingData;
    }
  }, [undo, clear, getDrawingData]);

  // Respond to undo trigger from parent
  useEffect(() => {
    if (undoTrigger > 0) {
      undo();
    }
  }, [undoTrigger, undo]);

  // Respond to clear trigger from parent
  useEffect(() => {
    if (clearTrigger > 0) {
      clear();
    }
  }, [clearTrigger, clear]);

  return (
    <div
      ref={containerRef}
      className="relative bg-white rounded-lg overflow-hidden shadow-lg"
      style={{ aspectRatio: `${width}/${height}` }}
    >
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${disabled ? 'cursor-not-allowed' : tool === 'fill' ? 'cursor-crosshair' : 'cursor-crosshair'}`}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
      {disabled && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <span className="text-gray-600 font-medium">Waiting for drawer...</span>
        </div>
      )}
    </div>
  );
}
