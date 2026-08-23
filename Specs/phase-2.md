# NET//CAL — Phase 2: Refinement Execution Plan

## Context

`Specs/phase-1.md` is **fully executed**. The app at `net-calorie-tracker/` is complete and
committed across 9 conventional commits, working tree clean except the new
`Specs/refinements.md`. MongoDB runs as the Docker container `net-calorie-mongo` (`mongo:7`)
and is seeded correctly.

`Specs/refinements.md` is a refinement pass written against **screenshots of the running
app**, not a build spec. Its job is to fix observed problems — wasted desktop width, a
search dropdown blending into the content beneath it — plus a production-readiness sweep.
It explicitly forbids scope growth (§45) and endpoint changes (§32).

So this plan refines a working product. It is not construction, and most of §46's
Priority 1 is already satisfied.

### One stale line, again

`refinements.md` line 13 and §23 say "Python REST API" and recommend a `main.py` /
`requirements.txt` layout. This is the same copy-paste artifact seen in `Product-guide.md`
§22/§48 and `Changes.md` §15. The implementation is Node + Express per the PDF and explicit
instruction, and `server/src/{config,controllers,middleware,models,routes,services,utils,validators}`
is already the correct equivalent of §23's intent. **No restructuring.**

---

## Verified already-correct — do not redo

Confirmed by reading the code and querying the live database:

| Item | Evidence |
|---|---|
| Food/activity seed | 14,164 foods, 821 activities |
| Food groups trimmed | 22 distinct (23 raw → 22) |
| Activity identity | `sourceKey` unique; both `tennis, doubles` rows survive at 6.0 and 4.5 MET |
| Indexes | `foods.sourceId` UNIQUE, `foods.name`, `activities.sourceKey` UNIQUE, `activities.activityName`, `dailylogs {userId,date}` UNIQUE |
| Snapshots | Saved log carries `foodNameSnapshot`, `servingDescriptionSnapshot`, `caloriesPer100gSnapshot`, `metValueSnapshot` |
| Stored math | `197 × 150/100 = 295.5`; `6 MET × 72 × 0.75 = 324`; net `295.5 − 1778.3 − 324 = −1806.8` |
| Importers | exceljs streaming + batched `bulkWrite` upserts, idempotent |
| Batched lookups | `saveDay` dedupes ids and uses two `$in` queries — no N+1 (§24) |
| Regex safety | `escapeRegex()` applied in both search controllers (§34) |
| Rounding | `round2` per entry, `sumRounded` sums rounded rows (§35) |
| Backend authority | PUT accepts only `{foodId, meal, quantityGrams}` / `{activityId, durationMinutes}` (§25) |
| Combobox a11y | `SearchSelect` already has roles, `aria-activedescendant`, arrow/Enter/Escape, outside-click, stale-request guard |
| Debounce | 300 ms via `useDebounce` (§22) |

---

## Decisions

- **Visual validation:** run both dev servers and drive Chrome to screenshot each screen
  before and after, at desktop / tablet / mobile widths. Layout and layering claims get
  confirmed visually, not asserted.
- **API tests: small and focused.** One file, ~6 cases, no new dependencies, no scope
  beyond what the brief and product guide already require. `supertest` is already
  installed and unused — this justifies it without turning into a test suite that dwarfs
  the product.
- **Commits:** one per priority group, five total, matching the existing style.

---

## Priority 1 — Correctness (§46)

Mostly done. Four real gaps remain.

1. **Missing `foodGroup` index** (§26). Add `foodSchema.index({ foodGroup: 1 })` in
   `server/src/models/food.js`. `syncIndexes()` on boot picks it up.
2. **Mongoose errors return 500** — `server/src/middleware/errorHandler.js` has no mapping
   for `ValidationError`, `CastError`, or duplicate-key `E11000`, so they surface as
   `INTERNAL_ERROR` with a logged stack. §33 wants consistent JSON errors and §39 forbids
   stack traces in responses. Map them to 400 `VALIDATION_ERROR`, 400 `INVALID_ID`, and
   409 `DUPLICATE`.
3. **Search limit cap is 100, §34 says ≤ 50.** Lower `max` in
   `server/src/validators/search.validator.js`.
4. **Formula duplicated three times** (§39 "no duplicated formula logic"). Server
   `services/` and `client/src/services/calc.js` are a *deliberate* mirror — different
   runtimes, and the header comment says so; that stays. But
   `client/src/pages/UserTrackerPage.jsx:120-128` re-implements the food math inline a
   third time. Route it through `calc.js`.

Also fix, found during the survey and squarely inside §38's "React key warnings" intent:
**entry lists key on array index while removal is by index** in `UserTrackerPage.jsx` —
removing a middle row re-keys every row after it. Give entries a stable local id at add time.

---

## Priority 2 — Layout (§2.1, §4–§7, §12, §13)

Files: `client/src/styles/tokens.css`, `client/src/styles/glass.css`,
`client/src/index.css`, `UsersPage.jsx`, `UserTrackerPage.jsx`, `AppShell.jsx`.

- **App width** — add `.app-content { width: min(94vw, 1800px); margin-inline: auto; }`
  and stop the workspace sitting in a narrow centred column. Child components keep their
  own readable max-widths; §2.1 warns against making everything infinitely wide.
- **User form** (§5) — CSS Grid,
  `grid-template-columns: minmax(220px, 2fr) repeat(4, minmax(130px, 1fr))`, collapsing
  naturally below tablet.
- **User list** (§6) — table-like rows on desktop (`USER · AGE · WEIGHT · HEIGHT · SEX ·
  ACTIONS`), converting to cards on mobile. Actions stay exactly View Detail + Delete.
