# Project Folder Structure

**Document Type:** Architecture Specification
**Status:** Approved
**Last Updated:** 2025-10-22
**Version:** 1.0.0

---

## Complete Folder Structure

```
Perpetua/
├── .claude/                          # Claude-Flow integration
│   ├── commands/                     # Custom slash commands
│   └── skills/                       # Agent skills
│
├── .claude-flow/                     # Claude-Flow metadata
│   └── config.json                   # Flow configuration
│
├── .hive-mind/                       # Swarm coordination
│   └── memory/                       # Shared memory
│
├── .swarm/                           # Swarm state
│   └── memory.db                     # SQLite memory store
│
├── docs/                             # Documentation
│   ├── architecture/                 # Architecture docs (THIS FOLDER)
│   │   ├── 01-folder-structure.md   # This file
│   │   ├── 02-ipc-architecture.md   # IPC patterns
│   │   ├── 03-component-hierarchy.md # React architecture
│   │   ├── 04-typescript-config.md  # TS configuration
│   │   ├── 05-build-system.md       # Build architecture
│   │   ├── 06-database-layer.md     # Database design
│   │   ├── 07-claude-integration.md # AI integration
│   │   ├── 08-component-library.md  # Design system
│   │   ├── 09-security.md           # Security architecture
│   │   └── 10-adrs/                 # Architecture Decision Records
│   │       ├── 001-electron-choice.md
│   │       ├── 002-react-state-management.md
│   │       ├── 003-sqlite-vs-alternatives.md
│   │       └── 004-build-tool-selection.md
│   │
│   ├── api/                          # API documentation
│   │   ├── main-process.md          # Main process APIs
│   │   ├── renderer-process.md      # Renderer APIs
│   │   └── ipc-protocols.md         # IPC documentation
│   │
│   ├── guides/                       # Development guides
│   │   ├── setup.md                 # Development setup
│   │   ├── contributing.md          # Contribution guide
│   │   ├── testing.md               # Testing guide
│   │   └── deployment.md            # Deployment guide
│   │
│   └── diagrams/                     # Architecture diagrams
│       ├── c4-context.svg           # C4 context diagram
│       ├── c4-container.svg         # C4 container diagram
│       ├── c4-component.svg         # C4 component diagram
│       └── data-flow.svg            # Data flow diagrams
│
├── src/                              # Source code
│   ├── main/                         # Electron main process
│   │   ├── index.ts                 # Main entry point
│   │   ├── app.ts                   # Application setup
│   │   ├── window.ts                # Window management
│   │   │
│   │   ├── ipc/                     # IPC handlers
│   │   │   ├── index.ts             # IPC router
│   │   │   ├── journey.handler.ts   # Journey operations
│   │   │   ├── database.handler.ts  # Database operations
│   │   │   ├── file.handler.ts      # File system operations
│   │   │   └── claude.handler.ts    # Claude AI operations
│   │   │
│   │   ├── services/                # Main process services
│   │   │   ├── database.service.ts  # SQLite service
│   │   │   ├── file.service.ts      # File operations
│   │   │   ├── claude.service.ts    # Claude SDK wrapper
│   │   │   ├── computer-use.service.ts # Puppeteer wrapper
│   │   │   └── storage.service.ts   # Secure storage
│   │   │
│   │   ├── models/                  # Data models
│   │   │   ├── journey.model.ts     # Journey schema
│   │   │   ├── stage.model.ts       # Stage schema
│   │   │   └── artifact.model.ts    # Artifact schema
│   │   │
│   │   └── utils/                   # Utilities
│   │       ├── logger.ts            # Logging utility
│   │       ├── error.ts             # Error handling
│   │       └── security.ts          # Security utilities
│   │
│   ├── renderer/                     # React renderer process
│   │   ├── index.tsx                # Renderer entry
│   │   ├── App.tsx                  # Root component
│   │   │
│   │   ├── pages/                   # Page components
│   │   │   ├── Home.tsx             # Home/dashboard
│   │   │   ├── Journey.tsx          # Journey view
│   │   │   ├── History.tsx          # Journey history
│   │   │   └── Settings.tsx         # Settings page
│   │   │
│   │   ├── components/              # React components
│   │   │   ├── journey/             # Journey components
│   │   │   │   ├── Stream.tsx       # Infinite scroll stream
│   │   │   │   ├── StageCard.tsx    # Stage card component
│   │   │   │   ├── ControlPanel.tsx # Control sidebar
│   │   │   │   └── JourneyInput.tsx # Start journey input
│   │   │   │
│   │   │   ├── artifacts/           # Artifact components
│   │   │   │   ├── ArtifactCard.tsx # Artifact display
│   │   │   │   ├── ArtifactViewer.tsx # Full artifact view
│   │   │   │   └── ArtifactList.tsx # List of artifacts
│   │   │   │
│   │   │   ├── ui/                  # Design system components
│   │   │   │   ├── Button.tsx       # Button component
│   │   │   │   ├── Input.tsx        # Input field
│   │   │   │   ├── Card.tsx         # Card container
│   │   │   │   ├── Badge.tsx        # Badge/tag
│   │   │   │   ├── Modal.tsx        # Modal dialog
│   │   │   │   ├── Tooltip.tsx      # Tooltip
│   │   │   │   ├── Spinner.tsx      # Loading spinner
│   │   │   │   └── Icon.tsx         # Icon wrapper
│   │   │   │
│   │   │   ├── layout/              # Layout components
│   │   │   │   ├── AppLayout.tsx    # Main layout
│   │   │   │   ├── Sidebar.tsx      # Sidebar navigation
│   │   │   │   ├── Header.tsx       # App header
│   │   │   │   └── Footer.tsx       # App footer
│   │   │   │
│   │   │   └── common/              # Common components
│   │   │       ├── ErrorBoundary.tsx # Error boundary
│   │   │       ├── LoadingState.tsx  # Loading state
│   │   │       └── EmptyState.tsx    # Empty state
│   │   │
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useJourney.ts        # Journey operations
│   │   │   ├── useStages.ts         # Stage management
│   │   │   ├── useArtifacts.ts      # Artifact operations
│   │   │   ├── useIPC.ts            # IPC communication
│   │   │   ├── useKeyboard.ts       # Keyboard shortcuts
│   │   │   └── useLocalStorage.ts   # Local storage
│   │   │
│   │   ├── stores/                  # State management (Zustand)
│   │   │   ├── journey.store.ts     # Journey state
│   │   │   ├── ui.store.ts          # UI state
│   │   │   ├── settings.store.ts    # Settings state
│   │   │   └── auth.store.ts        # Authentication state
│   │   │
│   │   ├── services/                # Renderer services
│   │   │   ├── ipc.service.ts       # IPC client
│   │   │   ├── storage.service.ts   # Local storage
│   │   │   └── analytics.service.ts # Analytics (optional)
│   │   │
│   │   ├── utils/                   # Utilities
│   │   │   ├── format.ts            # Formatting utilities
│   │   │   ├── validation.ts        # Validation
│   │   │   ├── constants.ts         # Constants
│   │   │   └── helpers.ts           # Helper functions
│   │   │
│   │   ├── styles/                  # Global styles
│   │   │   ├── globals.css          # Global CSS
│   │   │   ├── tailwind.css         # Tailwind imports
│   │   │   └── animations.css       # Custom animations
│   │   │
│   │   └── assets/                  # Static assets
│   │       ├── icons/               # SVG icons
│   │       ├── images/              # Images
│   │       └── fonts/               # Custom fonts
│   │
│   ├── lib/                          # Shared libraries
│   │   ├── engine/                  # Exploration engine
│   │   │   ├── ExplorationEngine.ts # Main engine
│   │   │   ├── CycleOrchestrator.ts # Cycle management
│   │   │   └── PromptBuilder.ts     # Prompt construction
│   │   │
│   │   ├── claude/                  # Claude integration
│   │   │   ├── client.ts            # Claude client
│   │   │   ├── streaming.ts         # Stream handling
│   │   │   ├── tools.ts             # Tool definitions
│   │   │   └── prompts.ts           # Prompt templates
│   │   │
│   │   └── utils/                   # Shared utilities
│   │       ├── crypto.ts            # Cryptography
│   │       ├── date.ts              # Date utilities
│   │       └── id.ts                # ID generation
│   │
│   ├── types/                        # TypeScript types
│   │   ├── index.ts                 # Main type exports
│   │   ├── journey.types.ts         # Journey types
│   │   ├── stage.types.ts           # Stage types
│   │   ├── artifact.types.ts        # Artifact types
│   │   ├── ipc.types.ts             # IPC types
│   │   ├── claude.types.ts          # Claude API types
│   │   └── electron.types.ts        # Electron types
│   │
│   └── preload/                      # Preload scripts
│       ├── index.ts                 # Main preload
│       └── api.ts                   # Exposed API
│
├── tests/                            # Test suites
│   ├── unit/                        # Unit tests
│   │   ├── main/                    # Main process tests
│   │   │   ├── services/
│   │   │   └── utils/
│   │   │
│   │   └── renderer/                # Renderer tests
│   │       ├── components/
│   │       ├── hooks/
│   │       └── stores/
│   │
│   ├── integration/                 # Integration tests
│   │   ├── ipc/                    # IPC tests
│   │   ├── database/               # Database tests
│   │   └── engine/                 # Engine tests
│   │
│   ├── e2e/                         # End-to-end tests
│   │   ├── journey.spec.ts         # Journey flows
│   │   ├── artifacts.spec.ts       # Artifact creation
│   │   └── settings.spec.ts        # Settings
│   │
│   └── fixtures/                    # Test fixtures
│       ├── journeys.json
│       ├── stages.json
│       └── artifacts.json
│
├── scripts/                          # Build & utility scripts
│   ├── build.ts                     # Build script
│   ├── dev.ts                       # Dev script
│   ├── package.ts                   # Packaging script
│   ├── migrate-db.ts                # Database migrations
│   └── generate-types.ts            # Type generation
│
├── config/                           # Configuration files
│   ├── vite.main.config.ts          # Vite config (main)
│   ├── vite.renderer.config.ts      # Vite config (renderer)
│   ├── vite.preload.config.ts       # Vite config (preload)
│   ├── tailwind.config.ts           # Tailwind config
│   ├── electron-builder.json        # Electron builder
│   └── vitest.config.ts             # Vitest config
│
├── design/                           # Design assets
│   ├── figma/                       # Figma files
│   ├── assets/                      # Design assets
│   │   ├── icons/
│   │   ├── mockups/
│   │   └── brand/
│   └── exports/                     # Exported assets
│
├── coordination/                     # Swarm coordination
│   └── (Claude-Flow files)
│
├── memory/                           # Persistent memory
│   └── (Memory files)
│
├── .env.example                      # Environment template
├── .gitignore                        # Git ignore
├── .eslintrc.js                      # ESLint config
├── .prettierrc.js                    # Prettier config
├── tsconfig.json                     # Root TypeScript config
├── tsconfig.main.json                # Main process TS config
├── tsconfig.renderer.json            # Renderer TS config
├── package.json                      # Dependencies
├── pnpm-lock.yaml                    # Lock file
│
├── CLAUDE.md                         # Claude instructions
├── PROJECT.md                        # Project overview
├── ARCHITECTURE.md                   # Architecture overview
├── DESIGN-SYSTEM.md                  # Design system
├── ROADMAP.md                        # Development roadmap
├── MILESTONES.md                     # Progress tracking
├── GETTING-STARTED.md                # Quick start guide
└── README.md                         # Project README
```

