# Perpetua Architecture Documentation

**Welcome to Perpetua's comprehensive architecture documentation.**

This directory contains detailed technical specifications, architectural decisions, and implementation guidelines for the Perpetua desktop application.

---

## 📚 Documentation Index

### Core Architecture Documents

1. **[Architecture Summary](./00-architecture-summary.md)** ⭐ START HERE
   - High-level overview
   - Technology stack
   - Key decisions
   - Quick reference

2. **[Folder Structure](./01-folder-structure.md)**
   - Complete project organization
   - Directory purposes
   - File naming conventions
   - Import path aliases

3. **[IPC Architecture](./02-ipc-architecture.md)**
   - Inter-process communication patterns
   - Type-safe IPC channels
   - Preload script design
   - Security measures

4. **[TypeScript Configuration](./03-typescript-configuration.md)**
   - Three-config setup (main, renderer, preload)
   - Path aliases
   - Strict mode settings
   - Type-safe patterns

5. **[Build System](./04-build-system.md)**
   - Vite configuration
   - Development workflow
   - Production builds
   - Optimization strategies

6. **[Database Layer](./05-database-layer.md)**
   - SQLite schema design
   - Type-safe database service
   - Migrations
   - Query patterns

---

## 🎯 Architecture Decision Records (ADRs)

Located in **[10-adrs/](./10-adrs/)**:

- **[ADR 001: Electron Framework](./10-adrs/001-electron-framework.md)**
  - Why Electron over Tauri, NW.js, PWA
  - Trade-offs and rationale

- **[ADR 002: React State Management](./10-adrs/002-react-state-management.md)**
  - Why Zustand over Redux, MobX, Context
  - Store structure and patterns

- **[ADR 003: SQLite Database](./10-adrs/003-sqlite-database.md)**
  - Why better-sqlite3 over alternatives
  - Schema design principles

- **[ADR 004: Vite Build Tool](./10-adrs/004-vite-build-tool.md)**
  - Why Vite over Webpack, Rollup, esbuild
  - Configuration strategy

---

## 🎨 Design & Implementation

### Component Architecture
- **Design System:** See `/docs/design-system/` (to be created)
- **Component Library:** Scandinavian design principles
- **UI Patterns:** Documented in `/DESIGN-SYSTEM.md`

### State Management
- **Zustand Stores:** Journey, UI, Settings, Auth
- **React Query:** IPC state synchronization
- **Local State:** Component-level with hooks

### Service Layer
- **Main Process Services:** Database, Claude, Files, Computer Use
- **Renderer Services:** IPC client, storage, analytics

---

## 🔐 Security Architecture

### Key Principles
1. **Context Isolation:** Renderer process fully isolated
2. **No Node Integration:** Renderer cannot access Node.js directly
3. **Type-Safe IPC:** Compile-time safety for all messages
4. **Input Validation:** All IPC inputs validated
5. **Secure Storage:** API keys encrypted with safeStorage

### Implementation
- See **[IPC Architecture](./02-ipc-architecture.md)** for details
- Security checklist in each ADR

---

## 🚀 Getting Started

### For Developers

1. **Read First:**
   - [Architecture Summary](./00-architecture-summary.md)
   - [Folder Structure](./01-folder-structure.md)

2. **Understand Key Concepts:**
   - [IPC Architecture](./02-ipc-architecture.md)
   - [TypeScript Configuration](./03-typescript-configuration.md)

3. **Set Up Development:**
   - [Build System](./04-build-system.md)
   - `/docs/guides/setup.md` (to be created)

4. **Dive Into Implementation:**
   - [Database Layer](./05-database-layer.md)
   - ADRs for decision context

### For Architects

1. **Review Decisions:**
   - All ADRs in `10-adrs/`
   - Architecture Summary

2. **Understand Trade-offs:**
   - Each ADR documents alternatives considered
   - Rationale and consequences

