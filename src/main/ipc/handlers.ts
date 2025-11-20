/**
 * IPC Handlers
 * Type-safe communication between main and renderer processes
 */

import { IpcMain, IpcMainInvokeEvent, dialog, BrowserWindow, app } from 'electron';
import { DatabaseService } from '../database/DatabaseService';
import { FileService } from '../services/FileService';
import { PageFileService } from '../services/PageFileService';
import logger from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import Store from 'electron-store';
import type {
  Journey,
  Stage,
  Artifact,
  Page,
  JourneySettings,
} from '../../types';

// Initialize electron-store once
const store = new Store();

export interface IpcHandler {
  channel: string;
  handler: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any>;
}

/**
 * Setup all IPC handlers
 */
export function setupIpcHandlers(
  ipcMain: IpcMain,
  db: DatabaseService,
  fileService: FileService,
  pageFileService: PageFileService
): void {
  const handlers: IpcHandler[] = [
    // Journey operations
    {
      channel: 'journey:create',
      handler: async (_, input: string, settings?: Partial<JourneySettings>) => {
        logger.debug('IPC: journey:create', { input });
        return await db.createJourney(input, settings);
      },
    },
    {
      channel: 'journey:get',
      handler: async (_, id: string) => {
        logger.debug('IPC: journey:get', { id });
        return await db.getJourney(id);
      },
    },
    {
      channel: 'journey:list',
      handler: async (_, limit?: number, offset?: number) => {
        logger.debug('IPC: journey:list', { limit, offset });
        return await db.getAllJourneys(limit, offset);
      },
    },
    {
      channel: 'journey:update',
      handler: async (_, journey: Journey) => {
        logger.debug('IPC: journey:update', { id: journey.id });
        // Extract only the updatable fields (exclude id, createdAt, input)
        const updates: Partial<Journey> = {};
        if (journey.status) updates.status = journey.status;
        if (journey.settings) updates.settings = journey.settings;

        await db.updateJourney(journey.id, updates);
        // Return the updated journey
        return await db.getJourney(journey.id);
      },
    },
    {
      channel: 'journey:delete',
      handler: async (_, id: string) => {
        logger.debug('IPC: journey:delete', { id });
        await db.deleteJourney(id);
        return { success: true };
      },
    },
    {
      channel: 'journey:pause',
      handler: async (_, id: string) => {
        logger.debug('IPC: journey:pause', { id });
        await db.updateJourney(id, { status: 'paused' });
        return { success: true };
      },
    },
    {
      channel: 'journey:resume',
      handler: async (_, id: string) => {
        logger.debug('IPC: journey:resume', { id });
        await db.updateJourney(id, { status: 'running' });
        return { success: true };
      },
    },
    {
      channel: 'journey:stop',
      handler: async (_, id: string) => {
        logger.debug('IPC: journey:stop', { id });
        await db.updateJourney(id, { status: 'stopped' });
        return { success: true };
      },
    },

    // Stage operations
    {
      channel: 'stage:create',
      handler: async (_, stage: Stage) => {
        logger.debug('IPC: stage:create', { stageId: stage.id });
        await db.createStage(stage);
        return { success: true };
      },
    },
    {
      channel: 'stage:update',
      handler: async (_, id: string, updates: Partial<Stage>) => {
        logger.debug('IPC: stage:update', { id, updates });
        await db.updateStage(id, updates);
        return { success: true };
      },
    },
    {
      channel: 'stage:list',
      handler: async (_, journeyId: string) => {
        logger.debug('IPC: stage:list', { journeyId });
        return await db.getStagesByJourney(journeyId);
      },
    },

    // Artifact operations
    {
      channel: 'artifact:create',
      handler: async (_, artifact: Artifact) => {
        logger.debug('IPC: artifact:create', { artifactId: artifact.id });
        await db.createArtifact(artifact);

        // Save artifact content to file if applicable
        if (artifact.type === 'code' || artifact.type === 'document') {
          await fileService.saveArtifact(artifact);
        }

        return { success: true };
      },
    },
    {
      channel: 'artifact:get',
      handler: async (_, id: string) => {
        logger.debug('IPC: artifact:get', { id });
        return await db.getArtifact(id);
      },
    },
    {
      channel: 'artifact:list',
      handler: async (_, stageId: string) => {
        logger.debug('IPC: artifact:list', { stageId });
        return await db.getArtifactsByStage(stageId);
      },
    },
    {
      channel: 'artifact:search',
      handler: async (_, query: string, limit?: number) => {
        logger.debug('IPC: artifact:search', { query, limit });
        return await db.searchArtifacts(query, limit);
      },
    },

    // Page operations
    {
      channel: 'page:create',
      handler: async (_, page: Page) => {
        logger.debug('IPC: page:create', { pageId: page.id });
        await db.createPage(page);
        return { success: true };
      },
    },
    {
      channel: 'page:get',
      handler: async (_, id: string) => {
        logger.debug('IPC: page:get', { id });
        return await db.getPage(id);
      },
    },
    {
      channel: 'page:list',
      handler: async (_, journeyId: string) => {
        logger.debug('IPC: page:list', { journeyId });
        return await db.getPagesByJourney(journeyId);
      },
    },
    {
      channel: 'page:delete',
      handler: async (_, id: string) => {
        logger.debug('IPC: page:delete', { id });
        await db.deletePage(id);
        return { success: true };
      },
    },

    // HTML export with native save dialog
    {
      channel: 'page:export-html',
      handler: async (event, htmlContent: string, defaultFilename: string) => {
        logger.debug('IPC: page:export-html', { defaultFilename });

        // Sanitize filename - ensure it has .html extension and no invalid characters
        let sanitizedFilename = defaultFilename
          .replace(/[^a-z0-9.-]/gi, '-')  // Replace invalid chars with dash
          .replace(/-+/g, '-')              // Replace multiple dashes with single dash
          .replace(/^-|-$/g, '')            // Remove leading/trailing dashes
          .toLowerCase();

        // Truncate if too long (macOS has 255 char limit, leave room for extension)
        const maxLength = 200;
        if (sanitizedFilename.length > maxLength) {
          sanitizedFilename = sanitizedFilename.substring(0, maxLength);
        }

        // Ensure it has .html extension
        if (!sanitizedFilename.endsWith('.html') && !sanitizedFilename.endsWith('.htm')) {
          sanitizedFilename += '.html';
        }

        // Fallback to generic name if sanitization results in empty string
        if (!sanitizedFilename || sanitizedFilename === '.html') {
          sanitizedFilename = `page-${Date.now()}.html`;
        }

        // Get proper default path (Desktop folder)
        const desktopPath = app.getPath('desktop');
        const fullDefaultPath = path.join(desktopPath, sanitizedFilename);

        logger.debug('Export HTML path:', fullDefaultPath);

        // Get the BrowserWindow from the event
        const win = BrowserWindow.fromWebContents(event.sender);

        // Show save dialog with window parent
        const result = await dialog.showSaveDialog(win!, {
          title: 'Export Page to HTML',
          defaultPath: fullDefaultPath,
          buttonLabel: 'Export',
          filters: [
            { name: 'HTML Files', extensions: ['html', 'htm'] },
            { name: 'All Files', extensions: ['*'] },
          ],
          properties: ['createDirectory', 'showOverwriteConfirmation'],
        });

        if (result.canceled || !result.filePath) {
          return { success: false, canceled: true };
        }

        try {
          // Ensure the file path has .html extension if user removed it
          let finalPath = result.filePath;
          if (!finalPath.endsWith('.html') && !finalPath.endsWith('.htm')) {
            finalPath += '.html';
          }

          // Save HTML file
          await fs.writeFile(finalPath, htmlContent, 'utf-8');

          logger.info(`HTML exported successfully: ${finalPath}`);
          return {
            success: true,
            filePath: finalPath
          };
        } catch (error) {
          logger.error('HTML export failed:', error);
          throw error;
        }
      },
    },

    // File operations
    {
      channel: 'file:save',
      handler: async (_, filename: string, content: string) => {
        logger.debug('IPC: file:save', { filename });
        const filepath = await fileService.saveFile(filename, content);
        return { success: true, filepath };
      },
    },
    {
      channel: 'file:read',
      handler: async (_, filepath: string) => {
        logger.debug('IPC: file:read', { filepath });
        const content = await fileService.readFile(filepath);
        return { content };
      },
    },
    {
      channel: 'file:delete',
      handler: async (_, filepath: string) => {
        logger.debug('IPC: file:delete', { filepath });
        await fileService.deleteFile(filepath);
        return { success: true };
      },
    },
    {
      channel: 'file:list',
      handler: async (_, directory?: string) => {
        logger.debug('IPC: file:list', { directory });
        const files = await fileService.listFiles(directory);
        return { files };
      },
    },

    // Settings operations
    {
      channel: 'settings:get',
      handler: async (_, key: string) => {
        logger.debug('IPC: settings:get', { key });
        try {
          const value = store.get(key);
          return { value };
        } catch (error) {
          logger.error('Failed to get setting:', error);
          return { value: null };
        }
      },
    },
    {
      channel: 'settings:set',
      handler: async (_, key: string, value: any) => {
        logger.debug('IPC: settings:set', { key });
        try {
          store.set(key, value);
          logger.info(`Setting saved: ${key}`);
          return { success: true };
        } catch (error) {
          logger.error('Failed to set setting:', error);
          throw error;
        }
      },
    },

    // Stats
    {
      channel: 'stats:get',
      handler: async () => {
        logger.debug('IPC: stats:get');
        return await db.getStats();
      },
    },

    // Health check
    {
      channel: 'health:check',
      handler: async () => {
        logger.debug('IPC: health:check');
        return {
          status: 'healthy',
          database: true,
          fileSystem: true,
          timestamp: Date.now(),
        };
      },
    },

    // Page file operations
    {
      channel: 'page:save-file',
      handler: async (_, journeyId: string, pageId: string, content: string, templateName: string) => {
        logger.debug('IPC: page:save-file', { journeyId, pageId, templateName });
        const result = await pageFileService.savePage(journeyId, pageId, content, templateName);
        return result;
      },
    },
    {
      channel: 'page:read-file',
      handler: async (_, filePath: string) => {
        logger.debug('IPC: page:read-file', { filePath });
        const content = await pageFileService.readPage(filePath);
        return { content };
      },
    },
    {
      channel: 'page:save-analysis',
      handler: async (_, journeyId: string, analysis: any) => {
        logger.debug('IPC: page:save-analysis', { journeyId });
        await pageFileService.saveAnalysis(journeyId, analysis);
        return { success: true };
      },
    },
    {
      channel: 'page:read-analysis',
      handler: async (_, journeyId: string) => {
        logger.debug('IPC: page:read-analysis', { journeyId });
        const analysis = await pageFileService.readAnalysis(journeyId);
        return { analysis };
      },
    },
    {
      channel: 'page:storage-stats',
      handler: async () => {
        logger.debug('IPC: page:storage-stats');
        const stats = await pageFileService.getStorageStats();
        return stats;
      },
    },
    {
      channel: 'page:export-pdf',
      handler: async (event, htmlContent: string, defaultFilename: string) => {
        logger.debug('IPC: page:export-pdf', { defaultFilename });

        // Sanitize filename - ensure it has .pdf extension and no invalid characters
        let sanitizedFilename = defaultFilename
          .replace(/[^a-z0-9.-]/gi, '-')  // Replace invalid chars with dash
          .replace(/-+/g, '-')              // Replace multiple dashes with single dash
          .replace(/^-|-$/g, '')            // Remove leading/trailing dashes
          .toLowerCase();

        // Truncate if too long (macOS has 255 char limit, leave room for extension)
        const maxLength = 200;
        if (sanitizedFilename.length > maxLength) {
          sanitizedFilename = sanitizedFilename.substring(0, maxLength);
        }

        // Ensure it has .pdf extension
        if (!sanitizedFilename.endsWith('.pdf')) {
          sanitizedFilename += '.pdf';
        }

        // Fallback to generic name if sanitization results in empty string
        if (!sanitizedFilename || sanitizedFilename === '.pdf') {
          sanitizedFilename = `page-${Date.now()}.pdf`;
        }

        // Get proper default path (Desktop folder)
        const desktopPath = app.getPath('desktop');
        const fullDefaultPath = path.join(desktopPath, sanitizedFilename);

        logger.debug('Export path:', fullDefaultPath);

        // Get the BrowserWindow from the event
        const win = BrowserWindow.fromWebContents(event.sender);

        // Show save dialog with window parent
        const result = await dialog.showSaveDialog(win!, {
          title: 'Export Page to PDF',
          defaultPath: fullDefaultPath,
          buttonLabel: 'Export',
          filters: [
            { name: 'PDF Files', extensions: ['pdf'] },
            { name: 'All Files', extensions: ['*'] },
          ],
          properties: ['createDirectory', 'showOverwriteConfirmation'],
        });

        if (result.canceled || !result.filePath) {
          return { success: false, canceled: true };
        }

        try {
          // Strip external font imports and other external resources for PDF generation
          let cleanedHtml = htmlContent
            // Remove @import statements for external fonts
            .replace(/@import\s+url\(['"]https?:\/\/[^'"]+['"]\);?/gi, '')
            // Remove <link> tags with external href
            .replace(/<link[^>]*href=["']https?:\/\/[^"']*["'][^>]*>/gi, '')
            // Remove <script> tags with external src
            .replace(/<script[^>]*src=["']https?:\/\/[^"']*["'][^>]*><\/script>/gi, '');

          logger.debug('Cleaned HTML for PDF export (removed external resources)');

          // Create a hidden browser window to render and export PDF
          const win = new BrowserWindow({
            show: false,
            webPreferences: {
              offscreen: true,
              webSecurity: false, // Allow loading local content
            },
          });

          // Load HTML content directly (avoid data URL blocking)
          await win.loadURL('about:blank');
          await win.webContents.executeJavaScript(`
            document.open();
            document.write(${JSON.stringify(cleanedHtml)});
            document.close();
          `);

          // Wait for page to fully render
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Generate PDF
          const pdfData = await win.webContents.printToPDF({
            pageSize: 'A4',
            landscape: true, // Presentations look better in landscape
            printBackground: true, // Preserve colors, gradients, backgrounds
            margins: {
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
            },
            preferCSSPageSize: true, // Respect @page CSS rules for slide breaks
          });

          // Ensure the file path has .pdf extension if user removed it
          let finalPath = result.filePath;
          if (!finalPath.endsWith('.pdf')) {
            finalPath += '.pdf';
          }

          // Save PDF to selected path
          await fs.writeFile(finalPath, pdfData);

          // Clean up
          win.destroy();

          logger.info(`PDF exported successfully: ${finalPath}`);
          return {
            success: true,
            filePath: finalPath
          };
        } catch (error) {
          logger.error('PDF export failed:', error);
          throw error;
        }
      },
    },
  ];

  // Register all handlers
  handlers.forEach(({ channel, handler }) => {
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        return await handler(event, ...args);
      } catch (error) {
        logger.error(`IPC handler error: ${channel}`, error);
        throw error;
      }
    });
  });

  logger.info(`Registered ${handlers.length} IPC handlers`);
}

/**
 * Remove all IPC handlers (cleanup)
 */
export function removeIpcHandlers(ipcMain: IpcMain): void {
  const channels = [
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
    'file:save',
    'file:read',
    'file:delete',
    'file:list',
    'settings:get',
    'settings:set',
    'stats:get',
    'health:check',
  ];

  channels.forEach((channel) => {
    ipcMain.removeHandler(channel);
  });

  // Remove new HTML export handler
  ipcMain.removeHandler('page:export-html');

  logger.info('Removed all IPC handlers');
}
