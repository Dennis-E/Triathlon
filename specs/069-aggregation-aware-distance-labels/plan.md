# Implementation Plan: Aggregation-Aware Distance Labels

**Branch**: `069-aggregation-aware-distance-labels` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/069-aggregation-aware-distance-labels/spec.md`

## Summary

Update the Distance chart title and KPI labels for the selected daily, weekly, monthly, or yearly aggregation. Calculate the average from total filtered distance divided by visible bucket count, and show the period belonging to the largest filtered bucket; leave total volume and chart bucket calculations unchanged.

## Technical Context

**Language/Version**: JavaScript (browser-compatible ES6; Node.js for Jest tests)

**Primary Dependencies**: Existing Chart.js and classic browser scripts; no new dependencies

**Storage**: N/A; imported activity data remains in the existing in-memory dashboard state

**Testing**: Jest in the Node environment; focused dashboard-core and script-syntax tests

**Target Platform**: Static browser app served from a local or web static file server

**Project Type**: Static browser application

**Performance Goals**: The label and peak update as part of the existing dashboard render; no additional user-visible delay

**Constraints**: Preserve current aggregation, timeframe, sport-filter, total-volume, chart-bucket, and export behavior; use visible bucket count for the aggregation-specific average; do not add a build step or dependency

**Scale/Scope**: One existing visualization, one chart title, two KPI summaries, and focused tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Result | Evidence |
|---|---|---|
| Static browser-first delivery | PASS | The change remains in existing browser scripts and markup; no bundler or dependency is introduced. |
| Reusable module boundary | PASS | Dashboard rendering and DOM orchestration remain in `src/dashboard-core.js`; no reusable utility or public API is required. |
| Narrowest-scope verification | PASS | Focused Jest tests will cover aggregation-specific titles, peak bucket values, and existing script syntax. |
| Tab and export requirements | PASS | No tab is added or removed; the existing Total Distance export flow remains unchanged. |
| Data semantics and privacy | PASS | The calculation uses already-imported activity buckets; no parsing or network boundary changes. |

## Project Structure

### Documentation (this feature)

```text
specs/069-aggregation-aware-distance-labels/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/total-distance-labels.md
└── tasks.md              # Created by the separate /speckit-tasks phase
```

### Source Code (repository root)

```text
index.html                            # Distance chart heading and KPI markup
src/dashboard-core.js                 # Aggregation-aware title, KPI labels, averages, and peak period
__tests__/dashboard-core.test.js      # Focused render and peak tests
__tests__/index-script-syntax.test.js # Browser-script syntax regression check
```

**Structure Decision**: Keep the change within existing Distance visualization markup and dashboard orchestration. Extend the existing dashboard-core Jest test surface; do not introduce a new module, tab, or test framework.

## Complexity Tracking

No constitution violations or additional architectural complexity are proposed.
