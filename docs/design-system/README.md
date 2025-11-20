# Perpetua Design System

A Scandinavian-inspired design system built with React, TypeScript, and TailwindCSS.

## Philosophy

The Perpetua design system follows Scandinavian design principles:

- **Minimalism** - Every element serves a purpose
- **Functionality** - Form follows function
- **Natural Beauty** - Soft, muted colors inspired by nature
- **Quality** - Craftsmanship in every detail
- **Light** - Generous whitespace and breathing room
- **Timelessness** - Design that lasts, not trendy

## Installation

The design system is built into the Perpetua application. Import components directly:

```typescript
import { Button, Input, Card } from './components/design-system';
```

## Quick Start

### Theme Provider

Wrap your app with the theme provider for light/dark mode support:

```tsx
import { ThemeProvider } from './components/design-system';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <YourApp />
    </ThemeProvider>
  );
}
```

### Using Components

```tsx
import { Button, Input, Card, Badge } from './components/design-system';

function Example() {
  return (
    <Card padding="medium">
      <h2>Welcome to Perpetua</h2>

      <Input
        label="Journey starting point"
        placeholder="What should we explore?"
        helperText="Enter a question, topic, or problem"
      />

      <div className="flex gap-2">
        <Button variant="primary">Start Journey</Button>
        <Button variant="secondary">Save Draft</Button>
      </div>

      <Badge variant="success" dot>Active</Badge>
    </Card>
  );
}
```

## Component Architecture

Components are organized using Atomic Design principles:

### Atoms (Basic Building Blocks)
- `Button` - Primary interaction element
- `Input` - Text input with label
- `Card` - Content container
- `Badge` - Status indicator
- `Icon` - SVG icon wrapper

### Molecules (Simple Compositions)
- `InputGroup` - Input with attached button
- `CardHeader` - Card title with action
- `IconButton` - Button with icon only

### Organisms (Complex Components)
- Coming soon: `StageCard`, `ControlPanel`, `ArtifactCard`

## Color System

Colors are inspired by Scandinavian landscapes:

### Base Colors
```css
--base-white: #FAFAFA    /* Snow white */
--base-canvas: #F5F5F5   /* Main background */
--base-paper: #FFFFFF    /* Cards */
```

### Primary (Nordic Blue)
```css
--primary-500: #2E96FF   /* Main brand color */
```

### Semantic Colors
```css
--success: #22C55E
--warning: #F59E0B
--error: #EF4444
--info: #2E96FF
```

### Stage Colors
```css
--discovering: #2E96FF   /* Blue */
--chasing: #8B5CF6       /* Purple */
--solving: #22C55E       /* Green */
--challenging: #EF4444   /* Red */
--questioning: #F59E0B   /* Amber */
--searching: #06B6D4     /* Cyan */
--imagining: #EC4899     /* Pink */
--building: #6366F1      /* Indigo */
```

## Typography

### Font Families
- **Sans-serif**: Inter (primary)
- **Monospace**: JetBrains Mono (code)

### Type Scale
```css
text-xs:   12px
text-sm:   14px
text-base: 16px
text-lg:   18px
text-xl:   20px
text-2xl:  24px
text-3xl:  30px
text-4xl:  36px
text-5xl:  48px
```

## Spacing

Based on 4px base unit:

```css
spacing: {
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  6: 24px
  8: 32px
  12: 48px
  16: 64px
}
```

## Accessibility

All components follow WCAG 2.1 AA standards:

- Keyboard navigation support
- ARIA labels and attributes
- Focus indicators (never removed)
- Color contrast 4.5:1 minimum
- Screen reader support
- Motion sensitivity via `prefers-reduced-motion`

## Theme System

### Using Themes

```tsx
import { useTheme } from './components/design-system';

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current: {resolvedTheme}
    </button>
  );
}
```

### Theme Options
- `light` - Light mode
- `dark` - Dark mode
- `system` - Follow system preference (default)

## Animation Guidelines

### Principles
1. **Purposeful** - Every animation has a reason
2. **Fast** - No animation longer than 300ms
3. **Natural** - Organic easing curves
4. **Subtle** - Not distracting

### Built-in Animations
```tsx
// Fade in
<div className="animate-fade-in">...</div>

// Slide in
<div className="animate-slide-in">...</div>

// Pulse
<div className="animate-pulse">...</div>
```

### Custom Animations
Use Framer Motion for complex animations:

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>
  Content
</motion.div>
```

## Best Practices

### 1. Consistent Spacing
Use the spacing scale for all margins and padding:

```tsx
// Good
<div className="px-6 py-4 gap-4">

// Avoid arbitrary values
<div className="px-[23px] py-[17px]">
```

### 2. Semantic Colors
Use semantic colors for meaning:

```tsx
// Good
<Badge variant="success">Complete</Badge>

// Avoid direct color classes
<Badge className="bg-green-500">Complete</Badge>
```

### 3. Accessibility First
Always include ARIA labels and keyboard support:

```tsx
// Good
<button aria-label="Close modal" onClick={onClose}>
  <XIcon />
</button>

// Avoid
<div onClick={onClose}>X</div>
```

### 4. Responsive Design
Use mobile-first approach:

```tsx
<div className="px-4 md:px-8 lg:px-16">
  Responsive padding
</div>
```

## Examples

See the `/docs/design-system/examples` folder for:
- Form layouts
- Card compositions
- Navigation patterns
- Modal dialogs
- Loading states
- Error handling

## Contributing

When adding new components:

1. Follow the atomic design structure
2. Include TypeScript types
3. Add accessibility features
4. Document with examples
5. Test in light and dark modes
6. Ensure responsive behavior

## Support

For questions or issues, refer to:
- Design tokens: `/tailwind.config.ts`
- Component source: `/src/renderer/components/design-system`
- Full design spec: `/DESIGN-SYSTEM.md`

---

**Version:** 1.0.0
**Last Updated:** October 22, 2025

**"Simple, functional, beautiful. That's Perpetua."**
