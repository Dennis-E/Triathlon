# Data Model: Local Activity Dataset

**Contract version**: `tri-activities-v2` (planned; not yet implemented)
**Related**: [activity contract](contracts/activity-data.md), [query protocol](contracts/query-worker.md)

## Dataset

| Field | Meaning / validation |
| --- | --- |
| datasetId | Unique primitive ID assigned only on a successful candidate commit. Never reused for a different history. |
| generation | Monotonic import lifecycle token. Candidate and active generation are distinct until commit. |
| contractVersion | Exact supported canonical schema version; reject unknown versions. |
| sourceProfiles | Evidence-backed source format, unit and timestamp profile versions. |
| activities | Worker-owned immutable canonical rows in deterministic source/identity order. |
| indexes | Sorted local start dates, date min/max, sport/equipment positions and capability positions. |
| qualityReport | Complete candidate import accounting; separate summary and detail populations. |
| sources | Session-only File/Blob handles and entry reconstruction metadata; no persistent storage. |

The main thread owns only compact capabilities, selected UI state and currently requested view models. Current global aliases must not be replaced with multiple deep copies. Worker transfer/structured-clone transients count toward the memory limit.

## Activity

| Field | Meaning / validation |
| --- | --- |
| activityId | Namespaced source ID, or collision-checked exact fallback fingerprint. |
| source | Provider, profile version, archive/entry ordinal and source ID when present. Ordinals are provenance, not deduplication keys. |
| sport | Exactly Run, Bike or Swim after reviewed alias mapping. No null-sport canonical activity. |
| startInstantMs | Valid finite epoch time for recording ownership; device-independent. |
| localStartDate | Strict YYYY-MM-DD in the resolved activity timezone, for inclusive calendar filters. |
| timezone | Explicit offset or IANA zone, resolution origin and confirmation status. |
| distanceKm | Qualified nonnegative finite measure. |
| movingSeconds | Qualified moving duration only when source meaning proves it. |
| timerSeconds | Qualified timer duration; not silently relabeled moving. |
| elapsedSeconds | Qualified elapsed duration; not silently substituted without metric policy. |
| otherMeasures | Qualified elevation, heart rate, power and cadence using documented source units. |
| equipmentId | Source-qualified equipment identity or missing, never guessed from activity name. |
| details | Zero or more uniquely associated recording references. |
| qualityCodes | Stable reason codes for field, source, identity or coverage limitations. |

Missing/invalid sport or unresolvable date prevents canonical row admission, but the source row remains in report accounting. Missing distance/duration does not remove an otherwise valid activity from All or activity counts.

## Qualified Measure

`{ state, value, unit, reason, provenance }`

- `state=valid`: finite value >= 0; zero is a real value. Unit and source field are known.
- `state=missing`: value is null, reason describes absent or empty input.
- `state=invalid`: value is null, reason explains parse, negative, non-finite, ambiguous-unit or conflicting-value failure.
- Numeric-prefix parsing, NaN/Infinity sentinels, empty-string-to-zero and automatic invalid-to-zero conversion are forbidden.
- Legacy view adapters can expose numeric fallback plus availability flags temporarily, but aggregates must use qualified values rather than those fallbacks.

## RecordingReference and DetailCoverage

RecordingReference identifies source Blob, archive entry, parser version, source-specific owner/window and reconstruction method. It holds compact derived outputs, not permanent decoded FIT objects.

Coverage is tracked separately for recording presence, GPS, power, cadence and heart rate. States are `none`, `partial`, `complete`, `unknown`; include observed sample count, expected count only when known, omitted count/reason, and provenance. Successfully reading a file does not establish complete recording coverage. A complete raw recording does not imply complete associated summary coverage.

Routes consist of ordered segments with explicit breaks, validated coordinates and source-to-render simplification metadata. No segment connects across a known recording break or ambiguous ownership. Low-zoom rendering is a projection, not a replacement canonical route.

## QualityReport

- Summary inputRows, acceptedRows, skippedRows and duplicateRows form mutually exclusive accounting categories: inputRows = acceptedRows + skippedRows + duplicateRows.
- acceptedPartialRows is an overlapping subset of acceptedRows, never an additional total.
- Each skipped/duplicate input row has exactly one primary disposition and can have multiple diagnostic reasons.
- Identity-conflict groups contribute all affected source rows to skippedRows; none is arbitrarily accepted or also counted as duplicateRows.
- Detail accounting uses a separate denominator: discoveredEntries, parsedEntries, failedEntries, unsupportedEntries and associated/unassociated/ambiguous outputs. One FIT may contain several sessions; entry counts must not be equated with activity counts.
- A fatal candidate failure exposes an attempt report, not a replacement active report. Unsupported optional GPX is a detail issue, not a summary row.

## FilterSelection and QueryResult

FilterSelection contains normalized global predicates and the requesting view's local predicates: inclusive calendar bounds, selected sports, selected equipment and capability predicates. Empty selected values means unrestricted for that dimension; an explicit unknown-equipment selection is distinct from no filter. Local and global conditions intersect.

QueryResult contains datasetId, normalized query key, calculation version, eligible activity count, per-metric contribution counts, coverage and compact result data. It must not carry an accidental full-history copy. See [query contract](contracts/query-worker.md) for null result and denominator rules.

## Resource Limits and CacheEntry

CacheEntry contains datasetId, normalized query, calculationVersion, result, estimatedBytes and last-use position. Indexes, compact mandatory derived data and the canonical summaries are owned once. LRU caches can be evicted without changing results.

Initial implementation ceilings, included in total acceptance memory rather than replacing it:

| Resource | Per-worker ceiling |
| --- | --- |
| Selection/query/view result cache combined | 24 MiB |
| Reconstructible decoded detail/route cache | 32 MiB |
| Decoding concurrency | One archive entry / FIT parser at a time |
| Main-thread retained models | Current view plus at most one export snapshot; dispose on generation change |

Large individual results are not cached; detail retrieval can reconstruct from source handles and reduce transfer size through documented display-only projections. If mandatory data alone exceeds the total device budget, report a failed capacity gate; do not silently discard scientific detail. At most one active and one candidate dataset exist; both ceilings apply during staging. Source buffers, native decoder allocations and chart resources are additional measured costs.

## State Transitions

1. `idle/active -> staging(generation)`: allocate candidate; retain active data and its filters.
2. `staging -> parsing -> normalizing -> indexing -> ready`: report real phase counters and source-specific diagnostics.
3. `ready -> committed`: atomically install dataset identity, capability summary and reset dataset-bound filters. Invalidate all old request/export tickets, dispose old charts/models, terminate old worker and release source handles.
4. `staging -> failed/cancelled`: dispose candidate only; keep active identity, filters and report.
5. `staging -> superseded`: terminate old candidate before starting another candidate; no three-dataset state.
6. `active -> disposed`: clear caches/indexes/source handles, close outstanding requests and destroy charts/maps as applicable.

All asynchronous callbacks check generation and request identity after every await, including library loads, export capture and chart rendering. A mismatched response is discarded, never converted into a current result.