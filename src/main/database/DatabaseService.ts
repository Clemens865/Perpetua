/**
 * Database Service
 * Type-safe SQLite wrapper with migrations
 */

import Database from 'better-sqlite3';
import * as fs from 'fs/promises';
import * as path from 'path';
import logger from '../utils/logger';
import { migrations } from './migrations';
import type {
  Journey,
  Stage,
  Artifact,
  Page,
  JourneySettings,
  JourneyStatus,
  StageType,
} from '../../types';

export class DatabaseService {
  private db: Database.Database | null = null;
  private readonly dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  /**
   * Initialize database connection and run migrations
   */
  async initialize(): Promise<void> {
    logger.info(`Initializing database at ${this.dbPath}`);

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });

      // Open database connection
      this.db = new Database(this.dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? (msg: string) => logger.debug(msg) : undefined,
      });

      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');

      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');

      // Run migrations
      await this.runMigrations();

      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database', error);
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    logger.info('Running database migrations');

    // Create migrations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at INTEGER NOT NULL
      )
    `);

    // Get applied migrations
    const appliedMigrations = this.db
      .prepare('SELECT name FROM migrations')
      .all() as { name: string }[];

    const appliedNames = new Set(appliedMigrations.map((m) => m.name));

    // Apply pending migrations
    for (const migration of migrations) {
      if (appliedNames.has(migration.name)) {
        logger.debug(`Migration ${migration.name} already applied`);
        continue;
      }

      logger.info(`Applying migration: ${migration.name}`);

      const transaction = this.db.transaction(() => {
        // Run migration SQL
        this.db!.exec(migration.up);

        // Record migration
        this.db!
          .prepare('INSERT INTO migrations (name, applied_at) VALUES (?, ?)')
          .run(migration.name, Date.now());
      });

      transaction();
      logger.info(`Migration ${migration.name} applied successfully`);
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      logger.info('Closing database connection');
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Create a new journey
   */
  async createJourney(input: string, settings?: Partial<JourneySettings>): Promise<Journey> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();
    const now = Date.now();

    const defaultSettings: JourneySettings = {
      autoContinue: true,
      maxStages: 50,
      stageDelay: 2000,
      extendedThinking: true,
      computerUse: true,
    };

    const journeySettings = { ...defaultSettings, ...settings };

    this.db
      .prepare(
        `
        INSERT INTO journeys (id, input, status, settings, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `
      )
      .run(id, input, 'running', JSON.stringify(journeySettings), now, now);

    return {
      id,
      input,
      status: 'running',
      stages: [],
      settings: journeySettings,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Get journey by ID
   */
  async getJourney(id: string): Promise<Journey | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = this.db
      .prepare('SELECT * FROM journeys WHERE id = ?')
      .get(id) as any;

    if (!row) return null;

    const stages = await this.getStagesByJourney(id);

    return {
      id: row.id,
      input: row.input,
      status: row.status as JourneyStatus,
      stages,
      settings: JSON.parse(row.settings),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Get all journeys
   */
  async getAllJourneys(limit = 50, offset = 0): Promise<Journey[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = this.db
      .prepare(
        `
        SELECT * FROM journeys
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `
      )
      .all(limit, offset) as any[];

    return Promise.all(
      rows.map(async (row) => {
        const stages = await this.getStagesByJourney(row.id);
        return {
          id: row.id,
          input: row.input,
          status: row.status as JourneyStatus,
          stages,
          settings: JSON.parse(row.settings),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      })
    );
  }

  /**
   * Update journey
   */
  async updateJourney(
    id: string,
    updates: Partial<Omit<Journey, 'id' | 'createdAt'>>
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sets: string[] = [];
    const values: any[] = [];

    if (updates.status) {
      sets.push('status = ?');
      values.push(updates.status);
    }

    if (updates.settings) {
      sets.push('settings = ?');
      values.push(JSON.stringify(updates.settings));
    }

    sets.push('updated_at = ?');
    values.push(Date.now());

    values.push(id);

    this.db
      .prepare(`UPDATE journeys SET ${sets.join(', ')} WHERE id = ?`)
      .run(...values);
  }

  /**
   * Delete journey
   */
  async deleteJourney(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(() => {
      // Delete artifacts first
      this.db!.prepare('DELETE FROM artifacts WHERE stage_id IN (SELECT id FROM stages WHERE journey_id = ?)').run(id);

      // Delete stages
      this.db!.prepare('DELETE FROM stages WHERE journey_id = ?').run(id);

      // Delete journey
      this.db!.prepare('DELETE FROM journeys WHERE id = ?').run(id);
    });

    transaction();
  }

  /**
   * Create a new stage
   */
  async createStage(stage: Stage): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    this.db
      .prepare(
        `
        INSERT INTO stages (id, journey_id, type, status, prompt, result, thinking, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        stage.id,
        stage.journeyId,
        stage.type,
        stage.status,
        stage.prompt,
        stage.result,
        stage.thinking || null,
        stage.createdAt
      );

    // Create artifacts
    for (const artifact of stage.artifacts) {
      await this.createArtifact(artifact);
    }
  }

  /**
   * Get stages by journey ID
   */
  async getStagesByJourney(journeyId: string): Promise<Stage[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = this.db
      .prepare(
        `
        SELECT * FROM stages
        WHERE journey_id = ?
        ORDER BY created_at ASC
      `
      )
      .all(journeyId) as any[];

    return Promise.all(
      rows.map(async (row) => {
        const artifacts = await this.getArtifactsByStage(row.id);
        return {
          id: row.id,
          journeyId: row.journey_id,
          type: row.type as StageType,
          status: row.status,
          prompt: row.prompt,
          result: row.result,
          thinking: row.thinking,
          artifacts,
          createdAt: row.created_at,
        };
      })
    );
  }

  /**
   * Update stage
   */
  async updateStage(id: string, updates: Partial<Stage>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const sets: string[] = [];
    const values: any[] = [];

    if (updates.status) {
      sets.push('status = ?');
      values.push(updates.status);
    }

    if (updates.result) {
      sets.push('result = ?');
      values.push(updates.result);
    }

    if (updates.thinking) {
      sets.push('thinking = ?');
      values.push(updates.thinking);
    }

    values.push(id);

    if (sets.length > 0) {
      this.db
        .prepare(`UPDATE stages SET ${sets.join(', ')} WHERE id = ?`)
        .run(...values);
    }
  }

  /**
   * Create an artifact
   */
  async createArtifact(artifact: Artifact): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    this.db
      .prepare(
        `
        INSERT INTO artifacts (id, stage_id, type, title, content, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        artifact.id,
        artifact.stageId,
        artifact.type,
        artifact.title,
        artifact.content,
        JSON.stringify(artifact.metadata),
        artifact.createdAt
      );
  }

  /**
   * Get artifacts by stage ID
   */
  async getArtifactsByStage(stageId: string): Promise<Artifact[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = this.db
      .prepare(
        `
        SELECT * FROM artifacts
        WHERE stage_id = ?
        ORDER BY created_at ASC
      `
      )
      .all(stageId) as any[];

    return rows.map((row) => ({
      id: row.id,
      stageId: row.stage_id,
      type: row.type,
      title: row.title,
      content: row.content,
      metadata: JSON.parse(row.metadata),
      createdAt: row.created_at,
    }));
  }

  /**
   * Get artifact by ID
   */
  async getArtifact(id: string): Promise<Artifact | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = this.db
      .prepare('SELECT * FROM artifacts WHERE id = ?')
      .get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      stageId: row.stage_id,
      type: row.type,
      title: row.title,
      content: row.content,
      metadata: JSON.parse(row.metadata),
      createdAt: row.created_at,
    };
  }

  /**
   * Search artifacts by content
   */
  async searchArtifacts(query: string, limit = 20): Promise<Artifact[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = this.db
      .prepare(
        `
        SELECT * FROM artifacts
        WHERE title LIKE ? OR content LIKE ?
        ORDER BY created_at DESC
        LIMIT ?
      `
      )
      .all(`%${query}%`, `%${query}%`, limit) as any[];

    return rows.map((row) => ({
      id: row.id,
      stageId: row.stage_id,
      type: row.type,
      title: row.title,
      content: row.content,
      metadata: JSON.parse(row.metadata),
      createdAt: row.created_at,
    }));
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    journeys: number;
    stages: number;
    artifacts: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const journeys = this.db
      .prepare('SELECT COUNT(*) as count FROM journeys')
      .get() as { count: number };

    const stages = this.db
      .prepare('SELECT COUNT(*) as count FROM stages')
      .get() as { count: number };

    const artifacts = this.db
      .prepare('SELECT COUNT(*) as count FROM artifacts')
      .get() as { count: number };

    return {
      journeys: journeys.count,
      stages: stages.count,
      artifacts: artifacts.count,
    };
  }

  /**
   * Create a new page
   */
  async createPage(page: Page): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    this.db
      .prepare(
        `
        INSERT INTO pages (id, journey_id, type, template_name, title, content, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        page.id,
        page.journeyId,
        page.type,
        page.templateName || null,
        page.title,
        page.content,
        page.metadata ? JSON.stringify(page.metadata) : null,
        page.createdAt
      );
  }

  /**
   * Get page by ID
   */
  async getPage(id: string): Promise<Page | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = this.db
      .prepare('SELECT * FROM pages WHERE id = ?')
      .get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      journeyId: row.journey_id,
      type: row.type,
      templateName: row.template_name || undefined,
      title: row.title,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
    };
  }

  /**
   * Get pages by journey ID
   */
  async getPagesByJourney(journeyId: string): Promise<Page[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = this.db
      .prepare(
        `
        SELECT * FROM pages
        WHERE journey_id = ?
        ORDER BY created_at DESC
      `
      )
      .all(journeyId) as any[];

    return rows.map((row) => ({
      id: row.id,
      journeyId: row.journey_id,
      type: row.type,
      templateName: row.template_name || undefined,
      title: row.title,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
    }));
  }

  /**
   * Delete page
   */
  async deletePage(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    this.db.prepare('DELETE FROM pages WHERE id = ?').run(id);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
