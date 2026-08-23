# NET//CAL — Phase 4: Light/Dark Theme & Final Audit

## Context

`Specs/phase-3.md` is fully executed — all 8 commits landed, plus `05864ba` (Atlas SRV
resolver) and `12da05f` (workspace lockfile cleanup). The app is **deployed and live** on
Vercel with Atlas wired.

`Specs/enhancement.md` is an audit checklist, not a build spec. Most of its 29 sections are
verification of work already done. Exactly one item is genuinely new — **§14 Light/Dark
mode** — and it reverses phase-3's deliberate dark-only decision. That reversal is accepted;
the doc is later and explicit.

This plan is therefore: **build the theme, fix what the audit actually found, verify the
rest, and produce the §28 report.**

### Verified working (audited, not assumed)

| Area | Evidence |
|---|---|
| Atlas | `net-calorie-tracker` db: 14,164 foods · 821 activities · 22 food groups · both `tennis, doubles` METs (6.0 / 4.5) · 4.03 MB |
| Indexes | `foods.sourceId!`, `foods.name`, `foods.foodGroup`, `activities.sourceKey!`, `activities.activityName`, `dailylogs {userId,date}!` |
| Tests | 23/23 pass (5 date · 12 calculation · 6 API) in 625 ms |
| Build | `vite build` clean — 88 ms, 66.6 kB gzip JS, 3.38 kB gzip CSS |
| Deploy | Production Ready; `MONGO_URI`, `VITE_API_URL`, `CLIENT_ORIGIN`, `NODE_ENV` all set |
| Secrets | No `.env` ever committed; no credentials in git history; only `.env.example` + `vercel.json` tracked; `.vercel/` ignored |
| Phase-3 UI | Single-row nav with `leading`/`title` slots · portaled dropdown with upward flip · `.tracker-body` / `.app-header__brand` rules present · icon sprite (11 symbols, `currentColor`) · all Unicode glyphs replaced · fonts trimmed to exactly the weights used |

**Do not redo any of the above.**

### The Python line — flagging, not complying

`enhancement.md` §1 says the stack is "Python REST backend" and instructs: *"do not falsely
document Node.js."* The backend **is** Node 20 + Express. The README documenting Node is
therefore accurate; rewriting it to claim Python would be the false statement. The README
already explains the choice against the brief's *"The backend needs to be Node.js."*
**No change.** This is the fifth spec document carrying this artifact.

---

## Blocker: the live URL is not publicly reachable

Every route on the production deployment returns `302 → https://vercel.com/sso-api?...`.
**Vercel Deployment Protection (SSO) is enabled**, so an evaluator opening the link hits an
auth wall and never sees the app. For an assignment whose deliverable is a shareable URL,
this defeats the deployment.

Fix: disable Vercel Authentication for Production (Project → Settings → Deployment
Protection). Then re-run the §44 production checks, which could not be executed until now.

Second, related: `vercel env pull` returns **empty values** for all four variables, so
`VITE_API_URL` could not be read back. If it is unset or wrong at build time, `api.js:1`
falls back to `http://localhost:4000/api` and the deployed frontend silently calls the
user's own machine. Once protection is off, grep the served JS bundle for `localhost:4000`
to settle it. Expected value is the relative `/api`.

---

## Theme design (artistic freedom, exercised)

**Light mode is designed, not inverted** (§14 requires this explicitly).

Direction: a warm-neutral *paper* light theme, not white-with-dark-text. Surfaces sit
slightly off-white so elevated surfaces can go pure white and still read as raised; borders
become low-alpha ink instead of low-alpha white; shadows shift from pure black to a soft
ink-blue, which is what keeps a light UI from looking like a dark one with the lights
flipped. The accent darkens from `#38bdf8` to roughly `#0284c7` — the current sky-cyan is
~1.9:1 on white and unusable for text or focus rings.

Glass survives in light mode as a low-alpha ink film over the page wash, so the
identity carries across both themes; dropdowns/modals stay opaque per §16.

**The blocker is architectural.** The token layer is dark-baked:

- `--ink-1…7` is ordered brightest→faintest, which only means anything on a dark ground.
- `--glass-bg`, `--glass-border` are literally `rgba(255,255,255,…)` — white films.
- All four shadows are pure black at 28–45% alpha.
- There is **no `--surface`, `--border`, `--overlay`, or `--on-accent` token** — no single
  seam to flip.

