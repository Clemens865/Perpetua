/**
 * Design Language Generator
 *
 * Core logic for generating unique, world-class design languages
 * for each page generation.
 */

import type {
  DesignLanguage,
  DesignStyle,
  LayoutSystem,
  TimelineLayout,
  MindmapLayout,
  SlideDesignSystem,
  InteractionPattern,
  GradientSpec,
  ColorPalette,
  SectionVariation,
  ContentType,
} from '../types/design-language';
import type { JourneyAnalysis } from '../types/journey';
import { seededRandom, randomChoice, randomSample, randomInt, generateSeed } from './seeded-random';
import { DESIGN_STYLES, TYPOGRAPHY_PAIRINGS, getCompatibleTypography, getStyleDescription, getLayoutSystemInstructions } from './design-style-library';

/**
 * Technical constraints that must be respected
 */
const TECHNICAL_CONSTRAINTS = [
  'Vanilla JavaScript only (no external libraries)',
  'No external CDN links (Content Security Policy)',
  'Self-contained HTML file',
  'Works offline without internet',
  'PDF export ready (presentations)',
  '⚠️ CRITICAL: SVG/CSS icons ONLY - NEVER use emoji or Unicode symbols for any visual elements',
  '⚠️ CRITICAL: WCAG AA contrast - minimum 4.5:1 for normal text, 3:1 for large text',
  '⚠️ CRITICAL: All JavaScript functions MUST be defined before use - no undefined references',
  '⚠️ CRITICAL: Generate COMPLETE HTML - all sections, all content, no partial generations',
  '⚠️ CRITICAL: All onclick/onhover handlers must reference defined functions',
  'Font sizes must be readable (minimum 16px for body text)',
  'Avoid extreme color combinations that reduce legibility',
  'Ensure all interactive elements have clear visual affordances',
];

/**
 * Classify journey content type based on analysis
 */
function classifyContent(analysis: JourneyAnalysis): ContentType {
  // Use narrative arc beginning and key themes for classification
  const question = (analysis.narrativeArc?.beginning || '').toLowerCase();
  const themes = (analysis.keyThemes || []).map(t => t.toLowerCase()).join(' ');
  const combined = `${question} ${themes}`;

  // Temporal keywords
  if (/\b(history|timeline|evolution|development|progress|over time|chronology|sequence)\b/i.test(combined)) {
    return 'temporal';
  }

  // Comparison keywords
  if (/\b(vs|versus|compare|comparison|difference|between|alternative|choose)\b/i.test(combined)) {
    return 'comparison';
  }

  // Process keywords
  if (/\b(how to|process|steps|guide|method|approach|system|workflow|procedure)\b/i.test(combined)) {
    return 'process';
  }

  // Conceptual keywords
  if (/\b(what is|concept|theory|idea|philosophy|principle|framework|model)\b/i.test(combined)) {
    return 'conceptual';
  }

  // Default to research
  return 'research';
}

/**
 * Get appropriate design styles for content type
 */
function getStylesForContentType(contentType: ContentType): DesignStyle[] {
  const stylesByContentType: Record<ContentType, DesignStyle[]> = {
    research: ['Glassmorphism', 'Minimal Monochrome', 'Organic Modernism', 'Dark Mode First', 'Futuristic Cyber'],
    process: ['Neubrutalism', '3D Elements & Depth', 'Maximalist Typography', 'Gradient Explosion', 'Futuristic Cyber'],
    comparison: ['Split Screen Duotone', 'Neubrutalism', 'Minimal Monochrome', 'Dark Mode First'],
    temporal: ['Gradient Explosion', 'Retro Vaporwave', '3D Elements & Depth', 'Organic Modernism'],
    conceptual: ['Kinetic Typography', 'Maximalist Typography', 'Glassmorphism', 'Organic Modernism', 'Futuristic Cyber'],
  };

  return stylesByContentType[contentType] || Object.keys(DESIGN_STYLES) as DesignStyle[];
}

/**
 * Get appropriate layout systems for template type
 */
