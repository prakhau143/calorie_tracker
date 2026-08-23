NET//CAL — Premium UI, Brand & Vercel Deployment Refinement

Purpose

This document is the implementation brief for the final frontend refinement and deployment-readiness pass of NET//CAL.

The goal is to take the existing functional Net Calorie Tracker and make it feel like a premium, intentionally designed software product rather than a generic AI-generated dashboard.

This is a refinement of the existing product, not a scope expansion.

The functional requirements remain unchanged:

User creation.

User listing.

User detail.

User deletion.

Date selection within the permitted historical window.

Food selection and calorie entry.

Activity selection and calorie calculation.

BMR calculation.

Net calorie calculation.

Daily save/load.

MongoDB persistence.

REST API.

Reference-data import.

Backend-authoritative calculations.

The visual system may be redesigned substantially as long as these workflows remain easy to discover and use.

1. Current Visual Problems Observed

The current screenshots show three primary areas requiring immediate refinement.

1.1 Main tracker sections are visually overlapping

The Calories In / Calories Out content has insufficient separation in some states.

Problems include:

Content from one section visually colliding with the next.

Saved-entry areas not having enough vertical separation.

Cards appearing to overlap when content grows.

Insufficient internal spacing between headings, forms, entries, and totals.

Large translucent surfaces making boundaries difficult to understand.

Required outcome

Every section must have a predictable layout flow:

Section
  ↓
Section heading
  ↓
Input area
  ↓
Action
  ↓
Saved entries
  ↓
Daily total

No element should visually cover another element during:

search

dropdown opening

adding an entry

validation errors

loading

empty state

long food/activity names

multiple entries

different viewport widths

2. Dropdown / Overlay Layering

This remains a critical issue.

The current translucent dropdown appearance makes content underneath appear visible through the dropdown, producing an accidental overlap effect.

Required behavior

Dropdowns must be rendered as elevated UI surfaces.

They must:

sit above surrounding cards/content

have an opaque or near-opaque background

have a clear border

have an appropriate shadow

have enough contrast

have internal scrolling

never reveal text underneath through the surface

remain inside the viewport

avoid clipping

close on selection

close on outside click

close on Escape

support keyboard navigation

Visual rule

Do not use the same transparency level as the main glass cards.

Recommended direction:

background: rgba(15, 21, 32, 0.97);
backdrop-filter: blur(18px);
box-shadow: 0 20px 50px rgba(0, 0, 0, 0.40);

The exact values are designer-controlled.

The principle is mandatory:

Glassmorphism for containers; elevated opaque surfaces for interactive overlays.

3. Z-Index System

Implement a deliberate layering system rather than random z-index values.

Suggested design tokens:

--z-base: 0;
--z-card: 10;
--z-sticky: 20;
--z-dropdown: 100;
--z-popover: 150;
--z-modal: 200;
--z-toast: 300;

The implementation may use different values, but the hierarchy must remain consistent.

Required hierarchy:

Page
 ↓
Cards
 ↓
Sticky UI
 ↓
Dropdowns
 ↓
Popovers
 ↓
Modals
 ↓
Toasts

4. Full Desktop Width

The current application wastes too much horizontal space on large desktop screens.

The main content should use the available desktop viewport intelligently.

Required

Use a responsive application container approximately in the range of:

90%–94% viewport width

with a sensible maximum width for very large displays.

Example:

.app-content {
  width: min(94vw, 1800px);
  margin-inline: auto;
}

The final width is a design decision.

Important

Do not simply stretch every card to extreme widths.

Use:

full-width workspace

balanced internal grids

readable form controls

appropriate maximum widths for text-heavy areas

The application should feel spacious rather than empty.

5. Tracker Layout

The tracker should use the desktop viewport effectively.

Recommended structure:

┌──────────────────────────────────────────────────────────────┐
│ Navigation / User / Date                                    │
├──────────────────────────────────────────────────────────────┤
│ Calories In │ BMR │ Activity Out │ Net Calories              │
├─────────────────────────────┬────────────────────────────────┤
│                             │                                │
│       CALORIES IN           │         CALORIES OUT           │
│                             │                                │
│       Add Food              │         Add Activity           │
│                             │                                │
│       Today's Food          │         Today's Activities     │
│                             │                                │
│       Daily Total           │         Daily Total             │
│                             │                                │
├─────────────────────────────┴────────────────────────────────┤
│                        SAVE DAY                              │
└──────────────────────────────────────────────────────────────┘

Desktop:

Calories In ≈ 50%
Calories Out ≈ 50%

The exact ratio can be adjusted based on content density.

Mobile:

