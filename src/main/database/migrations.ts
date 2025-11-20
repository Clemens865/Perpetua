/**
 * Database Migrations
 * Each migration has a name, up (apply), and down (rollback) SQL
 */

export interface Migration {
  name: string;
  up: string;
  down: string;
}

export const migrations: Migration[] = [
  {
    name: '001_initial_schema',
    up: `
      -- Journeys table
      CREATE TABLE journeys (
        id TEXT PRIMARY KEY,
        input TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('running', 'paused', 'stopped', 'complete', 'error')),
        settings TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Stages table
      CREATE TABLE stages (
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

      -- Artifacts table
      CREATE TABLE artifacts (
        id TEXT PRIMARY KEY,
        stage_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('document', 'code', 'visualization', 'mindmap', 'other')),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
      );

      -- Indexes for performance
      CREATE INDEX idx_stages_journey ON stages(journey_id);
      CREATE INDEX idx_stages_created ON stages(created_at);
      CREATE INDEX idx_artifacts_stage ON artifacts(stage_id);
      CREATE INDEX idx_artifacts_created ON artifacts(created_at);
      CREATE INDEX idx_journeys_status ON journeys(status);
      CREATE INDEX idx_journeys_created ON journeys(created_at);
    `,
    down: `
      DROP INDEX IF EXISTS idx_journeys_created;
      DROP INDEX IF EXISTS idx_journeys_status;
      DROP INDEX IF EXISTS idx_artifacts_created;
      DROP INDEX IF EXISTS idx_artifacts_stage;
      DROP INDEX IF EXISTS idx_stages_created;
      DROP INDEX IF EXISTS idx_stages_journey;
      DROP TABLE IF EXISTS artifacts;
      DROP TABLE IF EXISTS stages;
      DROP TABLE IF EXISTS journeys;
    `,
  },
  {
    name: '002_add_full_text_search',
    up: `
      -- Full-text search for artifacts
      CREATE VIRTUAL TABLE artifacts_fts USING fts5(
        id UNINDEXED,
        title,
        content,
        content=artifacts,
        content_rowid=rowid
      );

      -- Triggers to keep FTS in sync
      CREATE TRIGGER artifacts_fts_insert AFTER INSERT ON artifacts BEGIN
        INSERT INTO artifacts_fts(rowid, id, title, content)
        VALUES (new.rowid, new.id, new.title, new.content);
      END;

      CREATE TRIGGER artifacts_fts_delete AFTER DELETE ON artifacts BEGIN
        DELETE FROM artifacts_fts WHERE rowid = old.rowid;
      END;

      CREATE TRIGGER artifacts_fts_update AFTER UPDATE ON artifacts BEGIN
        DELETE FROM artifacts_fts WHERE rowid = old.rowid;
        INSERT INTO artifacts_fts(rowid, id, title, content)
        VALUES (new.rowid, new.id, new.title, new.content);
      END;
    `,
    down: `
      DROP TRIGGER IF EXISTS artifacts_fts_update;
      DROP TRIGGER IF EXISTS artifacts_fts_delete;
      DROP TRIGGER IF EXISTS artifacts_fts_insert;
      DROP TABLE IF EXISTS artifacts_fts;
    `,
  },
  {
    name: '003_add_settings_table',
    up: `
      -- Application settings table
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Insert default settings
      INSERT INTO settings (key, value, updated_at) VALUES
        ('theme', 'dark', ${Date.now()}),
        ('api_key_encrypted', '', ${Date.now()}),
        ('auto_save', 'true', ${Date.now()}),
        ('extended_thinking', 'true', ${Date.now()}),
        ('computer_use', 'true', ${Date.now()});
    `,
    down: `
      DROP TABLE IF EXISTS settings;
    `,
  },
  {
    name: '004_add_journey_tags',
    up: `
      -- Tags for categorizing journeys
      CREATE TABLE tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL DEFAULT '#6366f1',
        created_at INTEGER NOT NULL
      );

      -- Junction table for journey tags
      CREATE TABLE journey_tags (
        journey_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (journey_id, tag_id),
        FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );

      -- Index for tag lookups
      CREATE INDEX idx_journey_tags_tag ON journey_tags(tag_id);
    `,
    down: `
      DROP INDEX IF EXISTS idx_journey_tags_tag;
      DROP TABLE IF EXISTS journey_tags;
      DROP TABLE IF EXISTS tags;
    `,
  },
  {
    name: '005_add_pages_table',
    up: `
      -- Pages table for generated interactive content
      CREATE TABLE pages (
        id TEXT PRIMARY KEY,
        journey_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('architect', 'multi-agent', 'template')),
        template_name TEXT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE
      );

      -- Indexes for page lookups
      CREATE INDEX idx_pages_journey ON pages(journey_id);
      CREATE INDEX idx_pages_type ON pages(type);
      CREATE INDEX idx_pages_created ON pages(created_at);
    `,
    down: `
      DROP INDEX IF EXISTS idx_pages_created;
      DROP INDEX IF EXISTS idx_pages_type;
      DROP INDEX IF EXISTS idx_pages_journey;
      DROP TABLE IF EXISTS pages;
    `,
  },
];
