# Sand Pixel - System Architecture

## Overview

Sand Pixel transforms any image into interactive falling sand pixel art. This document explains the full-stack architecture designed for learning and scalability.

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────────┐ │
│  │   React +   │  │    Image     │  │      WebGL Renderer         │ │
│  │ TypeScript  │──│   Upload     │──│  (Sand Physics + Rendering) │ │
│  │     UI      │  │  Component   │  │                             │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────────┘ │
│         │                │                        ▲                  │
│         │                │                        │                  │
│         ▼                ▼                        │                  │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    State Management                              ││
│  │  - Image data (pixels, colors)                                   ││
│  │  - Simulation settings (gravity, speed, pixel size)              ││
│  │  - User preferences                                              ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           BACKEND                                    │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────────┐ │
│  │   Spring    │  │    Image     │  │      Storage Service        │ │
│  │    Boot     │──│  Processing  │──│   (S3 / Local / Database)   │ │
│  │    API      │  │   Service    │  │                             │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
| Technology | Purpose | Why |
|------------|---------|-----|
| **React 18** | UI Framework | Component-based, huge ecosystem, great for learning |
| **TypeScript** | Type Safety | Catches errors early, better IDE support |
| **Vite** | Build Tool | Fast dev server, modern bundling |
| **WebGL 2.0** | Rendering | GPU-accelerated, handles millions of particles |
| **Zustand** | State Management | Simple, lightweight, TypeScript-friendly |
| **TailwindCSS** | Styling | Rapid UI development |

### Backend
| Technology | Purpose | Why |
|------------|---------|-----|
| **Spring Boot 3** | Framework | Industry standard, robust, well-documented |
| **Java 21** | Language | Modern features, great performance |
| **Spring Web** | REST API | Handle image uploads, user requests |
| **Spring Security** | Auth (optional) | JWT-based authentication |
| **PostgreSQL** | Database | Store user data, creation metadata |
| **AWS S3 / MinIO** | File Storage | Store uploaded images, exported creations |

## Data Flow

### 1. Image Upload Flow (Client-Side Processing)
```
User selects image
        │
        ▼
┌───────────────────┐
│ Browser loads     │
│ image into Canvas │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Extract pixel     │  ← This happens instantly in browser
│ data (ImageData)  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Downsample to     │  ← Reduce to target pixel size (e.g., 200x200)
│ target resolution │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Create sand grain │  ← Each pixel becomes a grain with color
│ array             │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ WebGL renders     │  ← GPU handles physics + rendering
│ falling sand      │
└───────────────────┘
```

### 2. Save/Share Flow (Server-Side)
```
User clicks "Save"
        │
        ▼
┌───────────────────┐
│ Serialize state:  │
│ - Grain positions │
│ - Colors          │
│ - Settings        │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐     ┌───────────────────┐
│ POST /api/saves   │────▶│ Spring Boot       │
│                   │     │ validates & stores│
└───────────────────┘     └─────────┬─────────┘
                                    │
                          ┌─────────┴─────────┐
                          ▼                   ▼
                   ┌───────────┐       ┌───────────┐
                   │ PostgreSQL│       │ S3/MinIO  │
                   │ (metadata)│       │ (images)  │
                   └───────────┘       └───────────┘
```

## Project Structure

```
sand-pixel/
├── frontend/                    # React + Vite + WebGL
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ImageUpload/
│   │   │   ├── SandCanvas/
│   │   │   ├── Controls/
│   │   │   └── ShareModal/
│   │   ├── webgl/               # WebGL rendering engine
│   │   │   ├── shaders/         # GLSL vertex/fragment shaders
│   │   │   │   ├── sand.vert
│   │   │   │   └── sand.frag
│   │   │   ├── SandRenderer.ts  # Main WebGL renderer class
│   │   │   ├── SandPhysics.ts   # Physics simulation (GPU compute)
│   │   │   └── TextureManager.ts
│   │   ├── services/            # API communication
│   │   │   └── api.ts
│   │   ├── stores/              # Zustand state
│   │   │   └── sandStore.ts
│   │   ├── types/               # TypeScript types
│   │   │   └── sand.types.ts
│   │   └── utils/               # Helper functions
│   │       └── imageProcessing.ts
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # Spring Boot
│   ├── src/main/java/com/sandpixel/
│   │   ├── SandPixelApplication.java
│   │   ├── controller/
│   │   │   ├── ImageController.java
│   │   │   └── SaveController.java
│   │   ├── service/
│   │   │   ├── ImageProcessingService.java
│   │   │   └── StorageService.java
│   │   ├── model/
│   │   │   ├── SandCreation.java
│   │   │   └── User.java
│   │   ├── repository/
│   │   │   └── CreationRepository.java
│   │   └── config/
│   │       ├── SecurityConfig.java
│   │       └── CorsConfig.java
│   ├── src/main/resources/
│   │   └── application.yml
│   └── pom.xml
│
├── docker-compose.yml           # Local dev environment
├── ARCHITECTURE.md              # This file
└── README.md
```

