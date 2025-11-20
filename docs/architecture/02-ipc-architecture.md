# IPC Communication Architecture

**Document Type:** Architecture Specification
**Status:** Approved
**Last Updated:** 2025-10-22
**Version:** 1.0.0

---

## Overview

Inter-Process Communication (IPC) is the bridge between Electron's main process (Node.js) and renderer process (Chromium/React). Perpetua uses a **type-safe, channel-based IPC architecture** with security as the top priority.

---

## Architecture Principles

### 1. Security First
- **Context Isolation:** Enabled by default
- **No Node Integration:** Renderer has no direct Node.js access
- **Preload Script:** Only safe APIs exposed via `contextBridge`
- **Input Validation:** All IPC messages validated

### 2. Type Safety
- **TypeScript interfaces** for all IPC messages
- **Compile-time type checking** for channels and payloads
- **Runtime validation** using Zod schemas

### 3. Unidirectional Data Flow
- **Renderer → Main:** Invoke pattern (request/response)
- **Main → Renderer:** Send pattern (push updates)
- **No direct renderer-to-renderer** communication

---

## IPC Patterns

### Pattern 1: Invoke (Request/Response)

**Use Case:** Renderer requests data or action from main process

```typescript
// Renderer invokes
const result = await window.api.journey.create({ input: "quantum computing" });

// Main handles
ipcMain.handle('journey:create', async (event, payload) => {
  return await journeyService.create(payload);
});
```

**Flow:**
```
Renderer → contextBridge → IPC Channel → Main Handler → Response → Renderer
```

### Pattern 2: Send (One-way Push)

**Use Case:** Main process pushes updates to renderer

```typescript
// Main sends update
mainWindow.webContents.send('stage:update', stage);

// Renderer listens
window.api.onStageUpdate((stage) => {
  updateUI(stage);
});
```

**Flow:**
```
Main → IPC Channel → Preload Listener → Renderer Callback
```

### Pattern 3: Streaming

**Use Case:** Real-time streaming data (Claude responses)

```typescript
// Main sends stream chunks
for await (const chunk of claudeStream) {
  mainWindow.webContents.send('claude:stream', chunk);
}

// Renderer receives stream
window.api.onClaudeStream((chunk) => {
  appendToStream(chunk);
});
```

---

## Channel Naming Convention

Format: `domain:action`

Examples:
- `journey:create`
- `journey:update`
- `journey:delete`
- `journey:list`
- `stage:create`
- `stage:update`
- `artifact:create`
- `database:query`
- `file:read`
- `file:write`
- `claude:execute`
- `claude:stream`

---

## Type Definitions

### Core IPC Types

```typescript
// src/types/ipc.types.ts

/**
 * IPC channel definitions with typed payloads
 */
export interface IPCChannels {
  // Journey operations
  'journey:create': {
    request: { input: string; settings?: JourneySettings };
    response: Journey;
  };
  'journey:update': {
    request: { id: string; updates: Partial<Journey> };
    response: Journey;
  };
  'journey:delete': {
    request: { id: string };
    response: { success: boolean };
  };
  'journey:get': {
    request: { id: string };
    response: Journey | null;
  };
  'journey:list': {
    request: { limit?: number; offset?: number };
    response: Journey[];
  };

  // Stage operations
  'stage:create': {
    request: { journeyId: string; type: StageType };
    response: Stage;
  };
  'stage:update': {
    request: { id: string; updates: Partial<Stage> };
    response: Stage;
  };

  // Artifact operations
  'artifact:create': {
    request: { stageId: string; artifact: CreateArtifactInput };
    response: Artifact;
  };
  'artifact:list': {
    request: { stageId: string };
    response: Artifact[];
  };

  // File operations
  'file:read': {
    request: { path: string };
    response: { content: string; encoding: string };
  };
  'file:write': {
    request: { path: string; content: string; encoding?: string };
    response: { success: boolean; path: string };
  };
  'file:delete': {
    request: { path: string };
    response: { success: boolean };
  };

  // Claude operations
  'claude:execute': {
    request: { prompt: string; options: ClaudeExecuteOptions };
    response: ClaudeResponse;
  };
  'claude:abort': {
    request: { requestId: string };
    response: { success: boolean };
  };

  // Settings
  'settings:get': {
    request: { key: string };
    response: any;
  };
  'settings:set': {
    request: { key: string; value: any };
    response: { success: boolean };
  };

  // System
  'system:getInfo': {
    request: void;
    response: SystemInfo;
  };
}

/**
 * Push events (main → renderer)
 */
export interface IPCEvents {
  'journey:updated': Journey;
  'stage:created': Stage;
  'stage:updated': Stage;
  'stage:completed': Stage;
  'artifact:created': Artifact;
  'claude:stream': ClaudeStreamChunk;
  'claude:thinking': ClaudeThinkingChunk;
  'error:occurred': { code: string; message: string; details?: any };
}

/**
 * Extract request type for channel
 */
export type IPCRequest<T extends keyof IPCChannels> = IPCChannels[T]['request'];

/**
 * Extract response type for channel
 */
export type IPCResponse<T extends keyof IPCChannels> = IPCChannels[T]['response'];
```

