# Implementation Plan: Heatmap Frequency and Activity Details

**Branch**: `004-heatmap-frequency-details` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-heatmap-frequency-details/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Correct heatmap frequency semantics by retaining logarithmic count normalization while
interpolating directly across the full light-blue-to-red color range. Replace exact 15-meter
endpoint-cell equality with deterministic 30-meter corridor matching that also requires
similar heading and sustained path continuity. Preserve distinct contributing activity IDs
on detail and low-zoom segments, then add Canvas-native hover hit testing backed by a
screen-space index and a local activity-summary tooltip that lists all activities up to ten
or a stable random sample of ten above that limit.

## Technical Context

**Language/Version**: JavaScript (browser ES2017+ target; Node.js 18+ test target, matching
the existing repository)

**Primary Dependencies**: Existing Leaflet 1.9.4 CDN integration and browser Canvas 2D;
no new runtime dependency

**Storage**: In-memory route segments, activity-ID memberships, indexes, and tooltip state;
no persistence change

**Testing**: Jest 30 in the existing Node environment for pure matching, color, sampling,
formatting, and hit-test helpers; existing inline-script syntax test; manual browser
validation for Canvas interaction, tooltip layout, map gestures, and large datasets

**Target Platform**: Modern desktop browsers with pointer hover; existing mobile/touch map
navigation remains supported without a new tooltip interaction

**Project Type**: Single-project static web application

**Performance Goals**: Preserve navigation with at least 3,000 activities and approximately
221,000 detail segments; hover target resolution and tooltip presentation within 250 ms;
avoid per-segment map objects and full-segment scans on pointer movement

**Constraints**: Static browser-only delivery; no new network requests; raw activity data
remains local; each activity counts once per matched segment; deterministic 30-meter matching
must reject brief crossings/adjacency; full-detail and low-zoom counts must equal distinct
activity-ID membership; existing map visibility and sport filters must not regress

**Scale/Scope**: One existing Heatmap tab and preview, four sport-filter states, up to
hundreds of thousands of route segments, and tooltip samples capped at ten activity records

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery - PASS.** The design retains plain JavaScript, the
  existing Leaflet instance, one Canvas layer, and static DOM markup. No bundler or new
  dependency is introduced.
- **II. Dual-Target Reusable Modules - PASS.** Matching, color mapping, ID aggregation,
  sampling, tooltip models, and hit-testing are pure functions in `src/heatmap-utils.js`,
  exported through CommonJS and `window.heatmapUtils`. DOM and Canvas event wiring stays in
  `index.html`.
- **III. Narrowest-Scope Test-First Verification - PASS.** Every new reusable helper receives
  focused Jest coverage in `__tests__/heatmap-utils.test.js`; inline script syntax and manual
  Canvas behavior are validated separately. No tab IDs or navigation structure change.
- **IV. Faithful Locale-Aware Data Parsing - PASS.** Existing activity IDs and normalized
  Run/Bike/Swim values are consumed without changing CSV/GPX semantics or reclassifying
  unknown sports.
- **V. Explicit Privacy & Network Boundaries - PASS.** Tooltip details are joined entirely
  from imported in-browser activity records; no activity data leaves the browser and no
  network interface is added.
- **Repository boundaries - PASS.** Work stays in the root static app and root Jest suite;
  the CLI and `services/api` remain untouched.

No gate violations or unresolved clarifications were identified.

**Post-Design Re-check**: Phase 1 keeps all reusable calculations DOM-free, retains the
single-Canvas performance architecture, uses only local imported metadata, and introduces no
new project or dependency boundary. All gates remain PASS.

## Project Structure

### Documentation (this feature)

```text
specs/004-heatmap-frequency-details/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── heatmap-hover-ui.md
└── tasks.md                       # Created later by /speckit-tasks
```

### Source Code (repository root)
```text
src/
└── heatmap-utils.js               # Extend pure matching, membership, color,
                                    # sampling, formatting, and screen-hit helpers

index.html                         # Update Canvas layer, legend, hover events,
                                    # activity index, and tooltip markup/rendering

__tests__/
├── heatmap-utils.test.js          # Unit tests for all pure feature behavior
└── index-script-syntax.test.js    # Existing inline JavaScript syntax guard
```

**Structure Decision**: Extend the existing Heatmap owner files rather than introducing a
new component framework or map layer. The UI contract documents the pointer-visible behavior;
there is no external API or service contract.

## Complexity Tracking

No Constitution Check violations require justification.