function getLayoutSystemsForTemplate(templateType: string, contentType: ContentType): LayoutSystem[] {
  if (templateType === 'presentation') {
    return ['Full-bleed Sections']; // Presentations always use full-bleed
  }

  const layoutsByContentType: Record<ContentType, LayoutSystem[]> = {
    research: ['Magazine Editorial', 'Vertical Cascade', 'Card Masonry'],
    process: ['Scrollytelling', 'Vertical Cascade', 'Bento Box Grid'],
    comparison: ['Split Screen Duotone', 'Bento Box Grid', 'Card Masonry'],
    temporal: ['Horizontal Timeline', 'Scrollytelling', 'Vertical Cascade'],
    conceptual: ['Magazine Editorial', 'Bento Box Grid', 'Full-bleed Sections'],
  };

  return layoutsByContentType[contentType] || ['Magazine Editorial', 'Bento Box Grid', 'Vertical Cascade'];
}

/**
 * Generate custom color palette based on themes and style
 */
function generateColorPalette(
  analysis: JourneyAnalysis,
  visualStyle: DesignStyle,
  random: () => number
): ColorPalette {
  // Base palettes for each style
  const stylePalettes: Record<DesignStyle, ColorPalette> = {
    'Neubrutalism': {
      primary: ['#000000', '#FF6B6B', '#4ECDC4'],
      accent: ['#FFE66D', '#FF0000'],
      neutral: ['#FFFFFF', '#F0F0F0', '#CCCCCC'],
    },
    'Glassmorphism': {
      primary: ['#667eea', '#764ba2', '#F093FB'],
      accent: ['#C471F5', '#FA71CD'],
      neutral: ['#FFFFFF', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.3)'],
    },
    'Organic Modernism': {
      primary: ['#2D6A4F', '#52B788', '#95D5B2'],
      accent: ['#FFB703', '#FB8500'],
      neutral: ['#FFFFFF', '#F8F9FA', '#E9ECEF'],
    },
    'Maximalist Typography': {
      primary: ['#1A1A1A', '#FF0000', '#0000FF'],
      accent: ['#FFFF00', '#00FF00'],
      neutral: ['#FFFFFF', '#CCCCCC', '#666666'],
    },
    'Dark Mode First': {
      primary: ['#0a0a0a', '#1a1a1a', '#2a2a2a'],
      accent: ['#00ff88', '#ff0080'],
      neutral: ['#f0f0f0', '#c0c0c0', '#808080'],
    },
    '3D Elements & Depth': {
      primary: ['#2563eb', '#3b82f6', '#60a5fa'],
      accent: ['#f59e0b', '#ef4444'],
      neutral: ['#f9fafb', '#f3f4f6', '#e5e7eb'],
    },
    'Gradient Explosion': {
      primary: ['#667eea', '#764ba2', '#f093fb'],
      accent: ['#4facfe', '#00f2fe'],
      neutral: ['#ffffff', '#f8f9fa', '#e9ecef'],
    },
    'Minimal Monochrome': {
      primary: ['#000000', '#1a1a1a', '#333333'],
      accent: ['#0066cc'],
      neutral: ['#ffffff', '#f5f5f5', '#e0e0e0'],
    },
    'Retro Vaporwave': {
      primary: ['#FF00FF', '#00FFFF', '#FF1493'],
      accent: ['#FFD700', '#00FF00'],
      neutral: ['#1a0033', '#4a0066', '#7a0099'],
    },
    'Kinetic Typography': {
      primary: ['#0f0f0f', '#FF3366', '#00CCFF'],
      accent: ['#FFCC00', '#33FF99'],
      neutral: ['#ffffff', '#e0e0e0', '#c0c0c0'],
    },
    'Futuristic Cyber': {
      primary: ['#000000', '#0A0A0A', '#1A1A1A'], // Deep blacks for background
      accent: ['#FFD700', '#C0C0C0', '#00FFFF'], // Gold, silver, cyan LED
      neutral: ['#E8E8E8', '#D0D0D0', '#B8B8B8'], // Chrome/silver tones
    },
  };

  const basePalette = stylePalettes[visualStyle];

  // Generate custom gradients
  const gradients: GradientSpec[] = [
    {
      name: 'primary-gradient',
      angle: 45 + randomInt(random, 0, 90),
      stops: [
        { color: basePalette.primary[0], position: 0 },
        { color: basePalette.primary[1] || basePalette.accent[0], position: 100 },
      ],
    },
    {
      name: 'accent-gradient',
      angle: 135 + randomInt(random, 0, 90),
      stops: [
        { color: basePalette.accent[0], position: 0 },
        { color: basePalette.primary[1] || basePalette.primary[0], position: 50 },
        { color: basePalette.accent[1] || basePalette.accent[0], position: 100 },
      ],
    },
  ];

  return {
    ...basePalette,
    gradients,
  };
}

