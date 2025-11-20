/**
 * Electron Main Process Entry Point
 * Handles window management, IPC, and application lifecycle
 */

import { app, BrowserWindow, ipcMain, protocol, session, globalShortcut } from 'electron';
import * as path from 'path';
import { DatabaseService } from './database/DatabaseService';
import { FileService } from './services/FileService';
import { PageFileService } from './services/PageFileService';
import { setupIpcHandlers } from './ipc/handlers';
import { setupSecurityPolicies } from './security';
import logger from './utils/logger';

// Keep a global reference to prevent garbage collection
let mainWindow: BrowserWindow | null = null;
let databaseService: DatabaseService | null = null;
let fileService: FileService | null = null;
let pageFileService: PageFileService | null = null;

// Development mode check
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = !isDevelopment;

// ✅ FIX: Register custom protocols BEFORE app is ready
// This MUST be called before app.whenReady() or app.on('ready')
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'perpetua',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
    },
  },
]);

/**
 * Create the main application window
 */
async function createWindow(): Promise<BrowserWindow> {
  logger.info('Creating main window');

  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false, // Don't show until ready
    backgroundColor: '#0a0a0a',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Error handlers for debugging
  window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    logger.error(`Window failed to load: ${errorCode} - ${errorDescription}`);
  });

  window.webContents.on('did-finish-load', () => {
    logger.info('Window finished loading');
  });

  // Show window when ready
  window.once('ready-to-show', () => {
    logger.info('Window ready to show');
    window.show();
    window.focus();
  });

  // Open DevTools after content is fully loaded (production only)
  if (!isDevelopment) {
    window.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        try {
          window.webContents.openDevTools({ mode: 'detach', activate: true });
          logger.info('DevTools opened (detached mode)');

          // Verify DevTools opened successfully
          setTimeout(() => {
            if (!window.webContents.isDevToolsOpened()) {
              logger.warn('DevTools failed to open in detached mode, trying right docked...');
              window.webContents.openDevTools({ mode: 'right', activate: true });
            }
          }, 500);
        } catch (error) {
          logger.error('Failed to open DevTools:', error);
        }
      }, 1500);
    });
  }

  // Fallback: Show window after timeout if ready-to-show doesn't fire
  setTimeout(() => {
    if (!window.isVisible()) {
      logger.warn('Window not shown after 3s, forcing show');
      window.show();
      window.focus();
    }
  }, 3000);

  // Register keyboard shortcut for DevTools toggle (Cmd+Option+I / Ctrl+Shift+I)
  const toggleDevToolsShortcut = process.platform === 'darwin' ? 'CommandOrControl+Option+I' : 'Ctrl+Shift+I';

  try {
    globalShortcut.register(toggleDevToolsShortcut, () => {
      if (window && !window.isDestroyed()) {
        if (window.webContents.isDevToolsOpened()) {
          window.webContents.closeDevTools();
          logger.info('DevTools closed via keyboard shortcut');
        } else {
          window.webContents.openDevTools({ mode: 'detach', activate: true });
          logger.info('DevTools opened via keyboard shortcut');
        }
      }
    });
    logger.info(`DevTools keyboard shortcut registered: ${toggleDevToolsShortcut}`);
  } catch (error) {
    logger.error('Failed to register DevTools shortcut:', error);
  }

  // Load the app (don't await - let event handlers deal with it)
  if (isDevelopment) {
    // Development: Load from Vite dev server
    logger.info('Loading from Vite dev server: http://localhost:5173');
    window.loadURL('http://localhost:5173').catch((err) => {
      logger.error('Failed to load URL:', err);
    });
    window.webContents.openDevTools();
  } else {
    // Production: Load from built files
    window.loadFile(path.join(__dirname, '../../renderer/index.html')).catch((err) => {
      logger.error('Failed to load file:', err);
    });
    // DevTools will open in did-finish-load event
  }

  // Handle window closed
  window.on('closed', () => {
    logger.info('Window closed');

    // Unregister keyboard shortcuts for this window
    globalShortcut.unregisterAll();
    logger.info('Keyboard shortcuts unregistered');

    mainWindow = null;
  });

  return window;
}

/**
 * Initialize core services
 */
async function initializeServices(): Promise<void> {
  logger.info('Initializing services');

  try {
    // Initialize database
    const dbPath = path.join(app.getPath('userData'), 'perpetua.db');
    databaseService = new DatabaseService(dbPath);
    await databaseService.initialize();
    logger.info('Database service initialized');

    // Initialize file service
    const artifactsPath = path.join(app.getPath('userData'), 'artifacts');
    fileService = new FileService(artifactsPath);
    await fileService.initialize();
    logger.info('File service initialized');

    // Initialize page file service
    pageFileService = new PageFileService();
    await pageFileService.initialize();
    logger.info('Page file service initialized');

    // Setup IPC handlers
    setupIpcHandlers(ipcMain, databaseService, fileService, pageFileService);
    logger.info('IPC handlers registered');
  } catch (error) {
    logger.error('Failed to initialize services', error);
    throw error;
  }
}

/**
 * Cleanup services on shutdown
 */
async function cleanupServices(): Promise<void> {
  logger.info('Cleaning up services');

  try {
    if (databaseService) {
      await databaseService.close();
      logger.info('Database service closed');
    }

    if (fileService) {
      await fileService.cleanup();
      logger.info('File service cleaned up');
    }
  } catch (error) {
    logger.error('Error during cleanup', error);
  }
}

/**
 * Application ready handler
 */
app.on('ready', async () => {
  logger.info('Application ready');

  try {
    // Setup security policies
    setupSecurityPolicies(session);

    // Initialize services
    await initializeServices();

    // Create main window
    mainWindow = await createWindow();
  } catch (error) {
    logger.error('Failed to start application', error);
    app.quit();
  }
});

/**
 * All windows closed handler
 */
app.on('window-all-closed', () => {
  logger.info('All windows closed');

  // On macOS, keep app running until explicit quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Activate handler (macOS)
 */
app.on('activate', async () => {
  logger.info('Application activated');

  // On macOS, recreate window when dock icon is clicked
  if (mainWindow === null) {
    mainWindow = await createWindow();
  }
});

/**
 * Will quit handler - cleanup before exit
 */
app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
  logger.info('All keyboard shortcuts unregistered');
});

/**
 * Before quit handler
 */
app.on('before-quit', async (event) => {
  logger.info('Application quitting');

  // Prevent default to cleanup first
  event.preventDefault();

  try {
    await cleanupServices();
    app.exit(0);
  } catch (error) {
    logger.error('Error during quit', error);
    app.exit(1);
  }
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  app.quit();
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason);
});

// Export for testing
export { mainWindow, databaseService, fileService };
