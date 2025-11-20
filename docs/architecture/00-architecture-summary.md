# Perpetua - Complete Architecture Summary

**Document Type:** Architecture Overview
**Status:** Approved
**Last Updated:** 2025-10-22
**Version:** 1.0.0

---

## Quick Reference

This document provides a high-level overview of Perpetua's complete architecture. For detailed specifications, see the individual architecture documents.

---

## Architecture Documents

### Core Architecture
1. **[Folder Structure](./01-folder-structure.md)** - Complete project organization
2. **[IPC Architecture](./02-ipc-architecture.md)** - Inter-process communication patterns
3. **[TypeScript Configuration](./03-typescript-configuration.md)** - Type system setup
4. **[Build System](./04-build-system.md)** - Vite build configuration
5. **[Database Layer](./05-database-layer.md)** - SQLite integration

### Architecture Decision Records (ADRs)
- **[ADR 001: Electron Framework](./10-adrs/001-electron-framework.md)**
- **[ADR 002: React State Management](./10-adrs/002-react-state-management.md)**
- **[ADR 003: SQLite Database](./10-adrs/003-sqlite-database.md)**
- **[ADR 004: Vite Build Tool](./10-adrs/004-vite-build-tool.md)**

---

## Technology Stack

### Desktop Framework
- **Electron 28+** - Desktop application framework
- **Node.js 18+** - Main process runtime
- **Chromium** - Renderer process

### Frontend
- **React 18** - UI library with concurrent features
- **TypeScript 5** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first styling
- **Framer Motion** - Animations
- **Radix UI** - Accessible primitives

### State Management
- **Zustand** - Global state (journeys, UI)
- **React Query** - Server state (IPC)
- **Jotai** - Atomic state (when needed)

### Data Layer
- **SQLite** - Local database (better-sqlite3)
- **Node.js fs** - File system operations

### AI Integration
- **@anthropic-ai/sdk** - Claude API client
- **Extended Thinking** - Deep reasoning capability
- **Puppeteer** - Computer Use implementation

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PERPETUA DESKTOP APP                     │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │         RENDERER PROCESS (React)                      │ │
│  │  • UI Components (Scandinavian design)               │ │
│  │  • State Management (Zustand)                        │ │
│  │  • IPC Client (type-safe)                            │ │
│  └───────────────────────────────────────────────────────┘ │
│                            ↕ IPC                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │         MAIN PROCESS (Node.js)                        │ │
│  │  • Window Management                                  │ │
│  │  • IPC Handlers                                       │ │
│  │  • Services (Database, Claude, Files)                │ │
│  │  • Exploration Engine                                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                            ↕                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │         LOCAL STORAGE                                 │ │
│  │  • SQLite Database (perpetua.db)                      │ │
│  │  • File System (artifacts/)                           │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
│  • Anthropic Claude API                                     │
│  • Web (via Puppeteer)                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Architectural Decisions

### 1. Electron Framework
**Why:** Mature ecosystem, excellent OS integration, TypeScript support
**Trade-off:** Larger bundle size (~150MB) for better DX and ecosystem

### 2. Zustand State Management
**Why:** Minimal boilerplate, excellent TypeScript, small bundle (~1KB)
**Trade-off:** Smaller ecosystem than Redux (acceptable for our needs)

### 3. SQLite with better-sqlite3
**Why:** Fast synchronous operations, ACID transactions, full-text search
**Trade-off:** Synchronous API (acceptable in main process)

### 4. Vite Build Tool
**Why:** Lightning-fast HMR (<100ms), modern architecture, great DX
**Trade-off:** Newer ecosystem (acceptable, rapidly maturing)

### 5. Type-Safe IPC
**Why:** Compile-time safety, better DX, fewer runtime errors
**Trade-off:** More upfront type definitions (pays off quickly)

---

## Project Structure Summary

```
Perpetua/
├── docs/
│   └── architecture/          # Architecture documentation
│       ├── 00-architecture-summary.md
│       ├── 01-folder-structure.md
│       ├── 02-ipc-architecture.md
│       ├── 03-typescript-configuration.md
│       ├── 04-build-system.md
│       ├── 05-database-layer.md
│       └── 10-adrs/           # Architecture Decision Records
│
├── src/
│   ├── main/                  # Electron main process
│   │   ├── index.ts
│   │   ├── ipc/              # IPC handlers
│   │   ├── services/         # Core services
│   │   └── models/           # Data models
│   │
│   ├── renderer/             # React application
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── stores/           # Zustand stores
│   │   └── styles/           # Global styles
│   │
│   ├── preload/              # Preload scripts
│   │   └── index.ts
│   │
│   ├── lib/                  # Shared code
│   │   ├── engine/           # Exploration engine
│   │   └── claude/           # Claude integration
│   │
│   └── types/                # TypeScript types
│       ├── journey.types.ts
│       ├── ipc.types.ts
│       └── claude.types.ts
│
├── tests/                    # Test suites
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── config/                   # Configuration files
│   ├── vite.main.config.ts
│   ├── vite.renderer.config.ts
│   └── electron-builder.json
│
└── scripts/                  # Build scripts
```

