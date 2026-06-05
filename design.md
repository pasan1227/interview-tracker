# InterviewPro — Landing Page Design

Scope: `app/page.tsx` (the marketing landing at `/`). The authenticated
dashboard uses a separate theme defined in `app/globals.css` and is not
governed by this document.

Last refresh: 2026-06-05.

---

## 1 · Direction

**Refined enterprise software.** Warm-white canvas, ink-black type, a single
deep-forest accent. The page should read at a glance as serious SaaS
(Linear / Vercel / Mercury territory) — confident, restrained, and built
around proof rather than persuasion.

What we deliberately avoided:
- Editorial / magazine aesthetics (no italic display serif, no roman-numeral
  section markers, no "Vol. I / MMXXVI" theatrics).
- Purple-gradient-on-white "AI startup" cliché.
- Generic font stacks (Inter, Roboto, Arial, system).
- Stock illustrations or hero SVGs. The hero anchor is a stylized
  in-product surface, built in DOM.

---

## 2 · Palette

Defined as TS constants at the top of `app/page.tsx`. **Do not introduce
new colors without revising this list** — the discipline is the design.

| Token        | Hex        | Role                                                  |
|--------------|------------|-------------------------------------------------------|
| `BG`         | `#FAFAF7`  | Page canvas. Warm off-white, very subtle.             |
| `SURFACE`    | `#FFFFFF`  | Cards, product preview, elevated panels.              |
| `INK`        | `#0A0A0A`  | Primary text, primary CTA fill.                       |
| `MUTED`      | `#5F6470`  | Secondary text, captions, eyebrows.                   |
| `BORDER`     | `#E8E6DE`  | Hairlines, card borders, dividers.                    |
| `FOREST`     | `#0E3B2E`  | Single accent. CTAs on hover, dots, key word, dark section bg, highlighted icons. |
| `FOREST_2`   | `#0A2D22`  | Inner tile bg on the dark metric section.             |

Secondary surfaces (used once or twice, defined inline):
- `#F4F2EB` — secondary band background (logo strip, testimonials,
  final-CTA section, side icon plates).
- `#F2F1EA` — announcement bar.
- `#FBFAF5` — sidebar / pill backgrounds inside the product preview.
- `#22C55E` — status-OK dot in the footer only.
- `#A86510` — "Pending" badge in the product preview only.

**Accent discipline.** Forest appears in: announcement pill, hero trusted-by
dot, the word *considered* / *more clarity* in headlines, primary CTA hover,
check icons, feature card icon tint, the metric section background, step
arrows, testimonial avatars, "Confirmed" pills, and the trust-center link.
That's the entire allowed list. If you need to draw the eye elsewhere,
adjust hierarchy — don't add color.

---

## 3 · Typography

One family. **Geist** (sans) for everything, **Geist Mono** for eyebrows,
metric footnotes, and the address bar in the product preview. Both fonts
are loaded globally in `app/layout.tsx` and exposed as `var(--font-geist-sans)`
/ `var(--font-geist-mono)`.

`fontFeatureSettings: '"ss01", "cv11"'` is set on the page root for Geist's
single-storey `a` and slashed zero — small detail, large legibility win.

### Type scale (used on landing)

| Use                   | Size                            | Weight | Tracking   | Leading |
|-----------------------|----------------------------------|--------|------------|---------|
| H1 hero               | `clamp(2.6rem, 6vw, 4.75rem)`   | 500    | `-0.035em` | 1.02    |
| H2 section            | `clamp(2rem, 4.4vw, 3.5rem)`    | 500    | `-0.03em`  | 1.05    |
| H2 dark section       | `clamp(1.85rem, 3.6vw, 2.8rem)` | 500    | `-0.025em` | 1.1     |
| Metric value          | `clamp(2.2rem, 3.6vw, 3rem)`    | 600    | `-0.03em`  | 1       |
| Card title (feature)  | `20px`                          | 500    | `-0.015em` | 1.05    |
| Body lead             | `17px`                          | 400    | normal     | 1.55    |
| Body                  | `14.5–15px`                     | 400    | normal     | 1.55    |
| Caption / footnote    | `12.5px`                        | 400    | normal     | 1.4     |
| Mono eyebrow          | `12px`                          | 500    | `0.18em`   | 1       |
| Mono small caps       | `10–11.5px`                     | 500    | `0.12em`   | 1       |

**Headline hierarchy rule.** H1 / H2 are sans, with **one** word per headline
allowed to take the forest accent (`color: FOREST`) — never italics, never
serif. Maximum width of any headline is constrained by a `max-w-[Nch]` so
text wraps in deliberate places.

