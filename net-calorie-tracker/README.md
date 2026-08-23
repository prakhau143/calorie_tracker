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

The API tests (`server/tests/api.test.js`) run against a separate `net-calorie-tracker-test`
database on the same Mongo instance — seeded in `beforeAll`, dropped in `afterAll` — so they
never touch the data seeded by the importers.

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
