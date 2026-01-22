/**
 * Canvas dimension constants
 * Consolidates canvas sizes used across drawing and sand simulation
 */

export const CANVAS = {
  /** Sand simulation canvas dimensions */
  SAND: {
    WIDTH: 800,
    HEIGHT: 550,
  },
  /** Drawing canvas dimensions */
  DRAWING: {
    WIDTH: 800,
    HEIGHT: 600,
  },
} as const;

/** Default pixel size for sand grains */
export const DEFAULT_PIXEL_SIZE = 2;
