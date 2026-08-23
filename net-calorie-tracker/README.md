# NET//CAL — Net Calorie Tracker

A full-stack MERN application for tracking daily net calorie balance:

```
Net Calories = Food Calories − BMR − Activity Calories
```

Create users, pick any date within the last 30 days, log food by weight and activities by
duration, and the app computes basal metabolic rate, totals, and the net balance — persisting
one document per user per day in MongoDB.

Built for the LMD Consulting "Net Calorie Tracker" assignment. Execution plans for each phase
live in [`../Specs/`](../Specs).

---

## Contents

- [Features](#features)
- [Stack](#stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Formulas](#formulas)
- [Data assumptions](#data-assumptions)
- [Getting started](#getting-started)
- [Testing](#testing)
- [API reference](#api-reference)
- [Theme and design system](#theme-and-design-system)
- [Deployment](#deployment)
- [Postman](#postman)
- [Design decisions](#design-decisions)

---

## Features

**Users** — create, list, view, and delete. Deleting a user cascades to their daily logs.
Field-level validation, submit/loading states, and a confirmation dialog before destructive
actions.

**Daily tracking** — pick any date from today back 30 days; future and out-of-range dates are
rejected by both client and server. Each date loads its own saved data independently.

**Food** — server-side search across 14,164 records with debounce and pagination (the dataset
is never shipped to the browser). Enter quantity in grams, pick a meal (breakfast / lunch /
dinner / snack), see a live calorie preview, and build a list grouped by meal with a running
total.

**Activities** — server-side search across 821 MET records. Enter duration in minutes and see
the calories burned. Search results show the MET value, which matters because activity names
are *not* unique (see [Design decisions](#design-decisions)).

**Summary** — four metric cards: Calories In, BMR, Activity Out, Net Calories.

**Light / dark theme** — a header toggle with system-preference default and persistence.

**Accessibility** — keyboard-navigable combobox, focus-trapped dialog, live regions for
async status, visible focus states, and no state communicated by colour alone.

---

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19 + Vite 8, plain JSX — no router, no state-management library |
| Backend | Node 20 + Express 4, ESM |
| Database | MongoDB + Mongoose 8 |
| Validation | Zod |
| Excel import | ExcelJS (streaming reader) |
| Tests | Vitest + Supertest |
| Lint | oxlint |
| Hosting | Vercel (static client + one Node serverless function) + MongoDB Atlas |

> **On the backend language.** The assignment brief states plainly *"The backend needs to be
> Node.js."* That is what is implemented. Some internal spec drafts in `../Specs/` drifted to
> describing a Python API in their summary sections while simultaneously specifying
> `calorie.service.js`, `npm run dev`, Mongoose, and an "Express / Node" architecture diagram.
> The brief and the majority of those documents agree on Node, so Node it is — this README
> describes what the code actually does.

No authentication, calorie targets, recommendations, notifications, caching layer, or
analytics. The brief grades on code quality, structure, and economy, so scope is deliberately
held to the required workflow.

---

## Architecture

```
React client (Vite)
   │  fetch, envelope-unwrapping API layer
   ▼
Express API  ── routes → validators (Zod) → controllers → services → models
   │                                            │
   │                          pure calculation (no DB / HTTP imports)
   ▼
MongoDB — users · foods · activities · dailylogs
```

Two rules shape the backend:

1. **The server is authoritative for every number.** The save request carries only references
   and raw inputs (`foodId`, `meal`, `quantityGrams` / `activityId`, `durationMinutes`). The
   server resolves the reference rows, computes calories, BMR, totals, and net, then persists.
   Client-side totals are never trusted.
2. **Calculation code imports nothing.** `bmr.service.js` and `calorie.service.js` have no
   Mongoose or Express imports, so their tests need no database and no app bootstrap.

Saving a day resolves references in **two batched `$in` queries** — never one per entry — and
writes with a single upsert against a unique `(userId, date)` index.

---

## Project structure

```
net-calorie-tracker/
├── api/index.js              # Vercel serverless entry — exports the Express app
├── vercel.json               # build + rewrites (API vs SPA)
├── client/
│   ├── public/brand/         # netcal-logo.svg, netcal-mark.svg
│   ├── public/icons/         # sprite.svg — 13 currentColor symbols
│   └── src/
│       ├── components/       # AppShell, SearchSelect, MetricCard, ConfirmDialog, …
│       ├── hooks/            # useDailyLog, useDebounce
│       ├── pages/            # UsersPage, UserTrackerPage
│       ├── services/         # api.js (envelope unwrap), calc.js (preview math)
│       ├── styles/           # tokens.css (all colour), glass.css (primitives)
│       ├── theme/            # ThemeProvider + context
│       └── utils/            # dateWindow, text
├── server/
│   ├── scripts/              # import-foods, import-activities, sync-indexes
│   ├── src/
│   │   ├── config/           # env, db (cached connection)
│   │   ├── controllers/      # users, foods, activities, dailyLogs
│   │   ├── middleware/       # errorHandler, notFound
│   │   ├── models/           # User, Food, Activity, DailyLog
│   │   ├── routes/           # /api routers
│   │   ├── services/         # bmr, calorie  ← pure
│   │   ├── utils/            # response envelope, date window, escapeRegex
│   │   └── validators/       # Zod schemas + validate middleware
│   └── tests/                # calculations, date, api
├── data/                     # the two supplied .xlsx workbooks
└── postman/                  # collection + environment
```

---

## Formulas

Taken verbatim from the brief — these are not substituted.

```
Men's BMR   = 66.4730  + (13.7516 × weightKg) + (5.0033 × heightCm) − (6.7550 × age)
Women's BMR = 655.0955 + (9.5634  × weightKg) + (1.8496 × heightCm) − (4.6756 × age)

Food calories     = caloriesPer100g × quantityGrams / 100
Activity calories = MET × weightKg × (durationMinutes / 60)
Net calories      = foodTotal − BMR − activityTotal
```

**Rounding.** Each entry is rounded to 2 decimals, then totals are the sum of the
*already-rounded* entries — so the rows on screen always add up to the total on screen. The
client preview applies the identical rule, so the figure shown before "Add" equals the one
stored after "Save Day".

Worked example (male, 25y, 72 kg, 178 cm): BMR = 1778.3 kcal. 150 g of a 197 kcal/100 g food =
295.5 kcal. 45 min of a 6.0 MET activity = 324 kcal. Net = 295.5 − 1778.3 − 324 = **−1806.8**.

---

## Data assumptions

### Food is entered in grams, not servings

The supplied `food-calories.xlsx` gives `Calories` as a **per-100 g** value. The column named
`Serving Description 1 (g)` is free text — `1 cup`, `3 oz`, `1 waffle, round (4 inchdia)`,
`11 crackers (1 nlea serving)` — carrying **no numeric gram weight**, and it is blank in 322 of
14,164 rows.

The brief asks for "Calories per Serving Size", but that value cannot be derived from this data
without inventing serving weights. So the user enters **grams consumed**:

```
Food Calories = Calories per 100 g × Quantity (g) / 100
```

The serving description is still displayed as context (`Serving reference: 1 cup`); it simply
does not enter the calculation.

### Activity identity

The MET workbook has **no ID column**, and `(activityName, specificMotion)` is **not unique** —
`sports | tennis, doubles` appears twice with MET 6.0 *and* MET 4.5, both legitimate. A unique
index on the motion text would silently reject one of them.

Activities are therefore keyed on a deterministic `sourceKey` built from the full triple
(`activityName|specificMotion|metValue`), verified unique across all 821 rows. Search results
display the MET so a user can tell near-duplicates apart.

### Food group whitespace

`Food Group` has 23 raw values but only 22 real categories — `"Dairy and Egg Products "` and
`"Dairy and Egg Products"` both occur. Every string is trimmed on import, collapsing the
duplicate.

---

## Getting started

### Prerequisites

- Node.js 20+
- A running MongoDB:
  ```bash
  docker run -d --name net-calorie-mongo -p 27017:27017 mongo:7
  ```

### Install

```bash
cp .env.example .env                  # PORT, MONGO_URI, CLIENT_ORIGIN, NODE_ENV
cp client/.env.example client/.env    # VITE_API_URL

cd server && npm install
cd ../client && npm install
```

### Seed the reference data

From `server/`:

```bash
npm run import:foods       # 14,164 rows from ../data/food-calories.xlsx
npm run import:activities  #    821 rows from ../data/MET-values.xlsx
npm run sync-indexes       # create the declared indexes
```

Both importers stream the workbook (14k rows never load at once) and **upsert by a stable
key**, so re-running them is safe and creates no duplicates. Each prints inserted / updated /
unchanged / skipped counts.

`sync-indexes` is a separate one-time step rather than something the server does on boot: on a
long-running process it would be wasted work after the first run, and on serverless it would
fire on every cold start.

### Run

```bash
cd server && npm run dev      # http://localhost:4000
cd client && npm run dev      # http://localhost:5173
```

---

## Testing

```bash
cd server && npm test      # 23 tests: BMR/calorie, date window, API
```

| Suite | Covers |
| --- | --- |
| `calculations.test.js` | Male and female BMR, food at 100 g / 150 g / decimal grams, decimal METs, net, and rejection of zero and negative inputs |
| `date.test.js` | Window boundaries — today, −30, −31, tomorrow, malformed strings |
| `api.test.js` | User CRUD, validation failure, unknown id, paged food search, day upsert and re-upsert |

The API tests call `dropDatabase()`, so they deliberately do **not** read `MONGO_URI` — that
points at Atlas in a deployed setup. They default to
`mongodb://localhost:27017/net-calorie-tracker-test`, which means **a local MongoDB must be
running** or those tests fail. Override with:

```bash
TEST_MONGO_URI=mongodb://host:27017/some-test-db npm test
```

Lint and production build:

```bash
cd client && npm run lint && npm run build
```

---

## API reference

Base path `/api`. Every response uses one envelope:

```jsonc
{ "success": true,  "data": { } }
{ "success": false, "error": { "message": "User not found", "code": "NOT_FOUND" } }
```

Status codes: `400` validation, `404` not found, `409` conflict, `500` unexpected. Stack traces
are never returned in production.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/users` | Create user |
| GET | `/api/users` | List users |
| GET | `/api/users/:userId` | User detail |
| PUT | `/api/users/:userId` | Update user |
| DELETE | `/api/users/:userId` | Delete user **and cascade their daily logs** |
| GET | `/api/foods?search=&page=&limit=` | Paged food search (`limit` ≤ 50) |
| GET | `/api/foods/:foodId` | Food detail |
| GET | `/api/activities?search=&page=&limit=` | Paged activity search |
| GET | `/api/activities/:activityId` | Activity detail |
| GET | `/api/users/:userId/days/:date` | Load a day (`YYYY-MM-DD`) |
| PUT | `/api/users/:userId/days/:date` | Save/update a day (upsert) |

Save payload — references and inputs only:

```json
{
  "foodEntries":     [{ "foodId": "…", "meal": "breakfast", "quantityGrams": 150 }],
  "activityEntries": [{ "activityId": "…", "durationMinutes": 45 }]
}
```

A day that has never been saved returns `data: null` with a `200`, not a `404`.

Search input is escaped before it reaches a MongoDB regex, so a query string cannot inject a
pattern or trigger catastrophic backtracking.

---

## Theme and design system

A header toggle switches light and dark. Both are designed palettes rather than one inverted:
the light theme uses an off-white ground so elevated surfaces can be pure white and still read
as raised, ink-tinted borders and films instead of white ones, soft ink-blue shadows rather
than black, and a darker accent (`#0284c7`) because the dark theme's `#38bdf8` is only ~1.9:1
on white.

All colour lives in `client/src/styles/tokens.css` behind semantic names — `--surface`,
`--border`, `--overlay`, `--on-accent`, and an `--ink-*` ramp ordered by **contrast against the
current surface** rather than by lightness, which is what lets one set of names serve both
themes. No component file contains a literal colour.

The choice persists in `localStorage`; until one is made the app follows `prefers-color-scheme`
and keeps tracking OS changes. An inline script in `index.html` applies the theme before first
paint so there is no flash of the wrong palette — it duplicates the storage key, the one
intentional duplication here, because it must run before the bundle loads.

Tokens also cover spacing, typography, radii, shadows, transitions, and a z-index scale.
Glassmorphism is applied to containers only; dropdowns and dialogs are deliberately **opaque**
elevated surfaces so text never shows through. The search dropdown renders through a portal to
`document.body` — `backdrop-filter` on the panels creates stacking contexts that would
otherwise trap it behind the Save Day bar regardless of z-index — which also gives it
viewport-collision handling so it flips upward near the bottom of the screen.

`prefers-reduced-motion` is respected.

---

## Deployment

The app deploys as a **single Vercel project**: the Vite build is served as static assets and
the Express API runs as one Node serverless function (`api/index.js`, exporting the app from
`server/src/app.js`). SPA and API share an origin, so no production CORS configuration is
needed and `VITE_API_URL` is simply `/api`.

### 1. MongoDB Atlas

1. Create a free **M0** cluster. The full dataset is ~5 MB against 512 MB, so there is ample
   headroom.
2. Create a database user with a generated password.
3. Network Access → allow `0.0.0.0/0`. Vercel's Hobby tier has no static outbound IPs, so this
   is the honest tradeoff: access is then gated by credentials alone, which is why the password
   must be strong and must never be committed.
4. Put the connection string in `.env` as `MONGO_URI`.
5. Seed it by running the importers and `sync-indexes` locally against that URI. Importing is a
   manual operation — it is **not** part of the Vercel build and never re-runs on deploy.

### 2. Vercel

Set **Root Directory** to `net-calorie-tracker`. `vercel.json` supplies the rest:

- `buildCommand`: `npm run build --workspace client`
- `outputDirectory`: `client/dist`
- `rewrites`: `/api/*` → the function; everything else → `index.html`, so a hard refresh on a
  client-rendered route does not 404.

Environment variables (Production):

| Variable | Value |
| --- | --- |
| `MONGO_URI` | the Atlas connection string |
| `CLIENT_ORIGIN` | the deployed URL |
| `NODE_ENV` | `production` |
| `VITE_API_URL` | `/api` |

Deploy from the project directory:

```bash
cd net-calorie-tracker
vercel --prod
```

> **This project is deployed by CLI, not by Git integration.** Pushing to GitHub does **not**
> trigger a deployment — run `vercel --prod` after pushing, or connect the repo in Project
> Settings → Git if you want push-to-deploy.

> **Deployment Protection.** If Vercel Authentication is enabled, every route redirects to an
> SSO login and the app is unreachable to anyone outside the team. Turn it off under Settings →
> Deployment Protection to share a public link.

### 3. Serverless connection reuse

`server/src/config/db.js` caches the Mongoose connection promise at module scope, so warm
invocations reuse the existing connection instead of opening one per request. The public DNS
resolver override there — a workaround for local networks that fail `mongodb+srv` SRV lookups —
is gated to non-production, so the deployed function uses the platform resolver.

### 4. Verify

- `GET /api/health` → `{"success":true,"data":{"status":"ok"}}`
- User CRUD, both searches, and daily-log save/load against the deployed URL.
- Hard refresh on a deep link returns the app, not a 404.
- The served JS bundle contains no `localhost` API URL.

---

## Postman

Import both files from `postman/`. The Create User / Search Foods / Search Activities requests
auto-populate `{{userId}}`, `{{foodId}}`, and `{{activityId}}` from their responses via test
scripts, so running the collection top-to-bottom exercises the full workflow with no manual
copy-pasting.

---

## Design decisions

**Age is stored on the user.** The brief's User field list omits it, but both mandated BMR
formulas require age in years. Adding one integer field is the smallest change that makes the
required formula executable; the alternative was silently defaulting it, which would produce
wrong numbers.

**Snapshots on saved days.** Each saved entry stores `foodNameSnapshot`,
`caloriesPer100gSnapshot`, `servingDescriptionSnapshot`, `metValueSnapshot`, and the computed
calories. Re-importing reference data therefore cannot retroactively change a historical day.

**One document per user per day**, enforced by a unique `(userId, date)` index, with saves as
upserts — so re-saving a date updates rather than duplicating.

**Dates are calendar strings**, not timestamps. A `YYYY-MM-DD` string has no timezone of its
own, which avoids a saved day shifting when it is read back in another zone.

**`exceljs`, not `xlsx`.** The `xlsx` package on npm is stuck at 0.18.5 with known
prototype-pollution and ReDoS advisories; fixed builds ship only from the vendor's own CDN.

**Indexes are minimal and deliberate**: `foods.sourceId` (unique), `foods.name`,
`foods.foodGroup`, `activities.sourceKey` (unique), `activities.activityName`,
`activities.specificMotion`, and `dailylogs (userId, date)` (unique). Activity search `$or`s
across name and motion, so both need covering.
