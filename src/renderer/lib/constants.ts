/**
 * Application constants
 */

import type { StageType } from '@/types';

/**
 * Stage metadata
 */
export const STAGE_META: Record<
  StageType,
  {
    icon: string;
    color: string;
    description: string;
  }
> = {
  discovering: {
    icon: 'Search',
    color: '#2E96FF',
    description: 'Research and explore the topic',
  },
  chasing: {
    icon: 'Target',
    color: '#8B5CF6',
    description: 'Identify deeper problems to pursue',
  },
  solving: {
    icon: 'Lightbulb',
    color: '#22C55E',
    description: 'Generate solutions and approaches',
  },
  challenging: {
    icon: 'AlertCircle',
    color: '#EF4444',
    description: 'Question assumptions and solutions',
  },
  questioning: {
    icon: 'HelpCircle',
    color: '#F59E0B',
    description: 'Ask probing questions',
  },
  searching: {
    icon: 'Globe',
    color: '#06B6D4',
    description: 'Conduct deep research',
  },
  imagining: {
    icon: 'Sparkles',
    color: '#EC4899',
    description: 'Think creatively and explore possibilities',
  },
  building: {
    icon: 'Hammer',
    color: '#6366F1',
    description: 'Create tangible artifacts',
  },
};

/**
 * Application routes
 */
export const ROUTES = {
  HOME: '/',
  JOURNEY: '/journey/:id',
  SETTINGS: '/settings',
  HISTORY: '/history',
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  API_KEY: 'perpetua_api_key',
  SETTINGS: 'perpetua_settings',
  RECENT_JOURNEYS: 'perpetua_recent_journeys',
} as const;

/**
 * Animation durations (ms)
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
} as const;

/**
 * Z-index layers
 */
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 1000,
  STICKY: 1100,
  FIXED: 1200,
  MODAL_BACKDROP: 1300,
  MODAL: 1400,
  POPOVER: 1500,
  TOOLTIP: 1600,
} as const;

/**
 * Keyboard shortcuts
 */
export const SHORTCUTS = {
  NEW_JOURNEY: 'mod+n',
  PAUSE_JOURNEY: 'mod+p',
  STOP_JOURNEY: 'mod+s',
  TOGGLE_SIDEBAR: 'mod+b',
  SEARCH: 'mod+k',
} as const;
