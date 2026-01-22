/**
 * Sand grain creation utilities
 * Consolidates grain creation logic for reusability
 */

import type { SandGrain, SimulationSettings } from '../../types/sand.types';
import type { RGBANormalized } from '../../types/color.types';
import { IMAGE_PROCESSING } from '../../constants/physics.constants';

const {
  SCATTER_MULTIPLIER,
  START_HEIGHT_MIN,
  START_HEIGHT_RANGE,
  MAX_START_VELOCITY,
} = IMAGE_PROCESSING;

/**
 * Create a single sand grain at a position
 */
export function createGrain(
  x: number,
  y: number,
  color: RGBANormalized,
  options: Partial<{
    vy: number;
    settled: boolean;
    active: boolean;
    delay: number;
  }> = {}
): SandGrain {
  return {
    x,
    y,
    vy: options.vy ?? 0,
    color,
    settled: options.settled ?? false,
    active: options.active ?? true,
    delay: options.delay ?? 0,
  };
}

/**
 * Create grain for image reveal animation
 * Grains fall row by row (bottom first) to build the image from the ground up
 */
export function createImageGrain(
  x: number,
  color: RGBANormalized,
  row: number,
  totalRows: number,
  settings: SimulationSettings
): SandGrain {
  const { pixelSize, waveDelay } = settings;

  // Bottom rows fall first so image builds from ground up
  const rowFromBottom = totalRows - 1 - row;

  // Delay based on row - bottom rows activate first
  const rowDelay = rowFromBottom * waveDelay * 0.08;

  // Tiny scatter within each row to avoid perfectly rigid horizontal lines
  const scatter = Math.random() * waveDelay * SCATTER_MULTIPLIER;

  const delay = rowDelay + scatter;

  // All grains start from the same height band for uniform falling
  const startY = -pixelSize * (START_HEIGHT_MIN + Math.random() * START_HEIGHT_RANGE);

  return {
    x,
    y: startY,
    vy: MAX_START_VELOCITY,
    color,
    settled: false,
    active: false,
    delay,
  };
}

/**
 * Create grain for top-to-bottom reveal (drawing reveal)
 * Top rows fall first, opposite of normal image reveal
 */
export function createRevealGrain(
  x: number,
  color: RGBANormalized,
  row: number,
  settings: Pick<SimulationSettings, 'pixelSize' | 'waveDelay'>
): SandGrain {
  const { pixelSize, waveDelay } = settings;

  // TOP-TO-BOTTOM reveal: top rows fall first
  // Row 0 has the smallest delay, last row has the largest
  const rowDelay = row * waveDelay * 0.05;
  const scatter = Math.random() * waveDelay * 0.2;
  const delay = rowDelay + scatter;

  // Start from above the canvas
  const startY = -pixelSize * (START_HEIGHT_MIN + Math.random() * (START_HEIGHT_RANGE + 2));

  return {
    x,
    y: startY,
    vy: 0.5,
    color,
    settled: false,
    active: false,
    delay,
  };
}

/**
 * Create white grain for fallback patterns
 */
export function createWhiteGrain(
  x: number,
  row: number,
  pixelSize: number = 4,
  waveDelay: number = 80
): SandGrain {
  const startY = -pixelSize * (2 + Math.random() * 5);
  const rowDelay = row * waveDelay * 0.05;
  const scatter = Math.random() * waveDelay * 0.2;

  return {
    x,
    y: startY,
    vy: 0.5,
    color: [0.9, 0.9, 0.9, 1.0] as RGBANormalized,
    settled: false,
    active: false,
    delay: rowDelay + scatter,
  };
}
