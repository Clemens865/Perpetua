/**
 * IPC Integration Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupIpcHandlers, removeIpcHandlers } from '../../src/main/ipc/handlers';
import { DatabaseService } from '../../src/main/database/DatabaseService';
import { FileService } from '../../src/main/services/FileService';
import type { IpcMainInvokeEvent } from 'electron';

// Mock IpcMain
class MockIpcMain {
  private handlers: Map<string, Function> = new Map();

  handle(channel: string, handler: Function): void {
    this.handlers.set(channel, handler);
  }

  removeHandler(channel: string): void {
    this.handlers.delete(channel);
  }

  async invoke(channel: string, ...args: any[]): Promise<any> {
    const handler = this.handlers.get(channel);
    if (!handler) {
      throw new Error(`No handler for channel: ${channel}`);
    }

    // Mock event object
    const event = {} as IpcMainInvokeEvent;
    return await handler(event, ...args);
  }

  getHandlerCount(): number {
    return this.handlers.size;
  }
}

describe('IPC Handlers', () => {
  let mockIpcMain: MockIpcMain;
  let db: DatabaseService;
  let fileService: FileService;

  beforeEach(async () => {
    mockIpcMain = new MockIpcMain();

    // Use in-memory database for testing
    db = new DatabaseService(':memory:');
    await db.initialize();

    // Use temporary directory for file service
    fileService = new FileService('/tmp/test-artifacts');
    await fileService.initialize();

    // Setup handlers
    setupIpcHandlers(mockIpcMain as any, db, fileService);
  });

  describe('Handler Registration', () => {
    it('should register all handlers', () => {
      const handlerCount = mockIpcMain.getHandlerCount();
      expect(handlerCount).toBeGreaterThan(0);
    });

    it('should remove all handlers', () => {
      removeIpcHandlers(mockIpcMain as any);
      const handlerCount = mockIpcMain.getHandlerCount();
      expect(handlerCount).toBe(0);
    });
  });

  describe('Journey Operations', () => {
    it('should create a journey via IPC', async () => {
      const journey = await mockIpcMain.invoke('journey:create', 'Test exploration');

      expect(journey).toBeDefined();
      expect(journey.id).toBeDefined();
      expect(journey.input).toBe('Test exploration');
    });

    it('should get a journey via IPC', async () => {
      const created = await mockIpcMain.invoke('journey:create', 'Test');
      const retrieved = await mockIpcMain.invoke('journey:get', created.id);

      expect(retrieved.id).toBe(created.id);
    });

    it('should list journeys via IPC', async () => {
      await mockIpcMain.invoke('journey:create', 'Journey 1');
      await mockIpcMain.invoke('journey:create', 'Journey 2');

      const journeys = await mockIpcMain.invoke('journey:list');

      expect(journeys).toHaveLength(2);
    });

    it('should update a journey via IPC', async () => {
      const journey = await mockIpcMain.invoke('journey:create', 'Test');

      const result = await mockIpcMain.invoke('journey:update', journey.id, {
        status: 'paused',
      });

      expect(result.success).toBe(true);

      const updated = await mockIpcMain.invoke('journey:get', journey.id);
      expect(updated.status).toBe('paused');
    });

    it('should delete a journey via IPC', async () => {
      const journey = await mockIpcMain.invoke('journey:create', 'Test');

      const result = await mockIpcMain.invoke('journey:delete', journey.id);
      expect(result.success).toBe(true);

      const retrieved = await mockIpcMain.invoke('journey:get', journey.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Stage Operations', () => {
    it('should create a stage via IPC', async () => {
      const journey = await mockIpcMain.invoke('journey:create', 'Test');

      const stage = {
        id: 'stage-1',
        journeyId: journey.id,
        type: 'discovering',
        status: 'complete',
        prompt: 'Test prompt',
        result: 'Test result',
        artifacts: [],
        createdAt: Date.now(),
      };

      const result = await mockIpcMain.invoke('stage:create', stage);
      expect(result.success).toBe(true);
    });

    it('should list stages via IPC', async () => {
      const journey = await mockIpcMain.invoke('journey:create', 'Test');

      const stage = {
        id: 'stage-1',
        journeyId: journey.id,
        type: 'discovering',
        status: 'complete',
        prompt: 'Test',
        result: 'Result',
        artifacts: [],
        createdAt: Date.now(),
      };

      await mockIpcMain.invoke('stage:create', stage);

      const stages = await mockIpcMain.invoke('stage:list', journey.id);
      expect(stages).toHaveLength(1);
    });
  });

  describe('Health Check', () => {
    it('should return health status via IPC', async () => {
      const health = await mockIpcMain.invoke('health:check');

      expect(health.status).toBe('healthy');
      expect(health.database).toBe(true);
      expect(health.fileSystem).toBe(true);
      expect(health.timestamp).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should get stats via IPC', async () => {
      await mockIpcMain.invoke('journey:create', 'Test 1');
      await mockIpcMain.invoke('journey:create', 'Test 2');

      const stats = await mockIpcMain.invoke('stats:get');

      expect(stats.journeys).toBe(2);
      expect(stats.stages).toBe(0);
      expect(stats.artifacts).toBe(0);
    });
  });
});
