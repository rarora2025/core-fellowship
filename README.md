# CORE Fellowship

Website for CORE Fellowship, a program by the Columbia Organization of Rising Entrepreneurs that matches Columbia students with early-stage startups.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Framer Motion · Lucide

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Structure

```
src/
  app/                  routes, layout, global styles and design tokens
  components/
    ui/                 shadcn/ui primitives (button, ...)
    site/               site chrome (navbar, logo)
    hero/               hero section and the connections visual
    motion/             shared easing curves
  content/site.ts       all copy and links in one place
  lib/utils.ts          cn() helper
```

## Design tokens

Defined in `src/app/globals.css`:

- Canvas `#ffffff`, ink `#0b0d12`, muted text `#5c6370`
- Columbia blue `#b9d9eb` with `columbia-soft`, `columbia-deep`, `columbia-ink` variants
- Type: Geist (sans) for UI and headlines, Instrument Serif italic for accents
- Fluid display sizes: `text-display`, `text-headline`, `text-lede`

## Content rules

No invented stats, testimonials, partner names, or program policies. Anything unconfirmed should be an obvious, editable placeholder in `src/content`.

## Status

- [x] Foundation, nav, hero
- [ ] How it works
- [ ] For students / for startups
- [ ] FAQ
- [ ] Student and startup application flows
