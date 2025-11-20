/**
 * Design Style Library
 *
 * Comprehensive descriptions of modern design styles with implementation guidance
 */

import type { DesignStyle, DesignStyleDefinition, LayoutSystem, LayoutSystemDefinition, TypographyPairing } from '../types/design-language';

export const DESIGN_STYLES: Record<DesignStyle, DesignStyleDefinition> = {
  'Neubrutalism': {
    name: 'Neubrutalism',
    description: 'Bold, raw, high-contrast aesthetic with heavy borders and intentionally "unpolished" appearance',
    characteristics: [
      'Heavy black borders (3-5px solid)',
      'Hard shadows (no blur, offset shadows)',
      'Flat colors with NO gradients',
      'High contrast color combinations',
      'Intentionally rough, unrefined look',
      'Blocky, geometric shapes',
      'Bold, oversized typography',
    ],
    cssFeatures: [
      'border: 5px solid #000',
      'box-shadow: 8px 8px 0 #000',
      'No border-radius (or very minimal)',
      'transform: rotate(slightly) for imperfect alignment',
      'High contrast backgrounds',
    ],
    bestFor: ['Bold statements', 'Creative portfolios', 'Memorable landing pages', 'Youthful brands'],
    avoid: ['Corporate/formal content', 'Data-heavy pages', 'Elderly audiences'],
  },

  'Glassmorphism': {
    name: 'Glassmorphism',
    description: 'Translucent, layered design with frosted glass effects and subtle depth',
    characteristics: [
      'Frosted glass backgrounds',
      'Semi-transparent elements (rgba with alpha)',
      'Backdrop blur effects',
      'Subtle borders and highlights',
      'Layered depth perception',
      'Light, airy color palette',
      'Soft shadows',
    ],
    cssFeatures: [
      'backdrop-filter: blur(10px) saturate(180%)',
      'background: rgba(255, 255, 255, 0.2)',
      'border: 1px solid rgba(255, 255, 255, 0.18)',
      'box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      'Multiple layers with varying transparency',
    ],
    bestFor: ['Modern apps', 'Premium products', 'Tech content', 'Sophisticated audiences'],
    avoid: ['Print/PDF (transparency issues)', 'Low-end devices', 'Readability-critical content'],
    codeExample: `
.glass-card {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}`,
  },

  'Organic Modernism': {
    name: 'Organic Modernism',
    description: 'Curved, flowing forms inspired by nature with soft, approachable aesthetics',
    characteristics: [
      'Blob shapes and organic curves',
      'Flowing, smooth animations',
      'Nature-inspired color palettes',
      'Rounded corners everywhere',
      'Soft, gradual transitions',
      'Asymmetric, natural layouts',
      'Friendly, approachable vibe',
    ],
    cssFeatures: [
      'border-radius: 50% 30% 70% 40%',
      'clip-path: with organic shapes',
      'Smooth cubic-bezier transitions',
      'SVG path animations for flow',
      'Transform with gentle rotations',
    ],
    bestFor: ['Health/wellness', 'Education', 'Friendly brands', 'Creative content'],
    avoid: ['Financial/legal (too casual)', 'Technical documentation', 'High-precision data'],
  },

  'Maximalist Typography': {
    name: 'Maximalist Typography',
    description: 'Text as the primary visual element with huge, experimental typography',
    characteristics: [
      'Huge headlines (8-15rem font size)',
      'Variable font weights',
      'Text overlays and layering',
      'Kinetic text animations',
      'Minimal imagery, maximum text',
      'Bold, confident statements',
      'Typography creates structure',
    ],
    cssFeatures: [
      'font-size: clamp(4rem, 12vw, 15rem)',
      'font-weight: variable (100-900)',
      'text-stroke for outlines',
      'mix-blend-mode for text effects',
      'letter-spacing and line-height variations',
    ],
    bestFor: ['Editorial content', 'Bold statements', 'Quotes/manifestos', 'Text-heavy content'],
    avoid: ['Data visualization', 'Image-heavy content', 'Complex navigation'],
  },

  'Dark Mode First': {
    name: 'Dark Mode First',
    description: 'Low-light optimized design with deep backgrounds and neon accents',
    characteristics: [
      'Very dark backgrounds (#0a0a0a, #121212)',
      'Neon or vibrant accent colors',
      'High contrast for readability',
      'Glow effects on interactive elements',
      'OLED-optimized (pure black)',
      'Reduced eye strain',
      'Modern, technical aesthetic',
    ],
    cssFeatures: [
      'background: #0a0a0a',
      'color: #f0f0f0',
      'Neon accents: #00ff88, #ff0080',
      'box-shadow: 0 0 20px rgba(neon-color, 0.5) for glows',
      'High contrast ratios (WCAG AAA)',
    ],
    bestFor: ['Tech products', 'Gaming', 'Developer tools', 'Night-time usage'],
    avoid: ['Print (wastes ink)', 'Bright environments', 'Elderly users (may need more light)'],
  },

  '3D Elements & Depth': {
    name: '3D Elements & Depth',
    description: 'Isometric, parallax, and 3D transforms creating dimensional experiences',
    characteristics: [
      'CSS 3D transforms',
      'Isometric illustrations',
      'Parallax scrolling effects',
      'Multiple depth layers',
      'Perspective and rotation',
      'Shadow depth progression',
      'Dimensional hierarchy',
    ],
    cssFeatures: [
      'transform: perspective(1000px) rotateX(10deg)',
      'transform-style: preserve-3d',
      'Parallax: translateZ() with different speeds',
      'Multiple box-shadows for depth',
      'Isometric: rotateX(60deg) rotateZ(45deg)',
    ],
    bestFor: ['Product showcases', 'Interactive storytelling', 'Modern tech sites'],
    avoid: ['Accessibility concerns', 'Motion-sensitive users', 'Simple content'],
  },

  'Gradient Explosion': {
    name: 'Gradient Explosion',
    description: 'Vibrant, multi-color gradients with bold, energetic color combinations',
    characteristics: [
      'Multi-stop gradients (3+ colors)',
      'Mesh gradients',
      'Animated gradients',
      'Overlapping gradient layers',
      'Vibrant, saturated colors',
      'Gradients on everything',
      'High energy, dynamic feel',
    ],
    cssFeatures: [
      'background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      'background: radial-gradient(circle at top right, colors...)',
      'background: conic-gradient(from 180deg, colors...)',
      'Animation: gradient position shift',
      'Multiple gradient overlays with blend modes',
    ],
    bestFor: ['Creative industries', 'Youthful brands', 'Entertainment', 'Events'],
    avoid: ['Professional/corporate', 'Readability-critical text', 'Print'],
  },

  'Minimal Monochrome': {
    name: 'Minimal Monochrome',
    description: 'Pure black and white with single accent color, extreme simplicity',
    characteristics: [
      'Only black (#000) and white (#fff)',
      'Single accent color for emphasis',
      'Generous whitespace',
      'Clean lines and simple shapes',
      'Typography-focused',
      'Grid-based layouts',
      'Timeless, elegant',
    ],
    cssFeatures: [
      'color: #000 or #fff only',
      'One accent color for CTAs',
      'No gradients or textures',
      'Simple borders and dividers',
      'Focus on spacing and hierarchy',
    ],
    bestFor: ['Luxury brands', 'Professional services', 'Timeless content', 'Photography portfolios'],
    avoid: ['Playful brands', 'Colorful content', 'Casual audiences'],
  },

  'Retro Vaporwave': {
    name: 'Retro Vaporwave',
    description: '80s/90s nostalgia with neon colors, grids, and chrome effects',
    characteristics: [
      'Purple/pink/cyan gradients',
      'Grid patterns (perspective grids)',
      'Chrome/metallic text effects',
      'VHS scan lines',
      'Nostalgic 80s/90s vibes',
      'Geometric shapes',
      'Playful, ironic tone',
    ],
    cssFeatures: [
      'Gradient: #ff00ff to #00ffff',
      'Grid backgrounds with perspective',
      'text-shadow for glow effects',
      'Animated scan lines',
      'Chrome: gradients + text masking',
    ],
    bestFor: ['Creative projects', 'Music/entertainment', 'Nostalgic content', 'Playful brands'],
    avoid: ['Corporate/serious content', 'Accessibility-first sites', 'Professional services'],
  },

  'Kinetic Typography': {
    name: 'Kinetic Typography',
    description: 'Animated, interactive text that responds to user input',
    characteristics: [
      'Text animations on scroll',
      'Character-by-character reveals',
      'Mouse-responsive text',
      'Text as interactive UI element',
      'Dynamic letter spacing',
      'Morphing text effects',
      'Typography creates movement',
    ],
    cssFeatures: [
      'Intersection Observer for scroll animations',
      'transform on individual characters',
      'CSS animations with stagger delays',
      'Mouse position tracking with JS',
      'Variable fonts for smooth transitions',
    ],
    bestFor: ['Creative studios', 'Interactive storytelling', 'Awards sites', 'Portfolio sites'],
    avoid: ['Accessibility concerns', 'Readability-first content', 'SEO-critical text'],
  },

  'Futuristic Cyber': {
    name: 'Futuristic Cyber',
    description: 'Sleek, chrome surfaces with LED lighting, hexagonal patterns, and holographic effects inspired by Daft Punk and cyberpunk aesthetics',
    characteristics: [
      'Chrome/metallic reflective surfaces',
      'LED strip lighting effects (glowing lines)',
      'Hexagonal/geometric patterns',
      'Black, gold, silver color scheme',
      'Holographic gradient effects',
      'Digital grid overlays',
      'Scanline effects',
      'Futuristic but precise (not chaotic)',
      'Electronic music aesthetic',
    ],
    cssFeatures: [
      'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) for holograms',
      'box-shadow: 0 0 10px #00ffff, inset 0 0 10px rgba(0,255,255,0.2) for LED glow',
      'clip-path: polygon() for hexagons',
      'background: linear-gradient(90deg, transparent 49.5%, #00ffff 49.5%, #00ffff 50.5%, transparent 50.5%) for grid',
      'filter: brightness(1.2) contrast(1.1) for chrome',
      'animation: scanlines for CRT effect',
    ],
    bestFor: ['Tech products', 'Electronic music', 'Gaming', 'Innovation/future-focused content', 'Premium tech brands'],
    avoid: ['Traditional/conservative brands', 'Nature/organic content', 'Vintage/nostalgic themes'],
  },
};

