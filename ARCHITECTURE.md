# PERPETUA - Technical Architecture

**Version:** 1.0.0
**Last Updated:** October 22, 2025
**Status:** Living Document

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Core Components](#core-components)
5. [Data Models](#data-models)
6. [Claude Integration](#claude-integration)
7. [Storage Layer](#storage-layer)
8. [Security](#security)
9. [Performance](#performance)
10. [Development Setup](#development-setup)

---

## 🎯 Overview

### Architecture Philosophy

**1. Simple First**
- Start with the simplest solution
- Add complexity only when needed
- Prefer composition over abstraction

**2. Local-First**
- All data stored locally by default
- Cloud sync optional (future)
- Works offline (future)

**3. Modular Design**
- Clear separation of concerns
- Loosely coupled components
- Easy to test and maintain

**4. Performance Matters**
- Fast startup (<2 seconds)
- Smooth animations (60 FPS)
- Efficient memory usage

---

## 🛠️ Technology Stack

### Desktop Framework

```yaml
Electron: 28+
├─ Main Process (Node.js)
│  ├─ Window management
│  ├─ IPC communication
│  ├─ File system access
│  ├─ System integration
│  └─ Security boundaries
│
└─ Renderer Process (Chromium)
   ├─ React application
   ├─ UI rendering
   └─ User interactions
```

### Frontend Stack

```yaml
UI Framework:
  - React 18 (with hooks, concurrent features)
  - TypeScript 5+ (strict mode)
  - Vite (fast build tool)

Styling:
  - TailwindCSS 3 (utility-first)
  - Framer Motion (animations)
  - Radix UI (accessible primitives)

State Management:
  - Zustand (global state)
  - React Query / TanStack Query (server state)
  - Jotai (atomic state when needed)

Routing:
  - React Router 6 (if needed)
  - Or custom lightweight router
```

### AI Integration

```yaml
Claude SDK:
  - @anthropic-ai/sdk
  - Features Used:
    ├─ Messages API (chat)
    ├─ Extended Thinking
    ├─ Computer Use (web automation)
    ├─ Artifacts (content generation)
    ├─ Prompt Caching
    └─ Streaming responses

Web Automation:
  - Puppeteer (headless browser)
  - For Computer Use implementation
```

### Data Layer

```yaml
Local Storage:
  - SQLite (via better-sqlite3)
  - Fast, embedded database
  - Perfect for local-first apps

File Storage:
  - Node.js fs/promises
  - Store artifacts as files
  - Organized directory structure

Caching:
  - In-memory cache (LRU)
  - Prompt caching (Claude SDK)
```

### Development Tools

```yaml
Build & Dev:
  - Vite
  - TypeScript compiler
  - ESBuild (fast compilation)

Testing:
  - Vitest (unit tests)
  - Playwright (e2e tests)
  - Testing Library (React)

Code Quality:
  - ESLint (linting)
  - Prettier (formatting)
  - Husky (git hooks)
  - lint-staged (pre-commit)

Monitoring:
  - electron-log (logging)
  - Sentry (error tracking, optional)
```

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PERPETUA DESKTOP APP                     │
│                     (Electron Shell)                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              RENDERER PROCESS                         │ │
│  │              (React Application)                      │ │
│  │                                                       │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │  UI Layer (React Components)                    │ │ │
│  │  │  • Stream View                                  │ │ │
│  │  │  • Stage Cards                                  │ │ │
│  │  │  • Control Panel                                │ │ │
│  │  │  • Artifact Viewer                              │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  │                         ↕                             │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │  State Management (Zustand)                     │ │ │
│  │  │  • Journey State                                │ │ │
│  │  │  • UI State                                     │ │ │
│  │  │  • Settings                                     │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  │                         ↕                             │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │  Services Layer                                 │ │ │
│  │  │  • Claude Service (AI)                          │ │ │
│  │  │  • Database Service (Storage)                   │ │ │
│  │  │  • File Service (Artifacts)                     │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                         IPC ↕                               │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              MAIN PROCESS                             │ │
│  │              (Node.js)                                │ │
│  │                                                       │ │
│  │  • Window Management                                 │ │
│  │  • File System Access                                │ │
│  │  • SQLite Database                                   │ │
│  │  • System Integration                                │ │
│  │  • Security & Permissions                            │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Anthropic   │  │  Puppeteer   │  │  File System │     │
│  │  Claude API  │  │  (Browser)   │  │  (Local)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Input
    ↓
UI Component
    ↓
State Management (Zustand)
    ↓
Exploration Engine
    ↓
Claude Service → Anthropic API
    ↓         ↘
    ↓          Puppeteer (Computer Use)
    ↓         ↙
Stage Result
    ↓
Database Service → SQLite
    ↓
UI Update (Real-time)
```

---

## 🧩 Core Components

### 1. Exploration Engine

The heart of Perpetua - orchestrates the 8-stage cycle.

```typescript
// src/lib/engine/ExplorationEngine.ts

export class ExplorationEngine {
  private claude: ClaudeService;
  private db: DatabaseService;
  private computer: ComputerUseService;

  constructor(apiKey: string) {
    this.claude = new ClaudeService(apiKey);
    this.db = new DatabaseService();
    this.computer = new ComputerUseService();
  }

  /**
   * Start a new exploration journey
   */
  async startJourney(input: string): Promise<Journey> {
    // Create journey in database
    const journey = await this.db.createJourney(input);

    // Start first cycle
    await this.runCycle(journey);

    return journey;
  }

  /**
   * Run a complete 8-stage cycle
   */
  private async runCycle(journey: Journey): Promise<void> {
    const stages: StageType[] = [
      'discovering',
      'chasing',
      'solving',
      'challenging',
      'questioning',
      'searching',
      'imagining',
      'building',
    ];

    for (const stageType of stages) {
      // Check if journey should continue
      if (!this.shouldContinue(journey)) break;

      // Run stage
      const stage = await this.runStage(journey, stageType);

      // Update journey
      journey.stages.push(stage);
      await this.db.updateJourney(journey);

      // Emit event for UI update
      this.emit('stage-complete', stage);
    }

    // Determine if another cycle should start
    if (this.shouldStartNextCycle(journey)) {
      await this.runCycle(journey);
    } else {
      journey.status = 'complete';
      await this.db.updateJourney(journey);
      this.emit('journey-complete', journey);
    }
  }

  /**
   * Run a single stage
   */
  private async runStage(
    journey: Journey,
    type: StageType
  ): Promise<Stage> {
    // Create stage prompt based on type and context
    const prompt = this.buildStagePrompt(journey, type);

    // Execute with Claude
    const result = await this.claude.execute({
      prompt,
      extendedThinking: true,
      tools: this.getToolsForStage(type),
    });

    // Create stage record
    const stage: Stage = {
      id: generateId(),
      journeyId: journey.id,
      type,
      status: 'complete',
      prompt,
      result: result.content,
      thinking: result.thinking,
      artifacts: result.artifacts || [],
      createdAt: Date.now(),
    };

    await this.db.createStage(stage);

    return stage;
  }

  /**
   * Build prompt for each stage type
   */
  private buildStagePrompt(
    journey: Journey,
    type: StageType
  ): string {
    const context = this.buildContext(journey);

    const prompts = {
      discovering: `
        You are in the DISCOVERING stage.
        Research and explore: ${journey.input}

        ${context}

        Provide comprehensive research findings, key insights,
        and interesting discoveries.
      `,

      chasing: `
        You are in the CHASING stage.
        Based on what we discovered, identify deeper problems,
        questions, or challenges worth pursuing.

        ${context}

        What's the real problem? What should we investigate deeper?
      `,

      solving: `
        You are in the SOLVING stage.
        Generate solutions, approaches, or answers to the problems
        we've identified.

        ${context}

        Propose concrete solutions with reasoning.
      `,

      challenging: `
        You are in the CHALLENGING stage.
        Question our assumptions and solutions. Play devil's advocate.

        ${context}

        What are we missing? What if we're wrong?
        Challenge our thinking.
      `,

      questioning: `
        You are in the QUESTIONING stage.
        Ask probing questions that lead to deeper understanding.

        ${context}

        What questions should we be asking?
        What don't we know yet?
      `,

      searching: `
        You are in the SEARCHING stage.
        Conduct deep research to answer our questions.

        ${context}

        Use Computer Use to browse the web, find sources,
        extract data, and synthesize findings.
      `,

      imagining: `
        You are in the IMAGINING stage.
        Think creatively. Explore "what if" scenarios.
        Imagine possibilities.

        ${context}

        What creative approaches could we take?
        What if we thought about this differently?
      `,

      building: `
        You are in the BUILDING stage.
        Create tangible artifacts: code, documents,
        visualizations, prototypes.

        ${context}

        Build something useful based on our exploration.
      `,
    };

    return prompts[type];
  }

  /**
   * Build context from previous stages
   */
  private buildContext(journey: Journey): string {
    const recentStages = journey.stages.slice(-5); // Last 5 stages

    return recentStages
      .map(stage => `
        ${stage.type.toUpperCase()}:
        ${stage.result.substring(0, 500)}...
      `)
      .join('\n\n');
  }

  /**
   * Get tools available for stage
   */
  private getToolsForStage(type: StageType): Tool[] {
    const toolsByStage = {
      discovering: ['think', 'research'],
      chasing: ['think', 'analyze'],
      solving: ['think', 'create'],
      challenging: ['think'],
      questioning: ['think'],
      searching: ['computer_use', 'web_search'],
      imagining: ['think', 'create'],
      building: ['create_artifact', 'write_code'],
    };

    return toolsByStage[type] || ['think'];
  }

  /**
   * Determine if journey should continue
   */
  private shouldContinue(journey: Journey): boolean {
    return (
      journey.status !== 'stopped' &&
      journey.status !== 'paused' &&
      journey.stages.length < journey.settings.maxStages
    );
  }

  /**
   * Determine if another cycle should start
   */
  private shouldStartNextCycle(journey: Journey): boolean {
    return (
      journey.settings.autoContinue &&
      journey.stages.length < journey.settings.maxStages
    );
  }
}
```

### 2. Claude Service

Wrapper around Anthropic SDK with Extended Thinking and Computer Use.

```typescript
// src/lib/services/ClaudeService.ts

import Anthropic from '@anthropic-ai/sdk';

export class ClaudeService {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
    });
  }

  /**
   * Execute a prompt with Extended Thinking
   */
  async execute(options: {
    prompt: string;
    extendedThinking?: boolean;
    tools?: Tool[];
    stream?: boolean;
  }): Promise<ClaudeResponse> {
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: options.prompt,
      },
    ];

    const createOptions: Anthropic.MessageCreateParams = {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      messages,
      thinking: options.extendedThinking
        ? { type: 'enabled', budget_tokens: 4000 }
        : undefined,
      tools: options.tools ? this.formatTools(options.tools) : undefined,
    };

    if (options.stream) {
      return this.executeStream(createOptions);
    } else {
      const response = await this.client.messages.create(createOptions);
      return this.parseResponse(response);
    }
  }

  /**
   * Execute with streaming
   */
  private async executeStream(
    options: Anthropic.MessageCreateParams
  ): Promise<AsyncGenerator<ClaudeStreamEvent>> {
    const stream = await this.client.messages.stream(options);

    return this.handleStream(stream);
  }

  /**
   * Parse Claude response
   */
  private parseResponse(
    response: Anthropic.Message
  ): ClaudeResponse {
    const thinking = response.content.find(
      block => block.type === 'thinking'
    );

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return {
      content: text,
      thinking: thinking?.thinking,
      artifacts: this.extractArtifacts(response),
      toolUses: this.extractToolUses(response),
    };
  }

  /**
   * Extract artifacts from response
   */
  private extractArtifacts(
    response: Anthropic.Message
  ): Artifact[] {
    // Parse artifacts from response
    // Look for code blocks, structured data, etc.
    const artifacts: Artifact[] = [];

    // Implementation depends on how Claude formats artifacts
    // Could be markdown code blocks, specific XML tags, etc.

    return artifacts;
  }
}
```

### 3. Computer Use Service

Implements Claude's Computer Use for autonomous web browsing.

```typescript
// src/lib/services/ComputerUseService.ts

import puppeteer, { Browser, Page } from 'puppeteer';

export class ComputerUseService {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });
  }

  async navigateTo(url: string): Promise<PageContent> {
    const page = await this.browser!.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    const content = await this.extractContent(page);
    await page.close();

    return content;
  }

  async search(query: string): Promise<SearchResult[]> {
    // Use Brave Search API or DuckDuckGo
    // Return structured search results
    return [];
  }

  private async extractContent(page: Page): Promise<PageContent> {
    // Extract meaningful content from page
    const title = await page.title();
    const text = await page.evaluate(() => document.body.innerText);
    const links = await page.$$eval('a', links =>
      links.map(a => ({
        text: a.textContent,
        href: a.href,
      }))
    );

    return { title, text, links };
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
```

### 4. Database Service

SQLite wrapper for local data storage.

```typescript
// src/lib/services/DatabaseService.ts

import Database from 'better-sqlite3';

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string = './perpetua.db') {
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize(): void {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS journeys (
        id TEXT PRIMARY KEY,
        input TEXT NOT NULL,
        status TEXT NOT NULL,
        settings TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stages (
        id TEXT PRIMARY KEY,
        journey_id TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        prompt TEXT,
        result TEXT,
        thinking TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (journey_id) REFERENCES journeys(id)
      );

      CREATE TABLE IF NOT EXISTS artifacts (
        id TEXT PRIMARY KEY,
        stage_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (stage_id) REFERENCES stages(id)
      );

      CREATE INDEX IF NOT EXISTS idx_stages_journey
        ON stages(journey_id);

      CREATE INDEX IF NOT EXISTS idx_artifacts_stage
        ON artifacts(stage_id);
    `);
  }

  async createJourney(input: string): Promise<Journey> {
    const journey: Journey = {
      id: generateId(),
      input,
      status: 'running',
      stages: [],
      settings: DEFAULT_SETTINGS,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.db
      .prepare(
        `
      INSERT INTO journeys (id, input, status, settings, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        journey.id,
        journey.input,
        journey.status,
        JSON.stringify(journey.settings),
        journey.createdAt,
        journey.updatedAt
      );

    return journey;
  }

  // More CRUD methods...
}
```

---

## 📊 Data Models

### TypeScript Interfaces

```typescript
// src/types/index.ts

export type StageType =
  | 'discovering'
  | 'chasing'
  | 'solving'
  | 'challenging'
  | 'questioning'
  | 'searching'
  | 'imagining'
  | 'building';

export type JourneyStatus =
  | 'running'
  | 'paused'
  | 'stopped'
  | 'complete'
  | 'error';

export interface Journey {
  id: string;
  input: string;
  status: JourneyStatus;
  stages: Stage[];
  settings: JourneySettings;
  createdAt: number;
  updatedAt: number;
}

export interface Stage {
  id: string;
  journeyId: string;
  type: StageType;
  status: 'pending' | 'running' | 'complete' | 'error';
  prompt: string;
  result: string;
  thinking?: string;
  artifacts: Artifact[];
  createdAt: number;
}

export interface Artifact {
  id: string;
  stageId: string;
  type: 'document' | 'code' | 'visualization' | 'mindmap' | 'other';
  title: string;
  content: string;
  metadata: {
    language?: string;
    framework?: string;
    [key: string]: any;
  };
  createdAt: number;
}

export interface JourneySettings {
  autoContinue: boolean;
  maxStages: number;
  stageDelay: number; // ms between stages
  extendedThinking: boolean;
  computerUse: boolean;
}

export const DEFAULT_SETTINGS: JourneySettings = {
  autoContinue: true,
  maxStages: 50,
  stageDelay: 2000,
  extendedThinking: true,
  computerUse: true,
};
```

---

## 🔐 Security

### API Key Storage

```typescript
// Use Electron's safeStorage for API keys
import { safeStorage } from 'electron';

export class SecureStorage {
  static setApiKey(service: string, key: string): void {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(key);
      // Store encrypted buffer
      store.set(`${service}_api_key`, encrypted.toString('base64'));
    } else {
      throw new Error('Encryption not available');
    }
  }

  static getApiKey(service: string): string {
    const encrypted = store.get(`${service}_api_key`);
    if (!encrypted) return '';

    const buffer = Buffer.from(encrypted, 'base64');
    return safeStorage.decryptString(buffer);
  }
}
```

### Content Security Policy

```typescript
// Restrict what renderer can do
app.on('web-contents-created', (event, contents) => {
  contents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
        ],
      },
    });
  });
});
```

---

## ⚡ Performance

### Optimization Strategies

1. **Lazy Loading** - Load components only when needed
2. **Virtualization** - Use react-window for long lists
3. **Memoization** - Cache expensive calculations
4. **Code Splitting** - Split bundles for faster load
5. **Database Indexing** - Index frequently queried columns

### Performance Targets

- App launch: < 2 seconds
- Stage rendering: < 100ms
- Smooth scrolling: 60 FPS
- Memory usage: < 200MB idle

---

**Last Updated:** October 22, 2025

---

**"Architecture should be invisible to users, essential to developers."**
