NET//CAL — Complete Refinement Plan

Purpose

This document defines the complete refinement pass required after inspecting the current frontend screens, the existing execution plan, the assignment brief, and the previously identified reference-data issues.

The objective is not to expand the product scope. The objective is to make the current implementation production-ready, visually consistent, technically defensible, efficient, and aligned with the exact Net Calorie Tracker requirements.

The core system remains:

React frontend
        ↓
Python REST API
        ↓
MongoDB

The required product workflow remains:

Create user
    ↓
User list
    ↓
View user
    ↓
Select date
    ↓
Add food
    ↓
Add activities
    ↓
Calculate BMR / totals / net calories
    ↓
Save day
    ↓
Reload saved day

The assignment remains focused on user management and per-day calorie tracking, with MongoDB persistence and REST APIs. The brief evaluates code quality, code structure, and code economy, so refinements must improve the existing system without introducing unnecessary product features.

1. Refinement Principles

All implementation work should follow these principles:

Do not change the required product scope.

Do not replace the formulas specified by the brief.

Do not invent missing reference-data values.

Keep calculations authoritative on the backend.

Keep the frontend responsive and easy to understand.

Use glassmorphism selectively rather than making every surface transparent.

Prioritize readable information hierarchy over visual effects.

Avoid unnecessary libraries and infrastructure.

Optimize database access rather than adding premature caching or microservices.

Make every important state visible: loading, empty, success, and error.

Preserve historical daily calculations when reference data changes.

Make the implementation easy to explain during technical review.

2. Current Issues Observed

The current screenshots expose the following issues that must be addressed.

2.1 Desktop content width

The user-management screen uses a relatively narrow centered workspace while large areas of the desktop viewport remain unused.

Problem

The interface feels like a mobile/tablet layout placed in the middle of a desktop screen.

Required refinement

Use a responsive application container that occupies most of the available desktop width while maintaining readable internal max-widths.

Recommended:

.app-content {
  width: min(94vw, 1800px);
  margin-inline: auto;
}

The exact value can be adjusted after visual inspection.

Do not make every child component infinitely wide.

3. Global Application Layout

Use a consistent application shell.

┌────────────────────────────────────────────────────────────────────┐
│ NET//CAL  Net Calorie Tracker                                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│                    Responsive Workspace                            │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

Header

Keep the existing NET//CAL identity.

Refine:

consistent horizontal padding

appropriate header height

responsive typography

subtle border

controlled backdrop blur

no excessive transparency

fixed/sticky behavior only if it improves usability

The header should not consume excessive vertical space.

4. Global Width Strategy

Use different width behavior depending on the page.

User Management

Use approximately:

90–94% viewport width

with a maximum width suitable for large desktop screens.

Tracker

The tracker should use almost the entire available workspace.

Recommended structure:

User / Date Header
        ↓
Summary Metrics
        ↓
┌─────────────────────┬─────────────────────┐
│ Calories In         │ Calories Out        │
│                     │                     │
└─────────────────────┴─────────────────────┘
        ↓
Save Day

Do not keep the tracker restricted to the narrow width shown in the current screenshot.

5. User Creation Screen Refinement

Current observation

The form currently places all fields in a single row but does not make effective use of the available space.

Required arrangement

Desktop:

┌────────────────────────────────────────────────────────────────────┐
│ Create User                                                        │
│                                                                    │
│ Name          Age          Weight          Height          Sex      │
│ [────────]    [────]       [──────]        [──────]        [────]  │
│                                                                    │
│ [ Create User ]                                                    │
└────────────────────────────────────────────────────────────────────┘

Use CSS Grid rather than hard-coded widths.

Example concept:

grid-template-columns:
  minmax(220px, 2fr)
  repeat(4, minmax(130px, 1fr))

On smaller screens, allow the grid to collapse naturally.

Required fields

Name

Age (years)

Weight (kg)

Height (cm)

Sex

Age remains stored as integer years because it is required by the mandated BMR formulas.

Refinements

Add:

field-level validation

clear focus states

required indicators

positive numeric validation

submit loading state

disabled state while submitting

clear success/error feedback

Do not add authentication or unrelated profile fields.

6. User List Refinement

The current user card is functional but could use the available desktop space better.

Use a table-like layout on desktop.

┌────────────────────────────────────────────────────────────────────┐
│ USER       AGE      WEIGHT      HEIGHT      SEX       ACTIONS       │
├────────────────────────────────────────────────────────────────────┤
│ Alice Test 25       72 kg       178 cm      Male      View  Delete  │
└────────────────────────────────────────────────────────────────────┘