export const LAYOUT_SYSTEMS: Record<LayoutSystem, LayoutSystemDefinition> = {
  'Magazine Editorial': {
    name: 'Magazine Editorial',
    description: 'Asymmetric, dynamic layouts inspired by print magazines',
    structure: 'Varied column layouts (60/40, 70/30), large pull quotes, image overlays',
    cssImplementation: `
CSS Grid with named areas, asymmetric columns:
grid-template-columns: 2fr 1fr; /* 66/33 split */
Large typography for pull quotes, absolute positioning for overlays`,
    bestFor: ['Article-heavy content', 'Editorial storytelling', 'Text-rich pages'],
    interactionPatterns: ['Scroll-triggered image reveals', 'Sticky quotes', 'Reading progress bar'],
  },

  'Bento Box Grid': {
    name: 'Bento Box Grid',
    description: 'Card-based grid with varied sizes creating visual hierarchy',
    structure: 'CSS Grid with cells spanning multiple rows/columns, mix of 1x1, 2x1, 2x2',
    cssImplementation: `
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.card-large { grid-column: span 2; grid-row: span 2; }
.card-wide { grid-column: span 2; }`,
    bestFor: ['Dashboards', 'Feature showcases', 'Portfolio grids', 'Product catalogs'],
    interactionPatterns: ['Hover scale', 'Card flip', 'Expand on click'],
  },

  'Scrollytelling': {
    name: 'Scrollytelling',
    description: 'Narrative-driven vertical scroll with sticky elements and reveals',
    structure: 'Sections with position: sticky, scroll-triggered animations, parallax layers',
    cssImplementation: `
Intersection Observer API for scroll triggers
position: sticky for persistent elements
transform: translateY() with scroll percentage for parallax`,
    bestFor: ['Data stories', 'Long-form content', 'Educational content', 'Case studies'],
    interactionPatterns: ['Sticky nav', 'Scroll progress', 'Parallax backgrounds', 'Fade-in sections'],
  },

  'Split Screen Duotone': {
    name: 'Split Screen Duotone',
    description: 'Left/right split with contrasting themes, comparison-friendly',
    structure: '50/50 viewport split, contrasting colors/themes, synchronized scrolling',
    cssImplementation: `
.split-container { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }
.left { background: theme-a; }
.right { background: theme-b; }
Synchronized scroll with JS`,
    bestFor: ['Comparisons', 'Before/after', 'Dualities', 'Two-sided narratives'],
    interactionPatterns: ['Synchronized scroll', 'Drag divider', 'Swap sides'],
  },

  'Horizontal Timeline': {
    name: 'Horizontal Timeline',
    description: 'Side-scrolling timeline with events along horizontal axis',
    structure: 'Horizontal scroll container, events positioned along timeline axis',
    cssImplementation: `
.timeline { width: calc(events × 400px); overflow-x: auto; scroll-snap-type: x mandatory; }
.event { scroll-snap-align: center; }`,
    bestFor: ['Chronological content', 'Journey visualization', 'Process flows'],
    interactionPatterns: ['Drag to scroll', 'Snap to events', 'Minimap navigation'],
  },

  'Vertical Cascade': {
    name: 'Vertical Cascade',
    description: 'Staggered vertical layout with overlapping elements',
    structure: 'Elements cascade down with negative margins, creating overlap',
    cssImplementation: `
.cascade-item { margin-top: -50px; } /* Overlap previous item */
z-index increases down the page for proper layering`,
    bestFor: ['Visual timelines', 'Portfolio showcases', 'Step-by-step content'],
    interactionPatterns: ['Hover to expand', 'Scroll reveals', 'Layered animations'],
  },

  'Card Masonry': {
    name: 'Card Masonry',
    description: 'Pinterest-style masonry grid with dynamic heights',
    structure: 'CSS Multi-column or Grid with auto-flow: dense',
    cssImplementation: `
.masonry { column-count: 3; column-gap: 1rem; }
.item { break-inside: avoid; margin-bottom: 1rem; }
OR: grid-auto-flow: dense; grid-auto-rows: 50px;`,
    bestFor: ['Image galleries', 'Blog posts', 'Varied content types', 'Pinterest-like layouts'],
    interactionPatterns: ['Infinite scroll', 'Lightbox on click', 'Hover previews'],
  },

  'Full-bleed Sections': {
    name: 'Full-bleed Sections',
    description: 'Full viewport sections with no margins, immersive experience',
    structure: 'Each section is 100vw × 100vh, scroll-snapped',
    cssImplementation: `
.section { width: 100vw; min-height: 100vh; scroll-snap-align: start; }
.container { scroll-snap-type: y mandatory; overflow-y: scroll; }`,
    bestFor: ['Landing pages', 'Presentations', 'Immersive storytelling'],
    interactionPatterns: ['Snap scrolling', 'Section indicators', 'Smooth scroll'],
  },
};

