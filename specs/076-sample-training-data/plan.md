# Implementation Plan: Silicon Valley Sample Training Data

**Branch**: `076-sample-training-data` (Spec Kit feature context; no branch creation in this workflow) | **Date**: 2026-11-02 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/076-sample-training-data/spec.md`

## Summary

Add the landing action "Use exemplary data" backed by a deterministic, publicly distributable synthetic Silicon Valley triathlete history. Target 1,600 activities and at least 700 tracked sessions across 2021-2025, with all existing non-media analyses populated. Deliver prebuilt JSON from `sample-data`, hydrate the existing dashboard dataset shape, and reuse normal navigation and export flows. Protect all import sources with a shared operation generation, exclude samples from personal-analysis counting, and snapshot synthetic provenance into exports. Add a bounded year filter to the existing heatmap because the approved acceptance scenarios require year-specific route exploration.

## Technical Context

**Language/Version**: Existing modern browser JavaScript and CommonJS Node.js tooling; no transpilation or new runtime version requirement.

**Primary Dependencies**: Existing Chart.js, Leaflet/heatmap utilities, Lucide, import experience utilities, power-PB helpers, and local image-export flow. Native fetch/JSON for sample assets; no new runtime packages, routing service, or API dependency.

**Storage**: Public versioned files under `sample-data`; hydrated active training data in browser memory only. No workout persistence or personal exports committed.

**Testing**: Jest 30 in the existing Node environment, VM/injected-document orchestration tests, deterministic data audits, timezone subprocess checks, and desktop/mobile browser validation.

**Target Platform**: Current desktop and mobile browsers served by the existing plain static server.

**Project Type**: Static browser application plus offline Node data-generation script; the separate Express service is unchanged.

**Performance Goals**: SC-001: dashboard visible within 15 seconds in at least 9/10 cold-load trials at 20 Mbps on each recorded desktop/mobile test setup. Design budget <= 4 MiB uncompressed payload, shared serialized route patterns, <= 2,000 points per pattern; actual timing remains a measured acceptance gate.

**Constraints**: No bundler, new backend, account, personal information, runtime routing calls, private fixtures, or new tabs. Preserve locale-aware personal-import semantics, tab IDs/order, map zoom behavior, and independently owned media export resources.

**Scale/Scope**: One fictional athlete, five complete years, all 60 months, Run/Bike/Swim annually, minimum 12 running/cycling patterns plus two swimming patterns. Dataset generation, loading, switching, provenance, heatmap year filtering, and focused regression tests only.

## Constitution Check

| Principle / boundary | Before research | After design | Evidence |
|---|---|---|---|
| I. Static browser-first | PASS | PASS | Checked-in JSON and classic scripts; offline generator is optional for maintainers, not app startup. |
| II. Dual-target utilities | PASS | PASS | One reusable sample-data utility exposes CommonJS and a distinct browser global; orchestration remains in dashboard-owned scripts. |
| III. Focused verification and tab consistency | PASS | PASS | Scoped import/export/heatmap/media tests, browser checks, and unchanged navigation IDs/order; existing Share/Export applies to the enhanced heatmap. |
| IV. Faithful parsing | PASS | PASS | Existing units and sport enum preserved; no change to CSV duplicate-distance semantics or GPX parsing. |
| V. Privacy and network boundaries | PASS | PASS | Synthetic public resources only; personal data stays local; accurate network wording; no service/API changes. |
| Dependency boundaries and scope | PASS | PASS | Root tools/tests only, no API dependencies or new application framework. |

Both pre-research and post-design gates pass. No constitutional exception is required. Geometry licensing and real-world timing remain implementation acceptance gates, not waived constraints.

## Project Structure

### Documentation (this feature)

```text
specs/076-sample-training-data/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  checklists/requirements.md
  contracts/sample-data-contract.md
  contracts/demo-interaction-contract.md
```

`tasks.md` is intentionally deferred to `/speckit-tasks`.

### Source Code (repository root)

```text
sample-data/
  README.md                         # provenance, licenses, seed, regeneration
  routes.json                       # curated geometry and source metadata
  silicon-valley-training.json       # prebuilt versioned payload
