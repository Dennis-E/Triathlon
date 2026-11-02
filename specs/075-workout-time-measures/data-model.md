# Data Model: Workout Time Measures

All state is temporary browser memory. No persistence, migration, import-schema change, or new activity entity is introduced.

## Measure Definition

- measure: count, duration, or distance; default count when omitted.
- label: Workout number, Duration, or Distance.
- raw unit: workouts, seconds, or kilometers respectively.
- axis title: Workouts, Duration (h), or Distance (km).
- axis conversion: count and distance unchanged; duration raw seconds divided by 3600.
- detail format: whole counts, cumulative hours/minutes/seconds without day wrap, or localized fractional kilometers. Sum before rounding; keep available zeros valid.
- Invalid explicit measure values are rejected by the pure builder and ignored by the UI setter without state changes.

## Existing Eligible Activity

- date and startTime: valid Date objects; both remain required.
- sport: existing sport value filtered by All/Run/Bike/Swim, with no new classification of unknown sports.
- duration: optional recorded seconds; durationAvailable false explicitly excludes its measurement.
- distance: optional recorded kilometers; distanceAvailable false explicitly excludes its measurement.
- A usable selected measurement is a finite number greater than or equal to zero and not explicitly unavailable. An absent flag plus numeric zero remains available. A true flag does not make an invalid number valid.
- Date-range eligibility uses activity.date and inclusive boundaries; category assignment uses local activity.startTime. Whole-workout values belong to one field even if the workout crosses boundaries.

## Time Field (Extended Existing Group)

- key, label, order: unchanged existing group identity and sequence.
- count: integer >= 0 counting all eligible workouts assigned to the field, independent of selected measure.
- durationSeconds, distanceKm: finite nonnegative sums of usable recorded measurements; raw accumulators start at zero even when there are no usable values, but must not be blindly presented as measured totals.
- durationAvailableCount, distanceAvailableCount: integers from 0 through count; available zero measurements are included.
- value: selected raw total; count for count mode, durationSeconds or distanceKm when usable measurements exist, zero for an empty field, null for an unavailable nonempty field.
- availableCount: count for count mode; the relevant measurement availability count otherwise.
- status: empty, complete, partial, or unavailable, determined by the table below.

| Condition | Status | Selected Value | Detail Meaning |
|-----------|--------|----------------|----------------|
| count = 0 | empty | 0 | No activities |
| count > 0 and availableCount = count | complete | usable sum, possibly 0 | Fully recorded value |
| 0 < availableCount < count | partial | usable sum, possibly 0 | Recorded total for availableCount of count workouts |
| count > 0 and availableCount = 0 | unavailable | null | No usable selected measurements |

Unknown, missing, negative, or non-finite numeric values never enter sums. Neither null nor unavailable status may become a positive dummy chart value. All ordered fields remain present.

## Workout Time Dataset (Extended Existing Result)

- granularity: existing day/week/month/year value.
- measure: selected count/duration/distance value.
- groups: ordered extended time fields, always 12/7/31/12 fields respectively.
- activityCount: unchanged number of eligible workouts, not the number with a usable duration/distance.
- availableCount: total selected-measure available count across fields.
- value: selected raw total across fields, or null when eligible workouts exist but none have usable selected measurements; empty dataset value is zero.
- status: uses the same coverage table with activityCount in place of field count.
- filters: existing copied sport/minDate/maxDate fields retain their meaning and do not expose mutable input Date references.
- No summation rounding or activity mutations are allowed. The sum of field raw selected contributions matches the dataset usable selected total; null fields contribute nothing to that sum, not a measured zero.

## View And Inspection Context

- measure is part of the render-local context together with grouping, sport, dates, dataset revision, and existing view revision.
- Filter values follow granularity -> sport -> measure -> start -> end. start/end are inclusive date candidate indices; 0 <= start <= end <= maxIndex. End-domain minimum is the chosen start, now the fourth prefix entry.
- A field selection has a stable key including granularity, measure, and field key; detail includes field label, formatted selected value/unit, and empty/coverage/unavailable explanation.
- Visible selected anchors are finite chart category/value coordinates; zero or null fields use the real category's zero baseline. Private export charts resolve the same identity against their own scale geometry.
- Snapshot metadata is plain immutable data; no live chart, DOM element, or later global measure read is stored in the frozen selection. Existing request-owned renderer/media handles remain separately managed.

## State Transitions

1. Fresh page -> measure count. Existing tab initialization and imported activity processing remain unchanged.
2. Valid different measure -> invalidate current pin -> commit measure -> derive/display current filtered result. Invalid or unchanged measure does not introduce a new context or clear an unrelated selection.
3. Other Workout Time filters or tab visits -> retain current measure; data/view changes keep existing stale-pin invalidation rules.
4. Replacement import -> retain current-page measure, rebuild result from new data, clear old pin. Page reload -> count again.
5. Dataset status empty or unavailable -> distinct existing empty-state presentation and blocked populated export; complete/partial including all-zero -> chart and export remain available.
6. Hover/click/touch/keyboard inspection -> resolve an actual field and describe its captured metadata, including zero/null; no fabricated volume.
7. Export request -> capture measure-dependent model/labels and selected field before await -> isolated rendering/anchor -> prepared image shared by preview/download. Later measure changes affect only the live view.