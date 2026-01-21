import type { SandGrain, SimulationSettings, MouseState } from '../types/sand.types';
import { DEFAULT_SETTINGS } from '../types/sand.types';

export class SandPhysics {
  private grains: SandGrain[] = [];
  private grid: (SandGrain | null)[][] = [];
  private cols = 0;
  private rows = 0;
  private settings: SimulationSettings;
  private startTime = 0;
  private fallingGrains: Set<SandGrain> = new Set();

  constructor(settings: SimulationSettings = DEFAULT_SETTINGS) {
    this.settings = settings;
    this.startTime = performance.now();
  }

  initialize(grains: SandGrain[], canvasWidth: number, canvasHeight: number): void {
    this.grains = grains;
    this.fallingGrains.clear();
    const { pixelSize } = this.settings;

    this.cols = Math.ceil(canvasWidth / pixelSize);
    this.rows = Math.ceil(canvasHeight / pixelSize);
    this.rebuildGrid();
    this.startTime = performance.now();
  }

  private rebuildGrid(): void {
    const { pixelSize } = this.settings;

    // Reuse existing grid arrays when possible, only recreate if dimensions changed
    if (this.grid.length !== this.cols) {
      this.grid = new Array(this.cols);
      for (let i = 0; i < this.cols; i++) {
        this.grid[i] = new Array(this.rows).fill(null);
      }
    } else {
      // Clear existing grid
      for (let i = 0; i < this.cols; i++) {
        if (this.grid[i].length !== this.rows) {
          this.grid[i] = new Array(this.rows).fill(null);
        } else {
          this.grid[i].fill(null);
        }
      }
    }

    // Collect grains that need collision resolution
    const collisionGrains: SandGrain[] = [];

    // Place settled grains - first pass places grains, collisions go to resolution
    for (const grain of this.grains) {
      if (!grain.active || !grain.settled) continue;

      const col = Math.floor(grain.x / pixelSize);
      const row = Math.floor(grain.y / pixelSize);

      if (this.inBounds(col, row)) {
        if (this.grid[col][row] === null) {
          this.grid[col][row] = grain;
        } else {
          // Collision - needs resolution
          collisionGrains.push(grain);
        }
      } else if (row < 0 && col >= 0 && col < this.cols) {
        // Grain is above the canvas (from compression), mark for falling
        grain.settled = false;
        grain.vy = 0.5;
        this.fallingGrains.add(grain);
      }
    }

    // Resolve collisions by finding empty spots - sideways first, then upward (liquid-like)
    for (const grain of collisionGrains) {
      const origCol = Math.floor(grain.x / pixelSize);
      const origRow = Math.floor(grain.y / pixelSize);
      let placed = false;

      // First: try to push sideways (left and right alternating)
      for (let dist = 1; dist < this.cols && !placed; dist++) {
        const leftCol = origCol - dist;
        const rightCol = origCol + dist;

        // Try left
        if (leftCol >= 0 && this.grid[leftCol][origRow] === null) {
          grain.x = leftCol * pixelSize;
          this.grid[leftCol][origRow] = grain;
          placed = true;
        }
        // Try right
        else if (rightCol < this.cols && this.grid[rightCol][origRow] === null) {
          grain.x = rightCol * pixelSize;
          this.grid[rightCol][origRow] = grain;
          placed = true;
        }
      }

      // Second: if no horizontal space, rise upward from current position
      if (!placed) {
        for (let row = origRow - 1; row >= 0 && !placed; row--) {
          // Try original column first, then spread sideways
          for (let dist = 0; dist < this.cols && !placed; dist++) {
            const leftCol = origCol - dist;
            const rightCol = origCol + dist;

            if (leftCol >= 0 && this.grid[leftCol][row] === null) {
              grain.x = leftCol * pixelSize;
              grain.y = row * pixelSize;
              this.grid[leftCol][row] = grain;
              placed = true;
            } else if (dist > 0 && rightCol < this.cols && this.grid[rightCol][row] === null) {
              grain.x = rightCol * pixelSize;
              grain.y = row * pixelSize;
              this.grid[rightCol][row] = grain;
              placed = true;
            }
          }
        }
      }

      // Keep grain settled even if not placed - it will get resolved next frame
      // This prevents grains from falling from the ceiling
    }
  }