So step 1 is a semantic seam, and only then a theme swap. Flipping the current tokens
directly would mean re-specifying 25 values twice with no shared vocabulary.

Ten raw colors also live outside `tokens.css` and would each break the swap. The worst is
`glass.css:147` — `.input { background: rgba(0, 0, 0, 0.25) }` puts a black film behind
every text input and select, which on a light ground is dark-box-with-dark-text.

Full list to tokenize: `glass.css:20, 94, 114, 118, 119, 124, 147` and
`index.css:321, 329, 440`.

---

## Work

### 1 — Semantic color seam (prerequisite)
`client/src/styles/tokens.css`. Introduce `--surface`, `--surface-raised`,
`--surface-elevated`, `--border`, `--border-strong`, `--overlay`, `--on-accent`. Re-point
existing consumers at them. Pull the ten raw values above into tokens. Rename the ink ramp
to be theme-neutral so "1" doesn't mean "brightest" in one theme and "darkest" in the other.
Prune the **28 unused tokens** the audit found — mirroring dead tokens would double the
light-mode surface area for nothing.

### 2 — Theme implementation (§14)
- `data-theme="light|dark"` on `<html>`; `:root` holds dark, `[data-theme="light"]` overrides
  only the semantic layer.
- `ThemeProvider` + `useTheme` in `client/src/theme/`. This is the app's **first** Context
  and **first** localStorage use — there is no existing pattern to match, and none to fight.
- Default to `prefers-color-scheme`, override with the stored choice (§14 allows respecting
  system preference).
- **Inline boot script in `index.html`** to set the attribute before first paint. Without it
  the app flashes dark before hydration, since CSS ships in `<head>` and React mounts after.
- Toggle mounts in `AppShell`'s `app-header__trailing` slot — currently an empty
  `aria-hidden="true"` spacer, so **that attribute must come off** or the control is
  invisible to assistive tech.
- Add `<meta name="theme-color">` and `color-scheme` so browser chrome follows.
- `netcal-logo.svg`'s wordmark is `#7dd3fc` on transparent — ~1.6:1 on white. It is
  currently **unreferenced**, so either give it `currentColor` or delete it; don't ship it
  broken.

### 3 — Missing CSS rules (same bug class as `.tracker-body`)
Three classes are emitted by JSX with **no rule**, so they inherit the UA `<h3>` margin and
break the gap-based vertical rhythm: `.entry-subheading`
(`UserTrackerPage.jsx:195, 251, 261, 312`), `.entries-group__title` (`:349`),
`.daily-total__label` (`:254, 315`). Also move `.metric-card__label` out of `glass.css:188`
into `index.css` beside its siblings.

### 4 — Accessibility gaps (§18)
- **`ConfirmDialog`**: hard-coded `dialog-title`/`dialog-description` ids, **no focus trap**,
  **no focus restore** — Tab escapes to the page behind, and closing drops focus on `<body>`.
- **Save success is silent to screen readers** — the error path has `role="alert"` but the
  `Saved for …` span has no `aria-live` (`UserTrackerPage.jsx:321-335`). Inconsistent.
- `SearchSelect` result-count changes aren't announced (no `aria-live` on the status rows).
- User list is `<li>`s with `aria-hidden` column headers — tabular data with no programmatic
  header association. Sighted mobile users get labels back below 900px; SR users get nothing
  at any width.
- `{user.name.toUpperCase()}` (`:66`) — uppercase in JS, not CSS; some screen readers spell
  short names letter-by-letter and the accessible name stops matching stored data.
- Verify contrast in **both** themes once the palette lands.

### 5 — Correctness and robustness
- **`confirmDelete` has `try/finally` but no `catch`** (`UsersPage.jsx:72-81`) — a failed
  DELETE rejects unhandled, the dialog just reopens, user sees no error. `handleSubmit`
  surfaces errors correctly; match it.
- **Date input ignores empty values** (`:91`) — `e.target.value && setDate(...)` means
  clearing the field updates the DOM but not state, so React re-renders the old value and
  visibly fights the user.
