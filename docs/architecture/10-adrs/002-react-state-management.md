# ADR 002: Use Zustand for State Management

**Status:** Accepted
**Date:** 2025-10-22
**Deciders:** System Architect
**Context:** Perpetua Architecture Design

---

## Context and Problem Statement

Perpetua needs a state management solution that:
- Handles complex journey state (stages, artifacts)
- Manages UI state (sidebar, modals, theme)
- Integrates with IPC communication
- Provides good TypeScript support
- Is performant and easy to debug

**Decision:** Which state management library should we use?

---

## Decision Drivers

- **Simplicity:** Easy to learn and use
- **TypeScript Support:** First-class types
- **Performance:** Minimal re-renders
- **Bundle Size:** Lightweight
- **Developer Experience:** Good debugging tools
- **Flexibility:** Handles various state patterns

---

## Considered Options

### Option 1: Zustand
- ✅ Minimal boilerplate
- ✅ Excellent TypeScript support
- ✅ Small bundle size (~1KB)
- ✅ Simple API
- ✅ Good performance (selective subscriptions)
- ✅ DevTools integration
- ❌ Smaller ecosystem than Redux

### Option 2: Redux Toolkit
- ✅ Mature, battle-tested
- ✅ Excellent DevTools
- ✅ Large ecosystem
- ✅ Good TypeScript support (RTK)
- ❌ More boilerplate
- ❌ Steeper learning curve
- ❌ Larger bundle size (~10KB)
- ❌ Overkill for our use case

### Option 3: Jotai
- ✅ Atomic state management
- ✅ Very lightweight
- ✅ Good TypeScript support
- ✅ Modern API
- ❌ Newer (less mature)
- ❌ Different mental model
- ❌ Smaller community

### Option 4: Context + useReducer
- ✅ Built-in to React
- ✅ No dependencies
- ❌ Performance issues with large state
- ❌ Boilerplate for complex state
- ❌ No DevTools
- ❌ Difficult to optimize

### Option 5: MobX
- ✅ Minimal boilerplate
- ✅ Good TypeScript support
- ✅ Automatic tracking
- ❌ Magic/implicit behavior
- ❌ Larger bundle size
- ❌ Decorators syntax (declining)

---

## Decision Outcome

**Chosen option:** Zustand

### Rationale

1. **Simplicity:** Minimal API, easy to understand
2. **TypeScript:** Excellent type inference and support
3. **Performance:** Selective subscriptions prevent unnecessary re-renders
4. **Bundle Size:** Only ~1KB, perfect for Electron app
5. **Flexibility:** Works for both global and local state
6. **DevTools:** Redux DevTools integration for debugging
7. **Learning Curve:** Minimal - team can be productive immediately

### Store Structure

```typescript
// Journey Store
interface JourneyStore {
  currentJourney: Journey | null;
  journeys: Journey[];
  setCurrentJourney: (journey: Journey) => void;
  addStage: (stage: Stage) => void;
  updateStage: (id: string, updates: Partial<Stage>) => void;
}

// UI Store
interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  activeModal: string | null;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
}

// Settings Store
interface SettingsStore {
  apiKey: string;
  preferences: UserPreferences;
  setApiKey: (key: string) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}
```

---

## Positive Consequences

- Fast development with minimal boilerplate
- Excellent TypeScript developer experience
- Easy to test stores in isolation
- Good performance with selective subscriptions
- Small bundle impact
- Easy to integrate with IPC

---

## Negative Consequences

- Smaller ecosystem than Redux (acceptable trade-off)
- Less opinionated (need to establish patterns)
- Fewer third-party integrations

---

## Implementation Pattern

```typescript
// src/renderer/stores/journey.store.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Journey, Stage } from '@types';

interface JourneyStore {
  currentJourney: Journey | null;
  journeys: Journey[];

  // Actions
  setCurrentJourney: (journey: Journey) => void;
  addJourney: (journey: Journey) => void;
  addStage: (stage: Stage) => void;
  updateStage: (id: string, updates: Partial<Stage>) => void;
}

export const useJourneyStore = create<JourneyStore>()(
  devtools(
    (set, get) => ({
      currentJourney: null,
      journeys: [],

      setCurrentJourney: (journey) => set({ currentJourney: journey }),

      addJourney: (journey) =>
        set((state) => ({
          journeys: [journey, ...state.journeys],
        })),

      addStage: (stage) =>
        set((state) => {
          if (!state.currentJourney) return state;

          return {
            currentJourney: {
              ...state.currentJourney,
              stages: [...state.currentJourney.stages, stage],
            },
          };
        }),

      updateStage: (id, updates) =>
        set((state) => {
          if (!state.currentJourney) return state;

          return {
            currentJourney: {
              ...state.currentJourney,
              stages: state.currentJourney.stages.map((stage) =>
                stage.id === id ? { ...stage, ...updates } : stage
              ),
            },
          };
        }),
    }),
    { name: 'journey-store' }
  )
);
```

---

## Supplementary Tools

- **Jotai:** For atomic, local state when needed
- **React Query:** For server state (IPC queries)
- **Context:** For theme and i18n (stable, rarely changing)

---

## Related Decisions

- ADR 003: SQLite for Local Storage
- ADR 005: React Query for IPC State

---

## References

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Zustand vs Redux](https://blog.logrocket.com/zustand-vs-redux/)
- [State Management Comparison](https://leerob.io/blog/react-state-management)
