# Larinova MVP - Design Guidelines

## Design Philosophy

**Brutalist Monochrome Design** - Clean, bold, professional, and purposeful.

### Core Principles
1. **Monochrome Only**: Black and white, no colors
2. **Sharp Edges**: No rounded corners (border-radius: 0px)
3. **Bold Typography**: Uppercase headings, clear hierarchy
4. **Border-Based**: Use borders instead of shadows
5. **Functional First**: Every element serves a purpose
6. **High Contrast**: Maximum readability

---

## Color Palette

```css
/* Primary Colors */
--background: #FFFFFF;
--foreground: #000000;
--border: #000000;

/* Shades */
--gray-50: #F9F9F9;
--gray-100: #F3F3F3;
--gray-200: #E5E5E5;
--gray-300: #D4D4D4;
--gray-400: #A3A3A3;
--gray-500: #737373;
--gray-600: #525252;
--gray-700: #404040;
--gray-800: #262626;
--gray-900: #171717;

/* Interactive States */
--hover-bg: #000000;
--hover-text: #FFFFFF;
--active-bg: #171717;
--disabled-bg: #E5E5E5;
--disabled-text: #A3A3A3;
```

### Usage Rules
- **Black (#000000)**: Primary actions, headings, borders, active states
- **White (#FFFFFF)**: Backgrounds, text on black
- **Gray shades**: Secondary information, disabled states, subtle backgrounds

---

## Typography

### Fonts

```typescript
// Font configuration
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const bebas = localFont({
  src: '../public/fonts/BebasNeue-Regular.ttf',
  variable: '--font-bebas',
});
```

### Font Hierarchy

```css
/* Display Text (Bebas Neue) */
.font-display {
  font-family: var(--font-bebas);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Headings */
.text-display-xl { font-size: 4rem; }    /* 64px - Hero */
.text-display-lg { font-size: 3rem; }    /* 48px - Page Title */
.text-display-md { font-size: 2rem; }    /* 32px - Section */
.text-display-sm { font-size: 1.5rem; }  /* 24px - Subsection */

/* Body Text (Inter) */
.text-lg { font-size: 1.125rem; }  /* 18px */
.text-base { font-size: 1rem; }     /* 16px */
.text-sm { font-size: 0.875rem; }  /* 14px */
.text-xs { font-size: 0.75rem; }   /* 12px */
```

### Usage Guidelines

**Headings**
- Always use Bebas Neue font
- Always uppercase
- Always use tracking-wide (letter-spacing)

```tsx
<h1 className="text-display-lg font-display uppercase tracking-wide">
  PATIENT DASHBOARD
</h1>
```

**Body Text**
- Use Inter font
- Use uppercase for emphasis only
- Normal letter-spacing

```tsx
<p className="text-base">
  This is regular body text with normal casing.
</p>

<p className="text-sm uppercase tracking-wider">
  THIS IS EMPHASIZED TEXT
</p>
```

---

## Components

### Buttons

#### Primary Button
```tsx
<button className="
  px-6 py-3
  bg-black text-white
  border border-black
  uppercase tracking-wider text-sm font-semibold
  hover:bg-white hover:text-black
  transition-colors duration-300
  focus-ring
">
  PRIMARY ACTION
</button>
```

#### Secondary Button
```tsx
<button className="
  px-6 py-3
  bg-white text-black
  border border-black
  uppercase tracking-wider text-sm font-semibold
  hover:bg-black hover:text-white
  transition-colors duration-300
  focus-ring
">
  SECONDARY ACTION
</button>
```

#### Disabled Button
```tsx
<button
  disabled
  className="
    px-6 py-3
    bg-gray-200 text-gray-400
    border border-gray-300
    uppercase tracking-wider text-sm font-semibold
    cursor-not-allowed
  "
>
  DISABLED
</button>
```

---

### Input Fields

```tsx
<input
  type="text"
  className="
    w-full px-4 py-3
    border border-black
    focus:outline-none focus:ring-2 focus:ring-black
    text-base
  "
  placeholder="ENTER TEXT..."
/>
```

With Label:
```tsx
<div className="space-y-2">
  <label className="text-sm uppercase tracking-wider font-semibold">
    PATIENT NAME
  </label>
  <input
    type="text"
    className="
      w-full px-4 py-3
      border border-black
      focus:outline-none focus:ring-2 focus:ring-black
    "
  />
</div>
```

---

### Cards

#### Basic Card
```tsx
<div className="
  border border-black
  p-6
  bg-white
  hover:border-2
  transition-all duration-300
">
  <h3 className="text-display-sm font-display uppercase mb-4">
    CARD TITLE
  </h3>
  <p className="text-base">
    Card content goes here.
  </p>
</div>
```

#### Stat Card
```tsx
<div className="
  border border-black
  p-6
  bg-white
">
  <div className="text-4xl font-display">
    124
  </div>
  <div className="text-sm uppercase tracking-wider text-gray-600 mt-2">
    TOTAL PATIENTS
  </div>
</div>
```

---

### Tables

```tsx
<div className="border border-black">
  <table className="w-full">
    <thead className="bg-black text-white">
      <tr>
        <th className="px-6 py-4 text-left uppercase tracking-wider text-sm">
          Name
        </th>
        <th className="px-6 py-4 text-left uppercase tracking-wider text-sm">
          ID
        </th>
        <th className="px-6 py-4 text-left uppercase tracking-wider text-sm">
          Status
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-t border-black hover:bg-gray-50">
        <td className="px-6 py-4">John Doe</td>
        <td className="px-6 py-4">KP-2026-0001</td>
        <td className="px-6 py-4">
          <span className="uppercase text-xs tracking-wider">Active</span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### Sidebar Navigation

```tsx
<aside className="
  w-64 h-screen
  border-r border-black
  bg-white
  flex flex-col
">
  {/* Logo */}
  <div className="p-6 border-b border-black">
    <h1 className="text-2xl font-display uppercase tracking-wide">
      Larinova
    </h1>
  </div>

  {/* Navigation Items */}
  <nav className="flex-1 py-6">
    <a href="/dashboard" className="
      flex items-center gap-3
      px-6 py-3
      border-l-4 border-black
      bg-gray-50
      uppercase text-sm tracking-wider font-semibold
    ">
      <HomeIcon className="w-5 h-5" />
      HOME
    </a>

    <a href="/patients" className="
      flex items-center gap-3
      px-6 py-3
      border-l-4 border-transparent
      hover:border-black hover:bg-gray-50
      uppercase text-sm tracking-wider
      transition-colors
    ">
      <UsersIcon className="w-5 h-5" />
      PATIENTS
    </a>
  </nav>

  {/* User Section */}
  <div className="p-6 border-t border-black">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 border border-black bg-gray-100" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">
          Dr. John Smith
        </div>
        <div className="text-xs text-gray-600 uppercase">
          Cardiologist
        </div>
      </div>
    </div>
  </div>
</aside>
```

---

### Search Bar

```tsx
<div className="relative">
  <input
    type="text"
    placeholder="SEARCH PATIENTS..."
    className="
      w-full pl-12 pr-4 py-3
      border border-black
      focus:ring-2 focus:ring-black focus:outline-none
      uppercase text-sm tracking-wider
    "
  />
  <SearchIcon className="
    absolute left-4 top-1/2 -translate-y-1/2
    w-5 h-5
  " />
</div>
```

---

### Badges

```tsx
{/* Status Badge */}
<span className="
  inline-block px-3 py-1
  border border-black
  text-xs uppercase tracking-wider font-semibold
">
  ACTIVE
</span>

{/* Count Badge */}
<span className="
  inline-flex items-center justify-center
  w-6 h-6
  bg-black text-white
  text-xs font-bold
">
  5
</span>
```

---

### Modal/Dialog

```tsx
<div className="
  fixed inset-0
  bg-black/50
  flex items-center justify-center
  z-50
">
  <div className="
    w-full max-w-lg
    bg-white
    border-4 border-black
    p-8
  ">
    <h2 className="text-display-md font-display uppercase mb-6">
      CONFIRM ACTION
    </h2>

    <p className="text-base mb-6">
      Are you sure you want to proceed?
    </p>

    <div className="flex gap-4">
      <button className="flex-1 px-6 py-3 bg-black text-white border border-black">
        CONFIRM
      </button>
      <button className="flex-1 px-6 py-3 bg-white text-black border border-black">
        CANCEL
      </button>
    </div>
  </div>
</div>
```

---

### Loading States

#### Spinner
```tsx
<div className="
  w-12 h-12
  border-4 border-black border-t-transparent
  rounded-full
  animate-spin
">
</div>
```

#### Skeleton
```tsx
<div className="space-y-4">
  <div className="h-8 bg-gray-200 border border-gray-300" />
  <div className="h-4 bg-gray-200 border border-gray-300 w-3/4" />
  <div className="h-4 bg-gray-200 border border-gray-300 w-1/2" />
</div>
```

---

## Layout Patterns

### Dashboard Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Stat cards */}
</div>
```

### Two-Column Layout
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  <div className="lg:col-span-2">
    {/* Main content */}
  </div>
  <div className="lg:col-span-1">
    {/* Sidebar content */}
  </div>
</div>
```

### List with Actions
```tsx
<div className="space-y-4">
  {items.map(item => (
    <div className="
      flex items-center justify-between
      border border-black
      p-4
      hover:border-2
      transition-all
    ">
      <div className="flex-1">
        {/* Item content */}
      </div>
      <div className="flex gap-2">
        {/* Action buttons */}
      </div>
    </div>
  ))}
</div>
```

---

## Icons

Use **Lucide React** icons consistently:

```bash
npm install lucide-react
```

```tsx
import {
  Home,
  Users,
  Calendar,
  FileText,
  Settings,
  Search,
  Plus,
  X,
  Check,
  ChevronRight,
  ArrowRight,
  Mic,
  MicOff,
} from 'lucide-react';

// Usage
<Home className="w-5 h-5" />
```

### Icon Guidelines
- **Size**: w-5 h-5 (20px) for navigation, w-4 h-4 (16px) for inline
- **Color**: Inherit from parent text color
- **Stroke Width**: Default (2px)

---

## Spacing System

Use Tailwind's spacing scale consistently:

```css
/* Padding/Margin */
p-2   /* 8px */
p-4   /* 16px */
p-6   /* 24px */
p-8   /* 32px */
p-12  /* 48px */

/* Gaps */
gap-2  /* 8px */
gap-4  /* 16px */
gap-6  /* 24px */
gap-8  /* 32px */
```

### Layout Spacing Rules
- **Card padding**: p-6
- **Modal padding**: p-8
- **Section spacing**: space-y-8 or space-y-12
- **Grid gaps**: gap-4 (mobile), gap-6 (desktop)

---

## Animations & Transitions

### Hover Effects
```tsx
// Button hover
className="transition-colors duration-300 hover:bg-black hover:text-white"

// Border hover
className="transition-all duration-300 hover:border-2"

// Scale hover (use sparingly)
className="transition-transform duration-200 hover:scale-105"
```

### Focus States
```tsx
// Custom focus ring utility
.focus-ring {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2;
}
```

---

## Responsive Design

### Breakpoints
```css
sm:  640px   /* Mobile landscape */
md:  768px   /* Tablet */
lg:  1024px  /* Desktop */
xl:  1280px  /* Large desktop */
2xl: 1536px  /* Extra large */
```

### Mobile-First Approach
```tsx
// Stack on mobile, side-by-side on desktop
<div className="
  flex flex-col lg:flex-row
  gap-4 lg:gap-8
">
  {/* Content */}
</div>

// Hide on mobile, show on desktop
<div className="hidden lg:block">
  {/* Desktop only */}
</div>

// Full width on mobile, fixed on desktop
<div className="w-full lg:w-64">
  {/* Responsive width */}
</div>
```

---

## Accessibility

### ARIA Labels
```tsx
<button aria-label="Close dialog">
  <X className="w-5 h-5" />
</button>
```

### Keyboard Navigation
- All interactive elements should be keyboard accessible
- Use `focus-ring` utility for visible focus states
- Logical tab order

### Screen Readers
```tsx
<span className="sr-only">Additional context for screen readers</span>
```

---

## Best Practices

### DO ✅
- Use uppercase for emphasis and headings
- Maintain high contrast (black text on white, white text on black)
- Use borders instead of shadows
- Keep layouts clean and spacious
- Use consistent spacing (4px, 8px, 16px, 24px, 32px)
- Make interactive elements obvious (borders, hover states)

### DON'T ❌
- Don't use rounded corners (always border-radius: 0)
- Don't use colors other than black, white, and grays
- Don't use drop shadows or blur effects
- Don't use decorative fonts
- Don't overcrowd layouts
- Don't make text too small (minimum 14px)

---

## Component Library Reference

All components should be built with **Shadcn UI** as the base, then customized to match this design system.

### Customizing Shadcn Components

After installing a Shadcn component:

1. Remove rounded corners
2. Change colors to black/white
3. Update borders to solid black
4. Make text uppercase where appropriate
5. Adjust padding/spacing

Example:
```tsx
// Default Shadcn Button
<Button>Click me</Button>

// Customized for Larinova
<Button className="
  rounded-none
  border-black
  uppercase tracking-wider
">
  CLICK ME
</Button>
```

---

## Design Checklist

Before implementing any UI component:

- [ ] Uses only black, white, and gray colors
- [ ] No rounded corners (border-radius: 0)
- [ ] Uppercase text for headings/emphasis
- [ ] Proper letter-spacing (tracking-wider)
- [ ] Black borders (1px or 2px)
- [ ] Consistent spacing (using Tailwind scale)
- [ ] Accessible (keyboard navigation, ARIA labels)
- [ ] Responsive (mobile-first approach)
- [ ] Proper hover/focus states
- [ ] Uses Lucide icons consistently

---

**Document Version:** 1.0
**Last Updated:** January 23, 2026
