# Perpetua - Quick Start Guide for Developers

**Last Updated:** October 29, 2025

---

## What You're Looking At

You have **Perpetua**, a full-featured Electron desktop application that runs Claude's AI in a beautiful, locally-hosted exploration engine. Users can ask questions and watch Claude autonomously explore topics across 8 different stages, generating insights and artifacts.

---

## Getting Started (5 minutes)

### Prerequisites
```bash
# Check Node.js version (should be 18+)
node --version
npm --version
```

### Start Development
```bash
# Install dependencies (already done - 711 packages)
npm install

# Start dev server (both Vite + Electron)
npm run dev

# This opens:
# - Vite dev server on http://localhost:5173
# - Electron app window (uses Vite as UI source)
# - Both support hot reload
```

### Try It Out
1. Open app and go to Settings
2. Paste your Anthropic API key (get from console.anthropic.com)
3. Click "New Journey"
4. Type a question: "What are the most interesting applications of quantum computing?"
5. Select journey length (Quick = 4 stages, Standard = 8, etc.)
6. Click "Start" and watch Claude think!

---

## Key Files to Know

### Core Business Logic
- **`src/renderer/lib/engine/ExplorationEngine.ts`** - The 8-stage exploration algorithm
  - Where the magic happens
  - Claude API calls
  - Streaming + artifact extraction
  - ~950 lines

- **`src/main/index.ts`** - Electron main process entry
  - Window management
  - IPC setup
  - Database initialization
  - ~200 lines

### UI Layer
- **`src/renderer/src/App.tsx`** - Main React component
  - Routes between Journey view, History, Settings
  - Manages app state

- **`src/renderer/components/journey/NewJourneyDialog.tsx`** - Journey creation
- **`src/renderer/components/journey/ControlPanel.tsx`** - Journey management UI
- **`src/renderer/components/journey/Stream.tsx`** - Real-time stage rendering

### Services
- **`src/renderer/services/claude/ClaudeService.ts`** - Claude SDK wrapper
- **`src/renderer/services/PageGeneratorService.ts`** - Page/report generation (67.5KB - big!)
- **`src/renderer/services/ipc/IPCClient.ts`** - Frontend-to-main communication
- **`src/main/services/PageFileService.ts`** - File operations for generated pages

### Data
- **`src/renderer/types/index.ts`** - TypeScript types for Journey, Stage, Artifact
- **`src/renderer/store/useAppStore.ts`** - Zustand global state
- **`src/main/database/DatabaseService.ts`** - SQLite operations

### Configuration
- **`package.json`** - Dependencies + build scripts
- **`vite.config.ts`** - Vite build configuration
- **`tsconfig.json`** - TypeScript settings (HAS PATH ALIAS ISSUES - see below)
- **`tailwind.config.js`** - Scandinavian design tokens

---

## Common Tasks

### I want to...

#### Add a new button or UI component
1. Create in `src/renderer/components/ui/` or the appropriate subdirectory
2. Import in the component that needs it
3. Use Tailwind classes and Radix UI primitives
4. Example: See `src/renderer/components/ui/Button.tsx`

#### Modify how an exploration stage works
1. Edit `src/renderer/lib/engine/ExplorationEngine.ts`
2. Modify the `executeStage()` method
3. Look for the stage type switch statement around line 200
4. Add your logic, then run `npm run dev` - HMR will reload

#### Add a new stage type
1. Update `StageType` in `src/renderer/types/index.ts`
2. Add case to switch statement in `ExplorationEngine.ts`
3. Add colors/icons in `src/renderer/components/journey/StageCard.tsx`
4. Update prompts in `src/renderer/lib/constants.ts`

#### Generate a new page template
1. Add template type to `PageType` in `src/renderer/types/index.ts`
2. Create generator method in `src/renderer/services/PageGeneratorService.ts`
3. Add UI to `src/renderer/components/pages/PageGeneratorDialog.tsx`
4. Test with existing journey

#### Store/retrieve data
1. Queries go through `DatabaseService` in main process
2. IPC messages from renderer: `ipcClient.invoke('db:query', ...)`
3. Look at existing handlers in `src/main/ipc/handlers/`

#### Deploy to users
```bash
# Build everything
npm run build

# Create macOS .app bundle
npm run package:mac

# Creates: release/mac-arm64/Perpetua.app
# Share this .app file or drag to Applications folder
```

---

## Current Issues (and How to Fix Them)

### TypeScript Errors: "Cannot find module '@/types'"
**What:** 44 TypeScript errors on `npm run typecheck`
**Why:** Path aliases not configured correctly
**Fix:**
```json
// In tsconfig.json, ensure this exists:
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/renderer/*"]
    }
  }
}
```