- `UsersPage` fetch effect has **no cancellation flag** (`:43-45`), unlike `useDailyLog`
  which does it correctly — a slow response can `setState` after unmount.
- Lint warning: `SearchSelect.jsx:34 react(set-state-in-effect)`. §19 requires no warnings.
- `aria-activedescendant` is index-derived while keys are `_id` — stale pointer if options
  reorder without remount. Low severity; fix while in the file.

### 6 — Backend and infra
- **Add the `specificMotion` index** — §20 lists it and activity search `$or`s on it, so half
  that query currently can't use an index. Model + `sync-indexes` + Atlas.
- **Gate the DNS pin to development.** `config/db.js:8` calls
  `dns.setServers(['8.8.8.8','1.1.1.1'])` unconditionally, so it runs inside the Vercel
  function too — forcing an external DNS dependency in an environment whose own resolver
  works. It was added for a local network quirk; keep it there.
- **Make the test URI configurable.** `tests/api.test.js:10` hard-codes
  `mongodb://localhost:27017/net-calorie-tracker-test`. Safe (never touches Atlas — good),
  but a fresh clone without Docker fails all 6 API tests with no explanation. Read
  `TEST_MONGO_URI` with that default and document the prerequisite.
- Prune the 6 unused sprite symbols, or wire them where they belong (`search` in the
  combobox, `delete` on Delete, `plus` on Add, `calendar` on the date field).

### 7 — Docs and final report
README: theme feature, `TEST_MONGO_URI`, and the Docker prerequisite for API tests.
Then produce the **§28 report** verbatim in its required shape — Completed / Fixed During
Audit / Verified / Remaining Issues / Intentionally Not Added / Test Status / Deployment
Status — claiming nothing that wasn't actually run.

---

## Verification

**Automated** — `npm test` (23+ green), `npm run lint` (zero warnings), `npm run build` clean.

**Theme** — toggle in header; light and dark both correct across header, cards, inputs,
dropdowns, dialogs, buttons, borders, shadows; **no dark-theme remnant** (§14); persists
across refresh; no flash of wrong theme on load; system preference respected on first visit;
contrast passes in both.

**Chrome pass** at the §23 sizes — 1440×900, 1600×900, 1920×1080, 2560×1440, 1024×768,
768×1024, 390×844 — **in both themes**: no overlap, no horizontal scroll, no clipped
dropdown, dropdown flips up near the bottom edge, Save Day reachable, long food names don't
break layout.

**End-to-end (§24)** with `Alice Test / 25 / 72 kg / 178 cm / Male`: create → list → detail →
today → search food → grams → Breakfast → preview → add → search activity → duration →
preview → add → verify Food Total / BMR / Activity Total / Net → Save Day → reload → change
date → confirm independence → delete with confirmation → toggle theme → refresh → confirm
persistence.

**Production (§22, §44)** — only possible after protection is disabled: `/api/health`, user
CRUD, both searches, day load/save against the live URL; deep-link refresh returns the app
not a 404; **served bundle contains no `localhost:4000`**; favicon, brand mark, and fonts
load; error envelope intact with no stack traces.

**Data (§10)** — re-run both importers against Atlas; counts hold at 14,164 / 821 and the
existing daily log's stored calories and MET snapshots are unchanged.

---

## Commits

1. `refactor(client): semantic color tokens and theme seam`
2. `feat(client): light/dark theme toggle with system default and persistence`
3. `fix(client): missing CSS rules and vertical rhythm`
4. `fix(client): dialog focus management, live regions, and error handling`
5. `fix(server): specificMotion index, dev-only DNS pin, configurable test URI`
6. `docs: theme, test prerequisites, and audit report`

Deployment Protection is a project setting, not a commit — I'll change it via CLI/dashboard
and re-verify.

---

## Where I need you

- **Deployment Protection.** I can disable it for Production, but it makes the app publicly
  readable — say the word before I do, since that's an outward-facing change.
- **Push to `origin`.** Local is ahead; I'll ask before pushing.

---

## Intentionally not added (§1, §45)

No authentication, calorie targets, diet or medical recommendations, notifications,
wearables, social features, analytics, Redis/Kafka, microservices, router, or state library.
No endpoint added or removed. Formulas untouched. Food stays grams-against-per-100g with no
invented serving-weight conversion.
