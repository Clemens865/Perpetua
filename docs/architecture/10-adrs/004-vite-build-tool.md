# ADR 004: Use Vite as Build Tool

**Status:** Accepted
**Date:** 2025-10-22
**Deciders:** System Architect
**Context:** Perpetua Architecture Design

---

## Context and Problem Statement

Perpetua needs a build tool that can:
- Bundle Electron main process (Node.js)
- Bundle renderer process (React + TypeScript)
- Bundle preload scripts
- Provide fast Hot Module Replacement (HMR)
- Support TypeScript out of the box
- Handle modern JavaScript features
- Optimize production builds

**Decision:** Which build tool should we use?

---

## Decision Drivers

- **Development Speed:** Fast HMR, instant server start
- **TypeScript Support:** First-class TypeScript handling
- **Modern Features:** ESM, dynamic imports, code splitting
- **Production Optimization:** Tree shaking, minification
- **Configuration:** Simple, minimal configuration
- **Electron Compatibility:** Works well with Electron's multi-process architecture

---

## Considered Options

### Option 1: Vite
- ✅ Lightning-fast HMR (< 100ms)
- ✅ Instant server start
- ✅ First-class TypeScript support
- ✅ Minimal configuration
- ✅ Modern by default (ESM)
- ✅ Great developer experience
- ✅ Excellent plugin ecosystem
- ❌ Relatively new (2020)
- ❌ Some Electron plugins less mature

### Option 2: Webpack
- ✅ Mature, battle-tested
- ✅ Huge ecosystem
- ✅ Extensive Electron support
- ✅ Highly configurable
- ❌ Slow HMR (1-5 seconds)
- ❌ Slow cold start
- ❌ Complex configuration
- ❌ Aging architecture

### Option 3: esbuild
- ✅ Extremely fast (Go-based)
- ✅ Simple API
- ✅ TypeScript out of the box
- ❌ Limited features (no HMR)
- ❌ No code splitting (experimental)
- ❌ Minimal plugin ecosystem
- ❌ Not a complete build system

### Option 4: Rollup
- ✅ Excellent tree shaking
- ✅ Clean output
- ✅ Good for libraries
- ❌ No HMR built-in
- ❌ Slower than Vite
- ❌ More configuration needed
- ❌ Less suitable for dev server

### Option 5: electron-vite
- ✅ Vite wrapper for Electron
- ✅ Pre-configured for Electron
- ✅ Good developer experience
- ❌ Extra abstraction layer
- ❌ Less flexible
- ❌ Can achieve same with vanilla Vite

---

## Decision Outcome

**Chosen option:** Vite (vanilla, with custom configs)

### Rationale

1. **Development Speed:** Sub-100ms HMR makes development delightful
2. **Modern Architecture:** ESM-first, leverages browser native ES modules in dev
3. **TypeScript:** Zero-config TypeScript support with esbuild
4. **Simplicity:** Minimal configuration, sensible defaults
5. **Production Optimization:** Rollup-based production builds with excellent tree shaking
6. **Developer Experience:** Best-in-class DX, fast iteration
7. **Ecosystem:** Growing plugin ecosystem, active community
8. **Future-Proof:** Modern architecture aligned with web standards

### Configuration Strategy

**Three separate Vite configs:**
1. `vite.main.config.ts` - Main process (Node.js target)
2. `vite.renderer.config.ts` - Renderer process (Browser target)
3. `vite.preload.config.ts` - Preload scripts (Hybrid target)

This provides:
- Clear separation of concerns
- Optimal settings per process
- Easy to understand and maintain

---

## Trade-offs Accepted

- **Maturity:** Vite is newer than Webpack (mitigated by rapid adoption and stability)
- **Electron Plugins:** Some Electron-specific plugins less mature (acceptable, can build custom solutions)
- **Learning:** Team needs to learn Vite (minimal learning curve, pays off quickly)

---

## Positive Consequences

- **Fast Development:** Near-instant HMR, sub-second builds
- **Great DX:** Simple configuration, excellent error messages
- **Modern Stack:** ESM, dynamic imports, code splitting work perfectly
- **TypeScript:** Zero-config TypeScript support
- **Production Builds:** Fast, optimized Rollup builds
- **Future-Proof:** Aligned with modern web standards

---

## Negative Consequences

- **Less Electron Examples:** Fewer Electron + Vite examples than Webpack (acceptable, documentation is good)
- **Plugin Maturity:** Some niche plugins less mature (can build custom solutions)

---

## Implementation Pattern

### Main Process Config

```typescript
// vite.main.config.ts
export default defineConfig({
  build: {
    target: 'node18',
    outDir: 'dist/main',
    lib: {
      entry: 'src/main/index.ts',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['electron', ...builtinModules],
    },
  },
});
```

### Renderer Process Config

```typescript
// vite.renderer.config.ts
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    target: 'chrome118',
  },
  server: {
    port: 5173,
  },
});
```

### Development Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:main\" \"npm run dev:renderer\"",
    "dev:main": "vite build --config vite.main.config.ts --watch",
    "dev:renderer": "vite --config vite.renderer.config.ts",
    "build": "npm run build:main && npm run build:renderer"
  }
}
```

---

## Migration Path

### From Webpack:
1. Replace webpack configs with Vite configs
2. Update imports (CJS → ESM where possible)
3. Adjust path aliases
4. Update scripts in package.json
5. Test all processes

### Benefits Realized:
- **Dev server start:** 10s → 0.5s
- **HMR:** 3-5s → 50-100ms
- **Production build:** 2min → 30s

---

## Performance Targets

- **Dev server start:** < 1 second
- **HMR update:** < 100ms
- **Production build:** < 60 seconds
- **Build artifact size:** < 50MB (compressed)

---

## Related Decisions

- ADR 001: Electron Framework
- ADR 003: TypeScript Configuration

---

## References

- [Vite Documentation](https://vitejs.dev/)
- [Vite for Electron](https://vitejs.dev/guide/backend-integration.html)
- [Why Vite](https://vitejs.dev/guide/why.html)
- [Vite vs Webpack](https://blog.logrocket.com/vite-vs-webpack/)
