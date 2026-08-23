# NET//CAL — Phase 3: Premium UI, Brand & Vercel Deployment

## Context

`Specs/phase-2.md` is fully executed — all five commits landed (`7080cbf` → `fe93984`).
`Specs/ui-changes.md` is the next pass: make the working product feel like an intentionally
designed piece of software, give it a real brand, and ship it to Vercel.

Important: `ui-changes.md` was written against screenshots taken **before** phase-2 landed.
Several of its demands are already satisfied. This plan does not redo them.

**Already done — verified in the working tree:**
z-index token scale and both consumers (`c4c97a6`) · opaque elevated dropdown *and* dialog
surfaces · full-width workspace `min(94vw, 1800px)` · 5-column create-user grid with
900/720px collapse · desktop table-grid → mobile labeled-card user list · two-column
Calories In/Out with 720px stack · 4→2→1 metric grid · `Saved ✓` state · batched `$in`
lookups, snapshots, idempotent imports, API tests.

Local `main` is **5 commits ahead of `origin/main`** and must be pushed before a
git-integration deploy.

### The recurring stale line

`ui-changes.md` §30 and §36/§37 say "Python REST API" and sketch `api/index.py` /
`requirements.txt`. This is the fourth document carrying that artifact. The backend is
Node + Express per the PDF and explicit instruction. Every constraint §36/§38/§41 actually
states — serverless, no long-running process, env-based connection, connection reuse — is
satisfied by a Node function at `api/index.js`. No rewrite.

---

## Root causes found (not design problems — missing CSS)

The survey traced two of §1.1's complaints to rules that simply don't exist:

1. **`.tracker-body` has no CSS rule.** It wraps `.metric-grid`, `.entry-columns`, and
   `.save-bar`; none of those has a margin and the wrapper has no flex/gap. That is exactly
   the "insufficient vertical separation / sections colliding" in §1.1.
2. **`.app-header__brand` has no CSS rule.** JSX strips the whitespace between the two
   spans, so the header renders **`NET//CALNet Calorie Tracker`** with no space.

And the §2 dropdown bug is only half-fixed:

3. **Stacking-context containment.** `.glass-panel` sets `backdrop-filter`, which creates a
   stacking context. The listbox's `z-index: var(--z-dropdown)` is therefore scoped *inside*
   `.entry-panel` and cannot outrank `.save-bar` (a later sibling in `.tracker-body`). A long
   dropdown paints **underneath** the save bar. `c4c97a6` fixed opacity; it could not fix
   this. **No z-index value can** — the fix is to portal the listbox out.

---

## Design direction (artistic freedom, exercised)

**Palette.** Keep the dark identity, drop the dual cyan+violet glow §14 warns against.
One primary accent (refined sky-cyan) carrying actions/focus/selection; violet demoted to a
single faint background wash. Add a proper ink ramp and full semantic set
(success/warning/danger/info). Dark-only — no light theme; the product is a night-shift
instrument and a half-built second theme would cost more than it earns.

**Type.** Keep Sora + JetBrains Mono, but trim the Google request from 9 weights to the 5
actually used. Add a real type scale; mono stays scoped to numerals, dates, and metadata
per §16.

**Token scales to add** (§48) — spacing (4px base), typography, shadow ramp incl. focus
ring, transition duration/easing, radius `xs`/`full`, numeric ink ramp. Today only radius,
z-index, and a partial shadow/color set exist; spacing, type, and transitions are entirely
absent, which is why `padding: 1.5rem` appears 4× and `font-size: 0.9rem` 5×.

**Brand — slash monogram.** The `//` from the existing wordmark becomes the mark: two
angled bars in a rounded square, accent gradient on the leading edge, legible at 16px.

---

## Work

### 1 — Token system (§13, §14, §16, §48)
`client/src/styles/tokens.css`. Add spacing, typography, transition, shadow-ramp, and ink-ramp
scales; refine the palette; add `prefers-reduced-motion` handling (§26). Then sweep
`glass.css` / `index.css` so components consume tokens instead of the repeated literals.
Collapse the **six near-identical uppercase-eyebrow label styles** into one `.eyebrow` class.

