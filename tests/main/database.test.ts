/**
 * Database Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from '../../src/main/database/DatabaseService';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Journey, Stage, Artifact } from '../../src/types';

describe('DatabaseService', () => {
  let db: DatabaseService;
  const testDbPath = path.join(__dirname, 'test.db');

  beforeEach(async () => {
    // Clean up test database if exists
    try {
      await fs.unlink(testDbPath);
    } catch {
      // Ignore if doesn't exist
    }

    db = new DatabaseService(testDbPath);
    await db.initialize();
  });

  afterEach(async () => {
    await db.close();
    try {
      await fs.unlink(testDbPath);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Journey Operations', () => {
    it('should create a journey', async () => {
      const journey = await db.createJourney('Test exploration');

      expect(journey).toBeDefined();
      expect(journey.id).toBeDefined();
      expect(journey.input).toBe('Test exploration');
      expect(journey.status).toBe('running');
      expect(journey.stages).toEqual([]);
    });

    it('should get a journey by ID', async () => {
      const created = await db.createJourney('Test exploration');
      const retrieved = await db.getJourney(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.input).toBe(created.input);
    });

    it('should return null for non-existent journey', async () => {
      const journey = await db.getJourney('non-existent-id');
      expect(journey).toBeNull();
    });

    it('should list all journeys', async () => {
      await db.createJourney('Journey 1');
      await db.createJourney('Journey 2');
      await db.createJourney('Journey 3');

      const journeys = await db.getAllJourneys();

      expect(journeys).toHaveLength(3);
      expect(journeys[0].input).toBe('Journey 3'); // Most recent first
    });

    it('should update journey status', async () => {
      const journey = await db.createJourney('Test');
      await db.updateJourney(journey.id, { status: 'paused' });

      const updated = await db.getJourney(journey.id);
      expect(updated?.status).toBe('paused');
    });

    it('should delete a journey and its stages', async () => {
      const journey = await db.createJourney('Test');
      await db.deleteJourney(journey.id);

      const retrieved = await db.getJourney(journey.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Stage Operations', () => {
    let journeyId: string;

    beforeEach(async () => {
      const journey = await db.createJourney('Test journey');
      journeyId = journey.id;
    });

    it('should create a stage', async () => {
      const stage: Stage = {
        id: 'stage-1',
        journeyId,
        type: 'discovering',
        status: 'complete',
        prompt: 'Test prompt',
        result: 'Test result',
        artifacts: [],
        createdAt: Date.now(),
      };

      await db.createStage(stage);

      const stages = await db.getStagesByJourney(journeyId);
      expect(stages).toHaveLength(1);
      expect(stages[0].id).toBe('stage-1');
    });

    it('should get stages by journey ID', async () => {
      const stage1: Stage = {
        id: 'stage-1',
        journeyId,
        type: 'discovering',
        status: 'complete',
        prompt: 'Prompt 1',
        result: 'Result 1',
        artifacts: [],
        createdAt: Date.now(),
      };

      const stage2: Stage = {
        id: 'stage-2',
        journeyId,
        type: 'chasing',
        status: 'complete',
        prompt: 'Prompt 2',
        result: 'Result 2',
        artifacts: [],
        createdAt: Date.now() + 1000,
      };

      await db.createStage(stage1);
      await db.createStage(stage2);

      const stages = await db.getStagesByJourney(journeyId);
      expect(stages).toHaveLength(2);
      expect(stages[0].type).toBe('discovering');
      expect(stages[1].type).toBe('chasing');
    });

    it('should update stage status', async () => {
      const stage: Stage = {
        id: 'stage-1',
        journeyId,
        type: 'discovering',
        status: 'running',
        prompt: 'Test',
        result: '',
        artifacts: [],
        createdAt: Date.now(),
      };

      await db.createStage(stage);
      await db.updateStage('stage-1', { status: 'complete', result: 'Done' });

      const stages = await db.getStagesByJourney(journeyId);
      expect(stages[0].status).toBe('complete');
      expect(stages[0].result).toBe('Done');
    });
  });

  describe('Artifact Operations', () => {
    let stageId: string;

    beforeEach(async () => {
      const journey = await db.createJourney('Test journey');
      const stage: Stage = {
        id: 'stage-1',
        journeyId: journey.id,
        type: 'building',
        status: 'complete',
        prompt: 'Test',
        result: 'Result',
        artifacts: [],
        createdAt: Date.now(),
      };
      await db.createStage(stage);
      stageId = stage.id;
    });

    it('should create an artifact', async () => {
      const artifact: Artifact = {
        id: 'artifact-1',
        stageId,
        type: 'code',
        title: 'Test Code',
        content: 'console.log("test")',
        metadata: { language: 'javascript' },
        createdAt: Date.now(),
      };

      await db.createArtifact(artifact);

      const artifacts = await db.getArtifactsByStage(stageId);
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0].title).toBe('Test Code');
    });

    it('should get artifact by ID', async () => {
      const artifact: Artifact = {
        id: 'artifact-1',
        stageId,
        type: 'document',
        title: 'Test Doc',
        content: 'Test content',
        metadata: {},
        createdAt: Date.now(),
      };

      await db.createArtifact(artifact);

      const retrieved = await db.getArtifact('artifact-1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe('Test Doc');
    });

    it('should search artifacts by content', async () => {
      const artifact1: Artifact = {
        id: 'artifact-1',
        stageId,
        type: 'code',
        title: 'Python Script',
        content: 'def hello(): print("Hello")',
        metadata: { language: 'python' },
        createdAt: Date.now(),
      };

      const artifact2: Artifact = {
        id: 'artifact-2',
        stageId,
        type: 'code',
        title: 'JavaScript Code',
        content: 'function hello() { console.log("Hi"); }',
        metadata: { language: 'javascript' },
        createdAt: Date.now(),
      };

      await db.createArtifact(artifact1);
      await db.createArtifact(artifact2);

      const results = await db.searchArtifacts('python');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Python Script');
    });
  });

  describe('Statistics', () => {
    it('should get database statistics', async () => {
      // Create test data
      const journey = await db.createJourney('Test');
      const stage: Stage = {
        id: 'stage-1',
        journeyId: journey.id,
        type: 'discovering',
        status: 'complete',
        prompt: 'Test',
        result: 'Result',
        artifacts: [],
        createdAt: Date.now(),
      };
      await db.createStage(stage);

      const artifact: Artifact = {
        id: 'artifact-1',
        stageId: stage.id,
        type: 'document',
        title: 'Doc',
        content: 'Content',
        metadata: {},
        createdAt: Date.now(),
      };
      await db.createArtifact(artifact);

      const stats = await db.getStats();

      expect(stats.journeys).toBe(1);
      expect(stats.stages).toBe(1);
      expect(stats.artifacts).toBe(1);
    });
  });
});
