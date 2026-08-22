Product Guide — Net Calorie Tracker

1. Purpose

This guide converts the provided Net Calorie Tracker assessment into an implementation-ready product and engineering specification.

The assignment requires a runnable MERN/MEAN application, MongoDB seed scripts for the supplied food/activity Excel data, a Node.js REST API, and a frontend that supports user management plus daily calorie-in/calorie-out tracking. The evaluation explicitly focuses on code quality, code structure, and code economy. [Source: assignment brief]

The repository is currently not an implemented application. CLAUDE.md confirms that there is no application code, package configuration, build tool, linter, or test suite, so the product should be designed from scratch rather than extending an assumed framework. [Source: CLAUDE.md]

2. Source-of-Truth Requirements

2.1 Core calculation

The product must calculate:

Net Calories / Day = Food Calories / Day - BMR - Activity Calories / Day

Men's BMR

BMR = 66.4730
    + (13.7516 × weight_kg)
    + (5.0033 × height_cm)
    - (6.7550 × age_years)

Women's BMR

BMR = 655.0955
    + (9.5634 × weight_kg)
    + (1.8496 × height_cm)
    - (4.6756 × age_years)

Activity calories

Activity Calories = MET Value × weight_kg × duration_hours

These formulas are explicitly specified by the assignment and must not be replaced by a different BMR/activity formula.

3. Minimal Questions That Must Be Answered Before Final Implementation

Only the following decisions are genuinely necessary to remove ambiguity. Everything else should follow the product rules below without asking for additional confirmation.

Q1. Frontend framework

Which frontend should be used?

Option A — React.js (Recommended): MERN stack, component-based UI, straightforward REST API integration, ideal for the requested futuristic/glassmorphism interface.

Option B — Angular: MEAN stack, suitable if the interviewer explicitly requires Angular.

Recommended decision: React.js.

The original brief permits either MERN or MEAN and says the evaluator will tell the candidate whether React or Angular should be used. If the evaluator has already specified one, that instruction overrides this recommendation.

Q2. How should age be captured?

The BMR formulas require age, but the minimum User attributes listed in the brief do not include age.

Option A — Age in years (Recommended): Add age to the User model.

Option B — Date of birth: Store DOB and derive age.

Recommended decision: Age in years.

This is the smallest change needed to make the required BMR formula executable. Do not silently omit age or invent a default.

Q3. What does “portion” mean?

The food reference data provides calories per serving and a serving description.

Option A — Serving multiplier (Recommended): 1.0 means one reference serving, 2.0 means two, 0.5 means half a serving.

Option B — Arbitrary gram quantity: Requires reliable gram conversion for every food and is not consistently supported by the supplied data.

Recommended decision: Serving multiplier.

Calories consumed:

Food Calories = Calories per Serving × Portion Multiplier

Default portion: 1.0.

Q4. Date range interpretation

The brief says a date can be selected “up to 30 days in past.”

Option A — Today + previous 30 calendar days (Recommended)

Option B — Exactly 30 selectable calendar dates including today

Recommended decision: Today plus the previous 30 days.

No future date should be selectable.

Q5. What should happen when a saved day is edited?

Option A — Load existing entries and allow Save/Update (Recommended)

Option B — Make saved days read-only

Recommended decision: Load and update.

This follows the requirement that selecting different dates should show that date's data and keeps the tracker practical without adding a separate edit workflow.

4. Product Scope

4.1 Required user capabilities

Create a user.

View the list of users.

View user details.

Delete a user.

Select a user.

Select a date within the allowed range.

Add food entries.

Add activity entries.

See daily food calories.

See daily activity calories.

See BMR.

See net calories.

Save the day's data.

Re-select a date and load its saved data.

The assignment explicitly requires user CRUD-style functionality, daily calorie tracking, MongoDB persistence, and REST APIs. [Source: assignment brief]

5. Product Experience

5.1 UI direction

Use a futuristic, technical, but highly readable glassmorphism interface.

The design should feel like a modern health/analytics dashboard rather than a generic fitness application.

Visual language

Dark-first interface.

Glass panels with controlled transparency.

Subtle backdrop blur.

Thin borders.

Soft gradients.

High-contrast typography.

Monospaced/numeric styling for calorie metrics.

Small glow accents only where they improve hierarchy.

