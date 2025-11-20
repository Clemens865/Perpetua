/**
 * IPC Type Definitions
 * Shared types between main and renderer processes
 */

import type {
  Journey,
  Stage,
  Artifact,
  Page,
  JourneySettings,
} from '../../types';

/**
 * IPC Channel names
 */
export const IPC_CHANNELS = {
  // Journey operations
  JOURNEY_CREATE: 'journey:create',
  JOURNEY_GET: 'journey:get',
  JOURNEY_LIST: 'journey:list',
  JOURNEY_UPDATE: 'journey:update',
  JOURNEY_DELETE: 'journey:delete',

  // Stage operations
  STAGE_CREATE: 'stage:create',
  STAGE_UPDATE: 'stage:update',
  STAGE_LIST: 'stage:list',

  // Artifact operations
  ARTIFACT_CREATE: 'artifact:create',
  ARTIFACT_GET: 'artifact:get',
  ARTIFACT_LIST: 'artifact:list',
  ARTIFACT_SEARCH: 'artifact:search',

  // File operations
  FILE_SAVE: 'file:save',
  FILE_READ: 'file:read',
  FILE_DELETE: 'file:delete',
  FILE_LIST: 'file:list',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // Stats
  STATS_GET: 'stats:get',

  // Health
  HEALTH_CHECK: 'health:check',
} as const;

/**
 * IPC API exposed to renderer
 */
export interface IpcApi {
  // Generic invoke method for flexible IPC calls
  invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>;

  // Journey operations
  createJourney: (input: string, settings?: Partial<JourneySettings>) => Promise<Journey>;
  getJourney: (id: string) => Promise<Journey | null>;
  listJourneys: (limit?: number, offset?: number) => Promise<Journey[]>;
  updateJourney: (journey: Journey) => Promise<Journey>;
  deleteJourney: (id: string) => Promise<{ success: boolean }>;

  // Stage operations
  createStage: (stage: Stage) => Promise<{ success: boolean }>;
  updateStage: (id: string, updates: Partial<Stage>) => Promise<{ success: boolean }>;
  listStages: (journeyId: string) => Promise<Stage[]>;

  // Artifact operations
  createArtifact: (artifact: Artifact) => Promise<{ success: boolean }>;
  getArtifact: (id: string) => Promise<Artifact | null>;
  listArtifacts: (stageId: string) => Promise<Artifact[]>;
  searchArtifacts: (query: string, limit?: number) => Promise<Artifact[]>;

  // Page operations
  createPage: (page: Page) => Promise<{ success: boolean }>;
  getPage: (id: string) => Promise<Page | null>;
  listPages: (journeyId: string) => Promise<Page[]>;
  deletePage: (id: string) => Promise<{ success: boolean }>;

  // File operations
  saveFile: (filename: string, content: string) => Promise<{ success: boolean; filepath: string }>;
  readFile: (filepath: string) => Promise<{ content: string }>;
  deleteFile: (filepath: string) => Promise<{ success: boolean }>;
  listFiles: (directory?: string) => Promise<{ files: string[] }>;

  // Settings
  getSetting: (key: string) => Promise<{ value: any }>;
  setSetting: (key: string, value: any) => Promise<{ success: boolean }>;

  // Stats
  getStats: () => Promise<{
    journeys: number;
    stages: number;
    artifacts: number;
  }>;

  // Health check
  healthCheck: () => Promise<{
    status: string;
    database: boolean;
    fileSystem: boolean;
    timestamp: number;
  }>;
}

/**
 * Type-safe IPC invoke helper
 */
export type IpcInvoke = <K extends keyof IpcApi>(
  channel: K,
  ...args: Parameters<IpcApi[K]>
) => ReturnType<IpcApi[K]>;
