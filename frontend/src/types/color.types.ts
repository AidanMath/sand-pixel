/**
 * Shared color types and utilities
 */

/** RGBA color with values in 0-255 range */
export type RGBA255 = [number, number, number, number];

/** CSS color string (hex, rgb, named color, etc.) */
export type CSSColor = string;

/** Convert CSS color string to RGBA 0-255 values */
export function cssToRGBA255(css: CSSColor): RGBA255 {
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
