# Net Calorie Tracker

A full-stack MERN app for tracking daily net calories: `Food Total − BMR − Activity Total`.

Built per the assignment brief and the execution plan in `../Specs/phase-1.md` and
`../Specs/Changes.md`.

## Stack

- **Frontend:** React 18 (Vite), plain JSX, no state-management library.
- **Backend:** Node 20 + Express, ESM.
- **Database:** MongoDB + Mongoose.

The assignment brief states plainly *"The backend needs to be Node.js"* — this is followed
even though an earlier draft of the internal product guide had drifted to referencing Python
in a few places.

## Data assumption — food portions are in grams, not servings

The supplied `food-calories.xlsx` provides `Calories` as a **per-100g** value, not calories
per serving. `Serving Description 1 (g)` is free text (`1 cup`, `3 oz`, …) with no reliable
numeric gram weight, and is blank in 322 of 14,164 rows — so it cannot be used to derive a
per-serving calorie figure.

**Consequence:** the user enters food quantity in **grams consumed**, and calories are
computed as:

```
Food Calories = Calories per 100g × Quantity Consumed (g) / 100
```

The source serving description is still shown for reference (e.g. "Serving reference: 1 cup"),
it just isn't used in the calculation.

## Formulas

```
Men's BMR   = 66.4730  + (13.7516 × weightKg) + (5.0033 × heightCm) − (6.7550 × age)
Women's BMR = 655.0955 + (9.5634  × weightKg) + (1.8496 × heightCm) − (4.6756 × age)

Food calories     = caloriesPer100g × quantityGrams / 100
Activity calories = MET × weightKg × (durationMinutes / 60)
Net calories      = foodTotal − BMR − activityTotal
```

All calculations are computed and persisted by the backend; the frontend only previews using
the identical formula, so the number shown before "Add"/"Save Day" always matches what gets
saved.

## Layout

The workspace fills most of the desktop viewport (`min(94vw, 1800px)`) rather than sitting in
a narrow centred column. The user list renders as a table on desktop and collapses to labeled
cards on mobile; the tracker uses two ~50%-width columns (Calories In / Calories Out) with the
summary metrics above and Save Day below, stacking to a single column below tablet width.
Layered surfaces (search dropdowns, the delete-confirmation dialog) are intentionally opaque —
not glass — and follow a shared z-index scale in `client/src/styles/tokens.css`, so they never
blend into the content behind them.

## Theme

A header toggle switches between light and dark. Both are designed palettes, not one
inverted: the light theme uses an off-white ground so elevated surfaces can be pure white and
still read as raised, ink-tinted borders and films instead of white ones, soft ink-blue
shadows rather than black, and a darker accent (`#0284c7`) because the dark theme's
`#38bdf8` is only ~1.9:1 on white.

All colour lives in `client/src/styles/tokens.css` behind semantic names — `--surface`,
`--border`, `--overlay`, `--on-accent`, and an `--ink-*` ramp ordered by *contrast against
the current surface* rather than by lightness, which is what lets the same names work in both
themes. No component file contains a literal colour.

The choice persists in `localStorage`; until one is made the app follows
`prefers-color-scheme` and keeps tracking OS changes. A small inline script in `index.html`
applies the theme before first paint, so there is no flash of the wrong palette on load — it
duplicates the storage key, which is the one intentional bit of duplication here since it
must run before the bundle.

## Prerequisites

- Node.js 20+
- A running MongoDB instance (e.g. `docker run -d --name net-calorie-mongo -p 27017:27017 mongo:7`)

## Setup

```bash
cp .env.example .env          # server config (PORT, MONGO_URI, CLIENT_ORIGIN)
cp client/.env.example client/.env   # client config (VITE_API_URL)

cd server && npm install
cd ../client && npm install
```

## Import reference data

From `server/`:

```bash
npm run import:foods       # 14,164 rows from ../data/food-calories.xlsx
npm run import:activities  # 821 rows from ../data/MET-values.xlsx
```

Both importers are idempotent (upsert by a stable key), so re-running them is safe and will
not create duplicates.

Reference-data indexes (`sourceId`/`sourceKey` uniqueness, search fields) are declared on the
Mongoose schemas but only *created* in MongoDB when explicitly synced — run this once per
database (local or Atlas):

```bash
npm run sync-indexes
```

This is intentionally not run automatically on every server start: on a long-running local
process it'd be wasted work after the first run, and on a serverless deployment it would fire
on every cold start.

## Run

```bash
# terminal 1
cd server && npm run dev      # http://localhost:4000

# terminal 2
cd client && npm run dev      # http://localhost:5173
```

## Test

```bash
cd server && npm test         # unit tests (BMR/calorie/date-window) + API tests (Vitest + Supertest)
```

The API tests (`server/tests/api.test.js`) call `dropDatabase()`, so they deliberately do
**not** read `MONGO_URI` — that points at Atlas once deployment is configured. They default to
`mongodb://localhost:27017/net-calorie-tracker-test`, which means a **local MongoDB must be
running** (see Prerequisites) or the six API tests fail. Point them elsewhere with:

```bash
TEST_MONGO_URI=mongodb://host:27017/some-test-db npm test
```

The database is seeded in `beforeAll` and dropped in `afterAll`, so the tests never touch the
data loaded by the importers.