---

## Preload Script

### API Exposure

```typescript
// src/preload/index.ts

import { contextBridge, ipcRenderer } from 'electron';
import type { IPCChannels, IPCEvents } from '@types/ipc.types';

/**
 * Type-safe IPC API exposed to renderer
 */
const api = {
  // Journey operations
  journey: {
    create: (input: IPCRequest<'journey:create'>) =>
      ipcRenderer.invoke('journey:create', input) as Promise<IPCResponse<'journey:create'>>,

    update: (input: IPCRequest<'journey:update'>) =>
      ipcRenderer.invoke('journey:update', input) as Promise<IPCResponse<'journey:update'>>,

    delete: (input: IPCRequest<'journey:delete'>) =>
      ipcRenderer.invoke('journey:delete', input) as Promise<IPCResponse<'journey:delete'>>,

    get: (input: IPCRequest<'journey:get'>) =>
      ipcRenderer.invoke('journey:get', input) as Promise<IPCResponse<'journey:get'>>,

    list: (input: IPCRequest<'journey:list'>) =>
      ipcRenderer.invoke('journey:list', input) as Promise<IPCResponse<'journey:list'>>,

    onUpdated: (callback: (journey: IPCEvents['journey:updated']) => void) => {
      const listener = (_: any, data: IPCEvents['journey:updated']) => callback(data);
      ipcRenderer.on('journey:updated', listener);
      return () => ipcRenderer.removeListener('journey:updated', listener);
    },
  },

  // Stage operations
  stage: {
    create: (input: IPCRequest<'stage:create'>) =>
      ipcRenderer.invoke('stage:create', input) as Promise<IPCResponse<'stage:create'>>,

    update: (input: IPCRequest<'stage:update'>) =>
      ipcRenderer.invoke('stage:update', input) as Promise<IPCResponse<'stage:update'>>,

    onCreated: (callback: (stage: IPCEvents['stage:created']) => void) => {
      const listener = (_: any, data: IPCEvents['stage:created']) => callback(data);
      ipcRenderer.on('stage:created', listener);
      return () => ipcRenderer.removeListener('stage:created', listener);
    },

    onUpdated: (callback: (stage: IPCEvents['stage:updated']) => void) => {
      const listener = (_: any, data: IPCEvents['stage:updated']) => callback(data);
      ipcRenderer.on('stage:updated', listener);
      return () => ipcRenderer.removeListener('stage:updated', listener);
    },

    onCompleted: (callback: (stage: IPCEvents['stage:completed']) => void) => {
      const listener = (_: any, data: IPCEvents['stage:completed']) => callback(data);
      ipcRenderer.on('stage:completed', listener);
      return () => ipcRenderer.removeListener('stage:completed', listener);
    },
  },

  // Artifact operations
  artifact: {
    create: (input: IPCRequest<'artifact:create'>) =>
      ipcRenderer.invoke('artifact:create', input) as Promise<IPCResponse<'artifact:create'>>,

    list: (input: IPCRequest<'artifact:list'>) =>
      ipcRenderer.invoke('artifact:list', input) as Promise<IPCResponse<'artifact:list'>>,

    onCreated: (callback: (artifact: IPCEvents['artifact:created']) => void) => {
      const listener = (_: any, data: IPCEvents['artifact:created']) => callback(data);
      ipcRenderer.on('artifact:created', listener);
      return () => ipcRenderer.removeListener('artifact:created', listener);
    },
  },

  // File operations
  file: {
    read: (input: IPCRequest<'file:read'>) =>
      ipcRenderer.invoke('file:read', input) as Promise<IPCResponse<'file:read'>>,

    write: (input: IPCRequest<'file:write'>) =>
      ipcRenderer.invoke('file:write', input) as Promise<IPCResponse<'file:write'>>,

    delete: (input: IPCRequest<'file:delete'>) =>
      ipcRenderer.invoke('file:delete', input) as Promise<IPCResponse<'file:delete'>>,
  },

  // Claude operations
  claude: {
    execute: (input: IPCRequest<'claude:execute'>) =>
      ipcRenderer.invoke('claude:execute', input) as Promise<IPCResponse<'claude:execute'>>,

    abort: (input: IPCRequest<'claude:abort'>) =>
      ipcRenderer.invoke('claude:abort', input) as Promise<IPCResponse<'claude:abort'>>,

    onStream: (callback: (chunk: IPCEvents['claude:stream']) => void) => {
      const listener = (_: any, data: IPCEvents['claude:stream']) => callback(data);
      ipcRenderer.on('claude:stream', listener);
      return () => ipcRenderer.removeListener('claude:stream', listener);
    },

    onThinking: (callback: (chunk: IPCEvents['claude:thinking']) => void) => {
      const listener = (_: any, data: IPCEvents['claude:thinking']) => callback(data);
      ipcRenderer.on('claude:thinking', listener);
      return () => ipcRenderer.removeListener('claude:thinking', listener);
    },
  },

  // Settings
  settings: {
    get: (input: IPCRequest<'settings:get'>) =>
      ipcRenderer.invoke('settings:get', input) as Promise<IPCResponse<'settings:get'>>,

    set: (input: IPCRequest<'settings:set'>) =>
      ipcRenderer.invoke('settings:set', input) as Promise<IPCResponse<'settings:set'>>,
  },

  // System
  system: {
    getInfo: () =>
      ipcRenderer.invoke('system:getInfo') as Promise<IPCResponse<'system:getInfo'>>,
  },

  // Error handling
  onError: (callback: (error: IPCEvents['error:occurred']) => void) => {
    const listener = (_: any, data: IPCEvents['error:occurred']) => callback(data);
    ipcRenderer.on('error:occurred', listener);
    return () => ipcRenderer.removeListener('error:occurred', listener);
  },
};

// Expose API to renderer
contextBridge.exposeInMainWorld('api', api);

// Type declarations for window.api
export type API = typeof api;
```