Summary
↓
Calories In
↓
Calories Out
↓
Save Day

6. User Page Layout

The user creation/list page should also use the desktop workspace effectively.

Recommended structure:

┌──────────────────────────────────────────────────────────────┐
│ CREATE USER                                                   │
│                                                              │
│ Name      Age      Weight      Height      Sex                │
│ [────]    [───]    [────]     [────]      [────]              │
│                                                              │
│ [ Create User ]                                               │
├──────────────────────────────────────────────────────────────┤
│ USERS                                                        │
│                                                              │
│ Name      Age      Weight      Height      Sex      Actions   │
│ Alice     25       72kg       178cm       Male     View      │
└──────────────────────────────────────────────────────────────┘

Use responsive CSS Grid.

Do not hard-code a narrow central panel.

7. iOS-Style Top Navigation

The third screenshot shows:

NET//CAL header
        ↓
Back to Users

as separate vertical sections.

This should be redesigned.

Required behavior

On the user tracker page, the navigation should feel like a native premium application.

Use one top navigation row:

┌──────────────────────────────────────────────────────────────┐
│ ← Users                 NET//CAL / User Name                 │
└──────────────────────────────────────────────────────────────┘

More specifically:

Back button anchored on the left.

Product identity/title centered.

Remaining space distributed naturally.

Single horizontal row.

Consistent vertical alignment.

No second floating row solely for the back button.

The exact visual treatment is designer-controlled.

iOS-inspired principle

The goal is the information hierarchy, not copying Apple's visual design.

It should feel:

calm

balanced

minimal

premium

immediately understandable

8. Navigation Behavior

Back navigation must remain obvious.

Recommended:

← Users

or:

‹ Users

The designer can choose the icon style.

The button should have:

clear hit area

visible hover/focus state

keyboard accessibility

no excessive visual weight

The centered product/user title should not overlap the back control.

9. Brand / Logo Design

A dedicated NET//CAL visual identity should be created.

Requirement

Use the project's design tooling to create a custom logo and SVG icon rather than relying on generic text treatment.

The logo should communicate:

NET
CAL
energy balance
calorie tracking
data/precision

without using obvious generic AI/health-app imagery.

Avoid

Do not use:

generic dumbbells

generic apple icons

generic heartbeat icons

generic AI sparkle logos

stock illustrations

copied existing brand marks

The mark should be simple enough to work at small sizes.

10. Logo Deliverables

Create:

public/
└── brand/
    ├── netcal-logo.svg
    ├── netcal-mark.svg
    └── favicon.svg

If a light/dark variation is necessary:

netcal-logo-dark.svg
netcal-logo-light.svg

Keep SVGs optimized and lightweight.

Do not rasterize the primary logo.

11. Logo Placement

Main application

Use the logo/mark in the header.

Example:

