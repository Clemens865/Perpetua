/**
 * Integration tests for database operations
 * Tests real SQLite interactions with in-memory database
 */

import Database from 'better-sqlite3';
import { DatabaseService } from '../../src/lib/services/DatabaseService';
import type { Journey, Stage, Artifact } from '../../src/types';

describe('Database Integration Tests', () => {
  let db: DatabaseService;

  beforeEach(() => {
    // Use in-memory database for tests
    db = new DatabaseService(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  describe('Journey CRUD Operations', () => {
    it('should create and retrieve journey', async () => {
      const journey = await db.createJourney('Test input');

      expect(journey.id).toBeDefined();
      expect(journey.input).toBe('Test input');
      expect(journey.status).toBe('running');

      const retrieved = await db.getJourney(journey.id);

      expect(retrieved).toMatchObject({
        id: journey.id,
        input: 'Test input',
        status: 'running',
      });
    });

    it('should update journey status', async () => {
      const journey = await db.createJourney('Test');

      journey.status = 'complete';
      await db.updateJourney(journey);

      const updated = await db.getJourney(journey.id);

      expect(updated?.status).toBe('complete');
    });

    it('should delete journey', async () => {
      const journey = await db.createJourney('Test');

      await db.deleteJourney(journey.id);

      const deleted = await db.getJourney(journey.id);

      expect(deleted).toBeNull();
    });

    it('should list all journeys', async () => {
      await db.createJourney('Journey 1');
      await db.createJourney('Journey 2');
      await db.createJourney('Journey 3');

      const journeys = await db.listJourneys();

      expect(journeys).toHaveLength(3);
    });

    it('should maintain journey relationships', async () => {
      const journey = await db.createJourney('Test');

      const stage: Stage = {
        id: 'stage_123',
        journeyId: journey.id,
        type: 'discovering',
        status: 'complete',
        prompt: 'Test prompt',
        result: 'Test result',
        artifacts: [],
        createdAt: Date.now(),
      };

      await db.createStage(stage);

      const stages = await db.getStagesByJourney(journey.id);

      expect(stages).toHaveLength(1);
      expect(stages[0].journeyId).toBe(journey.id);
    });
  });

  describe('Stage Operations', () => {
    let journeyId: string;

    beforeEach(async () => {
      const journey = await db.createJourney('Test');
      journeyId = journey.id;
    });

    it('should create and retrieve stage', async () => {
      const stage: Stage = {
        id: 'stage_123',
        journeyId,
        type: 'discovering',
        status: 'complete',
        prompt: 'Test prompt',
        result: 'Test result',
        thinking: 'Test thinking',
        artifacts: [],
        createdAt: Date.now(),
      };

      await db.createStage(stage);

      const retrieved = await db.getStage(stage.id);

      expect(retrieved).toMatchObject({
        id: stage.id,
        journeyId,
        type: 'discovering',
        result: 'Test result',
      });
    });

    it('should get stages by journey in order', async () => {
      const stages: Stage[] = [
        {
          id: 'stage_1',
          journeyId,
          type: 'discovering',
          status: 'complete',
          prompt: 'Prompt 1',
          result: 'Result 1',
          artifacts: [],
          createdAt: Date.now(),
        },
        {
          id: 'stage_2',
          journeyId,
          type: 'chasing',
          status: 'complete',
          prompt: 'Prompt 2',
          result: 'Result 2',
          artifacts: [],
          createdAt: Date.now() + 1000,
        },
        {
          id: 'stage_3',
          journeyId,
          type: 'solving',
          status: 'complete',
          prompt: 'Prompt 3',
          result: 'Result 3',
          artifacts: [],
          createdAt: Date.now() + 2000,
        },
      ];

      for (const stage of stages) {
        await db.createStage(stage);
      }

      const retrieved = await db.getStagesByJourney(journeyId);

      expect(retrieved).toHaveLength(3);
      expect(retrieved[0].type).toBe('discovering');
      expect(retrieved[1].type).toBe('chasing');
      expect(retrieved[2].type).toBe('solving');
    });

    it('should update stage status', async () => {
      const stage: Stage = {
        id: 'stage_123',
        journeyId,
        type: 'discovering',
        status: 'running',
        prompt: 'Test',
        result: '',
        artifacts: [],
        createdAt: Date.now(),
      };

      await db.createStage(stage);

      stage.status = 'complete';
      stage.result = 'Completed result';
      await db.updateStage(stage);

      const updated = await db.getStage(stage.id);

      expect(updated?.status).toBe('complete');
      expect(updated?.result).toBe('Completed result');
    });
  });

  describe('Artifact Operations', () => {
    let stageId: string;

    beforeEach(async () => {
      const journey = await db.createJourney('Test');
      const stage: Stage = {
        id: 'stage_123',
        journeyId: journey.id,
        type: 'building',
        status: 'complete',
        prompt: 'Build something',
        result: 'Built',
        artifacts: [],
        createdAt: Date.now(),
      };
      await db.createStage(stage);
      stageId = stage.id;
    });

    it('should create and retrieve artifact', async () => {
      const artifact: Artifact = {
        id: 'artifact_123',
        stageId,
        type: 'code',
        title: 'Component.tsx',
        content: 'const Component = () => <div>Hello</div>;',
        metadata: {
          language: 'typescript',
          framework: 'react',
        },
        createdAt: Date.now(),
      };

      await db.createArtifact(artifact);

      const retrieved = await db.getArtifact(artifact.id);

      expect(retrieved).toMatchObject({
        id: artifact.id,
        stageId,
        type: 'code',
        title: 'Component.tsx',
      });
      expect(retrieved?.metadata.language).toBe('typescript');
    });

    it('should get artifacts by stage', async () => {
      const artifacts: Artifact[] = [
        {
          id: 'artifact_1',
          stageId,
          type: 'code',
          title: 'File1.ts',
          content: 'Code 1',
          metadata: {},
          createdAt: Date.now(),
        },
        {
          id: 'artifact_2',
          stageId,
          type: 'document',
          title: 'Doc1.md',
          content: 'Documentation',
          metadata: {},
          createdAt: Date.now() + 1000,
        },
      ];

      for (const artifact of artifacts) {
        await db.createArtifact(artifact);
      }

      const retrieved = await db.getArtifactsByStage(stageId);

      expect(retrieved).toHaveLength(2);
      expect(retrieved[0].type).toBe('code');
      expect(retrieved[1].type).toBe('document');
    });

    it('should handle large artifact content', async () => {
      const largeContent = 'x'.repeat(100000); // 100KB of content

      const artifact: Artifact = {
        id: 'artifact_large',
        stageId,
        type: 'code',
        title: 'LargeFile.ts',
        content: largeContent,
        metadata: {},
        createdAt: Date.now(),
      };

      await db.createArtifact(artifact);

      const retrieved = await db.getArtifact(artifact.id);

      expect(retrieved?.content).toBe(largeContent);
      expect(retrieved?.content.length).toBe(100000);
    });
  });

  describe('Transaction Support', () => {
    it('should commit successful transactions', async () => {
      await db.transaction(async () => {
        await db.createJourney('Journey 1');
        await db.createJourney('Journey 2');
      });

      const journeys = await db.listJourneys();

      expect(journeys).toHaveLength(2);
    });

    it('should rollback failed transactions', async () => {
      try {
        await db.transaction(async () => {
          await db.createJourney('Journey 1');
          throw new Error('Simulated error');
        });
      } catch (error) {
        // Expected error
      }

      const journeys = await db.listJourneys();

      expect(journeys).toHaveLength(0);
    });
  });

  describe('Indexes and Performance', () => {
    it('should efficiently query large datasets', async () => {
      const journey = await db.createJourney('Performance test');

      // Create 100 stages
      const stages: Stage[] = [];
      for (let i = 0; i < 100; i++) {
        stages.push({
          id: `stage_${i}`,
          journeyId: journey.id,
          type: 'discovering',
          status: 'complete',
          prompt: `Prompt ${i}`,
          result: `Result ${i}`,
          artifacts: [],
          createdAt: Date.now() + i,
        });
      }

      for (const stage of stages) {
        await db.createStage(stage);
      }

      const start = Date.now();
      const retrieved = await db.getStagesByJourney(journey.id);
      const duration = Date.now() - start;

      expect(retrieved).toHaveLength(100);
      expect(duration).toBeLessThan(100); // Should be fast with indexes
    });
  });

  describe('Data Integrity', () => {
    it('should enforce foreign key constraints', async () => {
      const stage: Stage = {
        id: 'stage_orphan',
        journeyId: 'nonexistent_journey',
        type: 'discovering',
        status: 'complete',
        prompt: 'Test',
        result: 'Result',
        artifacts: [],
        createdAt: Date.now(),
      };

      await expect(db.createStage(stage)).rejects.toThrow();
    });

    it('should cascade deletes', async () => {
      const journey = await db.createJourney('Test');

      const stage: Stage = {
        id: 'stage_123',
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
        id: 'artifact_123',
        stageId: stage.id,
        type: 'code',
        title: 'Test.ts',
        content: 'Code',
        metadata: {},
        createdAt: Date.now(),
      };

      await db.createArtifact(artifact);

      // Delete journey should cascade to stages and artifacts
      await db.deleteJourney(journey.id);

      const deletedStage = await db.getStage(stage.id);
      const deletedArtifact = await db.getArtifact(artifact.id);

      expect(deletedStage).toBeNull();
      expect(deletedArtifact).toBeNull();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent writes', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(db.createJourney(`Journey ${i}`));
      }

      const journeys = await Promise.all(promises);

      expect(journeys).toHaveLength(10);

      const allJourneys = await db.listJourneys();

      expect(allJourneys).toHaveLength(10);
    });
  });
});