## WebGL Rendering Strategy

### Why WebGL?
- **CPU Canvas**: ~10,000 particles @ 60fps
- **WebGL**: ~1,000,000+ particles @ 60fps

### Rendering Approach: Instanced Rendering
Instead of drawing each grain individually, we use **instanced rendering**:

```glsl
// Vertex Shader (sand.vert)
attribute vec2 a_position;      // Quad vertex (shared by all grains)
attribute vec2 a_offset;        // Per-grain: position
attribute vec3 a_color;         // Per-grain: color
attribute float a_size;         // Per-grain: size

uniform mat4 u_projection;

varying vec3 v_color;

void main() {
    vec2 pos = a_position * a_size + a_offset;
    gl_Position = u_projection * vec4(pos, 0.0, 1.0);
    v_color = a_color;
}
```

### Physics Options
1. **CPU Physics** (simpler, good for <50k grains)
   - JavaScript handles collision detection
   - Update positions, send to GPU each frame

2. **GPU Physics** (advanced, for 100k+ grains)
   - Use WebGL transform feedback or compute shaders
   - Physics runs entirely on GPU

**We'll start with CPU physics** for learning, then optimize to GPU later.

## API Endpoints

### Image Processing
```
POST /api/process
  Body: multipart/form-data { image: File, settings: JSON }
  Response: {
    id: string,
    pixels: { x, y, r, g, b, a }[],
    width: number,
    height: number
  }
```

### Save Creation
```
POST /api/creations
  Body: {
    name: string,
    pixels: [...],
    settings: {...},
    thumbnail: base64
  }
  Response: { id: string, shareUrl: string }

GET /api/creations/:id
  Response: { creation data }
```

## Learning Path

### Phase 1: Core Rendering (Week 1-2)
1. Set up Vite + React + TypeScript
2. Learn WebGL basics - draw a single quad
3. Implement instanced rendering for grains
4. Add basic falling physics (CPU)

### Phase 2: Image Processing (Week 2-3)
1. Image upload component
2. Canvas-based pixel extraction
3. Downsampling algorithm
4. Connect to WebGL renderer

### Phase 3: Interactivity (Week 3-4)
1. Mouse interaction (finger through sand)
2. Settings controls (gravity, speed, size)
3. Reset/replay functionality

### Phase 4: Backend Integration (Week 4-5)
1. Set up Spring Boot project
2. Create REST endpoints
3. Implement save/load functionality
4. Add share via URL

### Phase 5: Polish (Week 5-6)
1. UI/UX improvements
2. Performance optimization
3. Mobile support
4. Deployment

## Key Concepts to Learn

### WebGL
- **Shaders**: Programs that run on GPU (vertex + fragment)
- **Buffers**: Arrays of data sent to GPU
- **Attributes**: Per-vertex data (position, color)
- **Uniforms**: Global data (projection matrix, time)
- **Instancing**: Drawing many objects with one draw call

### Spring Boot
- **Controllers**: Handle HTTP requests
- **Services**: Business logic
- **Repositories**: Database access
- **DTOs**: Data transfer objects
- **Dependency Injection**: Spring manages object creation

## Getting Started

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
./mvnw spring-boot:run

# Or use Docker
docker-compose up
```

## Next Steps

1. **Create frontend project** with Vite + React + TypeScript
2. **Build basic WebGL renderer** that draws colored squares
3. **Add falling physics** to make squares fall and stack
4. **Implement image upload** and pixel extraction
5. **Set up Spring Boot** backend for saving/sharing