  update(mouse: MouseState): void {
    if (this.cols === 0 || this.rows === 0) return;

    const currentTime = performance.now() - this.startTime;
    const { gravity, terminalVelocity, pixelSize } = this.settings;
    const maxX = (this.cols - 1) * pixelSize;
    const maxY = (this.rows - 1) * pixelSize;

    // Mouse interaction
    if (mouse.isDown || Math.abs(mouse.velX) > 0.5 || Math.abs(mouse.velY) > 0.5) {
      this.processMouseInteraction(mouse);
    }

    // Physics passes
    for (let pass = 0; pass < 2; pass++) {
      for (const grain of this.grains) {
        // Activate grain after delay
        if (!grain.active && currentTime >= grain.delay) {
          grain.active = true;
          this.fallingGrains.add(grain);
        }

        if (!grain.active || grain.settled) continue;

        // Clamp to bounds
        grain.x = Math.max(0, Math.min(maxX, grain.x));
        grain.y = Math.max(0, Math.min(maxY, grain.y));

        // Apply gravity on first pass
        if (pass === 0) {
          grain.vy = Math.min(grain.vy + gravity, terminalVelocity);
        }

        // Move grain
        const rowsToMove = pass === 0 ? Math.max(1, Math.floor(grain.vy)) : 1;
        this.moveGrain(grain, rowsToMove);
      }
    }

    this.checkGapFilling();
  }

  private moveGrain(grain: SandGrain, rowsToMove: number): void {
    const { pixelSize } = this.settings;
    const maxRow = this.rows - 1;

    for (let i = 0; i < rowsToMove; i++) {
      const col = Math.floor(grain.x / pixelSize);
      const row = Math.floor(grain.y / pixelSize);

      if (!this.inBounds(col, row)) {
        grain.x = Math.max(0, Math.min((this.cols - 1) * pixelSize, grain.x));
        continue;
      }

      // At bottom - settle
      if (row >= maxRow) {
        grain.y = maxRow * pixelSize;
        this.settleGrain(grain);
        return;
      }

      const nextRow = row + 1;

      // Try straight down
      if (this.isEmpty(col, nextRow)) {
        grain.y = nextRow * pixelSize;
        if (nextRow >= maxRow) {
          this.settleGrain(grain);
          return;
        }
        continue;
      }

      // Try diagonal
      const canLeft = col > 0 && this.isEmpty(col - 1, nextRow);
      const canRight = col < this.cols - 1 && this.isEmpty(col + 1, nextRow);

      if (canLeft || canRight) {
        const newCol = canLeft && canRight
          ? col + (Math.random() > 0.5 ? -1 : 1)
          : canLeft ? col - 1 : col + 1;
        grain.x = newCol * pixelSize;
        grain.y = nextRow * pixelSize;
      } else {
        // Try to find a gap nearby
        const gapCol = this.findGap(col, row);
        if (gapCol !== null) {
          grain.x = gapCol * pixelSize;
        } else {
          this.settleGrain(grain);
          return;
        }
      }
    }
  }