Animated counters kept subtle.

Clear spacing and large touch targets.

Avoid excessive neon effects.

Avoid sacrificing readability for visual effects.

Recommended layout

┌───────────────────────────────────────────────────────────┐
│  NET//CAL                    User                 Theme   │
├───────────────┬───────────────────────────────────────────┤
│ Dashboard     │                                           │
│ Users         │             Main Workspace               │
│ Tracker       │                                           │
│               │                                           │
│               │                                           │
└───────────────┴───────────────────────────────────────────┘

For the assignment-sized product, keep navigation lightweight. Do not introduce unnecessary authentication, subscriptions, notifications, wearable integrations, or social features.

6. Frontend Screens

6.1 User creation/edit screen

Fields

Name

Age

Weight in kg

Height in cm

Sex

Sex options

Only use the two categories required by the supplied formulas:

Male

Female

Validation

Name: required.

Age: positive number.

Weight: positive number.

Height: positive number.

Sex: required.

Reject malformed numeric values.

Trim user names.

Show field-level validation messages.

Primary action

Create User

If editing is supported in the UI:

Save Changes

7. User List

Display users in clean glass cards/table rows.

Columns / information

Name

Age

Weight

Height

Sex

Actions

Actions

View

Delete

Empty state

No users yet.

Create your first profile to start tracking calories.

Delete behavior

Use a confirmation dialog:

Delete this user?

This will also remove the user's saved daily calorie logs.

Deletion must not happen accidentally from a single click.

8. User Detail / Tracker

The selected user's tracker is the primary workflow.

Header

Show:

User name

Basic profile metrics

Selected date

Date navigation

Example:

PRAKHAR MITTAL
72 kg · 178 cm · Male

<  23 AUG 2026  >

The date picker must disable dates older than the permitted 30-day window and all future dates.

9. Daily Summary

Use four high-visibility metric cards.

┌──────────────┐ ┌──────────────┐
│ CALORIES IN  │ │ BMR          │
│ 2,140 kcal   │ │ 1,721 kcal   │
└──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐
│ ACTIVITY OUT │ │ NET CALORIES │
│ 480 kcal     │ │ -61 kcal     │
└──────────────┘ └──────────────┘

Net calculation:

Food Total - BMR - Activity Total

The UI should clearly label the result as a mathematical net value rather than interpreting it as a medical recommendation.

10. Calories In — Food Entry

Controls

Food

Searchable dropdown/autocomplete backed by MongoDB.

Each result should expose:

Food name

Food group

Calories per serving

Serving description

The supplied food workbook contains 14,164 rows with these source columns:

ID

name

Food Group

Calories

Fat (g)

Protein (g)

Carbohydrate (g)

Serving Description 1 (g)

The assignment only requires the food identity, serving size, and calories per serving, so the extra nutrition columns may be retained as optional data but should not complicate the required workflow.

Portion

Numeric serving multiplier.

Example:

1.0 serving
0.5 serving
2.0 servings

Meal

Fixed options:

Breakfast

Lunch

Dinner

Snack

Preview

After food + portion selection:

Calories
320 kcal

Add action

Add Food

11. Food Entries List

For the selected day:

BREAKFAST
Oatmeal              320 kcal   × 1
Banana               105 kcal   × 1

LUNCH
Chicken Rice         640 kcal   × 1

DINNER
...

SNACK
...

Each row should have:

Food name

Meal

Portion

Calculated calories

Remove action

Daily total must update immediately.

12. Calories Out — Activity Entry

Controls

Activity

Searchable dropdown/autocomplete.

The supplied MET workbook contains 821 activity rows with:

ACTIVITY

SPECIFIC MOTION

METs

The UI should allow users to identify the activity by activity name and specific motion.

Duration

Numeric minutes.

Minimum:

> 0

Preview

Show:

Duration: 45 min
MET: 8.5
Estimated burn: 357 kcal

Calculation:

duration_hours = duration_minutes / 60

calories_burned =
MET × user_weight_kg × duration_hours

Add action

Add Activity

13. Activity Entries List

For the selected day:

Cycling
Mountain, general
45 min
357 kcal

Each row:

Activity

Specific motion

MET

Duration

Calories burned

Remove action

Daily activity total updates immediately.

14. Save Day

Primary CTA:

SAVE DAY

The save operation should persist:

