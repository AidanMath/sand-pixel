/**
 * Shared color types and utilities
 * Consolidates color handling across sand simulation and drawing
 */

/** RGBA color with values normalized to 0-1 range */
export type RGBANormalized = [number, number, number, number];

/** RGBA color with values in 0-255 range */
export type RGBA255 = [number, number, number, number];

/** CSS color string (hex, rgb, named color, etc.) */
export type CSSColor = string;

/** Convert CSS color string to RGBA 0-255 values */
export function cssToRGBA255(css: CSSColor): RGBA255 {
  // Create temporary element to leverage browser's color parsing
  const tempDiv = document.createElement('div');
  tempDiv.style.color = css;
  document.body.appendChild(tempDiv);
  const computedColor = getComputedStyle(tempDiv).color;
  document.body.removeChild(tempDiv);

  const rgbMatch = computedColor.match(/\d+/g);
  if (!rgbMatch || rgbMatch.length < 3) {
    return [0, 0, 0, 255];
  }

  return [
    parseInt(rgbMatch[0], 10),
    parseInt(rgbMatch[1], 10),
    parseInt(rgbMatch[2], 10),
    rgbMatch[3] ? parseInt(rgbMatch[3], 10) : 255,
  ];
}

/** Normalize RGBA from 0-255 to 0-1 range */
export function normalizeRGBA(rgba: RGBA255): RGBANormalized {
  return [rgba[0] / 255, rgba[1] / 255, rgba[2] / 255, rgba[3] / 255];
}

/** Denormalize RGBA from 0-1 to 0-255 range */
export function denormalizeRGBA(rgba: RGBANormalized): RGBA255 {
  return [
    Math.round(rgba[0] * 255),
    Math.round(rgba[1] * 255),
    Math.round(rgba[2] * 255),
    Math.round(rgba[3] * 255),
  ];
}

/** Add slight color variation for natural look */
export function varyColor(
  color: RGBANormalized,
  variation: number = 0.1
): RGBANormalized {
  return [
    Math.max(0, Math.min(1, color[0] + (Math.random() - 0.5) * variation)),
    Math.max(0, Math.min(1, color[1] + (Math.random() - 0.5) * variation)),
    Math.max(0, Math.min(1, color[2] + (Math.random() - 0.5) * variation)),
    color[3],
  ];
}

/** Check if a color is valid CSS color */
export function isValidCSSColor(color: string): boolean {
  const s = new Option().style;
  s.color = color;
  return s.color !== '';
}
