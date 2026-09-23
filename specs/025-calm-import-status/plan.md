# Implementation Plan: Calm Import Status

**Branch**: `025-calm-import-status` | **Date**: 2026-09-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/025-calm-import-status/spec.md`

## Summary

Move the factual import stage, including GPS extraction counters, into a dedicated status row above the progress bar. Slow the existing prepared-preview rotation to a fixed five-second interval so previews remain calm and readable. Preserve the existing import lifecycle, black detail box, GPS segmentation, counters, and completion behavior.

## Technical Context

**Language/Version**: JavaScript in a static browser app; CommonJS-compatible repository tests running on Node.js

**Primary Dependencies**: Existing HTML/CSS classes, Lucide, existing `dashboard-import.js` orchestration, Jest

**Storage**: None; presentation-only browser state

**Testing**: Jest Node environment with static source/markup contract assertions; full root suite; manual static-browser validation

**Target Platform**: Modern desktop and mobile browsers served by a plain static file server

**Project Type**: Static browser web application

**Performance Goals**: Preview interval is at least 5000 ms; stopping rotation occurs within 100 ms of completion/error/close; import duration and GPS entry count remain unchanged.

**Constraints**: No bundler or build step; preserve existing import callbacks and data behavior; status updates must not reset or accelerate the preview timer; no private export fixtures.

**Scale/Scope**: One import modal and its existing dashboard orchestration script; no new backend, tab, parser, or data model changes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery**: PASS. The change remains in existing static markup and DOM orchestration.
- **II. Dual-Target Reusable Modules**: PASS. No reusable data utility is added; presentation remains in the existing DOM orchestration boundary.
- **III. Narrowest-Scope Test-First Verification**: PASS. Focused `index-script-syntax` contract tests and the full root Jest suite are required.
- **IV. Faithful Locale-Aware Data Parsing**: PASS. CSV/FIT/GPX parsing and sport semantics are untouched.
- **V. Explicit Privacy & Network Boundaries**: PASS. No data leaves the browser and tests use synthetic or local supplied data.

No gate violations require complexity justification.

## Project Structure

### Documentation (this feature)

```text
specs/025-calm-import-status/
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
index.html                         # factual status row and modal order
src/dashboard-import.js            # five-second preview timer and status updates
__tests__/index-script-syntax.test.js  # static UI/timing contract checks
```

**Structure Decision**: Keep the existing static-browser structure. `index.html` owns the modal markup and `src/dashboard-import.js` owns import-modal orchestration. No new module or dependency is needed.

## Complexity Tracking

No constitutional violations.
