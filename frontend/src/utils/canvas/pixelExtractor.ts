/**
 * Pixel extraction utilities for image processing
 * Consolidates duplicated logic from imageProcessing.ts and drawingToGrains.ts
 */

import type { Dimensions } from '../../types/geometry.types';

/** Result of extracting scaled pixels from an image */
export interface PixelExtractionResult {
  /** Raw pixel data (RGBA values) */
  pixels: Uint8ClampedArray;
  /** Number of columns in the grid */
  cols: number;
  /** Number of rows in the grid */
  rows: number;
  /** Horizontal offset to center image */
  offsetX: number;
  /** Vertical offset to center image */
  offsetY: number;
  /** Actual width after scaling */
  targetWidth: number;
  /** Actual height after scaling */
  targetHeight: number;
}

/**
 * Calculate target dimensions while maintaining aspect ratio
 */
export function calculateScaledDimensions(
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number
): Dimensions & { offsetX: number; offsetY: number } {
  const imgAspect = imageWidth / imageHeight;
  const canvasAspect = canvasWidth / canvasHeight;

  const targetWidth = imgAspect > canvasAspect ? canvasWidth : canvasHeight * imgAspect;
  const targetHeight = imgAspect > canvasAspect ? canvasWidth / imgAspect : canvasHeight;

  return {
    width: targetWidth,
    height: targetHeight,
    offsetX: (canvasWidth - targetWidth) / 2,
    offsetY: (canvasHeight - targetHeight) / 2,
  };
}

/**
 * Extract scaled pixel data from an image
 * @param image - Source image element
 * @param canvasWidth - Target canvas width
 * @param canvasHeight - Target canvas height
 * @param pixelSize - Size of each "pixel" in the grid
 */
export function extractScaledPixels(
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  pixelSize: number
): PixelExtractionResult {
  // Calculate scaled dimensions
  const scaled = calculateScaledDimensions(
    image.width,
    image.height,
    canvasWidth,
    canvasHeight
  );

  // Calculate grid dimensions
  const cols = Math.floor(scaled.width / pixelSize);
  const rows = Math.floor(scaled.height / pixelSize);

  // Create temporary canvas to extract pixel data
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');

  if (!tempCtx) {
    throw new Error('Failed to get 2D context for pixel extraction');
  }

  // Set temp canvas to pixel grid size and draw scaled image
  tempCanvas.width = cols;
  tempCanvas.height = rows;
  tempCtx.drawImage(image, 0, 0, cols, rows);

  // Get pixel data
  const imageData = tempCtx.getImageData(0, 0, cols, rows);

  return {
    pixels: imageData.data,
    cols,
    rows,
    offsetX: scaled.offsetX,
    offsetY: scaled.offsetY,
    targetWidth: scaled.width,
    targetHeight: scaled.height,
  };
}

/**
 * Get RGBA values at a specific grid position
 */
export function getPixelAt(
  pixels: Uint8ClampedArray,
  cols: number,
  row: number,
  col: number
): [number, number, number, number] {
  const i = (row * cols + col) * 4;
  return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
}

/**
 * Check if a pixel is visible (alpha > threshold)
 */
export function isPixelVisible(
  pixels: Uint8ClampedArray,
  cols: number,
  row: number,
  col: number,
  alphaThreshold: number = 25 // ~10% of 255
): boolean {
  const i = (row * cols + col) * 4;
  return pixels[i + 3] > alphaThreshold;
}
