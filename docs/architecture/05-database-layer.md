# Database Layer Architecture

**Document Type:** Architecture Specification
**Status:** Approved
**Last Updated:** 2025-10-22
**Version:** 1.0.0

---

## Overview

Perpetua uses **SQLite** via `better-sqlite3` for local-first data storage with:
- 🚀 Fast synchronous operations
- 💾 ACID transactions
- 🔒 Type-safe queries
- 📦 Zero configuration
- 🔄 Simple migrations

---

## Database Schema

```sql
-- Journeys table
CREATE TABLE IF NOT EXISTS journeys (
  id TEXT PRIMARY KEY,
  input TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('running', 'paused', 'stopped', 'complete', 'error')),
  settings TEXT NOT NULL, -- JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_journeys_status ON journeys(status);
CREATE INDEX idx_journeys_created_at ON journeys(created_at DESC);

-- Stages table
CREATE TABLE IF NOT EXISTS stages (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('discovering', 'chasing', 'solving', 'challenging', 'questioning', 'searching', 'imagining', 'building')),
  status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'complete', 'error')),
  prompt TEXT,
  result TEXT,
  thinking TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE
);

CREATE INDEX idx_stages_journey ON stages(journey_id);
CREATE INDEX idx_stages_status ON stages(status);
CREATE INDEX idx_stages_created_at ON stages(created_at DESC);

-- Artifacts table
CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  stage_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('document', 'code', 'visualization', 'mindmap', 'other')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT, -- JSON
  created_at INTEGER NOT NULL,
  FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
);

CREATE INDEX idx_artifacts_stage ON artifacts(stage_id);
CREATE INDEX idx_artifacts_type ON artifacts(type);
CREATE INDEX idx_artifacts_created_at ON artifacts(created_at DESC);

-- Full-text search for artifacts
CREATE VIRTUAL TABLE IF NOT EXISTS artifacts_fts USING fts5(
  title,
  content,
  content=artifacts,
  content_rowid=rowid
);

-- Triggers to keep FTS in sync
CREATE TRIGGER artifacts_ai AFTER INSERT ON artifacts BEGIN
  INSERT INTO artifacts_fts(rowid, title, content)
  VALUES (new.rowid, new.title, new.content);
END;

CREATE TRIGGER artifacts_ad AFTER DELETE ON artifacts BEGIN
  DELETE FROM artifacts_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER artifacts_au AFTER UPDATE ON artifacts BEGIN
  UPDATE artifacts_fts
  SET title = new.title, content = new.content
  WHERE rowid = new.rowid;
END;
```

---

## Database Service

