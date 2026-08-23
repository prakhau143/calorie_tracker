# NET//CAL — Execution Report

**Status:** Deployed and live at **https://net-calorie-tracker.vercel.app**
**Last verified:** 2026-08-24

This document is a record of what was built, in what order, and why — distinct from
[`../net-calorie-tracker/README.md`](../net-calorie-tracker/README.md), which documents the
finished product for someone setting it up. This documents the *process*: the phase plans that
drove the work, the decisions made at each step, the bugs found in production and how they were
diagnosed and fixed, and the current verified state of the deployment.

---

## 1. What was asked for

A full-stack Net Calorie Tracker per the assignment brief (`net-calorie-tracker-assignment-details.pdf`):

- Create/list/view/delete users (name, weight, height, sex — age was added; see §6).
- For a selected user and a selected date (today back to 30 days), log food (by weight) and
  activities (by duration), see BMR, totals, and net calories, and save/reload the day.
- Backend-authoritative BMR/food/activity formulas, exactly as specified in the brief.
- MongoDB persistence seeded from two supplied Excel workbooks (14,164 foods, 821 activities).
- A REST API testable via Postman.
- Node.js backend, per the brief's explicit instruction.

The brief evaluates code quality, structure, and economy — not feature count — so scope was
deliberately held to this workflow throughout. No auth, targets, recommendations, notifications,
or infrastructure (Redis, microservices, a router, a state-management library) was added at any
point, despite one later spec document suggesting some of these.

---

## 2. How the work was organized

Six planning documents live in this folder (`Specs/`), written and executed roughly in order,
each auditing and building on the last:

| Doc | Role |
| --- | --- |
| `phase-1.md` | Initial build plan: scaffold server + client, models, formulas, REST API, UI |
| `Changes.md` | Early fixes identified after the phase-1 build |
| `refinements.md` | First UI/UX refinement pass (desktop layout, glass surfaces) |
| `phase-2.md` | Execution of `refinements.md` — full-width workspace, grid forms, z-index/opacity fixes |
| `ui-changes.md` | Second, deeper refinement brief — layering root causes, brand identity, Vercel deployment |
| `phase-3.md` | Execution of `ui-changes.md` — design tokens, portal fix, brand/icons, serverless config, first deploy |
| `enhancement.md` | Final audit checklist against the assignment + all prior specs, plus one new requirement (light/dark theme) |
| `phase-4.md` | Execution of `enhancement.md` — theme system, accessibility fixes, audit, README rewrite |

A recurring theme across four of these documents is worth naming explicitly: `ui-changes.md`,
`refinements.md`, and `enhancement.md` each describe the backend as a **"Python REST API"** in
places, while simultaneously specifying Node-only artifacts (`server.js`, `npm run dev`,
Mongoose, an Express architecture diagram). This was flagged and *not* acted on every time it
recurred — the assignment brief states plainly **"The backend needs to be Node.js,"** the code
has been Node/Express from the first commit, and rewriting the backend or the README to claim
Python would have been the actual error. The README documents this explicitly so the deviation
from those spec drafts is a deliberate, visible decision rather than an oversight.

---

## 3. Phase-by-phase account

### Phase 1 — Initial build (`db73c3b` … `f89ce78`)

Scaffolded both halves from nothing:

- **Server:** Express app, env config, error-handling middleware; Mongoose models for `User`,
  `Food`, `Activity`, `DailyLog`; streaming Excel importers (`exceljs`, not `xlsx` — the latter
  has known prototype-pollution/ReDoS advisories unfixed on the published npm version); pure
  `bmr.service.js` / `calorie.service.js` with no DB or HTTP imports (so their unit tests need
  neither); REST routes/controllers/Zod validators.
- **Client:** Vite + React scaffold with an initial dark glassmorphism token set; API client with
  envelope-unwrapping; `UsersPage` and `UserTrackerPage`.
- Postman collection and a first README.

### Phase 1.5 — First fixes (`7080cbf`)

Mapping Mongoose validation errors into the API's error envelope, capping search `limit` (so a
client can't request unbounded result sets), indexing `foodGroup`.

### Phase 2 — Layout refinement (`d2ebde0` … `fe93984`)

Executed `refinements.md`: the app had been sitting in a narrow centered column on desktop.
Moved to a `min(94vw, 1800px)` workspace, a responsive grid for the user-creation form, a
two-column Calories In/Calories Out tracker layout, a z-index token scale, opaque elevated
dropdown/dialog surfaces (glassmorphism was being used for *everything*, including things that
needed to sit above other content unambiguously), an explicit "Saved ✓" state, and focused
Supertest API tests.

### Phase 3 — Design system, brand, and first deployment (`29c1b27` … `a666c1c`)

