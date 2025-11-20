/**
 * Preload Script
 * Exposes safe APIs to renderer process with context isolation
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { IpcApi } from '../ipc/types';

/**
 * Validated IPC invoke - only allows specific channels
 */
const validChannels = [
  'journey:create',
  'journey:get',
  'journey:list',
  'journey:update',
  'journey:delete',
  'journey:pause',
  'journey:resume',
  'journey:stop',
  'stage:create',
  'stage:update',
  'stage:list',
  'artifact:create',
  'artifact:get',
  'artifact:list',
  'artifact:search',
  'page:create',
  'page:get',
  'page:list',
  'page:delete',
  'page:save-file',
  'page:read-file',
  'page:save-analysis',
  'page:read-analysis',
  'page:storage-stats',
  'page:export-pdf',
  'page:export-html',
  'file:save',
  'file:read',
  'file:delete',
  'file:list',
  'settings:get',
  'settings:set',
  'stats:get',
  'health:check',
];

/**
 * Safe IPC invoke wrapper
 */
function safeInvoke<T = any>(channel: string, ...args: any[]): Promise<T> {
  if (!validChannels.includes(channel)) {
    return Promise.reject(new Error(`Invalid IPC channel: ${channel}`));
  }
  return ipcRenderer.invoke(channel, ...args);
}

/**
 * IPC API exposed to renderer
 */
const api: IpcApi = {
  // Generic invoke method for flexibility
  invoke: safeInvoke,

  // Journey operations
  createJourney: (input, settings) =>
    safeInvoke('journey:create', input, settings),

  getJourney: (id) =>
    safeInvoke('journey:get', id),

  listJourneys: (limit, offset) =>
    safeInvoke('journey:list', limit, offset),

  updateJourney: (journey) =>
    safeInvoke('journey:update', journey),

  deleteJourney: (id) =>
    safeInvoke('journey:delete', id),

  // Stage operations
  createStage: (stage) =>
    safeInvoke('stage:create', stage),

  updateStage: (id, updates) =>
    safeInvoke('stage:update', id, updates),

  listStages: (journeyId) =>
    safeInvoke('stage:list', journeyId),

  // Artifact operations
  createArtifact: (artifact) =>
    safeInvoke('artifact:create', artifact),

  getArtifact: (id) =>
    safeInvoke('artifact:get', id),

  listArtifacts: (stageId) =>
    safeInvoke('artifact:list', stageId),

  searchArtifacts: (query, limit) =>
    safeInvoke('artifact:search', query, limit),

  // Page operations
  createPage: (page) =>
    safeInvoke('page:create', page),

  getPage: (id) =>
    safeInvoke('page:get', id),

  listPages: (journeyId) =>
    safeInvoke('page:list', journeyId),

  deletePage: (id) =>
    safeInvoke('page:delete', id),

  // File operations
  saveFile: (filename, content) =>
    safeInvoke('file:save', filename, content),

  readFile: (filepath) =>
    safeInvoke('file:read', filepath),

  deleteFile: (filepath) =>
    safeInvoke('file:delete', filepath),

  listFiles: (directory) =>
    safeInvoke('file:list', directory),

  // Settings
  getSetting: (key) =>
    safeInvoke('settings:get', key),

  setSetting: (key, value) =>
    safeInvoke('settings:set', key, value),

  // Stats
  getStats: () =>
    safeInvoke('stats:get'),

  // Health check
  healthCheck: () =>
    safeInvoke('health:check'),
};

/**
 * Expose API to renderer
 */
contextBridge.exposeInMainWorld('electron', api);

/**
 * Environment info
 */
const env = {
  NODE_ENV: process.env.NODE_ENV || 'production',
  PLATFORM: process.platform,
  ARCH: process.arch,
};

contextBridge.exposeInMainWorld('env', env);

/**
 * Version info
 */
const versions = {
  node: process.versions.node,
  chrome: process.versions.chrome,
  electron: process.versions.electron,
};

contextBridge.exposeInMainWorld('versions', versions);

// Log successful preload
console.log('✅ Preload script loaded successfully');
console.log('📦 Environment:', env);
console.log('🔧 Versions:', versions);
