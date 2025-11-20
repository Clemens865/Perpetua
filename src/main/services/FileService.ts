/**
 * File Service
 * Handles secure file system operations for artifacts
 */

import * as fs from 'fs/promises';
import type { Stats } from 'fs';
import * as path from 'path';
import logger from '../utils/logger';
import type { Artifact } from '../../types';

export class FileService {
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  /**
   * Initialize file service
   */
  async initialize(): Promise<void> {
    logger.info(`Initializing file service at ${this.baseDir}`);

    try {
      // Create base directory if it doesn't exist
      await fs.mkdir(this.baseDir, { recursive: true });

      // Create subdirectories for different artifact types
      const subdirs = ['documents', 'code', 'visualizations', 'mindmaps', 'other'];

      await Promise.all(
        subdirs.map((dir) =>
          fs.mkdir(path.join(this.baseDir, dir), { recursive: true })
        )
      );

      logger.info('File service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize file service', error);
      throw error;
    }
  }

  /**
   * Save an artifact to the file system
   */
  async saveArtifact(artifact: Artifact): Promise<string> {
    logger.debug(`Saving artifact ${artifact.id}`);

    try {
      // Determine subdirectory based on artifact type
      const subdir = this.getSubdirectory(artifact.type);

      // Generate filename
      const filename = this.generateFilename(artifact);
      const filepath = path.join(this.baseDir, subdir, filename);

      // Validate filepath is within baseDir (security check)
      this.validatePath(filepath);

      // Write file
      await fs.writeFile(filepath, artifact.content, 'utf-8');

      logger.debug(`Artifact saved to ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error(`Failed to save artifact ${artifact.id}`, error);
      throw error;
    }
  }

  /**
   * Save a generic file
   */
  async saveFile(filename: string, content: string): Promise<string> {
    logger.debug(`Saving file ${filename}`);

    try {
      // Sanitize filename
      const sanitized = this.sanitizeFilename(filename);
      const filepath = path.join(this.baseDir, 'other', sanitized);

      // Validate filepath
      this.validatePath(filepath);

      // Write file
      await fs.writeFile(filepath, content, 'utf-8');

      logger.debug(`File saved to ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error(`Failed to save file ${filename}`, error);
      throw error;
    }
  }

  /**
   * Read a file
   */
  async readFile(filepath: string): Promise<string> {
    logger.debug(`Reading file ${filepath}`);

    try {
      // Validate filepath
      this.validatePath(filepath);

      // Read file
      const content = await fs.readFile(filepath, 'utf-8');

      logger.debug(`File read successfully`);
      return content;
    } catch (error) {
      logger.error(`Failed to read file ${filepath}`, error);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(filepath: string): Promise<void> {
    logger.debug(`Deleting file ${filepath}`);

    try {
      // Validate filepath
      this.validatePath(filepath);

      // Delete file
      await fs.unlink(filepath);

      logger.debug(`File deleted successfully`);
    } catch (error) {
      logger.error(`Failed to delete file ${filepath}`, error);
      throw error;
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(directory?: string): Promise<string[]> {
    const targetDir = directory
      ? path.join(this.baseDir, directory)
      : this.baseDir;

    logger.debug(`Listing files in ${targetDir}`);

    try {
      // Validate path
      this.validatePath(targetDir);

      // Read directory
      const files = await fs.readdir(targetDir);

      logger.debug(`Found ${files.length} files`);
      return files;
    } catch (error) {
      logger.error(`Failed to list files in ${targetDir}`, error);
      throw error;
    }
  }

  /**
   * Get file stats
   */
  async getFileStats(filepath: string): Promise<Stats> {
    this.validatePath(filepath);
    return await fs.stat(filepath);
  }

  /**
   * Check if file exists
   */
  async fileExists(filepath: string): Promise<boolean> {
    try {
      this.validatePath(filepath);
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cleanup - remove old files
   */
  async cleanup(maxAgeDays = 30): Promise<void> {
    logger.info(`Cleaning up files older than ${maxAgeDays} days`);

    try {
      const now = Date.now();
      const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;

      const subdirs = ['documents', 'code', 'visualizations', 'mindmaps', 'other'];

      for (const subdir of subdirs) {
        const dirPath = path.join(this.baseDir, subdir);
        const files = await fs.readdir(dirPath);

        for (const file of files) {
          const filepath = path.join(dirPath, file);
          const stats = await fs.stat(filepath);

          if (now - stats.mtimeMs > maxAge) {
            await fs.unlink(filepath);
            logger.debug(`Deleted old file: ${filepath}`);
          }
        }
      }

      logger.info('Cleanup completed');
    } catch (error) {
      logger.error('Failed to cleanup files', error);
      throw error;
    }
  }

  /**
   * Get subdirectory for artifact type
   */
  private getSubdirectory(type: Artifact['type']): string {
    const subdirs: Record<Artifact['type'], string> = {
      document: 'documents',
      code: 'code',
      visualization: 'visualizations',
      mindmap: 'mindmaps',
      other: 'other',
    };

    return subdirs[type] || 'other';
  }

  /**
   * Generate filename for artifact
   */
  private generateFilename(artifact: Artifact): string {
    // Sanitize title
    const sanitized = this.sanitizeFilename(artifact.title);

    // Get extension based on type and metadata
    const ext = this.getExtension(artifact);

    // Generate unique filename
    return `${artifact.id}-${sanitized}${ext}`;
  }

  /**
   * Get file extension based on artifact type
   */
  private getExtension(artifact: Artifact): string {
    if (artifact.type === 'code' && artifact.metadata.language) {
      const extensions: Record<string, string> = {
        javascript: '.js',
        typescript: '.ts',
        python: '.py',
        java: '.java',
        cpp: '.cpp',
        rust: '.rs',
        go: '.go',
        html: '.html',
        css: '.css',
        json: '.json',
        yaml: '.yaml',
        markdown: '.md',
      };
      return extensions[artifact.metadata.language] || '.txt';
    }

    if (artifact.type === 'document') {
      return '.md';
    }

    if (artifact.type === 'visualization') {
      return '.svg';
    }

    if (artifact.type === 'mindmap') {
      return '.json';
    }

    return '.txt';
  }

  /**
   * Sanitize filename - remove dangerous characters
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9_\-\.]/gi, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 100);
  }

  /**
   * Validate path is within baseDir (security check)
   */
  private validatePath(filepath: string): void {
    const resolved = path.resolve(filepath);
    const baseResolved = path.resolve(this.baseDir);

    if (!resolved.startsWith(baseResolved)) {
      throw new Error('Invalid file path: path traversal detected');
    }
  }
}
