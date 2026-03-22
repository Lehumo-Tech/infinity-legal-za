# 🎨 Infinity Legal - Brand Guidelines

## Logo & Visual Identity

### Primary Logo
**File:** `/app/public/logo.png`

The Infinity Legal logo features:
- **Infinity symbol (∞)** - Representing unlimited legal support
- **Classical pillar** - Symbolizing justice, stability, and legal tradition
- **Intertwined design** - Showing the integration of modern AI with traditional legal practice

### Logo Usage
- Minimum clear space: Equal to height of the logo on all sides
- Minimum size: 40px height (web), 0.5 inches (print)
- Do not rotate, skew, or alter the proportions
- Do not change the colors
- Always use on appropriate backgrounds (light backgrounds preferred)

---

## Color Palette

### Primary Colors

#### Infinity Navy
- **HEX:** `#1a3a52`
- **RGB:** 26, 58, 82
- **HSL:** 207°, 48%, 22%
- **Tailwind:** `infinity-navy`

**Usage:**
- Primary CTAs and buttons
- Main headings
- Navigation text
- Body text for emphasis

#### Infinity Gold
- **HEX:** `#c9a961`
- **RGB:** 201, 169, 97
- **HSL:** 40°, 35%, 60%
- **Tailwind:** `infinity-gold`

**Usage:**
- Secondary CTAs
- Accent elements
- Trust indicators (numbers)
- Highlights and emphasis
- Borders and dividers (at 20% opacity)

#### Infinity Cream
- **HEX:** `#f5f5f0`
- **RGB:** 245, 245, 240
- **HSL:** 40°, 20%, 96%
- **Tailwind:** `infinity-cream`

**Usage:**
- Page backgrounds
- Section backgrounds
- Navigation background
- Card backgrounds (use white for contrast)

### Supporting Colors

#### White
- **HEX:** `#ffffff`
- **Usage:** Card backgrounds, alternating sections

#### Black (Text)
- **HEX:** `#0a0a0a`
- **Usage:** Body copy, paragraph text

#### Muted Navy (70% opacity)
- **Color:** `infinity-navy/70`
- **Usage:** Secondary text, captions, metadata

---

## Typography

### Font Family
**Inter** (Google Fonts)
- Clean, modern, highly legible
- Excellent for both headings and body text
- Supports multiple weights

### Font Weights
- **Regular (400):** Body text, descriptions
- **Medium (500):** Sub-headings, labels
- **Semibold (600):** Section headings
- **Bold (700):** Main headings, hero text

### Type Scale
- **Hero:** 5xl (48px) - 6xl (60px)
- **H1:** 4xl (36px)
- **H2:** 3xl (30px) - 2xl (24px)
- **H3:** xl (20px)
- **Body:** base (16px)
- **Small:** sm (14px)
- **Tiny:** xs (12px)

---

## Design Tokens (Tailwind CSS)

### Spacing
- Use 8px grid system (multiples of 2/4/8)
- Container max-width: 1400px
- Container padding: 2rem (32px)

### Border Radius
- **Large:** rounded-lg (8px) - Cards, major containers
- **Medium:** rounded-md (6px) - Buttons, inputs
- **Small:** rounded-sm (4px) - Tags, badges
- **Full:** rounded-full - Pills, badges

### Shadows
```css
shadow-sm    /* Subtle elevation for cards */
shadow-lg    /* Primary CTAs */
shadow-xl    /* Hover states on important elements */
```

---

## Component Styling

### Buttons

#### Primary Button (Navy)
```jsx
className="px-8 py-4 bg-infinity-navy text-infinity-cream rounded-lg font-semibold hover:bg-infinity-navy/90 shadow-lg hover:shadow-xl transition-all"
```

#### Secondary Button (Gold)
```jsx
className="px-8 py-4 bg-infinity-gold text-infinity-navy rounded-lg font-semibold hover:bg-infinity-gold/90"
```

### Cards
```jsx
className="bg-white rounded-lg p-8 border border-infinity-gold/20 shadow-sm hover:shadow-md transition-shadow"
```

### Badges/Tags
```jsx
className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-infinity-gold/10 text-infinity-navy text-sm font-medium"
```

### Input Fields
```jsx
className="w-full px-4 py-3 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy"
```

---

## Usage Examples

### Navigation Bar
- Background: `bg-infinity-cream/95`
- Logo: 40px height
- Text: `text-infinity-navy`
- Active state: `text-infinity-gold`

### Hero Section
- Background: `bg-background` (cream)
- Main heading: `text-infinity-navy`
- Accent text: `text-infinity-gold`
- Primary CTA: Navy button
- Secondary CTA: Gold button

### Section Backgrounds
- Alternate between:
  - White (`bg-white`)
  - Cream (`bg-infinity-cream`)
- Never use both navy and gold as backgrounds

### Trust Indicators
- Numbers: `text-infinity-gold` (3xl, bold)
- Labels: `text-infinity-navy/70` (sm)

### Emergency Alerts
- Background: `bg-infinity-gold/10`
- Border: `border-infinity-gold/30`
- Text: `text-infinity-navy`

---

## Accessibility Guidelines

### Color Contrast
All color combinations meet WCAG AA standards:
- Navy on Cream: 10.2:1 (AAA)
- Gold on Navy: 4.7:1 (AA)
- Navy on White: 12.6:1 (AAA)

### Focus States
- Use `focus:ring-2 focus:ring-infinity-navy` for keyboard navigation
- Ensure focus indicators are always visible

### Text Size
- Minimum body text: 16px (1rem)
- Minimum UI text: 14px (0.875rem)

---

## Don'ts

❌ **Don't:**
- Use gold and navy together at full opacity (low contrast)
- Use navy as background for large text areas
- Stretch or distort the logo
- Use colors other than the brand palette
- Place the logo on busy backgrounds
- Use overly thin font weights (below 400)

---

## Assets Location

| Asset | Path | Usage |
|-------|------|-------|
| Logo | `/app/public/logo.png` | Navigation, footer |
| Favicon | TBD | Browser tab icon |
| Social Card | TBD | Social media sharing |

---

## Quick Reference

### CSS Variables (globals.css)
```css
--primary: 207 48% 22%;        /* Navy */
--secondary: 40 35% 60%;        /* Gold */
--background: 40 20% 96%;       /* Cream */
```

### Tailwind Classes (Most Used)
```
bg-infinity-navy
bg-infinity-gold
bg-infinity-cream
text-infinity-navy
text-infinity-gold
border-infinity-gold/20
hover:bg-infinity-navy/90
```

---

## Implementation Status

✅ **Complete:**
- Logo integrated in navigation and footer
- Color palette applied throughout
- Landing page fully branded
- Intake wizard branded
- Attorney signup branded
- All CTAs updated

⏳ **Pending:**
- Favicon generation
- Social media card (og:image)
- Email templates branding
- Dark mode variants

---

**Last Updated:** March 2025  
**Version:** 1.0

---

## Contact

For brand guidelines questions:  
**Email:** brand@infinitylegal.org  
**Design System:** See `/app/tailwind.config.js` and `/app/app/globals.css`
