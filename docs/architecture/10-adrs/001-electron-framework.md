# ADR 001: Choose Electron as Desktop Framework

**Status:** Accepted
**Date:** 2025-10-22
**Deciders:** System Architect
**Context:** Perpetua Architecture Design

---

## Context and Problem Statement

Perpetua needs a desktop application framework that can deliver a rich, native-feeling experience while maintaining a single codebase and leveraging modern web technologies. The application requires:
- Native OS integration
- File system access
- Local database (SQLite)
- Claude API integration
- Rich UI with Scandinavian design principles
- Cross-platform support (macOS, Windows, Linux)

**Decision:** Which desktop framework should we use?

---

## Decision Drivers

- **Developer Experience:** Familiar web technologies (React, TypeScript)
- **Performance:** Fast startup, smooth animations
- **Native Integration:** OS-level features (notifications, menus, file system)
- **Security:** Sandboxing and security boundaries
- **Maintainability:** Active community, good documentation
- **Distribution:** Easy packaging and updates
- **Cross-Platform:** Works on all major operating systems

---

## Considered Options

### Option 1: Electron
- ✅ Mature, battle-tested framework
- ✅ Excellent native OS integration
- ✅ Large ecosystem and community
- ✅ TypeScript first-class support
- ✅ Easy distribution (electron-builder)
- ❌ Larger bundle size (~120-200MB)
- ❌ Higher memory usage

### Option 2: Tauri
- ✅ Smaller bundle size (~10-20MB)
- ✅ Lower memory usage
- ✅ Rust backend (performance)
- ❌ Smaller ecosystem
- ❌ Less mature (v1 released 2022)
- ❌ Rust knowledge required for backend
- ❌ Fewer native modules available

### Option 3: NW.js
- ✅ Similar to Electron
- ✅ Good performance
- ❌ Smaller community
- ❌ Less popular, fewer resources
- ❌ Electron has better tooling

### Option 4: Progressive Web App (PWA)
- ✅ No installation
- ✅ Cross-platform by default
- ❌ Limited native integration
- ❌ No direct file system access
- ❌ Requires server infrastructure
- ❌ Limited offline capabilities

---

## Decision Outcome

**Chosen option:** Electron

### Rationale

1. **Mature Ecosystem:** Electron powers VS Code, Slack, Discord, Figma - proven at scale
2. **Developer Experience:** Best-in-class tooling, debugging, and development workflow
3. **Native Integration:** Excellent OS integration for menus, notifications, system tray
4. **Security:** Context isolation and sandboxing for renderer process
5. **Distribution:** electron-builder provides seamless packaging and auto-updates
6. **Community:** Massive community, extensive documentation, many solved problems
7. **TypeScript Support:** First-class TypeScript support throughout
8. **Time to Market:** Faster development with familiar web technologies

### Trade-offs Accepted

- **Bundle Size:** Accepting ~150MB bundle size for better DX and ecosystem
- **Memory Usage:** Modern machines have sufficient RAM; UX quality is priority
- **Performance:** Electron's V8 engine is highly optimized; acceptable for our use case

---

## Positive Consequences

- Fast development with React + TypeScript
- Excellent debugging experience with Chrome DevTools
- Easy integration with Claude SDK (Node.js)
- Straightforward SQLite integration (better-sqlite3)
- Cross-platform by default
- Easy packaging and distribution

---

## Negative Consequences

- Larger download size (mitigated by good UX and fast loading)
- Higher memory usage (acceptable for modern machines)
- Potential for security issues if not properly configured (mitigated by following best practices)

---

## Mitigation Strategies

### For Bundle Size:
- Code splitting and lazy loading
- Tree shaking with Vite
- Optimize assets (images, fonts)
- ASAR packaging

### For Memory Usage:
- Efficient React rendering (memo, useMemo, useCallback)
- Virtual scrolling for long lists
- Proper cleanup of event listeners
- Database connection pooling

### For Security:
- Context isolation enabled
- Node integration disabled in renderer
- Content Security Policy
- Input validation on IPC boundaries

---

## Related Decisions

- ADR 002: React State Management
- ADR 003: SQLite for Local Storage
- ADR 004: Vite as Build Tool

---

## References

- [Electron Documentation](https://www.electronjs.org/)
- [Electron Security Guidelines](https://www.electronjs.org/docs/latest/tutorial/security)
- [VS Code Architecture](https://github.com/microsoft/vscode)
- [Electron vs Tauri Comparison](https://tauri.app/blog/2022/02/16/tauri-vs-electron/)
