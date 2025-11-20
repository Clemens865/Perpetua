# Page Storage Architecture

## Storage Strategy Overview

**Hybrid Approach: Database + File System**

```
┌─────────────────────────────────────────────────────────────┐
│                    STORAGE LAYERS                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. DATABASE (SQLite)                                        │
│     - Page metadata                                          │
│     - Analysis cache                                         │
│     - Search index                                           │
│     - Relationships                                          │
│                                                               │
│  2. FILE SYSTEM (User Data Directory)                       │
│     - Generated HTML files                                   │
│     - Embedded assets (CSS, JS)                             │
│     - Exported files (PDF, PNG)                             │
│     - Standalone packages                                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

### User Data Directory (Electron app.getPath('userData'))

```
~/Library/Application Support/Perpetua/  (macOS)
%APPDATA%/Perpetua/                      (Windows)
~/.config/Perpetua/                      (Linux)

├── database/
│   └── perpetua.db                      [SQLite database]
│
├── pages/                               [Generated pages root]
│   ├── journey_abc123/                  [One folder per journey]
│   │   ├── index.html                   [Latest generated page]
│   │   ├── analysis.json                [Cached analysis]
│   │   ├── versions/                    [Version history]
│   │   │   ├── v1_presentation.html
│   │   │   ├── v2_timeline.html
│   │   │   └── v3_mindmap.html
│   │   └── assets/                      [Page-specific assets]
│   │       ├── images/
│   │       ├── data/
│   │       └── custom.css
│   │
│   └── journey_def456/
│       └── ...
│
├── exports/                             [User exports]
│   ├── 2025-01-15_journey-name.pdf
│   ├── 2025-01-15_journey-name.png
│   └── 2025-01-15_journey-name_standalone.zip
│
└── templates/                           [Custom templates]
    ├── reveal-theme.css
    └── custom-styles.css
```

## Database Schema Updates

### Pages Table

```sql
CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,

  -- Template info
  type TEXT NOT NULL,              -- 'template' | 'architect' | 'multi-agent'
  template_name TEXT,              -- 'report' | 'wiki' | 'presentation' | 'timeline' | 'mindmap'

  -- Metadata
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  version INTEGER DEFAULT 1,

  -- Analysis cache (JSON)
  analysis_data TEXT,              -- Cached JourneyAnalysis
  analysis_timestamp INTEGER,

  -- File references
  file_path TEXT,                  -- Relative path from pages/
  file_size INTEGER,               -- Bytes

  -- Search index
  search_text TEXT,                -- Full-text search

  FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE
);

CREATE INDEX idx_pages_journey ON pages(journey_id);
CREATE INDEX idx_pages_template ON pages(template_name);
CREATE VIRTUAL TABLE pages_fts USING fts5(title, search_text);
```

### Page Exports Table

```sql
CREATE TABLE page_exports (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,

  export_type TEXT NOT NULL,       -- 'pdf' | 'png' | 'html' | 'standalone'
  file_path TEXT NOT NULL,         -- Path in exports/
  file_size INTEGER,

  created_at INTEGER NOT NULL,

  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);
```

## File Access Architecture

### Security Model

**Electron Security Principles:**
1. Main process has full file system access
2. Renderer process has NO direct file access
3. All file operations go through IPC
4. Paths are validated to prevent directory traversal

### File Service (Main Process)

```typescript
// src/main/services/PageFileService.ts

export class PageFileService {
  private pagesDir: string;
  private exportsDir: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.pagesDir = path.join(userDataPath, 'pages');
    this.exportsDir = path.join(userDataPath, 'exports');

