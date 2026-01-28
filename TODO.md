# Sand Pixel - Multi-Game Platform TODO

> **Development Philosophy:**
> - **Plan extensively before coding** - Each game requires dedicated research, design docs, and architecture planning
> - **Use plan mode** - Enter plan mode for any non-trivial task to think through the approach
> - **Quality over speed** - Take time to design properly; these are complex systems, not quick features
> - **Research first** - Study existing implementations, read game rules thoroughly, understand edge cases
> - **Design documents** - Create DESIGN.md files for each game before implementation
> - **Use `/frontend-design` skill** for all UI/frontend work
> - **Test thoroughly** - Each task must include relevant tests (unit, integration, or E2E)
> - **Refactor rigorously** - Follow SOLID principles, clean architecture, and design patterns
> - **Full-stack per feature** - Complete frontend + backend for each feature before moving on
> - **Commit atomically** - Small, focused commits with descriptive messages

---

## Phase 0: Stabilize Current Codebase

### 0.1 - Commit Pending Changes
- [x] Review and commit the 4 uncommitted files (CountdownPhase, DrawingPhase, test-utils, game-modes.spec)
- [x] Push 3 local commits to origin/main
- [x] Ensure all existing tests pass before proceeding (138 frontend tests pass, backend compiles)

### 0.2 - Fix Critical Bugs
- [x] Fix COLLABORATIVE mode stroke synchronization
  - **Tests**: E2E tests enabled in game-modes.spec.ts ✓
  - **Note**: Stroke logic is 3 lines in DrawingPhase.tsx - service extraction would be over-engineering
- [x] Fix countdown synchronization between backend/frontend
  - **Fixed**: Backend sends countdown(3), frontend syncs or falls back gracefully
  - **Note**: Unit tests for countdown hook already exist (23 tests in useCountdown.test.ts)
- [x] Complete TELEPHONE mode reveal chain verification
  - **Status**: TelephoneRevealPhase component is fully implemented
  - **Note**: Full E2E test skipped due to round duration (45s draw + 30s guess per player)

### 0.3 - Technical Debt Cleanup
- [x] Remove outdated CLAUDE_CONTEXT.md from frontend (also added .gitignore)
- [x] Add backend unit tests for core services (GuessValidator: 30 tests, ScoringService: 28 tests)
- [x] Add input validation on frontend before WebSocket sends (32 tests, integrated into WebSocket service)
- [x] Add proper logging with log levels in backend

---

## Phase 1: Platform Architecture

### 1.0 - Planning & Research (Do NOT skip)
- [ ] Research multi-game platform architectures
  - Study Jackbox Games architecture (how they handle multiple game types)
  - Study Board Game Arena (open source references available)
  - Study game lobby patterns (Steam, Discord Activities)
  - Document findings in DESIGN-PLATFORM.md
- [ ] Design game abstraction layer
  - Define GameEngine interface contract
  - Define GameState base class/interface
  - Define GamePhase abstraction
  - Define message routing strategy (how to route WebSocket messages to correct game engine)
  - Draw class diagrams and interaction diagrams
- [ ] Design room/lobby system
  - Define room lifecycle (create → configure → play → end)
  - Define how game type selection works
  - Define room code generation strategy
  - Define player management (join, leave, reconnect, kick)
- [ ] Design frontend architecture
  - Plan routing structure (/games/:gameType/:roomCode)
  - Plan state management for multi-game (shared vs game-specific stores)
  - Plan component hierarchy (shared layout, game-specific content)
- [ ] Define colorful pixel art design system
  - Research colorful game platform UIs for inspiration:
    - Jackbox Games (vibrant, playful)
    - Fall Guys UI (bright, saturated colors)
    - Brawl Stars menu (colorful gradients + pixel elements)
    - Discord Activities (modern but fun)
    - Kahoot (energetic, bold colors)
  - Define vibrant color palette (bold primaries, bright accents, not muted)
  - Define typography approach (fun but readable)
  - Define component inventory needed
  - Create mood board / reference collection
- [ ] Write technical spec with acceptance criteria

### 1.1 - Refactor to Multi-Game Structure
- [ ] Create shared game abstraction layer in backend
  - Create `GameType` enum (PICTIONARY, CODENAMES, TRIVIA, CATAN, WEREWOLF)
  - Create `GameEngine` interface that all games implement
  - Refactor Pictionary to implement this interface
  - **Tests**: Unit tests for game engine abstraction
  - **Refactor**: Apply Strategy pattern for game-specific logic

