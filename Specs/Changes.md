Flagged Data Findings — Required Plan Changes

This document contains only the changes required after inspecting the supplied Food and Activity Excel datasets. The overall product scope, workflow, APIs, UI direction, and core calculation system remain unchanged.

1. Food Portion / Calorie Representation

Change in Decisions

Replace:

Portion → Serving multiplier

With:

Portion → Quantity consumed in grams

Reason

The supplied food-calories.xlsx data provides Calories as a per-100g value. Serving Description 1 (g) is free text such as:

1 cup

3 oz

1 waffle

round (4 inchdia)

11 crackers (1 nlea serving)

There is no reliable numeric serving weight available, and 539 rows have no serving description.

Therefore, the system must not silently treat the Calories column as calories per serving.

Required Assumption

Document this assumption in the README/product documentation:

The supplied food dataset provides calories per 100g rather than a reliable numeric calories-per-serving value. Serving descriptions are retained as reference information only. The user's consumed food quantity is therefore entered in grams, and calories are calculated from the per-100g source value.

Food Calculation

Replace:

Food Calories = Calories per Serving × Portion

with:

Food Calories =
Calories per 100g × Consumed Grams / 100

Example:

Calories per 100g = 130
Consumed quantity = 150g

Food Calories = 130 × 150 / 100
              = 195 kcal

2. Food Model

Replace:

caloriesPerServing

with:

caloriesPer100g

Recommended food structure:

Food
├── sourceId
├── name
├── foodGroup
├── caloriesPer100g
├── servingDescription
├── fatG
├── proteinG
└── carbohydrateG

servingDescription remains optional because some source rows do not contain it.

Do not attempt to convert free-text serving descriptions into grams automatically.

3. Food Entry UI

Keep the existing food-entry workflow required by the brief.

Only change the quantitative portion input.

Replace

Portion
1.0 serving

With

Quantity
150 g

The selected food should still show its source serving description when available:

Serving reference: 1 cup
Calories: 130 kcal / 100g

Then calculate:

Quantity: 150g
Estimated calories: 195 kcal

Meal options remain exactly:

Breakfast
Lunch
Dinner
Snack

No additional food workflow is introduced.

4. DailyLog Food Entry

Replace:

{
  "foodId": "...",
  "meal": "breakfast",
  "portion": 1.0
}

with:

{
  "foodId": "...",
  "meal": "breakfast",
  "quantityGrams": 150
}

Store the calculated value and relevant source snapshots in the saved daily record:

foodId
foodNameSnapshot
meal
servingDescriptionSnapshot
quantityGrams
caloriesPer100gSnapshot
calories

This keeps historical daily calculations stable if reference food data is re-imported later.

5. Food Validation

Replace:

portion > 0

with:

quantityGrams > 0

All other existing user/date/food validation remains unchanged.

6. Food Import Normalization

Trim textual source fields during import.

Example:

"Dairy and Egg Products "

must become:

"Dairy and Egg Products"

This prevents duplicate-looking Food Group categories.

Do not alter the actual food content beyond required whitespace normalization.

7. Activity Identity Strategy

The supplied MET-values.xlsx file contains:

ACTIVITY
SPECIFIC MOTION
METs

There is no source ID.

Also, (ACTIVITY, SPECIFIC MOTION) is not unique. In particular:

sports | tennis, doubles | 6.0
sports | tennis, doubles | 4.5

are both valid records.

Do Not

Do not create a unique index on:

specificMotion

or:

activityName + specificMotion

Use

Generate a deterministic:

sourceKey

from:

activityName + specificMotion + metValue

Conceptually:

sports|tennis, doubles|6.0
sports|tennis, doubles|4.5

must generate different source keys.

8. Activity Model

Use:

Activity
├── sourceKey       ← unique
├── activityName
├── specificMotion
└── metValue

The normal MongoDB _id may still be generated normally.

The sourceKey exists specifically to make imports deterministic and idempotent.

9. Activity Importer

Change the import identity from:

sourceId

to:

sourceKey

