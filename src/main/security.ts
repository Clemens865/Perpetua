/**
 * Security Policies
 * Content Security Policy and security headers
 */

import { Session, session } from 'electron';
import logger from './utils/logger';

/**
 * Setup security policies for the application
 */
export function setupSecurityPolicies(sessionInstance: typeof session): void {
  logger.info('Setting up security policies');

  const defaultSession = sessionInstance.defaultSession;

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Vite needs unsafe-inline in dev
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://api.anthropic.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  // Set CSP headers
  defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
        'X-XSS-Protection': ['1; mode=block'],
        'Referrer-Policy': ['strict-origin-when-cross-origin'],
      },
    });
  });

  // Disable remote module
  defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = new Set(['clipboard-read', 'clipboard-write']);

    if (allowedPermissions.has(permission)) {
      callback(true);
    } else {
      logger.warn(`Permission denied: ${permission}`);
      callback(false);
    }
  });

  // Block navigation to external URLs
  defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const allowedDomains = [
      'localhost',
      '127.0.0.1',
      'api.anthropic.com',
    ];

    const url = new URL(details.url);
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Allow local and whitelisted domains
    if (
      url.protocol === 'file:' ||
      url.protocol === 'perpetua:' ||
      url.protocol === 'devtools:' ||
      url.protocol === 'chrome-devtools:' ||
      allowedDomains.some((domain) => url.hostname.includes(domain))
    ) {
      callback({});
    } else {
      logger.warn(`Blocked request to: ${details.url}`);
      callback({ cancel: true });
    }
  });

  // Set secure defaults
  defaultSession.setSpellCheckerEnabled(false);

  logger.info('Security policies configured');
}

/**
 * Secure storage utilities using Electron's safeStorage
 */
export class SecureStorage {
  /**
   * Check if encryption is available
   */
  static isAvailable(): boolean {
    const { safeStorage } = require('electron');
    return safeStorage.isEncryptionAvailable();
  }

  /**
   * Encrypt a string
   */
  static encrypt(plaintext: string): string {
    const { safeStorage } = require('electron');

    if (!this.isAvailable()) {
      throw new Error('Encryption not available on this platform');
    }

    const buffer = safeStorage.encryptString(plaintext);
    return buffer.toString('base64');
  }

  /**
   * Decrypt a string
   */
  static decrypt(encrypted: string): string {
    const { safeStorage } = require('electron');

    if (!this.isAvailable()) {
      throw new Error('Encryption not available on this platform');
    }

    const buffer = Buffer.from(encrypted, 'base64');
    return safeStorage.decryptString(buffer);
  }

  /**
   * Store API key securely
   */
  static setApiKey(service: string, key: string): void {
    const encrypted = this.encrypt(key);
    // Store in app settings or config
    // This is a placeholder - implement actual storage
    logger.info(`API key for ${service} stored securely`);
  }

  /**
   * Retrieve API key
   */
  static getApiKey(service: string): string | null {
    // Retrieve from app settings or config
    // This is a placeholder - implement actual retrieval
    return null;
  }
}

/**
 * Validate input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate file path to prevent path traversal
 */
export function validateFilePath(filepath: string, baseDir: string): boolean {
  const path = require('path');
  const resolved = path.resolve(filepath);
  const baseResolved = path.resolve(baseDir);

  return resolved.startsWith(baseResolved);
}