  private inBounds(col: number, row: number): boolean {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  private isEmpty(col: number, row: number): boolean {
    return this.inBounds(col, row) && this.grid[col][row] === null;
  }

  private settleGrain(grain: SandGrain): void {
    const { pixelSize } = this.settings;
    const col = Math.floor(grain.x / pixelSize);
    const row = Math.floor(grain.y / pixelSize);

    grain.settled = true;
    grain.vy = 0;
    this.fallingGrains.delete(grain);

    if (this.inBounds(col, row)) {
      this.grid[col][row] = grain;
    }
  }

  private findGap(col: number, row: number): number | null {
    // Look for gaps up to 5 cells away for better pooling
    for (let dist = 1; dist <= 5; dist++) {
      const leftEmpty = this.isEmpty(col - dist, row) && this.isEmpty(col - dist, row + 1);
      const rightEmpty = this.isEmpty(col + dist, row) && this.isEmpty(col + dist, row + 1);

      if (leftEmpty && rightEmpty) {
        return col + (Math.random() > 0.5 ? -dist : dist);
      }
      if (leftEmpty) return col - dist;
      if (rightEmpty) return col + dist;
    }
    return null;
  }

  private checkGapFilling(): void {
    const { pixelSize } = this.settings;

    for (const grain of this.grains) {
      if (!grain.settled || !grain.active) continue;

      // Check about 50% of grains each frame
      if (Math.random() > 0.5) continue;

      const col = Math.floor(grain.x / pixelSize);
      const row = Math.floor(grain.y / pixelSize);
      const belowRow = row + 1;

      if (!this.inBounds(col, row) || belowRow >= this.rows) continue;

      // Check for gaps below or diagonally
      const gapBelow = this.isEmpty(col, belowRow);
      const gapLeft = col > 0 && this.isEmpty(col - 1, belowRow);
      const gapRight = col < this.cols - 1 && this.isEmpty(col + 1, belowRow);

      // Count side neighbors for slight stickiness
      let sideSupport = 0;
      if (col > 0 && !this.isEmpty(col - 1, row)) sideSupport++;
      if (col < this.cols - 1 && !this.isEmpty(col + 1, row)) sideSupport++;

      // Light stickiness - grains with both side neighbors hold a bit longer
      const stickiness = sideSupport === 2 ? 0.3 : 0;

      const shouldMove = (gapBelow && Math.random() > stickiness) ||
        (gapLeft && Math.random() > 0.6) ||
        (gapRight && Math.random() > 0.6);

      if (shouldMove) {
        this.grid[col][row] = null;
        grain.settled = false;
        grain.vy = gapBelow ? 0.3 : 0.2;
        this.fallingGrains.add(grain);
      }
    }
  }

  private processMouseInteraction(mouse: MouseState): void {
    const { pixelSize, interactionRadius, interactionStrength } = this.settings;
    const mouseSpeed = Math.sqrt(mouse.velX ** 2 + mouse.velY ** 2);

    // Require some movement to affect sand
    if (mouseSpeed < 0.3) return;

    const normVelX = mouse.velX / mouseSpeed;
    const normVelY = mouse.velY / mouseSpeed;

    // Use grid-based spatial lookup instead of iterating all grains
    const mouseCol = Math.floor(mouse.x / pixelSize);
    const mouseRow = Math.floor(mouse.y / pixelSize);
    const radiusCells = Math.ceil(interactionRadius / pixelSize);

    const colMin = Math.max(0, mouseCol - radiusCells);
    const colMax = Math.min(this.cols - 1, mouseCol + radiusCells);
    const rowMin = Math.max(0, mouseRow - radiusCells);
    const rowMax = Math.min(this.rows - 1, mouseRow + radiusCells);

    for (let col = colMin; col <= colMax; col++) {
      for (let row = rowMin; row <= rowMax; row++) {
        const grain = this.grid[col]?.[row];
        if (!grain || !grain.settled || !grain.active) continue;

        // Calculate grain center in pixel coordinates
        const grainCenterX = grain.x + pixelSize / 2;
        const grainCenterY = grain.y + pixelSize / 2;

        const dx = grainCenterX - mouse.x;
        const dy = grainCenterY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= interactionRadius) continue;

        // Determine which side of the mouse path the grain is on
        const side = Math.sign(dx * normVelY - dy * normVelX) || 1;
        const strength = (1 - dist / interactionRadius) * interactionStrength * 0.5;

        // Push perpendicular to mouse direction + slight lift
        const pushX = Math.round(-normVelY * side * strength);
        const pushY = Math.round(normVelX * side * strength - 0.5);

        const newCol = Math.max(0, Math.min(this.cols - 1, col + pushX));
        const newRow = Math.max(0, Math.min(this.rows - 1, row + pushY));

        if (newCol !== col || newRow !== row) {
          this.grid[col][row] = null;
          grain.settled = false;
          grain.vy = 0.5;
          grain.x = newCol * pixelSize;
          grain.y = newRow * pixelSize;
          this.fallingGrains.add(grain);
        }
      }
    }
  }

  handleResize(canvasWidth: number, canvasHeight: number): void {
    const { pixelSize } = this.settings;
    const newCols = Math.ceil(canvasWidth / pixelSize);
    const newRows = Math.ceil(canvasHeight / pixelSize);

    if (newCols === this.cols && newRows === this.rows) return;
    if (newCols <= 0 || newRows <= 0) return;

    // Simple resize - just update dimensions and rebuild grid
    // Complex grain pushing removed since resize only happens on reset/image load
    this.cols = newCols;
    this.rows = newRows;
    this.resizeGridStructure(newCols, newRows);
    this.rebuildGrid();
  }

  private resizeGridStructure(newCols: number, newRows: number): void {
    const oldCols = this.grid.length;

    // Handle column changes
    if (newCols > oldCols) {
      // Add new columns
      for (let i = oldCols; i < newCols; i++) {
        this.grid[i] = new Array(newRows).fill(null);
      }
    } else if (newCols < oldCols) {
      // Remove excess columns
      this.grid.length = newCols;
    }

    // Handle row changes for each column
    for (let i = 0; i < newCols; i++) {
      if (!this.grid[i]) {
        this.grid[i] = new Array(newRows).fill(null);
      } else {
        const oldRows = this.grid[i].length;
        if (newRows > oldRows) {
          // Add new rows
          for (let j = oldRows; j < newRows; j++) {
            this.grid[i][j] = null;
          }
        } else if (newRows < oldRows) {
          // Remove excess rows
          this.grid[i].length = newRows;
        }
      }
    }
  }


  getGrains(): SandGrain[] {
    return this.grains;
  }

  updateSettings(settings: Partial<SimulationSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }
}
