# Component Examples

## Button

### Variants

```tsx
import { Button } from './components/design-system';

// Primary (default)
<Button variant="primary">Start Journey</Button>

// Secondary
<Button variant="secondary">Cancel</Button>

// Ghost
<Button variant="ghost">Learn More</Button>

// Danger
<Button variant="danger">Delete</Button>
```

### Sizes

```tsx
<Button size="small">Small</Button>
<Button size="medium">Medium</Button>
<Button size="large">Large</Button>
```

### With Icons

```tsx
import { SearchIcon } from './components/design-system';

<Button icon={<SearchIcon size="sm" />} iconPosition="left">
  Search
</Button>

<Button icon={<SearchIcon size="sm" />} iconPosition="right">
  Next
</Button>
```

### Loading State

```tsx
<Button loading>Processing...</Button>
```

### Full Width

```tsx
<Button fullWidth>Continue</Button>
```

## Input

### Basic Input

```tsx
import { Input } from './components/design-system';

<Input
  placeholder="Enter your name"
  label="Name"
  helperText="Your full name"
/>
```

### With Icons

```tsx
import { SearchIcon } from './components/design-system';

<Input
  leftIcon={<SearchIcon size="sm" />}
  placeholder="Search journeys..."
/>
```

### Error State

```tsx
<Input
  label="Email"
  error="Please enter a valid email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### Full Width

```tsx
<Input
  fullWidth
  label="Journey starting point"
  placeholder="What should we explore?"
/>
```

## Card

### Basic Card

```tsx
import { Card } from './components/design-system';

<Card>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>
```

### Variants

```tsx
// Default (with border)
<Card variant="default">Content</Card>

// Elevated (with shadow)
<Card variant="elevated">Content</Card>

// Outlined (bold border)
<Card variant="outlined">Content</Card>
```

### Padding Options

```tsx
<Card padding="none">No padding</Card>
<Card padding="small">Small padding</Card>
<Card padding="medium">Medium padding</Card>
<Card padding="large">Large padding</Card>
```

### Hoverable

```tsx
<Card hoverable onClick={() => console.log('clicked')}>
  Click me!
</Card>
```

## Badge

### Variants

```tsx
import { Badge } from './components/design-system';

<Badge variant="default">Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="info">Info</Badge>
```

### With Dot

```tsx
<Badge variant="success" dot>Active</Badge>
```

### Sizes

```tsx
<Badge size="small">Small</Badge>
<Badge size="medium">Medium</Badge>
<Badge size="large">Large</Badge>
```

## Icon

### Built-in Icons

```tsx
import {
  SearchIcon,
  CheckIcon,
  XIcon,
  LoaderIcon,
  AlertCircleIcon,
  InfoIcon,
} from './components/design-system';

<SearchIcon size="md" />
<CheckIcon size="md" />
<LoaderIcon size="md" /> // Animated spinner
```

### Custom Icon

```tsx
import { Icon } from './components/design-system';

<Icon size="md">
  <path d="M12 2L2 7l10 5 10-5-10-5z" />
  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
</Icon>
```

## InputGroup

### Search Bar

```tsx
import { InputGroup } from './components/design-system';
import { SearchIcon } from './components/design-system';

<InputGroup
  placeholder="Search..."
  leftIcon={<SearchIcon size="sm" />}
  buttonText="Search"
  onButtonClick={handleSearch}
/>
```

### With Button Props

```tsx
<InputGroup
  placeholder="Enter email"
  buttonText="Subscribe"
  buttonProps={{ variant: 'primary', size: 'medium' }}
  onButtonClick={handleSubscribe}
/>
```

## CardHeader

### Basic Header

```tsx
import { CardHeader } from './components/design-system';

<Card>
  <CardHeader
    title="Journey Settings"
    subtitle="Configure your exploration preferences"
  />
</Card>
```

### With Icon and Action

```tsx
import { SearchIcon, IconButton, XIcon } from './components/design-system';

<Card>
  <CardHeader
    icon={<SearchIcon size="md" />}
    title="Active Journey"
    subtitle="Exploring quantum computing"
    action={
      <IconButton
        icon={<XIcon size="sm" />}
        label="Close"
        variant="ghost"
        size="small"
      />
    }
  />
</Card>
```

## IconButton

### Basic Usage

```tsx
import { IconButton, SearchIcon } from './components/design-system';

<IconButton
  icon={<SearchIcon size="sm" />}
  label="Search"
  onClick={handleSearch}
/>
```

### With Variants

```tsx
<IconButton
  icon={<XIcon size="sm" />}
  label="Close"
  variant="ghost"
/>

<IconButton
  icon={<CheckIcon size="sm" />}
  label="Confirm"
  variant="primary"
/>
```

## Complex Examples

### Login Form

```tsx
import {
  Card,
  CardHeader,
  Input,
  Button,
  Badge,
} from './components/design-system';

function LoginForm() {
  return (
    <Card padding="large" className="max-w-md mx-auto">
      <CardHeader
        title="Welcome Back"
        subtitle="Sign in to continue your journey"
      />

      <div className="mt-6 space-y-4">
        <Input
          fullWidth
          label="Email"
          type="email"
          placeholder="you@example.com"
        />

        <Input
          fullWidth
          label="Password"
          type="password"
          placeholder="••••••••"
        />

        <Button fullWidth variant="primary">
          Sign In
        </Button>

        <Button fullWidth variant="ghost">
          Create Account
        </Button>
      </div>
    </Card>
  );
}
```

### Status Dashboard

```tsx
import {
  Card,
  CardHeader,
  Badge,
  IconButton,
  InfoIcon,
} from './components/design-system';

function StatusCard() {
  return (
    <Card hoverable>
      <CardHeader
        title="Journey Status"
        subtitle="Last updated 2 minutes ago"
        action={
          <Badge variant="success" dot>
            Running
          </Badge>
        }
      />

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <InfoIcon size="sm" />
          <span className="text-sm">8 stages completed</span>
        </div>
      </div>
    </Card>
  );
}
```

### Settings Panel

```tsx
import {
  Card,
  CardHeader,
  Input,
  Button,
  Badge,
} from './components/design-system';

function SettingsPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Journey Settings"
          subtitle="Configure exploration preferences"
        />

        <div className="mt-6 space-y-4">
          <Input
            fullWidth
            label="Max Stages"
            type="number"
            defaultValue="50"
            helperText="Maximum stages per journey"
          />

          <Input
            fullWidth
            label="Stage Delay (ms)"
            type="number"
            defaultValue="2000"
            helperText="Delay between stages"
          />

          <div className="flex justify-end gap-2">
            <Button variant="secondary">Reset</Button>
            <Button variant="primary">Save Changes</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

## Theme Toggle Example

```tsx
import { useTheme, Button, Badge } from './components/design-system';

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Badge variant="info">{resolvedTheme} mode</Badge>

      <Button
        variant="ghost"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      >
        Toggle Theme
      </Button>
    </div>
  );
}
```

## Responsive Example

```tsx
function ResponsiveLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.id} hoverable>
          <CardHeader title={item.title} subtitle={item.subtitle} />
        </Card>
      ))}
    </div>
  );
}
```

---

For more examples, see the full design system documentation.
