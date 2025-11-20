/**
 * IPC Client for Electron Main Process Communication
 * Type-safe wrapper around Electron IPC
 */

import type { Journey, Stage, JourneySettings, Page, IPCChannels } from '@/types';

/**
 * Type-safe IPC client
 * Communicates with Electron main process
 */
export class IPCClient {
  private readonly ipc: ElectronAPI | null = null;

  constructor() {
    // Check if we're in Electron environment
    if (typeof window !== 'undefined' && 'electron' in window) {
      this.ipc = (window as WindowWithElectron).electron;
    }
  }

  /**
   * Check if IPC is available
   */
  isAvailable(): boolean {
    return this.ipc !== null;
  }

  /**
   * Invoke IPC method with type safety
   */
  private async invoke<K extends keyof IPCChannels>(
    channel: K,
    ...args: Parameters<IPCChannels[K]>
  ): Promise<ReturnType<IPCChannels[K]>> {
    if (!this.ipc) {
      throw new Error('IPC not available. Running outside Electron?');
    }

    try {
      // @ts-expect-error - Dynamic channel invocation
      return await this.ipc.invoke(channel, ...args);
    } catch (error) {
      console.error(`IPC error on channel ${channel}:`, error);
      throw error;
    }
  }

  // Journey operations
  async createJourney(input: string): Promise<Journey> {
    return this.invoke('journey:create', input);
  }

  async getJourney(id: string): Promise<Journey | null> {
    return this.invoke('journey:get', id);
  }

  async listJourneys(): Promise<Journey[]> {
    return this.invoke('journey:list');
  }

  async updateJourney(journey: Journey): Promise<Journey> {
    return this.invoke('journey:update', journey);
  }

  async pauseJourney(id: string): Promise<void> {
    return this.invoke('journey:pause', id);
  }

  async resumeJourney(id: string): Promise<void> {
    return this.invoke('journey:resume', id);
  }

  async stopJourney(id: string): Promise<void> {
    return this.invoke('journey:stop', id);
  }

  async deleteJourney(id: string): Promise<{ success: boolean }> {
    return this.invoke('journey:delete', id);
  }

  // Stage operations
  async createStage(stage: Stage): Promise<void> {
    return this.invoke('stage:create', stage);
  }

  async getStage(id: string): Promise<Stage | null> {
    return this.invoke('stage:get', id);
  }

  async listStages(journeyId: string): Promise<Stage[]> {
    return this.invoke('stage:list', journeyId);
  }

  // Settings operations
  async getSettings(): Promise<JourneySettings> {
    return this.invoke('settings:get');
  }

  async updateSettings(settings: Partial<JourneySettings>): Promise<JourneySettings> {
    return this.invoke('settings:update', settings);
  }

  // Page operations
  async createPage(page: Page): Promise<void> {
    return this.invoke('page:create', page);
  }

  async getPage(id: string): Promise<Page | null> {
    return this.invoke('page:get', id);
  }

  async listPages(journeyId: string): Promise<Page[]> {
    return this.invoke('page:list', journeyId);
  }

  async deletePage(id: string): Promise<void> {
    return this.invoke('page:delete', id);
  }

  // Page file operations (Phase 2A)
  async savePageFile(
    journeyId: string,
    pageId: string,
    content: string,
    templateName: string
  ): Promise<{ filePath: string; fileSize: number }> {
    const result = await this.invoke('page:save-file', journeyId, pageId, content, templateName);
    return result as { filePath: string; fileSize: number };
  }

  async readPageFile(filePath: string): Promise<{ content: string }> {
    return this.invoke('page:read-file', filePath) as Promise<{ content: string }>;
  }

  async savePageAnalysis(journeyId: string, analysis: any): Promise<{ success: boolean }> {
    return this.invoke('page:save-analysis', journeyId, analysis) as Promise<{ success: boolean }>;
  }

  async readPageAnalysis(journeyId: string): Promise<{ analysis: any }> {
    return this.invoke('page:read-analysis', journeyId) as Promise<{ analysis: any }>;
  }

  async getPageStorageStats(): Promise<any> {
    return this.invoke('page:storage-stats');
  }

  async exportPageToPDF(
    htmlContent: string,
    defaultFilename: string
  ): Promise<{ success: boolean; filePath?: string; canceled?: boolean }> {
    return this.invoke('page:export-pdf', htmlContent, defaultFilename);
  }

  async exportPageToHTML(
    htmlContent: string,
    defaultFilename: string
  ): Promise<{ success: boolean; filePath?: string; canceled?: boolean }> {
    return this.invoke('page:export-html', htmlContent, defaultFilename);
  }

  // API Key operations
  async getApiKey(service: string): Promise<string> {
    return this.invoke('apikey:get', service);
  }

  async setApiKey(service: string, key: string): Promise<void> {
    return this.invoke('apikey:set', service, key);
  }

  // File operations
  async saveFile(path: string, content: string): Promise<void> {
    return this.invoke('file:save', path, content);
  }

  async openFile(path: string): Promise<string> {
    return this.invoke('file:open', path);
  }

  /**
   * Listen to IPC events
   */
  on<K extends string>(
    channel: K,
    callback: (...args: unknown[]) => void
  ): (() => void) | undefined {
    if (!this.ipc) {
      console.warn('IPC not available for event listeners');
      return;
    }

    // @ts-expect-error - Dynamic channel subscription
    return this.ipc.on?.(channel, callback);
  }

  /**
   * Remove IPC event listener
   */
  off<K extends string>(channel: K, callback: (...args: unknown[]) => void): void {
    if (!this.ipc) {
      return;
    }

    // @ts-expect-error - Dynamic channel subscription
    this.ipc.off?.(channel, callback);
  }
}

// Global types for Electron API
interface ElectronAPI {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  on?: (channel: string, callback: (...args: unknown[]) => void) => () => void;
  off?: (channel: string, callback: (...args: unknown[]) => void) => void;
}

interface WindowWithElectron extends Window {
  electron: ElectronAPI;
}

// Export singleton instance
export const ipcClient = new IPCClient();
