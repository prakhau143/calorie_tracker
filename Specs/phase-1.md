# Net Calorie Tracker — Execution Plan

## Context

This repo is an assignment scaffold, not an application. It holds the brief
(`net-calorie-tracker-assignment-details.pdf`), a derived spec (`Product-guide.md`), a
data-findings addendum (`Specs/Changes.md`), two Excel seed files, and four static HTML
mockups. There is no `package.json`, no build tool, no source code.

The goal is a runnable full-stack Net Calorie Tracker: user management plus per-day
calorie-in / calorie-out tracking against MongoDB, with a REST API demonstrable in
Postman. The brief grades on **code quality, code structure, and code economy** and
scopes the work at 4–6 hours — the target is a clean, complete, defensible product, not a
large one.

### Two spec conflicts, resolved

**Backend language.** `Product-guide.md` §22/§45/§48 and `Specs/Changes.md` §15 say Python.
The PDF says plainly *"The backend needs to be Node.js,"* and the rest of `Product-guide.md`
is written for Node throughout — `calorie.service.js`, `server/package.json`, `npm run dev`,
Mongoose, an "Express / Node" architecture diagram. Per instruction and the brief:
**Node + Express.** The Python lines are treated as an editing artifact.

**Food portion model.** `Product-guide.md` §15.2 maps `Calories → caloriesPerServing` with a
serving multiplier. `Specs/Changes.md` §1–5 overrides this to grams against a per-100g
value. **Changes.md wins** — it is the later document and it is the one that matches the
actual data.

---

## Decisions