    // Ensure directories exist
    this.ensureDirectories();
  }

  /**
   * Save page HTML to file system
   */
  async savePage(
    journeyId: string,
    pageId: string,
    content: string,
    templateName: string
  ): Promise<string> {
    const journeyDir = path.join(this.pagesDir, journeyId);
    await fs.mkdir(journeyDir, { recursive: true });

    // Save as index.html (latest)
    const indexPath = path.join(journeyDir, 'index.html');
    await fs.writeFile(indexPath, content, 'utf-8');

    // Save versioned copy
    const versionDir = path.join(journeyDir, 'versions');
    await fs.mkdir(versionDir, { recursive: true });

    const timestamp = Date.now();
    const versionPath = path.join(
      versionDir,
      `v${timestamp}_${templateName}.html`
    );
    await fs.writeFile(versionPath, content, 'utf-8');

    // Return relative path
    return `${journeyId}/index.html`;
  }

  /**
   * Read page HTML from file system
   */
  async readPage(filePath: string): Promise<string> {
    const fullPath = path.join(this.pagesDir, filePath);

    // Security: Ensure path is within pagesDir
    if (!this.isPathSafe(fullPath, this.pagesDir)) {
      throw new Error('Invalid file path');
    }

    return await fs.readFile(fullPath, 'utf-8');
  }

  /**
   * Save analysis cache
   */
  async saveAnalysis(
    journeyId: string,
    analysis: JourneyAnalysis
  ): Promise<void> {
    const journeyDir = path.join(this.pagesDir, journeyId);
    await fs.mkdir(journeyDir, { recursive: true });

    const analysisPath = path.join(journeyDir, 'analysis.json');
    await fs.writeFile(
      analysisPath,
      JSON.stringify(analysis, null, 2),
      'utf-8'
    );
  }

  /**
   * Read cached analysis
   */
  async readAnalysis(journeyId: string): Promise<JourneyAnalysis | null> {
    const analysisPath = path.join(
      this.pagesDir,
      journeyId,
      'analysis.json'
    );

    try {
      const data = await fs.readFile(analysisPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Export page as standalone HTML package
   */
  async exportStandalone(
    pageId: string,
    filePath: string
  ): Promise<string> {
    // Create ZIP with HTML + embedded assets
    // Return path to ZIP file
  }

  /**
   * Security: Validate path is within allowed directory
   */
  private isPathSafe(requestedPath: string, baseDir: string): boolean {
    const normalizedPath = path.normalize(requestedPath);
    const normalizedBase = path.normalize(baseDir);
    return normalizedPath.startsWith(normalizedBase);
  }
}
```

## IPC Channels for File Access

### New IPC Handlers

```typescript
// src/main/ipc/handlers.ts

// Add to setupIpcHandlers():

{
  channel: 'page:save-file',
  handler: async (_, journeyId: string, pageId: string, content: string, templateName: string) => {
    const filePath = await pageFileService.savePage(
      journeyId,
      pageId,
      content,
      templateName
    );
    return { success: true, filePath };
  }
},

{
  channel: 'page:read-file',
  handler: async (_, filePath: string) => {
    const content = await pageFileService.readPage(filePath);
    return { content };
  }
},

{
  channel: 'page:save-analysis',
  handler: async (_, journeyId: string, analysis: JourneyAnalysis) => {
    await pageFileService.saveAnalysis(journeyId, analysis);
    return { success: true };
  }
},

{
  channel: 'page:read-analysis',
  handler: async (_, journeyId: string) => {
    const analysis = await pageFileService.readAnalysis(journeyId);
    return { analysis };
  }
},

{
  channel: 'page:export',
  handler: async (_, pageId: string, exportType: 'pdf' | 'png' | 'standalone') => {
    // Handle different export types
    const filePath = await pageFileService.export(pageId, exportType);
    return { success: true, filePath };
  }
},

{
  channel: 'page:open-external',
  handler: async (_, filePath: string) => {
    // Open in default browser/viewer
    const fullPath = path.join(app.getPath('userData'), 'pages', filePath);
    await shell.openPath(fullPath);
    return { success: true };
  }
},

{
  channel: 'page:reveal-in-finder',
  handler: async (_, filePath: string) => {
    // Show file in Finder/Explorer
    const fullPath = path.join(app.getPath('userData'), 'pages', filePath);
    shell.showItemInFolder(fullPath);
    return { success: true };
  }
}
```

## Page Viewing Options

### Option 1: Embedded WebView (Recommended)

```typescript
// src/renderer/components/pages/PageViewer.tsx

export function PageViewer({ page }: { page: Page }) {
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    async function loadPage() {
      if (ipcClient.isAvailable() && page.file_path) {
        const { content } = await ipcClient.invoke('page:read-file', page.file_path);
        setHtmlContent(content);
      }
    }
    loadPage();
  }, [page]);

  return (
    <div className="page-viewer">
      {/* Render HTML in sandboxed iframe */}
      <iframe
        srcDoc={htmlContent}
        sandbox="allow-scripts allow-same-origin"
        className="w-full h-full"
      />
    </div>
  );
}
```

**Pros:**
- Stays within Electron app
- Consistent UX
- Full control over interactions

**Cons:**
- Sandboxing may limit some features
- Need to handle cross-frame communication

### Option 2: BrowserWindow

```typescript
// Open in new Electron window
const pageWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true
  }
});