/**
 * Generate section variations for layout system
 */
function generateSectionVariations(
  sections: string[],
  layoutSystem: LayoutSystem,
  random: () => number
): SectionVariation[] {
  const layoutOptions: Array<SectionVariation['layout']> = ['left-heavy', 'right-heavy', 'centered', 'split', 'full-bleed'];
  const imagePositions: Array<SectionVariation['customization']['imagePosition']> = ['left', 'right', 'top', 'bottom', 'background'];

  return sections.map((section, i) => ({
    section,
    layout: layoutOptions[i % layoutOptions.length],
    customization: {
      imagePosition: randomChoice(random, imagePositions),
      textColumns: (random() > 0.7 ? 2 : 1) as 1 | 2,
      hasBackground: random() > 0.6,
      isFullWidth: random() > 0.4,
    },
  }));
}

/**
 * Select interaction patterns based on style and template
 */
function selectInteractionPatterns(
  visualStyle: DesignStyle,
  templateType: string,
  random: () => number
): InteractionPattern[] {
  const allPatterns: InteractionPattern[] = [
    'Hover Scale & Shadow',
    'Scroll-triggered Fade-in',
    'Parallax Layering',
    'Click Ripple Effect',
    'Smooth Scroll Navigation',
    'Expand/Collapse Sections',
    'Modal Overlays',
    'Custom Cursor Effects',
  ];

  // Style-specific pattern preferences
  const stylePatterns: Partial<Record<DesignStyle, InteractionPattern[]>> = {
    'Neubrutalism': ['Hover Scale & Shadow', 'Click Ripple Effect'],
    'Glassmorphism': ['Parallax Layering', 'Scroll-triggered Fade-in', 'Modal Overlays'],
    'Kinetic Typography': ['Custom Cursor Effects', 'Scroll-triggered Fade-in'],
    '3D Elements & Depth': ['Parallax Layering', 'Hover Scale & Shadow'],
  };

  const preferred = stylePatterns[visualStyle] || [];
  const others = allPatterns.filter(p => !preferred.includes(p));

  // Select 4-6 patterns: prefer style-specific, then random from others
  const numPatterns = randomInt(random, 4, 7);
  const selected = [...preferred, ...randomSample(random, others, numPatterns - preferred.length)];

  return selected.slice(0, numPatterns);
}

/**
 * Select timeline layout based on content
 */
function selectTimelineLayout(contentType: ContentType, random: () => number): TimelineLayout {
  const layoutsByType: Record<ContentType, TimelineLayout[]> = {
    temporal: ['Horizontal Scrolling', 'Vertical Scrollytelling', 'Spiral Timeline'],
    process: ['Horizontal Scrolling', 'Zigzag Alternating', 'Gantt-style Bars'],
    research: ['Vertical Scrollytelling', 'Horizontal Scrolling'],
    comparison: ['Horizontal Scrolling', 'Branching Paths'],
    conceptual: ['Spiral Timeline', 'Branching Paths', 'Vertical Scrollytelling'],
  };

  const options = layoutsByType[contentType] || ['Horizontal Scrolling', 'Vertical Scrollytelling'];
  return randomChoice(random, options);
}

/**
 * Select mindmap layout based on content
 */
function selectMindmapLayout(contentType: ContentType, random: () => number): MindmapLayout {
  const layoutsByType: Record<ContentType, MindmapLayout[]> = {
    conceptual: ['Radial Sunburst', 'Organic Clusters', '3D Perspective Layers'],
    research: ['Tree Layout', 'Force-Directed Graph', 'Radial Sunburst'],
    process: ['Tree Layout', 'Geometric Grid'],
    comparison: ['Force-Directed Graph', 'Geometric Grid'],
    temporal: ['Tree Layout', 'Radial Sunburst'],
  };

  const options = layoutsByType[contentType] || ['Radial Sunburst', 'Force-Directed Graph', 'Tree Layout'];
  return randomChoice(random, options);
}

/**
 * Select slide design system
 */
function selectSlideDesign(visualStyle: DesignStyle, random: () => number): SlideDesignSystem {
  const designsByStyle: Partial<Record<DesignStyle, SlideDesignSystem[]>> = {
    'Minimal Monochrome': ['Minimal High-Contrast', 'Elegant Minimal'],
    'Maximalist Typography': ['Bold Typography'],
    'Glassmorphism': ['Visual Storytelling', 'Elegant Minimal'],
    'Neubrutalism': ['Bold Typography', 'Minimal High-Contrast'],
    'Dark Mode First': ['Minimal High-Contrast', 'Data-Focused'],
  };

  const preferred = designsByStyle[visualStyle] || ['Visual Storytelling', 'Elegant Minimal'];
  return randomChoice(random, preferred);
}

