# ADR 003: Use SQLite with better-sqlite3

**Status:** Accepted
**Date:** 2025-10-22
**Deciders:** System Architect
**Context:** Perpetua Architecture Design

---

## Context and Problem Statement

Perpetua needs local data storage for:
- Journey history
- Stage results
- Artifacts
- User settings
- Search functionality

Requirements:
- Fast read/write operations
- ACID transactions
- Full-text search
- Relational data model
- No external server
- Cross-platform

**Decision:** Which local database should we use?

---

## Decision Drivers

- **Performance:** Fast synchronous operations
- **Reliability:** ACID guarantees
- **Simplicity:** No configuration required
- **Portability:** Single file database
- **Features:** Indexing, FTS, triggers
- **Node.js Integration:** Good bindings
- **TypeScript Support:** Type-safe queries

---

## Considered Options

### Option 1: SQLite (better-sqlite3)
- ✅ Synchronous API (simpler code)
- ✅ Fastest SQLite binding for Node.js
- ✅ ACID transactions
- ✅ Full-text search (FTS5)
- ✅ Single file database
- ✅ Battle-tested, ultra-reliable
- ✅ Zero configuration
- ❌ Synchronous (blocks event loop)
- ❌ Needs native compilation

### Option 2: SQLite (node-sqlite3)
- ✅ Asynchronous API
- ✅ Popular, well-maintained
- ✅ All SQLite features
- ❌ Slower than better-sqlite3
- ❌ Callback-based API (less ergonomic)
- ❌ More complex code

### Option 3: LevelDB / RocksDB
- ✅ Very fast key-value store
- ✅ Good for high throughput
- ❌ No SQL, no relations
- ❌ No full-text search
- ❌ More complex queries
- ❌ Less suitable for structured data

### Option 4: IndexedDB (via level.js)
- ✅ Browser-compatible
- ✅ Asynchronous
- ❌ Complex API
- ❌ No SQL
- ❌ Limited query capabilities
- ❌ Not ideal for Electron main process

### Option 5: NeDB / LokiJS
- ✅ Pure JavaScript
- ✅ No native dependencies
- ✅ MongoDB-like API
- ❌ Not as fast
- ❌ Less reliable for large datasets
- ❌ No full-text search
- ❌ Maintenance concerns

---

## Decision Outcome

**Chosen option:** SQLite with better-sqlite3

### Rationale

1. **Performance:** Fastest SQLite binding, synchronous operations perfect for Electron main process
2. **Reliability:** SQLite is the most deployed database in the world
3. **Features:** Full SQL, indexes, FTS5, triggers, views
4. **Simplicity:** Zero configuration, single file
5. **Transactions:** Full ACID support for data integrity
6. **Portability:** Easy backup (single file), cross-platform
7. **Search:** Built-in full-text search (FTS5) for artifacts
8. **Developer Experience:** Simple synchronous API, easy to reason about

### Why better-sqlite3 over node-sqlite3?

- **2-3x faster** in most operations
- **Synchronous API** is simpler and more appropriate for Electron main process
- **Better ergonomics** with prepared statements
- **More reliable** (fewer edge cases with async)
- **Active maintenance**

---

## Trade-offs Accepted

- **Blocking Operations:** Synchronous API blocks event loop (acceptable because database operations are fast and main process isn't handling UI)
- **Native Compilation:** Requires native modules (acceptable with proper build pipeline)
- **Single Writer:** Only one writer at a time (not an issue for single-user desktop app)

---

## Positive Consequences

- Simple, synchronous database operations
- Fast queries and transactions
- Full-text search for artifacts
- Easy backup and restore (single file)
- Reliable ACID transactions
- Zero configuration
- Excellent debugging (standard SQL)

---

## Negative Consequences

- Synchronous operations could block if queries are slow (mitigate with proper indexing)
- Native module compilation adds build complexity (acceptable with electron-builder)
- Single file could grow large (mitigate with vacuuming and archiving)

---

## Mitigation Strategies

### For Performance:
- Proper indexing on frequently queried columns
- WAL mode for better concurrency
- Prepared statements for repeated queries
- Pagination for large result sets

### For Build:
- electron-builder handles native modules
- Pre-built binaries for common platforms
- Fallback to electron-rebuild if needed

### For Scalability:
- Auto-vacuum for space management
- Archive old journeys (optional)
- Compress artifacts content
- Limit result set sizes

---

## Database Schema Design

```sql
-- Relational model
journeys (1) → (∞) stages (1) → (∞) artifacts

-- Indexes for performance
CREATE INDEX idx_stages_journey ON stages(journey_id);
CREATE INDEX idx_artifacts_stage ON artifacts(stage_id);

-- Full-text search
CREATE VIRTUAL TABLE artifacts_fts USING fts5(title, content);

-- Triggers for FTS sync
CREATE TRIGGER artifacts_ai AFTER INSERT ON artifacts ...
```

---

## Implementation Pattern

```typescript
// Type-safe database service
export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initializeSchema();
  }

  // Type-safe operations
  journey = {
    create: (input: CreateJourneyInput): Journey => { ... },
    findById: (id: string): Journey | null => { ... },
    findAll: (options: FindOptions): Journey[] => { ... },
  };

  // Transactions
  transaction<T>(callback: () => T): T {
    return this.db.transaction(callback)();
  }
}
```

---

## Related Decisions

- ADR 001: Electron Framework
- ADR 004: Vite Build Tool

---

## References

- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [SQLite FTS5](https://www.sqlite.org/fts5.html)
- [SQLite Performance](https://www.sqlite.org/performance.html)
