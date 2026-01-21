export interface SandGrain {
  x: number;
  y: number;
  vy: number;
  color: [number, number, number, number]; // RGBA normalized 0-1
  settled: boolean;
  active: boolean;
  delay: number;
}

export interface SimulationSettings {
  pixelSize: number;
  gravity: number;
  terminalVelocity: number;
  waveDelay: number;
  rowsPerWave: number;
  interactionRadius: number;
  interactionStrength: number;
}

export interface MouseState {
  x: number;
  y: number;
  velX: number;
  velY: number;
  isDown: boolean;
}

export const DEFAULT_SETTINGS: SimulationSettings = {
  pixelSize: 2,
  gravity: 0.3,
  terminalVelocity: 8,
  waveDelay: 150,
  rowsPerWave: 4,
  interactionRadius: 40,
  interactionStrength: 2.5,
};

// Default canvas dimensions (used for presets)
export const DEFAULT_CANVAS_WIDTH = 800;
export const DEFAULT_CANVAS_HEIGHT = 550;
