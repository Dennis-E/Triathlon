# Research: Social Export Readability Refinements

**Feature**: [Social Export Readability Refinements](./spec.md)
**Date**: 2026-10-30

## Decision 1: Style only the export snapshot for Workout Time

**Decision**: Apply high-contrast axis label colors and minimum tick/title font sizes to the private Chart.js export snapshot. Do not change the live dashboard chart theme.

**Rationale**: The product request targets social PNG readability, not dashboard styling. The existing tooltip adapter can create a private chart copy, and Feature 074 already passes export dimensions and a minimum font size through that boundary. The export can therefore improve legibility without changing the user-facing dashboard or metric calculations.

**Alternatives considered**:
- Change Workout Time chart defaults globally: rejected because it alters the dashboard, outside this feature's scope.
- Draw new axis labels over the chart after capture: rejected because it duplicates axis layout and risks incorrect ticks/units.

## Decision 2: Enlarge calendar year labels in the capture clone

**Decision**: Increase only cloned Training Calendar year headings to the export minimum and maintain sufficient layout height/gaps; keep live calendar typography unchanged.

**Rationale**: The calendar renderer already outputs year headings in the DOM. Targeted clone styling is the smallest change and keeps all calendar values and tile intensities intact.

**Alternatives considered**:
- Increase the global calendar year heading size: rejected because the request concerns exports and could crowd the dashboard.
- Capture years as one combined raster then annotate separately: rejected because it duplicates content and can misalign labels with the calendar grid.

## Decision 6: Split overflowing calendars into numbered pages on one shared scale

**Decision**: If every calendar year cannot fit in one image with year labels at least 30 px and no overlap/clipping, divide the years into a numbered image series. Include every year exactly once and use the same calendar scale across all pages.

**Rationale**: The user chose a complete series over shrinking labels or dropping years. A shared scale is required for cross-page comparisons and matches the existing export-series behavior used for equipment timelines.

**Alternatives considered**:
- Keep all years on one image by shrinking labels: rejected because it violates the minimum font size.
- Omit earlier years: rejected because the series must preserve the complete history.
- Ask the user to select a year range: rejected by the clarification; no manual selection is needed.

## Decision 3: Keep Pace vs. axes precise; simplify only the summary

**Decision**: Replace the social summary's verbose key/value list with a concise sentence generated from the existing scatter export metadata. Keep axis labels, units, series legend, trend-line labels, and point-size meaning intact. Use sport-specific "Pace" or "Speed" terminology.

**Rationale**: The scatter adapter already exposes sport, selected metric, axis titles, visible year series, trend lines, and point-size meaning. No data inference is needed. The concise summary complements rather than replaces exact chart labels.

**Alternatives considered**:
- Remove units/axis titles along with the verbose summary: rejected because axes must remain self-explanatory.
- Hard-code a single Run/heart-rate summary: rejected because Bike uses speed, and other selected metrics/sports must remain truthful.

## Decision 4: Present PB identity and trend in separate concise fields

**Decision**: Prefix PB record headlines with `PB:` and the record identity. For histories with multiple chronological values, show a simple first-to-current summary and the first-record year when available. Do not put milestone roles and activity names into this summary. Keep event/source attribution in a separate, visually secondary field when present. For one record, show only the result and available attribution.

**Rationale**: The existing PB model contains record identity, chronological values, date, title, source, direction, and formatted value. The concise summary can be derived without recalculating the record history or asserting improvement beyond the stored first/current values.

**Alternatives considered**:
- Keep the first/largest-improvement/current concatenation: rejected because it is the source of the reported clutter.
- Remove source attribution: rejected because official-race versus activity-derived provenance is useful and required when available; instead keep it separate from the trend sentence.
- Add a trend sentence for one record: rejected because it would fabricate progress.

## Decision 5: Validate final-size output in browser and deterministic logic in Jest

**Decision**: Add focused Node/Jest tests for chart clone options, calendar clone text, summary text, PB formats, and preview/download identity. Verify actual 1080px output at 360px display width in a browser for both formats.

**Rationale**: Jest runs in Node and cannot establish rendered font size, contrast, SVG text clipping, or final preview appearance. Both unit-level metadata checks and browser rendering checks are necessary.

**Alternatives considered**:
- Use only unit tests: rejected because transformed SVG/Canvas text can differ from its source-font size after image scaling.
- Add a new browser test framework: rejected because the repository has no such dependency and this narrow feature can use the existing browser validation workflow.
