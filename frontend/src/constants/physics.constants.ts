/**
 * Physics simulation constants
 * Consolidates physics-related values for sand simulation
 */

export const PHYSICS = {
  /** Default gravity acceleration */
  GRAVITY: 0.3,
  /** Maximum falling speed */
  TERMINAL_VELOCITY: 8,
  /** Delay between wave activations (ms) */
  WAVE_DELAY: 150,
  /** Number of rows per wave activation */
  ROWS_PER_WAVE: 4,
  /** Mouse interaction radius */
  INTERACTION_RADIUS: 40,
  /** Mouse interaction force strength */
  INTERACTION_STRENGTH: 2.5,
} as const;

/** Image-to-grain conversion constants */
export const IMAGE_PROCESSING = {
  /** Scatter multiplier for grain positioning */
  SCATTER_MULTIPLIER: 0.3,
  /** Minimum starting height above canvas */
  START_HEIGHT_MIN: 2,
  /** Random height range for starting position */
  START_HEIGHT_RANGE: 3,
  /** Maximum initial vertical velocity */
  MAX_START_VELOCITY: 0.5,
} as const;