On mobile, convert the row to a card.

Actions

Keep exactly:

View Detail

Delete

Deletion must require confirmation.

Do not introduce bulk actions, filters, sorting systems, or other management features unless they are already required elsewhere.

7. Tracker Page Layout Refinement

This is the most important layout refinement.

Required desktop structure

┌────────────────────────────────────────────────────────────────────┐
│ ← Users       ALICE TEST                       ‹ 23 AUG 2026 ›     │
│               72 kg · 178 cm · Male                               │
├────────────────────────────────────────────────────────────────────┤
│ CALORIES IN │ BMR │ ACTIVITY OUT │ NET CALORIES                    │
├─────────────────────────────────┬──────────────────────────────────┤
│ CALORIES IN                     │ CALORIES OUT                     │
│                                 │                                  │
│ Add Food                        │ Add Activity                     │
│                                 │                                  │
│ Food selector                   │ Activity selector                │
│ Quantity                        │ Duration                         │
│ Meal                            │ Estimated calories               │
│ Estimated calories              │                                  │
│ [ Add Food ]                    │ [ Add Activity ]                 │
│                                 │                                  │
│ Today's Food                    │ Today's Activities               │
│                                 │                                  │
│ Daily Total                     │ Daily Total                      │
├─────────────────────────────────┴──────────────────────────────────┤
│                           [ Save Day ]                              │
└────────────────────────────────────────────────────────────────────┘

Desktop columns:

Calories In  ≈ 50%
Calories Out ≈ 50%

Mobile:

Summary
   ↓
Calories In
   ↓
Calories Out
   ↓
Save Day

8. Food Entry Refinement

Important reference-data correction

The supplied food dataset contains:

Calories → calories per 100g

The serving description is free text and cannot reliably be converted into grams.

Therefore, the application must not represent the source value as a literal "calories per serving".

Food entry

Use:

Food
[ Search food... ]

Serving reference
1 cup

Calories
197 kcal / 100g

Quantity
[ 150 ] g

Meal
[ Breakfast ]

Estimated calories
295.5 kcal

[ Add Food ]

The source serving description is informational.

Calculation

foodCalories =
    caloriesPer100g × quantityGrams / 100

This is the only quantitative interpretation that can be reliably derived from the supplied food dataset without inventing serving weights.

9. Food Search Dropdown Refinement

The current screenshot shows the dropdown blending with content underneath it.

This must be fixed.

Required behavior

The dropdown must:

appear directly below the search input

have a solid/near-opaque background

have its own border

have a shadow

sit above all surrounding content

have a maximum height

scroll internally

close after selection

close on outside click

close on Escape

support keyboard navigation

maintain readable result spacing

Visual treatment

Do not use the same high transparency as the parent glass panel.

Recommended:

background: rgba(15, 22, 34, 0.98);
backdrop-filter: blur(18px);
box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);

The dropdown should visually behave like an elevated surface.

10. Z-Index System

Do not solve layering problems using random large z-index values.

Define application layers:

--z-base: 0
--z-card: 10
--z-sticky: 20
--z-dropdown: 100
--z-popover: 150
--z-modal: 200
--z-toast: 300

Use these consistently.

This prevents dropdowns from appearing behind other cards or content.

11. Glassmorphism Rule

Glassmorphism should be applied to containers, not every interactive surface.

Use glass on

Header

Main panels

Summary cards

User cards

Form containers

Use opaque/elevated surfaces on

Dropdowns

Search result lists

Modals

Confirmation dialogs

Popovers

Toast content

This preserves the futuristic visual identity while maintaining readability.

12. Food Section Hierarchy

Separate the entry form from the saved entries.

CALORIES IN

Add Food
────────────────────────────────

Food
Quantity
Meal
Estimated Calories

[ Add Food ]

Today's Food
────────────────────────────────

BREAKFAST
Almond Chicken
150g · 295.5 kcal

LUNCH
...

Daily Total
295.5 kcal

Do not allow the dropdown or form controls to overlap the saved entries.

Use consistent vertical spacing between:

Input
Preview
Action
Saved entries
Total

13. Activity Section Hierarchy

Match the Food section.

CALORIES OUT

Add Activity
────────────────────────────────

Activity
Duration
Estimated Calories

[ Add Activity ]

Today's Activities
────────────────────────────────

Sports · tennis, doubles
45 min · 324 kcal

