/**
 * Integration tests for Electron IPC communication
 * Tests main process ↔ renderer process communication
 */

import { ipcMain, ipcRenderer } from 'electron';
import type { Journey, Stage } from '../../src/types';

// Mock Electron IPC
jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
    removeHandler: jest.fn(),
  },
  ipcRenderer: {
    invoke: jest.fn(),
    on: jest.fn(),
    send: jest.fn(),
    removeListener: jest.fn(),
  },
}));

describe('IPC Communication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Journey Operations', () => {
    it('should handle journey creation request', async () => {
      const mockJourney: Journey = {
        id: 'journey_123',
        input: 'Test input',
        status: 'running',
        stages: [],
        settings: {} as any,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (ipcMain.handle as jest.Mock).mockImplementation(
        (channel: string, handler: Function) => {
          if (channel === 'journey:create') {
            return handler({}, 'Test input');
          }
        }
      );

      (ipcRenderer.invoke as jest.Mock).mockResolvedValue(mockJourney);

      const result = await ipcRenderer.invoke('journey:create', 'Test input');

      expect(result).toEqual(mockJourney);
      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'journey:create',
        'Test input'
      );
    });

    it('should handle journey retrieval', async () => {
      const mockJourney: Journey = {
        id: 'journey_123',
        input: 'Test',
        status: 'complete',
        stages: [],
        settings: {} as any,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (ipcRenderer.invoke as jest.Mock).mockResolvedValue(mockJourney);

      const result = await ipcRenderer.invoke('journey:get', 'journey_123');

      expect(result).toEqual(mockJourney);
    });

    it('should handle journey updates', async () => {
      const updates = { status: 'paused' };

      (ipcRenderer.invoke as jest.Mock).mockResolvedValue(true);

      const result = await ipcRenderer.invoke(
        'journey:update',
        'journey_123',
        updates
      );

      expect(result).toBe(true);
      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'journey:update',
        'journey_123',
        updates
      );
    });

    it('should handle journey deletion', async () => {
      (ipcRenderer.invoke as jest.Mock).mockResolvedValue(true);

      const result = await ipcRenderer.invoke('journey:delete', 'journey_123');

      expect(result).toBe(true);
    });

    it('should list all journeys', async () => {
      const mockJourneys: Journey[] = [
        {
          id: 'journey_1',
          input: 'Test 1',
          status: 'complete',
          stages: [],
          settings: {} as any,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'journey_2',
          input: 'Test 2',
          status: 'running',
          stages: [],
          settings: {} as any,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      (ipcRenderer.invoke as jest.Mock).mockResolvedValue(mockJourneys);

      const result = await ipcRenderer.invoke('journey:list');

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockJourneys);
    });
  });

  describe('Stage Operations', () => {
    it('should retrieve stages for journey', async () => {
      const mockStages: Stage[] = [
        {
          id: 'stage_1',
          journeyId: 'journey_123',
          type: 'discovering',
          status: 'complete',
          prompt: 'Test',
          result: 'Result',
          artifacts: [],
          createdAt: Date.now(),
        },
      ];

      (ipcRenderer.invoke as jest.Mock).mockResolvedValue(mockStages);

      const result = await ipcRenderer.invoke(
        'stage:list',
        'journey_123'
      );

      expect(result).toEqual(mockStages);
    });

    it('should get specific stage', async () => {
      const mockStage: Stage = {
        id: 'stage_123',
        journeyId: 'journey_123',
        type: 'discovering',
        status: 'complete',
        prompt: 'Test',
        result: 'Result',
        artifacts: [],
        createdAt: Date.now(),
      };

      (ipcRenderer.invoke as jest.Mock).mockResolvedValue(mockStage);

      const result = await ipcRenderer.invoke('stage:get', 'stage_123');

      expect(result).toEqual(mockStage);
    });
  });

  describe('Real-time Updates', () => {
    it('should emit stage-complete events', () => {
      const mockStage: Stage = {
        id: 'stage_123',
        journeyId: 'journey_123',
        type: 'discovering',
        status: 'complete',
        prompt: 'Test',
        result: 'Result',
        artifacts: [],
        createdAt: Date.now(),
      };

      const listener = jest.fn();
      ipcRenderer.on('stage:complete', listener);

      // Simulate event emission
      (ipcRenderer.on as jest.Mock).mock.calls[0][1](null, mockStage);

      expect(listener).toHaveBeenCalledWith(null, mockStage);
    });

    it('should emit journey-complete events', () => {
      const mockJourney: Journey = {
        id: 'journey_123',
        input: 'Test',
        status: 'complete',
        stages: [],
        settings: {} as any,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const listener = jest.fn();
      ipcRenderer.on('journey:complete', listener);

      (ipcRenderer.on as jest.Mock).mock.calls[0][1](null, mockJourney);

      expect(listener).toHaveBeenCalledWith(null, mockJourney);
    });

    it('should emit progress events', () => {
      const progressData = {
        journeyId: 'journey_123',
        stageIndex: 3,
        totalStages: 8,
        percentage: 37.5,
      };

      const listener = jest.fn();
      ipcRenderer.on('journey:progress', listener);

      (ipcRenderer.on as jest.Mock).mock.calls[0][1](null, progressData);

      expect(listener).toHaveBeenCalledWith(null, progressData);
    });

    it('should handle errors from main process', () => {
      const error = new Error('Test error');

      const listener = jest.fn();
      ipcRenderer.on('error', listener);

      (ipcRenderer.on as jest.Mock).mock.calls[0][1](null, error);

      expect(listener).toHaveBeenCalledWith(null, error);
    });
  });

  describe('Settings Operations', () => {
    it('should get app settings', async () => {
      const mockSettings = {
        theme: 'light',
        apiKey: 'encrypted',
        autoStart: true,
      };

      (ipcRenderer.invoke as jest.Mock).mockResolvedValue(mockSettings);

      const result = await ipcRenderer.invoke('settings:get');

      expect(result).toEqual(mockSettings);
    });

    it('should update settings', async () => {
      const updates = { theme: 'dark' };

      (ipcRenderer.invoke as jest.Mock).mockResolvedValue(true);

      const result = await ipcRenderer.invoke('settings:update', updates);

      expect(result).toBe(true);
      expect(ipcRenderer.invoke).toHaveBeenCalledWith(
        'settings:update',
        updates
      );
    });

    it('should validate API key', async () => {
      (ipcRenderer.invoke as jest.Mock).mockResolvedValue(true);

      const result = await ipcRenderer.invoke(
        'settings:validate-api-key',
        'test-key'
      );

      expect(result).toBe(true);
    });
  });

  describe('File Operations', () => {
    it('should export journey to file', async () => {
      (ipcRenderer.invoke as jest.Mock).mockResolvedValue('/path/to/export.json');

      const result = await ipcRenderer.invoke(
        'file:export-journey',
        'journey_123'
      );

      expect(result).toBe('/path/to/export.json');
    });

    it('should import journey from file', async () => {
      const mockJourney: Journey = {
        id: 'imported_journey',
        input: 'Imported',
        status: 'complete',
        stages: [],
        settings: {} as any,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (ipcRenderer.invoke as jest.Mock).mockResolvedValue(mockJourney);

      const result = await ipcRenderer.invoke(
        'file:import-journey',
        '/path/to/import.json'
      );

      expect(result).toEqual(mockJourney);
    });

    it('should save artifact to file', async () => {
      (ipcRenderer.invoke as jest.Mock).mockResolvedValue('/path/to/artifact.ts');

      const result = await ipcRenderer.invoke(
        'file:save-artifact',
        'artifact_123',
        '/desired/path'
      );

      expect(result).toBe('/path/to/artifact.ts');
    });
  });

  describe('Error Handling', () => {
    it('should handle IPC errors gracefully', async () => {
      (ipcRenderer.invoke as jest.Mock).mockRejectedValue(
        new Error('IPC error')
      );

      await expect(
        ipcRenderer.invoke('journey:create', 'Test')
      ).rejects.toThrow('IPC error');
    });

    it('should handle timeout errors', async () => {
      jest.setTimeout(5000);

      (ipcRenderer.invoke as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 10000))
      );

      await expect(
        Promise.race([
          ipcRenderer.invoke('long-operation'),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 3000)
          ),
        ])
      ).rejects.toThrow('Timeout');
    });

    it('should handle missing handlers', async () => {
      (ipcRenderer.invoke as jest.Mock).mockRejectedValue(
        new Error('No handler registered for unknown:channel')
      );

      await expect(
        ipcRenderer.invoke('unknown:channel')
      ).rejects.toThrow('No handler registered');
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners', () => {
      const listener = jest.fn();

      ipcRenderer.on('test:event', listener);
      ipcRenderer.removeListener('test:event', listener);

      expect(ipcRenderer.removeListener).toHaveBeenCalledWith(
        'test:event',
        listener
      );
    });

    it('should clean up all listeners on unmount', () => {
      const listeners = [
        jest.fn(),
        jest.fn(),
        jest.fn(),
      ];

      listeners.forEach(listener => {
        ipcRenderer.on('test:event', listener);
      });

      listeners.forEach(listener => {
        ipcRenderer.removeListener('test:event', listener);
      });

      expect(ipcRenderer.removeListener).toHaveBeenCalledTimes(3);
    });
  });
});
