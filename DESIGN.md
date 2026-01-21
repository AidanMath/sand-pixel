# Sand Pixel - System Design Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Component Descriptions](#component-descriptions)
4. [Data Flow](#data-flow)
5. [Sequence Diagrams](#sequence-diagrams)
6. [Class Diagrams](#class-diagrams)
7. [State Diagrams](#state-diagrams)
8. [Technical Decisions](#technical-decisions)

---

## System Overview

Sand Pixel is a full-stack web application that transforms images into interactive falling sand animations. Users can upload images, watch them convert to pixelated sand that falls and settles realistically, interact with the sand using mouse movements, and share their creations.

### Key Features
- **Image-to-Sand Conversion**: Upload any image and convert it to colored sand particles
- **WebGL Rendering**: GPU-accelerated rendering for smooth 60fps animations with 100k+ particles
- **Physics Simulation**: Realistic sand physics including gravity, collision, and gap-filling
- **Mouse Interaction**: Push and part sand by moving the cursor
- **Save & Share**: Persist creations and share via URL

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SAND PIXEL SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                           FRONTEND (React + WebGL)                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │   App.tsx    │  │ ImageUpload  │  │  SandCanvas  │  │  Controls  │ │ │
│  │  │   (Layout)   │  │  Component   │  │  Component   │  │  Component │ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │ │
│  │         │                 │                 │                 │        │ │
│  │         └─────────────────┴────────┬────────┴─────────────────┘        │ │
│  │                                    │                                    │ │
│  │                           ┌────────▼────────┐                          │ │
│  │                           │   Zustand Store  │                          │ │
│  │                           │   (sandStore)    │                          │ │
│  │                           └────────┬────────┘                          │ │
│  │         ┌──────────────────────────┼──────────────────────────┐        │ │
│  │         │                          │                          │        │ │
│  │  ┌──────▼──────┐           ┌───────▼───────┐          ┌───────▼──────┐│ │
│  │  │ SandPhysics │           │ SandRenderer  │          │   Image      ││ │
│  │  │  (CPU Sim)  │           │   (WebGL 2)   │          │  Processing  ││ │
│  │  └─────────────┘           └───────────────┘          └──────────────┘│ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│                                      │ HTTP/REST                             │
│                                      ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        BACKEND (Spring Boot)                            │ │
│  │  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐ │ │
│  │  │  ImageController │    │CreationController│    │   CorsConfig     │ │ │
│  │  │  /api/process    │    │  /api/creations  │    │   (Security)     │ │ │
│  │  └────────┬─────────┘    └────────┬─────────┘    └──────────────────┘ │ │
│  │           │                       │                                    │ │
│  │  ┌────────▼─────────┐    ┌────────▼─────────┐                         │ │
│  │  │ ImageProcessing  │    │ CreationStorage  │                         │ │
│  │  │    Service       │    │     Service      │                         │ │
│  │  └──────────────────┘    └────────┬─────────┘                         │ │
│  │                                   │                                    │ │
│  │                          ┌────────▼─────────┐                         │ │
│  │                          │  In-Memory Store │                         │ │
│  │                          │  (ConcurrentMap) │                         │ │
│  │                          └──────────────────┘                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Descriptions

### Frontend Components

#### 1. App.tsx
**Purpose**: Main application layout and initialization
**Responsibilities**:
- Arranges UI components (Header, Canvas, Controls, Upload)
- Loads demo gradient on initial mount
- Manages overall page structure

#### 2. SandCanvas.tsx
**Purpose**: WebGL canvas wrapper and event handling
**Responsibilities**:
- Manages canvas element and resize events
- Captures mouse/touch input for interaction
- Orchestrates animation loop (requestAnimationFrame)
- Bridges React with WebGL renderer and physics engine

#### 3. ImageUpload.tsx
**Purpose**: File upload handling with drag-and-drop
**Responsibilities**:
- Handles file selection (click) and drag-and-drop
- Validates file types (images only)
- Triggers image processing pipeline
- Provides visual feedback during upload

#### 4. Controls.tsx
**Purpose**: Settings UI with sliders
**Responsibilities**:
- Exposes simulation parameters (gravity, pixel size, etc.)
- Play/pause simulation control
- Reset and clear functions
- Displays grain count

#### 5. SandRenderer (WebGL)
**Purpose**: GPU-accelerated particle rendering
**Responsibilities**:
- Compiles and manages GLSL shaders
- Uses instanced rendering for efficiency
- Updates GPU buffers with grain data
- Renders colored squares for each grain

#### 6. SandPhysics (CPU)
**Purpose**: Physics simulation engine
**Responsibilities**:
- Applies gravity to active grains
- Handles collision detection via spatial grid
- Implements diagonal flow (sand spreading)
- Gap-filling behavior (sand falls into holes)
- Mouse interaction (pushing grains)

### Backend Components

#### 1. ImageController
**Purpose**: Image upload and processing endpoint
**Responsibilities**:
- Accepts multipart file uploads
- Validates image types and sizes
- Delegates to ImageProcessingService

#### 2. CreationController
**Purpose**: Save/load/share creation endpoints
**Responsibilities**:
- CRUD operations for creations
- Generates shareable URLs
- Lists recent creations

#### 3. ImageProcessingService
**Purpose**: Server-side image-to-grain conversion
**Responsibilities**:
- Resizes images to fit constraints
- Extracts pixel color data
- Calculates grain positions and delays

#### 4. CreationStorageService
**Purpose**: In-memory creation storage
**Responsibilities**:
- Stores/retrieves creations by ID
- Manages storage limits (max 1000)
- Auto-cleanup of old creations

---

## Data Flow

### Image Upload Flow

```
┌──────────┐     ┌─────────────┐     ┌───────────────┐     ┌─────────────┐
│  User    │────▶│ ImageUpload │────▶│  loadImage()  │────▶│ processImage│
│ drops    │     │  Component  │     │    (async)    │     │  ToGrains() │
│ image    │     └─────────────┘     └───────────────┘     └──────┬──────┘
└──────────┘                                                       │
                                                                   ▼
┌──────────┐     ┌─────────────┐     ┌───────────────┐     ┌─────────────┐
│ Canvas   │◀────│ SandPhysics │◀────│  Zustand      │◀────│ SandGrain[] │
│ renders  │     │ initialized │     │  setGrains()  │     │   array     │
│ grains   │     └─────────────┘     └───────────────┘     └─────────────┘
└──────────┘
```

### Animation Loop Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ANIMATION LOOP (60fps)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────┐                                                       │
│  │requestAnimation│                                                      │
│  │    Frame()    │                                                       │
│  └───────┬───────┘                                                       │
│          │                                                               │
│          ▼                                                               │
│  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐         │
│  │ SandPhysics   │────▶│    Apply      │────▶│   Collision   │         │
│  │   .update()   │     │   Gravity     │     │   Detection   │         │
│  └───────────────┘     └───────────────┘     └───────┬───────┘         │
│                                                       │                  │
│                                                       ▼                  │
│  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐         │
│  │ SandRenderer  │◀────│    Update     │◀────│   Gap Fill    │         │
│  │   .render()   │     │   Positions   │     │   + Settle    │         │
│  └───────┬───────┘     └───────────────┘     └───────────────┘         │
│          │                                                               │
│          ▼                                                               │
│  ┌───────────────┐                                                       │
│  │  GPU draws    │                                                       │
│  │  all grains   │                                                       │
│  └───────────────┘                                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Sequence Diagrams

### 1. Image Upload Sequence

```
┌──────┐          ┌───────────┐       ┌──────────────┐      ┌─────────┐      ┌──────────┐
│ User │          │ImageUpload│       │imageProcessing│      │sandStore│      │SandCanvas│
└──┬───┘          └─────┬─────┘       └──────┬───────┘      └────┬────┘      └────┬─────┘
   │                    │                    │                   │                 │
   │  Drop image file   │                    │                   │                 │
   │───────────────────▶│                    │                   │                 │
   │                    │                    │                   │                 │
   │                    │ setLoading(true)   │                   │                 │
   │                    │───────────────────────────────────────▶│                 │
   │                    │                    │                   │                 │
   │                    │ createObjectURL()  │                   │                 │
   │                    │────────┐           │                   │                 │
   │                    │        │           │                   │                 │
   │                    │◀───────┘           │                   │                 │
   │                    │                    │                   │                 │
   │                    │ loadImage(url)     │                   │                 │
   │                    │───────────────────▶│                   │                 │
   │                    │                    │                   │                 │
   │                    │     HTMLImageElement                   │                 │
   │                    │◀───────────────────│                   │                 │
   │                    │                    │                   │                 │
   │                    │ processImageToGrains()                 │                 │
   │                    │───────────────────▶│                   │                 │
   │                    │                    │                   │                 │
   │                    │    SandGrain[]     │                   │                 │
   │                    │◀───────────────────│                   │                 │
   │                    │                    │                   │                 │
   │                    │ setGrains(grains)  │                   │                 │
   │                    │───────────────────────────────────────▶│                 │
   │                    │                    │                   │                 │
   │                    │                    │                   │  onGrainsChange │
   │                    │                    │                   │────────────────▶│
   │                    │                    │                   │                 │
   │                    │ setLoading(false)  │                   │                 │
   │                    │───────────────────────────────────────▶│                 │
   │                    │                    │                   │                 │
   │  See animation     │                    │                   │                 │
   │◀═══════════════════════════════════════════════════════════════════════════════
   │                    │                    │                   │                 │
```

### 2. Save Creation Sequence

```
┌──────┐        ┌────────┐        ┌──────────┐       ┌──────────────┐     ┌─────────────┐
│ User │        │Controls│        │ Frontend │       │CreationController│   │StorageService│
└──┬───┘        └───┬────┘        └────┬─────┘       └───────┬──────┘     └──────┬──────┘
   │                │                  │                     │                   │
   │ Click Save     │                  │                     │                   │
   │───────────────▶│                  │                     │                   │
   │                │                  │                     │                   │
   │                │ getGrains()      │                     │                   │
   │                │─────────────────▶│                     │                   │
   │                │                  │                     │                   │
   │                │   SandGrain[]    │                     │                   │
   │                │◀─────────────────│                     │                   │
   │                │                  │                     │                   │
   │                │        POST /api/creations             │                   │
   │                │───────────────────────────────────────▶│                   │
   │                │                  │                     │                   │
   │                │                  │                     │ save(request)     │
   │                │                  │                     │──────────────────▶│
   │                │                  │                     │                   │
   │                │                  │                     │   SavedCreation   │
   │                │                  │                     │◀──────────────────│
   │                │                  │                     │                   │
   │                │    { id, shareUrl, message }           │                   │
   │                │◀───────────────────────────────────────│                   │
   │                │                  │                     │                   │
   │ Show share URL │                  │                     │                   │
   │◀───────────────│                  │                     │                   │
   │                │                  │                     │                   │
```

### 3. Physics Update Sequence

```
┌────────────┐     ┌───────────────┐     ┌──────────────┐     ┌────────────┐
│ Animation  │     │  SandPhysics  │     │   Grain[]    │     │   Grid     │
│   Loop     │     │               │     │              │     │  (2D Map)  │
└─────┬──────┘     └───────┬───────┘     └──────┬───────┘     └─────┬──────┘
      │                    │                    │                    │
      │ update(mouse)      │                    │                    │
      │───────────────────▶│                    │                    │
      │                    │                    │                    │
      │                    │  For each grain:   │                    │
      │                    │────────────────────│                    │
      │                    │                    │                    │
      │                    │    Check delay     │                    │
      │                    │───────────────────▶│                    │
      │                    │                    │                    │
      │                    │    if active:      │                    │
      │                    │    Apply gravity   │                    │
      │                    │───────────────────▶│                    │
      │                    │                    │                    │
      │                    │    moveGrain()     │                    │
      │                    │────────────────────│                    │
      │                    │                    │                    │
      │                    │         isEmpty(col, row)?              │
      │                    │────────────────────────────────────────▶│
      │                    │                    │                    │
      │                    │              true/false                 │
      │                    │◀────────────────────────────────────────│
      │                    │                    │                    │
      │                    │    if blocked:     │                    │
      │                    │    Try diagonal    │                    │
      │                    │───────────────────▶│                    │
      │                    │                    │                    │
      │                    │    if settled:     │                    │
      │                    │    Update grid     │                    │
      │                    │────────────────────────────────────────▶│
      │                    │                    │                    │
      │                    │ checkGapFilling()  │                    │
      │                    │────────────────────────────────────────▶│
      │                    │                    │                    │
      │  Updated grains    │                    │                    │
      │◀───────────────────│                    │                    │
      │                    │                    │                    │
```

---

## Class Diagrams

### Frontend Classes

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SandGrain (Type)                               │
├─────────────────────────────────────────────────────────────────────────┤
│ + x: number              // Current X position                          │
│ + y: number              // Current Y position                          │
│ + targetX: number        // Final X position (from image)               │
│ + targetY: number        // Final Y position (from image)               │
│ + vx: number             // X velocity                                  │
│ + vy: number             // Y velocity                                  │
│ + color: [r,g,b,a]       // RGBA normalized (0-1)                       │
│ + settled: boolean       // Has stopped moving                          │
│ + active: boolean        // Has started falling                         │
│ + delay: number          // Milliseconds before activation              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         SimulationSettings (Type)                        │
├─────────────────────────────────────────────────────────────────────────┤
│ + pixelSize: number            // Size of each grain (2-20)             │
│ + gravity: number              // Downward acceleration (0.1-1.0)       │
│ + terminalVelocity: number     // Max fall speed (2-20)                 │
│ + waveDelay: number            // MS between row waves (10-500)         │
│ + rowsPerWave: number          // Rows per wave batch (1-50)            │
│ + interactionRadius: number    // Mouse effect radius (10-100)          │
│ + interactionStrength: number  // Push force multiplier (0.5-5)         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           SandRenderer (Class)                           │
├─────────────────────────────────────────────────────────────────────────┤
│ - gl: WebGL2RenderingContext                                            │
│ - program: WebGLProgram                                                 │
│ - vao: WebGLVertexArrayObject                                           │
│ - offsetBuffer: WebGLBuffer                                             │
│ - colorBuffer: WebGLBuffer                                              │
│ - grainCount: number                                                    │
│ - settings: SimulationSettings                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ + constructor(canvas, settings)                                         │
│ + resize(width, height): void                                           │
│ + updateGrains(grains: SandGrain[]): void                               │
│ + render(): void                                                        │
│ + updateSettings(settings): void                                        │
│ + dispose(): void                                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           SandPhysics (Class)                            │
├─────────────────────────────────────────────────────────────────────────┤
│ - grains: SandGrain[]                                                   │
│ - grid: (SandGrain|null)[][]   // Spatial hash map                      │
│ - cols: number                                                          │
│ - rows: number                                                          │
│ - settings: SimulationSettings                                          │
│ - startTime: number                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ + constructor(settings)                                                 │
│ + initialize(grains, width, height): void                               │
│ + update(mouse: MouseState): void                                       │
│ + getGrains(): SandGrain[]                                              │
│ + updateSettings(settings): void                                        │
│ + reset(): void                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ - moveGrain(grain, rowsToMove): void                                    │
│ - isEmpty(col, row): boolean                                            │
│ - settleGrain(grain): void                                              │
│ - findGap(col, row): number|null                                        │
│ - checkGapFilling(): void                                               │
│ - processMouseInteraction(mouse): void                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Backend Classes

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ImageProcessingService (Service)                      │
├─────────────────────────────────────────────────────────────────────────┤
│ + processImage(file, settings): ProcessedImageResponse                  │
├─────────────────────────────────────────────────────────────────────────┤
│ - resizeToFit(image, maxW, maxH): BufferedImage                         │
│ - extractPixels(image, cols, rows, settings): List<PixelData>           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    CreationStorageService (Service)                      │
├─────────────────────────────────────────────────────────────────────────┤
│ - creations: Map<String, SavedCreation>                                 │
│ - MAX_CREATIONS: int = 1000                                             │
│ - MAX_GRAINS: int = 100000                                              │
├─────────────────────────────────────────────────────────────────────────┤
│ + save(request): SavedCreation                                          │
│ + load(id): Optional<SavedCreation>                                     │
│ + delete(id): boolean                                                   │
│ + listRecent(limit): List<SavedCreation>                                │
│ + getCount(): int                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│ - generateId(): String                                                  │
│ - removeOldestCreation(): void                                          │
│ - withoutGrains(creation): SavedCreation                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## State Diagrams

### Grain Lifecycle

```
                    ┌─────────────┐
                    │   CREATED   │
                    │  (y < 0,    │
                    │   active=   │
                    │   false)    │
                    └──────┬──────┘
                           │
                           │ delay elapsed
                           ▼
                    ┌─────────────┐
                    │   ACTIVE    │
             ┌─────▶│  (falling,  │◀─────┐
             │      │   active=   │      │
             │      │   true)     │      │
             │      └──────┬──────┘      │
             │             │             │
             │             │ reached     │ unsettled
             │             │ obstacle    │ (gap below)
             │             ▼             │
             │      ┌─────────────┐      │
             │      │  SETTLING   │──────┘
             │      │  (checking  │
             │      │  neighbors) │
             │      └──────┬──────┘
             │             │
             │             │ no gaps
     mouse   │             │ found
    disturbs │             ▼
             │      ┌─────────────┐
             └──────│   SETTLED   │
                    │  (vy = 0,   │
                    │   settled=  │
                    │   true)     │
                    └─────────────┘
```

### Application States

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│                        ┌─────────────┐                                 │
│              ┌────────▶│    IDLE     │◀────────┐                       │
│              │         │  (no grains)│         │                       │
│              │         └──────┬──────┘         │                       │
│              │                │                │                       │
│              │                │ load image     │ clear all             │
│              │                │ or gradient    │                       │
│              │                ▼                │                       │
│              │         ┌─────────────┐         │                       │
│              │         │   LOADING   │─────────┘                       │
│              │         │  (processing│                                 │
│              │         │    image)   │                                 │
│              │         └──────┬──────┘                                 │
│              │                │                                        │
│              │                │ grains ready                           │
│              │                ▼                                        │
│              │         ┌─────────────┐                                 │
│    reset     │         │   PLAYING   │◀─────┐                          │
│    pressed   └─────────│  (animation │      │ resume                   │
│                        │    active)  │      │                          │
│                        └──────┬──────┘      │                          │
│                               │             │                          │
│                               │ pause       │                          │
│                               ▼             │                          │
│                        ┌─────────────┐      │                          │
│                        │   PAUSED    │──────┘                          │
│                        │  (frozen    │                                 │
│                        │   display)  │                                 │
│                        └─────────────┘                                 │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Decisions

### Why WebGL 2.0 with Instanced Rendering?

| Approach | Max Particles | FPS | Memory |
|----------|--------------|-----|--------|
| Canvas 2D | ~5,000 | 30 | High |
| SVG | ~1,000 | 15 | Very High |
| WebGL (no instancing) | ~50,000 | 45 | Medium |
| **WebGL 2 (instanced)** | **100,000+** | **60** | **Low** |

**Instanced rendering** allows drawing many identical objects (squares) with a single draw call, uploading only position/color data per instance.

### Why CPU Physics vs GPU (Compute Shaders)?

- **CPU Physics chosen** because:
  - Simpler implementation and debugging
  - Better browser compatibility (WebGL compute is limited)
  - Sufficient performance for 100k particles
  - Easier to add complex behaviors (mouse interaction)

- GPU compute would be better if:
  - Targeting 1M+ particles
  - Running on known hardware (gaming rigs)

### Why Zustand over Redux/Context?

- **Minimal boilerplate**: No actions/reducers
- **Direct mutations**: Simpler mental model
- **Better performance**: No context re-renders
- **Small bundle**: ~1kb vs ~10kb for Redux

### Why Spring Boot for Backend?

This is a **learning project** - Spring Boot provides:
- Industry-standard Java framework
- Excellent documentation
- Built-in dependency injection
- Easy Docker integration
- Path to adding databases later

### Data Structure: Spatial Grid

```
Grid: 2D array where grid[col][row] = SandGrain | null

Advantages:
- O(1) collision detection
- O(1) neighbor lookup
- Memory efficient for dense areas

Trade-off:
- Fixed grid size (must match pixel size)
- Less efficient for sparse distributions
```

---

## Future Enhancements

1. **Persistence**: Replace in-memory storage with PostgreSQL
2. **GPU Physics**: WebGL compute shaders for 1M+ particles
3. **Social Features**: User accounts, galleries, likes
4. **Advanced Physics**: Liquid simulation, different materials
5. **Mobile App**: React Native with shared physics code

---

## File Structure Reference

```
sand-pixel/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.tsx           # Main layout
│   │   │   ├── SandCanvas.tsx    # WebGL canvas
│   │   │   ├── ImageUpload.tsx   # Drag-drop upload
│   │   │   ├── Controls.tsx      # Settings UI
│   │   │   ├── Header.tsx        # Page header
│   │   │   └── LoadingOverlay.tsx
│   │   ├── webgl/
│   │   │   ├── SandRenderer.ts   # WebGL rendering
│   │   │   ├── SandPhysics.ts    # Physics engine
│   │   │   └── shaders.ts        # GLSL shaders
│   │   ├── stores/
│   │   │   └── sandStore.ts      # Zustand state
│   │   ├── utils/
│   │   │   └── imageProcessing.ts
│   │   └── types/
│   │       └── sand.types.ts
│   └── ...
├── backend/
│   ├── src/main/java/com/sandpixel/
│   │   ├── controller/
│   │   │   ├── ImageController.java
│   │   │   └── CreationController.java
│   │   ├── service/
│   │   │   ├── ImageProcessingService.java
│   │   │   └── CreationStorageService.java
│   │   ├── model/
│   │   │   ├── PixelData.java
│   │   │   ├── SavedCreation.java
│   │   │   └── ...
│   │   └── config/
│   │       ├── CorsConfig.java
│   │       └── GlobalExceptionHandler.java
│   └── ...
├── docker-compose.yml
├── ARCHITECTURE.md
├── DESIGN.md                      # This file
└── README.md
```
