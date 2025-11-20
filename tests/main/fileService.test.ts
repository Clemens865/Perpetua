/**
 * File Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileService } from '../../src/main/services/FileService';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Artifact } from '../../src/types';

describe('FileService', () => {
  let fileService: FileService;
  const testDir = path.join(__dirname, 'test-artifacts');

  beforeEach(async () => {
    // Clean up test directory if exists
    try {
      await fs.rm(testDir, { recursive: true });
    } catch {
      // Ignore if doesn't exist
    }

    fileService = new FileService(testDir);
    await fileService.initialize();
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Initialization', () => {
    it('should create base directory', async () => {
      const exists = await fs
        .access(testDir)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);
    });

    it('should create subdirectories', async () => {
      const subdirs = ['documents', 'code', 'visualizations', 'mindmaps', 'other'];

      for (const subdir of subdirs) {
        const subdirPath = path.join(testDir, subdir);
        const exists = await fs
          .access(subdirPath)
          .then(() => true)
          .catch(() => false);

        expect(exists).toBe(true);
      }
    });
  });

  describe('Artifact Operations', () => {
    it('should save a code artifact', async () => {
      const artifact: Artifact = {
        id: 'test-1',
        stageId: 'stage-1',
        type: 'code',
        title: 'Hello World',
        content: 'console.log("Hello, World!");',
        metadata: { language: 'javascript' },
        createdAt: Date.now(),
      };

      const filepath = await fileService.saveArtifact(artifact);

      expect(filepath).toContain('code');
      expect(filepath).toContain('.js');

      const exists = await fs
        .access(filepath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should save a document artifact', async () => {
      const artifact: Artifact = {
        id: 'test-2',
        stageId: 'stage-1',
        type: 'document',
        title: 'Test Document',
        content: '# Test\n\nThis is a test document.',
        metadata: {},
        createdAt: Date.now(),
      };

      const filepath = await fileService.saveArtifact(artifact);

      expect(filepath).toContain('documents');
      expect(filepath).toContain('.md');
    });

    it('should use correct file extensions', async () => {
      const languages = [
        { lang: 'python', ext: '.py' },
        { lang: 'typescript', ext: '.ts' },
        { lang: 'rust', ext: '.rs' },
        { lang: 'go', ext: '.go' },
      ];

      for (const { lang, ext } of languages) {
        const artifact: Artifact = {
          id: `test-${lang}`,
          stageId: 'stage-1',
          type: 'code',
          title: `${lang} code`,
          content: 'test content',
          metadata: { language: lang },
          createdAt: Date.now(),
        };

        const filepath = await fileService.saveArtifact(artifact);
        expect(filepath).toContain(ext);
      }
    });
  });

  describe('File Operations', () => {
    it('should save and read a file', async () => {
      const content = 'Test file content';
      const filepath = await fileService.saveFile('test.txt', content);

      const read = await fileService.readFile(filepath);
      expect(read).toBe(content);
    });

    it('should delete a file', async () => {
      const filepath = await fileService.saveFile('delete-me.txt', 'content');

      await fileService.deleteFile(filepath);

      const exists = await fileService.fileExists(filepath);
      expect(exists).toBe(false);
    });

    it('should list files in directory', async () => {
      await fileService.saveFile('file1.txt', 'content 1');
      await fileService.saveFile('file2.txt', 'content 2');

      const files = await fileService.listFiles('other');
      expect(files.length).toBeGreaterThanOrEqual(2);
    });

    it('should check if file exists', async () => {
      const filepath = await fileService.saveFile('exists.txt', 'content');

      const exists = await fileService.fileExists(filepath);
      expect(exists).toBe(true);

      const notExists = await fileService.fileExists('/path/to/nowhere.txt');
      expect(notExists).toBe(false);
    });
  });

  describe('Security', () => {
    it('should reject path traversal attempts', async () => {
      const maliciousPath = '../../../etc/passwd';

      await expect(fileService.readFile(maliciousPath)).rejects.toThrow(
        'path traversal'
      );
    });

    it('should sanitize filenames', async () => {
      const artifact: Artifact = {
        id: 'test-1',
        stageId: 'stage-1',
        type: 'document',
        title: '../../../malicious<script>alert(1)</script>',
        content: 'test',
        metadata: {},
        createdAt: Date.now(),
      };

      const filepath = await fileService.saveArtifact(artifact);

      // Should not contain dangerous characters
      expect(filepath).not.toContain('<');
      expect(filepath).not.toContain('>');
      expect(filepath).not.toContain('..');
      expect(filepath).not.toContain('script');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup old files', async () => {
      // Save a file and modify its timestamp to be old
      const filepath = await fileService.saveFile('old-file.txt', 'content');

      // Set file modification time to 31 days ago
      const oldTime = Date.now() - 31 * 24 * 60 * 60 * 1000;
      await fs.utimes(filepath, oldTime / 1000, oldTime / 1000);

      // Run cleanup with 30 day threshold
      await fileService.cleanup(30);

      // File should be deleted
      const exists = await fileService.fileExists(filepath);
      expect(exists).toBe(false);
    });
  });
});
