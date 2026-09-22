# Feature Specification: Distributions Chart Refinements

**Feature Branch**: `019-distributions-refinements`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "Beobachtungen zum verbessern des features. 1) bei \"all sports\" filter müssen es bei liniendiagramm drei einzelne linien für swim, run, bike sein in einem diagram. 2) Die Einheiten auf der x-Achse sind interessant. Bei duration sind das keine minuten-angaben. Auch bei linie und histogram sind es verschiedene einheiten und merkwürdige zahlen mit vielen kommastellen. 3) x-achse bei pace steht nicht die Einheit min/km und dezimale einheiten, nicht mit min:ss 4) bei elevation auch kommastellen. raus. nur ganze zahlen. und nicht so krumme zahlen. sinnvolle buckets und dann \"größer als\" für die paar ausreißer nach oben hin 5) es wird mir watt bei \"run\" gezeigt. Haben läufe Watt-angaben in den Daten? Wenn ja, ignoriere sie und exkludiere sie überall. Das nutzen wir nicht. Nur beim bike. 6) length hat auch auf kilometer kommastellen und komische Grenzen."

## Clarifications

### Session 2026-09-22

- Q: Which statistical method determines which values become "outliers" grouped into the final overflow bucket? → A: IQR-based rule — values above Q3 + 1.5× the interquartile range are treated as outliers, consistent with the standard boxplot/statistical-outlier convention.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Power/Watt data only ever reflects Bike activities (Priority: P1)

An athlete viewing the "Power (Watt)" distribution (or any other view that shows average watts) currently sees watt values attributed to Run activities, even though running activities in this dataset do not have meaningful power-meter data. The athlete needs the app to only ever treat Bike activities as having valid power data, everywhere average watts are used.

**Why this priority**: This is a data-correctness bug, not just a display nuance — showing power values for a sport that shouldn't have them undermines trust in every chart that uses watts, not just Distributions.

**Independent Test**: Import a dataset where Run (and/or Swim) rows contain a non-empty average-watts value, open the Distributions "Power (Watt)" metric with the "All Sports" filter, and verify only Bike activities ever contribute to the chart, count, or any other watts-based display.

**Acceptance Scenarios**:

1. **Given** a dataset where a Run activity's raw CSV row has a non-empty average-watts column, **When** activities are processed, **Then** that Run activity's average watts is treated as absent (not a valid value) rather than being carried through.
2. **Given** the Distributions tab with the "Power (Watt)" metric and "All Sports" selected, **When** the chart renders, **Then** only Bike activities are counted and displayed.
3. **Given** the sport filter is narrowed to "Run" or "Swim" while "Power (Watt)" is selected, **When** the chart renders, **Then** the empty-state message is shown (no Run/Swim activity ever qualifies for the Power metric).

---

### User Story 2 - See per-sport lines instead of one merged line (Priority: P1)

An athlete viewing any metric's distribution in "Line" display mode with the "All Sports" filter wants to see the shape of each sport's distribution separately (e.g. three distinguishable lines for Run, Bike, and Swim) instead of one merged line that hides how each sport actually contributes.

**Why this priority**: Without this, "All Sports" + "Line" mode produces a misleading single curve that blends unrelated sports together, which is confusing enough to undermine the whole display mode.

**Independent Test**: Import a multi-sport dataset, open Distributions, select "All Sports" and "Line" display mode for any metric, and verify three distinctly colored/labeled lines (one per sport with qualifying data) are drawn on the same chart instead of a single combined line.

**Acceptance Scenarios**:

1. **Given** the "All Sports" filter and "Line" display mode are both active, **When** the chart renders, **Then** one separate line is drawn per sport that has at least one qualifying activity (up to three: Run, Bike, Swim), each visually distinguishable (e.g. by color and a legend/label).
2. **Given** a single sport is selected instead of "All Sports", **When** the chart renders in "Line" mode, **Then** only that one sport's line is shown (current single-line behavior is unchanged).
3. **Given** "All Sports" and "Histogram" display mode, **When** the chart renders, **Then** the existing combined-bar behavior is unchanged (this story only affects "Line" mode).

---

### User Story 3 - Read clean, correctly-labeled axis values (Priority: P1)

An athlete looking at any metric's chart wants axis labels and bucket ranges that use the right unit for that metric, in human-friendly rounded numbers, instead of raw underlying units (e.g. seconds) or values with many decimal places.

**Why this priority**: Confusing or wrong-looking numbers (e.g. duration shown in raw seconds, pace shown as a decimal instead of min:ss, elevation with decimals) make the chart hard to read correctly and were called out for every single metric.