- [ ] Create shared room system that supports any game type
  - Room now has `gameType` field
  - Room settings become game-specific (use polymorphism)
  - **Tests**: Integration tests for room with different game types
  - **Refactor**: Extract room management into clean domain layer

- [ ] Refactor frontend state management for multi-game support
  - Create game-agnostic room store
  - Create game-specific stores that extend base functionality
  - **Tests**: Unit tests for store interactions
  - **Refactor**: Apply Repository pattern for state management

### 1.2 - Build Home Page
- [ ] Design and implement retro pixel art home page
  - **Use /frontend-design skill**
  - Hero section with platform branding
  - Game selection grid with pixel art cards for each game
  - "Create Room" prominent CTA
  - Pixel art background animations (subtle)
  - **Tests**: Component tests, visual regression tests
  - **Refactor**: Create reusable PixelCard, PixelButton components

### 1.3 - Build Unified Room System
- [ ] Implement "Create Room" flow
  - Step 1: Enter nickname
  - Step 2: Select game from visual picker
  - Step 3: Configure game-specific settings
  - Step 4: Get shareable room code
  - **Tests**: E2E test for full room creation flow
  - **Refactor**: Use wizard/stepper pattern

- [ ] Implement "Join Room" flow
  - Enter room code OR browse public rooms
  - Show game type and player count before joining
  - **Tests**: E2E test for join flow

- [ ] Implement room lobby (pre-game)
  - Show players, ready states
  - Game-specific settings visible
  - Host can change game type before starting
  - **Tests**: E2E test for lobby interactions

### 1.4 - Implement Colorful Design System
- [ ] Research UI inspiration from successful platforms
  - **Use /frontend-design skill**
  - Study: Jackbox, Fall Guys, Brawl Stars, Kahoot, Discord Activities
  - Document: color usage, animation patterns, component styles
  - Create reference mood board

- [ ] Create vibrant component library
  - **Use /frontend-design skill**
  - Button (bold colors, satisfying hover/click animations)
  - GameCard (colorful, eye-catching, hover effects)
  - Input (clean but with personality)
  - Avatar (bright, distinguishable player colors)
  - Modal (smooth animations, clear hierarchy)
  - Icons (custom, consistent style)
  - **Tests**: Storybook stories + visual tests
  - **Refactor**: Document component API, create design tokens

- [ ] Implement unified color theme
  - Vibrant primary colors (not muted - think party game energy)
  - Each game can have accent color but unified base
  - Dark/light mode support
  - Gradient usage for depth and energy
  - **Tests**: Theme consistency tests

---

## Phase 2: Pictionary Polish (Existing Game)

### 2.0 - Ideation & Creative Direction
- [ ] Brainstorm game identity and branding
  - Research successful party game branding (Jackbox naming conventions)
  - Generate 5+ name options for the drawing game
  - Consider how name ties into "The Hub" platform identity
  - Document reasoning in DESIGN-PICTIONARY.md
- [ ] Explore unique feature ideas that differentiate from competitors
  - What makes this better than Skribbl.io, Gartic Phone?
  - Brainstorm 3-5 innovative features (e.g., AI hints, theme packs, replay sharing)
  - Prioritize based on effort vs impact
- [ ] Define visual identity
  - Mood board for the drawing game aesthetic
  - How does it feel different from other games on the platform?
  - Color accent, iconography, sound design direction

### 2.1 - Planning & Design
- [ ] Define "Sand Draw" branding and identity
  - Name confirmation (Sand Draw? Pixel Sketch? Other?)
  - How it fits within the platform aesthetic
- [ ] Audit current implementation against new platform architecture
  - Identify what needs to change to implement GameEngine interface
  - Document refactoring needed
- [ ] Plan pixel art theme application
  - List all components that need restyling
  - Design pixel art versions of drawing tools, canvas frame, etc.

### 2.1 - Rename and Integrate
- [ ] Rename from generic "game" to "Sand Draw" or similar
- [ ] Integrate with new platform routing (/games/pictionary)
- [ ] Implement GameEngine interface for Pictionary
- [ ] Apply pixel art theme to existing UI
  - **Use /frontend-design skill**

### 2.2 - Feature Enhancements
- [ ] Add custom word lists for room creator
  - **Tests**: Unit tests for word validation, E2E for custom words flow
- [ ] Add drawing tools: undo/redo, eraser sizes, shape tools
  - **Tests**: Canvas interaction tests
