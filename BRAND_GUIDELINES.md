# Infinity Legal — Brand Guidelines v2.0

> **Last Updated:** February 2026 | **Version:** 2.0  
> **Design System Files:** `tailwind.config.js`, `globals.css`

---

## 1. Logo & Visual Identity

### Primary Logo
| Asset | Path | Format | Usage |
|-------|------|--------|-------|
| Logo (Raster) | `/public/logo.png` | PNG | Navigation, footer, emails |
| Logo (Vector) | `/public/logo.svg` | SVG | Watermark, print, scalable use |

**Design Elements:**
- **Infinity symbol (∞)** — Unlimited legal support
- **Classical pillar** — Justice, stability, legal tradition
- **Intertwined design** — Modern AI meets traditional practice

### Logo Usage Rules
- **Minimum clear space:** Equal to the logo height on all sides
- **Minimum size:** 36px height (web), 0.5″ (print)
- **Do not** rotate, skew, stretch, or recolor the logo
- **Preferred backgrounds:** White, cream, light — avoid busy imagery behind it

### SVG Watermark
The SVG logo is applied as a subtle, fixed-position background watermark across the entire application via the `.watermark` CSS class in `globals.css`. It renders at **3.5% opacity**, centered, and is non-interactive.

```css
/* Applied to root layout wrapper */
.watermark::before {
  opacity: 0.035;
  background-image: url('/logo.svg');
  /* Fixed position, centered, 60vw max 700px */
}
```

---

## 2. Color Palette

### Primary Brand Colors

#### Infinity Navy
| Property | Value |
|----------|-------|
| HEX | `#1a365d` |
| Tailwind | `infinity-navy` |
| CSS Variable | `--infinity-navy` |
| HSL (shadcn) | `215 55% 23%` |

**Usage:** Primary buttons, headings, navigation text, body emphasis, CTA backgrounds.

#### Infinity Navy Light
| Property | Value |
|----------|-------|
| HEX | `#2c5282` |
| Tailwind | `infinity-navy-light` |
| CSS Variable | `--infinity-navy-light` |

**Usage:** Button hover states, gradient endpoints, secondary navy needs.

#### Infinity Gold
| Property | Value |
|----------|-------|
| HEX | `#d4af37` |
| Tailwind | `infinity-gold` |
| CSS Variable | `--infinity-gold` |
| HSL (shadcn) | `43 65% 52%` |

**Usage:** Secondary CTAs, accent text, trust indicators, star ratings, highlighted numbers, border accents (at 10-30% opacity).

#### Infinity Gold Light
| Property | Value |
|----------|-------|
| HEX | `#f6e05e` |
| Tailwind | `infinity-gold-light` |

**Usage:** Gold button hover states, gradient endpoints.

### Neutral Colors

| Name | HEX | Tailwind | Usage |
|------|-----|----------|-------|
| Cream | `#f9fafb` | `infinity-cream` | Page backgrounds, section alternation |
| Gray 50 | `#f9fafb` | `infinity-gray-50` | Light backgrounds |
| Gray 100 | `#f3f4f6` | `infinity-gray-100` | Borders, dividers |
| Gray 900 | `#111827` | `infinity-gray-900` | Heavy text (rare) |

### Semantic Colors

| Name | HEX | Tailwind | Usage |
|------|-----|----------|-------|
| Success | `#059669` | `infinity-success` | Confirmations, positive indicators |
| Error | `#dc2626` | `infinity-error` | Errors, emergency alerts, destructive actions |
| Warning | `#d97706` | `infinity-warning` | Cautions, pending states |

### Brand Gradients

```css
/* Navy gradient — CTA sections, footers */
.bg-brand-gradient {
  background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
}

/* Gold gradient — accent highlights */
.bg-gold-gradient {
  background: linear-gradient(135deg, #d4af37 0%, #f6e05e 100%);
}
```

---

## 3. Typography

### Font Families

| Role | Font | Tailwind Class | CSS Variable | Fallbacks |
|------|------|---------------|--------------|-----------|
| **Display / Headings** | Playfair Display | `font-display` | `--font-display` | Georgia, serif |
| **Body / UI** | Inter | `font-sans` | `--font-primary` | -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif |
| **Code** | JetBrains Mono | `font-mono` | `--font-mono` | Fira Code, monospace |