Daily Total
324 kcal

This creates a predictable visual pattern.

14. Activity Search Result Refinement

Activity names are not unique.

The UI must display the MET value.

Example:

sports
tennis, doubles · 6.0 MET

and:

sports
tennis, doubles · 4.5 MET

must remain visibly distinguishable.

Do not collapse these records based on activity/motion text.

15. Summary Metric Refinement

Keep the four required metrics:

Calories In
BMR
Activity Out
Net Calories

Use consistent card height and typography.

Example:

CALORIES IN
295.5 kcal

BMR
1778.3 kcal/day

ACTIVITY OUT
324 kcal

NET CALORIES
-1806.8 kcal
Food − BMR − Activity

Do not add calorie targets, recommendations, or medical interpretation.

16. Net Calories Presentation

The calculation remains:

Net Calories =
Food Calories − BMR − Activity Calories

Do not label negative/positive states as medically healthy/unhealthy.

Color can provide visual emphasis, but never use color as the only meaning.

17. Date Selector Refinement

Keep the existing date functionality.

Use:

‹   23 AUG 2026   ›

The date must:

allow today

allow the permitted previous 30-day window

reject future dates

reject dates older than the allowed range

load saved data when changed

The date must represent a calendar day, not an arbitrary timestamp.

18. Save Day Refinement

Save button states:

Save Day

Saving...

Saved ✓

On failure:

Unable to save this day.
Try again.

Prevent duplicate submissions while saving.

Do not add a complex notification system.

A lightweight toast/status message is sufficient.

19. Loading States

Every data-dependent component must have a visible loading state.

Examples:

Loading users...

Searching foods...

Searching activities...

Loading day...

Saving day...

Avoid layout jumps while loading.

20. Empty States

Use explicit empty states.

Examples:

No users yet.
Create your first user to begin tracking.

No food entries for this day.

No activities recorded.

Do not show empty panels that look like failed rendering.

21. Error Handling

Provide clear user-facing errors.

Examples:

Unable to load users.
Retry

Food could not be added.
Please check the quantity.

This date is outside the allowed tracking range.

Do not expose backend stack traces.

22. Frontend Search Optimization

The food dataset contains approximately 14k records and the activity dataset contains hundreds of records.

Never load all reference records into React.

Use:

GET /api/foods?search=chicken&page=1&limit=20

and:

GET /api/activities?search=tennis&page=1&limit=20

Implement:

debounce

minimum search length where appropriate

request cancellation/stale-result protection

pagination/limited results

keyboard navigation

Do not add a global state library solely for this.

23. Backend Architecture Refinement

Keep the Python backend lightweight.

Recommended structure:

server/
├── app/
│   ├── api/
│   ├── models/
│   ├── services/
│   ├── validators/
│   ├── db/
│   └── main.py
├── scripts/
│   ├── import_foods.py
│   └── import_activities.py
├── tests/
└── requirements.txt

Business calculations must remain independent of MongoDB and HTTP code.

Recommended services:

bmr_service
calorie_service
daily_summary_service

Pure calculation functions should have no database imports.

24. Backend Data Access Optimization

Save daily log

Do not query every food/activity individually.

Use batched lookups:

Food IDs
   ↓
one MongoDB $in query

Activity IDs
   ↓
one MongoDB $in query

Then calculate everything in memory and perform one daily-log upsert.

This avoids N+1 queries.

25. Backend Calculation Authority

Frontend calculations are previews only.

The backend must calculate:

BMR
Food calories
Activity calories
Food total
Activity total
Net calories

The frontend must not send authoritative totals.

The save request should contain only inputs/references:

{
  "foodEntries": [
    {
      "foodId": "...",
      "meal": "breakfast",
      "quantityGrams": 150
    }
  ],
  "activityEntries": [
    {
      "activityId": "...",
      "durationMinutes": 45
    }
  ]
}

26. Food Database Refinement

Recommended model:

Food
├── sourceId
├── name
├── foodGroup
├── caloriesPer100g
├── servingDescription
├── fatG
├── proteinG
└── carbohydrateG

Indexes:

sourceId UNIQUE
name
foodGroup

Trim strings during import.

Do not invent missing serving weights.

27. Activity Database Refinement

Recommended model:

Activity
├── sourceKey
├── activityName
├── specificMotion
└── metValue

sourceKey is unique.

Do not use:

specificMotion UNIQUE

or:

activityName + specificMotion UNIQUE