---

## 4 · Layout

Single column, 1200px max content width (`max-w-[1200px]`), 24/40px gutter
(`px-6 lg:px-10`). Section vertical rhythm: `py-24 lg:py-32` for major
sections, `py-20 lg:py-24` for the dark metric strip. Cards use `rounded-2xl`
(features, steps, testimonials, security) or `rounded-3xl` (final-CTA
shell). Buttons are `rounded-md`. Pills are `rounded-full`.

### Page sequence (top → bottom)

1. **Announcement bar** — slim, sticky-feel band with a "New" pill, headline
   change description, and a "Read the post →" link. Goal: signal product
   velocity.
2. **Sticky nav** — backdrop-blurred `rgba(250,250,247,0.78)`, logomark +
   wordmark left, 5 link nav center, Sign in + primary CTA right.
3. **Hero** — trust pill, ≤20ch headline with one forest word, ≤52ch sub,
   dual CTA row, three check-marked trust points (free trial / no CC / SOC 2).
4. **Product preview** — the credibility anchor (see §6).
5. **Logo strip** — secondary band, "Trusted by hiring teams at" eyebrow +
   8-up grid of wordmark placeholders.
6. **Features** — 2×2 grid of cards: icon tile, title, body, hairline,
   3 check-bullet confirmations.
7. **Metrics** — dark forest band. Eyebrow + headline + supporting copy
   above a 4-up rounded-tile grid (% / × / days / uptime).
8. **How it works** — 3-card workflow with mono "Step 0X" eyebrows,
   ghosted background numerals (`#0A0A0A0F`), forest arrow connectors
   between cards on `md+`.
9. **Testimonials** — secondary band. 3 named-customer cards with
   5-star row, quote, hairline, initials avatar + role + company.
10. **Security** — left-aligned eyebrow / headline / copy / trust-center
    link beside a 2×2 grid of SOC 2 / GDPR / SSO+SAML / AES-256 cards.
11. **Final CTA** — secondary band wrapping a single white rounded-3xl card
    with the closing headline (one forest word), dual CTAs, email fallback,
    and a deep forest-tinted drop shadow.
12. **Footer** — 4-column (brand + 3 link columns), all-systems-operational
    status dot, legal links row.

---

## 5 · Reusable patterns

### Eyebrows
`SectionEyebrow` (in `app/page.tsx`). Dot + uppercase mono caps. Use one
per section, always above the H2. Light variant exists for the dark band.

### Buttons
- `.btn-primary` — `INK` fill, bone text, fills with `FOREST` on hover.
- `.btn-ghost` — `SURFACE` fill, `BORDER` ring, warms to `#F4F2EB` on hover.
- Tertiary inline links: text-only, optional trailing `ArrowRight` /
  `ArrowUpRight`. Underline on hover.

### Cards (features / steps / testimonials / security)
- `bg: SURFACE`, `border: 1px solid BORDER`, `rounded-2xl`, `p-7 lg:p-9`.
- Hover: `translateY(-2px)`, border deepens to `#D8D6CE`, soft
  forest-tinted shadow (`0 16–20px 32–40px -22/-28px rgba(14,59,46,0.14–0.18)`).
- Icon tile (when present): 40px square, `#F4F2EB` fill, `BORDER` ring,
  forest-tinted icon at 1.75 stroke.

### Pills / badges
- Default: `rounded-full`, `border: BORDER`, `bg: SURFACE`, optional leading
  forest dot.
- Status (Confirmed): forest @ 8% bg + forest text.
- Status (Pending): amber `#A86510` @ 8% bg + matching text.

### Icons
`lucide-react`, stroke `1.75` for tile icons, `2` for inline arrows, `2.5`
for checkmarks. Size scale: `3` / `3.5` / `4` / `5` only.

---

## 6 · Product preview anchor

The single most important non-text element on the page. Lives directly
below the hero, never above the fold on desktop — it's a reward for scrolling.