pageWindow.loadFile(fullPagePath);
```

**Pros:**
- Full page experience
- No sandboxing issues
- Easy navigation

**Cons:**
- Separate window management
- Less integrated feel

### Option 3: External Browser

```typescript
// Open in default system browser
shell.openExternal(`file://${fullPagePath}`);
```

**Pros:**
- Full browser capabilities
- Familiar environment

**Cons:**
- Leaves Electron app
- No app integration

**Recommendation: Option 1 (Embedded) + Button for Option 3 (External)**

## Caching Strategy

### Analysis Cache

```typescript
// When generating page:
1. Check if analysis.json exists for journey
2. Check journey.updatedAt against analysis timestamp
3. If stale or missing:
   - Run Claude analysis
   - Save to analysis.json
   - Save to database
4. Use cached analysis for generation
```

**Cache Invalidation:**
- When journey is updated (new stages added)
- Manual refresh button in UI
- TTL: 7 days (configurable)

### Generated Pages Cache

```
- index.html always reflects latest
- versions/ keeps history
- User can regenerate anytime
- Old versions auto-cleanup after 30 days (configurable)
```

## Export Workflows

### PDF Export

```typescript
// Use Electron's built-in PDF generation
async function exportToPDF(pageId: string): Promise<string> {
  const win = new BrowserWindow({ show: false });
  await win.loadFile(pagePath);

  const pdfData = await win.webContents.printToPDF({
    pageSize: 'A4',
    printBackground: true,
    margin: {
      top: 1,
      bottom: 1,
      left: 1,
      right: 1
    }
  });

  const exportPath = path.join(exportsDir, `${pageId}.pdf`);
  await fs.writeFile(exportPath, pdfData);

  return exportPath;
}
```

### PNG Export (for Timeline/Mindmap)

```typescript
// Use Electron's captureScreenshot
async function exportToPNG(pageId: string): Promise<string> {
  const win = new BrowserWindow({ show: false, width: 1920, height: 1080 });
  await win.loadFile(pagePath);

  // Wait for rendering
  await new Promise(resolve => setTimeout(resolve, 2000));

  const image = await win.webContents.capturePage();
  const exportPath = path.join(exportsDir, `${pageId}.png`);

  await fs.writeFile(exportPath, image.toPNG());

  return exportPath;
}
```

### Standalone Package

```typescript
// Create self-contained HTML file
async function exportStandalone(pageId: string): Promise<string> {
  // Read HTML
  const html = await fs.readFile(pagePath, 'utf-8');

  // Inline all assets (CSS, JS, images as base64)
  const inlined = await inlineAssets(html);

  // Create ZIP with HTML + README
  const zip = new AdmZip();
  zip.addFile('index.html', Buffer.from(inlined));
  zip.addFile('README.txt', Buffer.from('Open index.html in any browser'));

  const exportPath = path.join(exportsDir, `${pageId}_standalone.zip`);
  zip.writeZip(exportPath);

  return exportPath;
}
```

## Storage Size Management

### Monitoring

```typescript
async function getStorageStats(): Promise<StorageStats> {
  const pagesSize = await getFolderSize(pagesDir);
  const exportsSize = await getFolderSize(exportsDir);

  return {
    totalSize: pagesSize + exportsSize,
    pageCount: await countFiles(pagesDir),
    exportCount: await countFiles(exportsDir),
    oldestPage: await getOldestFile(pagesDir)
  };
}
```

### Cleanup Policies

```typescript
// Auto-cleanup old versions (optional)
async function cleanupOldVersions(retentionDays: number = 30): Promise<void> {
  const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

  // Find and delete old version files
  const versionDirs = await findAll(pagesDir, '**/versions');

  for (const dir of versionDirs) {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const stats = await fs.stat(path.join(dir, file));
      if (stats.mtimeMs < cutoff) {
        await fs.unlink(path.join(dir, file));
      }
    }
  }
}
```

### User Settings

```typescript
interface StorageSettings {
  maxSizeMB: number;           // Alert when exceeded
  retentionDays: number;       // Auto-delete old versions
  autoCleanup: boolean;        // Enable auto-cleanup
  exportFormat: 'pdf' | 'png'; // Default export
}
```

## Security Considerations

### Path Validation

```typescript
function validatePath(userPath: string): boolean {
  // Prevent directory traversal
  if (userPath.includes('..')) return false;
  if (path.isAbsolute(userPath)) return false;

  // Must be alphanumeric + allowed chars
  if (!/^[a-zA-Z0-9_\-\/\.]+$/.test(userPath)) return false;

  return true;
}
```

### Content Security Policy

```html
<!-- In generated HTML pages -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline' cdn.jsdelivr.net;
               style-src 'self' 'unsafe-inline';">
