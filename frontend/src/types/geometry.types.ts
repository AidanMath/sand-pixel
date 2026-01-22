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

/** Create a Point2D from x, y values */
export function point(x: number, y: number): Point2D {
  return { x, y };
}

/** Calculate distance between two points */
export function distance(a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Linear interpolation between two points */
export function lerp(a: Point2D, b: Point2D, t: number): Point2D {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}
