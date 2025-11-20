# Build System Architecture

**Document Type:** Architecture Specification
**Status:** Approved
**Last Updated:** 2025-10-22
**Version:** 1.0.0

---

## Overview

Perpetua uses **Vite** as the build tool for both main and renderer processes. Vite provides:
- ⚡ Lightning-fast HMR (Hot Module Replacement)
- 📦 Optimized production builds with Rollup
- 🔧 Simple configuration
- 🎯 First-class TypeScript support

---

## Build Architecture

```
Source                  Build Tool              Output
─────────────────────────────────────────────────────────
src/main/          →    Vite (ESBuild)    →    dist/main/
src/renderer/      →    Vite (Rollup)     →    dist/renderer/
src/preload/       →    Vite (ESBuild)    →    dist/preload/
```

---

## Configuration Files

### 1. Main Process (vite.main.config.ts)

```typescript
import { defineConfig } from 'vite';
import { builtinModules } from 'module';
import path from 'path';

export default defineConfig({
  build: {
    target: 'node18',
    outDir: 'dist/main',
    lib: {
      entry: 'src/main/index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: [
        'electron',
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`),
      ],
      output: {
        entryFileNames: '[name].js',
      },
    },
    minify: process.env.NODE_ENV === 'production',
    sourcemap: process.env.NODE_ENV !== 'production',
  },
  resolve: {
    alias: {
      '@main': path.resolve(__dirname, 'src/main'),
      '@lib': path.resolve(__dirname, 'src/lib'),
      '@types': path.resolve(__dirname, 'src/types'),
    },
  },
});
```

### 2. Renderer Process (vite.renderer.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
      // Babel plugins
      babel: {
        plugins: [
          // Add any Babel plugins here
        ],
      },
    }),
  ],
  base: './', // Important for Electron
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
    minify: 'esbuild',
    sourcemap: process.env.NODE_ENV !== 'production',
    target: 'chrome118', // Match Electron's Chromium version
  },
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@lib': path.resolve(__dirname, 'src/lib'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@components': path.resolve(__dirname, 'src/renderer/components'),
      '@hooks': path.resolve(__dirname, 'src/renderer/hooks'),
      '@stores': path.resolve(__dirname, 'src/renderer/stores'),
      '@utils': path.resolve(__dirname, 'src/renderer/utils'),
      '@assets': path.resolve(__dirname, 'src/renderer/assets'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  css: {
    postcss: './postcss.config.js',
  },
});
```

### 3. Preload Script (vite.preload.config.ts)

```typescript
import { defineConfig } from 'vite';
import { builtinModules } from 'module';
import path from 'path';

export default defineConfig({
  build: {
    target: 'chrome118',
    outDir: 'dist/preload',
    lib: {
      entry: 'src/preload/index.ts',
      formats: ['cjs'], // CommonJS for Electron preload
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: [
        'electron',
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`),
      ],
    },
    minify: process.env.NODE_ENV === 'production',
    sourcemap: process.env.NODE_ENV !== 'production',
  },
  resolve: {
    alias: {
      '@types': path.resolve(__dirname, 'src/types'),
    },
  },
});
```

---

## Package Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:main\" \"npm run dev:renderer\" \"npm run dev:electron\"",
    "dev:main": "vite build --config vite.main.config.ts --watch",
    "dev:renderer": "vite --config vite.renderer.config.ts",
    "dev:preload": "vite build --config vite.preload.config.ts --watch",
    "dev:electron": "wait-on dist/main/index.js dist/renderer/index.html && electron .",

    "build": "npm run build:main && npm run build:renderer && npm run build:preload",
    "build:main": "vite build --config vite.main.config.ts",
    "build:renderer": "vite build --config vite.renderer.config.ts",
    "build:preload": "vite build --config vite.preload.config.ts",

    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\"",

    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",

    "package": "electron-builder",
    "package:mac": "electron-builder --mac",
    "package:win": "electron-builder --win",
    "package:linux": "electron-builder --linux"
  }
}
```

