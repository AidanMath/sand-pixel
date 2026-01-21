import type { SandGrain, SimulationSettings } from '../types/sand.types';
import { DEFAULT_SETTINGS } from '../types/sand.types';
import { loadImage, processImageToGrains } from './imageProcessing';

/**
 * Convert a base64 PNG drawing to sand grains for the reveal animation.
 * Uses the existing image processing pipeline with settings optimized for drawings.
 */
export async function drawingToGrains(
  base64DataUrl: string,
  canvasWidth: number,
  canvasHeight: number,
  settings?: Partial<SimulationSettings>
): Promise<SandGrain[]> {
  // Settings optimized for drawings - smaller pixels for detail, faster reveal
  const revealSettings: SimulationSettings = {
    ...DEFAULT_SETTINGS,
    pixelSize: 1, // Maximum detail for drawings
    waveDelay: 100, // Faster wave for quicker reveal
    ...settings,
  };

  // Load the base64 image
  const image = await loadImage(base64DataUrl);

  // Convert to grains using existing pipeline
  const grains = processImageToGrains(image, canvasWidth, canvasHeight, revealSettings);

  return grains;
}

/**
 * Create reveal grains with top-to-bottom falling effect.
 * This modifies the delay so top rows fall first (opposite of normal image reveal).
 */
export async function drawingToRevealGrains(
  base64DataUrl: string,
  canvasWidth: number,
  canvasHeight: number,
  settings?: Partial<SimulationSettings>
): Promise<SandGrain[]> {
  const revealSettings: SimulationSettings = {
    ...DEFAULT_SETTINGS,
    pixelSize: 2, // Slightly larger pixels for performance
    waveDelay: 80,
    ...settings,
  };

  const image = await loadImage(base64DataUrl);

  // Create temporary canvas to extract pixel data
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) {
    throw new Error('Failed to get 2D context');
  }

  const { pixelSize, waveDelay } = revealSettings;

  // Calculate target dimensions
  const imgAspect = image.width / image.height;
  const canvasAspect = canvasWidth / canvasHeight;

  const targetWidth = imgAspect > canvasAspect ? canvasWidth : canvasHeight * imgAspect;
  const targetHeight = imgAspect > canvasAspect ? canvasWidth / imgAspect : canvasHeight;

  const cols = Math.floor(targetWidth / pixelSize);
  const rows = Math.floor(targetHeight / pixelSize);

  tempCanvas.width = cols;
  tempCanvas.height = rows;
  tempCtx.drawImage(image, 0, 0, cols, rows);

  const { data: pixels } = tempCtx.getImageData(0, 0, cols, rows);

  // Center horizontally
  const offsetX = (canvasWidth - cols * pixelSize) / 2;

  const grains: SandGrain[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = (row * cols + col) * 4;
      const a = pixels[i + 3] / 255;

      if (a < 0.1) continue;

      const x = offsetX + col * pixelSize;
      const color: [number, number, number, number] = [
        pixels[i] / 255,
        pixels[i + 1] / 255,
        pixels[i + 2] / 255,
        a,
      ];

      // TOP-TO-BOTTOM reveal: top rows fall first
      // Row 0 has the smallest delay, last row has the largest
      const rowDelay = row * waveDelay * 0.05;
      const scatter = Math.random() * waveDelay * 0.2;
      const delay = rowDelay + scatter;

      // Start from above the canvas
      const startY = -pixelSize * (2 + Math.random() * 5);

      grains.push({
        x,
        y: startY,
        vy: 0.5,
        color,
        settled: false,
        active: false,
        delay,
      });
    }
  }

  return grains;
}
