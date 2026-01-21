import { create } from 'zustand';
import type { SandGrain, SimulationSettings, MouseState } from '../types/sand.types';
import { DEFAULT_SETTINGS, DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT } from '../types/sand.types';

interface SandState {
  // Grains
  grains: SandGrain[];
  setGrains: (grains: SandGrain[]) => void;

  // Canvas dimensions
  canvasWidth: number;
  canvasHeight: number;
  setCanvasSize: (width: number, height: number) => void;

  // Settings
  settings: SimulationSettings;
  updateSettings: (settings: Partial<SimulationSettings>) => void;

  // Mouse state
  mouse: MouseState;
  updateMouse: (mouse: Partial<MouseState>) => void;

  // UI state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  isPlaying: boolean;
  setPlaying: (playing: boolean) => void;

  // Draw mode (for interactive sand spawning)
  isDrawMode: boolean;
  setDrawMode: (drawing: boolean) => void;
  drawColor: [number, number, number, number];
  setDrawColor: (color: [number, number, number, number]) => void;
  addGrains: (newGrains: SandGrain[]) => void;
}

export const useSandStore = create<SandState>((set) => ({
  // Grains
  grains: [],
  setGrains: (grains) => set({ grains }),

  // Canvas dimensions
  canvasWidth: DEFAULT_CANVAS_WIDTH,
  canvasHeight: DEFAULT_CANVAS_HEIGHT,
  setCanvasSize: (width, height) => set({ canvasWidth: width, canvasHeight: height }),

  // Settings
  settings: DEFAULT_SETTINGS,
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  // Mouse
  mouse: {
    x: -1000,
    y: -1000,
    velX: 0,
    velY: 0,
    isDown: false,
  },
  updateMouse: (newMouse) =>
    set((state) => ({
      mouse: { ...state.mouse, ...newMouse },
    })),

  // UI state
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),

  isPlaying: true,
  setPlaying: (playing) => set({ isPlaying: playing }),

  // Draw mode
  isDrawMode: false,
  setDrawMode: (drawing) => set({ isDrawMode: drawing }),
  drawColor: [1.0, 0.8, 0.4, 1.0] as [number, number, number, number],
  setDrawColor: (color) => set({ drawColor: color }),
  addGrains: (newGrains) => set((state) => ({ grains: [...state.grains, ...newGrains] })),
}));
