<div align="center">

# NET//CAL — Net Calorie Tracker

**A full-stack MERN app that turns food, activity, and body metrics into one number: net calories per day.**

[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](net-calorie-tracker/client)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](net-calorie-tracker/client)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](net-calorie-tracker/server)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](net-calorie-tracker/server)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](net-calorie-tracker/server/src/models)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)](https://net-calorie-tracker.vercel.app)

**[Live demo →](https://net-calorie-tracker.vercel.app)**

</div>

---

## What this is

A take-home assignment implementation: create a user, pick any date in the last 30 days, log
food by weight and activities by duration, and watch the app compute BMR, calories in, calories
out, and the net balance — persisted per user, per day, in MongoDB.

```
Net Calories / day  =  Food Calories  −  BMR  −  Activity Calories
```

This top-level folder is the assignment workspace as a whole: the original brief, the seed
data, static design mockups, planning docs, and the actual application. **The application
itself lives in [`net-calorie-tracker/`](net-calorie-tracker)** — that's what's deployed at the
demo link above, and its own [README](net-calorie-tracker/README.md) is the real technical
reference (architecture, API, formulas, testing, deployment).

---

## Repository layout

```
.
├── net-calorie-tracker-assignment-details.pdf   # the original assignment brief
├── data-excels-for-db/                           # source spreadsheets seeded into MongoDB
│   ├── food-calories.xlsx                        #   → Food collection
│   └── MET-values.xlsx                           #   → Activities collection
├── supporting-htmls/                              # static HTML/CSS mockups (visual reference only)
│   ├── sign-up.html
│   ├── user-list.html
│   ├── user-details.html
│   └── user-data.html
├── Specs/                                          # phase-by-phase execution plans and change logs
├── Product-guide.md                                # product-level notes on the build
├── CLAUDE.md                                        # repo guidance for AI coding agents
└── net-calorie-tracker/                            # ★ the actual MERN application (see its README)
    ├── client/                                     #   React 19 + Vite frontend
    ├── server/                                      #   Node + Express API
    └── api/index.js                                 #   Vercel serverless entry point
```

| Path | What it's for |
| --- | --- |
| [`net-calorie-tracker/`](net-calorie-tracker) | The implementation. Start here to run, test, or deploy the app. |
| [`net-calorie-tracker-assignment-details.pdf`](net-calorie-tracker-assignment-details.pdf) | The original spec this project satisfies. |
| [`data-excels-for-db/`](data-excels-for-db) | Raw food-calorie and MET-value spreadsheets, imported by [`server/scripts/`](net-calorie-tracker/server/scripts). |
| [`supporting-htmls/`](supporting-htmls) | Static, non-interactive mockups used as a look-and-feel reference for the real frontend. |
| [`Specs/`](Specs) | Working plans and execution notes written during development, phase by phase. |

---

## Quick start

Full setup, environment variables, and deployment steps live in the
[application README](net-calorie-tracker/README.md#getting-started) — this is just the fast path:

```bash
cd net-calorie-tracker
npm install --workspaces
npm run import:foods --workspace server      # one-time: seed Food from data-excels-for-db
npm run import:activities --workspace server  # one-time: seed Activities from data-excels-for-db
npm run dev --workspace server                # API on :4000
npm run dev --workspace client                # app on :5173
```

## Stack at a glance

| Layer | Choice |
| --- | --- |
| Frontend | React 19 + Vite 8 — plain JSX, no router, no state-management library |
| Backend | Node 20 + Express 4 (ESM) |
| Database | MongoDB + Mongoose 8 |
| Validation | Zod |
| Tests | Vitest + Supertest |
| Hosting | Vercel (static client + one Node serverless function) + MongoDB Atlas |

See the [application README's "Stack" section](net-calorie-tracker/README.md#stack) for the
full rationale, and [Design decisions](net-calorie-tracker/README.md#design-decisions) for the
architecture reasoning behind it.

---

<div align="center">

Built for the LMD Consulting "Net Calorie Tracker" take-home assignment.

</div>
