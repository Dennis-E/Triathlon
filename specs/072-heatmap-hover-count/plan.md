# Implementation Plan: Heatmap Hover Count Threshold

**Branch**: `TriAnalytica-dev-2` | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/072-heatmap-hover-count/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Show the requested `# of tracks: N` line at the top of the heatmap hover tooltip only when the hovered segment has more than ten distinct contributing tracks. Use the existing tooltip model's `totalCount`; keep track aggregation and activity rows unchanged, and retain the existing sampling explanation for segments that show only ten activity details.

## Technical Context

**Language/Version**: Browser-compatible JavaScript; Node.js for Jest

**Primary Dependencies**: Existing Leaflet integration and `src/heatmap-utils.js`; no new dependencies

**Storage**: None; imported tracks and tooltip state remain in browser memory

**Testing**: Root Jest suite in the Node environment; focused suites are `__tests__/dashboard-heatmap.test.js` and `__tests__/heatmap-utils.test.js`

**Target Platform**: Static browser application served locally or from a static host

**Project Type**: Static web application

**Performance Goals**: The threshold check occurs only when hover content changes and adds no route processing; existing hover responsiveness is preserved.

**Constraints**: No bundler or build step; no network requests for activity details; strict threshold is `totalCount > 10`; other heatmap behavior remains unchanged.

**Scale/Scope**: Existing heatmap activity tooltip only; no new tab, data format, or persistent state

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Static Browser-First Delivery**: PASS. The behavior remains in the existing browser UI and adds no build tooling.
- **Dual-Target Reusable Modules**: PASS. Tooltip presentation remains in the DOM-orchestration layer; the existing reusable model is consumed without adding new reusable logic.
- **Narrowest-Scope Test-First Verification**: PASS with implementation gate. Add focused boundary and hover-transition tests, then run both heatmap Jest suites before completion.
- **Visualization Share/Export**: Not applicable. This modifies an existing heatmap tooltip and does not introduce a visualization tab.
- **Locale-Aware Parsing**: Not applicable. No CSV or GPX parsing changes.
- **Privacy and Network Boundaries**: PASS. Counts and activity details continue to come from imported local data; no network or persistence behavior is added.
- **Repository and Dependency Boundaries**: PASS. No new package, API, or service dependency.

## Project Structure

### Documentation (this feature)

```text
specs/072-heatmap-hover-count/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── heatmap-hover.md
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (repository root)
```text
index.html                              # Existing tooltip markup; add a distinct top count line
src/dashboard-heatmap.js               # Apply visibility and text for the active hovered segment
src/heatmap-utils.js                   # Existing totalCount and sample model; no behavior change planned
__tests__/dashboard-heatmap.test.js    # Focused UI threshold and stale-content tests
__tests__/heatmap-utils.test.js        # Existing model boundary and sampling tests
```

**Structure Decision**: Keep the change in the existing static UI and dashboard heatmap orchestration. Use `totalCount` from the existing tooltip model rather than introducing a new abstraction or changing route aggregation. Add only the DOM hook needed to distinguish the top track-count line from the existing sample explanation, and test the rendered states through the dashboard heatmap harness.

## Complexity Tracking

None. No constitution violations, new dependencies, storage, or service boundaries are introduced.