**Independent Test**: Open Distributions and check each metric in turn — Duration shows whole-minute (or hour/minute) values, Pace shows "min/km"-style min:ss values with its unit visible, Elevation and Length show whole numbers with no decimals — and confirm no metric shows a raw/awkward decimal value on its axis or bucket labels.

**Acceptance Scenarios**:

1. **Given** the "Duration" metric is selected, **When** the chart renders, **Then** axis and bucket labels show whole-minute (or combined hour/minute) values instead of raw seconds or decimal minutes.
2. **Given** the "Pace" metric is selected, **When** the chart renders, **Then** axis and bucket labels show the pace unit (e.g. "min/km") and format pace values as minutes:seconds instead of a decimal number.
3. **Given** the "Elevation gain" metric is selected, **When** the chart renders, **Then** axis and bucket labels show whole meters with no decimal places.
4. **Given** the "Length" metric is selected, **When** the chart renders, **Then** axis and bucket labels show clean, whole or one-decimal kilometer values rather than long decimal numbers.
5. **Given** any metric and either display mode (Histogram or Line), **When** the chart renders, **Then** the same unit and rounding rules apply consistently in both modes.

---

### User Story 4 - See sensible bucket boundaries with an overflow bucket for outliers (Priority: P2)

An athlete looking at a metric's distribution wants the bucket boundaries themselves to be clean, round, easy-to-read ranges (not arbitrary fractions of the min/max span), and wants the rare extreme outliers grouped into a final "greater than X" bucket instead of stretching every other bucket's range until they're unreadable.

**Why this priority**: This builds on User Story 3's formatting fix by also making the bucket boundaries themselves sensible, and specifically resolves the previously-accepted "outliers stretch the buckets" trade-off now that the user has clarified they want an overflow bucket after all.

**Independent Test**: Import a dataset with one clear outlier (e.g. one very long activity among many short ones) for a given metric, open its distribution, and verify the bucket boundaries are round numbers appropriate to that metric's unit, and that the outlier(s) are grouped into one final "> X" bucket rather than stretching the other buckets.

**Acceptance Scenarios**:

1. **Given** a metric's qualifying values, **When** buckets are computed, **Then** bucket boundaries are rounded to sensible, human-friendly step sizes for that metric's unit (e.g. whole kilometers, whole minutes, round meter steps) instead of arbitrary fractional boundaries.
2. **Given** a small number of extreme outlier values far above the bulk of the data, **When** buckets are computed, **Then** those outliers are grouped into one final bucket labeled as "greater than" the last regular boundary, instead of each regular bucket's range being stretched to reach the outlier.
3. **Given** a dataset with no outliers (values clustered closely together), **When** buckets are computed, **Then** no overflow bucket is created and all regular buckets remain sensible and readable.

---

### Edge Cases

