# TypeScript Configuration

**Document Type:** Architecture Specification
**Status:** Approved
**Last Updated:** 2025-10-22
**Version:** 1.0.0

---

## Configuration Strategy

Perpetua uses **three separate TypeScript configurations**:
1. **tsconfig.json** - Root configuration (shared settings)
2. **tsconfig.main.json** - Main process (Node.js environment)
3. **tsconfig.renderer.json** - Renderer process (Browser environment)

---

## Root Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "noEmit": true,
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
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "build"]
}
```

---

## Main Process Configuration (tsconfig.main.json)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "types": ["node"],
    "outDir": "./dist/main",
    "rootDir": "./src/main"
  },
  "include": [
    "src/main/**/*",
    "src/preload/**/*",
    "src/lib/**/*",
    "src/types/**/*"
  ],
  "exclude": ["src/renderer"]
}
```

**Key Settings:**
- **target:** ES2022 (modern Node.js)
- **module:** ESNext (native ESM)
- **types:** node (Node.js types)
- **lib:** ES2022 (no DOM)

---

## Renderer Process Configuration (tsconfig.renderer.json)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "types": ["vite/client"],
    "outDir": "./dist/renderer",
    "rootDir": "./src/renderer"
  },
  "include": [
    "src/renderer/**/*",
    "src/lib/**/*",
    "src/types/**/*"
  ],
  "exclude": ["src/main", "src/preload"]
}
```

**Key Settings:**
- **target:** ES2022
- **lib:** ES2022, DOM, DOM.Iterable (browser APIs)
- **jsx:** react-jsx (new JSX transform)
- **types:** vite/client (Vite types)

---

## Preload Configuration (tsconfig.preload.json)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM"],
    "types": ["node"],
    "outDir": "./dist/preload",
    "rootDir": "./src/preload"
  },
  "include": ["src/preload/**/*", "src/types/**/*"]
}
```

**Key Settings:**
- Both Node and DOM types (bridge environment)
- Separate output directory

---

## Type Declarations

### Global Types (src/types/global.d.ts)

```typescript
/// <reference types="vite/client" />

// Environment variables
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  // Add more env variables
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Electron API on window
import type { API } from '../preload';

declare global {
  interface Window {
    api: API;
  }
}

export {};
```

### Module Declarations (src/types/modules.d.ts)

```typescript
// CSS Modules
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Images
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

// JSON
declare module '*.json' {
  const value: any;
  export default value;
}
```

---

## Path Aliases Usage

```typescript
// ✅ With path aliases
import { DatabaseService } from '@main/services/database.service';
import { Button } from '@components/ui/Button';
import { useJourney } from '@hooks/useJourney';
import type { Journey } from '@types/journey.types';

// ❌ Without path aliases
import { DatabaseService } from '../../../services/database.service';
import { Button } from '../../components/ui/Button';
import { useJourney } from '../hooks/useJourney';
import type { Journey } from '../../types/journey.types';
```

---

## Strict Mode Settings

```json
{
  "compilerOptions": {
    "strict": true,                          // Enable all strict checks
    "noUnusedLocals": true,                  // Error on unused locals
    "noUnusedParameters": true,              // Error on unused parameters
    "noImplicitReturns": true,               // All code paths return
    "noFallthroughCasesInSwitch": true,      // Switch completeness
    "noUncheckedIndexedAccess": true,        // Safe array access
    "exactOptionalPropertyTypes": true,      // Strict optional properties
    "noPropertyAccessFromIndexSignature": true // Explicit index access
  }
}
```

---

## Build Commands

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "typecheck:main": "tsc --noEmit -p tsconfig.main.json",
    "typecheck:renderer": "tsc --noEmit -p tsconfig.renderer.json",
    "typecheck:watch": "tsc --noEmit --watch"
  }
}
```

---

## Type-Safe Patterns

### 1. Discriminated Unions

```typescript
type Stage =
  | { type: 'discovering'; research: string }
  | { type: 'solving'; solution: string }
  | { type: 'building'; artifact: Artifact };

function handleStage(stage: Stage) {
  switch (stage.type) {
    case 'discovering':
      return stage.research; // ✅ Type-safe
    case 'solving':
      return stage.solution; // ✅ Type-safe
    case 'building':
      return stage.artifact; // ✅ Type-safe
  }
}
```

### 2. Branded Types

```typescript
type JourneyId = string & { readonly __brand: 'JourneyId' };
type StageId = string & { readonly __brand: 'StageId' };

function getJourney(id: JourneyId) { /* ... */ }
function getStage(id: StageId) { /* ... */ }

const journeyId = 'journey-123' as JourneyId;
const stageId = 'stage-456' as StageId;

getJourney(journeyId); // ✅ OK
getJourney(stageId);   // ❌ Type error
```

### 3. Generic Constraints

```typescript
interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

class JourneyRepository implements Repository<Journey> {
  // Implementation...
}
```

---

## Vite Integration

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@main': path.resolve(__dirname, 'src/main'),
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
});
```

---

## Best Practices

### 1. Use Explicit Types

```typescript
// ✅ Good
function createJourney(input: string): Promise<Journey> {
  // ...
}

// ❌ Bad
function createJourney(input) {
  // ...
}
```

### 2. Avoid `any`

```typescript
// ✅ Good
function process(data: unknown): string {
  if (typeof data === 'string') {
    return data;
  }
  throw new Error('Invalid data');
}

// ❌ Bad
function process(data: any): string {
  return data as string;
}
```

### 3. Use Type Guards

```typescript
function isJourney(value: unknown): value is Journey {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'input' in value &&
    'status' in value
  );
}
```

### 4. Prefer Interfaces for Objects

```typescript
// ✅ Good - Extendable, better error messages
interface Journey {
  id: string;
  input: string;
  status: JourneyStatus;
}

// ❌ Less ideal for objects
type Journey = {
  id: string;
  input: string;
  status: JourneyStatus;
};
```

### 5. Use Utility Types

```typescript
// Pick specific properties
type JourneyPreview = Pick<Journey, 'id' | 'input' | 'status'>;

// Omit properties
type CreateJourneyInput = Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>;

// Make all properties optional
type PartialJourney = Partial<Journey>;

// Make all properties required
type RequiredJourney = Required<Journey>;

// Make all properties readonly
type ImmutableJourney = Readonly<Journey>;
```

---

**Last Updated:** 2025-10-22
**Status:** Approved
**Version:** 1.0.0
