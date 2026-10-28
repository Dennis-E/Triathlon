# Implementation Plan: Pin Visualization Tooltips and Include Them in Exports

**Branch**: `TriAnalytica-dev-2` | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/073-pin-visualization-tooltips/spec.md`. Setup reported `073-pin-visualization-tooltips` as its feature identifier; the actual Git branch is unchanged.

## Summary

Provide consistent pin, replace, dismiss, keyboard, touch, and export behavior across all thirteen existing visualization views. Use a shared pure selection model and a DOM orchestration layer with small renderer adapters, rather than trying to persist each library's native tooltip. Preserve all existing formatted detail, notes, map navigation, and media opening.

At export request time, isolate the visualization source and deep-copy its context and optional pinned selection before asynchronous work. Compose exactly one annotation into the existing image layout: full content when it fits, otherwise a compact headline-only version. Reuse the resulting PNG for preview and download. Do not mutate live tooltip state during capture. Decisions and ownership evidence are in [research.md](research.md).

## Technical Context

**Language/Version**: Browser-compatible JavaScript using the existing classic-script/CommonJS conventions; HTML and existing in-page CSS. Node.js with the root package's existing Jest toolchain for tests.

**Primary Dependencies**: Existing Chart.js CDN global (unversioned URL), html2canvas 1.4.1, Wordcloud2 1.2.3, Leaflet 1.9.4; Jest ^30.4.2. No new runtime or test package is required by the design.

**Storage**: Ephemeral in-memory selection, per-request private capture resources, and existing image Blob/data URL. Media source leases are acquired synchronously before the first await and retain ready Blob/pixels or independent reader closures/read promises; request-owned URLs are separate from the live media cache and survive replacement imports. No persistence, database, or new network endpoint.

**Testing**: Root Jest in Node with injected document/VM stubs and deferred export promises; browser verification for real canvas/tile pixels, downloads, keyboard/touch, and 360/1440-pixel viewports.

**Target Platform**: Existing desktop and mobile browsers with the app's current canvas, SVG, download, and static-server support.

**Project Type**: Static browser application without a frontend build step; separate API and CLI are untouched.

**Performance Goals**: Selection updates must not recompute analytics or rebuild the whole dashboard. Reuse heatmap hit indexing and animation-frame throttling; use roving/virtualized item inspection rather than creating a focusable DOM node for every dense canvas point. Preserve a pin for 30 seconds with no expiry. Release private export resources on success, failure and cancellation.

**Constraints**: One pin per visualization; clear on data-context/tab/import changes but not resize or map movement. Preserve grouped content and sampled heatmap activity membership in the live model and snapshot. Existing 1080 x 1080 PNG remains the output; reserve annotation space with an 18-pixel minimum annotation font. If full detail overflows, export the complete wrapped headline (or existing item/group label); fail for fit only if even this compact version cannot fit readably. No tooltip/activity-content transmission introduced.

**Scale/Scope**: Thirteen existing tabs and all their relevant rendering modes, including PB detail view; no new tab, analytic measure, service, persisted annotation collection, or dependency migration.

## Constitution Check

*GATE: Re-evaluated before Phase 0 and after Phase 1 design against constitution 1.1.1 during this replanning pass.*

| Principle / boundary | Before research | After design |
| --- | --- | --- |
| I. Static browser-first | PASS: retain existing script delivery and libraries. | PASS: two classic-script additions, no compilation or service. |
| II. Dual-target reusable modules | PASS: pure selection and layout logic can be isolated. | PASS: utility exports CommonJS plus browser global; DOM orchestration remains separate and injectable. |
| III. Narrowest-scope verification | PASS: focused existing test homes identified. | PASS: staged tests and complete 13-view/browser acceptance matrix defined below and in quickstart. |
| Tab and export contract | PASS: all existing tabs have capture mappings. | PASS: retain tab IDs/order, update navigation ownership and tests, preserve every mapping and no-data path; no new-tab exception needed. |
| IV. Faithful parsing | PASS: no parser or analytical formula change. | PASS: adapters reuse existing formatted outputs, including missing values and sampling notes. |
| V. Privacy/network boundaries | PASS: processing stays browser-local. | PASS: snapshots are ephemeral, synthetic fixtures only; existing CDN/tiles remain unrelated network activity. |
| Dependency/public API boundaries | PASS: root application only. | PASS: additive helper APIs and optional export annotation parameters; update touched callers/tests without changing service or CLI APIs. |

No unjustified violation or unresolved technical question remains. Constitution 1.1.1 explicitly requires wiring consistency and relevant tests for behavior-only changes, with coordinated constants/markup/dispatch edits when the navigation contract changes. The Agent Guide is synchronized with this rule. Exact script-order documentation and tests must change alongside script registration. Existing tab constants and IDs remain stable; inspect their consistency rather than renaming them to create unrelated churn.

## Project Structure

### Documentation (this feature)

```text
specs/073-pin-visualization-tooltips/
  spec.md
  checklists/requirements.md
  plan.md
  research.md
  data-model.md
  contracts/tooltip-interaction-export.md
  quickstart.md
