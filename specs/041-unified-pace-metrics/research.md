# Research: Unified Pace versus Metrics

## Decision: Use one generic PaceMetricPoint builder

**Rationale**: Existing normalized activities already retain average heart rate,
average cadence, elevation gain, distance, date, sport, and duration. The existing
sport-performance helper already supplies the correct x-axis unit. A single pure
builder can select the requested y metric, apply the same validity rules, and preserve
point metadata for every renderer and test.

**Alternatives considered**:

- Keep `getHeartratePacePoints` and `getCadencePacePoints` plus two new helpers:
  rejected because four near-identical filters would drift.
- Calculate selected metrics in the renderer: rejected because validation would no
  longer be testable in the Node suite.

## Decision: Require one sport, not All Sports

**Rationale**: Run pace, Bike speed, and Swim pace use incompatible x-axis units. The
clarified product decision avoids misleading mixed plots and makes axis labels,
tooltips, years, and trendlines unambiguous.

**Alternatives considered**:

- Retain All Sports: rejected by clarification because mixed x-axis units are not
  comparable.
- Render separate charts per sport: rejected because it broadens the requested single
  comparison view.

## Decision: Generalize dashboard-scatter and remove dashboard-cadence-scatter

**Rationale**: `dashboard-scatter.js` already owns the date range, year checkboxes,
trendline toggle, yearly grouping, and Chart.js lifecycle. Generalizing that module
preserves tested behavior while `dashboard-cadence-scatter.js` would otherwise duplicate
state and chart configuration.

**Alternatives considered**:

- Create a third renderer: rejected because it would compound duplication.
- Keep cadence renderer as a shared dependency: rejected because dashboard-domain files
  must not depend on each other.

## Decision: Migrate the existing export contract

**Rationale**: Heartrate vs Pace already supports branded export. The replacement tab
must retain that user-facing capability under the `paceMetrics` key, including active
Sport, Metric, and Date range context. The preceding cadence feature did not add a
second export surface, so this is a migration rather than a scope expansion.

**Alternatives considered**:

- Remove export: rejected as a regression of the replaced heart-rate tab.
- Add a separate cadence export: rejected because the unified tab has one capture target.

## Decision: Reset year visibility only when the selected point years change

**Rationale**: Users should retain intentional year selections while changing a
trendline toggle, but metric, sport, date, and import changes can alter the available
year set. Intersecting prior selections with current point years and defaulting new
years to enabled avoids stale invisible state.

**Alternatives considered**:

- Reset all years on every render: rejected because it defeats comparison controls.
- Leave stale selections untouched: rejected because unavailable years would make the
  visible state confusing.