because legitimate duplicate motions exist.

28. Activity Idempotent Import

Generate a deterministic source key from:

activityName
+
specificMotion
+
metValue

Example:

sports|tennis, doubles|6.0

and:

sports|tennis, doubles|4.5

must produce different keys.

Use bulk upsert:

existing sourceKey → update
new sourceKey      → insert

Re-running the importer must not duplicate records.

Expected final activity count:

821

29. Food Idempotent Import

The food workbook has a stable unique ID.

Use:

sourceId UNIQUE

for import identity.

Bulk upsert against sourceId.

Expected final food count:

14,164

Running the importer twice must not create duplicate records.

30. Historical DailyLog Snapshots

A saved daily log should retain relevant source values.

Food

foodNameSnapshot
servingDescriptionSnapshot
caloriesPer100gSnapshot
quantityGrams
calories

Activity

activityNameSnapshot
specificMotionSnapshot
metValueSnapshot
durationMinutes
caloriesBurned

This prevents historical calculations from changing when reference data is re-imported.

31. DailyLog Uniqueness

Keep:

{ userId: 1, date: 1 }

as a unique compound index.

One user can have one saved daily record for a specific date.

Save operation remains an upsert.

32. API Surface

Do not add or remove endpoints because of these refinements.

Keep:

POST   /api/users
GET    /api/users
GET    /api/users/:userId
PUT    /api/users/:userId
DELETE /api/users/:userId

GET    /api/foods
GET    /api/foods/:foodId

GET    /api/activities
GET    /api/activities/:activityId

GET    /api/users/:userId/days/:date
PUT    /api/users/:userId/days/:date

The frontend should remain a client of this REST API.

33. API Validation

Validate:

name
age
weight
height
sex

foodId
meal
quantityGrams

activityId
durationMinutes

date

Reject:

malformed IDs

missing required fields

negative values

zero quantity

zero duration

invalid meal

invalid sex

future dates

dates outside the allowed historical window

Return consistent JSON error responses.

34. API Search Safety

Food/activity search strings must be escaped before use in MongoDB regex queries.

Do not interpolate raw user input directly into a regex.

Keep pagination limits bounded.

Example:

limit <= 50

The exact limit can be configured, but the API must prevent accidentally returning thousands of records.

35. Rounding Policy

Use one consistent rounding policy on frontend and backend.

Recommended:

Individual food entry → 2 decimals
Individual activity entry → 2 decimals
BMR → 2 decimals
Food total → sum rounded entries
Activity total → sum rounded entries
Net → calculated from rounded totals

This guarantees the values displayed in individual rows reconcile with the displayed totals.

36. Responsive Behavior

Large desktop

Use the full available workspace.

Tablet

Use reduced horizontal spacing and allow summary cards to wrap.

Mobile

Stack:

Header
User/date
Summary
Calories In
Calories Out
Save Day

Inputs become full width.

Dropdowns should never overflow the viewport.

37. Accessibility Refinement

Ensure:

semantic labels

visible focus states

keyboard navigation

keyboard-selectable dropdown results

Escape closes dropdown

Enter selects highlighted result

buttons have meaningful labels

errors are associated with fields

sufficient contrast

color is not the only state indicator

delete requires confirmation

The futuristic UI must remain usable without relying on visual effects.

38. Frontend Technical Cleanup

During inspection, check for:

No React key warnings
No uncontrolled/controlled input warnings
No unnecessary re-renders
No duplicate API requests
No search request on every keystroke
No stale search result overriding a newer result
No layout shift when dropdown opens
No horizontal page scrolling
No hidden content behind dropdowns
No clipped modal/dropdown shadows
No buttons changing dimensions while loading

39. Backend Technical Cleanup

Check:

No N+1 database queries
No database calls inside calculation functions
No duplicated formula logic
No frontend totals trusted by backend
No unbounded search results
No raw regex input
No unnecessary indexes
No duplicate daily records
No duplicate seed records
No stack traces in API responses
No secrets committed

40. Production-Readiness Pass

Before final delivery:

Frontend

Build successfully.

No console warnings.

No broken responsive layouts.

No overlapping controls.

Dropdown layering verified.

All API loading/error states tested.

Delete confirmation tested.

Save feedback tested.

Backend

API starts cleanly.

MongoDB connection failure is handled clearly.

Validation works.

Reference search is paginated.

Daily save uses batched lookups.

Calculations are tested.

Seed imports are idempotent.

Database

Food count verified.