[NET//CAL mark] NET//CAL

Tracker navigation

The product identity should occupy the center/title area of the top navigation.

Browser

Use the mark as the favicon.

Loading / empty states

The mark may be used subtly where appropriate.

Do not place the logo everywhere simply for branding.

12. SVG Icon System

Create a small project-specific icon set where required.

Minimum:

back
calendar
chevron-left
chevron-right
search
close
plus
delete
save
food
activity

Icons should have a consistent:

stroke width

corner treatment

visual weight

viewBox

alignment

Do not mix unrelated icon styles.

If an icon library is already used, keep it consistent rather than introducing multiple icon systems.

13. Complete Color Theme

The current dark blue/purple theme is a good starting direction but should be refined into a complete design system.

Do not select colors independently for every component.

Create design tokens.

Example direction:

:root {
  --bg-primary: ...;
  --bg-secondary: ...;
  --surface: ...;
  --surface-elevated: ...;

  --text-primary: ...;
  --text-secondary: ...;
  --text-muted: ...;

  --accent-primary: ...;
  --accent-secondary: ...;

  --success: ...;
  --warning: ...;
  --danger: ...;

  --border-subtle: ...;
  --border-strong: ...;
}

The designer is free to choose the exact palette.

14. Color Design Principles

The final palette must be:

eye-friendly

low strain

high contrast where required

consistent

sophisticated

restrained

accessible

Avoid:

excessive neon

saturated gradients everywhere

rainbow UI

excessive purple/cyan glow

low-contrast grey text

colored text purely for decoration

Use accent colors primarily for:

primary actions

focus states

selected states

important metrics

subtle brand identity

15. Semantic Colors

Maintain a clear semantic system.

Success
→ save completed / successful action

Warning
→ non-blocking caution

Danger
→ deletion / destructive action

Info
→ contextual information

Net calorie values may have visual emphasis, but color must never be the only way of communicating meaning.

16. Typography

The interface should have a deliberate typographic hierarchy.

Recommended:

Display / Product identity
Page heading
Section heading
Field label
Body
Secondary text
Metric value
Metric unit

Use a highly readable primary font.

A technical/monospaced style can be used selectively for:

calorie numbers

dates

technical metadata

Do not make the entire application monospace.

17. Metric Cards

Keep the four required metrics:

CALORIES IN
BMR
ACTIVITY OUT
NET CALORIES

Each card should have:

consistent height

consistent padding

aligned metric values

readable units

subtle visual distinction

restrained accent treatment

Example:

CALORIES IN

295.5 kcal

The metric value should dominate the card.

18. Food Entry UI

Use a clear vertical rhythm:

ADD FOOD

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

The UI must clearly distinguish:

source information

from:

user input

and:

calculated output

19. Food Data Rule

The supplied dataset contains calories per 100g rather than a reliable numeric calories-per-serving value.

Therefore:

foodCalories =
caloriesPer100g × quantityGrams / 100

Do not convert free-text descriptions such as:

1 cup
1 waffle
3 oz
11 crackers

into grams automatically.

Serving description is informational context.

This is a data-source constraint, not a product scope expansion.

20. Activity Entry UI

Use the same visual hierarchy as Food.

ADD ACTIVITY

Activity
[ Search activities... ]

MET
6.0

Duration
[ 45 ] min

Estimated calories
324 kcal

[ Add Activity ]

Search results must expose the MET value.

This is required because activity/motion text is not guaranteed to be unique.

21. Entry List Design

Food and activity entries should use compact rows.

Food:

Breakfast

Almond Chicken
150g · 295.5 kcal                         ×

Activity:

Sports · tennis, doubles
45 min · 324 kcal                         ×

Do not make every entry a large card.

The list should remain compact as entries accumulate.

22. Meal Grouping

Keep the required meal options:

Breakfast
Lunch
Dinner
Snack

Display entries grouped by meal.

Hide empty meal groups where appropriate so the page does not become unnecessarily long.

23. Daily Totals

Use clear total rows.

DAILY TOTAL                         295.5 kcal

Use the same layout for Calories Out.

The totals should visually close each section.

24. Save Day

The Save Day action should be visually prominent but not oversized.

States:

Save Day
Saving...
Saved ✓
Error — Try Again

Prevent duplicate submissions.

The saved state should be communicated without a large modal.

25. Interaction Refinement

Every interactive control should have:

default
hover
focus
active
disabled
loading

where relevant.

Do not rely only on color changes.

Buttons should feel responsive without excessive animations.

26. Animation

Use subtle motion only.

Recommended:

dropdown open/close

button state transition

metric update

page transition

toast appearance

hover elevation

Avoid:

continuous animations

floating decorative particles

excessive glowing effects

large entrance animations

motion that delays interaction

Respect:

prefers-reduced-motion

27. Responsive Requirements

Desktop

Use full workspace.

Tablet

Allow:

summary cards → 2 × 2
tracker columns → stacked when necessary

Mobile

Use:

single-column layout

The top navigation must remain usable.

Dropdowns must never extend beyond the viewport.

28. Accessibility

The premium design must remain accessible.

Required:

semantic labels

keyboard navigation

visible focus

sufficient contrast

accessible buttons

accessible combobox behavior

Escape closes dropdown

Enter selects highlighted result

screen-reader-friendly labels

no color-only state communication

delete confirmation

reduced-motion support

29. Frontend Technical Refinement

Inspect and fix:

React key warnings

uncontrolled/controlled input warnings

unnecessary re-renders

duplicate API calls

stale autocomplete responses

missing loading states

missing error states

layout shifts

horizontal overflow

clipped shadows

dropdown clipping

inconsistent spacing

inconsistent border radii

inconsistent button heights

30. Backend Refinement

The backend remains:

React
 ↓
Python REST API
 ↓
MongoDB

Do not add unnecessary infrastructure.

Maintain

backend-authoritative calculations

batched food lookup

batched activity lookup

DailyLog upsert

validation

consistent error envelope

pagination

safe search

source-data snapshots

31. Backend Query Optimization

When saving a daily log:

food IDs
   ↓
one batched lookup

activity IDs
   ↓
one batched lookup

calculate
   ↓
one DailyLog upsert

Do not introduce N+1 database queries.

32. Backend Indexes

Maintain only useful indexes.

Recommended:

Food:
sourceId UNIQUE
name

Activity:
sourceKey UNIQUE
activityName
specificMotion

DailyLog:
(userId, date) UNIQUE

Avoid indexing every field.

33. Reference Data Import

Food:

sourceId → unique import identity

Activity:

activityName + specificMotion + metValue
        ↓
deterministic sourceKey

This allows legitimate duplicate motion descriptions while keeping imports idempotent.

34. Historical Snapshotting

Daily logs must retain relevant reference values.

Food:

foodNameSnapshot
caloriesPer100gSnapshot
servingDescriptionSnapshot
quantityGrams
calories

Activity:

activityNameSnapshot
specificMotionSnapshot
metValueSnapshot
durationMinutes
caloriesBurned

Reference-data changes must not alter historical saved days.

35. API Testing

Keep the existing automated API testing decision.

Use focused Supertest integration tests for:

User CRUD

Food search

Activity search

Daily-log GET

Daily-log PUT/upsert

Validation failures

Error envelope

Keep the Postman collection for manual demonstration.

Do not create an unnecessarily large integration test suite.

36. Deployment Architecture

The application must be Vercel-ready without changing the core product architecture.

Frontend

Deploy React/Vite frontend to Vercel.

Backend

The Python REST API must use a Vercel-compatible serverless deployment structure.

The exact Python framework should be implemented in a way that can be exposed through a Vercel Python function.

Do not assume a long-running server process is available on Vercel.

Database

MongoDB remains external to Vercel.

Use an environment-based MongoDB connection string.

37. Vercel Project Structure

The final repository should make deployment straightforward.

Recommended:

net-calorie-tracker/
├── client/
│   ├── src/
│   ├── public/
│   │   └── brand/
│   │       ├── netcal-logo.svg
│   │       ├── netcal-mark.svg
│   │       └── favicon.svg
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── app/
│   ├── scripts/
│   ├── tests/
│   └── requirements.txt
│
├── api/
│   └── index.py
│
├── data/
├── postman/
├── .env.example
├── vercel.json
└── README.md

The exact backend structure may differ if the selected Python framework has a cleaner Vercel adapter, but deployment must remain simple.

38. Vercel Configuration

Provide a production-ready vercel.json only if required by the chosen project structure.

It must:

route API requests to the Python backend function

serve the React application correctly

avoid exposing internal files

support SPA routing

preserve API paths

avoid conflicting frontend/API rewrites

Do not add unnecessary build configuration.

39. Environment Configuration

Never commit production secrets.

Frontend:

VITE_API_BASE_URL

Backend:

MONGODB_URI
CLIENT_URL
NODE_ENV

Use .env.example.

Production environment values must be configured in Vercel project settings.

40. CORS

The backend must allow the configured frontend origin.

Development:

localhost frontend

Production:

Vercel frontend origin

Do not use unrestricted:

Access-Control-Allow-Origin: *

when the application is deployed with a known frontend origin.

41. MongoDB Deployment Readiness

The production MongoDB connection must:

use environment variables

reuse connections where supported

avoid opening unnecessary connections per request

have the required indexes

handle connection failures cleanly

Do not add Redis or another connection layer.

42. Frontend Build Requirements

Before deployment:

npm install
npm run build

must succeed without:

warnings that indicate real defects

missing assets

broken imports

unresolved environment variables

The Vercel build must use the production API URL.

43. API Production Requirements

Verify:

/api/users
/api/foods
/api/activities
/api/users/:userId/days/:date

against the deployed backend.

Errors must continue using the same JSON envelope.

No development stack traces should be returned.

44. Deployment Verification

After deployment verify:

Frontend

homepage loads

logo loads

favicon loads

fonts/assets load

SPA navigation works

refresh does not produce a 404

responsive layouts work

Backend

health endpoint works if present

user CRUD works

food search works

activity search works

daily log load works

daily log save works

Database

production MongoDB is connected

indexes exist

data is available

imports are not accidentally executed during every frontend build

45. Production UI Inspection

Before calling the UI complete, inspect at minimum:

1440 × 900
1600 × 900
1920 × 1080
2560 × 1440
1024 × 768
768 × 1024
390 × 844

Check:

no overlap

no horizontal scroll

no clipped dropdown

no clipped modal

no excessive empty space

no tiny content area

no unreadable text

no broken navigation

no button overflow

no long-name overflow

46. Visual Quality Standard

The final UI should not look like:

generic dashboard
+
random gradient
+
glassmorphism
+
AI-generated cards

Instead it should feel like a cohesive product.

The designer has freedom to determine:

exact color palette

gradients

typography

border treatment

shadows

icon style

spacing scale

radius scale

logo geometry

animation style

metric presentation

But all decisions must support:

clarity
consistency
calmness
precision
premium feel

47. Design Freedom

Do not prescribe every pixel.

The designer/frontend developer should be free to make professional decisions where the requirements do not specify exact values.

The mandatory constraints are:

No overlap
No accidental transparency
No excessive empty desktop space
Clear information hierarchy
Accessible contrast
Consistent component system
Responsive behavior
Professional branding
Production-ready interactions

48. Design System Tokens

Create centralized design tokens for:

colors
spacing
radii
shadows
typography
transitions
z-index

Example:

:root {
  --space-1: ...;
  --space-2: ...;
  --space-3: ...;
  --space-4: ...;

  --radius-sm: ...;
  --radius-md: ...;
  --radius-lg: ...;

  --shadow-sm: ...;
  --shadow-md: ...;
  --shadow-lg: ...;
}

Components should consume tokens rather than repeating arbitrary values.

49. Component Consistency

Buttons should share:

height
radius
font weight
focus treatment
transition

Inputs should share:

height
border
radius
focus treatment
placeholder styling

Cards should share:

radius
border
shadow
surface treatment

Do not create slightly different versions of the same component without a clear reason.

50. Final Acceptance Criteria

Visual

Full desktop workspace used effectively.

Tracker is not constrained to a narrow center column.

User page uses desktop space properly.

Back button and product title occupy one navigation row.

Dropdowns never visually blend with content underneath.

Dropdowns have correct z-index.

Dropdowns have appropriate opacity.

No sections overlap.

No text is clipped.

No horizontal overflow.

Color system is consistent.

Typography is consistent.

Logo and SVG icons are integrated.

UI feels premium rather than generic.

Responsive layouts work.

Functional

User CRUD works.

Food search works.

Food quantity uses grams.

Activity search works.

Duplicate activity motions remain distinguishable.

BMR is correct.

Food calories are correct.

Activity calories are correct.

Net calories are correct.

Daily save/load works.

Date restrictions work.

Backend

Batched lookups are used.

No N+1 queries.

Reference data is indexed appropriately.

DailyLog is uniquely keyed by user/date.

Seed imports are idempotent.

Historical snapshots are preserved.

Validation is enforced.

API errors use the common envelope.

API tests exist.

Postman collection remains available.

Deployment

React production build succeeds.

Python API is Vercel-compatible.

Vercel configuration is present if required.

Environment variables are documented.

MongoDB production connection works.

SPA routing works after refresh.

API routing works from production frontend.

No secrets are committed.

Production UI passes desktop/mobile inspection.

51. Final Implementation Order

Phase 1 — Layout foundation

Replace narrow desktop container.

Refine page grid.

Rebuild tracker two-column layout.

Combine back navigation and product title into one top row.

Fix section spacing and overflow.

Phase 2 — Layering

Implement z-index tokens.

Fix dropdown positioning.

Make dropdowns opaque/elevated.

Fix overflow/portal behavior.

Verify long search results.

Phase 3 — Design system

Establish complete color palette.

Establish typography.

Establish spacing.

Establish radii.

Establish shadows.

Establish transitions.

Phase 4 — Branding

Create NET//CAL logo.

Create SVG mark.

Create required icons.

Add favicon.

Integrate branding consistently.

Phase 5 — Component refinement

Refine metric cards.

Refine inputs.

Refine buttons.

Refine food entry.

Refine activity entry.

Refine entry lists.

Refine totals.

Refine save state.

Refine empty/loading/error states.

Phase 6 — Backend optimization

Verify query batching.

Verify indexes.

Verify source keys.

Verify idempotent import.

Verify snapshots.

Verify validation.

Verify API error envelope.

Phase 7 — Testing

Run unit tests.

Add/run Supertest API tests.

Run Postman verification.

Run import verification.

Run complete manual workflow.

Phase 8 — Deployment

Configure production environment.

Configure Vercel.

Build frontend.

Deploy Python API.

Configure MongoDB.

Verify production API.

Verify production frontend.

Perform final responsive inspection.

52. Definition of Done

The work is complete only when the product satisfies all of the following:

The application works.
        +
The data calculations are correct.
        +
The database layer is efficient.
        +
The APIs are tested.
        +
The UI has no overlap or layering defects.
        +
The desktop layout uses space correctly.
        +
The mobile layout remains usable.
        +
The brand feels intentional.
        +
The color system is cohesive.
        +
The interface is accessible.
        +
The application can be deployed to Vercel.
        +
The implementation remains within assignment scope.

The final result should feel like a small, polished production product rather than a visually decorated coding assignment.