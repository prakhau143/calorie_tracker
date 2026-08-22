# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repo currently contains **no application code** — it is the assignment brief and reference
material for a "Net Calorie Tracker" take-home exercise, not an implemented project. There is no
`package.json`, build tool, linter, or test suite anywhere in the tree. If asked to "build the app,"
the MERN/MEAN application (frontend, Node.js backend, MongoDB scripts) needs to be created from
scratch using the contents described below as the spec — do not assume any existing framework
scaffolding is present.

Contents:
- `net-calorie-tracker-assignment-details.pdf` — the full assignment spec (read this first; summarized below).
- `data-excels-for-db/` — source data to seed MongoDB collections via import scripts.
- `supporting-htmls/` — static HTML/CSS **mockups only** (no JS logic, no framework) showing the intended screens/styling. These are a visual reference for the frontend to build, not code to run as-is.

## Assignment spec (from the PDF)

Build a full MERN or MEAN stack app implementing:

**Formula:**
```
Net Calories/day = Food Calories/day − BMR − Activity Calories/day

Men's BMR   = 66.4730 + (13.7516 × weight_kg) + (5.0033 × height_cm) − (6.7550 × age_years)
Women's BMR = 655.0955 + (9.5634 × weight_kg) + (1.8496 × height_cm) − (4.6756 × age_years)
Calories out for activity = MET value × weight_kg × duration_hours
```

**Frontend requirements:**
- Enter user info (name, weight, height, sex) and display a user list with View Detail / Delete.
- For a selected user, enter data for a specific date (selectable up to 30 days in the past):
  - Calories in: pick food from a dropdown, portion, and meal time (breakfast/lunch/dinner/snack) → shows calories consumed; build a running list with a daily total.
  - Calories out: pick activity from a dropdown, duration in minutes → shows calories burnt; also show BMR for the day.
  - Net calories: Food − BMR − Activities.
  - Save the day's data to MongoDB.
  - Re-selecting a date reloads that day's saved data.

**Backend requirements:**
- Node.js REST API covering all frontend functionality (user CRUD, food/activity lookups, daily log save/read). Should be testable via Postman.

**Database requirements (MongoDB collections):**
- `User`: ID, Name, Weight, Height, Sex.
- `Activities` (seeded from `data-excels-for-db/MET-values.xlsx`): ID, Activity Name, Specific Motion, MET Value.
- `Food` (seeded from `data-excels-for-db/food-calories.xlsx`): ID, Food Name, Serving Size, Calories per Serving Size.
- Additional collections (e.g. per-user daily logs) are up to the implementation.

Data import scripts should read the two XLSX files in `data-excels-for-db/` and load them into the
`Activities` and `Food` collections respectively.

## Reference mockups (`supporting-htmls/`)

Plain static HTML pages with pre-compiled CSS (SCSS source under `assets/scss/`, but there is no
build pipeline — `assets/css/global.css` is checked in directly, not generated on demand). These
correspond to the four main screens implied by the spec:
- `sign-up.html` — create/edit user (name, weight, height, etc.).
- `user-list.html` — list of users with view/delete actions.
- `user-details.html` — a single user's profile detail view.
- `user-data.html` — the daily food/activity/net-calorie entry screen.

Treat these as the intended look-and-feel/layout reference when building the real frontend, not as
reusable components — they contain no interactivity or data binding.