```

The existing `tasks.md` is retained with its 51 task IDs and completion states; only the approved dependency and media-resource refinements are synchronized in this replanning pass. No new task list is generated.

### Source Code (repository root)

```text
index.html                              # Script wiring, overlay styles, Escape ownership
src/tooltip-selection-utils.js          # Proposed pure dual-target utility
src/dashboard-tooltips.js               # Proposed overlay/adapter orchestrator
src/dashboard-state.js                  # Context revision/reset hooks
src/dashboard-tabs.js                   # Tab resets and keyboard ownership
src/dashboard-import.js                 # Reset before dataset replacement
src/dashboard-*.js                      # Existing 13-view renderer adapters (research matrix)
src/export-utils.js                     # Optional annotation layout and copied target metadata
src/dashboard-export.js                 # Request isolation, composition, cleanup
src/zip-importer.js                     # Additive export-source acquisition on media library
src/tab-navigation.js                   # Preserve existing IDs; navigation contract verification
__tests__/tooltip-selection-utils.test.js # Proposed focused pure-state suite
__tests__/dashboard-tooltips.test.js       # Proposed shared adapter/orchestration suite
__tests__/                              # Extend existing renderer/export/lifecycle suites
__tests__/zip-importer.test.js           # Source independence and real library release tests
```

**Structure Decision**: Keep renderer-specific code with its existing owner. Add only the two shared modules and their focused tests; reuse existing renderer/export suites rather than adding thirteen separate test files. Update the existing script-load-order contract in `specs/022-modularize-inline-script/contracts/script-load-order.md` and the user-facing README during implementation.

## Phase 0: Research Outcome

Completed in [research.md](research.md): complete adapter inventory; keyboard and primary-action ownership; context invalidation gaps; native canvas-tooltip suppression; synchronous request isolation; pending-render generation rules; full-content annotation fit and off-screen association. Existing dependency choices are retained. The export recipe must contain copied formatting outputs, not late callbacks into live filter globals.

Replanning resolves analysis findings C1, I1 and U1 at the design level: apply constitution 1.1.1 and synchronize the Agent Guide; make US2 a prerequisite for US3 export acceptance; acquire independently owned media sources before replacement imports can revoke live URLs or clear readers. Add `acquireExportSources(assetKeys)` to the existing media library rather than creating a new module or retaining the entire old library. Preserve displayed video thumbnails and request-owned source cleanup on every terminal path.

## Phase 1: Design and Integration Order

1. Establish the pure model, transitions, validation, and placement defined in [data-model.md](data-model.md), then its focused unit tests.
2. Register the overlay and renderer adapter contract in [contracts/tooltip-interaction-export.md](contracts/tooltip-interaction-export.md). Utility loads before export utilities; orchestrator loads after dashboard state and before dashboard core. Avoid eager access to later renderer globals.
3. Integrate Chart.js views, SVG PB views, Leaflet, calendar, word cloud, lifetime statistics, and media cards in ownership-sized slices. Keep formatted content identical; expose item inspection for canvas keyboard users and preserve primary actions.
4. Wire reset-before-commit for every displayed-data setting, including nonstandard legends, word exclusions, and media selection. Coordinate arrow and Escape handlers; preserve selection on presentation-only movement.
5. Add synchronous request snapshots and private capture recipes. Acquire media source leases before the first await, retaining copied ready pixels/Blobs or captured reader functions; use request-owned Blob URLs, never later reads from the live media cache. Remove live hide/restore workarounds. Bind late work to snapshot identity and render generation, then compose one annotation and publish the existing immutable PNG result. Release owned source URLs/readers/bitmaps after PNG readiness, failure or cancellation, idempotently and independently of live dataset release.
6. Complete synthetic cross-view coverage, visual/download checks, script-order documentation, and README behavior guidance. No production code is changed in this planning phase.

US3's independent lifecycle tests and reset work may start after their foundation/US1 prerequisites; its export/no-data acceptance and story completion require US2. The existing task graph explicitly shows that dependency.

### Verification and Acceptance Mapping

| Risk / requirements | Focused verification |
| --- | --- |
| Pin state and immutable content, FR-002 through FR-006 | New pure utility tests and shared orchestrator tests; same-item toggle, grouped details, pin stability, no-pin hover. |
| Complete adapter coverage, FR-001, FR-014, FR-015 | Registry IDs equal the existing thirteen tab IDs; parameterized shared harness plus existing renderer suites; primary-action and keyboard/touch browser checks. |
| Snapshot and preview/download, FR-007 through FR-011 | Extend dashboard-export-download/export-utils tests with deferred assets and renders; mutate context after request; compare original selection and PNG identity. |
| Media release during export, FR-008, FR-011 | Use a real synthetic ZIP media library with mocked URL validity; pause export, replace the dataset through the import owner, verify live URLs are revoked/readers cleared while request sources remain valid, then verify original image/thumbnail/context and exactly-once source cleanup without touching replacement resources. |
| Lifecycle and anchors, FR-012, FR-013 | Extend core/import/tab-navigation/heatmap tests; direct setter and legend cases; map drag vs tap, resize, off-screen projection. |
| Full/compact content and failure | Layout tests for long words, many rows, grouped notes, missing values, 18-pixel minimum, successful headline fallback on full-detail overflow, genuinely unrepresentable headline, asset/capture/decode failures, cleanup and complete live-state preservation. |
| Privacy, FR-016 | Code-path review and browser network inspection: no new request carrying tooltip or imported activity content; unrelated existing CDN/tile calls remain permitted. |
| SC-001 through SC-006 | Quickstart's thirteen-view matrix, input modes, 30-second stability, 360/1440 viewports and actual PNG inspection; scoped tests per slice then full root suite. |

Detailed runnable commands and expected results are in [quickstart.md](quickstart.md). Tests are not claimed as executed implementation checks during planning.