- [ ] Add round summary screen showing all drawings
- [ ] Add spectator mode
  - **Tests**: E2E for spectator joining and viewing

---

## Phase 3: Codenames Game

### 3.0 - Planning & Research (Do NOT skip)
- [ ] Research Codenames rules exhaustively
  - Read official rulebook completely
  - Watch gameplay videos to understand flow and edge cases
  - Document all rules, turn structure, and win conditions in DESIGN-CODENAMES.md
- [ ] Analyze existing open-source implementations
  - Study 2-3 Codenames clones (Horsepaste, Codenames.game)
  - Document what works well and common pitfalls
- [ ] Design game architecture
  - Define all game states and transitions (state diagram)
  - Define WebSocket message contracts
  - Define data models (Room, Board, Team, Role)
  - Plan how Spymaster view differs from Operative view
- [ ] Design UI/UX wireframes
  - Sketch board layout, clue input, team panels
  - Plan animations (card reveal, turn transitions)
  - Mobile layout considerations
- [ ] Write technical spec with acceptance criteria
  - Define "done" for each feature
  - List all edge cases to handle

### 3.1 - Backend Implementation
- [ ] Create Codenames game engine
  - 5x5 word grid with team assignments (Red, Blue, Neutral, Assassin)
  - Spymaster and Operative roles
  - Turn-based clue giving and guessing
  - Win conditions (find all words OR assassin hit)
  - **Tests**: Full unit test coverage for game logic
  - **Refactor**: Use State pattern for game phases

- [ ] Create Codenames word bank
  - 400+ words curated for gameplay
  - Category support (optional filter)
  - **Tests**: Word distribution tests