- What happens when excluding non-Bike watts data leaves zero Bike activities with power data? The "Power (Watt)" metric still shows the existing empty-state message (unchanged from the current behavior).
- What happens in "Line" mode with "All Sports" when only one or two of the three sports have any qualifying activities? Only the sports with qualifying data get a line; sports with no qualifying activities are omitted rather than shown as an empty/flat line.
- What happens when a metric's values are all identical (no spread)? A single sensible bucket is still shown (consistent with existing single-bucket behavior), without needing an overflow bucket.
- What happens when the outlier threshold would produce an overflow bucket containing most of the data (i.e., the "outliers" aren't actually rare)? The IQR-based regular bucket/overflow split still applies as computed; this is an accepted trade-off of using a fixed statistical rule rather than manual tuning per dataset.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST treat average-watts values as valid only for Bike activities; average-watts values present on Run or Swim activities MUST be excluded/ignored everywhere they would otherwise be used (including, but not limited to, the Distributions "Power (Watt)" metric).
- **FR-002**: The Distributions "Power (Watt)" metric MUST only ever include Bike activities, regardless of the selected sport filter, and MUST show the existing empty-state message when the sport filter excludes Bike or when no Bike activity has valid power data.
- **FR-003**: When the sport filter is "All Sports" and the display mode is "Line", the system MUST render one separate, visually distinguishable line per sport that has at least one qualifying activity (up to three: Run, Bike, Swim), instead of one line combining all sports' values.
- **FR-004**: When the sport filter is a single sport, or the display mode is "Histogram", the per-sport line behavior from FR-003 MUST NOT change existing single-line / combined-bar behavior.
- **FR-005**: The "Duration" metric's axis and bucket labels MUST be formatted as whole minutes (or combined hours/minutes for durations of an hour or more), never as raw seconds or a decimal-minute value.
- **FR-006**: The "Pace" metric's axis and bucket labels MUST show the applicable pace/speed unit matching each activity's own sport-specific unit per FR-005a of `018-activity-distributions`: for Run ("min/km") and Swim ("min/100m") values, the system MUST format them using minutes:seconds rather than a decimal number; for Bike ("km/h"), which is a speed rather than a pace, the system MUST continue to show a decimal number (no minutes:seconds conversion applies).
- **FR-007**: The "Elevation gain" metric's axis and bucket labels MUST show whole meters with no decimal places.
- **FR-008**: The "Length" metric's axis and bucket labels MUST show clean kilometer values (whole or at most one decimal place) rather than long/arbitrary decimal numbers.
- **FR-009**: Bucket boundary values MUST be rounded to sensible, human-friendly step sizes appropriate to each metric's unit (e.g. whole kilometers or half-kilometers for Length, whole minutes for Duration, round meter increments for Elevation), rather than dividing the observed range into arbitrary fractional steps.
- **FR-010**: When a metric's qualifying values contain outliers as defined by the IQR rule (values greater than Q3 + 1.5× the interquartile range, where Q3 and the interquartile range are computed from the metric's qualifying values), the system MUST group those outlier values into one final "greater than [last regular boundary]" bucket instead of stretching every regular bucket's range to reach the outlier value.
- **FR-011**: When a metric's qualifying values contain no values above the IQR-based outlier threshold, the system MUST NOT create an overflow bucket; all values are covered by sensible regular buckets (consistent with FR-009).
- **FR-012**: The formatting, unit, and bucket-boundary rules from FR-005 through FR-011 MUST apply consistently in both "Histogram" and "Line" display modes.

### Key Entities

- **Sport-specific line series**: In "Line" mode with "All Sports", one distribution curve per sport (Run/Bike/Swim), each computed the same way as the existing single-sport distribution but scoped to that sport's qualifying activities.
- **Regular bucket**: A distribution bucket with sensible, rounded boundaries appropriate to the metric's unit (extends the existing "Distribution bucket" entity from `018-activity-distributions`).
- **Overflow bucket**: A final bucket labeled "greater than [boundary]" that collects the small number of extreme outlier values above the last regular bucket's boundary.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of Run and Swim activities are excluded from any average-watts-based display or computation, regardless of what the raw imported data contains.
- **SC-002**: Selecting "All Sports" and "Line" mode always shows one line per sport with qualifying data (never a single blended line) across all five metrics.
- **SC-003**: For every metric, all displayed axis/bucket-label values use the correct unit and contain no more decimal places than the rounding rule for that metric allows (0 for Duration/Elevation, min:ss for Pace's Run/Swim values, a decimal number for Pace's Bike speed value, at most 1 for Length).
- **SC-004**: For a dataset containing a clear outlier, the resulting chart shows regular buckets with round, human-readable boundaries plus exactly one final "greater than" bucket, instead of one or more regular buckets stretched to accommodate the outlier.
- **SC-005**: For a dataset with no significant outliers, no "greater than" bucket appears and all existing acceptance behavior from `018-activity-distributions` continues to work unchanged.

## Assumptions

- "Duration" is formatted as whole minutes below 60 minutes, and as a combined hours/minutes value (e.g. "1h 30m") at or above 60 minutes; exact minute rounding (nearest minute) is acceptable precision loss for axis/bucket labels.
- "Pace" continues to reuse the existing per-sport performance value from `018-activity-distributions` (Run min/km, Swim min/100m, Bike km/h); only the display formatting changes (min:ss instead of decimal, explicit unit label), not the underlying combination-without-conversion behavior.
- The "small number of extreme outliers" threshold for the overflow bucket is determined by the standard IQR (interquartile range) rule: values above Q3 + 1.5× IQR (computed from the metric's own qualifying values) are treated as outliers and grouped into the overflow bucket; this is a fixed, dataset-adaptive rule rather than a manually configured threshold.
- "Sensible" bucket step sizes follow a standard "nice number" rounding convention (e.g. steps of 1, 2, 5, 10, 25, 50, 100 scaled to the metric's range), the same general approach used by conventional chart-axis tick generators.
- This feature only changes the Distributions tab's display/formatting logic and the shared average-watts data-processing rule (FR-001); it does not add new metrics, filters, or display modes beyond what `018-activity-distributions` already introduced.