The largest single phase. `ui-changes.md` traced two of its own complaints to root causes that
turned out to be missing CSS, not design problems:

- **`.tracker-body` had no rule at all** — it wrapped the metric grid, entry columns, and save
  bar with zero margin or gap between them, which is what read as "sections overlapping."
- **`.app-header__brand` had no rule** — JSX strips whitespace between adjacent text nodes, so
  the header was literally rendering `NET//CALNet Calorie Tracker` with no space.
- The search dropdown's opacity had already been fixed in Phase 2, but its *positioning* was
  still broken: `.glass-panel`'s `backdrop-filter` creates a CSS stacking context, which scoped
  the dropdown's `z-index` inside `.entry-panel` — no `z-index` value could make it outrank a
  later sibling (`.save-bar`). The fix was architectural, not a bigger number: portal the
  listbox to `document.body` via `createPortal`, position it from the input's bounding rect, and
  add viewport-collision handling so it flips upward near the bottom of the screen.

Alongside those fixes: a full design-token system (spacing/typography/shadow/transition/ink
scales, a single-hue accent palette replacing a dual cyan+violet glow, a full semantic color
set); a real brand identity (a slash-monogram mark, favicon, and logo, replacing a stock
purple-lightning-bolt favicon that had nothing to do with the product) and a 24×24 icon sprite
replacing inconsistent Unicode glyphs (`←‹›✕✓→`); a single-row iOS-style nav (back button, brand,
centered — replacing a floating second row) via a lifted header-slot pattern between `App` and
`AppShell`; and Vercel deployment plumbing — `api/index.js` (the Express app as one serverless
function), `vercel.json`, npm workspaces, and a serverless-safe `db.js` that caches the Mongo
connection promise instead of reconnecting (and re-syncing indexes) on every call.

**First deployment attempt surfaced three real bugs**, each reproduced locally before being
called fixed:

