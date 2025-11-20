# Development Setup Guide

Get Perpetua up and running on your local machine.

---

## Prerequisites

### Required

- **Node.js** 18+ and npm/pnpm
  - Download: https://nodejs.org/
  - Or use [nvm](https://github.com/nvm-sh/nvm): `nvm install 18`

- **Git**
  - Download: https://git-scm.com/

- **Anthropic API Key**
  - Sign up: https://console.anthropic.com/
  - Get API key from dashboard

### Recommended

- **VS Code**
  - Download: https://code.visualstudio.com/
  - Install recommended extensions (see below)

- **pnpm** (faster than npm)
  ```bash
  npm install -g pnpm
  ```

---

## Installation

### 1. Clone the Repository

```bash
git clone [repository-url]
cd Odyssey
```

### 2. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### 3. Set Up Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Open .env and add your API key
# ANTHROPIC_API_KEY=your_actual_api_key_here
```

### 4. Verify Setup

```bash
# Run tests
pnpm test

# Start development server
pnpm dev
```

If the app launches successfully, you're ready to develop! 🎉

---

## Development Workflow

### Running the App

```bash
# Development mode with hot reload
pnpm dev

# Watch mode (rebuild on changes)
pnpm watch

# Check types
pnpm typecheck

# Lint code
pnpm lint

# Format code
pnpm format
```

### Building

```bash
# Build for development
pnpm build

# Build for production
pnpm build:prod

# Build for specific platform
pnpm build:mac
pnpm build:win
pnpm build:linux
```

### Testing

```bash
# Run all tests
pnpm test

# Run unit tests
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run e2e tests
pnpm test:e2e

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

---

## VS Code Setup

### Recommended Extensions

Install these for the best development experience:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "orta.vscode-jest",
    "ms-playwright.playwright"
  ]
}
```

### Workspace Settings

Save this as `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

---

## Project Structure

```
Odyssey/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Main entry point
│   │   ├── window.ts      # Window management
│   │   └── ipc.ts         # IPC handlers
│   │
│   ├── renderer/          # React app (renderer process)
│   │   ├── main.tsx       # React entry point
│   │   ├── App.tsx        # Root component
│   │   │
│   │   ├── components/    # React components
│   │   │   ├── Stream/
│   │   │   ├── StageCard/
│   │   │   └── ControlPanel/
│   │   │
│   │   ├── lib/           # Core libraries
│   │   │   ├── engine/    # Exploration engine
│   │   │   └── claude/    # Claude integration
│   │   │
│   │   ├── services/      # Services
│   │   │   ├── database.ts
│   │   │   ├── claude.ts
│   │   │   └── computer-use.ts
│   │   │
│   │   ├── store/         # State management
│   │   │   ├── journey.ts
│   │   │   └── ui.ts
│   │   │
│   │   ├── hooks/         # Custom React hooks
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   │
│   └── shared/            # Shared between main and renderer
│
├── tests/                 # Tests
├── docs/                  # Documentation
├── design/                # Design assets
└── scripts/               # Build scripts
```

---

## Common Tasks

### Adding a New Component

```bash
# Create component folder
mkdir -p src/renderer/components/MyComponent

# Create files
touch src/renderer/components/MyComponent/index.tsx
touch src/renderer/components/MyComponent/MyComponent.tsx
touch src/renderer/components/MyComponent/MyComponent.test.tsx
```

**Component template:**

```tsx
// src/renderer/components/MyComponent/MyComponent.tsx

import React from 'react';

interface MyComponentProps {
  // Props
}

export function MyComponent({}: MyComponentProps) {
  return (
    <div className="p-4">
      {/* Component content */}
    </div>
  );
}
```

### Adding a New Service

```typescript
// src/renderer/services/my-service.ts

export class MyService {
  constructor() {
    // Initialize
  }

  async doSomething() {
    // Implementation
  }
}
```

### Adding State

```typescript
// src/renderer/store/my-store.ts

import { create } from 'zustand';

interface MyState {
  value: string;
  setValue: (value: string) => void;
}

export const useMyStore = create<MyState>((set) => ({
  value: '',
  setValue: (value) => set({ value }),
}));
```

---

## Debugging

### Renderer Process (React)

1. Start dev server: `pnpm dev`
2. Open DevTools: `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows)
3. Use React DevTools extension
4. Set breakpoints in Sources tab

### Main Process (Electron)

**VS Code Debugger:**

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "args": [".", "--remote-debugging-port=9223"],
      "outputCapture": "std"
    }
  ]
}
```

**Console Logs:**

```typescript
// Main process logs go to terminal where you ran `pnpm dev`
console.log('From main process');

// Renderer logs go to DevTools console
console.log('From renderer');
```

---

## Troubleshooting

### "Module not found"

```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install
```

### "TypeScript errors"

```bash
# Restart TypeScript server in VS Code
Cmd+Shift+P → "TypeScript: Restart TS Server"

# Or check types manually
pnpm typecheck
```

### "Electron won't start"

```bash
# Clear Electron cache
rm -rf ~/.electron

# Rebuild native modules
pnpm rebuild
```

### "Database locked"

```bash
# Kill any running instances
pkill -f electron

# Delete database file (data will be lost!)
rm perpetua.db
```

---

## Performance Tips

### Fast Feedback Loop

1. Use `pnpm dev` for instant hot reload
2. Keep DevTools open for quick debugging
3. Use React DevTools Profiler for performance
4. Run tests in watch mode: `pnpm test:watch`

### Build Optimization

```bash
# Analyze bundle size
pnpm analyze

# Production build (optimized)
pnpm build:prod
```

---

## Getting Help

### In Order:

1. **Check documentation**
   - [PROJECT.md](../PROJECT.md)
   - [ARCHITECTURE.md](../ARCHITECTURE.md)
   - [DESIGN-SYSTEM.md](../DESIGN-SYSTEM.md)

2. **Search existing issues**
   - GitHub Issues tab

3. **Ask the team**
   - GitHub Discussions
   - Discord (when available)

4. **Create an issue**
   - Use issue templates
   - Include reproduction steps

---

## Next Steps

Once you're set up:

1. Read [ARCHITECTURE.md](../ARCHITECTURE.md) to understand the codebase
2. Check [MILESTONES.md](../MILESTONES.md) for current sprint goals
3. Pick an issue labeled `good-first-issue`
4. Start coding!

---

**Happy coding! 🚀**
