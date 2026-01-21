import { describe, it, expect, beforeEach } from 'vitest';
import { SandPhysics } from '../webgl/SandPhysics';
import type { SandGrain, MouseState } from '../types/sand.types';
import { DEFAULT_SETTINGS } from '../types/sand.types';

describe('SandPhysics', () => {
  let physics: SandPhysics;
  const defaultMouse: MouseState = {
    x: -1000,
    y: -1000,
    velX: 0,
    velY: 0,
    isDown: false,
  };

  beforeEach(() => {
    physics = new SandPhysics(DEFAULT_SETTINGS);
  });

  const createGrain = (overrides: Partial<SandGrain> = {}): SandGrain => ({
    x: 100,
    y: 0,
    vy: 0,
    color: [1, 0, 0, 1],
    settled: false,
    active: true,
    delay: 0,
    ...overrides,
  });

  it('initializes with grains', () => {
    const grains = [createGrain()];
    physics.initialize(grains, 800, 600);
    expect(physics.getGrains()).toHaveLength(1);
  });

  it('returns grains after update', () => {
    const grains = [createGrain({ delay: 0, active: true })];
    physics.initialize(grains, 800, 600);
    physics.update(defaultMouse);
    expect(physics.getGrains()).toHaveLength(1);
  });

  it('applies gravity to active grains', () => {
    const grain = createGrain({ delay: 0, active: true, y: 10 });
    physics.initialize([grain], 800, 600);

    const initialY = grain.y;
    physics.update(defaultMouse);

    // Grain should have moved down due to gravity
    expect(grain.y).toBeGreaterThan(initialY);
  });

  it('settles grains at bottom of canvas', () => {
    // Create grain near the bottom
    const pixelSize = DEFAULT_SETTINGS.pixelSize;
    const canvasHeight = 600;
    const maxRow = Math.ceil(canvasHeight / pixelSize) - 1;
    const bottomY = maxRow * pixelSize;

    const grain = createGrain({
      delay: 0,
      active: true,
      y: bottomY - pixelSize,
      vy: 5,
    });
    physics.initialize([grain], 800, canvasHeight);

    // Run several updates to let grain settle
    for (let i = 0; i < 10; i++) {
      physics.update(defaultMouse);
    }

    expect(grain.settled).toBe(true);
  });

  it('updates settings correctly', () => {
    physics.updateSettings({ gravity: 1.0 });
    // Settings should be updated - we can verify by checking behavior
    const grain = createGrain({ delay: 0, active: true, y: 10 });
    physics.initialize([grain], 800, 600);

    const initialY = grain.y;
    physics.update(defaultMouse);

    // With higher gravity, grain should fall faster
    expect(grain.y - initialY).toBeGreaterThan(DEFAULT_SETTINGS.gravity);
  });

  it('activates grains after their delay', () => {
    const grain = createGrain({ delay: 0, active: false });
    physics.initialize([grain], 800, 600);

    // Update should activate grain since delay is 0
    physics.update(defaultMouse);

    expect(grain.active).toBe(true);
  });

});