1. **DNS SRV lookup failure** — the developer's local network resolver couldn't complete
   `mongodb+srv://` SRV/TXT lookups (a common VPN/router issue, confirmed by `dig` succeeding
   against the same hostname where Node's resolver failed). Fixed by pinning Node's DNS servers
   to public resolvers — later scoped to development only once the theme/audit pass established
   this had no effect on Vercel, whose platform resolver works fine (§ "Phase 4" below).
2. **Conflicting lockfiles** — `client/package-lock.json` and `server/package-lock.json`
   (left over from before this became an npm workspace) fought with the new root
   `package-lock.json`, producing an inconsistent install on Vercel's clean build machine: only
   193 of the ~278 expected packages installed, and `vite`'s binary was never hoisted
   (`vite: command not found`). Fixed by deleting the nested lockfiles and regenerating one root
   lockfile from a genuinely clean `node_modules` state — verified by reproducing the failure
   locally first (`rm -rf node_modules && npm install` from the repo root), confirming the fix,
   *then* redeploying.
3. **Missing devDependencies on Vercel** — Vercel's build always runs with `NODE_ENV=production`,
   which makes plain `npm install` skip `devDependencies` — silently dropping `vite`,
   `@vitejs/plugin-react`, and `oxlint`. Reproduced locally with
   `NODE_ENV=production npm install` (193 packages, same failure as on Vercel) and fixed with
   `--include=dev` in `vercel.json`'s `installCommand` — reproduction then installed the full
   277-package tree and the build succeeded.

MongoDB Atlas was provisioned (M0 free tier, ~5 MB dataset against 512 MB headroom), seeded with
both importers, and indexes synced. The deployment was verified end-to-end through the actual
browser: user creation, food/activity search, save, and reload against production, followed by
cleanup of the test data used to verify it.

### Phase 4 — Light/dark theme and final audit (`a7e4bcd` … `a32a586`)

`enhancement.md` was mostly an audit checklist re-verifying work already done, with one genuinely
new requirement: a light/dark theme, reversing Phase 3's deliberate dark-only decision. That
reversal was accepted as a later, explicit instruction.

- Rebuilt the color tokens as semantic names (`--surface`, `--border`, `--overlay`, `--on-accent`,
  an `--ink-*` ramp ordered by contrast-against-current-surface rather than lightness) so one
  token set serves both themes with zero literal colors in any component file. The light theme is
  a *designed* palette, not an inverted one — off-white ground, ink-tinted borders instead of
  white ones, a darker accent for contrast reasons (dark theme's `#38bdf8` is only ~1.9:1 on
  white).
- A header toggle persists the choice to `localStorage`, follows `prefers-color-scheme` until a
  choice is made, and keeps tracking OS changes after. An inline script in `index.html` applies
  the theme before first paint to avoid a flash of the wrong palette.
- Accessibility pass: dialog focus management/trapping, live regions for async status
  (search-result counts, save state) so a screen reader announces them, and consistent error
  handling.
- **Deployment Protection audit**: found Vercel Authentication (SSO) enabled on the production
  deployment, which would have made the live URL unreachable to anyone outside the Vercel team —
  exactly the kind of thing that silently defeats an assignment whose deliverable is a shareable
  link. Disabled it and re-verified the deployed bundle contains no leaked `localhost:4000`
  reference (`VITE_API_URL=/api` baked in correctly).
- The DNS resolver override from Phase 3 was scoped to development only
  (`if (env.nodeEnv !== 'production')`) once it was confirmed Vercel's own platform resolver
  handles Atlas SRV lookups without it — no reason to make every cold start depend on reaching
  `8.8.8.8` when the platform doesn't need it.
- README rewritten to match the shipped product exactly, including the theme system, the CLI (not
  Git-integration) deployment path, and every design decision made along the way.

### Post-deployment: the timezone bug (`f2f25a3`)

Reported directly in production: on 2026-08-24, selecting *today* on the deployed app returned
*"date must be a real calendar date within today and the previous 30 days."*

**Root cause:** `isWithinAllowedWindow` computed "today" from the server process's own calendar
date. Its comment claimed this made it timezone-aware ("the server's local calendar date, not
UTC"), but Vercel's serverless functions run with a UTC clock — there is no meaningful
distinction between "local" and "UTC" in that environment. A user east of UTC (India, UTC+5:30)
has a real local "today" that is still "tomorrow" from the server's perspective for the first
~5.5 hours of their day — exactly what happened at the date rollover.

**Fix:** the server cannot know a client's timezone from a plain `YYYY-MM-DD` string, so rather
than guess, the allowed window is anchored to the server's own UTC date (explicit `getUTC*()`
methods now, not implicit process-local ones) and widened by one day on each edge — tolerating
any real-world UTC offset without opening the window meaningfully wider than intended. The
client's date-picker `min`/`max` still shows the user their own true today/30-days-ago from the
browser's real local time; the server-side change only stops a legitimate selection from being
rejected due to clock skew it has no way to see. Verified by reproducing the exact failing
scenario (`2026-08-23T20:00:00Z` — 01:30 IST on the 24th) locally, updating the two boundary
tests that had encoded the old (buggy) exact-cutoff behavior, running the full suite, and
confirming the fix live against production before considering it closed.

---

## 4. Current verified state

**Tests:** 25/25 passing — 5 date-window, 12 BMR/calorie, 6 API integration (Supertest against a
dropped-and-reseeded local test database).

**Build/lint:** `vite build` clean; `oxlint` clean (a `setState`-in-effect warning for the
standard loading-flag pattern in `SearchSelect` is suppressed with an inline
`oxlint-disable-next-line` and a comment explaining why it's correct, not silenced blindly).

**Production (`https://net-calorie-tracker.vercel.app`), checked directly, not assumed:**

| Check | Result |
| --- | --- |
| `/api/health` | `200`, `{"success":true,"data":{"status":"ok"}}` |
| Food search | `200`, 14,164 records live |
| Activity search | `200`, 821 records live |
| Deep-link hard refresh | `200` (SPA rewrite works, no 404) |
| Favicon | `200 image/svg+xml` |
| Unknown route | `404` with the JSON error envelope, no stack trace |
| Bundle | no `localhost:4000` string present — `VITE_API_URL=/api` correctly baked in |
| Deployment Protection | off — publicly reachable |
| Full browser flow | verified live: create user → search food/activity → add entries → save → reload → delete, no console errors |
| Date window fix | verified live against the exact previously-failing date |

**Data:** 14,164 foods and 821 activities imported and indexed on MongoDB Atlas (M0, ~5 MB used
of 512 MB).

**What is intentionally not in scope**, per the brief and every subsequent spec: authentication,
calorie targets/recommendations, notifications, wearables integration, social features, Redis or
another caching layer, a router, or a state-management library.

---

## 5. How to reproduce this state locally

See `net-calorie-tracker/README.md` → **Getting started**, **Testing**, and **Deployment** for
the full setup, environment variables, and verification steps. In short:

```bash
cd net-calorie-tracker
cp .env.example .env && cp client/.env.example client/.env   # fill in MONGO_URI
npm install                                                  # workspace install (client + server)
cd server && npm run import:foods && npm run import:activities && npm run sync-indexes
cd ../server && npm run dev     # http://localhost:4000
cd ../client && npm run dev     # http://localhost:5173
```

To redeploy: `cd net-calorie-tracker && vercel --prod` (deployment is by CLI, not Git
integration — a `git push` alone does not trigger a new deployment).
