/**
 * Shared geometric types used across the application
 * Consolidates point, dimension, and vector types to eliminate duplication
 */

/** 2D point in coordinate space */
export interface Point2D {
  x: number;
  y: number;
}

/** 2D velocity vector */
export interface Velocity2D {
  velX: number;
  velY: number;
}

/** Width and height dimensions */
export interface Dimensions {
  width: number;
  height: number;
}

/** Rectangle with position and size */
export interface BoundingBox extends Point2D, Dimensions {}

/** Point with velocity (for physics/input tracking) */
export interface PointWithVelocity extends Point2D, Velocity2D {}
