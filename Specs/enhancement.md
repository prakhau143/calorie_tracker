NET//CAL — Final Feature Verification & Completion Checklist

Purpose

Use this document as the final audit checklist for NET//CAL. Claude must verify the original assignment, the previously identified data issues, the premium UI refinements, the new Light/Dark theme control, testing, security, and Vercel readiness. Fix anything missing that is within scope; do not add unrelated product features.

The assignment requires a runnable project, database scripts/data, a Git repository, and evaluates code quality, structure, and economy. fileciteturn2file0L9-L20

1. Scope and Stack

Required workflow:
Create User → User List → View Detail → Select Date → Add Food → Add Activity → BMR → Net Calories → Save Day → Reload

Current implementation:

React frontend

Python REST backend

MongoDB

Vercel-compatible deployment

The source brief describes MERN/MEAN and Node.js; the project decision is React + Python + MongoDB. Keep this deviation explicit and defensible in README; do not falsely document Node.js. fileciteturn2file0L27-L31 fileciteturn2file0L63-L65

Do NOT add authentication, subscriptions, AI recommendations, notifications, wearables, medical advice, social features, unnecessary analytics, Redis/Kafka, or microservices.

2. User Management

The brief requires user entry, a user list, View Detail and Delete. fileciteturn2file0L46-L49

Create User

Name

Age (years)

Weight (kg)

Height (cm)

Sex

Required-field validation

Numeric validation

Loading/disabled submit state

Success/error feedback

Duplicate submission prevention

User List

Load from API

View Detail

Delete

Delete confirmation

Loading state

Empty state

Error state

Detail

Correct user information

Back navigation

No overlap with date controls

3. Date Requirements

The brief allows selection of up to 30 days in the past. fileciteturn2file0L32-L33

Today works

Today − 30 works

Today − 31 rejected

Future dates rejected

Previous/next controls work

Date change loads that day's data

Different dates remain independent

Backend validates date boundaries

Calendar day handling is consistent

4. Food Reference Data

The brief requires loading the supplied food XLSX data into MongoDB. fileciteturn2file0L29-L31

Food importer exists

Correct worksheet parsed

Numeric fields parsed correctly

Text fields trimmed

Missing values handled

Stable source identity

Idempotent re-import

No duplicate records

Important data correction

The supplied food data provides Calories per 100g, while serving descriptions are free text and may be missing.

Use:

foodCalories = caloriesPer100g × quantityGrams / 100

Store caloriesPer100g

User enters consumed grams

Serving description remains reference/context

Missing serving descriptions allowed

No invented cup/oz/waffle → gram conversion

Backend is authoritative

Food Group normalization

Trim Food Group values

"Dairy and Egg Products " becomes "Dairy and Egg Products"

No duplicate category caused by whitespace

5. Food Search and Entry

The brief requires food selection, portion, meal time, consumed calories, daily list and total. fileciteturn2file0L50-L54

Search works

Search is debounced

Results are paginated/limited

Food result shows name

Calories per 100g is clear

Serving description shown when available

Quantity in grams

Quantity > 0

Meals: Breakfast / Lunch / Dinner / Snack

Live calorie preview

Add Food

Remove Food

Multiple entries

Meal grouping

Daily total

Dropdown

Opaque/near-opaque background

Above underlying content

Correct z-index

Border/shadow

Internal scrolling

Viewport collision handling

Opens upward when necessary

Outside click closes

Escape closes

Keyboard navigation

No clipping or layout overlap

6. Activity Reference Data

The brief requires importing activities with Activity Name, Specific Motion and MET Value. fileciteturn2file0L30-L31 fileciteturn2file0L75-L79

Importer exists

Activity Name parsed

Specific Motion parsed

MET parsed numerically

Text trimmed

Import idempotent

Required identity correction

Do NOT make specificMotion unique.

Do NOT use only activityName + specificMotion as unique identity.

Use deterministic:

sourceKey = activityName + specificMotion + metValue

sourceKey unique

Different MET values produce different keys

Duplicate motions remain valid

tennis, doubles → 6.0 MET exists

tennis, doubles → 4.5 MET exists

Re-import creates no duplicates

7. Activity Search and Entry

The brief requires activity selection, duration in minutes and calories burnt. fileciteturn2file0L55-L57

Search works

Search limited/paginated

Search debounced

Activity name visible

Specific motion visible

MET visible

Duplicate motions distinguishable

Duration in minutes

Duration > 0

Live calorie preview

Add Activity

Remove Activity

Multiple activities

Daily total

8. Required Calculations

Male BMR

66.4730 + (13.7516 × weightKg) + (5.0033 × heightCm) − (6.7550 × ageYears)

Female BMR