### Heading Hierarchy

| Level | Font | Weight | Size (Desktop) | Tailwind |
|-------|------|--------|----------------|----------|
| H1 (Hero) | Playfair Display | Bold (700) | 3.5rem / 56px | `text-[3.5rem] font-display font-bold` |
| H2 (Section) | Playfair Display | Bold (700) | 2.25rem / 36px | `text-3xl sm:text-4xl font-display font-bold` |
| H3 (Card/Sub) | Playfair Display | Semibold (600) | 1.25rem / 20px | `text-xl font-display font-semibold` |
| Body | Inter | Regular (400) | 1rem / 16px | `font-sans` |
| Small | Inter | Regular (400) | 0.875rem / 14px | `text-sm font-sans` |
| Caption | Inter | Medium (500) | 0.75rem / 12px | `text-xs font-sans` |

### Typography Rules
- **All `<h1>`, `<h2>`, `<h3>` elements** automatically use Playfair Display via `globals.css`.
- Body text uses Inter by default via the `font-sans` class on `<body>`.
- Never use Playfair Display below `text-lg` — it's a display font, not a reading font.
- Line height: `leading-relaxed` for body text, `leading-tight` for headings.

---

## 4. Imagery

### Official Brand Photography

| Image | File | Placement | Purpose |
|-------|------|-----------|---------|
| Family Consultation | `/public/hero-consultation.png` | Hero section | Professional warmth, trust |
| Happy Family | `/public/happy-family.png` | Testimonials section | Community, multi-generational trust |
| Virtual Consultation | `/public/virtual-consultation.png` | How It Works section | Modern, tech-forward, accessible |
| Family with Attorney | `/public/family-attorney.png` | CTA section (background) | Personal connection, representation |

### Image Guidelines
- All images convey **warmth, approachability, and professionalism**.
- Prefer images showing **real-world, home-like settings** — not sterile offices.
- Use a `rounded-2xl` border radius and `shadow-xl` or `shadow-2xl` on image containers.
- Apply subtle gradient overlays where text overlaps images: `bg-gradient-to-t from-infinity-navy/10`.
- Always include descriptive, meaningful `alt` text for accessibility.

---

## 5. Component Patterns

### Buttons

#### Primary Button (Navy)
```jsx
<button className="px-7 py-3.5 bg-infinity-navy text-white rounded-xl text-base font-semibold hover:bg-infinity-navy-light shadow-lg hover:shadow-xl transition-all focus-brand">
  Apply for Legal Services →
</button>
```

#### Secondary Button (Gold)
```jsx
<button className="px-7 py-3.5 bg-infinity-gold text-infinity-navy rounded-xl text-base font-semibold hover:bg-infinity-gold-light shadow-sm hover:shadow-md transition-all focus-brand">
  Free AI Intake
</button>
```

#### Ghost/Outline Button
```jsx
<button className="px-8 py-4 bg-white/10 text-white border border-white/20 rounded-xl text-lg font-semibold hover:bg-white/20 shadow-lg hover:shadow-xl transition-all focus-brand backdrop-blur-sm">
  Book a Consultation
</button>
```

#### Emergency Button
```jsx
<button className="px-8 py-4 bg-infinity-error text-white rounded-xl text-lg font-semibold hover:bg-infinity-error/90 shadow-lg hover:shadow-xl transition-all focus-brand">
  Get Emergency Help Now
</button>
```

### Cards
```jsx
<div className="bg-white rounded-2xl p-8 border border-infinity-navy/10 shadow-sm hover:shadow-lg hover:border-infinity-gold/30 transition-all duration-300">
  {/* Card content */}
</div>
```

### Badges / Tags
```jsx
<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-infinity-gold/10 text-infinity-navy text-sm font-medium">
  <span className="w-2 h-2 bg-infinity-gold rounded-full animate-pulse"></span>
  24/7 AI-Powered Legal Help
</div>
```

### Input Fields
```jsx
<input className="w-full px-4 py-3 border border-infinity-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-infinity-gold focus:ring-offset-2 font-sans" />
```

---

## 6. Layout & Spacing

