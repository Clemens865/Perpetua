# Electron Backend Implementation

**Status:** ✅ Complete
**Date:** October 22, 2025
**Developer:** Backend Agent

## Overview

Complete Electron main process infrastructure for Perpetua with SQLite database, type-safe IPC communication, secure file operations, and comprehensive testing.

## Architecture

```
src/main/
├── index.ts                    # Main process entry point
├── database/
│   ├── DatabaseService.ts      # Type-safe SQLite wrapper
│   └── migrations.ts           # Database schema migrations
├── ipc/
│   ├── handlers.ts             # IPC request handlers
│   └── types.ts                # Shared IPC type definitions
├── services/
│   └── FileService.ts          # Secure file system operations
├── preload/
│   └── index.ts                # Preload script with context bridge
├── utils/
│   └── logger.ts               # Multi-level logging utility
└── security.ts                 # Security policies and CSP

tests/main/
├── database.test.ts            # Database service tests
├── fileService.test.ts         # File service tests
└── ipc.test.ts                 # IPC integration tests

src/types/
└── index.ts                    # Shared TypeScript types
```

## Key Components

### 1. Main Process (index.ts)

**Responsibilities:**
- Window creation and management
- Service initialization (database, file system)
- IPC handler registration
- Security policy enforcement
- Application lifecycle management

**Features:**
- Graceful startup and shutdown
- Development/production mode support
- Error handling with logging
- Service cleanup on quit

**Window Configuration:**
```typescript
{
  width: 1400,
  height: 900,
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  webSecurity: true
}
```

### 2. Database Service

**Technology:** better-sqlite3 (synchronous SQLite)

**Features:**
- Type-safe operations with TypeScript
- Versioned migrations
- Full-text search (FTS5)
- Foreign key constraints
- WAL mode for concurrency
- Transaction support

**Schema:**
- `journeys` - Exploration sessions
- `stages` - Individual cycle steps
- `artifacts` - Generated outputs
- `tags` - Journey categorization
- `settings` - Application configuration

**Operations:**
- ✅ CRUD for journeys, stages, artifacts
- ✅ Search with FTS
- ✅ Statistics and analytics
- ✅ Automatic ID generation

### 3. IPC Communication

**Security:**
- Channel validation (whitelist)
- Type-safe method signatures
- Error handling and logging
- Context isolation

**Available Channels:**
```typescript
// Journey operations
'journey:create'
'journey:get'
'journey:list'
'journey:update'
'journey:delete'

// Stage operations
'stage:create'
'stage:update'
'stage:list'

// Artifact operations
'artifact:create'
'artifact:get'
'artifact:list'
'artifact:search'

// File operations
'file:save'
'file:read'
'file:delete'
'file:list'

// Settings
'settings:get'
'settings:set'

// System
'stats:get'
'health:check'
```

**Usage Example:**
```typescript
// Renderer process
const journey = await window.electronAPI.createJourney('Research AI', {
  extendedThinking: true,
  computerUse: true
});
```

### 4. File Service

**Base Directory:** `userData/artifacts/`

**Structure:**
```
artifacts/
├── documents/      # Markdown documents
├── code/           # Source code files
├── visualizations/ # SVG visualizations
├── mindmaps/       # JSON mindmaps
└── other/          # Miscellaneous files
```

**Security:**
- Path traversal protection
- Filename sanitization
- Sandboxed to base directory
- Automatic file extension detection

**Features:**
- Artifact-aware storage
- Automatic cleanup (configurable)
- File existence checking
- Directory listing

### 5. Security Implementation

**Content Security Policy:**
```
default-src 'self';
script-src 'self' 'unsafe-inline';
connect-src 'self' https://api.anthropic.com;
frame-src 'none';
object-src 'none';
```

**Security Headers:**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

**Features:**
- Context isolation enabled
- Node integration disabled
- Sandbox mode enabled
- Permission request handler
- Secure storage for API keys (electron.safeStorage)

### 6. Logging System

**Log Levels:**
- DEBUG: Development details
- INFO: General information
- WARN: Warning messages
- ERROR: Error conditions

**Features:**
- Console output with colors
- File output with rotation
- Automatic log rotation (> 10MB)
- Environment-based filtering
- Structured JSON logs

**Log Location:** `userData/logs/perpetua.log`

### 7. Preload Script

**Purpose:** Bridge between main and renderer processes

**Exposed APIs:**
```typescript
window.electronAPI - Type-safe IPC methods
window.env - Environment information
window.versions - Electron/Node/Chrome versions
```

**Security:**
- contextBridge for safe exposure
- Channel validation
- No direct Node.js access

## Type System

### Core Types

```typescript
// Journey lifecycle
type JourneyStatus = 'running' | 'paused' | 'stopped' | 'complete' | 'error';

// Exploration stages
type StageType = 'discovering' | 'chasing' | 'solving' | 'challenging'
  | 'questioning' | 'searching' | 'imagining' | 'building';

// Artifact categories
type ArtifactType = 'document' | 'code' | 'visualization' | 'mindmap' | 'other';
```

### Data Models

**Journey:**
```typescript
interface Journey {
  id: string;
  input: string;
  status: JourneyStatus;
  stages: Stage[];
  settings: JourneySettings;
  createdAt: number;
  updatedAt: number;
}
```

**Stage:**
```typescript
interface Stage {
  id: string;
  journeyId: string;
  type: StageType;
  status: StageStatus;
  prompt: string;
  result: string;
  thinking?: string;
  artifacts: Artifact[];
  createdAt: number;
}
```