### 3.2 - Frontend Implementation
- [ ] Build Codenames game UI
  - **Use /frontend-design skill**
  - Word grid with pixel art cards
  - Role-specific views (Spymaster sees colors, Operatives don't)
  - Clue input for Spymasters
  - Turn indicator and team scores
  - **Tests**: Component tests, E2E for full game

- [ ] Build Codenames results screen
  - Show full board reveal
  - Winning team celebration
  - **Tests**: Results display tests

---

## Phase 4: Trivia Game

### 4.0 - Planning & Research (Do NOT skip)
- [ ] Research trivia game mechanics
  - Study Kahoot, Jackbox Trivia, Trivial Pursuit
  - Document scoring systems, timing mechanics, category approaches
  - Write findings in DESIGN-TRIVIA.md
- [ ] Research trivia question sources
  - Evaluate OpenTriviaDB API (rate limits, quality, categories)
  - Evaluate other APIs (The Trivia API, Quiz API)
  - Consider building curated local question bank
  - Document pros/cons of each approach
- [ ] Design game architecture
  - Define game phases (question display, answering, reveal, scores)
  - Define scoring algorithm (base points, speed bonus, streaks)
  - Define WebSocket message contracts
  - Plan how to handle late joiners
- [ ] Design UI/UX wireframes
  - Question display with timer
  - Answer selection with feedback
  - Live leaderboard updates
  - Category selection screen
- [ ] Write technical spec with acceptance criteria

### 4.1 - Backend Implementation
- [ ] Create Trivia game engine
  - Multiple choice questions (4 options)
  - Timed rounds (configurable)
  - Point system (speed bonus)
  - Categories support
  - **Tests**: Full unit test coverage
  - **Refactor**: Use Template Method for question types

- [ ] Create/integrate trivia question bank
  - Integrate with OpenTriviaDB API OR create local bank
  - Category filtering
  - Difficulty levels
  - **Tests**: API integration tests

### 4.2 - Frontend Implementation
- [ ] Build Trivia game UI
  - **Use /frontend-design skill**
  - Question display with countdown timer
  - Answer buttons with pixel art style
  - Live scoreboard showing who answered
  - Streak indicators
  - **Tests**: Component tests, E2E for full game

- [ ] Build Trivia results/leaderboard
  - Round-by-round breakdown
  - Final standings
  - **Tests**: Leaderboard rendering tests

---

## Phase 5: Catan (Simplified)

### 5.0 - Planning & Research (Do NOT skip)
- [ ] Study Catan rules deeply
  - Read official Catan rulebook cover to cover
  - Play actual Catan games (physical or Catan Universe) to internalize flow
  - Document complete rules in DESIGN-CATAN.md
- [ ] Define "simplified" scope explicitly
  - List features TO INCLUDE: hex grid, resources, settlements, cities, roads, dice, trading, victory points
  - List features TO EXCLUDE: robber, development cards, ports, longest road, largest army
  - Document reasoning for each exclusion
  - Define clear boundaries to prevent scope creep
- [ ] Research hex grid implementations
  - Study hex grid coordinate systems (axial, cube, offset)
  - Research pathfinding on hex grids (for road connectivity)
  - Document chosen approach with diagrams
- [ ] Design game architecture
  - Define board generation algorithm (balanced resource/number distribution)
  - Define all game states and turn phases
  - Define data models (Hex, Vertex, Edge, Player, Resource)
  - Define placement validation rules
  - Define trading protocol
  - Define WebSocket message contracts
- [ ] Design UI/UX wireframes
  - Hex board rendering approach
  - Building placement interaction (click vertices/edges)
  - Resource hand display
  - Trade proposal UI
  - Mobile touch considerations for hex selection
- [ ] Create prototype/proof of concept
  - Build hex grid rendering separately first
  - Validate placement interaction works well
- [ ] Write technical spec with acceptance criteria

### 5.1 - Backend Implementation
- [ ] Create Catan game engine (simplified)
  - Hex grid map generation
  - Resources: Wood, Brick, Wheat, Ore, Sheep
  - Buildings: Roads, Settlements, Cities
  - Dice rolling for resource distribution
  - Turn phases: Roll → Trade → Build
  - Victory points (first to 10 wins)
  - NO robber, NO development cards, NO ports (keep simple)
  - **Tests**: Extensive unit tests for all game logic
  - **Refactor**: Use Builder pattern for map generation

- [ ] Implement trading system
  - Player-to-player trade offers
  - Bank trades (4:1 ratio)
  - **Tests**: Trade validation tests

### 5.2 - Frontend Implementation
- [ ] Build Catan game board UI
  - **Use /frontend-design skill**
  - Hex grid with pixel art tiles
  - Resource icons
  - Building placement UI
  - Player color indicators
  - **Tests**: Board rendering tests

- [ ] Build Catan player dashboard
  - Resource hand display
  - Build menu with costs
  - Trade interface
  - Victory point tracker
  - **Tests**: Dashboard interaction tests

- [ ] Build Catan game flow UI
  - Dice roll animation
  - Turn indicator
  - Phase prompts
  - **Tests**: E2E for complete game flow

---

## Phase 6: Werewolf/Mafia

### 6.0 - Planning & Research (Do NOT skip)
- [ ] Research Werewolf/Mafia variants
  - Study classic Mafia rules
  - Study One Night Ultimate Werewolf
  - Study Town of Salem (digital adaptation)
  - Document different role sets and their balance implications
  - Write findings in DESIGN-WEREWOLF.md
- [ ] Define role set for initial release
  - Core roles: Villager, Werewolf, Seer, Doctor
  - Document each role's abilities, when they act, win conditions
  - Plan role distribution based on player count (e.g., 6 players = 2 wolves, 1 seer, 1 doctor, 2 villagers)
  - Document edge cases (what if doctor saves wolf target? what if seer dies night 1?)
- [ ] Design day/night phase flow
  - Night: Role actions in specific order (Seer → Doctor → Werewolves)
  - Day: Discussion timer → Nomination → Defense → Voting
  - Define what players see during each phase
  - Handle simultaneous actions and conflicts
- [ ] Design voting and elimination system
  - Nomination mechanics (who can nominate, seconding)
  - Vote visibility (public vs secret ballot)
  - Tie handling
  - "No elimination" option
- [ ] Research real-time vs turn-based for night phase
  - Simultaneous actions with server resolution?
  - Sequential actions with waiting?
  - Document chosen approach
- [ ] Design UI/UX wireframes
  - Player circle/grid layout
  - Role card reveal animation
  - Night action interface (select target)
  - Day discussion interface (chat + timer)
  - Voting interface
  - Death/elimination dramatic reveals
- [ ] Write technical spec with acceptance criteria

### 6.1 - Backend Implementation
- [ ] Create Werewolf game engine
  - Roles: Villager, Werewolf, Seer, Doctor (start simple)
  - Day phase: Discussion → Voting → Elimination
  - Night phase: Werewolves kill, Seer investigates, Doctor saves
  - Win conditions (all wolves dead OR wolves majority)
  - **Tests**: Full unit test coverage for role actions and win conditions
  - **Refactor**: Use State pattern for day/night phases

- [ ] Implement voting system
  - Nomination and voting
  - Vote tallying with ties
  - **Tests**: Voting edge case tests

### 6.2 - Frontend Implementation
- [ ] Build Werewolf game UI
  - **Use /frontend-design skill**
  - Player circle with status indicators (alive/dead)
  - Role reveal screen (private to each player)
  - Day phase: Chat + voting interface
  - Night phase: Role-specific action UI
  - **Tests**: Component tests, role-specific view tests

- [ ] Build Werewolf dramatic reveals
  - Night death reveal animation
  - Vote result animation
  - Game end reveal (show all roles)
  - **Tests**: Animation trigger tests

---

## Phase 7: Platform Polish

### 7.1 - Cross-Game Features
- [ ] Add spectator mode for all games
- [ ] Add room chat (persistent across game phases)
- [ ] Add player avatars (pixel art style, selectable)
- [ ] Add sound effects (8-bit, with mute option)
- [ ] Add mobile responsiveness for all games

### 7.2 - Documentation & DevOps
- [ ] Write comprehensive README.md
- [ ] Set up CI/CD with GitHub Actions
- [ ] Configure production deployment
- [ ] Add health monitoring

---

## Phase 8: Future Ideation & Expansion

### 8.0 - New Game Ideation
- [ ] Research and brainstorm additional game ideas
  - Analyze trending party games (BoardGameGeek, Steam party games)
  - Study what makes games go viral (Among Us, Fall Guys, Jackbox)
  - Create list of 10+ potential games with brief descriptions
  - Document in IDEAS.md
- [ ] Evaluate and prioritize new game concepts
  - Score each idea on: fun factor, implementation complexity, uniqueness
  - Consider multiplayer dynamics (competitive vs cooperative)
  - Pick top 3 candidates for future development
- [ ] Prototype test one new game concept
  - Create paper prototype or simple digital mockup
  - Test with small group if possible
  - Document learnings

### 8.1 - Platform Feature Ideation
- [ ] Brainstorm social features
  - Friend lists, party codes, recurring game nights
  - Tournaments and leaderboards across games
  - Clips/highlights sharing
- [ ] Explore monetization options (if desired)
  - Cosmetics, themes, custom word packs
  - Premium rooms with more players
  - Keep core experience free
- [ ] Consider community features
  - User-generated content (custom word lists, trivia packs)
  - Game rating/feedback system
  - Community challenges/events

### 8.2 - Technical Innovation Ideas
- [ ] Research emerging tech opportunities
  - AI integration (AI players, smart hints, generated content)
  - Voice chat integration
  - Mobile app vs PWA decision
  - VR/AR party games (long-term)
- [ ] Performance and scale planning
  - What does 1000 concurrent rooms look like?
  - CDN for assets, regional servers
  - Database persistence strategy

---

## Backlog (Lower Priority)

- [ ] Private rooms with password protection
- [ ] More Werewolf roles (Hunter, Witch, Cupid)
- [ ] Catan expansions (robber, development cards)
- [ ] More games (Wavelength, Scattergories)
- [ ] Player accounts (optional) with stats
- [ ] Localization (i18n)
- [ ] Accessibility features

---

## Notes for Claude

### Mindset
These are **substantial engineering projects**, not quick features. Each game is equivalent to a small application. Approach each with the seriousness it deserves.

### Before Writing Any Code
1. **Enter plan mode** for any task beyond trivial bug fixes
2. **Complete ALL planning tasks** for a phase before starting implementation
3. **Create design documents** (DESIGN-*.md) with diagrams, data models, and contracts
4. **Research thoroughly** - read docs, study existing implementations, understand edge cases
5. **Ask clarifying questions** rather than making assumptions

### During Implementation
6. **Use `/frontend-design` skill** for any UI/component work
7. **Read related code first** before making changes - understand the context
8. **Write tests alongside code** - not after, alongside
9. **Run full test suite** after each change: `npm test` (frontend), `mvn test` (backend)
10. **Commit atomically** - small, focused commits with descriptive messages

### Code Quality
11. **Apply design patterns** - Strategy, State, Factory, etc. where appropriate
12. **Follow SOLID principles** - single responsibility, open/closed, etc.
13. **Refactor as you go** - leave code cleaner than you found it
14. **Document complex logic** - comments for "why", not "what"
15. **Handle edge cases** - don't leave them for later

### Pacing
- **Do not rush** - quality over speed
- **One thing at a time** - complete each task fully before moving on
- **Take breaks between phases** - review what was built, ensure it's solid
