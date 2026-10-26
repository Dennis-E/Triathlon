# Implementation Plan: Simplify Import Status

**Branch**: `TriAnalytica-dev-2` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/069-simplify-import-status/spec.md`

## Summary

Show a source-only confirmation after a successful import: "Imported Strava history" or "Imported TrainingPeaks history". Remove the Strava activity total from the success status while preserving progress and failure messages. TrainingPeaks already uses its concise source label.

## Technical Context

**Language/Version**: JavaScript in the existing static browser app; Jest tests run on Node.js

**Primary Dependencies**: Existing `src/dashboard-import.js` import orchestration and root Jest suite; no new dependencies

**Storage**: None; the completion label is transient UI state

**Testing**: Focused `__tests__/dashboard-import.test.js`; full root suite with `npm test -- --runInBand`

**Target Platform**: Modern desktop and mobile browsers served as a static site

**Project Type**: Static browser web application

**Performance Goals**: No measurable import-time or rendering overhead beyond the existing status update

**Constraints**: Keep import processing, progress and error behavior unchanged; no bundler, backend, new data, or external service

**Scale/Scope**: One success-message construction path and its focused tests; no markup or status-renderer changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery**: PASS. The change uses existing browser-side import orchestration and requires no build step or service.
- **II. Dual-Target Reusable Modules**: PASS. No reusable data-processing module is introduced or changed.
- **III. Narrowest-Scope Test-First Verification**: PASS. Update the focused import status test and run it before the full root Jest suite.
- **IV. Faithful Locale-Aware Data Parsing**: PASS. CSV, FIT, GPX, and sport parsing remain untouched.
- **V. Explicit Privacy & Network Boundaries**: PASS. No imported data is sent to a new service; tests use synthetic datasets.

No gate violations require complexity justification.

**Post-design re-check**: PASS. Phase 1 adds documentation only; there are no new modules, services, parsing changes, data persistence, or privacy boundary changes.

## Project Structure

### Documentation (this feature)

```text
specs/069-simplify-import-status/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── import-status.md
└── tasks.md              # Created by /speckit-tasks
```

### Source Code (repository root)
```text
src/dashboard-import.js            # Successful status label selection
__tests__/dashboard-import.test.js # Source-label and no-count assertions

```

**Structure Decision**: Keep the existing static-browser structure. Change only successful import status construction in `src/dashboard-import.js` and its focused runtime tests. `src/dashboard-core.js` continues to render the supplied text unchanged; header markup and import progress/error paths are out of scope.

## Complexity Tracking

No constitutional violations.
