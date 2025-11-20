/**
 * Design Language System - Type Definitions
 *
 * Comprehensive type system for generating unique, world-class designs
 * for websites, presentations, timelines, and mindmaps.
 */

export type DesignStyle =
  | 'Neubrutalism'
  | 'Glassmorphism'
  | 'Organic Modernism'
  | 'Maximalist Typography'
  | 'Dark Mode First'
  | '3D Elements & Depth'
  | 'Gradient Explosion'
  | 'Minimal Monochrome'
  | 'Retro Vaporwave'
  | 'Kinetic Typography'
  | 'Futuristic Cyber';

export type LayoutSystem =
  | 'Magazine Editorial'
  | 'Bento Box Grid'
  | 'Scrollytelling'
  | 'Split Screen Duotone'
  | 'Horizontal Timeline'
  | 'Vertical Cascade'
  | 'Card Masonry'
  | 'Full-bleed Sections';

export type TimelineLayout =
  | 'Horizontal Scrolling'
  | 'Vertical Scrollytelling'
  | 'Spiral Timeline'
  | 'Branching Paths'
  | 'Zigzag Alternating'
  | 'Gantt-style Bars';

export type MindmapLayout =
  | 'Radial Sunburst'
  | 'Force-Directed Graph'
  | 'Tree Layout'
  | 'Organic Clusters'
  | 'Geometric Grid'
  | '3D Perspective Layers';

export type SlideDesignSystem =
  | 'Minimal High-Contrast'
  | 'Visual Storytelling'
  | 'Data-Focused'
  | 'Bold Typography'
  | 'Image-Heavy'
  | 'Elegant Minimal';

export type InteractionPattern =
  | 'Hover Scale & Shadow'
  | 'Scroll-triggered Fade-in'
  | 'Parallax Layering'
  | 'Click Ripple Effect'
  | 'Smooth Scroll Navigation'
  | 'Expand/Collapse Sections'
  | 'Modal Overlays'
  | 'Custom Cursor Effects';

export interface GradientSpec {
  name: string;
  angle: number;
  stops: Array<{
    color: string;
    position: number;
  }>;
}

export interface TypographyChoice {
  family: string;
  weight: string;
  style?: string;
}

export interface TypographyPairing {
  heading: TypographyChoice;
  body: TypographyChoice;
  style: string;
  description: string;
}

export interface ColorPalette {
  primary: string[];
  accent: string[];
  neutral: string[];
  gradients?: GradientSpec[];
}

export interface SectionVariation {
  section: string;
  layout: 'left-heavy' | 'right-heavy' | 'centered' | 'split' | 'full-bleed';
  customization: {
    imagePosition: 'left' | 'right' | 'top' | 'bottom' | 'background';
    textColumns: 1 | 2 | 3;
    hasBackground: boolean;
    isFullWidth: boolean;
  };
}

export interface DesignLanguage {
  // Visual Style
  visualStyle: {
    primary: DesignStyle;
    secondary?: DesignStyle;
    intensity: 'subtle' | 'moderate' | 'bold';
  };

  // Color System
  colorSystem: {
    mode: 'light' | 'dark' | 'auto';
    palette: ColorPalette;
    contrast: 'low' | 'medium' | 'high';
  };

  // Typography System
  typography: {
    pairing: TypographyPairing;
    scale: 'compact' | 'standard' | 'spacious';
    hierarchy: {
      h1: string;
      h2: string;
      h3: string;
      body: string;
      caption: string;
    };
  };

  // Layout System
  layout: {
    system: LayoutSystem;
    approach: 'symmetric' | 'asymmetric' | 'fluid';
    spacing: 'tight' | 'balanced' | 'generous';
    sections?: SectionVariation[];
  };

  // Template-Specific Layouts
  templateLayout?: {
    timeline?: TimelineLayout;
    mindmap?: MindmapLayout;
    slideDesign?: SlideDesignSystem;
  };

  // Interaction & Animation
  interactions: {
    style: 'minimal' | 'playful' | 'sophisticated';
    patterns: InteractionPattern[];
    transitions: {
      speed: 'instant' | 'snappy' | 'smooth' | 'slow';
      easing: string;
    };
  };

  // Uniqueness
  uniqueness: {
    seed: string;
    experimental: boolean;
    constraints: string[];
  };
}

export interface DesignStyleDefinition {
  name: DesignStyle;
  description: string;
  characteristics: string[];
  cssFeatures: string[];
  bestFor: string[];
  avoid: string[];
  codeExample?: string;
}

export interface LayoutSystemDefinition {
  name: LayoutSystem;
  description: string;
  structure: string;
  cssImplementation: string;
  bestFor: string[];
  interactionPatterns: string[];
}

export type ContentType = 'research' | 'process' | 'comparison' | 'temporal' | 'conceptual';