```typescript
// src/main/services/database.service.ts

import Database from 'better-sqlite3';
import type { Journey, Stage, Artifact } from '@types';
import { generateId } from '@lib/utils/id';
import path from 'path';
import { app } from 'electron';

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'perpetua.db');
    this.db = new Database(dbPath);

    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');

    // Initialize schema
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
      -- Schema creation (as shown above)
    `);
  }

  /**
   * Journey operations
   */
  journey = {
    create: (input: { input: string; settings?: Partial<JourneySettings> }): Journey => {
      const journey: Journey = {
        id: generateId('journey'),
        input: input.input,
        status: 'running',
        stages: [],
        settings: { ...DEFAULT_SETTINGS, ...input.settings },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const stmt = this.db.prepare(`
        INSERT INTO journeys (id, input, status, settings, created_at, updated_at)
        VALUES (@id, @input, @status, @settings, @createdAt, @updatedAt)
      `);

      stmt.run({
        id: journey.id,
        input: journey.input,
        status: journey.status,
        settings: JSON.stringify(journey.settings),
        createdAt: journey.createdAt,
        updatedAt: journey.updatedAt,
      });

      return journey;
    },

    findById: (id: string): Journey | null => {
      const stmt = this.db.prepare(`
        SELECT * FROM journeys WHERE id = ?
      `);

      const row = stmt.get(id) as any;

      if (!row) return null;

      return this.mapJourney(row);
    },

    findAll: (options: { limit?: number; offset?: number } = {}): Journey[] => {
      const { limit = 50, offset = 0 } = options;

      const stmt = this.db.prepare(`
        SELECT * FROM journeys
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `);

      const rows = stmt.all(limit, offset) as any[];

      return rows.map(row => this.mapJourney(row));
    },

    update: (id: string, updates: Partial<Journey>): Journey => {
      const fields: string[] = [];
      const values: any = { id };

      if (updates.status) {
        fields.push('status = @status');
        values.status = updates.status;
      }

      if (updates.settings) {
        fields.push('settings = @settings');
        values.settings = JSON.stringify(updates.settings);
      }

      fields.push('updated_at = @updatedAt');
      values.updatedAt = Date.now();

      const stmt = this.db.prepare(`
        UPDATE journeys
        SET ${fields.join(', ')}
        WHERE id = @id
      `);

      stmt.run(values);

      return this.journey.findById(id)!;
    },

    delete: (id: string): void => {
      const stmt = this.db.prepare('DELETE FROM journeys WHERE id = ?');
      stmt.run(id);
    },

    getWithStages: (id: string): Journey | null => {
      const journey = this.journey.findById(id);

      if (!journey) return null;

      // Get all stages for journey
      const stages = this.stage.findByJourneyId(id);
      journey.stages = stages;

      return journey;
    },
  };

  /**
   * Stage operations
   */
  stage = {
    create: (input: { journeyId: string; type: StageType }): Stage => {
      const stage: Stage = {
        id: generateId('stage'),
        journeyId: input.journeyId,
        type: input.type,
        status: 'pending',
        prompt: '',
        result: '',
        thinking: undefined,
        artifacts: [],
        createdAt: Date.now(),
      };

      const stmt = this.db.prepare(`
        INSERT INTO stages (id, journey_id, type, status, prompt, result, thinking, created_at)
        VALUES (@id, @journeyId, @type, @status, @prompt, @result, @thinking, @createdAt)
      `);

      stmt.run({
        id: stage.id,
        journeyId: stage.journeyId,
        type: stage.type,
        status: stage.status,
        prompt: stage.prompt,
        result: stage.result,
        thinking: stage.thinking || null,
        createdAt: stage.createdAt,
      });

      return stage;
    },

    findById: (id: string): Stage | null => {
      const stmt = this.db.prepare('SELECT * FROM stages WHERE id = ?');
      const row = stmt.get(id) as any;

      if (!row) return null;

      return this.mapStage(row);
    },

    findByJourneyId: (journeyId: string): Stage[] => {
      const stmt = this.db.prepare(`
        SELECT * FROM stages
        WHERE journey_id = ?
        ORDER BY created_at ASC
      `);

      const rows = stmt.all(journeyId) as any[];

      return rows.map(row => this.mapStage(row));
    },

    update: (id: string, updates: Partial<Stage>): Stage => {
      const fields: string[] = [];
      const values: any = { id };

      if (updates.status) {
        fields.push('status = @status');
        values.status = updates.status;
      }

      if (updates.prompt !== undefined) {
        fields.push('prompt = @prompt');
        values.prompt = updates.prompt;
      }

      if (updates.result !== undefined) {
        fields.push('result = @result');
        values.result = updates.result;
      }

      if (updates.thinking !== undefined) {
        fields.push('thinking = @thinking');
        values.thinking = updates.thinking;
      }

      const stmt = this.db.prepare(`
        UPDATE stages
        SET ${fields.join(', ')}
        WHERE id = @id
      `);

      stmt.run(values);

      return this.stage.findById(id)!;
    },
  };

  /**
   * Artifact operations
   */
  artifact = {
    create: (input: {
      stageId: string;
      type: ArtifactType;
      title: string;
      content: string;
      metadata?: any;
    }): Artifact => {
      const artifact: Artifact = {
        id: generateId('artifact'),
        stageId: input.stageId,
        type: input.type,
        title: input.title,
        content: input.content,
        metadata: input.metadata || {},
        createdAt: Date.now(),
      };

      const stmt = this.db.prepare(`
        INSERT INTO artifacts (id, stage_id, type, title, content, metadata, created_at)
        VALUES (@id, @stageId, @type, @title, @content, @metadata, @createdAt)
      `);

      stmt.run({
        id: artifact.id,
        stageId: artifact.stageId,
        type: artifact.type,
        title: artifact.title,
        content: artifact.content,
        metadata: JSON.stringify(artifact.metadata),
        createdAt: artifact.createdAt,
      });

      return artifact;
    },

    findByStageId: (stageId: string): Artifact[] => {
      const stmt = this.db.prepare(`
        SELECT * FROM artifacts
        WHERE stage_id = ?
        ORDER BY created_at ASC
      `);

      const rows = stmt.all(stageId) as any[];

      return rows.map(row => this.mapArtifact(row));
    },

    search: (query: string, options: { limit?: number } = {}): Artifact[] => {
      const { limit = 20 } = options;

      const stmt = this.db.prepare(`
        SELECT a.*
        FROM artifacts_fts fts
        JOIN artifacts a ON a.rowid = fts.rowid
        WHERE artifacts_fts MATCH ?
        ORDER BY rank
        LIMIT ?
      `);

      const rows = stmt.all(query, limit) as any[];

      return rows.map(row => this.mapArtifact(row));
    },
  };

  /**
   * Transactions
   */
  transaction<T>(callback: () => T): T {
    const transaction = this.db.transaction(callback);
    return transaction();
  }

  /**
   * Cleanup
   */
  close(): void {
    this.db.close();
  }

  /**
   * Mapping functions
   */
  private mapJourney(row: any): Journey {
    return {
      id: row.id,
      input: row.input,
      status: row.status,
      stages: [], // Load separately if needed
      settings: JSON.parse(row.settings),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapStage(row: any): Stage {
    return {
      id: row.id,
      journeyId: row.journey_id,
      type: row.type,
      status: row.status,
      prompt: row.prompt,
      result: row.result,
      thinking: row.thinking || undefined,
      artifacts: [], // Load separately if needed
      createdAt: row.created_at,
    };
  }

  private mapArtifact(row: any): Artifact {
    return {
      id: row.id,
      stageId: row.stage_id,
      type: row.type,
      title: row.title,
      content: row.content,
      metadata: JSON.parse(row.metadata || '{}'),
      createdAt: row.created_at,
    };
  }
}
```

---

## Migrations

```typescript
// src/main/services/migrations.ts

export interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
  down: (db: Database.Database) => void;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: (db) => {
      db.exec(`
        -- Initial schema (as shown above)
      `);
    },
    down: (db) => {
      db.exec(`
        DROP TABLE IF EXISTS artifacts_fts;
        DROP TABLE IF EXISTS artifacts;
        DROP TABLE IF EXISTS stages;
        DROP TABLE IF EXISTS journeys;
      `);
    },
  },
  // Add future migrations here
];

