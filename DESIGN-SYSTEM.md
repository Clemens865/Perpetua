# PERPETUA - Design System

**Philosophy:** Scandinavian Design Principles
**Version:** 1.0.0
**Last Updated:** October 22, 2025

---

## 🎨 Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Animations](#animations)
7. [Iconography](#iconography)
8. [Voice & Tone](#voice--tone)

---

## 🌟 Design Philosophy

### Scandinavian Design Principles

**1. Minimalism (Mindre är mer)**
> "Less is more" - Remove everything unnecessary

- Every element serves a purpose
- No decorative elements
- Generous negative space
- Clean, uncluttered interfaces

**2. Functionality (Form följer funktion)**
> "Form follows function"

- Design serves the user's needs
- Intuitive interactions
- No hidden features
- Clear visual hierarchy

**3. Natural Beauty (Naturlig skönhet)**
> Embrace organic shapes and natural materials

- Soft, muted colors inspired by nature
- Organic, rounded corners
- Gentle shadows and elevation
- Light and airy feel

**4. Quality (Kvalitet över kvantitet)**
> "Quality over quantity"

- Craftsmanship in every detail
- Smooth animations
- Pixel-perfect alignment
- Consistent interactions

**5. Light (Ljus)**
> Embrace natural light and whitespace

- Light backgrounds (but not pure white)
- Soft contrasts
- Generous whitespace
- Breathing room

**6. Timelessness (Tidlös design)**
> Design that lasts, not trendy

- Classic typography
- Subtle colors
- No trends or gimmicks
- Evolves gracefully

---

## 🎨 Color System

### Philosophy

Colors inspired by Scandinavian landscapes:
- **Whites & Grays** - Snow, stone, fog
- **Blues** - Clear skies, Nordic waters
- **Greens** - Northern forests, moss
- **Earth Tones** - Wood, sand, clay

### Color Palette

```typescript
export const colors = {
  // Base - Soft whites and off-whites
  base: {
    white: '#FAFAFA',      // Snow white, not pure
    canvas: '#F5F5F5',     // Main background
    paper: '#FFFFFF',      // Cards, elevated surfaces
  },

  // Neutrals - Inspired by stone and fog
  gray: {
    50:  '#F7F7F7',        // Lightest gray
    100: '#EFEFEF',        // Very light
    200: '#E1E1E1',        // Light
    300: '#CFCFCF',        // Medium light
    400: '#B1B1B1',        // Medium
    500: '#9E9E9E',        // True middle
    600: '#7E7E7E',        // Medium dark
    700: '#626262',        // Dark
    800: '#515151',        // Very dark
    900: '#3B3B3B',        // Darkest (text)
  },

  // Primary - Nordic blue (trust, calm, infinite)
  primary: {
    50:  '#F0F7FF',
    100: '#E0EFFF',
    200: '#B8DBFF',
    300: '#8AC4FF',
    400: '#5CADFF',
    500: '#2E96FF',        // Main brand color
    600: '#1E7FE0',
    700: '#1565C0',
    800: '#0D4A8F',
    900: '#062E5F',
  },

  // Secondary - Soft green (growth, discovery)
  secondary: {
    50:  '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',        // Accent green
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  // Accent - Warm amber (energy, thinking)
  accent: {
    50:  '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',        // Thinking/active state
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Semantic colors
  semantic: {
    success: '#22C55E',    // Green
    warning: '#F59E0B',    // Amber
    error: '#EF4444',      // Red (muted)
    info: '#2E96FF',       // Blue
  },

  // Stage-specific colors (soft, muted)
  stages: {
    discovering: '#2E96FF',   // Blue - exploration
    chasing: '#8B5CF6',       // Purple - pursuit
    solving: '#22C55E',       // Green - solutions
    challenging: '#EF4444',   // Red - questioning
    questioning: '#F59E0B',   // Amber - inquiry
    searching: '#06B6D4',     // Cyan - research
    imagining: '#EC4899',     // Pink - creativity
    building: '#6366F1',      // Indigo - creation
  },
}
```

### Usage Guidelines

**Backgrounds:**
- Primary background: `base.canvas` (#F5F5F5)
- Cards/panels: `base.paper` (#FFFFFF)
- Hover states: `gray.100`

**Text:**
- Primary text: `gray.900` (#3B3B3B)
- Secondary text: `gray.600`
- Muted text: `gray.500`
- Disabled text: `gray.400`

**Interactive Elements:**
- Default: `primary.500`
- Hover: `primary.600`
- Active: `primary.700`
- Focus ring: `primary.500` with opacity

**Borders:**
- Default: `gray.200`
- Focus: `primary.500`
- Error: `semantic.error`

---

## ✍️ Typography

### Font Families

```css
/* Sans-serif - Primary font */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
             'Roboto', 'Helvetica Neue', Arial, sans-serif;

/* Monospace - Code and technical content */
font-family: 'JetBrains Mono', 'Fira Code', 'Monaco',
             'Courier New', monospace;
```

**Why Inter?**
- Clean, highly legible
- Excellent at all sizes
- Designed for screens
- Supports many weights
- Open source

### Type Scale

Based on a 1.125 ratio (Major Second)

```css
/* Text sizes */
.text-xs    { font-size: 0.75rem;   /* 12px */ }
.text-sm    { font-size: 0.875rem;  /* 14px */ }
.text-base  { font-size: 1rem;      /* 16px */ }
.text-lg    { font-size: 1.125rem;  /* 18px */ }
.text-xl    { font-size: 1.25rem;   /* 20px */ }
.text-2xl   { font-size: 1.5rem;    /* 24px */ }
.text-3xl   { font-size: 1.875rem;  /* 30px */ }
.text-4xl   { font-size: 2.25rem;   /* 36px */ }
.text-5xl   { font-size: 3rem;      /* 48px */ }
```

### Font Weights

```css
.font-normal    { font-weight: 400; }  /* Body text */
.font-medium    { font-weight: 500; }  /* Slight emphasis */
.font-semibold  { font-weight: 600; }  /* Headings */
.font-bold      { font-weight: 700; }  /* Strong emphasis */
```

### Usage

**Headings:**
```css
h1: text-4xl font-semibold text-gray-900
h2: text-3xl font-semibold text-gray-900
h3: text-2xl font-semibold text-gray-900
h4: text-xl font-semibold text-gray-900
h5: text-lg font-semibold text-gray-900
h6: text-base font-semibold text-gray-900
```

**Body:**
```css
Large body:  text-lg text-gray-800
Body:        text-base text-gray-800
Small body:  text-sm text-gray-700
Caption:     text-xs text-gray-600
```

**Interface:**
```css
Button:      text-sm font-medium
Input label: text-sm font-medium text-gray-700
Helper text: text-xs text-gray-500
Code:        text-sm font-mono
```

### Line Height

```css
.leading-tight   { line-height: 1.25; }   /* Headings */
.leading-normal  { line-height: 1.5; }    /* Body text */
.leading-relaxed { line-height: 1.625; }  /* Long-form content */
.leading-loose   { line-height: 2; }      /* Spacious layouts */
```

---

## 📏 Spacing & Layout

### Spacing Scale

Based on 4px base unit

```css
const spacing = {
  0:   '0px',
  1:   '4px',
  2:   '8px',
  3:   '12px',
  4:   '16px',
  5:   '20px',
  6:   '24px',
  8:   '32px',
  10:  '40px',
  12:  '48px',
  16:  '64px',
  20:  '80px',
  24:  '96px',
  32:  '128px',
}
```

### Layout Grid

**Desktop (1280px+):**
```
┌────────────────────────────────────────────────────────┐
│  [64px padding]     Main Content      [64px padding]   │
│                   (max-width: 1152px)                   │
└────────────────────────────────────────────────────────┘
```

**Tablet (768px - 1279px):**
```
┌──────────────────────────────────────┐
│  [32px]    Content     [32px]        │
└──────────────────────────────────────┘
```

**Mobile (< 768px):**
```
┌────────────────────────────┐
│ [16px]  Content  [16px]    │
└────────────────────────────┘
```

### Component Spacing

**Cards:**
```css
padding: 24px;        /* Desktop */
padding: 16px;        /* Mobile */
gap: 16px;            /* Between elements */
```

**Buttons:**
```css
padding: 12px 20px;   /* Medium */
padding: 8px 16px;    /* Small */
padding: 16px 24px;   /* Large */
gap: 8px;             /* Icon + text */
```

**Forms:**
```css
gap: 16px;            /* Between fields */
label margin: 8px;    /* Label to input */
helper margin: 4px;   /* Input to helper text */
```

---

## 🧩 Components

### 1. Stage Card

The core component - displays a journey stage

```tsx
<StageCard
  type="discovering"
  status="running"
  title="DISCOVERING"
  content="Researching quantum computing applications..."
  timestamp="2 min ago"
  artifacts={[...]}
/>
```

**Visual Specs:**
```css
- Background: white
- Border: 1px solid gray.200
- Border-radius: 12px
- Padding: 24px
- Shadow: soft, subtle elevation
- Border-left: 4px solid [stage-color]
```

**States:**
- Running: Animated pulse on left border
- Complete: Static, full opacity
- Pending: Reduced opacity (60%)

### 2. Stream Container

The infinite scroll container

```tsx
<Stream>
  {stages.map(stage => <StageCard {...stage} />)}
</Stream>
```

**Visual Specs:**
```css
- Background: base.canvas
- Padding: 64px
- Max-width: 800px
- Margin: 0 auto
- Gap between cards: 16px
```

### 3. Control Panel

Sidebar for journey controls

```tsx
<ControlPanel
  journey={currentJourney}
  onPause={...}
  onResume={...}
  onStop={...}
/>
```

**Visual Specs:**
```css
- Width: 320px (desktop), full-width (mobile)
- Background: white
- Border-left: 1px solid gray.200
- Padding: 24px
- Fixed position (desktop)
```

### 4. Artifact Card

Displays created artifacts

```tsx
<ArtifactCard
  type="document"
  title="Research Summary"
  preview="Quantum computing shows promise..."
  onOpen={...}
/>
```

**Visual Specs:**
```css
- Background: gray.50
- Border: 1px solid gray.200
- Border-radius: 8px
- Padding: 16px
- Hover: border-color: primary.500
- Transition: smooth (200ms)
```

### 5. Button

Primary interaction element

```tsx
<Button variant="primary" size="medium">
  Start Journey
</Button>
```

**Variants:**
```css
/* Primary */
background: primary.500
color: white
hover: primary.600

/* Secondary */
background: gray.200
color: gray.900
hover: gray.300

/* Ghost */
background: transparent
color: gray.700
hover: background: gray.100

/* Danger */
background: semantic.error
color: white
hover: darker red
```

**Sizes:**
```css
/* Small */
padding: 8px 16px
font-size: text-sm

/* Medium */
padding: 12px 20px
font-size: text-base

/* Large */
padding: 16px 24px
font-size: text-lg
```

### 6. Input Field

Text input with label

```tsx
<Input
  label="Journey starting point"
  placeholder="What should we explore?"
  helperText="Enter a question, topic, or problem"
/>
```

**Visual Specs:**
```css
- Border: 1px solid gray.300
- Border-radius: 8px
- Padding: 12px 16px
- Font-size: text-base
- Focus: border-color: primary.500, ring: primary.500/20%
- Error: border-color: semantic.error
```

---

## 🎬 Animations

### Principles

1. **Purposeful** - Every animation has a reason
2. **Fast** - No animation longer than 300ms
3. **Natural** - Easing that feels organic
4. **Subtle** - Not distracting

### Timing Functions

```css
/* Easing curves */
ease-out:    cubic-bezier(0, 0, 0.2, 1)      /* Elements entering */
ease-in:     cubic-bezier(0.4, 0, 1, 1)      /* Elements exiting */
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)    /* Elements moving */
spring:      Custom spring physics            /* Interactive elements */
```

### Duration Scale

```css
duration-75:   75ms      /* Instant feedback */
duration-100:  100ms     /* Very quick */
duration-150:  150ms     /* Quick */
duration-200:  200ms     /* Standard */
duration-300:  300ms     /* Slower transitions */
duration-500:  500ms     /* Intentional, important */
```

### Common Animations

**1. Fade In (Stage Cards Appearing):**
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

animation: fadeIn 200ms ease-out;
```

**2. Pulse (Active Stage Indicator):**
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```

**3. Shimmer (Loading State):**
```css
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

background: linear-gradient(
  to right,
  gray.100 0%,
  gray.200 50%,
  gray.100 100%
);
animation: shimmer 2s infinite;
```

**4. Slide In (Sidebar):**
```tsx
// Using Framer Motion
<motion.div
  initial={{ x: 320 }}
  animate={{ x: 0 }}
  exit={{ x: 320 }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
/>
```

### Micro-interactions

**Button Hover:**
```css
transition: all 150ms ease-out;
hover: {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

**Card Hover:**
```css
transition: border-color 200ms ease-out;
hover: {
  border-color: primary.500;
}
```

**Input Focus:**
```css
transition: all 150ms ease-out;
focus: {
  border-color: primary.500;
  box-shadow: 0 0 0 3px rgba(primary.500, 0.1);
}
```

---

## 🎯 Iconography

### Icon System

**Library:** Lucide Icons (React)
- Consistent stroke width (2px)
- Clean, minimal design
- Highly readable
- Open source

### Icon Sizes

```css
.icon-xs   { width: 12px; height: 12px; }
.icon-sm   { width: 16px; height: 16px; }
.icon-md   { width: 20px; height: 20px; }  /* Default */
.icon-lg   { width: 24px; height: 24px; }
.icon-xl   { width: 32px; height: 32px; }
```

### Stage Icons

Each stage has a unique icon:

```tsx
const stageIcons = {
  discovering:  <Search />,
  chasing:      <Target />,
  solving:      <Lightbulb />,
  challenging:  <AlertCircle />,
  questioning:  <HelpCircle />,
  searching:    <Globe />,
  imagining:    <Sparkles />,
  building:     <Hammer />,
}
```

### Common Icons

```tsx
// Actions
<Play />         // Start journey
<Pause />        // Pause journey
<Square />       // Stop journey
<RotateCw />     // Refresh/retry

// Navigation
<ChevronLeft />
<ChevronRight />
<ChevronDown />
<ChevronUp />

// Interface
<X />            // Close
<Menu />         // Menu
<Settings />     // Settings
<Download />     // Export
<Share2 />       // Share
<Copy />         // Copy

// Status
<Check />        // Success
<AlertCircle />  // Warning
<XCircle />      // Error
<Info />         // Information
<Loader2 />      // Loading (animated)
```

---

## 🗣️ Voice & Tone

### Brand Voice

**Characteristics:**
- Calm and thoughtful (not hyper or aggressive)
- Curious and encouraging (not passive)
- Clear and honest (not marketing-speak)
- Warm but professional (not corporate)

**Like:** A thoughtful friend who helps you explore ideas
**Not Like:** A pushy salesperson or corporate assistant

### Writing Guidelines

**1. Be Clear:**
```
❌ "Perpetua is leveraging cutting-edge AI to facilitate discovery"
✅ "Perpetua explores ideas for you"
```

**2. Be Concise:**
```
❌ "Your journey is currently in the process of running"
✅ "Journey running"
```

**3. Be Helpful:**
```
❌ "Error occurred"
✅ "Couldn't connect. Check your internet connection."
```

**4. Be Encouraging:**
```
❌ "No journeys yet"
✅ "Start your first journey"
```

### UI Copy Examples

**Empty States:**
```
"No journeys yet. Start exploring."
"No artifacts created in this journey yet."
"Your journey history will appear here."
```

**Actions:**
```
"Start Journey"
"Pause"
"Resume"
"Go Deeper"
"Export Artifacts"
"Share Journey"
```

**Status Messages:**
```
"Thinking for 23 seconds..."
"Researching the web..."
"Creating artifact..."
"Journey complete"
"Paused - ready to resume"
```

**Errors:**
```
"Couldn't start journey. Try again."
"Lost connection. Reconnecting..."
"Something went wrong. We're looking into it."
```

---

## 📱 Responsive Design

### Breakpoints

```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
}
```

### Layout Adaptations

**Stream:**
- Desktop: 800px max-width, centered, 64px padding
- Tablet: Full width, 32px padding
- Mobile: Full width, 16px padding

**Control Panel:**
- Desktop: 320px fixed sidebar
- Mobile: Full-width bottom sheet or overlay

**Stage Cards:**
- Desktop: Full details, spacious padding
- Mobile: Condensed, key info only

---

## ♿ Accessibility

### Principles

1. **Keyboard Navigation** - Everything accessible via keyboard
2. **Screen Readers** - Proper ARIA labels and semantic HTML
3. **Color Contrast** - WCAG AA compliant (4.5:1 for text)
4. **Focus Indicators** - Always visible, never removed
5. **Motion** - Respect `prefers-reduced-motion`

### Implementation

```tsx
// Focus ring
focus:ring-2 focus:ring-primary-500 focus:ring-offset-2

// Motion sensitivity
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

// Semantic HTML
<button> not <div onClick>
<h1>, <h2> for headings
<main>, <aside>, <nav> for structure
```

---

## 🎨 Design Tokens (Code)

```typescript
// Export as JavaScript for Tailwind config

export const designTokens = {
  colors: { /* as above */ },

  spacing: {
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
    12: '48px',
    16: '64px',
  },

  borderRadius: {
    none: '0',
    sm: '4px',
    DEFAULT: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    DEFAULT: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },
}
```

---

**Last Updated:** October 22, 2025
**Version:** 1.0.0

---

**"Simple, functional, beautiful. That's Perpetua."** 🎨