---

## Electron Builder Configuration

### electron-builder.json

```json
{
  "appId": "com.perpetua.app",
  "productName": "Perpetua",
  "directories": {
    "output": "release",
    "buildResources": "build"
  },
  "files": [
    "dist/**/*",
    "package.json"
  ],
  "extraMetadata": {
    "main": "dist/main/index.js"
  },
  "mac": {
    "target": ["dmg", "zip"],
    "category": "public.app-category.productivity",
    "icon": "build/icon.icns",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist"
  },
  "dmg": {
    "contents": [
      {
        "x": 130,
        "y": 220
      },
      {
        "x": 410,
        "y": 220,
        "type": "link",
        "path": "/Applications"
      }
    ]
  },
  "win": {
    "target": ["nsis", "portable"],
    "icon": "build/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "category": "Utility",
    "icon": "build/icon.png"
  }
}
```

---

## Development Workflow

### 1. Hot Module Replacement (HMR)

Renderer process has instant HMR:

```typescript
// src/renderer/App.tsx
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('HMR update');
  });
}
```

### 2. Watch Mode

Main and preload processes rebuild on change:

```bash
npm run dev
# Runs:
# - Main process in watch mode
# - Preload in watch mode
# - Renderer with HMR
# - Electron with auto-restart
```

### 3. Environment Variables

```env
# .env
VITE_APP_NAME=Perpetua
VITE_API_URL=https://api.anthropic.com
```

```typescript
// Access in renderer
const appName = import.meta.env.VITE_APP_NAME;

// Access in main (via process.env)
const apiUrl = process.env.VITE_API_URL;
```

---

## CSS & Styling

### PostCSS Configuration

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/renderer/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Perpetua color system
        primary: {
          50: '#F0F7FF',
          500: '#2E96FF',
          900: '#062E5F',
        },
        // ... more colors
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## Optimization Strategies

### 1. Code Splitting

```typescript
// Lazy load pages
const Journey = lazy(() => import('./pages/Journey'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));

// Use Suspense
<Suspense fallback={<LoadingState />}>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/journey" element={<Journey />} />
    <Route path="/history" element={<History />} />
    <Route path="/settings" element={<Settings />} />
  </Routes>
</Suspense>
```

### 2. Tree Shaking

```typescript
// ✅ Good - Tree-shakeable
import { Button } from '@components/ui/Button';

// ❌ Bad - Not tree-shakeable
import * as UI from '@components/ui';
```

### 3. Bundle Analysis

```bash
# Install bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  visualizer({
    open: true,
    gzipSize: true,
  }),
]
```

---

## Production Build

### Build Process

```bash
# 1. Type check
npm run typecheck

# 2. Build all processes
npm run build

# 3. Package application
npm run package
```

### Output Structure

```
dist/
├── main/
│   └── index.js (Main process)
├── renderer/
│   ├── index.html
│   ├── assets/
│   │   ├── index-[hash].js
│   │   └── index-[hash].css
│   └── ...
└── preload/
    └── index.js (Preload script)

release/
├── Perpetua-1.0.0.dmg (macOS)
├── Perpetua Setup 1.0.0.exe (Windows)
└── Perpetua-1.0.0.AppImage (Linux)
```

---

## Testing Integration

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@lib': path.resolve(__dirname, 'src/lib'),
      '@types': path.resolve(__dirname, 'src/types'),
    },
  },
});
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/build.yml
name: Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm run test

      - name: Build
        run: npm run build

      - name: Package
        run: npm run package
```

---

## Performance Targets

- **Development start:** < 3 seconds
- **HMR update:** < 100ms
- **Production build:** < 60 seconds
- **Bundle size (renderer):** < 1MB (gzipped)

---

**Last Updated:** 2025-10-22
**Status:** Approved
**Version:** 1.0.0