export const TYPOGRAPHY_PAIRINGS: TypographyPairing[] = [
  {
    heading: { family: 'Playfair Display', weight: '700', style: 'serif' },
    body: { family: 'Source Sans Pro', weight: '400', style: 'sans-serif' },
    style: 'Classic Editorial',
    description: 'Elegant serif headlines with clean sans-serif body. Perfect for editorial content.',
  },
  {
    heading: { family: 'Montserrat', weight: '800', style: 'sans-serif' },
    body: { family: 'Open Sans', weight: '400', style: 'sans-serif' },
    style: 'Modern Clean',
    description: 'Geometric, modern sans-serif. Great for tech and contemporary designs.',
  },
  {
    heading: { family: 'Bebas Neue', weight: '700', style: 'sans-serif' },
    body: { family: 'Roboto', weight: '400', style: 'sans-serif' },
    style: 'Bold Impact',
    description: 'Condensed, bold headlines for maximum impact. Athletic and energetic.',
  },
  {
    heading: { family: 'Crimson Text', weight: '600', style: 'serif' },
    body: { family: 'Lato', weight: '400', style: 'sans-serif' },
    style: 'Academic',
    description: 'Classic serif for scholarly authority with approachable sans-serif body.',
  },
  {
    heading: { family: 'Oswald', weight: '600', style: 'sans-serif' },
    body: { family: 'Merriweather', weight: '400', style: 'serif' },
    style: 'Industrial',
    description: 'Strong, industrial headlines with readable serif body. Professional and solid.',
  },
  {
    heading: { family: 'Raleway', weight: '700', style: 'sans-serif' },
    body: { family: 'Nunito', weight: '400', style: 'sans-serif' },
    style: 'Friendly',
    description: 'Rounded, approachable letterforms. Great for friendly, accessible content.',
  },
  {
    heading: { family: 'Poppins', weight: '700', style: 'sans-serif' },
    body: { family: 'Inter', weight: '400', style: 'sans-serif' },
    style: 'Contemporary',
    description: 'Modern geometric sans-serif. Clean, versatile, and highly readable.',
  },
  {
    heading: { family: 'Merriweather', weight: '900', style: 'serif' },
    body: { family: 'PT Sans', weight: '400', style: 'sans-serif' },
    style: 'Traditional',
    description: 'Strong serif presence with neutral sans-serif body. Timeless and trustworthy.',
  },
  {
    heading: { family: 'Space Grotesk', weight: '700', style: 'sans-serif' },
    body: { family: 'Work Sans', weight: '400', style: 'sans-serif' },
    style: 'Tech Forward',
    description: 'Geometric, slightly quirky. Perfect for modern tech and startups.',
  },
  {
    heading: { family: 'Libre Baskerville', weight: '700', style: 'serif' },
    body: { family: 'Karla', weight: '400', style: 'sans-serif' },
    style: 'Elegant Minimal',
    description: 'Refined serif with clean geometric body. Sophisticated and minimal.',
  },
  {
    heading: { family: 'Archivo Black', weight: '400', style: 'sans-serif' },
    body: { family: 'Rubik', weight: '400', style: 'sans-serif' },
    style: 'Bold Geometric',
    description: 'Ultra-bold headlines with rounded body text. Playful yet strong.',
  },
  {
    heading: { family: 'Cormorant Garamond', weight: '600', style: 'serif' },
    body: { family: 'Mulish', weight: '400', style: 'sans-serif' },
    style: 'Refined Classic',
    description: 'High-contrast serif with balanced sans-serif. Luxurious and readable.',
  },
];