Activity count verified.

Required indexes verified.

DailyLog uniqueness verified.

41. Verification Checklist

User workflow

Create user.

User appears in list.

View user.

Delete user with confirmation.

Deleted user's daily logs are removed.

Date workflow

Today selectable.

Today - 30 selectable.

Today - 31 rejected.

Tomorrow rejected.

Switching dates loads the correct data.

Food workflow

Search food.

Dropdown renders above surrounding content.

Dropdown is readable and opaque.

Select food.

Enter grams.

Select meal.

Preview calories.

Add food.

Food appears in correct meal group.

Daily total updates.

Remove food works.

Activity workflow

Search activity.

MET is visible in results.

Duplicate motion records remain distinguishable.

Enter duration.

Preview calories.

Add activity.

Daily total updates.

Remove activity works.

Calculation workflow

Male BMR formula verified.

Female BMR formula verified.

Food calories per 100g calculation verified.

Activity MET calculation verified.

Net calculation verified.

Frontend preview matches backend saved values.

Persistence

Save day.

Reload day.

Saved entries remain intact.

Reference-data re-import does not alter saved snapshots.

Same date updates rather than duplicates.

42. Import Verification

Food

Run importer twice.

Expected:

First run:
14,164 records available

Second run:
no duplicate records

Verify:

sourceId is unique
food groups are trimmed
caloriesPer100g is populated from Calories
servingDescription is optional

Activity

Run importer twice.

Expected:

821 records available

Verify:

sourceKey is unique
specificMotion is not unique
tennis, doubles / 6.0 exists
tennis, doubles / 4.5 exists

43. Testing Refinements

Unit tests

Test:

calculateMaleBMR
calculateFemaleBMR
calculateFoodCalories
calculateActivityCalories
calculateDailyNet

Food cases:

100g
150g
decimal grams

Activity cases:

integer duration
decimal MET
decimal duration

Validation cases:

zero grams
negative grams
zero duration
negative duration

Date cases:

today
today - 30
today - 31
tomorrow

44. Postman Verification

Keep the existing Postman collection.

Verify every endpoint:

Users
Foods
Activities
Daily Logs

Use variables:

baseUrl
userId
foodId
activityId
date

Verify:

success envelope

validation errors

404 responses

duplicate/conflict handling

daily upsert

correct calculated values

45. Scope Guardrails

Do not add:

authentication

calorie targets

diet recommendations

medical recommendations

notifications

wearable integrations

AI features

subscriptions

caching infrastructure

Redis

Kafka

microservices

unnecessary global state management

complex analytics

unrelated dashboards

The goal is to refine the required Net Calorie Tracker, not turn it into a larger health platform.

46. Final Refinement Priority

Implementation should be performed in this order.

Priority 1 — Correctness

Food data interpretation.

Food calorie calculation.

Activity source identity.

Idempotent import.

Backend-authoritative calculations.

Validation.

DailyLog persistence.

Priority 2 — Layout

Full desktop-width workspace.

Tracker two-column arrangement.

User form responsive grid.

User list responsive layout.

Food/activity section hierarchy.

Priority 3 — Layering

Dropdown z-index.

Opaque dropdown surfaces.

Modal/popover layering.

Overflow handling.

Priority 4 — UX

Loading states.

Empty states.

Error states.

Save feedback.

Search debounce.

Keyboard interactions.

Priority 5 — Production quality

Backend query optimization.

Database indexes.

Calculation tests.

API tests.

Import verification.

Console/build cleanup.

Responsive inspection.

Final README/Postman verification.

47. Final Expected Product

The finished system should look and behave like a focused production application:

NET//CAL
Net Calorie Tracker

                User Management
                       ↓
                 User Profile
                       ↓
                Date Selection
                       ↓
       ┌───────────────┴───────────────┐
       │                               │
   Calories In                    Calories Out
       │                               │
    Food Search                    Activity Search
       │                               │
   Quantity (g)                   Duration (min)
       │                               │
    Meal Type                       MET Value
       │                               │
    Food Calories                Activity Calories
       └───────────────┬───────────────┘
                       ↓
                     BMR
                       ↓
                Net Calories
                       ↓
                   Save Day
                       ↓
                    MongoDB

The UI should retain the existing futuristic/glassmorphism identity while becoming substantially cleaner and more usable.

The backend should remain deliberately small, with clear separation between API handling, validation, calculations, and persistence.

Most importantly, the refinements must solve the observed problems without changing what the system is supposed to do.