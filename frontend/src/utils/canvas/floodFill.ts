/**
 * Flood fill algorithm for canvas
 * Extracted from DrawingCanvas for reusability and testability
 */

import { cssToRGBA255 } from '../../types/color.types';

/**
 * Perform flood fill on a canvas context
 * @param ctx - Canvas 2D rendering context
 * @param startX - Starting X coordinate
 * @param startY - Starting Y coordinate
 * @param fillColor - CSS color string to fill with
 * @param tolerance - Color matching tolerance (0-255), default 10
 */
export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColor: string,
  tolerance: number = 10
): void {
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;

  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Parse fill color
  const fillRGBA = cssToRGBA255(fillColor);
  const [fillR, fillG, fillB] = fillRGBA;

  // Get target color at start position
  const startIdx = (startY * width + startX) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];

  // Don't fill if clicking on same color
  if (
    Math.abs(targetR - fillR) < tolerance &&
    Math.abs(targetG - fillG) < tolerance &&
    Math.abs(targetB - fillB) < tolerance
  ) {
    return;
  }

  // Color matching function with tolerance
  const colorMatch = (idx: number): boolean => {
    return (
      Math.abs(data[idx] - targetR) < tolerance &&
      Math.abs(data[idx + 1] - targetG) < tolerance &&
      Math.abs(data[idx + 2] - targetB) < tolerance
    );
  };

  // Set color at index
  const setColor = (idx: number): void => {
    data[idx] = fillR;
    data[idx + 1] = fillG;
    data[idx + 2] = fillB;
    data[idx + 3] = 255;
  };

  // Flood fill using stack-based approach
  const stack: Array<[number, number]> = [[startX, startY]];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const key = `${x},${y}`;

    // Skip if out of bounds or already visited
    if (x < 0 || x >= width || y < 0 || y >= height || visited.has(key)) {
      continue;
    }

    const idx = (y * width + x) * 4;

    // Skip if color doesn't match target
    if (!colorMatch(idx)) {
      continue;
    }

    visited.add(key);
    setColor(idx);

    // Add neighbors to stack
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  ctx.putImageData(imageData, 0, 0);
}