User

Date

Food entries

Activity entries

BMR snapshot

Food total

Activity total

Net calories

When an existing date is loaded, the same operation should update that daily log rather than create duplicate records.

15. Data Model

15.1 User

{
  _id,
  name,
  age,
  weightKg,
  heightCm,
  sex,
  createdAt,
  updatedAt
}

The required brief fields are ID, Name, Weight, Height, and Sex. Age is added because the mandated BMR formula requires it.

15.2 Food

{
  _id,
  sourceId,
  name,
  foodGroup,
  caloriesPerServing,
  servingDescription,
  fatG,
  proteinG,
  carbohydrateG
}

Required product fields map from the supplied workbook as follows:

ID                     → sourceId
name                   → name
Food Group             → foodGroup
Calories               → caloriesPerServing
Serving Description... → servingDescription

Extra nutrition values can be retained for future UI expansion.

15.3 Activity

{
  _id,
  sourceId,
  activityName,
  specificMotion,
  metValue
}

Workbook mapping:

ACTIVITY         → activityName
SPECIFIC MOTION  → specificMotion
METs             → metValue

The activity workbook does not provide a separate ID column, so the importer should generate a stable database ID while preserving a source identifier where appropriate.

15.4 DailyLog

{
  _id,
  userId,
  date,

  foodEntries: [
    {
      foodId,
      foodNameSnapshot,
      meal,
      portion,
      calories
    }
  ],

  activityEntries: [
    {
      activityId,
      activityNameSnapshot,
      specificMotionSnapshot,
      metValueSnapshot,
      durationMinutes,
      caloriesBurned
    }
  ],

  bmr,
  foodCalories,
  activityCalories,
  netCalories,

  createdAt,
  updatedAt
}

Unique constraint

(userId, date)

This guarantees one daily document per user/date.

16. Snapshot Strategy

Daily logs should store calculated values and relevant source snapshots.

Example:

foodNameSnapshot
metValueSnapshot
calories

This protects historical logs from silently changing when reference food/activity records are updated later.

The original assignment does not explicitly require versioning, but this is a low-complexity design improvement that keeps saved historical data stable.

17. REST API

Base path:

/api

Users

Create

POST /api/users

Body:

{
  "name": "Prakhar Mittal",
  "age": 25,
  "weightKg": 72,
  "heightCm": 178,
  "sex": "male"
}

List

GET /api/users

Detail

GET /api/users/:userId

Update

PUT /api/users/:userId

Delete

DELETE /api/users/:userId

18. Food APIs

Search

GET /api/foods?search=chicken&page=1&limit=20

Return only the fields needed by the frontend.

Detail

GET /api/foods/:foodId

Do not send all 14,164 records to the browser at once.

Use server-side search/pagination.

19. Activity APIs

Search

GET /api/activities?search=cycling&page=1&limit=20

Detail

GET /api/activities/:activityId

Again, use server-side search/pagination instead of loading all 821 activities into the browser.

20. Daily Log APIs

Get day

GET /api/users/:userId/days/:date

Save/update day

PUT /api/users/:userId/days/:date

Request:

{
  "foodEntries": [
    {
      "foodId": "food-id",
      "meal": "breakfast",
      "portion": 1
    }
  ],
  "activityEntries": [
    {
      "activityId": "activity-id",
      "durationMinutes": 45
    }
  ]
}

The backend should calculate authoritative calories, BMR, totals, and net calories. Do not trust frontend-calculated totals for persistence.

21. Calculation Service

Keep formulas outside controllers.

Suggested structure:

services/
  calorie.service.js
  bmr.service.js

Example responsibilities:

calculateBMR(user)
calculateFoodCalories(food, portion)
calculateActivityCalories(activity, weightKg, durationMinutes)
calculateDailySummary(user, foodEntries, activityEntries)

This keeps business logic testable and avoids duplicating formulas across API routes.

22. Backend Architecture

Recommended stack:

Frontend: React.js
Backend: Python + REST API framework
Database: MongoDB

Architecture:

React Frontend
      ↓ REST/JSON
Python API
      ↓
Routes / Views
      ↓
Services / Business Logic
      ↓
Models / Data Access
      ↓
MongoDB

Supporting layers:

middleware/
  errorHandler
  validation

utils/
  date
  response