Structure (top → bottom, all DOM, no images):
1. Mac-style browser chrome (3 dots + mono URL pill).
2. Two-pane app: left sidebar (logomark + 6 nav items + Active workflow
   card), right main (week eyebrow + "Hiring overview" + forest "New
   interview" pill).
3. 4-up metric pills (Scheduled / In review / Avg. feedback / Time to offer).
4. Bordered "Upcoming interviews" list — 3 rows with initials avatar,
   name + role, schedule + stage, Confirmed/Pending pill.

Drop shadow uses a forest tint at low alpha to harmonize with the section
background — not a pure black shadow.

When the real app surface changes meaningfully (new sidebar items, new
stage labels, renamed metrics), update the preview so visitors never see a
caricature of the product. It's marketing copy — it has to age honestly.

---

## 7 · Motion

CSS only. No `framer-motion` / `motion`, no JS-driven scroll math. The page
renders as a server component and animations work without hydration.

### Entrance
- `@keyframes rise` — `translateY(10px) → 0` + `opacity 0 → 1`, 700ms,
  `cubic-bezier(.2,.7,.2,1)`. Applied to hero elements with explicit
  `animationDelay` (`0 → 90 → 180 → 270 → 360 → 450ms`).
- No blur, no big translate. Restraint is the point.

### Scroll reveal
- `@supports (animation-timeline: view())` blocks apply the `rise`
  animation to cards (features, steps, testimonials, security, metric
  tiles) with `animation-timeline: view()` and
  `animation-range: entry 0% cover 35%`. Browsers without support
  silently get the static end-state. Do not polyfill.

### Hover
- Cards: `translateY(-2px)`, border + shadow shift, 320ms ease.
- Nav links + footer links: bottom `scaleX(0 → 1)` underline from left,
  320/280ms ease.
- Buttons: primary inks → forest fill, ghost warms, both with 200ms ease.
- Metric tiles: bg shifts from `FOREST_2` to `#0A3326`, 280ms.
- Icons next to "see more" links translate `-1px / +1px` and brighten.

### Cadence ceiling
No element should animate longer than 800ms. No bouncing, no overshoot, no
parallax, no marquees. If you reach for a longer or more elastic motion,
reconsider whether the moment justifies it.

---

## 8 · Accessibility

- All interactive elements are `<Link>` or `<button>` with visible
  hover/focus affordances. Underline-on-hover doubles as focus indicator
  via `:focus-visible` inheritance; verify if a new pattern is added.
- Color contrast: ink-on-bone is `~17:1`; muted-on-bone is `~4.6:1` (AA
  large text and UI). Forest-on-bone is `~10:1`. Forest-on-bone-bg pills
  pass AA.
- The forest band uses `#EFEFE9` for primary text on `#0E3B2E` — `~11:1`.
- `::selection` is themed to forest bg + bone text for consistency.
- Decorative icons in repeated rows (stars, dots) have `aria-hidden` or are
  marked with `strokeWidth={0}` and no semantic role; the surrounding
  figure carries the meaning.

---

## 9 · Non-goals / explicit "don't"

- **Don't add a hero illustration or photograph.** The product preview is
  the visual. Stock illustrations are off-brand here.
- **Don't introduce a serif.** Geist carries everything. A serif accent
  would re-open the editorial vocabulary we just left behind.
- **Don't add a second accent color.** Forest is alone for a reason. If
  you want a "secondary action" color, it's still `INK` or `MUTED` text on
  the existing surfaces.
- **Don't reach for gradient meshes, glow effects, or animated blobs.**
  The page sells judgment, not vibes.
- **Don't auto-rotate testimonials.** Three static cards beats a carousel.
- **Don't add a marquee.** Removed deliberately when moving from the
  editorial direction.

---

## 10 · Extending the page

Where to add the next section:

| New content type                    | Insert between           | Pattern to reuse                |
|-------------------------------------|--------------------------|---------------------------------|
| Integrations / "Works with X"       | Logo strip → Features    | Logo strip pattern, 2-up rows   |
| Pricing teaser                      | Security → Final CTA     | Step-card grid (3 tiers)        |
| Comparison table                    | Features → Metrics       | Inline within a max-w container |
| Long-form case study link-out       | Testimonials → Security  | A single card spanning 12 cols  |
| FAQ                                 | Security → Final CTA     | Disclosure rows on a `SURFACE` card |

For any new section: lead with an `<SectionEyebrow>`, follow with a sans
H2 (≤22ch) where at most one word may take `color: FOREST`, then either a
two-line `MUTED` lead or a 12-col grid of cards. No exceptions without
revising this document.

---

## 11 · Files & verification

- `app/page.tsx` — the entire page, including the `<PageStyles />` block
  that owns all keyframes and hover utilities.
- `app/layout.tsx` — Geist + Geist Mono `next/font` loads + metadata.
- `app/globals.css` — **dashboard theme only**. Do not add landing-page
  styles here.
- Driver / smoke verification:
  `node .claude/skills/run-interview-tracker/driver.mjs smoke`.
  Screenshots land in
  `.claude/skills/run-interview-tracker/shots/` and are git-ignored.