---

## Security Architecture

### Context Isolation
- **Enabled:** Renderer process is fully isolated
- **No Node Integration:** Renderer cannot access Node.js
- **Preload Script:** Safe API exposed via contextBridge

### IPC Security
- **Input Validation:** All IPC messages validated
- **Type Safety:** Compile-time type checking
- **Error Handling:** Graceful error messages

### API Key Storage
- **Electron safeStorage:** Encrypted API key storage
- **Never in Renderer:** API keys only in main process
- **No Logging:** Sensitive data never logged

---

## Performance Strategy

### Development
- **HMR:** <100ms updates (Vite)
- **Type Checking:** Parallel with dev server
- **Instant Server Start:** <1 second

### Production
- **Code Splitting:** Lazy load pages
- **Tree Shaking:** Remove unused code
- **Minification:** esbuild for speed
- **Bundle Analysis:** Identify large dependencies

### Runtime
- **Virtual Scrolling:** For long stage lists
- **Memoization:** React.memo, useMemo, useCallback
- **Database Indexing:** Fast queries
- **IPC Batching:** Reduce message overhead

---

## Testing Strategy

### Unit Tests (Vitest)
- **Main Services:** Database, Claude, Files
- **React Components:** Testing Library
- **Stores:** Zustand stores
- **Utilities:** Pure functions

### Integration Tests
- **IPC Communication:** End-to-end IPC flows
- **Database Operations:** Multi-step transactions
- **Engine Logic:** Complete stage cycles

### E2E Tests (Playwright)
- **User Flows:** Complete journey creation
- **Artifact Generation:** Full workflows
- **Settings Management:** Configuration flows

---

## Development Workflow

### 1. Setup
```bash
pnpm install
cp .env.example .env
# Add ANTHROPIC_API_KEY
```

### 2. Development
```bash
pnpm dev
# Opens Electron with HMR
# Main process: watch mode
# Renderer: Vite dev server
```

### 3. Type Checking
```bash
pnpm typecheck
# Checks all TypeScript
```

### 4. Testing
```bash
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
pnpm test:ui       # UI mode
```

### 5. Building
```bash
pnpm build         # Build all processes
pnpm package       # Package for platform
```

---

## Production Build

### Output Structure
```
dist/
├── main/          # Main process bundle
├── renderer/      # Renderer process bundle
└── preload/       # Preload script bundle

release/
├── Perpetua-1.0.0.dmg         (macOS)
├── Perpetua Setup 1.0.0.exe   (Windows)
└── Perpetua-1.0.0.AppImage    (Linux)
```

### Performance Targets
- **App Launch:** <2 seconds
- **HMR Update:** <100ms
- **Production Build:** <60 seconds
- **Bundle Size:** <50MB (compressed)
- **Memory Usage:** <200MB (idle)

---

## Next Steps for Implementation

### Phase 1: Foundation (Week 1)
1. Initialize project structure
2. Configure TypeScript (3 configs)
3. Set up Vite build system
4. Create basic Electron shell
5. Implement IPC infrastructure

### Phase 2: Core Services (Week 2)
1. Database service with SQLite
2. Claude SDK integration
3. Exploration engine
4. File service
5. Settings management

### Phase 3: UI Layer (Week 3-4)
1. Design system components
2. Journey stream UI
3. Stage cards
4. Artifact viewer
5. Control panel

### Phase 4: Integration (Week 5)
1. Connect UI to services
2. Implement real-time updates
3. Add animations
4. Polish interactions
5. Comprehensive testing

---

## Monitoring & Debugging

### Development
- **Chrome DevTools:** Full debugging for renderer
- **Main Process Logs:** electron-log
- **IPC Logging:** Custom middleware
- **Redux DevTools:** For Zustand

### Production
- **Error Tracking:** Optional Sentry integration
- **Performance Monitoring:** electron-log with metrics
- **Crash Reporting:** Electron crashReporter

---

## Documentation Standards

### Code Documentation
- **JSDoc:** For public APIs
- **README:** In each major directory
- **Architecture Docs:** For major decisions
- **ADRs:** For key choices

### Type Documentation
- **TypeScript Types:** Self-documenting
- **Interface Comments:** For complex types
- **Examples:** In type files

---

## Related Documents

- **[Project Overview](../../PROJECT.md)** - High-level project description
- **[Design System](../../DESIGN-SYSTEM.md)** - Scandinavian design principles
- **[Roadmap](../../ROADMAP.md)** - Development timeline
- **[Getting Started](../../GETTING-STARTED.md)** - Quick start guide

---

## Maintenance

### Regular Reviews
- **Quarterly:** Architecture review
- **Per Feature:** ADR updates
- **Version Bumps:** Dependency updates

### Version Control
- **Semantic Versioning:** Major.Minor.Patch
- **Changelog:** Keep updated
- **Migration Guides:** For breaking changes

---

**Architecture Approved By:** System Architect
**Date:** 2025-10-22
**Status:** Ready for Implementation
**Version:** 1.0.0

---

**"A well-architected system is invisible to users, essential to developers."**