| Token | Value | Usage |
|-------|-------|-------|
| Container max-width | 1400px (`max-w-7xl`) | Page sections |
| Content max-width | 1152px (`max-w-6xl`) | Content grids |
| Narrow content | 896px (`max-w-4xl`) | Text-heavy sections |
| Container padding | `px-4 sm:px-6 lg:px-8` | Responsive padding |
| Section padding | `py-20 lg:py-24` | Vertical section spacing |
| Grid gap | `gap-5` to `gap-8` | Card grids |
| Border radius | `rounded-xl` (buttons), `rounded-2xl` (cards/images) | Corners |

### Section Backgrounds (Alternating)
1. `bg-gradient-to-br from-infinity-cream via-white to-infinity-gold/5` — Hero
2. `bg-white` — Standard sections
3. `bg-gradient-to-b from-infinity-cream to-white` — Feature sections
4. `bg-infinity-cream` — Alternating contrast
5. `bg-infinity-navy` with image overlay — CTA sections

---

## 7. Accessibility (WCAG 2.1 AA)

### Color Contrast Ratios
| Combination | Ratio | Level |
|-------------|-------|-------|
| Navy (#1a365d) on White (#fff) | 11.4:1 | ✅ AAA |
| Navy (#1a365d) on Cream (#f9fafb) | 10.8:1 | ✅ AAA |
| Gold (#d4af37) on Navy (#1a365d) | 4.5:1 | ✅ AA |
| White on Navy | 11.4:1 | ✅ AAA |
| Error (#dc2626) on White | 4.6:1 | ✅ AA |

### Focus States
- All interactive elements use `.focus-brand`: `focus:ring-2 focus:ring-infinity-gold focus:ring-offset-2`
- Uses `focus-visible` to avoid showing focus rings on mouse clicks
- Skip-to-content link provided for keyboard users

### Motion & Animation
- All animations respect `prefers-reduced-motion: reduce`
- Logo hover animation is subtle (scale + opacity shift)
- Pulse animations on badges are decorative only

### Landmarks & ARIA
- `<nav>` for navigation
- `<main>` for primary content
- `<footer>` for footer
- `<section>` with headings for each content block
- `aria-label` on icon-only buttons (e.g., notification bell)
- Meaningful `alt` text on all images

---

## 8. Don'ts

- ❌ Don't use gold text on white backgrounds (insufficient contrast)
- ❌ Don't use Playfair Display for body text or small UI labels
- ❌ Don't stretch, rotate, or recolor the logo
- ❌ Don't use colors outside the brand palette
- ❌ Don't place the logo on busy or dark backgrounds without a container
- ❌ Don't use font weights below 400 for body text
- ❌ Don't use `rounded-lg` for cards — use `rounded-2xl`
- ❌ Don't use `rounded-md` for buttons — use `rounded-xl`

---

## 9. File Reference

| File | Purpose |
|------|---------|
| `tailwind.config.js` | Brand colors, fonts, animations, theme tokens |
| `app/globals.css` | CSS variables, base styles, watermark, gradients |
| `public/logo.png` | Raster logo |
| `public/logo.svg` | Vector logo (watermark) |
| `public/hero-consultation.png` | Hero section image |
| `public/happy-family.png` | Testimonials section image |
| `public/virtual-consultation.png` | How It Works section image |
| `public/family-attorney.png` | CTA background image |

---

## 10. Implementation Status

| Feature | Status |
|---------|--------|
| Logo (PNG + SVG) | ✅ Complete |
| SVG Watermark | ✅ Complete |
| Color palette (Tailwind + CSS) | ✅ Complete |
| Dual typography (Playfair + Inter) | ✅ Complete |
| Landing page with brand images | ✅ Complete |
| Pricing page branded | ✅ Complete |
| AI Intake wizard branded | ✅ Complete |
| Attorney dashboard branded | ✅ Complete |
| Accessibility (WCAG 2.1 AA) | ✅ Complete |
| Skip-to-content link | ✅ Complete |
| Reduced motion support | ✅ Complete |
| Favicon | ⏳ Pending |
| Social media card (og:image) | ⏳ Pending |
| Email template branding | ⏳ Pending |
| Dark mode refinement | ⏳ Pending |

---

**Contact:** brand@infinitylegal.org  
**Design System:** See `tailwind.config.js` and `app/globals.css`
