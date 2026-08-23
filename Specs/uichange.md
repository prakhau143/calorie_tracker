NET//CAL — User Table Alignment & Responsive Layout Fix

Objective

Fix the Users table where the header columns and user-row content are not using the same layout structure, causing names such as PRAKHAR MITTAL to wrap/stack while the other values remain aligned.

The required result is:

USER | AGE | WEIGHT | HEIGHT | SEX | ACTIONS
PRAKHAR MITTAL | 26y | 80 kg | 185 cm | Male | View Detail / Delete

This is a UI/layout correction. Existing product functionality and API/data behavior must remain unchanged.

1. Root-Cause Fix

Inspect the current implementation and use one shared layout definition for the table header and every row.

Preferred approach:

.users-table__row {
  display: grid;
  grid-template-columns:
    minmax(240px, 2fr)
    minmax(80px, .7fr)
    minmax(110px, .9fr)
    minmax(110px, .9fr)
    minmax(100px, .8fr)
    minmax(220px, 1.4fr);
  align-items: center;
  column-gap: 24px;
}

Exact values are designer-controlled. The important requirement is that header and body rows use exactly the same column structure.

Do not fix this with arbitrary margin-left, transform, or per-column offsets.

If the current implementation uses Grid for the header and unrelated Flexbox/widths for rows, refactor it to one consistent system.

2. User Name

The name must stay within the USER column and should not unnecessarily become:

PRAKHAR
MITTAL

Preferred behavior:

.user-cell__name {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

Long names may truncate with ellipsis rather than increasing row height. Provide the full name through an accessible title/label where appropriate.

Test with:

PRAKHAR MITTAL

ALEXANDER CHRISTOPHER JOHNSON

3. Column Alignment

Verify exact visual alignment:

USER → user name

AGE → age

WEIGHT → weight

HEIGHT → height

SEX → sex

ACTIONS → action buttons

Use a consistent alignment strategy. Do not independently size headers and rows.

4. Actions Column

Keep actions in a dedicated column:

[ View Detail ] [ Delete ]

Requirements:

Buttons stay on one line at normal desktop widths.

No overlap.

Consistent height/radius.

View Detail remains neutral.

Delete remains clearly destructive.

Hover/focus states work.

Suggested:

.users-table__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  white-space: nowrap;
}

5. Desktop Width

Use the available application width effectively.

Table width should be 100% of its content container.

Do not reintroduce a narrow centered table.

Keep sensible page-level padding.

Maintain the existing full-width premium layout direction.

6. Table Surface

Keep the Users table inside a polished product surface.

Verify:

consistent border

consistent radius

subtle elevation/shadow

correct light/dark colors

no unnecessary nested glass layers

no clipping

7. Row Height

Rows should remain compact and aligned.

A value around min-height: 72px is acceptable, but the exact value is designer-controlled.

The row must not become tall simply because a name wraps.

8. Responsive Behavior

Desktop

Use:

USER | AGE | WEIGHT | HEIGHT | SEX | ACTIONS

Tablet

Reduce gaps/padding as necessary while preserving readability.

Mobile

Do not force a cramped six-column table.

Preferred mobile presentation:

PRAKHAR MITTAL
26y · 80 kg · 185 cm
Male

[ View Detail ] [ Delete ]

Use a responsive card/stack layout at an appropriate breakpoint. Do not introduce horizontal scrolling unless there is a strong design reason.

9. Light/Dark Theme

The table must use the existing shared design tokens.

Light

readable text

visible borders

soft surface

clear action buttons

destructive Delete styling

Dark

row remains distinguishable from page background

borders remain visible

secondary text remains readable

no excessive glow

Do not hard-code separate theme colors inside the table component.

10. Hover and Focus

Add a subtle row hover state.

All action buttons must have:

default

hover

active

disabled where applicable

visible keyboard focus

Do not rely only on color.

11. Empty / Loading / Error States

Empty:

No users yet
Create your first user to start tracking calories.
[ Create User ]

Loading:

use restrained skeleton rows or loading UI

avoid large distracting animations

Error:

Unable to load users.
[ Retry ]

Do not expose raw backend errors.

12. Accessibility

Verify:

semantic table structure where appropriate

meaningful column headers

accessible action labels

Delete communicates destructive action

full user name remains available to assistive technology if visually truncated

keyboard navigation works

focus is visible

no information relies only on color

If using a real table, prefer:

<table>
  <thead>...</thead>
  <tbody>...</tbody>
</table>

If CSS Grid is used instead, preserve equivalent accessibility.

13. Recommended Component Structure

UsersSection
  └── UsersTable
       ├── UsersTableHeader
       │    └── shared column definition
       └── UsersTableRow
            └── same shared column definition

Centralize the column definition so future changes do not require separate header/row width adjustments.

14. Verification

Test:

normal name

long name

multiple users

empty users

loading

API error

View Detail

Delete

1920×1080

2560×1440

1024×768

768×1024

390×844

Light mode

Dark mode

Check:

no stacking

no overlap

no horizontal overflow

no clipped buttons

no layout shift

no console warnings

15. Scope Guardrail

Do not change:

BMR formulas

food calorie calculation

activity calorie calculation

date rules

MongoDB behavior

API contracts

user workflow

Only change other areas if the inspection reveals a separate existing defect that is clearly required for the current product.

Definition of Done

Header and rows use the same column structure.

User names do not unnecessarily stack.

AGE aligns with age.

WEIGHT aligns with weight.

HEIGHT aligns with height.

SEX aligns with sex.

ACTIONS aligns with buttons.

Long names use controlled truncation.

Desktop uses available width.

Tablet remains usable.

Mobile has a deliberate responsive layout.

Light mode works.

Dark mode works.

No horizontal overflow.

No console warnings.

View Detail still works.

Delete still works.

Final instruction to Claude

Inspect the actual DOM/CSS and identify the root cause before editing. Do not use screenshot-specific offsets. Implement a reusable layout solution, run the application, test multiple users and long names across desktop/tablet/mobile, verify both themes, and confirm that no existing functionality regresses.