/**
 * Main function: Generate complete design language
 */
export function generateDesignLanguage(
  journeyId: string,
  analysis: JourneyAnalysis,
  templateType: string,
  timestamp?: number,
  forcedStyle?: DesignStyle
): DesignLanguage {
  // 1. Create uniqueness seed
  const seed = generateSeed(journeyId, templateType, timestamp);
  const random = seededRandom(seed);

  // 2. Classify content type
  const contentType = classifyContent(analysis);

  // 3. Select visual style with some randomness (or use forced style)
  let primaryStyle: DesignStyle;

  if (forcedStyle) {
    // Use the user-selected style
    console.log(`🎨 Using user-selected style: ${forcedStyle}`);
    primaryStyle = forcedStyle;
  } else {
    // Original random selection logic
    const stylePool = getStylesForContentType(contentType);
    const shouldUseContentType = random() > 0.3; // 70% content-appropriate, 30% random
    const allStyles = Object.keys(DESIGN_STYLES) as DesignStyle[];
    const finalPool = shouldUseContentType ? stylePool : allStyles;
    primaryStyle = randomChoice(random, finalPool);
  }

  // 4. Optional: blend with secondary style (20% chance)
  const allStyles = Object.keys(DESIGN_STYLES) as DesignStyle[];
  const secondaryStyle = random() > 0.8 ? randomChoice(random, allStyles.filter(s => s !== primaryStyle)) : undefined;

  // 5. Determine intensity
  const intensityRoll = random();
  const intensity = intensityRoll > 0.7 ? 'bold' : intensityRoll > 0.3 ? 'moderate' : 'subtle';

  // 6. Generate color system
  const colorSystem = {
    mode: (random() > 0.7 ? 'dark' : 'light') as 'light' | 'dark',
    palette: generateColorPalette(analysis, primaryStyle, random),
    contrast: (random() > 0.6 ? 'high' : random() > 0.3 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
  };

  // 7. Select layout system
  const layoutOptions = getLayoutSystemsForTemplate(templateType, contentType);
  const layoutSystem = randomChoice(random, layoutOptions);
  const approach = random() > 0.6 ? 'asymmetric' : random() > 0.3 ? 'fluid' : 'symmetric';
  const spacing = random() > 0.6 ? 'generous' : random() > 0.3 ? 'balanced' : 'tight';

  // 8. Generate section variations
  const sections = generateSectionVariations(['hero', 'overview', 'content', 'insights', 'footer'], layoutSystem, random);

  // 9. Select typography
  const compatiblePairings = getCompatibleTypography(primaryStyle);
  const typographyPairing = compatiblePairings.length > 0
    ? randomChoice(random, compatiblePairings)
    : randomChoice(random, TYPOGRAPHY_PAIRINGS);

  const scale = random() > 0.6 ? 'spacious' : random() > 0.3 ? 'standard' : 'compact';

  // Generate type hierarchy based on scale
  const baseSize = scale === 'spacious' ? 1.25 : scale === 'compact' ? 0.875 : 1;
  const typography = {
    pairing: typographyPairing,
    scale,
    hierarchy: {
      h1: `${4 * baseSize}rem ${typographyPairing.heading.weight} ${typographyPairing.heading.family}`,
      h2: `${2.5 * baseSize}rem ${typographyPairing.heading.weight} ${typographyPairing.heading.family}`,
      h3: `${1.75 * baseSize}rem 600 ${typographyPairing.heading.family}`,
      body: `${1 * baseSize}rem ${typographyPairing.body.weight} ${typographyPairing.body.family}`,
      caption: `${0.875 * baseSize}rem ${typographyPairing.body.weight} ${typographyPairing.body.family}`,
    },
  };

  // 10. Select interaction patterns
  const interactions = {
    style: (random() > 0.6 ? 'sophisticated' : random() > 0.3 ? 'playful' : 'minimal') as 'minimal' | 'playful' | 'sophisticated',
    patterns: selectInteractionPatterns(primaryStyle, templateType, random),
    transitions: {
      speed: (random() > 0.7 ? 'slow' : random() > 0.5 ? 'smooth' : random() > 0.3 ? 'snappy' : 'instant') as 'instant' | 'snappy' | 'smooth' | 'slow',
      easing: randomChoice(random, ['ease', 'ease-in-out', 'ease-out', 'cubic-bezier(0.4, 0, 0.2, 1)']),
    },
  };

  // 11. Template-specific layouts
  const templateLayout = {
    timeline: templateType === 'timeline' ? selectTimelineLayout(contentType, random) : undefined,
    mindmap: templateType === 'mindmap' ? selectMindmapLayout(contentType, random) : undefined,
    slideDesign: templateType === 'presentation' ? selectSlideDesign(primaryStyle, random) : undefined,
  };

  // 12. Experimental mode (10% chance - reduced for stability)
  const experimental = random() > 0.9;

  // Compose final design language
  return {
    visualStyle: {
      primary: primaryStyle,
      secondary: secondaryStyle,
      intensity,
    },
    colorSystem,
    typography,
    layout: {
      system: layoutSystem,
      approach,
      spacing,
      sections,
    },
    templateLayout,
    interactions,
    uniqueness: {
      seed,
      experimental,
      constraints: TECHNICAL_CONSTRAINTS,
    },
  };
}

/**
 * Generate complete design brief for Claude
 */
export function generateDesignBrief(designLanguage: DesignLanguage): string {
  const { visualStyle, colorSystem, typography, layout, templateLayout, interactions, uniqueness } = designLanguage;

  const experimentalNotice = uniqueness.experimental
    ? `
🚀 **EXPERIMENTAL MODE ENABLED**
You have creative freedom to push boundaries, BUT you MUST:
✅ **MAINTAIN**: All critical constraints (no emojis, proper contrast, complete HTML, defined functions)
✅ **ENSURE**: Functionality works perfectly - no broken JavaScript
✅ **PRIORITIZE**: Readability and usability over pure aesthetics

Experiment with:
- Unconventional but usable layouts
- Bold typography that remains readable
- Sophisticated CSS techniques (clip-path, transforms, blend modes)
- Smooth, delightful animations and transitions

❌ **NEVER SACRIFICE**: Functionality, readability, or accessibility for creativity
Goal: "This looks amazing AND works perfectly."
`
    : '';

  const secondaryStyleNote = visualStyle.secondary
    ? ` blended with **${visualStyle.secondary}**`
    : '';

  const gradientSpecs = colorSystem.palette.gradients
    ? `\n**Gradients:**
${colorSystem.palette.gradients.map(g => `- ${g.name}: ${g.angle}deg, ${g.stops.map(s => `${s.color} ${s.position}%`).join(' → ')}`).join('\n')}`
    : '';

  const templateSpecifics = [
    templateLayout?.timeline && `**Timeline Layout**: ${templateLayout.timeline}`,
    templateLayout?.mindmap && `**Mindmap Layout**: ${templateLayout.mindmap}`,
    templateLayout?.slideDesign && `**Slide Design System**: ${templateLayout.slideDesign}`,
  ].filter(Boolean).join('\n');

  return `
# 🎨 DESIGN LANGUAGE FOR THIS GENERATION

**Unique Design ID**: \`${uniqueness.seed}\`
${experimentalNotice}

---

## ⚠️ QUALITY CHECKLIST - VERIFY BEFORE DELIVERING

Before completing generation, verify ALL of these:

✅ **Functionality**:
- [ ] All JavaScript functions are defined before use
- [ ] No duplicate variable declarations
- [ ] All onclick/onhover handlers reference existing functions
- [ ] All interactive elements work correctly

✅ **Visual Quality**:
- [ ] ZERO emoji or Unicode symbols - only SVG/CSS icons
- [ ] Text contrast meets WCAG AA (4.5:1 normal, 3:1 large)
- [ ] Font sizes are readable (minimum 16px body text)
- [ ] Colors enhance rather than hinder readability

✅ **Completeness**:
- [ ] ALL sections generated (no partial content)
- [ ] HTML structure is complete and valid
- [ ] All required content included

✅ **Design System**:
- [ ] Follows the specified design language below
- [ ] Perpetua branding integrated in top-left
- [ ] Design is unique and visually compelling

**IF ANY CHECKBOX FAILS, FIX IT BEFORE COMPLETION.**

---

## Visual Style

**Primary Style**: **${visualStyle.primary}**${secondaryStyleNote}
**Intensity**: ${visualStyle.intensity}

${getStyleDescription(visualStyle.primary)}

---

## Color System

**Mode**: ${colorSystem.mode} | **Contrast**: ${colorSystem.contrast}

**Primary Colors**: ${colorSystem.palette.primary.join(', ')}
**Accent Colors**: ${colorSystem.palette.accent.join(', ')}
**Neutral Colors**: ${colorSystem.palette.neutral.join(', ')}
${gradientSpecs}

**Color Usage Instructions:**
- Use PRIMARY colors for main UI elements, backgrounds, and key sections
- Use ACCENT colors for CTAs, highlights, and interactive elements
- Use NEUTRAL colors for text, borders, and subtle backgrounds
- Create custom gradients by mixing these colors uniquely
- Maintain ${colorSystem.contrast} contrast for readability

---

## Typography System

**Pairing**: ${typography.pairing.style} (${typography.pairing.description})
**Headings**: ${typography.pairing.heading.family} (${typography.pairing.heading.weight})
**Body**: ${typography.pairing.body.family} (${typography.pairing.body.weight})
**Scale**: ${typography.scale}

**Type Hierarchy:**
- **H1**: ${typography.hierarchy.h1}
- **H2**: ${typography.hierarchy.h2}
- **H3**: ${typography.hierarchy.h3}
- **Body**: ${typography.hierarchy.body}
- **Caption**: ${typography.hierarchy.caption}

---

## Layout System

**System**: **${layout.system}**
**Approach**: ${layout.approach} | **Spacing**: ${layout.spacing}

${getLayoutSystemInstructions(layout.system)}

${layout.sections ? `
**Section Variations:**
${layout.sections.map(s => `- **${s.section}**: ${s.layout} layout, image: ${s.customization.imagePosition}, columns: ${s.customization.textColumns}${s.customization.hasBackground ? ', with background' : ''}${s.customization.isFullWidth ? ', full-width' : ''}`).join('\n')}
` : ''}

---

## Template-Specific Layout

${templateSpecifics || '*No template-specific layout for this generation*'}

---

## Interactions & Animations

**Style**: ${interactions.style}
**Transition Speed**: ${interactions.transitions.speed}
**Easing**: ${interactions.transitions.easing}

**Interaction Patterns:**
${interactions.patterns.map(p => `- ${p}`).join('\n')}

---

## 🎯 UNIQUENESS MANDATE

This design MUST be unique. Do NOT default to generic layouts or safe choices. The design brief above is your creative constraint - work within it **boldly**.

**Key Principles:**
1. Use the **${visualStyle.primary}** aesthetic authentically, not superficially
2. Implement ALL specified interaction patterns
3. Follow the color system precisely but create unique compositions
4. Make typography hierarchy clear and intentional
5. NO two generations should look the same - surprise and delight!

---

## 🚀 HEADER = WOW WITH ANIMATIONS (MANDATORY FOR ALL DESIGNS)

**Critical Design Philosophy - NON-NEGOTIABLE:**

**⚠️ EVERY DESIGN MUST HAVE AN ANIMATED WOW HEADER - NO EXCEPTIONS:**

**The Header is the WOW Effect (WITH ANIMATIONS):**
- The header/hero section MUST be STUNNING with smooth, topic-appropriate animations
- **🎬 ANIMATIONS ARE REQUIRED** - Headers without animations are incomplete
- Showcase the **${visualStyle.primary}** aesthetic at full strength WITH motion

**🎬 MANDATORY CSS ANIMATION PATTERNS (COPY AND ADAPT THESE):**

\`\`\`css
/* REQUIRED: Include these animation patterns in your header */

/* Pattern 1: Fade + Slide Up (for main title) */
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Pattern 2: Gradient Shift (for background) */
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Pattern 3: Scale Pulse (for emphasis elements) */
@keyframes scalePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Pattern 4: Floating Objects (for decorative elements) */
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

/* Pattern 5: Rotating Shapes (for geometric patterns) */
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Pattern 6: Wave Motion (for flowing patterns) */
@keyframes wave {
  0% { transform: translateX(0) translateY(0); }
  50% { transform: translateX(-25%) translateY(-5%); }
  100% { transform: translateX(0) translateY(0); }
}

/* Pattern 7: Particle Rise (for floating particles) */
@keyframes particleRise {
  0% {
    opacity: 0;
    transform: translateY(100px) scale(0);
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-100px) scale(1);
  }
}

/* Pattern 8: Grid Slide (for background patterns) */
@keyframes gridSlide {
  0% { background-position: 0 0; }
  100% { background-position: 50px 50px; }
}

/* Pattern 9: Morph (for organic shapes) */
@keyframes morph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
}

/* USAGE EXAMPLES - Apply to header elements: */

/* Text animations */
.header-title {
  animation: fadeSlideUp 1s ease-out forwards;
  animation-delay: 0.2s;
  opacity: 0;
}

.header-subtitle {
  animation: fadeSlideUp 1s ease-out forwards;
  animation-delay: 0.5s;
  opacity: 0;
}

/* Background with gradient */
.header-background {
  background: linear-gradient(-45deg, #color1, #color2, #color3);
  background-size: 400% 400%;
  animation: gradientShift 8s ease infinite;
}

/* ADVANCED: Background with animated pattern */
.header-with-pattern {
  background:
    linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.1) 70%, transparent 70%),
    linear-gradient(-45deg, transparent 30%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.1) 70%, transparent 70%),
    linear-gradient(#color1, #color2);
  background-size: 30px 30px, 30px 30px, 100% 100%;
  animation: gridSlide 20s linear infinite;
}

/* Floating decorative objects */
.floating-shape {
  position: absolute;
  width: 100px;
  height: 100px;
  background: rgba(255,255,255,0.1);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
}

/* Rotating geometric shapes */
.rotating-hexagon {
  position: absolute;
  width: 80px;
  height: 80px;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: rgba(255,255,255,0.15);
  animation: rotate 20s linear infinite;
}

/* Animated particles */
.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255,255,255,0.6);
  border-radius: 50%;
  animation: particleRise 4s ease-in infinite;
}

/* Wave pattern */
.wave-pattern {
  position: absolute;
  width: 200%;
  height: 100%;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 50px,
    rgba(255,255,255,0.05) 50px,
    rgba(255,255,255,0.05) 100px
  );
  animation: wave 15s ease-in-out infinite;
}

/* Morphing blob */
.morphing-blob {
  position: absolute;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255,255,255,0.15), transparent);
  animation: morph 8s ease-in-out infinite, float 6s ease-in-out infinite;
}
\`\`\`

**🎨 TOPIC-SPECIFIC ANIMATED ELEMENTS:**

Choose animated elements that match the journey topic:

**Tech Topics:**
\`\`\`html
<!-- Binary rain effect -->
<div class="binary-rain">
  <span style="animation-delay: 0s;">01</span>
  <span style="animation-delay: 0.5s;">10</span>
  <span style="animation-delay: 1s;">11</span>
  <!-- More spans with staggered delays -->
</div>
\`\`\`

**Creative Topics:**
\`\`\`html
<!-- Floating colorful blobs -->
<div class="blob blob-1" style="top: 10%; left: 20%; animation-delay: 0s;"></div>
<div class="blob blob-2" style="top: 60%; left: 70%; animation-delay: 1s;"></div>
<div class="blob blob-3" style="top: 30%; left: 80%; animation-delay: 2s;"></div>
\`\`\`

**Business Topics:**
\`\`\`html
<!-- Animated geometric patterns -->
<div class="geo-pattern">
  <div class="hexagon" style="animation-delay: 0s;"></div>
  <div class="hexagon" style="animation-delay: 0.3s;"></div>
  <div class="hexagon" style="animation-delay: 0.6s;"></div>
</div>
\`\`\`

**Science Topics:**
\`\`\`html
<!-- Particle system -->
<div class="particle-container">
  <div class="particle" style="left: 20%; animation-delay: 0s;"></div>
  <div class="particle" style="left: 40%; animation-delay: 0.5s;"></div>
  <div class="particle" style="left: 60%; animation-delay: 1s;"></div>
  <div class="particle" style="left: 80%; animation-delay: 1.5s;"></div>
</div>
\`\`\`

**📋 MANDATORY HEADER ANIMATION CHECKLIST:**
Your header MUST include AT LEAST 4 of these animations:

1. ✅ **Title Animation**: Fade-in + slide-up (1-1.5s duration, 0.2s delay)
2. ✅ **Subtitle Animation**: Fade-in + slide-up (1-1.5s duration, 0.5s delay)
3. ✅ **Background Animation**: Choose ONE:
   - Gradient shift animation
   - Animated geometric pattern (grid, dots, lines)
   - Wave motion effect
4. ✅ **Moving Objects/Patterns** (REQUIRED - NOT OPTIONAL): Choose ONE OR MORE:
   - Floating shapes (circles, hexagons, blobs)
   - Rotating geometric elements
   - Particle system (rising or floating particles)
   - Morphing blobs
   - Binary rain (for tech topics)
   - Topic-specific animated elements
5. ✅ **Accent/Icon Animation**: Scale pulse OR rotation OR glow effect (1-2s)
6. ⚡ **BONUS**: Character-by-character text reveal OR hover effects

**🚨 CRITICAL REQUIREMENT:**
The header MUST have MOVING OBJECTS or ANIMATED PATTERNS in addition to text animations.
Static backgrounds with only gradient animations are NOT ENOUGH.

Examples of what to include:
- Floating geometric shapes that move up/down and rotate
- Particles that rise or float across the header
- Rotating hexagons or circles in the background
- Morphing blob shapes that change form
- Wave patterns that slide across
- Binary code rain for tech topics
- Animated grid patterns

**Match animations to the journey topic**:
  * Tech topics → Futuristic transitions, code-like effects, glitch effects
  * Creative topics → Fluid, organic animations, morphing shapes
  * Business topics → Clean, professional slide-ins, fade-ins
  * Historical topics → Timeline-style reveals, vintage transitions

**TIMING REQUIREMENTS:**
- **Total sequence**: 1.5-2.5 seconds for all header animations to complete
- **Stagger delays**: 0.2-0.5s between elements (title → subtitle → accents)
- **Background animations**: Can be continuous (gradient shifts, particles)
- **PERFORMANCE**: Use CSS animations and transforms (not JavaScript loops) for 60fps
- **Easing**: Use \`ease-out\` for entrances, \`ease-in-out\` for continuous animations

**🚨 CRITICAL QUALITY CHECK:**
Before you finish, verify ALL of these:
1. "Does the header have at least 4 different animations from the checklist?"
2. "Does the header have MOVING OBJECTS or ANIMATED PATTERNS (not just gradients)?"
3. "Do the animations match the journey topic (tech/creative/business/science)?"
4. "Does it create a WOW moment in the first 2 seconds?"

If ANY answer is NO → Add animations immediately. Headers without moving elements are UNACCEPTABLE and will be rejected.

**Content Follows Function:**
- Below the header, prioritize **clarity, readability, and usability**
- Design should enhance content comprehension, not distract from it
- Use generous whitespace, clear typography hierarchy
- Ensure information architecture is intuitive
- Interactive elements should have obvious affordances
- Beauty through simplicity and purpose
- Subtle animations on scroll (fade-in, slide-in) are encouraged but not required

**Balance:** Animated header grabs attention, content delivers value. Both should work together harmoniously.

---

## Technical Constraints

${uniqueness.constraints.map(c => `- ${c}`).join('\n')}

---

## Perpetua Branding

**Placement**: Top-left header
**Style Integration**: Style the "Perpetua" logo to match the **${visualStyle.primary}** aesthetic

${getBrandingSuggestions(visualStyle.primary)}

---

**Remember**: This is YOUR unique design language for this generation. Follow it precisely to create something truly special.
`.trim();
}

/**
 * Get branding suggestions based on visual style
 */
function getBrandingSuggestions(style: DesignStyle): string {
  const suggestions: Record<DesignStyle, string> = {
    'Neubrutalism': '**Suggestion**: Bold, black text with thick border and hard shadow',
    'Glassmorphism': '**Suggestion**: Semi-transparent container with frosted glass effect',
    'Organic Modernism': '**Suggestion**: Rounded, friendly letterforms with natural color',
    'Maximalist Typography': '**Suggestion**: Large, bold text treatment as statement piece',
    'Dark Mode First': '**Suggestion**: Light text on dark with subtle neon glow',
    '3D Elements & Depth': '**Suggestion**: Isometric or 3D transformed text with depth',
    'Gradient Explosion': '**Suggestion**: Text with gradient fill or gradient background',
    'Minimal Monochrome': '**Suggestion**: Simple, clean text in primary color',
    'Retro Vaporwave': '**Suggestion**: Chrome/metallic effect with neon glow',
    'Kinetic Typography': '**Suggestion**: Animated text with subtle motion on hover',
    'Futuristic Cyber': '**Suggestion**: Chrome text with LED glow effect or hexagonal frame',
  };

  return suggestions[style] || '**Suggestion**: Style to match overall aesthetic';
}

/**
 * Hash content for uniqueness (used in seed generation)
 */
export function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
