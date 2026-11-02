# Implementation Plan: Pinned Tooltip Callouts and Lifetime Statistics Cleanup

**Branch**: `TriAnalytica-dev-2` | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/074-pinned-tooltip-callouts/spec.md`

**Feature identifier**: `074-pinned-tooltip-callouts`. The setup script reports this identifier as BRANCH; the actual Git branch remains `TriAnalytica-dev-2`. No branch is created.

## Summary

Remove separate Lifetime Statistics pin buttons and activate the statistic items themselves with accessible pointer, touch, and keyboard behavior. Replace pinned-export bottom bars with compact outlined speech bubbles positioned beside the selected item. Reuse existing tooltip selection, headline fallback, isolated capture, preview, and download flows.

Export anchor accuracy is part of this design, not an optional polish step: project each selected item into its actual isolated export capture, including resized charts and alternative export layouts. Add pure callout geometry to the existing export utility module; keep drawing and capture orchestration in dashboard-export.js. No new dependencies, backend changes, or visualization tabs are required.

## Technical Context

**Language/Version**: Existing browser JavaScript with CommonJS exports for reusable utilities; classic scripts for dashboard orchestration.

**Primary Dependencies**: Existing CDN-loaded Chart.js, Leaflet, html2canvas, and browser Canvas 2D; root Jest ^30.4.2 and @testing-library/dom ^10.4.1. No dependency additions.

**Storage**: Temporary in-memory selections and per-request export snapshots only; no persisted annotations or new data transmission.

**Testing**: Existing Node-environment Jest suites, VM/fake-document dashboard harnesses, deterministic text measurement and Canvas spies; browser visual verification for final pixels and interaction.

**Target Platform**: Existing desktop and mobile browsers; validation at 360 px and 1440 px viewport widths and at native 1080 x 1080 export resolution.

**Project Type**: Static browser application without a bundler or compilation stage.

**Performance Goals**: Geometry considers a fixed set of four side candidates, independent of activity count. Reuse the existing capture and prepared PNG; do not introduce another chart render, image composition, or dataset scan solely for callout placement. Preserve existing readable text sizes rather than shrinking text to force a fit.

**Constraints**: Preserve public utility APIs, tab IDs/order, analytical values, source parsing, independently owned export media resources, and live pin state. Protected header/legend/branding and selected-anchor clearance take precedence over displaying full detail; use headline fallback before reporting a fit failure.

**Scale/Scope**: All 13 existing visualization exports plus the personal-best detail export variant; one temporary selection and one exported bubble per request. Lifetime Statistics is the only view whose live pin affordance changes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Before Research | After Design |
|------------------|-----------------|--------------|
| I. Static browser-first | PASS: retain classic scripts and CDN libraries | PASS: extend existing files; no build step or new script order |
| II. Dual-target utilities | PASS: reuse export-utils.js | PASS: pure geometry exported through existing CommonJS/window bridge; orchestration stays in dashboard files |
| III. Narrowest-scope verification | PASS: existing focused suites identified | PASS: quickstart specifies per-slice tests, tab contract checks, and desktop/mobile pixel review; no ID renaming |
| New-tab Share/Export rule | PASS: no new tab | PASS: all existing capture mappings retained and tested |
| IV. Faithful parsing | PASS: no parser or metric changes | PASS: reuse already selected detail content without recalculation |
| V. Privacy/network boundaries | PASS: local processing only for this feature | PASS: no tooltip transmission; media leases remain isolated from live URLs |
| Dependency/public API boundaries | PASS: root frontend scope only | PASS: additive helper/adapter contract; existing APIs and API service untouched |

No gate violations or unresolved design decisions remain. These are design checks, not claims that implementation tests have already passed.

## Project Structure

### Documentation (this feature)

```text
specs/074-pinned-tooltip-callouts/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/
    pinned-callouts.md
  checklists/
    requirements.md
