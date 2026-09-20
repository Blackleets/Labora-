# Theme — Labora+ Ghibli meadow (warm parchment, NOT dark SaaS)

## Compact tokens (budget-first)
| Token | Value | Role |
|---|---|---|
| ink | `#1E2A24` | body text |
| ink-soft | `#2A332E` | secondary text |
| primary / forest | `#2F5D4A` | brand green |
| primary-2 / moss | `#3B7258` | mid green |
| clay | `#C96846` | CTA terracotta |
| clay-deep | `#B55738` | CTA pressed |
| gold | `#B87A24` | accent |
| gold-soft | `#E8D48A` | soft gold |
| canvas | `#F7F3EA` | app bg |
| surface | `#FFFEFB` | cards / inputs |
| surface-2 | `#F0EBE1` | muted surface |
| border | `#E8DFC8` | parchment border |
| muted | `#6B645C` | labels |
| soft-green | `#EBF3ED` | green pill |
| soft-clay | `#FAF3EE` | clay pill |
| parchment | `#FAF6EE` | hero / welcome |
| sun-fill | `#F7BA55` | meadow sun |
| sun-glow | `#FAD082` | sun halo |
| radius | `22px` / sm `14px` | rounded-2xl feel |
| shadow | `0 20px 60px rgba(47,93,74,0.10)` | soft forest shadow |

**Atmosphere:** `GhibliAtmosphereContext` overrides `--ghibli-*` CSS vars by time-of-day (dawn/midday/golden_hour/night) + season. Spanish UI copy. Serif headlines + sans body. Cream parchment auth card over illustrated meadow — never dark OS chrome / slate SaaS.

**Fonts:** system/Tailwind `font-sans` + `font-serif` for titles. Lucide icons.

**Do NOT:** dark zinc backgrounds, glassmorphism cyber, neon accents, Inter-only startup look.