655.0955 + (9.5634 × weightKg) + (1.8496 × heightCm) − (4.6756 × ageYears)

Activity

MET × weightKg × (durationMinutes / 60)

These formulas are specified in the assignment. fileciteturn2file0L34-L38

Net

Food Total − BMR − Activity Total

Verify:

Male formula

Female formula

Age in years

Weight kg

Height cm

Activity minutes converted to hours

Backend-authoritative calculation

Frontend preview matches backend

Negative net values display correctly

9. Daily Log

The brief requires saving all daily data to MongoDB and loading data when another date is selected. fileciteturn2file0L59-L62

GET day works

PUT/upsert day works

Same user/date updates instead of duplicates

Food entries persist

Activity entries persist

Calculations persist/reconcile

Different dates remain independent

Reload restores data

Recommended unique index:
{ userId: 1, date: 1 } UNIQUE

10. Historical Snapshots

Food:

foodNameSnapshot

servingDescriptionSnapshot

caloriesPer100gSnapshot

quantityGrams

calories

Activity:

activityNameSnapshot

specificMotionSnapshot

metValueSnapshot

durationMinutes

caloriesBurned

Verify reference-data re-import does not unexpectedly change historical days.

11. API Checklist

The brief requires REST APIs and Postman API testing. fileciteturn2file0L63-L65

Verify:

User create/list/detail/delete

Food search/detail where used

Activity search/detail where used

Daily GET

Daily PUT/upsert

Consistent JSON error envelope

No stack traces/secrets in responses

Validation:

Missing fields

Malformed IDs

Nonexistent IDs

Invalid dates

Future dates

Out-of-range dates

Zero/negative grams

Zero/negative duration

Invalid meal

Invalid sex

Example error:

{"success":false,"error":{"message":"Invalid request","code":"VALIDATION_ERROR"}}

12. Automated API Tests

Keep Supertest because it is already part of the development setup and the plan calls for API testing.

User

Create

List

Detail

Delete

Validation failure

Invalid/nonexistent ID

Food

Search

Limit/pagination

Empty result

Activity

Search

Duplicate motion handling

Daily Log

GET

PUT/upsert

Food calculation

Activity calculation

BMR

Net

Invalid references

Invalid date

Error envelope

Keep tests focused; do not create a huge integration suite.

13. Postman

Keep the Postman collection because the assignment explicitly asks for API testing demonstration. fileciteturn2file0L63-L65

Users tested

Food search tested

Activity search tested

Daily GET tested

Daily PUT tested

Validation failures tested

Environment variables documented

14. Header + Light/Dark Mode

Add a proper Light/Dark mode control to the header.

Example:
NET//CAL                                      ☀ / ☾

Exact visual treatment is designer-controlled.

Verify:

Toggle visible in header

Light mode works

Dark mode works

Header changes

Cards change

Inputs change

Dropdowns change

Buttons remain readable

Borders remain visible

Shadows remain appropriate

No old-theme component remains

Theme persists after refresh

Uses lightweight persistence such as localStorage

No duplicate component tree for themes

System preference can be respected if implemented

Theme tokens

Use semantic variables:
background, surface, surface-elevated, text-primary, text-secondary, text-muted, border, accent, success, warning, danger.

Light mode must be deliberately designed, not simply "dark colors turned white."

15. Premium UI / Layout

Verify:

Desktop uses approximately 90–94% available workspace with sensible max width

No huge unused side whitespace

Tracker uses balanced Calories In / Calories Out columns

Mobile stacks naturally

User page uses desktop width effectively

No section overlap

No horizontal scroll

Long names do not break layout

Loading/error/empty states do not shift layout

Tracker navigation

Use one premium iOS-inspired row:
← Users          NET//CAL / User Name          Date

Back button top-left

Product/user identity visually centered

Date controls aligned

No separate unnecessary back-button row

Mobile remains usable

16. Design System

Create centralized tokens for:

Color

Typography

Spacing

Radius

Shadows

Transitions

Z-index

Premium direction:

Eye-friendly

Calm

Cohesive

Restrained gradients

No excessive neon/glow

Strong hierarchy

Consistent buttons/inputs/cards

No generic AI-dashboard appearance

Glassmorphism:

Header/cards/panels may use glass

Dropdowns/modals/popovers must be opaque/elevated

Text remains readable in both themes

17. Branding and Icons

Create/integrate custom project branding:

public/brand/
├── netcal-logo.svg
├── netcal-mark.svg
└── favicon.svg

Verify:

Custom logo

SVG mark

Favicon

Works in light mode

Works in dark mode

No generic stock lightning/AI icon

SVGs optimized

Consistent icon system:

Back

Calendar

Previous/next

Search

Close

Plus

Delete

Save

Food

Activity

Light/Dark mode