scripts/generate-sample-data.js       # offline deterministic generator/check
scripts/acquire-sample-routes.js      # optional networked maintainer acquisition
src/sample-data-utils.js              # pure validation/hydration, dual bridge
src/dashboard-import.js               # sample entry and shared import operations
src/dashboard-state.js                # operation/provenance/year state as needed
src/dashboard-heatmap.js               # represented-year filter and render identity
src/heatmap-utils.js                   # reuse shared immutable route geometry
src/country-count-utils.js             # skip already confirmed country intersections
src/dashboard-wordcloud.js             # bounded mobile layout and usable partial exports
src/dashboard-export.js               # snapshot provenance and reserved image line
src/export-utils.js                   # retain provenance in export targets
src/dashboard-media.js                # invalidate only stale gallery work
index.html                            # button, source context, map year control, wiring
__tests__/sample-data-utils.test.js    # new focused utility and bundled-data suite
__tests__/dashboard-import.test.js     # extend existing orchestration coverage
__tests__/dashboard-heatmap.test.js    # extend year/sport and stale-render tests
__tests__/dashboard-export-download.test.js
__tests__/export-utils.test.js
__tests__/dashboard-media.test.js
__tests__/tab-navigation.test.js
README.md
docs/IMPORT_FEATURE.md
```

**Structure Decision**: Extend existing owners rather than add a parallel demo application. Adjust `dashboard-tabs.js` only if its counter/import integration requires it; update the existing script-load-order contract for the new utility's placement before `dashboard-import.js`. Shared global names must not collide with existing classic scripts. Files shown above are implementation targets, not files created by this planning workflow.

## Phase 0: Research Outcome

[research.md](research.md) resolves delivery, date semantics, physiological coverage, geometry provenance, race-safe activation, counting, export ownership, and heatmap-year behavior. Research used the controlling import functions and a read-only delegated investigation of normalized activity, GPS, PB, export, and media contracts. No unresolved architectural clarification remains.

## Phase 1: Design

### Data preparation and public assets

Curate redistributable geometry and verify permitted open-water locations before publishing. Deterministically generate varied activities and coherent power profiles from a fixed seed, referencing route patterns instead of duplicating geometry on the wire. Compute distance from the chosen track and derive duration/pace consistently. Validate all required resources, per-year/month/sport counts, routes, equipment periods, and best efforts. Generator `--check` compares expected and checked-in output without writing. See [data-model.md](data-model.md) and [sample-data-contract.md](contracts/sample-data-contract.md).

### Loading and dataset replacement

Add `handleSampleDataIngest` to existing orchestration. Fetch and validate an entire candidate before hydration/activation. Begin a shared import operation for each nonempty user selection, propagate it through existing Strava/TrainingPeaks/CSV helpers, and reject stale callbacks at every state-changing boundary. A duplicate sample click during its active operation does not allocate another operation. The synchronous commit installs complete references and prepared indices, invalidates old renders, and only then releases prior dataset ownership. No network/parsing/validation await occurs inside commit. Post-commit rendering errors are handled separately from sample-load failure; there is no general DOM rollback framework.

Preserve active data on candidate failure; stale candidates release only their own resources. Count committed personal operations exactly once, samples never. Invalidate stale gallery/collage callbacks without revoking independently leased export media. See [demo-interaction-contract.md](contracts/demo-interaction-contract.md).

### Dashboard and image identity

Show "Synthetic sample training data" in global dataset context. Carry sample provenance into normal and PB-detail export snapshots and all recompositions; reserve a readable composition line so context limits cannot truncate it. Replacing with personal data removes active sample labels, but an export already started from the sample keeps its original identity.

### Heatmap-year gap

Add an All years / represented-year selector to the existing heatmap, preserving tab IDs/order and sport controls. Filter activities by selected year and sport before segment generation, apply the same selection to hover summaries and capture context, and include year in stale-render detection. Reset an unavailable year on replacement to All years; preserve existing view/zoom behavior for subsequent filter changes. Both sample and personal histories use this behavior.

### Verification gates

Run the narrowest touched suite after each implementation slice. Dataset checks prove invariants, not geographic realism by themselves. Test both import completion orders, failures, duplicate clicks, stale progress/errors, counters, old/new media ownership, PB selection reset, and exports pending across dataset switches. Exercise the year filter with existing navigation and exports. Browser checks prove classic-script loading, keyboard/mobile layout, actual map framing and route continuity, and label inclusion in downloaded images. Execute SC-001 timing trials and SC-006's five-person evaluation; do not substitute developer inspection for the latter. The runnable sequence is in [quickstart.md](quickstart.md).

## Complexity Tracking

No constitutional violations or extra architectural layers. The shared operation generation is required to meet cross-source race handling; the year selector closes an existing-view acceptance gap. Neither introduces a new tab, persistence layer, or service.

Implementation validation identified repeated geometric work on the sample's favorite routes. Hydration now copies and deeply freezes one point list per pattern; segment aggregation reuses matching results for that shared list while keeping all activity IDs/counts. Country aggregation skips intersections for countries already confirmed. Narrow wordclouds use a fixed smaller word-size maximum; a current nonempty partial layout can export with the existing unplaced-word notice, while empty/stale results remain blocked. Focused regressions and actual browser checks cover these necessary follow-ups. The separate acquisition command uses the official OSM API and never runs in the app or offline generation command.