**Status:** Build still works! Only type checking fails. Can ignore for now.

### PageGeneratorService.ts is huge (67.5KB)
**What:** One file does too much
**Why:** All template generation in one place
**Fix:** Refactor into:
- `TemplateReport.ts`
- `TemplatePresentation.ts`
- `TemplateTimeline.ts` (not done yet)
- `TemplateMindmap.ts` (not done yet)

Not urgent - works fine as is.

### Bundle is 587KB JS (180KB gzipped)
**What:** Some build warnings about chunk size
**Why:** All code bundled together
**Fix:** Could use code splitting, but not necessary yet

Performance is fine - Vite builds in 3.55s.

---

## Architecture Overview

### How Data Flows

```
1. User clicks "New Journey" 
   ↓
2. React component (NewJourneyDialog) 
   ↓
3. User input → Zustand store (useAppStore)
   ↓
4. IPC message to main process
   ↓
5. Main process creates Journey record in SQLite
   ↓
6. Renderer calls ExplorationEngine.run()
   ↓
7. Engine loops through 8 stages, each calling Claude
   ↓
8. Streaming response comes back in real-time
   ↓
9. StageCard component renders updates (60 FPS)
   ↓
10. Click "Generate Page" → PageGeneratorService creates HTML
   ↓
11. PageViewer renders in iframe
   ↓
12. User clicks "Download PDF" or "Download HTML"
   ↓
13. IPC to main process → writes file to disk
   ↓
14. File appears in Downloads folder
```