| Area | Decision |
|---|---|
| Frontend | React 18 + Vite, plain JSX |
| Backend | Node 20 + Express, ESM (`"type": "module"`) |
| Database | MongoDB + Mongoose |
| UI | Dark glassmorphism per `Product-guide.md` §5/§37 |
| Tests | Vitest unit tests on the calculation services + Postman collection |
| Age | Integer years on User (BMR needs it; the brief's field list omits it) |
| Food quantity | **Grams consumed**, against `caloriesPer100g` |
| Date range | Today + previous 30 days; future dates rejected |
| Daily record | One document per `(userId, date)`, upserted |
| Calculations | Backend-authoritative; frontend previews but never persists totals |

The mockups in `supporting-htmls/` are a reference for **which screens and fields exist**,
not a visual target. They are incomplete against the brief anyway: no Delete action, no
Snack meal type, and a DOB picker mislabeled "Age". `custom.js` is a zero-byte file — the
mockups contain no logic at all.

---

## Verified data facts

Both workbooks were inspected directly; the figures below are measured, not assumed.

### `food-calories.xlsx` — sheet `Food Nutrition`, 14,164 rows

Columns: `ID`, `name`, `Food Group`, `Calories`, `Fat (g)`, `Protein (g)`,
`Carbohydrate (g)`, `Serving Description 1 (g)`.

- **`ID`: 14,164 distinct, zero nulls** → use as `sourceId` with a unique index. Food
  import is idempotent for free.
- **`Calories` is per-100g.** Zero nulls, range 0–902. Despite its name,
  `Serving Description 1 (g)` is free text with no gram figure — `1 cup`, `3 oz`,
  `1 waffle, round (4 inchdia)`, `11 crackers (1 nlea serving)` — and is blank in **322**
  rows. The brief's "Calories per Serving Size" therefore cannot be derived, which is
  exactly why `Changes.md` moves to grams.
- **`Food Group`: zero blanks, 22 real categories** — but **23 raw values**, because
  `"Dairy and Egg Products "` and `"Dairy and Egg Products"` both occur. Trimming every
  string on import collapses 23 → 22. Without it the category list shows a duplicate.
- `name`: 14,164 distinct.

### `MET-values.xlsx` — sheet `Sheet1`, 821 rows

Columns: `ACTIVITY`, `SPECIFIC MOTION`, `METs`. No nulls. METs 0.95–23.0, all lowercase.

- **No ID column**, and `(activityName, specificMotion)` is **not** unique —
  `tennis, doubles` appears twice under `sports` with **different METs (6.0 and 4.5)**,
  both valid.
- **`sourceKey` from the full triple is verified unique**: 821 rows → 821 distinct
  `(activityName, specificMotion, metValue)` values, **zero** full-triple collisions. So
  `Changes.md` §7's strategy is sound and re-import will hold at 821.
- Never index `specificMotion` or `activityName + specificMotion` as unique — either would
  reject the legitimate tennis rows.
- Search results must show the MET value so users can tell near-duplicates apart.
- Title-casing is presentation-only; store source fidelity.

---

## Repository layout

```
net-calorie-tracker/
├── client/
│   ├── src/
│   │   ├── components/   AppShell, MetricCard, SearchSelect, ConfirmDialog, …
│   │   ├── pages/        UsersPage, UserTrackerPage
│   │   ├── hooks/        useDebounce, useDailyLog
│   │   ├── services/     api.js   (fetch wrapper; unwraps the envelope)
│   │   ├── styles/       tokens.css, glass.css
│   │   └── App.jsx
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/       env.js, db.js
│   │   ├── models/       user.js, food.js, activity.js, dailyLog.js
│   │   ├── routes/       users.js, foods.js, activities.js, dailyLogs.js
│   │   ├── controllers/  one per route module
│   │   ├── services/     bmr.service.js, calorie.service.js   ← pure, zero imports
│   │   ├── validators/   zod schemas + validate() middleware
│   │   ├── middleware/   errorHandler.js, notFound.js
│   │   ├── utils/        response.js, date.js, escapeRegex.js
│   │   └── app.js
│   ├── scripts/          import-foods.js, import-activities.js
│   ├── tests/            calculations.test.js, date.test.js
│   └── package.json
├── data/                 the two .xlsx files
├── postman/              collection + environment
├── .env.example
└── README.md
```

Dependencies stay short: `express`, `mongoose`, `cors`, `dotenv`, `zod`, `exceljs`
(importers only), and `vitest` + `supertest` as dev deps.

**Use `exceljs`, not `xlsx`.** The `xlsx` package on npm is stuck at 0.18.5 with known
prototype-pollution and ReDoS advisories; the fixed builds ship only from SheetJS's own
CDN, not the registry. `exceljs` is maintained on npm and has a streaming row reader,
which the 14k-row file wants regardless.

---

## Data model

```js
User     { name, age, weightKg, heightCm, sex, timestamps }

Food     { sourceId ⭐unique, name, foodGroup, caloriesPer100g,
           servingDescription?, fatG, proteinG, carbohydrateG }

Activity { sourceKey ⭐unique, activityName, specificMotion, metValue }

DailyLog { userId, date,                       // ⭐ unique compound (userId, date)
           foodEntries: [{
             foodId, foodNameSnapshot, meal,
             servingDescriptionSnapshot, quantityGrams,
             caloriesPer100gSnapshot, calories }],
           activityEntries: [{
             activityId, activityNameSnapshot, specificMotionSnapshot,
             metValueSnapshot, durationMinutes, caloriesBurned }],
           bmr, foodCalories, activityCalories, netCalories, timestamps }
```

Indexes: `Food.sourceId` unique, `Food.name`, `Activity.sourceKey` unique,
`Activity.activityName`, `DailyLog {userId, date}` unique. Nothing else.

Snapshots exist so a re-import of reference data cannot retroactively change a saved day.

**`sourceKey` construction** — `` `${activityName}|${specificMotion}|${Number(metValue)}` ``.
Passing the MET through `Number()` before stringifying matters: the raw cell can surface as
`6` or `6.0` depending on how the sheet is read, and an inconsistent key would insert a
duplicate on the second import run instead of updating.

---

## API surface

Base path `/api`. Envelope: `{"success": true, "data": …}` or
`{"success": false, "error": {"message", "code"}}` with 400 / 404 / 409 / 500. One
`errorHandler` middleware plus a small `AppError` class produces this everywhere,
including validation failures, so no controller hand-rolls a response shape.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/users` | Create user |
| GET | `/api/users` | List users |
| GET | `/api/users/:userId` | User detail |
| PUT | `/api/users/:userId` | Update user |
| DELETE | `/api/users/:userId` | Delete user **and cascade their daily logs** |
| GET | `/api/foods?search=&page=&limit=` | Paged food search |
| GET | `/api/foods/:foodId` | Food detail |
| GET | `/api/activities?search=&page=&limit=` | Paged activity search |
| GET | `/api/activities/:activityId` | Activity detail |
| GET | `/api/users/:userId/days/:date` | Load a day |
| PUT | `/api/users/:userId/days/:date` | Save/update a day (upsert) |

Save request — references and raw inputs only:

```json
{
  "foodEntries":     [{ "foodId": "…", "meal": "breakfast", "quantityGrams": 150 }],
  "activityEntries": [{ "activityId": "…", "durationMinutes": 45 }]
}
```

The server resolves references in **two batched queries** (`find({ _id: { $in: … } })` for
foods and for activities — never one per entry), computes every figure, and writes the
snapshots. An id that doesn't resolve returns 400 naming it, rather than a silent zero.

Upsert: `findOneAndUpdate({ userId, date }, { $set: … }, { upsert: true, new: true })`
against the unique compound index.

**Search** uses an escaped case-insensitive `$regex` — input goes through `escapeRegex()`
first, since raw `$regex` is both an injection and a ReDoS vector. At 14k and 821 documents
this is comfortably fast. A `$text` index is the wrong tool: it matches whole tokens, so
`chick` would not find `chicken`, breaking autocomplete.

---

## Formulas

BMR and activity are verbatim from the brief and are not to be substituted. The food line
follows `Changes.md` §1.

```
Men's BMR   = 66.4730  + (13.7516 × weightKg) + (5.0033 × heightCm) − (6.7550 × age)
Women's BMR = 655.0955 + (9.5634  × weightKg) + (1.8496 × heightCm) − (4.6756 × age)

Food calories     = caloriesPer100g × quantityGrams / 100
Activity calories = MET × weightKg × (durationMinutes / 60)
Net calories      = foodTotal − BMR − activityTotal
```

`bmr.service.js` and `calorie.service.js` import nothing — no Mongoose, no Express — so the
unit tests need no fixtures, no database, and no app bootstrap.

**Rounding policy**, called out because a preview/saved mismatch is the most likely visible
bug here: round each entry to 2 decimals, then **sum the already-rounded entries** for each
total. Round BMR to 2 decimals. Derive net from the rounded totals. This guarantees the
rows on screen add up to the total on screen. The frontend preview applies the identical
rule, so the number shown before "Add" equals the number stored after "Save Day".

---

## Build phases

**Phase 1 — Backend skeleton.** Express app, env config, Mongo connection, index sync on
boot, CORS limited to the configured client origin, response helper and error handler.
*Verify:* `GET /api/health` returns the envelope; an unknown route returns the error shape,
not Express's HTML 404.

**Phase 2 — Models and importers.** The four schemas and their indexes, then the two
importers using `exceljs`'s streaming reader so 14k rows never load at once. Both trim
every textual field. Both write in `bulkWrite` batches of ~1000 using
`updateOne … upsert: true` — food keyed on `sourceId`, activity on the derived `sourceKey`
— which makes a re-run a no-op instead of a duplicate. Each prints inserted / updated /
skipped counts with reasons.
*Verify:* run each twice → 14,164 and 821, second run inserts nothing.

**Phase 3 — Calculation services.** Pure functions, written before the routes that use
them. Tests cover the brief's worked example (male, 25y, 72kg, 178cm; MET 8.5 for 45 min),
the female BMR branch, food at 100g / 150g / decimal grams, decimal METs, and rejection of
zero and negative inputs.

**Phase 4 — Routes.** User CRUD with cascade delete, paged food and activity search, day
load, day upsert. Zod validation at the edge: sex in `male|female`, positive numerics,
meal in the four allowed values, `quantityGrams > 0`, `durationMinutes > 0`, and date a
real calendar date inside the allowed window.

**Phase 5 — Frontend.** App shell; user create / list / delete behind a confirmation
dialog; then the tracker — date selector bounded to the valid window, debounced food and
activity search, entry forms with live preview, four summary metric cards, Save Day. The
food selector shows `Serving reference: 1 cup · 130 kcal / 100g` and the entry preview
shows `150 g → 195 kcal`, so the per-100g basis is visible rather than implied. Loading,
empty, and error states on every data-dependent panel — never a blank panel that could read
as a successful zero.

**Phase 6 — Polish and deliverables.** Glassmorphism pass, responsive down to mobile,
accessibility (labels, visible focus, keyboard-navigable comboboxes, delete confirmation,
and never signalling net-calorie state by colour alone), the Postman collection with
`baseUrl` / `userId` / `foodId` / `activityId` / `date` variables, and the README —
including the stated per-100g assumption from `Changes.md` §1 and a note on the Node
backend choice.

---

## Verification

1. `mongod` running; `cp .env.example .env`.
2. `npm run import:foods` and `npm run import:activities`, **each twice**. Expect 14,164
   and 821, with a no-op second run.
3. Data spot-checks:
   - `Food Group` yields **22** distinct categories, with no `"Dairy and Egg Products"`
     duplicate.
   - Both tennis rows survive: `tennis, doubles → 6.0` **and** `→ 4.5`.
   - A food's `caloriesPer100g` matches its source `Calories` cell.
4. `npm test` — formula units plus date-window boundaries (today, today−30, today−31,
   tomorrow).
5. Start API and client; import the Postman collection and exercise every endpoint.
6. Manual journey: create a user → see them listed → open the tracker → add food across two
   meals → add an activity → confirm the four cards and that rows sum to the totals → Save
   Day → switch to another date and back → confirm the day reloads intact.
7. Edge checks: 150 g of a 130 kcal/100g food reads **195 kcal**; future date rejected;
   day 31 rejected; deleting a user removes their logs; `?search=chicken` returns a page
   rather than 14k rows; and **re-running both importers leaves an existing DailyLog's
   stored calories and MET snapshots unchanged**.

---

## Scope guardrails

No authentication, no calorie targets or recommendations, no notifications, no caching
layer, no microservices, no state-management library. The brief rewards economy; anything
past the required workflow costs points rather than earning them.