```

The next workflow generates tasks.md; this command does not create it.

### Source Code (repository root)
```text
index.html                              existing focus styling and tab wiring
src/
  dashboard-lifetime-statistics.js       item markup and delegated activation
  dashboard-tooltips.js                  selection origin and chart adapter
  dashboard-export.js                    capture projection and bubble drawing
  export-utils.js                        pure text fitting and callout geometry
  dashboard-heatmap.js                   existing map export projection
  dashboard-power-pb.js                  PB export selection identity
  dashboard-training-calendar.js         calendar export item identity
  dashboard-wordcloud.js                 rendered word identity versus list item
  dashboard-pie-charts.js                export-resized chart identity
  dashboard-media.js                     collage item identity and existing leases
  tooltip-selection-utils.js             existing selection state, preserve API
  tab-navigation.js                     existing IDs/order, verify only
__tests__/
  lifetime-statistics-dashboard.test.js
  export-utils.test.js
  dashboard-export-download.test.js
  dashboard-tooltips.test.js
  tooltip-selection-utils.test.js
  tab-navigation.test.js
```

**Structure Decision**: Extend existing modules and test harnesses. Adapter owners listed above are potential narrow follow-up surfaces only where export projection needs their rendered-item identity; do not refactor every visualization or alter unchanged navigation. Keep actual export-coordinate conversion in the capture path and pure collision geometry in export-utils.js.

## Phase 0: Research Outcome

See [research.md](research.md). Research identified the current bottom-bar reservation, reusable full/headline text fitting, Lifetime's button-only activation, and missing or canvas-relative export anchors. All are resolved by the decisions below and the [interface contract](contracts/pinned-callouts.md).

## Phase 1: Design

1. Replace Lifetime pin-button markup with stable item-level inspection targets. Preserve semantic table rows; focus and activate an appropriate content element rather than replacing a table row's role. Delegate click and Enter/Space activation without double-triggering synthesized native clicks. Maintain selected-state attributes when changing origin, dismissing, invalidating, or rerendering.
2. Capture selection identity, layout inputs, pixel sources, and independently owned media resources synchronously before the export's first await. Export-only projection may finish after isolated clone preparation, but it may read only those captured resources, never changed live state.
3. Resolve the item into the actual captured image layout, accounting for nested canvas offsets, export-resized charts, DOM/SVG elements, map projection, and alternate KPI/collage targets. Explicitly classify truly absent items; lack of a resolver is a defect, not permission to pretend an item is absent.
4. Compute the existing visualization fit without reserving annotationHeight for a pin. Convert the normalized capture anchor into final image coordinates using the exact drawn-image rectangle. Keep no-pin composition unchanged.
5. Fit full text into content-sized, bounded bubble dimensions; evaluate four side placements against image bounds, protected regions, and anchor clearance. Retry with the existing complete-headline fallback if full text cannot be placed, not only when it exceeds a height limit. Place off-screen/absent-item bubbles without a tail and retain their association note in both full and compact modes.
6. Draw one rounded outlined body and tapered tail using Canvas 2D, followed by readable text. Use an 8 px body corner radius, existing export typography, a light body with dark outline/text, and a consistent bounded width; this changes only the exported annotation. Use the same prepared PNG for preview and download.
7. Preserve finally-based capture/resource release, snapshot immutability, no-data behavior, and error feedback. Validate all 13 mappings and the PB-detail variant; do not extend backend or storage scope.

### Verification And Traceability

| Requirements | Design / Verification |
|--------------|-----------------------|
| FR-001, FR-002 | Lifetime item activation; pointer/touch/keyboard, focus, selected-state, replace/dismiss tests |
| FR-003, FR-012 | unchanged other primary actions, tab order/IDs, metrics, imports, and privacy boundaries |
| FR-004, FR-005 | all-target anchor matrix, pure four-side geometry tests, actual composition drawing tests |
| FR-006, FR-007 | protected-region/edge/corner tests, full-to-headline placement fallback, failure when no readable fit |
| FR-008 | explicit outside-view/not-in-export cases; no false tail and retained item note |
| FR-009, FR-011 | deferred capture, mutation-after-request, repeated export, cancellation/failure and resource-release tests |
| FR-010 | no-pin baseline, no control glyphs, existing no-data/preview/download tests |

The [quickstart](quickstart.md) defines runnable scoped checks and the visual acceptance matrix. Browser inspection is required because a mocked composition cannot prove anchor or speech-bubble pixels.

## Complexity Tracking

No constitution exceptions or additional architectural layers are needed.
