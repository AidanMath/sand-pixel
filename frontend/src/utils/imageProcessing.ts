import type { SandGrain, SimulationSettings } from '../types/sand.types';
import { DEFAULT_SETTINGS } from '../types/sand.types';

// Constants for image processing (preserve structure)
const IMAGE_SCATTER_MULTIPLIER = 0.3;
const START_HEIGHT_MIN = 2;
const IMAGE_START_HEIGHT_RANGE = 3;
const IMAGE_MAX_START_VELOCITY = 0.5;

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Helper to create an animated grain for images with minimal mixing.
 * Grains fall row by row (bottom first) to build the image from the ground up.
 * Each grain falls straight down to preserve its column position.
 */
function createImageGrain(
  x: number,
  _y: number,
  color: [number, number, number, number],
  row: number,
  rows: number,
  _col: number,
  _cols: number,
  settings: SimulationSettings
): SandGrain {
  const { pixelSize, waveDelay } = settings;

  // Bottom rows fall first so image builds from ground up
  const rowFromBottom = rows - 1 - row;

  // Delay based on row - bottom rows activate first
  // Use a tighter timing so the whole image falls quickly but in order
  const rowDelay = rowFromBottom * waveDelay * 0.08;

  // Tiny scatter within each row to avoid perfectly rigid horizontal lines
  const scatter = Math.random() * waveDelay * IMAGE_SCATTER_MULTIPLIER;

  const delay = rowDelay + scatter;

  // All grains start from the same height band for uniform falling
  const startY = -pixelSize * (START_HEIGHT_MIN + Math.random() * IMAGE_START_HEIGHT_RANGE);

  // Uniform low velocity for controlled, even falling
  const startVy = IMAGE_MAX_START_VELOCITY;

  return {
    x,
    y: startY,
    vy: startVy,
    color,
    settled: false,
    active: false,
    delay,
  };
}

export function processImageToGrains(
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  settings: SimulationSettings = DEFAULT_SETTINGS
): SandGrain[] {
  const { pixelSize } = settings;

  // Create temporary canvas to extract pixel data
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) {
    throw new Error('Failed to get 2D context for image processing');
  }

  // Calculate target dimensions to fit canvas while maintaining aspect ratio
  const imgAspect = image.width / image.height;
  const canvasAspect = canvasWidth / canvasHeight;

  const targetWidth = imgAspect > canvasAspect ? canvasWidth : canvasHeight * imgAspect;
  const targetHeight = imgAspect > canvasAspect ? canvasWidth / imgAspect : canvasHeight;

  // Calculate grid dimensions
  const cols = Math.floor(targetWidth / pixelSize);
  const rows = Math.floor(targetHeight / pixelSize);

  // Set temp canvas to pixel count and draw scaled image
  tempCanvas.width = cols;
  tempCanvas.height = rows;
  tempCtx.drawImage(image, 0, 0, cols, rows);

  // Get pixel data
  const { data: pixels } = tempCtx.getImageData(0, 0, cols, rows);

  // Calculate offset - center horizontally
  const offsetX = (canvasWidth - cols * pixelSize) / 2;

  // Create grains
  const grains: SandGrain[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = (row * cols + col) * 4;
      const a = pixels[i + 3] / 255;

      // Skip transparent pixels
      if (a < 0.1) continue;

      const x = offsetX + col * pixelSize;
      const y = row * pixelSize;
      const color: [number, number, number, number] = [
        pixels[i] / 255,
        pixels[i + 1] / 255,
        pixels[i + 2] / 255,
        a,
      ];

      grains.push(createImageGrain(x, y, color, row, rows, col, cols, settings));
    }
  }

  return grains;
}