### Window Type Declaration

```typescript
// src/types/electron.types.ts

import type { API } from '../preload';

declare global {
  interface Window {
    api: API;
  }
}
```

---

## Main Process Handlers

### Handler Registration

```typescript
// src/main/ipc/index.ts

import { ipcMain } from 'electron';
import { registerJourneyHandlers } from './journey.handler';
import { registerStageHandlers } from './stage.handler';
import { registerArtifactHandlers } from './artifact.handler';
import { registerFileHandlers } from './file.handler';
import { registerClaudeHandlers } from './claude.handler';
import { registerSettingsHandlers } from './settings.handler';
import { registerSystemHandlers } from './system.handler';

/**
 * Register all IPC handlers
 */
export function registerIPCHandlers() {
  registerJourneyHandlers(ipcMain);
  registerStageHandlers(ipcMain);
  registerArtifactHandlers(ipcMain);
  registerFileHandlers(ipcMain);
  registerClaudeHandlers(ipcMain);
  registerSettingsHandlers(ipcMain);
  registerSystemHandlers(ipcMain);
}
```

### Journey Handler Example

```typescript
// src/main/ipc/journey.handler.ts

import { IpcMain, IpcMainInvokeEvent } from 'electron';
import type { IPCRequest, IPCResponse } from '@types/ipc.types';
import { DatabaseService } from '../services/database.service';
import { validateInput } from '../utils/validation';
import { handleIPCError } from '../utils/error';

const db = new DatabaseService();

export function registerJourneyHandlers(ipcMain: IpcMain) {
  /**
   * Create new journey
   */
  ipcMain.handle(
    'journey:create',
    async (
      event: IpcMainInvokeEvent,
      payload: IPCRequest<'journey:create'>
    ): Promise<IPCResponse<'journey:create'>> => {
      try {
        // Validate input
        validateInput(payload, {
          input: { type: 'string', required: true, minLength: 1 },
          settings: { type: 'object', required: false },
        });

        // Create journey
        const journey = await db.journey.create(payload);

        // Broadcast update to all windows
        const windows = BrowserWindow.getAllWindows();
        windows.forEach(window => {
          window.webContents.send('journey:updated', journey);
        });

        return journey;
      } catch (error) {
        throw handleIPCError(error, 'journey:create');
      }
    }
  );

  /**
   * Update journey
   */
  ipcMain.handle(
    'journey:update',
    async (
      event: IpcMainInvokeEvent,
      payload: IPCRequest<'journey:update'>
    ): Promise<IPCResponse<'journey:update'>> => {
      try {
        validateInput(payload, {
          id: { type: 'string', required: true },
          updates: { type: 'object', required: true },
        });

        const journey = await db.journey.update(payload.id, payload.updates);

        // Broadcast update
        const windows = BrowserWindow.getAllWindows();
        windows.forEach(window => {
          window.webContents.send('journey:updated', journey);
        });

        return journey;
      } catch (error) {
        throw handleIPCError(error, 'journey:update');
      }
    }
  );

  /**
   * Delete journey
   */
  ipcMain.handle(
    'journey:delete',
    async (
      event: IpcMainInvokeEvent,
      payload: IPCRequest<'journey:delete'>
    ): Promise<IPCResponse<'journey:delete'>> => {
      try {
        validateInput(payload, {
          id: { type: 'string', required: true },
        });

        await db.journey.delete(payload.id);

        return { success: true };
      } catch (error) {
        throw handleIPCError(error, 'journey:delete');
      }
    }
  );

  /**
   * Get journey by ID
   */
  ipcMain.handle(
    'journey:get',
    async (
      event: IpcMainInvokeEvent,
      payload: IPCRequest<'journey:get'>
    ): Promise<IPCResponse<'journey:get'>> => {
      try {
        validateInput(payload, {
          id: { type: 'string', required: true },
        });

        const journey = await db.journey.findById(payload.id);

        return journey || null;
      } catch (error) {
        throw handleIPCError(error, 'journey:get');
      }
    }
  );

  /**
   * List journeys
   */
  ipcMain.handle(
    'journey:list',
    async (
      event: IpcMainInvokeEvent,
      payload: IPCRequest<'journey:list'>
    ): Promise<IPCResponse<'journey:list'>> => {
      try {
        const { limit = 50, offset = 0 } = payload;

        const journeys = await db.journey.findAll({ limit, offset });

        return journeys;
      } catch (error) {
        throw handleIPCError(error, 'journey:list');
      }
    }
  );
}
```