---

## Directory Purposes

### Root Level

- **docs/** - All documentation (architecture, guides, API docs)
- **src/** - All source code (main, renderer, shared)
- **tests/** - All test suites (unit, integration, e2e)
- **scripts/** - Build and utility scripts
- **config/** - Configuration files
- **design/** - Design assets and mockups

### Source Code Structure

#### Main Process (`src/main/`)
- **index.ts** - Entry point, app initialization
- **app.ts** - Application lifecycle, menu, tray
- **window.ts** - Window creation and management
- **ipc/** - IPC handlers for renderer communication
- **services/** - Core services (database, Claude, files)
- **models/** - Data models and schemas
- **utils/** - Utilities specific to main process

#### Renderer Process (`src/renderer/`)
- **index.tsx** - Renderer entry point
- **App.tsx** - Root React component
- **pages/** - Top-level page components
- **components/** - Reusable React components (organized by domain)
- **hooks/** - Custom React hooks
- **stores/** - Zustand state management
- **services/** - Renderer-side services (IPC client, storage)
- **utils/** - Utilities for renderer
- **styles/** - Global styles and Tailwind
- **assets/** - Static assets (icons, images, fonts)

#### Shared Code (`src/lib/`)
- **engine/** - Exploration engine (core business logic)
- **claude/** - Claude SDK integration
- **utils/** - Utilities used by both processes

#### Types (`src/types/`)
- Centralized TypeScript type definitions
- Shared across main, renderer, and lib
- Organized by domain (journey, stage, artifact, etc.)

#### Preload (`src/preload/`)
- Preload scripts for secure IPC exposure
- Bridges main and renderer processes

---

## Key Architectural Decisions

### 1. Separation of Concerns

**Main Process:**
- System-level operations
- File system access
- Database operations
- Claude API calls
- Security-sensitive operations

**Renderer Process:**
- UI rendering
- User interactions
- State management
- Visual updates

**Shared (lib):**
- Business logic
- Data models
- Utilities

### 2. IPC Communication

All main-renderer communication goes through:
1. Type-safe IPC channels (defined in `types/ipc.types.ts`)
2. Preload script exposes safe API to renderer
3. Main process handlers in `main/ipc/`
4. Renderer service wraps IPC calls in `renderer/services/ipc.service.ts`

### 3. State Management

**Zustand stores** for different domains:
- Journey state (current journey, stages)
- UI state (sidebar, modals, theme)
- Settings (user preferences)
- Auth (API keys, user data)

### 4. Component Organization

Components organized by domain, not by type:
- `components/journey/` - Journey-related components
- `components/artifacts/` - Artifact-related components
- `components/ui/` - Design system primitives
- `components/layout/` - Layout components
- `components/common/` - Shared utilities

### 5. Testing Strategy

Tests mirror source structure:
- `tests/unit/main/` mirrors `src/main/`
- `tests/unit/renderer/` mirrors `src/renderer/`
- `tests/integration/` for cross-process tests
- `tests/e2e/` for full user flows

---

## Build Output Structure

```
dist/
├── main/                    # Compiled main process
│   ├── index.js
│   └── ...
├── renderer/                # Compiled renderer
│   ├── index.html
│   ├── assets/
│   └── ...
├── preload/                 # Compiled preload
│   └── index.js
└── perpetua.db             # Database (user data)
```

---

## File Naming Conventions

- **TypeScript files:** `kebab-case.ts`
- **React components:** `PascalCase.tsx`
- **Test files:** `*.spec.ts` or `*.test.ts`
- **Type files:** `*.types.ts`
- **Config files:** `*.config.ts`
- **Service files:** `*.service.ts`
- **Store files:** `*.store.ts`
- **Hook files:** `use*.ts`

---

## Import Path Aliases

Configure in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@main/*": ["src/main/*"],
      "@renderer/*": ["src/renderer/*"],
      "@lib/*": ["src/lib/*"],
      "@types/*": ["src/types/*"],
      "@components/*": ["src/renderer/components/*"],
      "@hooks/*": ["src/renderer/hooks/*"],
      "@stores/*": ["src/renderer/stores/*"],
      "@utils/*": ["src/renderer/utils/*"],
      "@assets/*": ["src/renderer/assets/*"]
    }
  }
}
```

Usage:
```typescript
// Instead of
import { Button } from '../../../components/ui/Button';

// Use
import { Button } from '@components/ui/Button';
```

---

## Migration Notes

### From Current Structure

Current files will be migrated to:
- `ARCHITECTURE.md` → `docs/architecture/` (broken into multiple files)
- `DESIGN-SYSTEM.md` → Keep at root (reference) + implement in `src/renderer/components/ui/`
- Root `.md` files → Stay at root (quick reference)
- Detailed docs → `docs/` subdirectories

---

## Next Steps

1. Create all directories
2. Set up TypeScript configurations
3. Create initial files (index.ts, App.tsx, etc.)
4. Set up build system (Vite configs)
5. Initialize testing framework

---

**Last Updated:** 2025-10-22
**Status:** Approved
**Version:** 1.0.0