export function runMigrations(db: Database.Database): void {
  // Create migrations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    )
  `);

  // Get current version
  const currentVersion = db
    .prepare('SELECT MAX(version) as version FROM migrations')
    .get() as { version: number | null };

  const version = currentVersion.version || 0;

  // Run pending migrations
  for (const migration of migrations) {
    if (migration.version > version) {
      console.log(`Running migration ${migration.version}: ${migration.name}`);

      db.transaction(() => {
        migration.up(db);

        db.prepare('INSERT INTO migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
          migration.version,
          migration.name,
          Date.now()
        );
      })();
    }
  }
}
```

---

## Type-Safe Query Builder

```typescript
// src/main/services/query-builder.ts

type WhereClause = {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN';
  value: any;
};

export class QueryBuilder<T> {
  private table: string;
  private whereC lauses: WhereClause[] = [];
  private orderBy?: { field: string; direction: 'ASC' | 'DESC' };
  private limitValue?: number;
  private offsetValue?: number;

  constructor(table: string) {
    this.table = table;
  }

  where(field: string, operator: WhereClause['operator'], value: any): this {
    this.whereClauses.push({ field, operator, value });
    return this;
  }

  order(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderBy = { field, direction };
    return this;
  }

  limit(value: number): this {
    this.limitValue = value;
    return this;
  }

  offset(value: number): this {
    this.offsetValue = value;
    return this;
  }

  build(): { sql: string; params: any[] } {
    let sql = `SELECT * FROM ${this.table}`;
    const params: any[] = [];

    if (this.whereClauses.length > 0) {
      const conditions = this.whereClauses.map((clause) => {
        if (clause.operator === 'IN') {
          const placeholders = clause.value.map(() => '?').join(', ');
          params.push(...clause.value);
          return `${clause.field} IN (${placeholders})`;
        } else {
          params.push(clause.value);
          return `${clause.field} ${clause.operator} ?`;
        }
      });

      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (this.orderBy) {
      sql += ` ORDER BY ${this.orderBy.field} ${this.orderBy.direction}`;
    }

    if (this.limitValue !== undefined) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    if (this.offsetValue !== undefined) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return { sql, params };
  }
}
```

---

## Best Practices

1. **Always use prepared statements** (prevents SQL injection)
2. **Use transactions** for multi-step operations
3. **Index frequently queried columns**
4. **Use JSON for flexible metadata**
5. **Enable WAL mode** for better concurrency
6. **Implement migrations** for schema changes
7. **Use full-text search** for content search
8. **Close database** on app exit

---

**Last Updated:** 2025-10-22
**Status:** Approved
**Version:** 1.0.0