## API

Base path `/api`. Every response is enveloped as `{"success": true, "data": …}` or
`{"success": false, "error": {"message", "code"}}`.

| Method | Path                              | Purpose                          |
| ------ | ---------------------------------- | --------------------------------- |
| GET    | `/api/health`                      | Health check                      |
| POST   | `/api/users`                       | Create user                       |
| GET    | `/api/users`                       | List users                        |
| GET    | `/api/users/:userId`               | User detail                       |
| PUT    | `/api/users/:userId`               | Update user                       |
| DELETE | `/api/users/:userId`               | Delete user + cascade daily logs  |
| GET    | `/api/foods?search=&page=&limit=`  | Paged food search                 |
| GET    | `/api/foods/:foodId`               | Food detail                       |
| GET    | `/api/activities?search=&page=&limit=` | Paged activity search          |
| GET    | `/api/activities/:activityId`      | Activity detail                   |
| GET    | `/api/users/:userId/days/:date`    | Load a day (`date` = `YYYY-MM-DD`)|
| PUT    | `/api/users/:userId/days/:date`    | Save/update a day (upsert)        |

The date window for daily logs is today through 30 days in the past; future dates and dates
older than 30 days are rejected with a 400.

## Deployment (Vercel + Atlas)

The app deploys as a **single Vercel project**: the Vite build is served as static assets and
the Express API runs as one Node serverless function (`api/index.js`, exporting `createApp()`
from `server/src/app.js`), so the SPA and API share an origin in production — no CORS
configuration needed there, and `VITE_API_URL` can simply be the relative path `/api`.

### 1. Database — MongoDB Atlas

MongoDB is not available as a Vercel Marketplace integration for every account, so this is a
direct Atlas setup:

1. Create a free **M0** cluster (512 MB — the full imported dataset is ~5 MB, so this has
   enormous headroom).
2. Create a database user scoped to this cluster with a generated password.
3. Network Access → allow `0.0.0.0/0`. Vercel's Hobby tier has no static outbound IPs, so this
   is the honest tradeoff: access is then gated by the username/password alone, which is why
   the password must be strong and must never be committed.
4. Copy the connection string into `net-calorie-tracker/.env` as `MONGO_URI` (do not paste it
   into chat, a PR, or any tracked file).
5. Seed it by running the importers locally against that URI:
   ```bash
   cd server
   npm run import:foods
   npm run import:activities
   npm run sync-indexes
   ```
   Importing is a manual, one-time (or as-needed) operation — it is **not** part of the Vercel
   build, so it never re-runs on every deploy.

### 2. Vercel project

1. Import the repo in Vercel and set **Root Directory** to `net-calorie-tracker`.
2. Vercel picks up `vercel.json` in that directory automatically:
   - `buildCommand`: `npm run build --workspace client`
   - `outputDirectory`: `client/dist`
   - `rewrites`: `/api/*` → the serverless function; everything else → `index.html` (so a hard
     refresh on a client-rendered route doesn't 404).
3. Set these Environment Variables in the Vercel project settings (Production, and Preview if
   you want preview deploys to work too):

   | Variable         | Value                                              |
   | ----------------- | --------------------------------------------------- |
   | `MONGO_URI`        | the Atlas connection string from step 1              |
   | `CLIENT_ORIGIN`    | the deployed URL (e.g. `https://net-calorie-tracker.vercel.app`) |
   | `NODE_ENV`         | `production`                                          |
   | `VITE_API_URL`     | `/api` (relative — same-origin in production)         |

4. Deploy. Vercel builds the client and provisions `api/index.js` as a serverless function in
   the same step.

### 3. Serverless connection reuse

`server/src/config/db.js` caches the Mongoose connection promise at module scope instead of
reconnecting (and re-syncing indexes) on every call, so warm serverless invocations reuse the
existing connection rather than opening a new one per request. `server/src/server.js`
(`app.listen`) is unaffected and remains the entry point for local dev only.

### 4. Verify the production deployment

- `GET https://<your-app>.vercel.app/api/health` → `{"success":true,"data":{"status":"ok"}}`
- User CRUD, food search, activity search, and daily-log save/load against the deployed URL.
- Deep-link / hard-refresh on the tracker view returns the app, not a 404 (SPA rewrite).
- Favicon and Google Fonts load; no development stack traces appear in error responses.

## Postman

Import `postman/net-calorie-tracker.postman_collection.json` and
`postman/net-calorie-tracker.postman_environment.json`. The Create User / Search Foods /
Search Activities requests auto-populate `{{userId}}`, `{{foodId}}`, `{{activityId}}` from
their responses via a test script, so running the collection top-to-bottom exercises the full
workflow with no manual copy-pasting.

## Notable data facts

- `Food Group` has 23 raw values in the source sheet but only 22 real categories — trimming
  whitespace on import (`"Dairy and Egg Products "` → `"Dairy and Egg Products"`) collapses
  the duplicate.
- Activities have no source ID and `(activityName, specificMotion)` is not unique — e.g.
  `sports | tennis, doubles` appears with both MET 6.0 and MET 4.5. Activities are keyed on a
  deterministic `sourceKey` built from the full triple (`activityName|specificMotion|metValue`)
  so both rows import correctly and re-imports stay idempotent.