Use bulk upsert behavior:

Existing sourceKey
        ↓
Update existing record

New sourceKey
        ↓
Insert new record

Re-running the same activity import must not create duplicate records.

The two valid tennis records must remain separate:

tennis, doubles → 6.0 MET
tennis, doubles → 4.5 MET

Search results should display the MET value so users can distinguish records with the same motion text.

10. Activity DailyLog Snapshot

Keep the existing activity-entry design, but ensure the saved record contains:

activityId
activityNameSnapshot
specificMotionSnapshot
metValueSnapshot
durationMinutes
caloriesBurned

The existing activity calorie formula remains unchanged:

Activity Calories =
MET × weightKg × (durationMinutes / 60)

11. API Request Change

Only the food-entry input changes.

Replace

{
  "foodEntries": [
    {
      "foodId": "...",
      "meal": "breakfast",
      "portion": 1.0
    }
  ]
}

With

{
  "foodEntries": [
    {
      "foodId": "...",
      "meal": "breakfast",
      "quantityGrams": 150
    }
  ]
}

Activity request structure remains unchanged.

No new endpoint is required.

12. Backend Calculation Authority

The backend remains authoritative.

The frontend may calculate/display a live preview, but the backend must resolve the food/activity references and calculate the final values before persistence.

The backend must never trust frontend-provided calorie totals.

The core formulas remain:

Men's BMR =
66.4730
+ (13.7516 × weightKg)
+ (5.0033 × heightCm)
− (6.7550 × age)

Women's BMR =
655.0955
+ (9.5634 × weightKg)
+ (1.8496 × heightCm)
− (4.6756 × age)

Activity Calories =
MET × weightKg × (durationMinutes / 60)

Net Calories =
Food Total − BMR − Activity Total

Only the food calorie input interpretation changes.

13. Build Phase Changes

Phase 2 — Models and Importers

Update the phase to:

Food uses sourceId as its stable import identity.

Activity uses deterministic sourceKey.

Trim all textual source fields.

Food stores calories as caloriesPer100g.

Activity does not use motion text as a unique key.

Both importers use bulk upsert.

Re-running imports must not create duplicates.

Expected source counts remain:

Food: 14,164
Activity: 821

Phase 3 — Calculation Services

Update tests from:

decimal portions

to:

decimal gram quantities

Add food calculation coverage for:

100g
150g
decimal gram quantities

Activity and BMR tests remain unchanged.

Phase 4 — Routes

Change validation from:

portion > 0

to:

quantityGrams > 0

All other route behavior remains unchanged.

14. Verification Changes

Add the following checks:

Food

Calories per 100g are stored correctly.
150g produces:
caloriesPer100g × 150 / 100

Food Group

"Dairy and Egg Products "
→
"Dairy and Egg Products"

No duplicate category should appear.

Activity

Run the importer twice:

First run  → 821 records
Second run → still 821 records

Verify both records exist:

tennis, doubles → 6.0
tennis, doubles → 4.5

Historical Data

Re-import reference data and verify that an existing DailyLog retains its stored calorie/MET snapshots.

15. Scope Protection

These data findings must not change the product scope.

Keep unchanged:

React frontend.

Python REST backend.

MongoDB.

User creation/list/view/delete.

Age stored in years.

Date selection limited to the required past window.

Food selection.

Meal selection.

Activity selection.

Activity duration.

BMR calculation.

Activity calorie calculation.

Net calorie calculation.

Daily save/load.

REST API.

Postman testing.

Glassmorphism/futuristic UI.

Responsive/accessibility requirements.

Backend-authoritative calculations.

Existing DailyLog upsert strategy.

Existing scope guardrails.

The only functional data-model adjustment is:

Food portion
    ↓
Consumed grams
    ↓
Calories per 100g calculation

The only activity-data adjustment is:

Activity identity
    ↓
Deterministic sourceKey
    ↓
Idempotent import without assuming motion uniqueness

These changes make the implementation accurately use the supplied reference data while preserving the required behavior of the Net Calorie Tracker.