scripts/
  importFoods
  importActivities

Keep the implementation deliberately small. The assignment is evaluated on code quality, structure, and economy, so avoid unnecessary enterprise abstractions.

23. Recommended Repository Structure

net-calorie-tracker/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── styles/
│   │   └── App.jsx
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   └── app.js
│   │
│   ├── scripts/
│   │   ├── import-foods.js
│   │   └── import-activities.js
│   │
│   └── package.json
│
├── data/
│   ├── food-calories.xlsx
│   └── MET-values.xlsx
│
├── README.md
├── .env.example
└── .gitignore

24. MongoDB Seed Strategy

Food importer

The script should:

Read the supplied XLSX file.

Select the Food Nutrition sheet.

Normalize column names.

Validate required values.

Map source fields.

Insert using bulk operations.

Avoid accidental duplicate insertion.

Print import count and failures.

Expected source size:

14,164 food records

Activity importer

The script should:

Read MET-values.xlsx.

Read Sheet1.

Normalize:

ACTIVITY

SPECIFIC MOTION

METs

Validate numeric MET values.

Bulk insert.

Print import count and failures.

Expected source size:

821 activity records

25. Frontend State Design

Keep state minimal.

Recommended state domains:

users
selectedUser
selectedDate
dailyLog
foodSearch
activitySearch
foodEntryDraft
activityEntryDraft
loading
error

Avoid a large global state library unless the implementation genuinely requires it.

For this application, React local state plus a small API/service layer is sufficient.

26. API Error Contract

Use a consistent response format.

Success:

{
  "success": true,
  "data": {}
}

Error:

{
  "success": false,
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND"
  }
}

Use appropriate HTTP status codes:

400 → validation error
404 → resource not found
409 → duplicate/conflict
500 → unexpected server error

27. Validation Rules

User

name       required
age        > 0
weightKg   > 0
heightCm   > 0
sex        male | female

Food entry

foodId    required
meal      breakfast | lunch | dinner | snack
portion   > 0

Activity entry

activityId       required
durationMinutes  > 0

Date

not future
not older than allowed 30-day window
valid calendar date

28. Loading and Empty States

Every data-dependent component needs a state for:

Loading

Loading users...
Searching foods...
Calculating...
Saving day...

Empty

No food entries for this day.
No activities recorded.
No users found.

Error

Unable to load today's data.
Retry

Do not leave blank panels that could be mistaken for a successful zero-value state.

29. Responsive Design

Desktop is the primary assessment environment, but the UI should remain usable on tablet/mobile.

Desktop

Sidebar + main dashboard

Tablet

Compact navigation + stacked panels

Mobile

Top navigation
Stacked summary cards
Full-width entry forms
Scrollable entry lists

Do not hide required functionality on smaller screens.

30. Accessibility

Required baseline:

Semantic buttons.

Proper labels.

Keyboard-accessible dropdowns.

Visible focus states.

Sufficient text contrast.

Error messages associated with inputs.

Confirmation before destructive deletion.

Do not rely on color alone to communicate net-calorie state.

Glassmorphism must not reduce accessibility.

31. Performance Strategy

The reference datasets are large enough to make naive frontend loading undesirable.

Food

14,164 records → API search + pagination.

Activities

821 records → API search + pagination.

Daily logs

Fetch only the selected user's selected date.

MongoDB indexes

Recommended:

User: _id

Food:
  name
  foodGroup

Activity:
  activityName
  specificMotion

DailyLog:
  { userId: 1, date: 1 } unique

Avoid unnecessary indexing.

32. Security Baseline

Although authentication is not required by the assignment:

Validate every request.

Never trust frontend totals.

Never expose MongoDB connection strings.

Use environment variables.

Restrict CORS to configured frontend origins.

Sanitize search parameters.

Do not return unnecessary database fields.

Do not expose stack traces in production responses.

Do not add authentication unless specifically requested; it is outside the assessment scope.

33. Date Handling

Store daily log dates consistently.

Recommended representation:

YYYY-MM-DD

for the logical tracking date.

The application should avoid timezone-induced date shifts when a user saves or reloads a day.

The frontend date picker should operate on calendar dates rather than timestamps.

34. Calculation Example

For a male user:

Age       = 25
Weight    = 72 kg
Height    = 178 cm

BMR:

66.4730
+ (13.7516 × 72)
+ (5.0033 × 178)
- (6.7550 × 25)

For an activity:

MET       = 8.5
Weight    = 72 kg
Duration  = 45 min

Convert:

45 / 60 = 0.75 hours

Activity calories:

8.5 × 72 × 0.75

Daily net:

Food calories
- BMR
- Activity calories

The backend should perform the authoritative calculation.

35. UX Interaction Flow

Create User
    ↓
User List
    ↓
View User
    ↓
Select Date
    ↓
┌─────────────────────┐
│ Add Food             │
│ Add Activity         │
└─────────────────────┘
    ↓
Daily Summary Updates
    ↓
Save Day
    ↓
MongoDB
    ↓
Select Another Date
    ↓
Load Saved Day

36. Recommended Frontend Components

AppShell
 ├── Sidebar
 ├── TopBar
 └── PageContainer

UsersPage
 ├── UserHeader
 ├── UserForm
 └── UserList

UserDetailsPage
 ├── UserProfileCard
 ├── DateSelector
 ├── DailySummary
 ├── FoodSection
 │    ├── FoodSelector
 │    ├── FoodEntryForm
 │    └── FoodEntryList
 ├── ActivitySection
 │    ├── ActivitySelector
 │    ├── ActivityEntryForm
 │    └── ActivityEntryList
 └── SaveDayButton

Keep components focused. Do not build one giant tracker component.

37. Futuristic UI Details

Use the design language selectively.

Header

NET//CAL
DAILY ENERGY MONITOR

Summary labels

INTAKE
BASAL
ACTIVITY
NET BALANCE

Micro-interactions

Metric number count-up on update.

Smooth panel transitions.

Search result hover state.

Subtle button glow on primary actions.

Date transition animation.

Save success indicator.

Avoid excessive animations that make data entry slower.

38. Net-Calorie Visual State

The product may visually distinguish:

Positive net
Neutral
Negative net

but should not present these as medical advice or claim that one state is inherently “healthy.”

The number and formula remain the primary information.

39. Testing Strategy

Unit tests

Test:

calculateMaleBMR()
calculateFemaleBMR()
calculateFoodCalories()
calculateActivityCalories()
calculateNetCalories()

Test boundary cases:

zero/negative inputs rejected

decimal portion

decimal MET

decimal duration

minimum allowed date

future date

empty daily log

API tests

Test:

Create user
List users
Get user
Update user
Delete user

Search foods
Search activities

Get daily log
Create daily log
Update daily log
Invalid user
Invalid date
Invalid payload

Frontend tests

At minimum:

User creation validation
Food entry calculation
Activity entry calculation
Date restriction
Daily summary rendering
Save state

For a 4–6 hour assessment, prioritize business-logic and API tests over exhaustive visual tests.

40. Postman Collection

Provide a Postman collection containing:

Users
  POST Create User
  GET Users
  GET User Detail
  PUT Update User
  DELETE User

Foods
  GET Search Foods
  GET Food Detail

Activities
  GET Search Activities
  GET Activity Detail

Daily Logs
  GET Day
  PUT Day

Include environment variables:

baseUrl
userId
foodId
activityId
date

This directly addresses the requirement that REST APIs should be demonstrable through Postman.

41. Environment Variables

Example:

PORT=5000
MONGODB_URI=mongodb://localhost:27017/net_calorie_tracker
CLIENT_URL=http://localhost:5173
NODE_ENV=development

Never commit real secrets.

Provide:

.env.example

42. Local Development

Backend

cd server
npm install
npm run dev

Frontend

cd client
npm install
npm run dev

Seed food data

npm run import:foods

Seed activity data

npm run import:activities

43. README Requirements

The final repository README should contain:

Product overview.

Architecture.

Tech stack.

Prerequisites.

Installation.

Environment setup.

MongoDB setup.

Seed commands.

Frontend start command.

Backend start command.

API documentation.

Postman collection.

Screenshots.

Calculation formulas.

Design decisions.

Testing instructions.

44. Scope Guardrails

Do not add these unless explicitly requested:

Authentication

Password reset

Social login

Wearable integration

Medical diagnosis

AI chatbot

Meal recommendations

Calorie targets

Notifications

Subscription plans

Admin analytics

Multi-tenant organizations

Cloud infrastructure

