import { useEffect, useRef, useCallback } from 'react';
import { SandRenderer } from '../webgl/SandRenderer';
import { SandPhysics } from '../webgl/SandPhysics';
import { useSandStore } from '../stores/sandStore';
import type { SandGrain } from '../types/sand.types';

export function SandCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<SandRenderer | null>(null);
  const physicsRef = useRef<SandPhysics | null>(null);
  const animationRef = useRef<number>(0);
  const lastMouseRef = useRef({ x: -1000, y: -1000 });
  const lastDrawRef = useRef({ x: -1000, y: -1000 });

  const {
    grains,
    settings,
    mouse,
    updateMouse,
    isPlaying,
    canvasWidth,
    canvasHeight,
    isDrawMode,
    drawColor,
    addGrains,
  } = useSandStore();

  // Helper to render current state
  const renderFrame = useCallback(() => {
    if (!physicsRef.current || !rendererRef.current) return;
    rendererRef.current.updateGrains(physicsRef.current.getGrains());
    rendererRef.current.render();
  }, []);

  // Initialize WebGL
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      rendererRef.current = new SandRenderer(canvasRef.current, settings);
      physicsRef.current = new SandPhysics(settings);
    } catch (error) {
      console.error('Failed to initialize WebGL:', error);
    }

    return () => {
      rendererRef.current?.dispose();
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Track previous grains to detect changes
  const prevGrainsRef = useRef<typeof grains | null>(null);

  // Update renderer when canvas dimensions change
  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.resize(canvasWidth, canvasHeight);
  }, [canvasWidth, canvasHeight]);

  // Handle grain changes (new set from reset/upload)
  useEffect(() => {
    if (!physicsRef.current || !rendererRef.current) return;

    const grainsChanged = prevGrainsRef.current !== grains;

    if (grainsChanged) {
      physicsRef.current.initialize(grains, canvasWidth, canvasHeight);
      prevGrainsRef.current = grains;
      renderFrame();
    }
  }, [grains, canvasWidth, canvasHeight, renderFrame]);

  // Update settings
  useEffect(() => {
    rendererRef.current?.updateSettings(settings);
    physicsRef.current?.updateSettings(settings);
  }, [settings]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(animationRef.current);
      return;
    }

    const animate = () => {
      if (physicsRef.current && rendererRef.current) {
        physicsRef.current.update(mouse);
        renderFrame();
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, mouse, renderFrame]);

  // Pointer position helper - scales from display coordinates to simulation coordinates
  const getPointerPos = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    // Scale from display size to internal simulation size
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, [canvasWidth, canvasHeight]);

  // Throttle for drawing to prevent performance issues
  const lastSpawnTimeRef = useRef(0);
  const SPAWN_THROTTLE_MS = 50; // Minimum ms between spawns
  const MAX_GRAINS = 200000; // Maximum grains allowed

  // Spawn grains at position (for draw mode)
  const spawnGrainsAt = useCallback((x: number, y: number) => {
    // Throttle spawning
    const now = Date.now();
    if (now - lastSpawnTimeRef.current < SPAWN_THROTTLE_MS) {
      return;
    }
    lastSpawnTimeRef.current = now;

    // Check grain limit
    const currentGrainCount = useSandStore.getState().grains.length;
    if (currentGrainCount >= MAX_GRAINS) {
      return;
    }

    const { pixelSize } = settings;
    const brushSize = 3; // Number of grains per click/drag
    const newGrains: SandGrain[] = [];

    for (let i = 0; i < brushSize; i++) {
      // Add slight randomness to position for natural look
      const offsetX = (Math.random() - 0.5) * pixelSize * 2;
      const offsetY = (Math.random() - 0.5) * pixelSize * 2;

      // Snap to grid
      const grainX = Math.floor((x + offsetX) / pixelSize) * pixelSize;
      const grainY = Math.floor((y + offsetY) / pixelSize) * pixelSize;

      // Add slight color variation
      const colorVariation = 0.1;
      const color: [number, number, number, number] = [
        Math.max(0, Math.min(1, drawColor[0] + (Math.random() - 0.5) * colorVariation)),
        Math.max(0, Math.min(1, drawColor[1] + (Math.random() - 0.5) * colorVariation)),
        Math.max(0, Math.min(1, drawColor[2] + (Math.random() - 0.5) * colorVariation)),
        1.0,
      ];

      newGrains.push({
        x: grainX,
        y: grainY,
        vy: Math.random() * 0.5,
        color,
        settled: false,
        active: true,
        delay: 0,
      });
    }

    addGrains(newGrains);
  }, [settings, drawColor, addGrains]);

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getPointerPos(e.clientX, e.clientY);
    if (!pos) return;

    const velX = pos.x - lastMouseRef.current.x;
    const velY = pos.y - lastMouseRef.current.y;
    lastMouseRef.current = pos;

    // Draw mode: spawn grains while dragging
    if (isDrawMode && mouse.isDown) {
      const dist = Math.sqrt(
        Math.pow(pos.x - lastDrawRef.current.x, 2) +
        Math.pow(pos.y - lastDrawRef.current.y, 2)
      );
      // Spawn grains if moved enough distance
      if (dist > settings.pixelSize) {
        spawnGrainsAt(pos.x, pos.y);
        lastDrawRef.current = pos;
      }
    }

    updateMouse({ ...pos, velX, velY });
  }, [getPointerPos, updateMouse, isDrawMode, mouse.isDown, spawnGrainsAt, settings.pixelSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    updateMouse({ isDown: true });

    // Draw mode: spawn grains on click
    if (isDrawMode) {
      const pos = getPointerPos(e.clientX, e.clientY);
      if (pos) {
        spawnGrainsAt(pos.x, pos.y);
        lastDrawRef.current = pos;
      }
    }
  }, [updateMouse, isDrawMode, getPointerPos, spawnGrainsAt]);

  const handleMouseUp = useCallback(() => updateMouse({ isDown: false }), [updateMouse]);

  const handleMouseLeave = useCallback(() => {
    updateMouse({ x: -1000, y: -1000, velX: 0, velY: 0, isDown: false });
    lastMouseRef.current = { x: -1000, y: -1000 };
  }, [updateMouse]);

  // Touch handlers
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;

    const pos = getPointerPos(touch.clientX, touch.clientY);
    if (!pos) return;

    const velX = pos.x - lastMouseRef.current.x;
    const velY = pos.y - lastMouseRef.current.y;
    lastMouseRef.current = pos;

    // Draw mode: spawn grains while dragging
    if (isDrawMode) {
      const dist = Math.sqrt(
        Math.pow(pos.x - lastDrawRef.current.x, 2) +
        Math.pow(pos.y - lastDrawRef.current.y, 2)
      );
      if (dist > settings.pixelSize) {
        spawnGrainsAt(pos.x, pos.y);
        lastDrawRef.current = pos;
      }
    }

    updateMouse({ ...pos, velX, velY, isDown: true });
  }, [getPointerPos, updateMouse, isDrawMode, spawnGrainsAt, settings.pixelSize]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    const pos = getPointerPos(touch.clientX, touch.clientY);
    if (!pos) return;

    lastMouseRef.current = pos;

    // Draw mode: spawn grains on touch
    if (isDrawMode) {
      spawnGrainsAt(pos.x, pos.y);
      lastDrawRef.current = pos;
    }

    updateMouse({ ...pos, velX: 0, velY: 0, isDown: true });
  }, [getPointerPos, updateMouse, isDrawMode, spawnGrainsAt]);

  const handleTouchEnd = useCallback(() => {
    updateMouse({ isDown: false, velX: 0, velY: 0 });
  }, [updateMouse]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className={`sand-canvas block ${isDrawMode ? 'draw-mode' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    />
  );
}
