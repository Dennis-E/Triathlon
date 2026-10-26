# Research: Equipment Pace Colors

## Scope and Gate

The pre-research constitution gate passed: this is a static display change inside an existing tab, using existing utility exports, palettes, tests, and local image capture. No new dependency or data transport is needed. Research was limited to the owning Equipment code and its direct UI, palette, state, test, and export dependencies.

## 1. Separate Performance, Bar Length, and Color Position

**Decision**: Keep `aggregateEquipmentPace` and `buildEquipmentPaceDisplay` unchanged. Add a pure range helper consuming displayed rows. Normalize colors by valid displayed speed rather than by zero-based bar length.

**Evidence**: `src/equipment-utils.js` computes aggregate pace as total minutes divided by total kilometers, then speed as `60 / paceMinPerKm`. `buildEquipmentPaceDisplay` sets `barValue = speedKmh / fastestSpeedOfSameType`. `src/dashboard-equipment.js` currently passes that bar value directly to `getFireGradientColor`, explaining why similar equipment all looks hot.

**Rationale**: Speed already provides the correct direction for both equipment types while preserving existing bar geometry. Shoes at 6:00, 5:00, 4:00 min/km correspond to 10, 12, 15 km/h; their color positions are 0, 0.4, 1, not 0, 0.5, 1. Bikes at 20, 25, 30 km/h yield 0, 0.5, 1.

**Alternatives considered**: Changing the axis baseline would alter bar lengths; using raw shoe pace reverses direction unless handled separately; sorting or recomputing aggregates is unnecessary. Stretching colors from zero reproduces the defect.

## 2. Use a Shared CanvasGradient After Layout

**Decision**: In a chart-local `beforeDatasetsDraw` hook, map `minSpeedKmh / maxSpeedKmh` and `1` through the existing x scale and create one horizontal gradient. Use fire stops at 0, 0.5, 1. Apply it to eligible bar element fills while retaining their other resolved options.

**Rationale**: Canvas clamps the start color before the first gradient endpoint. Therefore the bars remain yellow before the slowest-performance position and clip the same continuous progression afterward. Layout-time scale access avoids missing scales during Chart construction. Recomputing on draws handles resize, layout padding, and export snapshots; do not multiply logical coordinates by device-pixel ratio again. Avoid mutating a shared Chart.js options object in place; preserve/copy resolved element options as needed.

**Alternatives considered**: One complete gradient per bar makes every endpoint equally red. Solid per-item colors fail the within-bar requirement. A CSS overlay would not reliably become part of the chart canvas capture. Pixel caches need unnecessary size/DPR invalidation.

**Fallbacks**: No valid range preserves the empty state. Equal or single-item ranges use solid yellow. Missing layout or a nonpositive pixel span uses yellow until a valid draw. Do not use a broad epsilon to collapse close but genuinely distinct performances. Distinct endpoints mapping to indistinguishable pixels are a viewport-resolution limit, not a reason to change bar lengths or invent rankings.

## 3. Reuse Existing Palette Semantics

**Decision**: Reuse `distributionUtils.getFireGradientColor(position)` at 0, 0.5, 1 and `getDistributionColor(position, scheme)` for monochrome blue/fallback colors.

**Evidence**: `src/distribution-utils.js` defines fire stops `#FDE047`, `#F97316`, `#DC2626`; `getDistributionColor(..., 'monochrome-blue')` returns constant `#2563EB`. Its internal unused blue-gradient stops do not redefine the public monochrome behavior.

**Rationale**: Preserve recognizable existing colors without introducing a second palette or changing other visualizations.

**Alternatives considered**: A new blue gradient or copied palette constants would diverge from the existing selector's meaning.

## 4. Keep Equipment Color State Local and Hide Inapplicable Controls

**Decision**: Add `selectedEquipmentColorScheme = 'fire'` and `setEquipmentColorScheme(scheme)` in `src/dashboard-equipment.js`. Use the established native labeled select pattern from the distributions/pie views in `index.html`. Hide its entire label wrapper unless metric is Pace and type is Shoes or Bikes. Synchronize visibility before early empty-state returns and never reset the stored scheme when temporarily ineligible.

**Evidence**: Equipment filter/metric state is already local to its orchestration file. `src/dashboard-tabs.js` rerenders Equipment on return without resetting that state; generic filter summaries skip hidden wrappers. The other selectors expose `fire` and `monochrome-blue` with the same labels/classes.

**Rationale**: Existing keyboard behavior and filter summaries work without custom controls or navigation changes. A session variable satisfies retention without storage or shared-state churn.

**Alternatives considered**: Disabling the selector is allowed by the spec but leaves an inapplicable control visible. Moving state into `dashboard-state.js` or adding local storage broadens scope. Enabling fire in All contradicts feature 066's clarified type-color rule.

## 5. Preserve Capture and Make Pace Rendering Deterministic

**Decision**: Retain the existing `equipmentChartWrapper` capture and preview/download image pipeline. Disable animation for Equipment Pace so a scheme change and immediate export see settled geometry and colors; do not change other metrics or the global capture wait. Do not add color metadata outside the captured chart for this feature.

**Evidence**: `src/dashboard-export.js` captures Equipment through html2canvas and uses the resulting PNG for both preview and download. The existing fixed capture wait does not by itself prove an animation has finished.

**Rationale**: Gradients drawn into the original canvas are preserved by existing capture. Local deterministic rendering is smaller and more reliable than a new export-only renderer or longer global delays.

**Alternatives considered**: Rebuilding bars in an export clone, changing the capture target, and adding palette-specific export paths duplicate the display logic.

## 6. Verification Boundaries

**Decision**: Extend existing utility, Equipment renderer, syntax/wiring, and export tests; run existing palette and tab-navigation tests. Use synthetic rows/activities and real-browser pixel checks at 375 px and 1280 px for final acceptance.

**Rationale**: Jest uses Node rather than jsdom and existing Equipment tests use VM/Chart stubs. Those stubs can prove gradient geometry, lifecycle, and unchanged values but cannot prove actual canvas pixels, readable downloaded images, or responsive layout. No new test framework is needed.

**Alternatives considered**: Full-suite-only feedback is slower and less diagnostic; mock-only validation misses visible rendering failures; private activity exports are unnecessary.

## Resolution Status

All design choices are resolved. No clarification or external research dependency remains. Browser/device performance measurements and image evidence are implementation acceptance work, not claims established during planning.