---

## Renderer IPC Service

### Type-Safe IPC Client

```typescript
// src/renderer/services/ipc.service.ts

/**
 * IPC service wrapper for renderer
 * Provides convenient access to window.api with error handling
 */

export class IPCService {
  /**
   * Journey operations
   */
  static journey = {
    create: async (input: string, settings?: JourneySettings) => {
      try {
        return await window.api.journey.create({ input, settings });
      } catch (error) {
        throw IPCService.handleError(error, 'journey.create');
      }
    },

    update: async (id: string, updates: Partial<Journey>) => {
      try {
        return await window.api.journey.update({ id, updates });
      } catch (error) {
        throw IPCService.handleError(error, 'journey.update');
      }
    },

    delete: async (id: string) => {
      try {
        return await window.api.journey.delete({ id });
      } catch (error) {
        throw IPCService.handleError(error, 'journey.delete');
      }
    },

    get: async (id: string) => {
      try {
        return await window.api.journey.get({ id });
      } catch (error) {
        throw IPCService.handleError(error, 'journey.get');
      }
    },

    list: async (options?: { limit?: number; offset?: number }) => {
      try {
        return await window.api.journey.list(options || {});
      } catch (error) {
        throw IPCService.handleError(error, 'journey.list');
      }
    },

    onUpdated: (callback: (journey: Journey) => void) => {
      return window.api.journey.onUpdated(callback);
    },
  };

  /**
   * Stage operations
   */
  static stage = {
    create: async (journeyId: string, type: StageType) => {
      try {
        return await window.api.stage.create({ journeyId, type });
      } catch (error) {
        throw IPCService.handleError(error, 'stage.create');
      }
    },

    onCreated: (callback: (stage: Stage) => void) => {
      return window.api.stage.onCreated(callback);
    },

    onUpdated: (callback: (stage: Stage) => void) => {
      return window.api.stage.onUpdated(callback);
    },

    onCompleted: (callback: (stage: Stage) => void) => {
      return window.api.stage.onCompleted(callback);
    },
  };

  /**
   * Claude operations
   */
  static claude = {
    execute: async (prompt: string, options: ClaudeExecuteOptions) => {
      try {
        return await window.api.claude.execute({ prompt, options });
      } catch (error) {
        throw IPCService.handleError(error, 'claude.execute');
      }
    },

    abort: async (requestId: string) => {
      try {
        return await window.api.claude.abort({ requestId });
      } catch (error) {
        throw IPCService.handleError(error, 'claude.abort');
      }
    },

    onStream: (callback: (chunk: ClaudeStreamChunk) => void) => {
      return window.api.claude.onStream(callback);
    },

    onThinking: (callback: (chunk: ClaudeThinkingChunk) => void) => {
      return window.api.claude.onThinking(callback);
    },
  };

  /**
   * Error handling
   */
  private static handleError(error: any, operation: string): Error {
    console.error(`IPC Error [${operation}]:`, error);

    if (error.code === 'PERMISSION_DENIED') {
      return new Error(`Permission denied for ${operation}`);
    }

    if (error.code === 'NOT_FOUND') {
      return new Error(`Resource not found for ${operation}`);
    }

    if (error.code === 'VALIDATION_ERROR') {
      return new Error(`Invalid input for ${operation}: ${error.message}`);
    }

    return new Error(`Failed to ${operation}: ${error.message}`);
  }
}
```

