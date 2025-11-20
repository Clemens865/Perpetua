/**
 * Page File Service
 * Manages file system operations for generated pages
 * Runs in main process with full file system access
 */

import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import logger from '../utils/logger';
import type { JourneyAnalysis } from '../../renderer/services/claude/ClaudePageAnalyzer';

export class PageFileService {
  private pagesDir: string;
  private exportsDir: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.pagesDir = path.join(userDataPath, 'pages');
    this.exportsDir = path.join(userDataPath, 'exports');

    logger.info('PageFileService initialized', {
      pagesDir: this.pagesDir,
      exportsDir: this.exportsDir,
    });
  }

  /**
   * Ensure required directories exist
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.pagesDir, { recursive: true });
      await fs.mkdir(this.exportsDir, { recursive: true });
      logger.info('Page directories created/verified');
    } catch (error) {
      logger.error('Failed to create page directories:', error);
      throw error;
    }
  }

  /**
   * Save page HTML to file system
   */
  async savePage(
    journeyId: string,
    pageId: string,
    content: string,
    templateName: string
  ): Promise<{ filePath: string; fileSize: number }> {
    try {
      // Create journey directory
      const journeyDir = path.join(this.pagesDir, journeyId);
      await fs.mkdir(journeyDir, { recursive: true });

      // Save as index.html (latest version)
      const indexPath = path.join(journeyDir, 'index.html');
      await fs.writeFile(indexPath, content, 'utf-8');

      // Save versioned copy
      const versionDir = path.join(journeyDir, 'versions');
      await fs.mkdir(versionDir, { recursive: true });

      const timestamp = Date.now();
      const versionFilename = `v${timestamp}_${templateName}.html`;
      const versionPath = path.join(versionDir, versionFilename);
      await fs.writeFile(versionPath, content, 'utf-8');

      // Get file size
      const stats = await fs.stat(indexPath);
      const fileSize = stats.size;

      // Relative path for database storage
      const relativePath = `${journeyId}/index.html`;

      logger.info('Page saved', {
        pageId,
        journeyId,
        templateName,
        fileSize,
        path: relativePath,
      });

      return { filePath: relativePath, fileSize };
    } catch (error) {
      logger.error('Failed to save page:', error);
      throw error;
    }
  }

  /**
   * Read page HTML from file system
   */
  async readPage(filePath: string): Promise<string> {
    try {
      const fullPath = path.join(this.pagesDir, filePath);

      // Security: Validate path is within pagesDir
      if (!this.isPathSafe(fullPath, this.pagesDir)) {
        logger.error('Path traversal attempt detected', { filePath });
        throw new Error('Invalid file path');
      }

      const content = await fs.readFile(fullPath, 'utf-8');

      logger.debug('Page read', { filePath, size: content.length });

      return content;
    } catch (error) {
      logger.error('Failed to read page:', error);
      throw error;
    }
  }

  /**
   * Save analysis cache to file system
   */
  async saveAnalysis(journeyId: string, analysis: any): Promise<void> {
    try {
      const journeyDir = path.join(this.pagesDir, journeyId);
      await fs.mkdir(journeyDir, { recursive: true });

      const analysisPath = path.join(journeyDir, 'analysis.json');
      await fs.writeFile(
        analysisPath,
        JSON.stringify(analysis, null, 2),
        'utf-8'
      );

      logger.info('Analysis cached', { journeyId });
    } catch (error) {
      logger.error('Failed to save analysis:', error);
      throw error;
    }
  }

  /**
   * Read cached analysis from file system
   */
  async readAnalysis(journeyId: string): Promise<any | null> {
    try {
      const analysisPath = path.join(
        this.pagesDir,
        journeyId,
        'analysis.json'
      );

      const data = await fs.readFile(analysisPath, 'utf-8');
      const analysis = JSON.parse(data);

      logger.debug('Analysis read from cache', { journeyId });

      return analysis;
    } catch (error) {
      // File doesn't exist or is invalid - this is OK
      logger.debug('No cached analysis found', { journeyId });
      return null;
    }
  }

  /**
   * Delete page files for a journey
   */
  async deletePage(journeyId: string): Promise<void> {
    try {
      const journeyDir = path.join(this.pagesDir, journeyId);

      // Check if directory exists
      try {
        await fs.access(journeyDir);
      } catch {
        // Directory doesn't exist, nothing to delete
        return;
      }

      // Delete entire journey directory
      await fs.rm(journeyDir, { recursive: true, force: true });

      logger.info('Page files deleted', { journeyId });
    } catch (error) {
      logger.error('Failed to delete page files:', error);
      throw error;
    }
  }

  /**
   * List all page versions for a journey
   */
  async listVersions(journeyId: string): Promise<string[]> {
    try {
      const versionDir = path.join(this.pagesDir, journeyId, 'versions');

      try {
        const files = await fs.readdir(versionDir);
        return files.filter((f) => f.endsWith('.html')).sort().reverse();
      } catch {
        // No versions directory
        return [];
      }
    } catch (error) {
      logger.error('Failed to list versions:', error);
      return [];
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalSize: number;
    pageCount: number;
    journeyCount: number;
  }> {
    try {
      const journeyDirs = await fs.readdir(this.pagesDir);
      let totalSize = 0;
      let pageCount = 0;

      for (const dir of journeyDirs) {
        const journeyPath = path.join(this.pagesDir, dir);
        const stats = await fs.stat(journeyPath);

        if (stats.isDirectory()) {
          const size = await this.getFolderSize(journeyPath);
          totalSize += size;
          pageCount++;
        }
      }

      return {
        totalSize,
        pageCount,
        journeyCount: journeyDirs.length,
      };
    } catch (error) {
      logger.error('Failed to get storage stats:', error);
      return { totalSize: 0, pageCount: 0, journeyCount: 0 };
    }
  }

  /**
   * Get total size of a folder
   */
  private async getFolderSize(folderPath: string): Promise<number> {
    let size = 0;

    try {
      const files = await fs.readdir(folderPath, { withFileTypes: true });

      for (const file of files) {
        const filePath = path.join(folderPath, file.name);

        if (file.isDirectory()) {
          size += await this.getFolderSize(filePath);
        } else {
          const stats = await fs.stat(filePath);
          size += stats.size;
        }
      }
    } catch (error) {
      logger.error('Error calculating folder size:', error);
    }

    return size;
  }

  /**
   * Security: Validate path is within allowed directory
   */
  private isPathSafe(requestedPath: string, baseDir: string): boolean {
    const normalizedPath = path.normalize(requestedPath);
    const normalizedBase = path.normalize(baseDir);

    // Path must be within baseDir
    if (!normalizedPath.startsWith(normalizedBase)) {
      return false;
    }

    // Path cannot contain ../ (directory traversal)
    if (requestedPath.includes('..')) {
      return false;
    }

    return true;
  }

  /**
   * Get paths for testing/debugging
   */
  getPaths(): { pagesDir: string; exportsDir: string } {
    return {
      pagesDir: this.pagesDir,
      exportsDir: this.exportsDir,
    };
  }
}