```

### Sandboxing

```typescript
// Iframe sandbox attributes
<iframe
  srcDoc={content}
  sandbox="allow-scripts allow-same-origin"
  // No allow-top-navigation, allow-popups, etc.
/>
```

## Migration Path

### Database Migration

```sql
-- Add columns to existing pages table
ALTER TABLE pages ADD COLUMN file_path TEXT;
ALTER TABLE pages ADD COLUMN file_size INTEGER;
ALTER TABLE pages ADD COLUMN analysis_data TEXT;
ALTER TABLE pages ADD COLUMN analysis_timestamp INTEGER;
ALTER TABLE pages ADD COLUMN version INTEGER DEFAULT 1;

-- Create exports table
CREATE TABLE page_exports (...);
```

### File Migration

```typescript
// One-time migration: Move inline content to files
async function migratePages(): Promise<void> {
  const pages = await db.all('SELECT * FROM pages WHERE file_path IS NULL');

  for (const page of pages) {
    // Save content to file
    const filePath = await pageFileService.savePage(
      page.journey_id,
      page.id,
      page.content,
      page.template_name
    );

    // Update database
    await db.run(
      'UPDATE pages SET file_path = ?, file_size = ? WHERE id = ?',
      [filePath, page.content.length, page.id]
    );
  }
}
```

## Summary

**Storage Architecture:**
- ✅ Database for metadata, search, relationships
- ✅ File system for HTML content (userData/pages/)
- ✅ Secure IPC for all file operations
- ✅ Caching for performance (analysis + pages)
- ✅ Version history with auto-cleanup
- ✅ Multiple export formats (PDF, PNG, standalone)
- ✅ Path validation and sandboxing for security

**Benefits:**
- **Performance**: Large HTML files don't bloat database
- **Searchability**: Metadata in database, FTS for search
- **Security**: All file access through validated IPC
- **Flexibility**: Easy exports, version history
- **Scalability**: Can handle hundreds of pages

**Next**: Implement ClaudePageAnalyzer service that uses this storage
