/**
 * Unit tests for DatabaseService
 * Tests SQLite operations, CRUD operations, and data integrity
 */

import Database from 'better-sqlite3';
import { DatabaseService } from '../../../src/lib/services/DatabaseService';
import type { Journey, Stage, Artifact } from '../../../src/types';

// Mock better-sqlite3
jest.mock('better-sqlite3');

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockDb: jest.Mocked<Database.Database>;

  beforeEach(() => {
    mockDb = {
      exec: jest.fn(),
      prepare: jest.fn().mockReturnValue({
        run: jest.fn(),
        get: jest.fn(),
        all: jest.fn(),
      }),
      close: jest.fn(),
    } as any;

    (Database as jest.MockedClass<typeof Database>).mockImplementation(
      () => mockDb
    );

    service = new DatabaseService(':memory:');
  });

  afterEach(() => {
    service.close();
  });

  describe('initialization', () => {
    it('should create tables on initialization', () => {
      expect(mockDb.exec).toHaveBeenCalled();
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS journeys')
      );
    });

    it('should create indexes', () => {
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX IF NOT EXISTS')
      );
    });

    it('should use provided database path', () => {
      const customPath = './custom.db';
      new DatabaseService(customPath);

      expect(Database).toHaveBeenCalledWith(customPath);
    });
  });

  describe('createJourney', () => {
    it('should create new journey', async () => {
      const mockPrepare = mockDb.prepare as jest.Mock;
      const mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 1 });
      mockPrepare.mockReturnValue({ run: mockRun });

      const journey = await service.createJourney('Test input');

      expect(journey).toMatchObject({
        input: 'Test input',
        status: 'running',
        stages: [],
      });

      expect(journey.id).toBeDefined();
      expect(journey.createdAt).toBeDefined();
      expect(mockRun).toHaveBeenCalled();
    });

    it('should use default settings', async () => {
      const mockPrepare = mockDb.prepare as jest.Mock;
      const mockRun = jest.fn();
      mockPrepare.mockReturnValue({ run: mockRun });

      const journey = await service.createJourney('Test');

      expect(journey.settings).toMatchObject({
        autoContinue: true,
        maxStages: 50,
        extendedThinking: true,
        computerUse: true,
      });
    });

    it('should accept custom settings', async () => {
      const mockPrepare = mockDb.prepare as jest.Mock;
      const mockRun = jest.fn();
      mockPrepare.mockReturnValue({ run: mockRun });

      const customSettings = {
        autoContinue: false,
        maxStages: 10,
        stageDelay: 1000,
        extendedThinking: false,
        computerUse: false,
      };

      const journey = await service.createJourney('Test', customSettings);

      expect(journey.settings).toEqual(customSettings);
    });
  });

  describe('getJourney', () => {
    it('should retrieve journey by ID', async () => {
      const mockJourney = {
        id: 'journey_123',
        input: 'Test input',
        status: 'running',
        settings: JSON.stringify({ autoContinue: true }),
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      const mockPrepare = mockDb.prepare as jest.Mock;
      mockPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(mockJourney),
      });

      const journey = await service.getJourney('journey_123');

      expect(journey).toBeDefined();
      expect(journey?.id).toBe('journey_123');
      expect(journey?.input).toBe('Test input');
    });

    it('should return null for non-existent journey', async () => {
      const mockPrepare = mockDb.prepare as jest.Mock;
      mockPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(undefined),
      });

      const journey = await service.getJourney('nonexistent');

      expect(journey).toBeNull();
    });

    it('should parse settings JSON', async () => {
      const settings = { autoContinue: false, maxStages: 10 };
      const mockJourney = {
        id: 'journey_123',
        settings: JSON.stringify(settings),
      };

      const mockPrepare = mockDb.prepare as jest.Mock;
      mockPrepare.mockReturnValue({
        get: jest.fn().mockReturnValue(mockJourney),
      });

      const journey = await service.getJourney('journey_123');

      expect(journey?.settings).toEqual(settings);
    });
  });

  describe('updateJourney', () => {
    it('should update journey status', async () => {
      const mockPrepare = mockDb.prepare as jest.Mock;
      const mockRun = jest.fn();
      mockPrepare.mockReturnValue({ run: mockRun });

      const journey: Journey = {
        id: 'journey_123',
        input: 'Test',
        status: 'running',
        stages: [],
        settings: {} as any,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      journey.status = 'complete';
      await service.updateJourney(journey);

      expect(mockRun).toHaveBeenCalledWith(
        expect.arrayContaining(['complete', 'journey_123'])
      );
    });

    it('should update timestamp', async () => {
      const mockPrepare = mockDb.prepare as jest.Mock;
      const mockRun = jest.fn();
      mockPrepare.mockReturnValue({ run: mockRun });

      const journey: Journey = {
        id: 'journey_123',
        input: 'Test',
        status: 'running',
        stages: [],
        settings: {} as any,
        createdAt: Date.now(),
        updatedAt: Date.now() - 10000,
      };

      const oldTimestamp = journey.updatedAt;
      await service.updateJourney(journey);

      expect(journey.updatedAt).toBeGreaterThan(oldTimestamp);
    });
  });

  describe('createStage', () => {
    it('should create new stage', async () => {
      const mockPrepare = mockDb.prepare as jest.Mock;
      const mockRun = jest.fn();
      mockPrepare.mockReturnValue({ run: mockRun });

      const stage: Stage = {
        id: 'stage_123',
        journeyId: 'journey_123',
        type: 'discovering',
        status: 'complete',
        prompt: 'Test prompt',
        result: 'Test result',
        thinking: 'Test thinking',
        artifacts: [],
        createdAt: Date.now(),
      };

      await service.createStage(stage);

      expect(mockRun).toHaveBeenCalledWith(
        expect.arrayContaining([
          stage.id,
          stage.journeyId,
          stage.type,
          stage.status,
        ])
      );
    });
  });

  describe('getStagesByJourney', () => {
    it('should retrieve all stages for journey', async () => {
      const mockStages = [
        {
          id: 'stage_1',
          journey_id: 'journey_123',
          type: 'discovering',
          status: 'complete',
          result: 'Result 1',
          created_at: Date.now(),
        },
        {
          id: 'stage_2',
          journey_id: 'journey_123',
          type: 'chasing',
          status: 'complete',
          result: 'Result 2',
          created_at: Date.now(),
        },
      ];

      const mockPrepare = mockDb.prepare as jest.Mock;
      mockPrepare.mockReturnValue({
        all: jest.fn().mockReturnValue(mockStages),
      });

      const stages = await service.getStagesByJourney('journey_123');

      expect(stages).toHaveLength(2);
      expect(stages[0].type).toBe('discovering');
      expect(stages[1].type).toBe('chasing');
    });

    it('should return empty array for journey with no stages', async () => {
      const mockPrepare = mockDb.prepare as jest.Mock;
      mockPrepare.mockReturnValue({
        all: jest.fn().mockReturnValue([]),
      });

      const stages = await service.getStagesByJourney('journey_123');

      expect(stages).toEqual([]);
    });
  });

  describe('createArtifact', () => {
    it('should create new artifact', async () => {
      const mockPrepare = mockDb.prepare as jest.Mock;
      const mockRun = jest.fn();
      mockPrepare.mockReturnValue({ run: mockRun });

      const artifact: Artifact = {
        id: 'artifact_123',
        stageId: 'stage_123',
        type: 'code',
        title: 'Test Code',
        content: 'const x = 1;',
        metadata: { language: 'typescript' },
        createdAt: Date.now(),
      };

      await service.createArtifact(artifact);

      expect(mockRun).toHaveBeenCalledWith(
        expect.arrayContaining([
          artifact.id,
          artifact.stageId,
          artifact.type,
          artifact.title,
        ])
      );
    });
  });

  describe('transaction support', () => {
    it('should support transactions', async () => {
      const mockTransaction = jest.fn();
      mockDb.transaction = mockTransaction;

      const callback = jest.fn();
      service.transaction(callback);

      expect(mockTransaction).toHaveBeenCalledWith(callback);
    });
  });

  describe('cleanup', () => {
    it('should close database connection', () => {
      service.close();

      expect(mockDb.close).toHaveBeenCalled();
    });
  });
});