Do not mix random Unicode glyphs with the icon system.

18. Accessibility

Semantic labels

Keyboard navigation

Visible focus

Sufficient contrast

Color is not the only state indicator

Icon-only buttons have accessible labels

Escape closes overlays

Enter selects dropdown result

Delete confirmation accessible

Reduced-motion preference respected

19. Frontend Performance

Never load all food records into browser

Search is debounced

Activity search is efficient

Stale search responses cannot overwrite newer results

No unnecessary re-renders

No duplicate API requests

Assets/SVGs optimized

No unnecessary heavy dependency

No React warnings

Production build succeeds

20. Backend Performance

No N+1 queries

Food IDs fetched with one batched query

Activity IDs fetched with one batched query

One efficient DailyLog upsert

Search results bounded

Regex input safely escaped

Mongo connection reused/cached appropriately

Index sync not run on every serverless request

Indexes:

Food: sourceId UNIQUE, name
Activity: sourceKey UNIQUE, activityName, specificMotion
DailyLog: (userId, date) UNIQUE

21. Security

.env ignored

No MongoDB credentials in Git

.env.example contains placeholders only

Any exposed database credential is rotated

Production errors do not expose secrets

Backend validates all input

Search regex is escaped

CORS is restricted to expected frontend origins

22. Vercel Deployment

Verify:

React production build succeeds

Python API is Vercel-compatible

API entry point exists

vercel.json is correct if required

SPA refresh works

API routes work

Production MongoDB connection works

Environment variables documented

No secrets committed

Frontend uses production API URL

Imports are not executed during every build

23. Responsive Inspection

Inspect:

1440×900
1600×900
1920×1080
2560×1440
1024×768
768×1024
390×844

At every size:

No overlap

No horizontal scroll

No clipped dropdown

No clipped buttons

Header works

Theme toggle works

Tracker layout works

Forms work

Save Day remains accessible

24. Full End-to-End Verification

Use a test user such as:
Alice Test / 25 years / 72 kg / 178 cm / Male

Verify:

Create user

User appears in list

Open detail

Select today

Search food

Select food

Enter grams

Select Breakfast

Verify food preview

Add food

Search activity

Select activity

Enter duration

Verify activity preview

Add activity

Verify Food Total

Verify BMR

Verify Activity Total

Verify Net Calories

Save Day

Reload same day

Verify persistence

Change date

Verify independent data

Return to users

Delete user

Verify confirmation

Toggle Light Mode

Verify entire application

Toggle Dark Mode

Refresh

Verify theme persistence

25. Final Active Audit

Do not merely tick boxes. Inspect the implementation and actively find:

Missing features

Broken buttons

Missing API routes

Incorrect calculations

Missing validation

Missing loading/error/empty states

Duplicate records

Food category duplication

Activity identity problems

Search performance issues

N+1 queries

Unused dependencies

Console warnings

Responsive defects

Theme inconsistencies

Dropdown layering defects

Broken Vercel routing

Missing environment configuration

Exposed secrets

Missing tests

Missing documentation

If an item is required by the product or an existing implementation decision, fix it.

If it is outside the assignment scope, do not add it.

The assignment explicitly evaluates code quality, structure and economy. fileciteturn2file0L93-L96

26. Repository / Git Final Check

git status clean

Correct branch

Intended commits present

No .env

No passwords/API secrets

No debug files

README updated

Tests committed

Postman collection committed

Import scripts committed

Deployment configuration committed

27. README Final Check

README must document:

Project purpose

Actual stack

Architecture

Local setup

MongoDB/Atlas setup

Environment variables

Food import

Activity import

Data assumptions

Running frontend

Running backend

Running unit/API tests

Postman

Vercel deployment

Important activity sourceKey strategy

Important food per-100g assumption

28. Final Report Claude Must Produce

After completing the audit, output:

Completed

...

Fixed During Audit

...

Verified

...

Remaining Issues

...

Intentionally Not Added

...

Test Status

Unit:

API:

Postman:

End-to-end:

Deployment Status

Local:

Vercel:

MongoDB/Atlas:

Do not claim something is verified unless it was actually checked.

29. Definition of Done

NET//CAL is complete when:

Required functionality
+
Correct formulas
+
Correct reference-data handling
+
MongoDB persistence
+
REST APIs
+
API tests
+
Postman verification
+
Premium responsive UI
+
Light/Dark mode
+
Correct dropdown layering
+
Custom branding
+
Accessibility
+
Performance
+
Security
+
Vercel readiness
+
Clean repository
+
Updated documentation

are all verified.

The final product must remain a focused Net Calorie Tracker. The source assignment requires a runnable project and later code-review discussion of the implementation and thought process. fileciteturn2file0L9-L18 fileciteturn2file0L90-L99