# Implementation Plan: Personal Bests Tile Consistency & Desktop Row Alignment

**Branch**: `046-pb-tile-alignment` | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/046-pb-tile-alignment/spec.md`

## Summary

Fix two visual defects in the Personal Bests tab:

1. **Desktop row grid**: On desktop, the Swim/Bike/Run cells in each block drop into separate rows. CSS grid auto-placement cannot move backwards after the Run cell (DOM-first, column 3) is placed. The fix flattens the sport wrappers and containers with `lg:contents` and places every tile explicitly: the column comes from its sport (`data-pb-col`), the row from its index (`--pb-row`, set by the renderer). The result is a strict row grid on desktop, while the mobile stacking stays unchanged.
2. **Profile tile style**: The all-time power profile tile is rebuilt on the shared mini-chart coordinate system and helpers (`VB_W`×`SVG_H`, `appendYAxisLabel`, same strokes, markers and footer) and loses its axis captions. It then looks identical to the other PB tiles.

## Technical Context

**Language/Version**: Vanilla JavaScript (ES2019+), HTML, Tailwind CSS via CDN

**Primary Dependencies**: None new (Tailwind CDN, lucide, html2canvas already loaded)

**Storage**: N/A

**Testing**: Jest (`node` environment), string/contract assertions in `__tests__/index-script-syntax.test.js`

**Target Platform**: Modern desktop and mobile browsers; static hosting

**Project Type**: Static browser web app (no build step)

**Performance Goals**: No measurable rendering change; only a few CSS rules and one property write per tile

**Constraints**: No bundler; mobile layout must be unchanged; `lg` breakpoint (1024 px) defines the 3-column view

**Scale/Scope**: 2 files of production code ([index.html](../../index.html), [src/dashboard-power-pb.js](../../src/dashboard-power-pb.js)) and 1 test file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Static Browser-First Delivery | Pass | Only markup classes, a small `<style>` rule and orchestration code; no build step |
| II. Dual-Target Reusable Modules | Pass | No new reusable logic; row assignment is DOM orchestration in `dashboard-power-pb.js` (allowed as a classic script). `power-pb-utils.js` public API unchanged |
| III. Narrowest-Scope Test-First Verification | Pass | Update or add assertions in `index-script-syntax.test.js`; run it, then `npm test`. No tab IDs change, so no tab-navigation changes |
| IV. Faithful Locale-Aware Data Parsing | Pass | No parsing changes |
| V. Explicit Privacy & Network Boundaries | Pass | No network or API changes |

**Post-design re-check**: Pass. The design adds no dependencies and no new modules, and changes no public APIs.

## Project Structure

### Documentation (this feature)

```text
specs/046-pb-tile-alignment/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── pb-grid-ui.md
├── checklists/
│   └── requirements.md
└── tasks.md             # created by /speckit-tasks
```

### Source Code (repository root)

```text
index.html                          # PB block markup (lg:contents, data-pb-col, pb-row-block) + <style> placement rules
src/dashboard-power-pb.js           # row assignment helper after container render; profile tile rebuilt on shared mini-chart helpers
__tests__/index-script-syntax.test.js  # replace old profile geometry assertions; add layout contract assertions
```

**Structure Decision**: Existing single static-app layout. The changes stay within the PB tab markup and its orchestration script.

## Implementation Approach

1. **Markup** ([index.html](../../index.html), Distance, Elevation and Longest blocks):
   - Add `pb-row-block` to the block grid.
   - On each wrapper, replace `lg:col-start-N` with `data-pb-col="N"` and add `lg:contents`.
   - On each container, add `lg:space-y-0 lg:contents`.
   - Mark the static Swim "Not applicable" note as `pb-grid-item`.
   - Leave the Watt block unchanged.
2. **CSS**: add the media-query rules from [contracts/pb-grid-ui.md](contracts/pb-grid-ui.md) §2 to the existing `<style>` block.
3. **Row assignment**: add a small helper in `dashboard-power-pb.js` that sets `pb-grid-item` and `--pb-row` on each container's children. Call it after the per-sport distance render and after each `renderRecordCard` call.
4. **Profile tile**: replace the custom 360×148 SVG with the shared mini-chart setup (contract §4). Remove the captions, align strokes, markers and card spacing, and add the "N durations" footer. Keep the tooltip, hit areas, enlarge model and label thinning.
5. **Tests**: replace the outdated geometry assertions (height 148, `right = 24`, `yLabel y=17`, stroke-width 3, aspectRatio) with the new contract, and add layout assertions.
6. **Verify**: run the targeted test file, then `npm test`, then quickstart manual scenarios 1–5.

## Complexity Tracking

No constitution violations.
