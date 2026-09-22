# Phase 0 Research: Faster Bike Power Import

## Context

`importStravaZip` currently runs two separate passes over the same FIT files for bike
activities:

1. `extractGpsTracksFromZip` — for every activity with a GPS file, reads the bytes,
   gunzips if needed, parses the FIT file into `records`, and derives trackpoints.
2. `extractFitPowerEffortsFromZip` — for every **bike** activity, reads the bytes again,
   gunzips again if needed, parses the FIT file into `records` again, and derives power
   efforts from `buildFitPowerEfforts(records)`.

For every bike activity recorded on a FIT device, this means the FIT bytes are fetched
from the ZIP and run through `fit-file-parser` twice, and gzip decompression (when the
file is `.fit.gz`) happens twice. FIT parsing and gzip inflation are the dominant CPU
costs of import, so doing them twice for the bike subset roughly doubles the time spent
on that subset and is the direct cause of the reported slowness.

## Decision: Merge into a single per-file parse pass

**Decision**: Restructure `src/zip-importer.js` so each bike activity's FIT file is read,
decompressed, and parsed by `fit-file-parser` at most once per import. Both the GPS
trackpoints and the power efforts are derived from that single `records` array (reusing
the existing pure functions `extractFitTrackpoints(records)` and
`buildFitPowerEfforts(records)` unchanged). Non-bike activities keep exactly today's
single-pass GPS-only handling; the shared parse only applies where both extractions are
needed for the same file (bike activities with a FIT file).

**Rationale**:
- Removes the actual redundant work (double gunzip + double FIT parse) rather than
  hiding its latency, directly addressing FR-001/FR-006 and SC-001/SC-002.
- `extractFitTrackpoints` and `buildFitPowerEfforts` are already pure functions over a
  parsed `records` array — no changes to their logic or output are needed, which
  satisfies FR-002/SC-003 (identical GPS tracks, power efforts, and PB results) with
  minimal risk.
- Keeps the module's public shape and dual CommonJS/`window` bridge intact
  (Constitution II); only the internal orchestration in `importStravaZip` and the two
  extraction helpers changes.
- Naturally reduces total import time for non-bike-heavy exports to zero extra cost
  (FR-005/SC-004), since only bike activities' FIT files are affected in the first
  place.

**Alternatives considered**:
- *Parallelize the two existing passes (e.g. `Promise.all`)*: would reduce wall-clock
  time somewhat by overlapping I/O, but each bike FIT file would still be decompressed
  and parsed twice, wasting CPU and not meeting SC-001's ≥50% reduction target for
  CPU-bound parsing; rejected as treating the symptom, not the cause.
- *Cache raw/decompressed bytes only, still parse twice*: avoids double gunzip but still
  runs `fit-file-parser` (the more expensive step) twice per bike file; a smaller partial
  win, not sufficient to hit SC-001 reliably.
- *Move FIT parsing to a Web Worker*: could improve UI responsiveness (User Story 3) but
  is a larger architectural change, is not required to fix the root redundant-parsing
  cause, and Constitution I favors keeping the static, build-step-free app simple;
  deferred as an optional future improvement, not required for this feature's success
  criteria.
- *Cache parsed `records` across the two functions via a shared map keyed by filename*:
  functionally similar to the chosen approach but keeps two separate top-level traversal
  loops and an extra cache data structure; rejected in favor of directly restructuring
  the two loops into one combined loop per bike-relevant file, which is simpler and
  easier to reason about/test.

## Progress reporting

**Decision**: Report bike power extraction progress as part of the same combined
per-file loop, so the "Extracting GPS tracks / bike power" stage message and percentage
advance once per file processed (satisfying FR-004), instead of two separate loops each
emitting their own percentage ranges. Exact percentage boundaries (currently ~40–90% for
GPS, ~90–95% for power) may be adjusted, per the spec's Assumptions, as long as progress
still advances monotonically and reaches 100% on completion.

**Rationale**: Avoids a misleading second "stall-then-burst" phase once the redundant
parse is removed, and keeps the progress callback contract (`{ percent, stage }`) used by
`index.html` unchanged.

## Correctness verification strategy

**Decision**: Rely on existing unit tests for `extractFitTrackpoints`, `buildFitPowerEfforts`,
`extractGpsTracksFromZip`, and `extractFitPowerEffortsFromZip` (or their merged
replacement) in [__tests__/zip-importer.test.js](../../__tests__/zip-importer.test.js) as
the regression baseline, and add a test asserting the FIT parser (and gunzip helper) is
invoked exactly once per bike activity file during a combined import, using a spy/mock on
the parser entry point.

**Rationale**: Directly verifies FR-001/FR-006 (no duplicate parsing) and FR-002/SC-003
(unchanged output) without needing real FIT binaries beyond what the existing test
fixtures already provide.

## Open questions

None — all technical unknowns from the spec are resolved above; no
`NEEDS CLARIFICATION` markers remain in the Technical Context.