- **Tracker** (§7) — two ~50% columns, Calories In | Calories Out, with the summary
  metrics above and Save Day spanning below. Stacks on mobile in the §7 order.
- **Section hierarchy** (§12, §13) — inside each column, a clear `Add …` form block, a
  rule, then `Today's …` saved entries, then Daily Total, with consistent vertical
  rhythm between input → preview → action → entries → total.
- **Activity display** (§13, §14) — show `Sports · tennis, doubles · 6.0 MET`. Title-case
  at render only; stored data stays lowercase.

---

## Priority 3 — Layering (§9, §10, §11)

The dropdown-blending bug and the system that prevents its recurrence.

- **Z-index scale** in `tokens.css` — `--z-base: 0`, `--z-card: 10`, `--z-sticky: 20`,
  `--z-dropdown: 100`, `--z-popover: 150`, `--z-modal: 200`, `--z-toast: 300`. Every
  layered rule references a token; no ad-hoc large values anywhere.
- **Dropdown as an elevated surface** (§9) — `background: rgba(15, 22, 34, 0.98)`,
  `backdrop-filter: blur(18px)`, `box-shadow: 0 20px 50px rgba(0,0,0,0.45)`, own border,
  `max-height` with internal scroll, `z-index: var(--z-dropdown)`. Behaviour (close on
  select / outside click / Escape, keyboard nav) already exists in `SearchSelect.jsx` —
  verify, don't rewrite.
- **Glass rule** (§11) — glass stays on header, panels, summary cards, user cards, form
  containers. Dropdowns, dialogs, and toasts become opaque. Audit `glass.css` for any
  ancestor `overflow: hidden` or `transform` that would clip or trap the dropdown.

---

## Priority 4 — UX (§18–§21, §22, §37)

Largely present via `StatusPanel`, `ConfirmDialog`, `useDebounce`, and the save bar. This
is an audit-and-close-gaps pass, not a rebuild.

- Confirm every data-dependent panel has loading / empty / error copy per §19–§21, with
  no layout jump while loading (§38).
- Save states (§18): `Save Day` → `Saving…` → `Saved ✓`, failure message, and duplicate
  submission blocked while in flight.
- Search (§22): confirm min-length gate, debounce, and stale-result protection are
  actually wired in `SearchSelect` and `useDailyLog` — the survey says yes; verify in the
  browser.
- Accessibility (§37): focus visibility, field-associated errors, contrast, and that
  net-calorie state is never signalled by colour alone.

---

## Priority 5 — Production quality (§38–§44)

- **Small API test file** — `server/tests/api.test.js`, supertest against `createApp()`,
  pointed at a `net-calorie-tracker-test` database on the existing Docker Mongo, seeded in
  `beforeAll` and dropped in `afterAll`. No new dependencies, no in-memory Mongo download.
  Roughly six cases: create user (201 + envelope); invalid `sex` → 400 `VALIDATION_ERROR`;
  unknown user → 404 `NOT_FOUND`; food search returns a bounded page; `PUT` day computes
  the correct BMR/food/activity/net and snapshots; re-`PUT` the same date updates rather
  than duplicating. Deliberately not exhaustive — Postman remains the demo surface the
  brief asks for.
- **Postman** (§44) — the current collection covers only food/activity search. Extend to
  Users, Daily Logs, and the `baseUrl`/`userId`/`foodId`/`activityId`/`date` variables,
  including a validation-error and a 404 example.
- **Cleanup sweep** (§38, §39) — `npm run lint`, `npm run build`, and a console check with
  zero React warnings; no horizontal page scroll; buttons hold dimensions while loading.
- **README** — refresh for the refined layout and keep the per-100g assumption prominent.

---

## Verification

Environment is already up: `net-calorie-mongo` on 27017, database seeded.

1. `cd server && npm test` — existing 17 unit cases plus the new API file, all green.
2. `npm run dev` (server, :4000) and `cd client && npm run dev` (:5173).
3. **Chrome pass, before and after**, at ~1920px, ~1024px, and ~390px:
   - Users screen fills the desktop width; form is a single grid row; list reads as a table.
   - Tracker is two balanced columns with summary above and Save Day below.
   - Food search dropdown is **opaque, shadowed, above all content**, scrolls internally,
     and closes on select / outside click / Escape.
   - Activity results show MET so the two `tennis, doubles` rows stay distinguishable.
   - No horizontal scroll, no clipped shadows, no console warnings.
4. Functional re-check: create user → add food across two meals → add activity → rows sum
   to the four cards → Save Day → navigate away and back → data reloads intact.
5. Boundaries: today ✓, today−30 ✓, today−31 ✗, tomorrow ✗; unknown `foodId` → 400
   `INVALID_REFERENCE`; malformed id → 400 not 500; `limit=999` clamps to 50.
6. Re-run both importers; confirm counts hold at 14,164 / 821 **and** the existing daily
   log's stored calories and MET snapshots are unchanged (§41).
7. Postman: every request green, envelopes correct.

---

## Commits (§46 order)

1. `fix(server): map Mongoose errors, cap search limit, index foodGroup`
2. `refactor(client): full-width workspace, grid user form, two-column tracker`
3. `fix(client): z-index scale and opaque elevated dropdown surfaces`
4. `polish(client): loading, empty, error, and save-state pass`
5. `test(server): add focused API tests; expand Postman and README`

---

## Guardrails

No authentication, calorie targets, recommendations, notifications, caching, Redis, router,
or state library (§45). No endpoint added or removed (§32). Formulas unchanged (§1). The
per-100g interpretation stays as documented — no invented serving weights (§8).
