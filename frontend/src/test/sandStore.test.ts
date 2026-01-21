import { describe, it, expect, beforeEach } from 'vitest';
import { useSandStore } from '../stores/sandStore';
import type { SandGrain } from '../types/sand.types';

describe('sandStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSandStore.setState({
      grains: [],
      isLoading: false,
      isPlaying: true,
      isDrawMode: false,
      drawColor: [1.0, 0.8, 0.4, 1.0],
      mouse: {
        x: -1000,
        y: -1000,
        velX: 0,
        velY: 0,
        isDown: false,
      },
    });
  });

  it('sets grains correctly', () => {
    const testGrains: SandGrain[] = [
      {
        x: 10,
        y: 20,
        vy: 1,
        color: [1, 0, 0, 1],
        settled: false,
        active: true,
        delay: 0,
      },
    ];

    useSandStore.getState().setGrains(testGrains);
    expect(useSandStore.getState().grains).toHaveLength(1);
    expect(useSandStore.getState().grains[0].x).toBe(10);
  });

  it('updates settings correctly', () => {
    useSandStore.getState().updateSettings({ pixelSize: 8 });
    expect(useSandStore.getState().settings.pixelSize).toBe(8);
  });

  it('updates mouse state correctly', () => {
    useSandStore.getState().updateMouse({ x: 100, y: 200 });
    const mouse = useSandStore.getState().mouse;
    expect(mouse.x).toBe(100);
    expect(mouse.y).toBe(200);
  });

  it('toggles playing state', () => {
    expect(useSandStore.getState().isPlaying).toBe(true);
    useSandStore.getState().setPlaying(false);
    expect(useSandStore.getState().isPlaying).toBe(false);
  });

  it('sets loading state correctly', () => {
    expect(useSandStore.getState().isLoading).toBe(false);
    useSandStore.getState().setLoading(true);
    expect(useSandStore.getState().isLoading).toBe(true);
  });

  it('toggles draw mode', () => {
    expect(useSandStore.getState().isDrawMode).toBe(false);
    useSandStore.getState().setDrawMode(true);
    expect(useSandStore.getState().isDrawMode).toBe(true);
  });

  it('sets draw color', () => {
    const newColor: [number, number, number, number] = [0.5, 0.3, 0.8, 1.0];
    useSandStore.getState().setDrawColor(newColor);
    expect(useSandStore.getState().drawColor).toEqual(newColor);
  });

  it('adds grains to existing grains', () => {
    const initialGrains: SandGrain[] = [
      { x: 10, y: 20, vy: 1, color: [1, 0, 0, 1], settled: false, active: true, delay: 0 },
    ];
    useSandStore.getState().setGrains(initialGrains);

    const newGrains: SandGrain[] = [
      { x: 30, y: 40, vy: 0.5, color: [0, 1, 0, 1], settled: false, active: true, delay: 0 },
    ];
    useSandStore.getState().addGrains(newGrains);

    const allGrains = useSandStore.getState().grains;
    expect(allGrains).toHaveLength(2);
    expect(allGrains[0].x).toBe(10);
    expect(allGrains[1].x).toBe(30);
  });
});
