/**
 * Global application state using Zustand
 * Manages journeys, UI state, and settings
 */

import { create } from 'zustand';
import type { AppState, Journey, Artifact, JourneySettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

export const useAppStore = create<AppState>((set) => ({
  // State
  currentJourney: null,
  journeys: [],
  activeStage: null,
  sidebarOpen: true,
  selectedArtifact: null,
  settings: DEFAULT_SETTINGS,

  // Actions
  setCurrentJourney: (journey) =>
    set({
      currentJourney: journey,
    }),

  addJourney: (journey) =>
    set((state) => ({
      journeys: [journey, ...state.journeys],
      currentJourney: journey,
    })),

  updateJourney: (id, updates) =>
    set((state) => {
      const updatedJourneys = state.journeys.map((j) => (j.id === id ? { ...j, ...updates } : j));

      return {
        journeys: updatedJourneys,
        currentJourney:
          state.currentJourney?.id === id
            ? { ...state.currentJourney, ...updates }
            : state.currentJourney,
      };
    }),

  removeJourney: (id) =>
    set((state) => ({
      journeys: state.journeys.filter((j) => j.id !== id),
      currentJourney: state.currentJourney?.id === id ? null : state.currentJourney,
    })),

  setActiveStage: (stage) =>
    set({
      activeStage: stage,
    }),

  updateActiveStage: (updates) =>
    set((state) => ({
      activeStage: state.activeStage ? { ...state.activeStage, ...updates } : null,
    })),

  setSidebarOpen: (open) =>
    set({
      sidebarOpen: open,
    }),

  setSelectedArtifact: (artifact) =>
    set({
      selectedArtifact: artifact,
    }),

  updateSettings: (settings) =>
    set((state) => ({
      settings: { ...state.settings, ...settings },
    })),
}));

// Selectors for optimized re-renders
export const selectCurrentJourney = (state: AppState) => state.currentJourney;
export const selectJourneys = (state: AppState) => state.journeys;
export const selectSidebarOpen = (state: AppState) => state.sidebarOpen;
export const selectSelectedArtifact = (state: AppState) => state.selectedArtifact;
export const selectSettings = (state: AppState) => state.settings;
