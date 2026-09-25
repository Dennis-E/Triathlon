# Quickstart: Cadence versus Pace Validation

## Prerequisites

- Run commands from the repository root.
- Use a synthetic test CSV or a private Strava export. Do not commit personal exports.
- For the manual browser check, serve the app with `python -m http.server` and open
  `http://localhost:8000`.

## Focused automated validation

Run the focused tests after implementation:

```powershell
npm test -- --runInBand __tests__/processing.test.js __tests__/scatter-utils.test.js __tests__/tab-navigation.test.js __tests__/index-script-syntax.test.js
```

Expected results:

- German and English cadence and total-step headers parse into the normalized activity
  model without changing duplicate distance handling.
- Invalid cadence, missing cadence, and invalid sport performance values do not produce
  cadence points.
- Run points preserve available total steps; Bike and Swim points do not expose steps.
- The navigation helper recognizes, activates, focuses, and cycles through `cadencePace`.
- The document loads all new scripts in a valid order.

## Manual browser validation

1. Import data containing at least two qualifying Run activities, one of which has total steps.
   Open Cadence vs Pace. Verify that only sports with qualifying values appear and that
   Run is selected first when available.
2. Inspect both Run points. Verify that the point detail names step cadence and pace;
   only the activity with reported steps shows Total steps.
3. Import or use a synthetic dataset with qualifying Bike values. Select Bike and verify
   the y-axis and details say pedal cadence, the comparison uses speed, and no step
   value appears.
4. Import or use a synthetic dataset with qualifying Swim values. Select Swim and verify
   the y-axis and details say swim rhythm and never assert a specific stroke type or
   stroke count.
5. Change the selected tab using ArrowRight, ArrowLeft, Tab, and Shift+Tab. Verify that
   focus, `aria-selected`, and visible panel change together.
6. Import a dataset without any qualifying cadence activity. Verify that the Cadence vs
   Pace panel displays the explanatory empty state rather than a blank or zero-valued
   chart.
7. Open the browser console after a page reload. Verify there are no syntax,
   `ReferenceError`, or duplicate-declaration errors.
8. Use a synthetic import containing 3,000 activities and measure opening the Cadence
   vs Pace tab plus switching its selected sport. Each completed render must take no
   more than one second.
9. Conduct and record a moderated usability check: at least 95 % of participants must
   locate a Cadence vs Pace relationship for an available sport and read one point
   within 15 seconds after import.

## Regression checks

Run the full suite before merging:

```powershell
npm test -- --runInBand
```

Then confirm existing Total Distance, Heartrate vs Pace, Equipment, Personal Bests,
Heatmap, Distributions, Workout Time, and Training Calendar tabs still activate and
render after an import.