3. **Propose Changes:**
   - Create new ADR with number
   - Document alternatives
   - Get team review

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PERPETUA DESKTOP APP                     │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │         RENDERER PROCESS (React + TypeScript)         │ │
│  │  • Components (Scandinavian Design)                   │ │
│  │  • Zustand Stores (State Management)                  │ │
│  │  • IPC Client (Type-Safe)                             │ │
│  │  • Hooks & Utilities                                  │ │
│  └───────────────────────────────────────────────────────┘ │
│                            ↕ IPC                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │         MAIN PROCESS (Node.js + TypeScript)           │ │
│  │  • IPC Handlers                                       │ │
│  │  • Services (Database, Claude, Files)                 │ │
│  │  • Exploration Engine                                 │ │
│  │  • Window Management                                  │ │
│  └───────────────────────────────────────────────────────┘ │
│                            ↕                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │         LOCAL STORAGE (SQLite + FileSystem)           │ │
│  │  • Journeys, Stages, Artifacts                        │ │
│  │  • Full-Text Search                                   │ │
│  │  • Settings & Preferences                             │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
│  • Claude API (Anthropic)                                   │
│  • Web (via Puppeteer for Computer Use)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack Summary

### Core
- **Electron 28+** - Desktop framework
- **React 18** - UI library
- **TypeScript 5** - Type safety
- **Vite** - Build tool

### State & Data
- **Zustand** - State management
- **SQLite** - Local database (better-sqlite3)
- **React Query** - Server state

### Styling
- **TailwindCSS** - Utility-first CSS
- **Framer Motion** - Animations
- **Radix UI** - Accessible primitives

### AI & Automation
- **@anthropic-ai/sdk** - Claude integration
- **Puppeteer** - Browser automation

---

## 📝 Documentation Standards

### Architecture Documents
- **Format:** Markdown
- **Structure:** Consistent sections
- **Code Examples:** TypeScript with types
- **Diagrams:** ASCII art or links to external

### ADRs (Architecture Decision Records)
- **Format:** Standard ADR template
- **Numbering:** Sequential (001, 002, ...)
- **Status:** Proposed → Accepted → Deprecated
- **Sections:** Context, Decision, Consequences

### Code Documentation
- **JSDoc:** For public APIs
- **Inline Comments:** For complex logic
- **Type Comments:** For non-obvious types
- **README:** In each major directory

---

## 🔄 Maintenance & Updates

### When to Update

1. **New Features:**
   - Update relevant architecture docs
   - Create ADR if major decision

2. **Technology Changes:**
   - Create new ADR
   - Update affected documents
   - Document migration path

3. **Refactoring:**
   - Update implementation details
   - Keep ADRs as historical record

### Review Cadence
- **Quarterly:** Full architecture review
- **Per Feature:** Targeted updates
- **Per Release:** Verification of accuracy

---

## 🤝 Contributing

### Adding New Architecture Docs

1. **Create Document:**
   ```
   docs/architecture/XX-topic-name.md
   ```

2. **Follow Template:**
   - Document Type
   - Status
   - Last Updated
   - Version

3. **Update This README:**
   - Add to index
   - Update overview if needed

### Creating New ADRs

1. **Use Next Number:**
   ```
   docs/architecture/10-adrs/00X-decision-name.md
   ```

2. **Follow ADR Template:**
   - Status
   - Context
   - Decision Drivers
   - Considered Options
   - Decision Outcome
   - Consequences

3. **Get Review:**
   - Technical lead review
   - Team discussion
   - Approval before implementation

---

## 📞 Questions & Support

### Architecture Questions
- **GitHub Discussions:** Architecture category
- **Issues:** Tag with `architecture` label
- **Team Sync:** Weekly architecture review

### Documentation Issues
- **GitHub Issues:** `documentation` label
- **Pull Requests:** Direct fixes welcome
- **Suggestions:** Open discussion first

---

## 🔗 Related Resources

### Internal
- [Project Overview](/PROJECT.md)
- [Design System](/DESIGN-SYSTEM.md)
- [Roadmap](/ROADMAP.md)
- [Getting Started](/GETTING-STARTED.md)

### External
- [Electron Documentation](https://www.electronjs.org/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

---

## 📜 License

This documentation is part of the Perpetua project.
See [LICENSE](/LICENSE) for details.

---

**Last Updated:** 2025-10-22
**Maintained By:** System Architect
**Version:** 1.0.0

---

**"Good architecture is invisible to users, essential to developers."**