**Artifact:**
```typescript
interface Artifact {
  id: string;
  stageId: string;
  type: ArtifactType;
  title: string;
  content: string;
  metadata: {
    language?: string;
    framework?: string;
    tags?: string[];
    [key: string]: any;
  };
  createdAt: number;
}
```

## Testing

### Test Coverage

**Database Tests (database.test.ts):**
- Journey CRUD operations
- Stage operations
- Artifact management
- Search functionality
- Statistics

**File Service Tests (fileService.test.ts):**
- Artifact saving
- File operations
- Security (path traversal)
- Cleanup functionality
- File extension handling

**IPC Tests (ipc.test.ts):**
- Handler registration
- Journey operations via IPC
- Stage operations via IPC
- Health checks
- Statistics

### Running Tests

```bash
npm run test          # Run all tests
npm run test:main     # Run main process tests only
npm run test:coverage # Generate coverage report
```

## Performance Considerations

### Optimizations

1. **Database:**
   - WAL mode for better concurrency
   - Indexed columns for fast queries
   - Prepared statements
   - Transaction batching

2. **File System:**
   - Async operations throughout
   - Streaming for large files (future)
   - Automatic cleanup of old files

3. **IPC:**
   - Efficient serialization
   - Error handling to prevent crashes
   - Logging for debugging

### Performance Targets

- Database queries: < 10ms
- File operations: < 100ms
- IPC round trip: < 50ms
- Startup time: < 2 seconds

## Security Best Practices

1. **Input Validation:**
   - All user input sanitized
   - SQL injection prevention (prepared statements)
   - Path traversal protection

2. **Process Isolation:**
   - Context isolation enabled
   - Node integration disabled
   - Sandbox mode active

3. **Network Security:**
   - CSP restricts external resources
   - Whitelist for API endpoints
   - Request validation

4. **Data Protection:**
   - API keys encrypted (electron.safeStorage)
   - Local-first storage
   - No cloud dependencies

## Error Handling

**Strategy:**
- Graceful degradation
- User-friendly error messages
- Detailed logging for debugging
- Recovery mechanisms

**Error Types:**
```typescript
class PerpetuaError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
  }
}
```

## Integration with Frontend

### Usage in Renderer

```typescript
// Create journey
const journey = await window.electronAPI.createJourney(
  'Explore quantum computing',
  { extendedThinking: true }
);

// Get journey
const existing = await window.electronAPI.getJourney(journey.id);

// Create stage
await window.electronAPI.createStage({
  id: generateId(),
  journeyId: journey.id,
  type: 'discovering',
  status: 'complete',
  prompt: 'Research quantum computing',
  result: 'Found interesting papers...',
  artifacts: [],
  createdAt: Date.now()
});

// Save artifact
await window.electronAPI.createArtifact({
  id: generateId(),
  stageId: stage.id,
  type: 'document',
  title: 'Quantum Computing Overview',
  content: '# Quantum Computing\n\n...',
  metadata: {},
  createdAt: Date.now()
});

// Search artifacts
const results = await window.electronAPI.searchArtifacts('quantum', 10);

// Health check
const health = await window.electronAPI.healthCheck();
```

## Future Enhancements

1. **Database:**
   - Backup and restore
   - Export to JSON/CSV
   - Cloud sync (optional)

2. **File System:**
   - Large file streaming
   - Compression support
   - Version control integration

3. **IPC:**
   - Progress events
   - Streaming responses
   - Background tasks

4. **Security:**
   - Two-factor authentication
   - Encrypted database
   - Audit logging

5. **Performance:**
   - Connection pooling
   - Query caching
   - Lazy loading

## Troubleshooting

### Common Issues

**Database locked:**
- Check for multiple instances
- Verify WAL mode is enabled
- Review transaction usage

**IPC timeout:**
- Check handler registration
- Verify channel names
- Review error logs

**File permission errors:**
- Check userData path permissions
- Verify path validation
- Review security policies

### Debug Mode

Enable detailed logging:
```bash
NODE_ENV=development npm start
```

View logs:
```bash
tail -f ~/Library/Application Support/Perpetua/logs/perpetua.log
```

## Dependencies

**Core:**
- electron: ^28.0.0
- better-sqlite3: ^9.0.0
- typescript: ^5.0.0

**Development:**
- vitest: ^1.0.0
- @types/node: ^20.0.0
- @types/better-sqlite3: ^7.6.0

## File Locations

**User Data:**
```
macOS: ~/Library/Application Support/Perpetua/
Windows: %APPDATA%/Perpetua/
Linux: ~/.config/Perpetua/
```

**Structure:**
```
Perpetua/
├── perpetua.db           # SQLite database
├── artifacts/            # Artifact files
│   ├── documents/
│   ├── code/
│   ├── visualizations/
│   ├── mindmaps/
│   └── other/
└── logs/
    └── perpetua.log      # Application logs
```

## Summary

✅ **Complete Electron backend infrastructure**
✅ **Type-safe SQLite database with migrations**
✅ **Secure IPC communication with validation**
✅ **Sandboxed file system operations**
✅ **Comprehensive security policies**
✅ **Multi-level logging system**
✅ **Full test coverage**
✅ **Production-ready error handling**

The backend is ready for frontend integration and provides a solid foundation for the Perpetua exploration engine.

---

**Next Steps:**
1. Frontend integration using `window.electronAPI`
2. Claude service implementation for AI features
3. Real-time event system for stage updates
4. User settings UI
5. Performance monitoring and optimization