### 2 — Layout foundation (§1.1, §4, §5, §6, §7, §8)
- Write the missing `.tracker-body` rule — this is the actual fix for §1.1.
- Write the missing `.app-header__brand` rule — fixes the glued wordmark.
- Align `.app-header` and `.app-main` to the same container width (they currently use
  different mechanisms, so their edges don't line up).
- **Single-row iOS-style nav (§7).** `AppShell` currently takes only `children`; the back
  button lives in `UserTrackerPage` as a separate row. Give `AppShell` `leading`/`title`
  slots and hoist the back action into the product header — one row, back left, identity
  centred, no second floating row.

### 3 — Layering (§2, §3, §27)
Portal `SearchSelect`'s listbox to `document.body` via `createPortal`, positioned from the
input's bounding rect, repositioned on scroll/resize. This escapes every ancestor stacking
context **and** gives viewport-collision handling (flip upward near the bottom edge), which
§2 and §27 both require and the current absolute-in-relative approach cannot provide.
Keep the existing keyboard/outside-click/Escape behaviour — it is already correct.

### 4 — Brand and icons (§9–§12)
Create `client/public/brand/` with `netcal-mark.svg`, `netcal-logo.svg`, `favicon.svg`.
Replace the current favicon — a stock purple lightning bolt at `#863bff`, off-palette and
unrelated to the product. Delete `public/icons.svg` (six social/doc icons: bluesky, discord,
github, x… referenced by nothing).

Build a real sprite: `back, calendar, chevron-left, chevron-right, search, close, plus,
delete, save, food, activity` — one 24×24 viewBox, 1.5 stroke, round caps, `currentColor`.
Replace the Unicode glyphs (`←‹›✕✓→`) that render inconsistently across platforms, and fix
`.btn-icon`, whose hit area is far below the 44px minimum.

### 5 — Component consistency (§17, §18, §20–§25, §49)
Metric cards (equal height, value dominant), food/activity entry rhythm distinguishing
source info from input from computed output, compact entry rows, closing total rows, and
button/input/card uniformity. Style `.status-panel--loading` / `--empty` and
`.metric-card--neutral`, which are emitted but have no rules today.

### 6 — Serverless readiness (§41)
`server/src/config/db.js` currently connects **and runs `syncIndexes()` on every call** —
fine for a long-running process, wrong for serverless, where it would fire on every cold
start. Cache the connection promise at module scope and move index sync into a one-off
script. `server.js` (with `app.listen`) stays for local dev only.

### 7 — Vercel deployment (§36–§40, §42, §43)
Single Vercel project so the SPA and API share an origin (which also makes §40's CORS
concern moot in production):
- `net-calorie-tracker/package.json` — npm workspaces over `client` and `server`, `type: module`.
- `net-calorie-tracker/api/index.js` — `export default app` from `server/src/app.js`.
- `vercel.json` — build the client, output `client/dist`, rewrite `/api/*` to the function
  and everything else to `index.html` for SPA refresh-safety.
- Vercel Root Directory set to `net-calorie-tracker`.

Env names stay as they are (`MONGO_URI`, `CLIENT_ORIGIN`, `VITE_API_URL`) rather than
adopting §39's slightly different labels — they're already wired and documented, and the
rename is churn with no benefit. README will note the mapping. In production `VITE_API_URL`
becomes the relative `/api`.

### 8 — Database and docs
**Atlas advice, as asked.** MongoDB is *not* in the Vercel Marketplace for this account
(checked — `vercel integration discover mongo` returns nothing), so it's a direct Atlas
setup. The full dataset measures **4.03 MB data + 1.07 MB indexes ≈ 5 MB**, so the free
**M0 tier (512 MB)** has enormous headroom.

Steps: create an M0 cluster → a scoped DB user with a generated password → network access
`0.0.0.0/0` (Vercel Hobby has no static egress IPs; the honest tradeoff is that access is
then password-gated only, so the password must be strong and never committed) → seed by
running the two existing importers locally against the Atlas URI → run the index script once.

Then README: deployment, env vars, Atlas setup, and a note that the importers are **not**
part of the build (§44).

---

## Verification

**Local**
1. `npm test` in `server/` — unit + API tests green.
2. `npm run build` in `client/` — clean, no unresolved env or missing assets (§42).
3. `npm run lint` — clean; browser console free of React warnings (§29).

**Chrome pass** at the §45 sizes — 1440×900, 1600×900, 1920×1080, 2560×1440, 1024×768,
768×1024, 390×844. Confirm specifically:
- Metric row / entry columns / save bar have real separation (the `.tracker-body` fix).
- Header reads `NET//CAL  Net Calorie Tracker` with proper spacing.
- Back button and identity share **one** nav row.
- **A food dropdown with many results renders above the Save Day bar** — the stacking fix.
- Dropdown flips up rather than leaving the viewport near the bottom edge on 390×844.
- No horizontal scroll, no clipped shadows, no long-name overflow.

**Functional** — user CRUD, gram-based food math, MET-distinguishable activities, BMR, net,
save/load, date boundaries (today, −30, −31, tomorrow).

**Production** (§43, §44) — `/api/health`, user CRUD, both searches, day load/save against
the deployed URL; SPA deep-link refresh returns the app not a 404; favicon and fonts load;
error envelope preserved with no stack traces.

---

## Commits

1. `feat(client): design token scales and refined palette`
2. `fix(client): tracker-body and brand spacing; unified single-row nav`
3. `fix(client): portal search dropdown out of glass stacking contexts`
4. `feat(client): NET//CAL brand mark, favicon, and icon sprite`
5. `refactor(client): component consistency and state styling pass`
6. `refactor(server): cache Mongo connection for serverless cold starts`
7. `feat: Vercel deployment config and workspace layout`
8. `docs: deployment, Atlas setup, and env reference`

---

## Where I need you

Deployment is "I drive it", but two steps are yours — I'll pause and hand off:

- **Atlas account + cluster.** I can't create it. I'll give exact steps and wait for the
  URI to land in your `.env` (don't paste it into chat).
- **Push to `origin`.** 5 local commits are unpushed; I'll ask before pushing.

`vercel` CLI 54.4.1 is installed and authenticated as `prakhau143`, so linking and
deploying can run from here once the URI exists.

---

## Guardrails

Scope unchanged (brief §11, `ui-changes.md` §45): no auth, targets, recommendations,
notifications, Redis, caching layer, router, or state library. No endpoint added or removed.
Formulas untouched. Food stays grams-against-per-100g — no invented serving weights (§19).