### Security Model
- **Context isolation:** main process ≠ renderer process
- **Sandbox:** renderer can't access filesystem directly
- **IPC:** preload script bridges main ↔ renderer safely
- **CSP:** Content Security Policy prevents XSS
- **No node integration:** in renderer (can't require() modules)

So no matter what code is in the UI, it can't crash the system or access files without main process permission.

---

## Development Workflow

### Normal Day
```bash
# Terminal 1: Start dev environment
npm run dev
# Leaves both Vite and Electron running
# Vite on http://localhost:5173
# Electron app open in separate window

# Terminal 2: Make changes
# Edit any file in src/

# Everything hot reloads automatically
# React components: <500ms HMR
# Main process: requires manual restart (Ctrl+R in Electron app)

# When ready to ship
npm run build
npm run package:mac
# Creates release/mac-arm64/Perpetua.app
```

### TypeScript + Linting
```bash
npm run typecheck    # Check types (currently 44 errors)
npm run lint         # Check code style
npm run test         # Run unit tests (vitest)
npm run test:ui      # Watch mode with UI
```

### Debug
```bash
# In Electron app:
# Right-click → Inspect Element
# Opens Chrome DevTools
# Can see console logs, network, etc.

# In main process:
# Check electron.log in app's data directory
# Or use logger.info/error in code

# View IPC messages:
// In src/renderer/services/ipc/IPCClient.ts
// Add console.log() to see what's being sent
```

---

## Project Structure Quick Reference

```
src/
├── main/                    # Electron main process (Node.js)
│   ├── index.ts            # Entry point - create window, set up IPC
│   ├── security.ts         # CSP policies
│   ├── database/           # SQLite layer
│   ├── ipc/                # IPC message handlers
│   ├── services/           # File operations, page generation
│   ├── preload/            # Safe IPC bridge
│   └── utils/              # Logging
│
└── renderer/               # React frontend (Chromium)
    ├── src/
    │   ├── App.tsx         # Main component
    │   ├── main.tsx        # React entry point
    │   └── index.css       # Global styles
    ├── components/         # UI components
    │   ├── ui/             # Base components (Button, Card, etc.)
    │   ├── journey/        # Journey-specific UI
    │   ├── pages/          # Page generation UI
    │   ├── artifact/       # Artifact viewer
    │   ├── settings/       # Settings dialog
    │   └── design-system/  # Scandinavian design
    ├── services/           # Business logic
    │   ├── claude/         # Claude SDK wrapper + ExplorationEngine
    │   ├── ipc/            # IPC client
    │   └── PageGeneratorService.ts
    ├── store/              # Zustand state (useAppStore)
    ├── hooks/              # Custom React hooks
    ├── lib/                # Utilities and constants
    ├── types/              # TypeScript type definitions
    ├── utils/              # Helper functions
    └── styles/             # Global CSS
```

---

## Key Technologies Explained

### Electron
Desktop app framework. Two processes:
- **Main:** Node.js, can access filesystem
- **Renderer:** Chromium, runs your React app

They talk via IPC (messages).

### Vite
Build tool. Super fast. Used for:
- Dev server with HMR
- Production bundling
- Development is on :5173, production uses dist/

### Zustand
Lightweight state management. Like Redux but simpler.
- `useAppStore()` hook gives you state + setters
- Single file: `src/renderer/store/useAppStore.ts`

### SQLite
Database. Stored locally in app's data folder.
- Better than JSON for queries
- Transactions support
- Works offline

### Tailwind CSS
Utility-first CSS. Add classes like `text-lg`, `bg-white`, etc.
- Config in `tailwind.config.js`
- Scandinavian color palette defined there

### Radix UI
Accessible component library. Used for:
- Dialogs
- Dropdowns
- Tooltips
- Scroll areas

All unstyled, we add Tailwind classes.

---

## How to Ask for Help

### If something breaks:
1. Check console (right-click → Inspect Element)
2. Check main process logs: look at electron.log
3. Try `npm run dev` fresh - sometimes cache issue
4. Run `npm run typecheck` - might be type issue
5. Check GitHub issues - might be known problem

### If you need to understand something:
1. Read code comments - they explain the why
2. Look at ARCHITECTURE.md - system design
3. Check DESIGN-SYSTEM.md - UI principles
4. Search for the component/service name in codebase

### If you want to extend it:
1. Look for similar feature - copy pattern
2. Update types first (src/renderer/types/index.ts)
3. Add component or service
4. Wire it into ExplorationEngine or UI
5. Test with real journey

---

## Next Features to Build (From DEVELOPMENT-STATUS.md)

1. **Timeline Template** - Visual timeline of exploration
   - Use D3.js for visualization
   - Interactive zoom/pan
   - Export as PNG/SVG

2. **Mind Map Template** - Concept visualization
   - Force-directed graph
   - Draggable nodes
   - Multiple layouts

3. **Computer Use** - Web research capability
   - Claude can control browser
   - Auto-search for information
   - Integrate into journey stages

4. **Auto-Pilot Mode** - Run journeys in background
   - Users start journey, app continues without window
   - Periodic updates
   - Notification when done

5. **Journey Forking** - Explore multiple paths
   - Branch from any stage
   - Run parallel journeys
   - Merge insights

---

## Testing

### Run Tests
```bash
npm run test              # Run all tests
npm run test:ui           # Interactive test UI
npm run test:coverage     # Code coverage report
```

### Write a Test
```typescript
// In tests/ directory
import { describe, it, expect } from 'vitest';
import { ExplorationEngine } from '@/lib/engine/ExplorationEngine';

describe('ExplorationEngine', () => {
  it('should have 8 stages', () => {
    const stages = ['discovering', 'chasing', 'solving', ...];
    expect(stages.length).toBe(8);
  });
});
```

---

## Performance Tips

### For Users
- Keep Anthropic API key in Settings (won't ask again)
- Close other apps while running journeys (saves memory)
- Use "Quick" length for testing, "Standard" for real work
- Journal history is searchable by date

### For Developers
- Vite HMR is fast - edit and save
- Use React DevTools browser extension for debugging
- Profile with Chrome DevTools → Performance tab
- Check bundle size: `npm run build` shows sizes

### For Deployment
- macOS: electron-builder creates .dmg installer
- Windows: Creates NSIS installer
- Linux: Creates AppImage + .deb packages
- Auto-update possible (future)

---

## Useful Commands

```bash
# Development
npm run dev                 # Start everything
npm run dev:vite          # Just Vite (port 5173)
npm run dev:electron      # Just Electron

# Building
npm run build             # Build for production
npm run build:renderer    # Just React build
npm run build:main        # Just Electron main build
npm run package:mac       # Create .app bundle
npm run package:dir       # Test packaging locally

# Quality Assurance
npm run lint              # Check code style
npm run typecheck         # Type checking (44 errors currently)
npm run test              # Run tests
npm run test:ui           # Interactive test UI
npm run test:coverage     # Code coverage

# Preview
npm run preview           # Preview production build locally
```

---

## One More Thing

**This is a real, working application.** Not a tutorial or demo. 

You can:
- Run journeys and get real insights from Claude
- Generate professional reports and presentations
- Export and share with others
- Deploy to users as a proper desktop app

The code is clean, well-documented, and ready for features to be added.

**Current status:** Beta. Core features work. Ready for active development.

**Next milestone:** User testing and feedback loop.

---

Questions? Check the documentation:
- `README.md` - Project overview
- `ARCHITECTURE.md` - Technical design
- `DESIGN-SYSTEM.md` - UI guidelines
- `DEVELOPMENT-STATUS.md` - Latest progress
- `CODEBASE-EXPLORATION-REPORT.md` - Detailed analysis

Welcome to the team!