---

## Security Measures

### 1. Context Isolation

```typescript
// src/main/app.ts

const mainWindow = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,        // ✅ Enabled
    nodeIntegration: false,         // ✅ Disabled
    nodeIntegrationInWorker: false, // ✅ Disabled
    enableRemoteModule: false,      // ✅ Disabled
    preload: path.join(__dirname, '../preload/index.js'),
  },
});
```

### 2. Input Validation

```typescript
// src/main/utils/validation.ts

import { z } from 'zod';

const journeyCreateSchema = z.object({
  input: z.string().min(1).max(5000),
  settings: z.object({
    autoContinue: z.boolean().optional(),
    maxStages: z.number().min(1).max(200).optional(),
  }).optional(),
});

export function validateInput<T>(data: unknown, schema: z.ZodType<T>): T {
  try {
    return schema.parse(data);
  } catch (error) {
    throw new ValidationError('Invalid input', error);
  }
}
```

### 3. Error Handling

```typescript
// src/main/utils/error.ts

export class IPCError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'IPCError';
  }
}

export function handleIPCError(error: any, channel: string): IPCError {
  console.error(`IPC Error [${channel}]:`, error);

  if (error instanceof ValidationError) {
    return new IPCError('VALIDATION_ERROR', error.message, error.details);
  }

  if (error instanceof NotFoundError) {
    return new IPCError('NOT_FOUND', error.message);
  }

  if (error instanceof PermissionError) {
    return new IPCError('PERMISSION_DENIED', error.message);
  }

  return new IPCError('INTERNAL_ERROR', 'An unexpected error occurred', {
    originalError: error.message,
  });
}
```

---

## Testing IPC