## Raw — `index.css`
```css
:root {
  --labora-ink: #1E2A24;
  --labora-ink-soft: #2A332E;
  --labora-primary: #2F5D4A;
  --labora-primary-2: #3B7258;
  --labora-primary-3: #4A8568;
  --labora-clay: #C96846;
  --labora-clay-deep: #B55738;
  --labora-gold: #B87A24;
  --labora-gold-soft: #E8D48A;
  --labora-canvas: #F7F3EA;
  --labora-surface: #FFFEFB;
  --labora-surface-2: #F0EBE1;
  --labora-border: #E8DFC8;
  --labora-muted: #6B645C;
  --labora-soft-green: #EBF3ED;
  --labora-soft-clay: #FAF3EE;
  --labora-shadow: 0 20px 60px rgba(47, 93, 74, 0.10);
  --labora-shadow-soft: 0 10px 32px rgba(47, 93, 74, 0.06);
  --labora-shadow-glow: 0 0 0 1px rgba(184, 122, 36, 0.12), 0 18px 48px rgba(47, 93, 74, 0.10);
  --labora-radius: 22px;
  --labora-radius-sm: 14px;

  /* Ghibli atmosphere fallbacks (overridden by GhibliAtmosphereContext) */
  --ghibli-forest: #2F5D4A;
  --ghibli-deepforest: #213B2F;
  --ghibli-moss: #3B7258;
  --ghibli-softgreen: #EBF3ED;
  --ghibli-bordergreen: #D0E5D7;
  --ghibli-clay: #C96846;
  --ghibli-terracotta: #D97757;
  --ghibli-warmearth: #FAF3EE;
  --ghibli-borderclay: #EAD6C9;
  --ghibli-amber: #D9943B;
  --ghibli-gold: #B87A24;
  --ghibli-softamber: #FEF7EB;
  --ghibli-borderamber: #FDE3B8;
  --ghibli-canvas: #F7F3EA;
  --ghibli-card: #FCFAF7;
  --ghibli-parchment: #FAF6EE;
  --ghibli-border: #E8DFC8;
  --ghibli-border-subtle: #EBE4D8;
  --ghibli-sun-fill: #F7BA55;
  --ghibli-sun-glow: #FAD082;
  --ghibli-ambient-gradient: radial-gradient(circle at 80% 20%, rgba(250, 208, 130, 0.10) 0%, rgba(250, 246, 238, 0.04) 60%, transparent 100%);
}

html {
  background: var(--ghibli-canvas, var(--labora-canvas));
  color: var(--labora-ink);
}

body:not(.dark) {
  background:
    radial-gradient(ellipse 80% 50% at 10% -10%, rgba(184, 122, 36, 0.10), transparent 50%),
    radial-gradient(ellipse 70% 45% at 100% 0%, rgba(47, 93, 74, 0.08), transparent 48%),
    radial-gradient(ellipse 50% 40% at 50% 100%, rgba(201, 104, 70, 0.05), transparent 45%),
    var(--ghibli-canvas, var(--labora-canvas));
  color: var(--labora-ink);
  font-feature-settings: 'ss01' on, 'cv11' on;
}

body:not(.dark) .bg-white {
  background-color: var(--labora-surface) !important;
}

body:not(.dark) main {
  background: transparent !important;
}

body:not(.dark) main > header {
  background: color-mix(in srgb, var(--labora-surface) 90%, transparent) !important;
  border-color: rgba(47, 93, 74, 0.08) !important;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.85) inset;
  backdrop-filter: blur(16px);
}

body:not(.dark) aside {
  /* Component sets its own warm gradient; keep fallback soft */
  border-color: var(--ghibli-border, rgba(47, 93, 74, 0.08)) !important;
}

body:not(.dark) main > nav {
  background: rgba(255, 254, 251, 0.94) !important;
  border-color: rgba(47, 93, 74, 0.08) !important;
  box-shadow: 0 -16px 48px rgba(47, 93, 74, 0.05);
  backdrop-filter: blur(18px);
}

::selection {
  background: rgba(184, 122, 36, 0.22);
  color: var(--labora-ink);
}

button, a, input, select, textarea {
  -webkit-tap-highlight-color: transparent;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid rgba(47, 93, 74, 0.55);
  outline-offset: 2px;
}

/* Soft parchment / meadow hero — not dark OS chrome */
.labora-hero {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--ghibli-border, #E8DFC8);
  border-radius: calc(var(--labora-radius) + 8px);
  background:
    radial-gradient(circle at 88% 10%, color-mix(in srgb, var(--ghibli-sun-glow, #FAD082) 70%, transparent), transparent 34%),
    radial-gradient(ellipse at 18% 0%, color-mix(in srgb, #C9DDEE 55%, transparent), transparent 42%),
    radial-gradient(circle at 8% 92%, color-mix(in srgb, var(--ghibli-softgreen, #EBF3ED) 90%, transparent), transparent 40%),
    radial-gradient(ellipse at 70% 100%, color-mix(in srgb, var(--ghibli-moss, #3B7258) 16%, transparent), transparent 48%),
    linear-gradient(155deg, var(--ghibli-parchment, #FAF6EE) 0%, #F3F6EC 38%, var(--ghibli-warmearth, #FAF3EE) 62%, var(--ghibli-softgreen, #EBF3ED) 100%);
  color: var(--labora-ink);
  box-shadow: var(--labora-shadow-soft);
}

.labora-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(ellipse at 72% 16%, rgba(255, 255, 255, 0.5), transparent 48%),
    linear-gradient(180deg, transparent 55%, color-mix(in srgb, var(--ghibli-softgreen, #EBF3ED) 35%, transparent) 100%);
  pointer-events: none;
  z-index: 0;
}

.labora-hero::after {
  content: '';
  position: absolute;
  width: 420px;
  height: 280px;
  right: -80px;
  bottom: -120px;
  border-radius: 50%;
  background:
    radial-gradient(circle, color-mix(in srgb, var(--ghibli-moss, #3B7258) 22%, transparent), transparent 68%);
  pointer-events: none;
  z-index: 0;
}

.labora-card {
  border: 1px solid var(--ghibli-border, rgba(47, 93, 74, 0.08));
  background: color-mix(in srgb, var(--labora-surface) 94%, white);
  border-radius: var(--labora-radius);
  box-shadow: var(--labora-shadow-soft);
  backdrop-filter: blur(10px);
}

.labora-card-premium {
  border: 1px solid var(--ghibli-border, rgba(47, 93, 74, 0.08));
  background:
    linear-gradient(180deg, rgba(255,254,251,0.98), rgba(251,247,240,0.96));
  border-radius: calc(var(--labora-radius) + 4px);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.9) inset,
    var(--labora-shadow);
}

.labora-card-interactive {
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.labora-card-interactive:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--ghibli-forest, #2F5D4A) 22%, transparent);
  box-shadow: 0 18px 50px rgba(47, 93, 74, 0.10);
}

.labora-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  border: 1px solid var(--ghibli-bordergreen, #D0E5D7);
  background: color-mix(in srgb, var(--ghibli-softgreen, #EBF3ED) 85%, white);
  padding: 0.35rem 0.75rem;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ghibli-forest, #2F5D4A);
}

.labora-kicker {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.labora-display {
  font-family: 'Fraunces', Georgia, serif;
  letter-spacing: -0.03em;
  font-optical-sizing: auto;
}

.labora-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(47,93,74,0.12), transparent);
}

.labora-soft-grid {
  background-image:
    linear-gradient(rgba(47, 93, 74, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(47, 93, 74, 0.03) 1px, transparent 1px);
  background-size: 28px 28px;
}

.labora-btn-primary {
  background: linear-gradient(180deg, #3B7258, #2F5D4A);
  color: #fff;
  box-shadow: 0 10px 28px rgba(47, 93, 74, 0.22);
}

.labora-btn-accent {
  background: linear-gradient(180deg, #D97757, #C96846);
  color: #fff;
  box-shadow: 0 10px 28px rgba(201, 104, 70, 0.24);
}

.labora-gold-line {
  height: 2px;
  width: 48px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--labora-gold), transparent);
}

/* Mobile shell */
html,
body,
#root {
  max-width: 100%;
  overflow-x: hidden;
}

html { height: 100%; }

body,
#root {
  min-height: 100%;
  min-height: 100dvh;
}

.safe-area-top { padding-top: env(safe-area-inset-top, 0px); }
.safe-area-bottom { padding-bottom: calc(0.35rem + env(safe-area-inset-bottom, 0px)); }
.safe-area-x {
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}

@media (max-width: 640px) {
  :root { --labora-radius: 18px; }
  .labora-hero { border-radius: 20px; }
  button, a, [role='button'] { touch-action: manipulation; }
  input, select, textarea { font-size: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  .labora-card-interactive { transition: none; }
}

```

## Atmosphere provider
Path: `contexts/GhibliAtmosphereContext.tsx`
Exports `GhibliPalette`, time/season detectors, CSS var injection into `:root`, Spanish titles like "Amanecer en la Colina".
