# Research: Cadence versus Pace Visualization

## Decision: Retain activity-level cadence and total steps during CSV normalization

**Rationale**: The local Strava export contains `Durchschnittliche Trittfrequenz`
and `Schritte insgesamt`; Strava's documented activity representation also exposes
`average_cadence`. Both fields are activity-level values, matching the requested
activity-per-point visualization. Retaining them in both existing normalizers avoids
one browser-only data shape and keeps Jest coverage meaningful.

**Alternatives considered**:

- Parse GPX tracks for cadence: rejected because the local GPX files do not contain
  cadence extensions and GPX is not required for the visualization.
- Parse FIT files for every activity: rejected for v1 because most exported activities
  have no FIT file and the CSV already supplies the required aggregate values.
- Derive steps from cadence and duration: rejected because cadence conventions can vary
  by device and a reported total-step field is more trustworthy when available.

## Decision: Use one shared performance metric helper with a dedicated cadence point model

**Rationale**: Existing `getSportPerformanceMetric` already computes the correct
comparison value: minutes per kilometer for running, kilometers per hour for cycling,
and minutes per 100 meters for swimming. A new pure helper can validate cadence plus
that metric, retain point metadata, and be unit-tested without DOM or Chart.js.

**Alternatives considered**:

- Extend the heart-rate point helper with a metric switch: rejected because it would
  combine unrelated validation and tooltip contracts.
- Compute pace directly in the chart renderer: rejected because parsing and validation
  would no longer be testable in the Node suite.

## Decision: Offer only sports with qualifying cadence points

**Rationale**: Cadence is sensor- and device-dependent. The local export confirms
that it can exist for all three sports but is incomplete: 717 Run, 605 Bike, and 183
Swim activities contain average cadence. Dynamic sport availability prevents a control
from promising data that the import does not contain.

**Alternatives considered**:

- Always show Run, Bike, and Swim controls: rejected because unavailable controls lead
  repeatedly to an uninformative chart.
- Require cadence for all activities of a sport: rejected because partial sensor data
  is valuable and should not suppress valid sessions.

## Decision: Use sport-specific but conservative measurement labels

**Rationale**: Run cadence is displayed as Schrittfrequenz and Bike cadence as
Trittfrequenz. Strava documents a generic cadence value and stream, but the exported
swim value has no field-level semantic marker proving that it is a specific stroke
count or technique. The swim view therefore says Schwimmrhythmus and does not claim a
particular stroke interpretation.

**Alternatives considered**:

- Label every sport simply Cadence: rejected because it is less comprehensible and
  fails to distinguish steps from pedal rotations.
- Label swim cadence Zugfrequenz: rejected because the CSV alone does not establish
  that semantic guarantee.

## Decision: Create a dedicated cadence dashboard script and tab

**Rationale**: The current heart-rate scatter script establishes the Chart.js layout,
tooltip, date range, empty-state, and year-trend conventions. A separate classic
dashboard script with distinct DOM IDs preserves that established behavior without
sharing mutable filter or chart-instance state.

**Alternatives considered**:

- Add cadence state to `dashboard-scatter.js`: rejected because the two charts would
  share stateful controls and become difficult to change independently.
- Build a new framework or component system: rejected because the app is intentionally
  static and has no bundler.

## Decision: Do not add export support in this feature

**Rationale**: The specification requests an interactive visualization but no image
export. Existing export registration has an explicit per-tab contract, so adding it
without a requirement would expand scope and risk a partial export experience.

**Alternatives considered**:

- Automatically inherit the existing export button: rejected because export naming,
  layout, and empty-state behavior need their own acceptance criteria.