### Unit Tests

```typescript
// tests/unit/main/ipc/journey.handler.spec.ts

import { ipcMain } from 'electron';
import { registerJourneyHandlers } from '@main/ipc/journey.handler';

describe('Journey IPC Handlers', () => {
  beforeEach(() => {
    registerJourneyHandlers(ipcMain);
  });

  it('should create journey with valid input', async () => {
    const result = await ipcMain.handle('journey:create', {
      input: 'test journey',
    });

    expect(result).toHaveProperty('id');
    expect(result.input).toBe('test journey');
  });

  it('should reject invalid input', async () => {
    await expect(
      ipcMain.handle('journey:create', { input: '' })
    ).rejects.toThrow('VALIDATION_ERROR');
  });
});
```

### Integration Tests

```typescript
// tests/integration/ipc/journey.spec.ts

import { app, BrowserWindow } from 'electron';
import { test, expect } from '@playwright/test';

test('create and retrieve journey via IPC', async ({ page }) => {
  // Create journey
  const journey = await page.evaluate(async () => {
    return await window.api.journey.create({
      input: 'test journey',
    });
  });

  expect(journey.id).toBeDefined();

  // Retrieve journey
  const retrieved = await page.evaluate(async (id) => {
    return await window.api.journey.get({ id });
  }, journey.id);

  expect(retrieved).toEqual(journey);
});
```

---

## Performance Optimization

### 1. Batching

Batch multiple operations:

```typescript
// Instead of multiple IPC calls
const stage1 = await window.api.stage.create(journeyId, 'discovering');
const stage2 = await window.api.stage.create(journeyId, 'chasing');
const stage3 = await window.api.stage.create(journeyId, 'solving');

// Use batch operation
const stages = await window.api.stage.createBatch(journeyId, [
  'discovering',
  'chasing',
  'solving',
]);
```

### 2. Caching

Cache frequently accessed data:

```typescript
class IPCCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 60000; // 1 minute

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });

    return data;
  }
}
```

### 3. Streaming for Large Data

```typescript
// Stream large lists instead of loading all at once
window.api.journey.streamList({
  batchSize: 20,
  onBatch: (journeys) => {
    // Process batch
  },
  onComplete: () => {
    // Done
  },
});
```

---

## Best Practices

### 1. Always Use Type-Safe APIs

```typescript
// ✅ Good - Type-safe
const journey = await window.api.journey.create({ input: 'test' });

// ❌ Bad - No type safety
const journey = await ipcRenderer.invoke('journey:create', { input: 'test' });
```

### 2. Handle Errors Gracefully

```typescript
try {
  const journey = await window.api.journey.create({ input });
} catch (error) {
  if (error.code === 'VALIDATION_ERROR') {
    showValidationError(error.message);
  } else if (error.code === 'PERMISSION_DENIED') {
    showPermissionError();
  } else {
    showGenericError();
  }
}
```

### 3. Clean Up Listeners

```typescript
useEffect(() => {
  const cleanup = window.api.journey.onUpdated((journey) => {
    setJourney(journey);
  });

  return cleanup; // ✅ Always clean up
}, []);
```

### 4. Validate on Both Sides

```typescript
// Renderer validation (UX)
if (!input.trim()) {
  showError('Input cannot be empty');
  return;
}

// Main validation (Security)
validateInput(payload, journeyCreateSchema);
```

---

## Monitoring & Debugging

### IPC Logging

```typescript
// src/main/utils/logger.ts

export class IPCLogger {
  static logInvoke(channel: string, payload: any) {
    console.log(`[IPC Invoke] ${channel}`, {
      payload,
      timestamp: Date.now(),
    });
  }

  static logResponse(channel: string, response: any, duration: number) {
    console.log(`[IPC Response] ${channel}`, {
      duration: `${duration}ms`,
      timestamp: Date.now(),
    });
  }

  static logError(channel: string, error: any) {
    console.error(`[IPC Error] ${channel}`, {
      error: error.message,
      code: error.code,
      timestamp: Date.now(),
    });
  }
}
```

---

**Last Updated:** 2025-10-22
**Status:** Approved
**Version:** 1.0.0