/**
 * Get style-compatible typography pairings
 */
export function getCompatibleTypography(visualStyle: DesignStyle): TypographyPairing[] {
  const styleToTypographyMap: Record<DesignStyle, string[]> = {
    'Neubrutalism': ['Bold Impact', 'Bold Geometric', 'Tech Forward'],
    'Glassmorphism': ['Modern Clean', 'Contemporary', 'Friendly'],
    'Organic Modernism': ['Friendly', 'Contemporary', 'Elegant Minimal'],
    'Maximalist Typography': ['Bold Impact', 'Classic Editorial', 'Industrial'],
    'Dark Mode First': ['Tech Forward', 'Contemporary', 'Modern Clean'],
    '3D Elements & Depth': ['Bold Geometric', 'Tech Forward', 'Modern Clean'],
    'Gradient Explosion': ['Bold Impact', 'Friendly', 'Contemporary'],
    'Minimal Monochrome': ['Elegant Minimal', 'Refined Classic', 'Traditional'],
    'Retro Vaporwave': ['Bold Impact', 'Bold Geometric', 'Industrial'],
    'Kinetic Typography': ['Tech Forward', 'Bold Impact', 'Modern Clean'],
    'Futuristic Cyber': ['Tech Forward', 'Bold Geometric', 'Modern Clean'],
  };

  const compatibleStyles = styleToTypographyMap[visualStyle] || [];
  return TYPOGRAPHY_PAIRINGS.filter(p => compatibleStyles.includes(p.style));
}

/**
 * Get description for a design style
 */
export function getStyleDescription(style: DesignStyle): string {
  const def = DESIGN_STYLES[style];
  return `
**${def.name}**: ${def.description}

**Key Characteristics:**
${def.characteristics.map(c => `- ${c}`).join('\n')}

**CSS Implementation:**
${def.cssFeatures.map(c => `- ${c}`).join('\n')}

**Best For:** ${def.bestFor.join(', ')}
**Avoid:** ${def.avoid.join(', ')}

${def.codeExample ? `**Example Code:**
\`\`\`css
${def.codeExample}
\`\`\`
` : ''}
`;
}

/**
 * Get layout system instructions
 */
export function getLayoutSystemInstructions(system: LayoutSystem): string {
  const def = LAYOUT_SYSTEMS[system];
  return `
**${def.name}**: ${def.description}

**Structure:** ${def.structure}

**CSS Implementation:**
${def.cssImplementation}

**Best For:** ${def.bestFor.join(', ')}

**Interaction Patterns:**
${def.interactionPatterns.map(p => `- ${p}`).join('\n')}
`;
}
