/**
 * Logger Utility
 * Centralized logging with different levels
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private logFilePath: string;
  private minLevel: LogLevel;

  constructor() {
    const userDataPath = app?.getPath('userData') || process.cwd();
    this.logFilePath = path.join(userDataPath, 'logs', 'perpetua.log');
    this.minLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

    // Ensure logs directory exists
    const logsDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  /**
   * Log a message with specified level
   */
  private log(level: LogLevel, message: string, data?: any): void {
    const levelPriority: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    // Skip if level is below minimum
    if (levelPriority[level] < levelPriority[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    // Console output with colors
    this.consoleLog(entry);

    // File output
    this.fileLog(entry);
  }

  /**
   * Console output with colors
   */
  private consoleLog(entry: LogEntry): void {
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m', // Green
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
    };

    const reset = '\x1b[0m';
    const color = colors[entry.level];

    const prefix = `${color}[${entry.timestamp}] [${entry.level.toUpperCase()}]${reset}`;
    const message = `${prefix} ${entry.message}`;

    if (entry.data) {
      console.log(message, entry.data);
    } else {
      console.log(message);
    }
  }

  /**
   * File output
   */
  private fileLog(entry: LogEntry): void {
    try {
      const line = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logFilePath, line, 'utf-8');

      // Rotate log file if it gets too large (> 10MB)
      const stats = fs.statSync(this.logFilePath);
      if (stats.size > 10 * 1024 * 1024) {
        this.rotateLog();
      }
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Rotate log file
   */
  private rotateLog(): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedPath = this.logFilePath.replace('.log', `-${timestamp}.log`);
      fs.renameSync(this.logFilePath, rotatedPath);
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  /**
   * Public logging methods
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  /**
   * Get log file path
   */
  getLogPath(): string {
    return this.logFilePath;
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    try {
      fs.writeFileSync(this.logFilePath, '', 'utf-8');
      this.info('Logs cleared');
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
    this.info(`Log level set to: ${level}`);
  }
}

// Export singleton instance
const logger = new Logger();
export default logger;