Microservices

Redis

Kafka

Celery

Complex state management

These would increase implementation complexity without helping satisfy the stated assessment.

45. Acceptance Criteria

Users

User can be created.

User list displays saved users.

User can be viewed.

User can be deleted.

User information is persisted in MongoDB.

Food

Food workbook can be imported.

Food records are available through REST API.

Food can be searched.

Portion can be selected.

Meal can be selected from the four required options.

Calories are calculated from serving calories × portion.

Activity

MET workbook can be imported.

Activity records are available through REST API.

Activity can be searched.

Duration can be entered in minutes.

Activity calories use the required MET formula.

Daily tracker

Date can be selected within the permitted historical range.

Future dates are disabled.

Food entries are shown for the selected date.

Activity entries are shown for the selected date.

Food total is shown.

Activity total is shown.

BMR is shown.

Net calories are shown.

Day can be saved.

Saved data reloads when the date is selected again.

Engineering

Python REST API exists for all frontend operations.

MongoDB is used.

Seed scripts exist for both Excel files.

API can be demonstrated in Postman.

Application runs locally.

Environment secrets are not committed.

Code is organized and economical.

46. Recommended Implementation Order

Phase 1 — Foundation

Initialize MERN project.

Configure React.

Configure Express.

Configure MongoDB/Mongoose.

Add environment configuration.

Add common API error handling.

Phase 2 — Data

Create User model.

Create Food model.

Create Activity model.

Create DailyLog model.

Build food importer.

Build activity importer.

Seed MongoDB.

Phase 3 — Backend

User CRUD APIs.

Food search API.

Activity search API.

Daily log read API.

Daily log save/update API.

Calculation service.

Validation.

API tests/Postman.

Phase 4 — Frontend

Build application shell.

Build user creation.

Build user list.

Build user details.

Build date selector.

Build food entry workflow.

Build activity entry workflow.

Build summary cards.

Build save/load workflow.

Phase 5 — Polish

Glassmorphism UI.

Responsive layout.

Loading/empty/error states.

Accessibility pass.

Form validation polish.

API error handling.

Test calculations.

Test full user journey.

Add README.

Final Git cleanup.

47. Final Product Architecture

                         ┌──────────────────────┐
                         │      React App       │
                         │  Futuristic UI       │
                         └──────────┬───────────┘
                                    │ REST/JSON
                                    ▼
                         ┌──────────────────────┐
                         │    Express / Node    │
                         ├──────────────────────┤
                         │ Routes               │
                         │ Controllers          │
                         │ Validation           │
                         │ Calculation Services │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       MongoDB        │
                         ├──────────────────────┤
                         │ Users                │
                         │ Foods                │
                         │ Activities           │
                         │ DailyLogs            │
                         └──────────────────────┘
                              ▲            ▲
                              │            │
                     ┌────────┘            └─────────┐
                     │                               │
              food-calories.xlsx               MET-values.xlsx
              14,164 records                     821 records

48. Final Decision Summary

Unless the evaluator provides different instructions, use:

Decision

Selected option

Stack

React + Python + MongoDB

Frontend

React.js

Backend

Python REST API

Database

MongoDB

Database

MongoDB + Mongoose

BMR input

Age in years

Sex

Male / Female

Food portion

Serving multiplier

Meal options

Breakfast / Lunch / Dinner / Snack

Date range

Today + previous 30 days

Future dates

Disabled

Daily record

One document per user/date

Food lookup

Server-side search

Activity lookup

Server-side search

Calculations

Backend-authoritative

UI

Futuristic glassmorphism

State management

React state/hooks

Authentication

Out of scope

API testing

Postman

Seed data

Supplied XLSX files

49. Important Source Constraints

The assignment explicitly states that the exercise is intended to take approximately 4–6 hours, must be runnable, and is evaluated on code quality, structure, and economy. The implementation should therefore prioritize a clean working product over feature expansion.

The supplied repository guidance confirms that the application must be created from scratch and that the Excel files are seed/reference data rather than an existing application database.

The two supplied workbooks should be treated as the source data for the Food and Activity collections. The food workbook contains 14,164 records and the activity workbook contains 821 records based on inspection of the provided files.

Where the brief is silent, this guide deliberately chooses the smallest implementation that makes the required workflow complete rather than introducing additional product scope.

