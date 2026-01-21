# Sand Pixel - Agent Context

## Project Overview
Sand Pixel is a WebGL-based falling sand simulation that converts images into interactive sand/pixel art. Users can upload images, which are converted into thousands of sand grains that fall and interact with physics. Users can interact with the sand using their mouse to push grains around.

## Tech Stack
- React + TypeScript
- Vite for bundling
- WebGL for rendering
- Zustand for state management
- Tailwind CSS

## Key Files

### Core Components
- `src/App.tsx` - Main app layout with header, canvas, and toolbars
- `src/components/SandCanvas.tsx` - Canvas component handling mouse/touch input and animation loop
- `src/components/FloatingToolbar.tsx` - Split into `LeftToolbar` (creation/editing) and `RightToolbar` (output/sharing)
- `src/components/ResizableContainer.tsx` - Container for the canvas

### Physics & Rendering
- `src/webgl/SandPhysics.ts` - **Core physics simulation** - grain movement, settling, gap filling, mouse interaction
- `src/webgl/SandRenderer.ts` - WebGL rendering of grains

### State & Types
- `src/stores/sandStore.ts` - Zustand store for grains, settings, mouse state, play/pause
- `src/types/sand.types.ts` - TypeScript types and default settings (DEFAULT_CANVAS_WIDTH=800, DEFAULT_CANVAS_HEIGHT=550)

### Utilities
- `src/utils/imageProcessing.ts` - Converts images to grain arrays, creates gradient presets
- `src/utils/canvasExport.ts` - Download/copy canvas as PNG

## Current State

### Features Implemented
1. **Image upload** - Converts images to sand grains with pixelSize=1 for max quality
2. **Draw mode** - Users can draw/add sand grains with a selected color
3. **Mouse interaction** - Moving mouse pushes settled sand grains
4. **Presets** - Gradient, wave, spiral, checkerboard patterns
5. **Export** - Download as PNG, copy to clipboard
6. **Video recording** - Record canvas as WebM
7. **Twitter share** - Share button
8. **Split toolbars** - Left toolbar (play/pause, reset, presets, draw, upload) and Right toolbar (settings, fullscreen, download, copy, record, share)

### Performance Optimizations Applied
1. **Mouse interaction spatial lookup** (KEPT) - Instead of iterating all ~100k grains, uses grid-based lookup to only check cells within interaction radius. Located in `SandPhysics.ts:processMouseInteraction()`

### Performance Optimizations Tried & Reverted
1. **Gap filling sampling** - Sampling 500-2000 grains instead of all grains caused visible rows/lines when interacting with sand. Must iterate all grains.
2. **Physics loop using fallingGrains Set** - Caused activation issues and visual problems
3. **Bounded collision resolution** - Not needed after resize simplification

### Resize Logic Simplification
The complex resize logic (`pushGrainsHorizontal`, `pushGrainsVertical`, `triggerVerticalFalling`, `pushGrainsFromWalls`) was **removed entirely** because:
- Canvas only changes size on reset or image upload (not during active simulation)
- No need for complex grain pushing/collision during resize
- `handleResize()` and `initialize()` now just update dimensions and rebuild grid

## Performance Bottlenecks (if still slow)

The main loops that iterate all grains every frame:
1. `update()` physics loop - iterates all grains for activation check and physics
2. `checkGapFilling()` - iterates all grains (50% random check) to find gaps

Potential future optimizations:
- WebGL compute shaders for physics
- Only iterate `fallingGrains` Set for physics (needs careful implementation)
- Reduce gap filling frequency

## Canvas Dimensions
- Default: 800x550
- Max for uploaded images: 1200x900
- Images use pixelSize=1 for maximum quality (creates more grains)

## Drawing Limits
- `SPAWN_THROTTLE_MS = 50` - Minimum ms between grain spawns when drawing
- `MAX_GRAINS = 200000` - Maximum total grains allowed

## Key Settings (from sand.types.ts)
```typescript
DEFAULT_SETTINGS = {
  pixelSize: 2,
  gravity: 0.3,
  terminalVelocity: 8,
  waveDelay: 150,
  rowsPerWave: 4,
  interactionRadius: 40,
  interactionStrength: 2.5,
}
```

## Recent Session Summary
1. Split toolbar into left/right panels
2. Fixed drawing crash with throttling and grain limits
3. Improved image quality (pixelSize=1, larger canvas)
4. Attempted physics optimizations - most reverted due to visual quality issues
5. Kept mouse interaction spatial lookup optimization
6. Removed complex resize logic (not needed)
