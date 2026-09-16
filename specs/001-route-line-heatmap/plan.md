# Implementation Plan: Route-Based Heatmap (Line Density Map)

**Branch**: `001-route-line-heatmap` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-route-line-heatmap/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Replace the current point-based, blurred circular heatmap (Leaflet + `leaflet.heat`) on the
existing "Heatmap" dashboard card/tab with a route-line rendering: GPS tracks are snapped to
a small geographic grid (15 m cells, per spec clarification), consecutive snapped points form
route segments, and segments are aggregated across activities into a visit-frequency count.
Each segment is drawn as a `L.polyline` whose stroke weight and opacity scale from a
legible minimum (single visit) up to a capped maximum (very frequent segments), using a
perceptually non-linear scale so both rare and common routes stay distinguishable at every
zoom level, including a fully zoomed-out world view. The "Heatmap" naming, dashboard card,
tab, sport filters, and empty-state behavior are unchanged (FR-010) — only the rendering
technique changes.

## Technical Context

**Language/Version**: JavaScript (browser ES2017+ target; Node 18+ for Jest tests, matching
existing repo tooling)

**Primary Dependencies**: Leaflet 1.9.4, loaded via CDN `<script>` tag exactly as today
(`https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`); the `leaflet.heat` plugin is dropped for
this view since route lines are drawn with vanilla Leaflet `L.polyline`/`L.canvas` renderer,
no new dependency is introduced.

**Storage**: N/A — client-only; route segments and frequency counts are derived in-memory
from the already-imported `gpsTracksByActivityId` on each render, nothing is persisted.

**Testing**: Jest (`node` environment, no jsdom) for the new pure aggregation/scaling
functions in `src/heatmap-utils.js`, following the existing `__tests__/heatmap-utils.test.js`
suite conventions; manual verification of the Leaflet rendering itself via the quickstart
guide, since Leaflet/DOM rendering is out of scope for the Jest `node` environment.

**Target Platform**: Modern desktop browsers, served as a static site (e.g.
`python -m http.server`), no build step.

**Project Type**: Single project (existing static web app) — no frontend/backend split.

**Performance Goals**: Best-effort for typical hobbyist-scale datasets (tens to a few hundred
activities per import); no specific req/s, fps, or large-scale target (per spec SC-005 —
explicitly out of scope for v1).

**Constraints**: No bundler/build step (Constitution I); 15 m GPS matching tolerance for
segment identity (FR-009); existing "Heatmap" naming/IDs/entry points must remain unchanged
(FR-010); must stay visually legible from single-city zoom to world zoom (FR-007).

**Scale/Scope**: Single-user, local browser session; one imported Strava export at a time,
consistent with the rest of the dashboard.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery** — PASS. No bundler/build step introduced; Leaflet
  keeps loading via the existing CDN `<script>` tag; the `leaflet.heat` CDN script tag is
  simply no longer needed for this view.
- **II. Dual-Target Reusable Modules** — PASS. New route-segment/frequency/scaling logic is
  added as pure, DOM-free functions to `src/heatmap-utils.js` (CommonJS + `window.heatmapUtils`
  bridge, consistent with existing exports), keeping it testable in Jest and usable from
  `index.html` unchanged.
- **III. Narrowest-Scope Test-First Verification** — PASS. New/changed pure functions get
  Jest coverage in `__tests__/heatmap-utils.test.js`; root `npm test` is the verification
  command. No dashboard tab is being added/renamed (FR-010), so `src/tab-navigation.js` and
  its tests are out of scope for this change.
- **IV. Faithful Locale-Aware Data Parsing** — PASS (not applicable). This feature only
  consumes the already-parsed `gpsTracksByActivityId` structure; no CSV/GPX parsing logic is
  touched.
- **V. Explicit Privacy & Network Boundaries** — PASS. Purely client-side rendering of
  already-local GPS data; no new network requests are introduced; `services/api` is untouched.

No violations identified; Complexity Tracking table below is not needed.

**Post-Design Re-check** (after Phase 1): The data model and function signatures in
[data-model.md](./data-model.md) introduce no new dependencies, no bundler/build step, no
DOM-only APIs in `src/heatmap-utils.js`, and no changes to CSV/GPX parsing or
`services/api/`. All five gates above remain PASS after design.

## Project Structure

### Documentation (this feature)

```text
specs/001-route-line-heatmap/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `contracts/` directory is generated: this feature has no external API, CLI, or
inter-service interface — it is an internal rendering change consumed only by `index.html`
within the same static app. The relevant "contract" is the pure-function signatures of
`src/heatmap-utils.js`, documented in `data-model.md` instead.

### Source Code (repository root)

```text
src/
└── heatmap-utils.js       # Extended: grid-snapping, segment building, frequency
                            # aggregation, and weight/opacity scaling (pure functions)

index.html                 # Changed: renderHeatmap() / renderHeatmapPreviewMap() switch
                            # from L.heatLayer(...) to drawing L.polyline segments sourced
                            # from the new heatmap-utils.js functions; leaflet.heat CDN
                            # <script> tag removed since it is no longer used

__tests__/
└── heatmap-utils.test.js  # Extended with tests for the new pure functions
```

**Structure Decision**: This stays within the existing single-project static-app structure
(Constitution I/II). No new top-level directories, no new project/package boundaries, and no
changes to `services/api/` or `scripts/relevant-export-extractor.js`.

## Complexity Tracking

> No Constitution Check violations were identified for this feature; this table is
> intentionally left without entries.
