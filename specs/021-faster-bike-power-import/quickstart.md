# Quickstart: Validating Faster Bike Power Import

This guide validates that bike power import is faster after the change, with no
regression in GPS tracks, power efforts, or personal bests.

## Prerequisites

- Node.js and npm installed (root project dependencies already installed via `npm install`).
- A local Strava export ZIP containing at least a few dozen bike activities with power
  data, kept outside version control (per Constitution V) — e.g. under a local,
  gitignored folder. Synthetic/small sample FIT+ZIP fixtures used by the existing Jest
  suite are sufficient for automated checks; a real personal export is only needed for
  the manual timing check below.

## 1. Run the automated regression suite

```powershell
npm test
```

Expected: all suites pass, including [__tests__/zip-importer.test.js](../../__tests__/zip-importer.test.js)
and [__tests__/power-pb-utils.test.js](../../__tests__/power-pb-utils.test.js). These
cover FR-002/SC-003 (unchanged GPS tracks, power efforts, and PB values) and the new
assertion that the FIT parser runs once per bike activity file (FR-001/FR-006).

## 2. Manually validate import behavior in the browser

```powershell
python -m http.server
```

Then open `http://localhost:8000`, and:

1. Import a ZIP export that includes bike activities with power data.
2. Confirm the progress indicator advances smoothly through the extraction stage(s)
   without a long pause after GPS extraction appears to finish (FR-004 / User Story 2).
3. Confirm the resulting dashboard's bike power personal bests match what was shown
   before the change, for the same export (FR-002 / User Story 1).
4. Import a ZIP export with no bike activities (or bike activities with no power data)
   and confirm import completes with no extra delay attributable to bike power
   extraction (FR-005 / SC-004).

## 3. Measure the performance improvement (SC-001 / SC-002)

Using a local export with roughly 100 bike activities with power data:

1. Before/after the change, wrap the bike power extraction phase with timing (e.g.
   temporarily log `performance.now()` around the relevant loop, or observe the
   timestamps of progress callback invocations for that stage in the browser console).
2. Compare total time spent in bike-power-specific processing: it should be reduced by
   at least 50% (SC-001).
3. Compare total import time for that export against an equivalent export where the same
   files only require GPS extraction (e.g. temporarily treat them as non-bike): the
   bike-activity import should not exceed that baseline by more than ~10% (SC-002).

## Expected outcome

- No change in imported data: GPS tracks, power efforts, and power personal bests are
  identical before and after the change.
- Bike power extraction is measurably faster, and no longer performs a second full
  parse pass over already-processed FIT files.
- Progress reporting remains accurate and monotonic throughout import.
