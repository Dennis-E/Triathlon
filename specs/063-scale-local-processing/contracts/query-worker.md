# Query, Worker and View Lifecycle Contract

**Versions**: `protocolVersion=1`, `filterVersion=1`, `calculationVersion=1`, data contract `tri-activities-v2`.

## Ownership

The active worker owns one canonical history and its indexes. One separate candidate worker may exist during import. The main thread owns UI filters, request tickets and bounded current-view/export models, not a full mirrored history. Utilities are pure and directly testable under CommonJS; DOM orchestration calls the asynchronous client adapter.

## Filter Algebra

Selection is the intersection of dataset, global predicates and the requesting view's local predicates. Within a dimension, selected values are OR; across dimensions, conditions are AND. If both scopes constrain a dimension, their results intersect rather than one overwriting the other.

- Dates: inclusive start/end activity-local calendar days, independent of device timezone. An omitted bound is unrestricted; reversed bounds return an explicit invalid-query error.
- Sports: selected recognized Run/Bike/Swim values; All and empty sport selection mean no restriction within the supported union, not inclusion of unknown sports.
- Equipment: source-qualified IDs; missing equipment does not satisfy a named equipment predicate. An explicit missing category can be requested separately.
- Availability: predicates for declared detail/measure capability and coverage, not truthiness of numbers. A drawable route requires at least one valid nondegenerate segment; one point is insufficient. A valid zero value is available but might not support a derived metric.
- Normalize enum ordering and duplicate values before cache lookup. Preserve timezone/date semantics and scope/view ID where behavior depends on them.

Default existing controls remain view-local unless explicitly displayed as global. Their current scope is made visible during migration. Shared definitions do not silently synchronize unrelated legacy controls. Any new global selection is visibly identified; no independent filter-panel redesign is part of the feature.

## Metrics and Denominators

| Metric | Rule |
| --- | --- |
| Activity count | Cardinality of selected admitted activities, including partial records. |
| Distance sum | Sum valid distanceKm values including true zeros; expose contribution count. |
| Duration sum | Sum one explicitly requested duration kind; never mix moving, timer and elapsed unnoticed. |
| Mean of a measure | Sum valid values divided by their contribution count, including valid zeros. No contributors yields null/unavailable. |
| Aggregate speed / pace | Use the same paired subset with valid positive distance and explicitly selected positive duration; speed = sum(distance) / sum(duration), pace reciprocal with units. Not the mean of per-activity ratios. |
| Route visits | Count distinct activity IDs under existing deterministic matching rules, not point or file count. |
| Best efforts | Preserve current accepted sample/duration rules and exact numeric results; missing power is not zero power. |

Equal metric IDs over equal selected IDs and duration kinds must agree before display rounding. Zero sum with contributors is different from no eligible contributions. Each result carries selectedCount, contributionCounts, exclusions and coverage; views do not reimplement denominator logic. Timeline bucket assignment uses local start date and stable ordering.

## Message Envelope

Every request/response contains protocolVersion, generation, datasetId (null while staging), requestId, type and payload. Query requests/results also contain normalizedQueryKey and calculationVersion. Unknown protocol/data versions return an explicit error.

| Request | Response / behavior |
| --- | --- |
| IMPORT(files, sourceProfile, confirmedTimezone) | PROGRESS(phase, completed, total or null), then READY(capabilities, report, candidate token) or ERROR. Source policies apply. |
| COMMIT(candidateToken) | Client atomically installs matching ready candidate and announces new datasetId. Only one current candidate may commit. |
| QUERY(viewId, globalFilter, localFilter, metricIds) | RESULT compact model and counts; no raw full-history payload. |
| CAPABILITIES | Lightweight ingestion facts / predicates; no full builder, route union or chart construction. |
| CANCEL(requestId) | Cancel cooperatively between chunks; discard obsolete results even when a parser cannot yield. |
| DISPOSE | Reject pending requests, clear handles/caches, release transferable buffers and terminate worker. |

Terminating the candidate is the hard-cancel mechanism for an indivisible synchronous parser. At most one candidate exists; a new import terminates the previous candidate before allocating another. Cancellation/error does not destroy the active worker. Progress uses actual phases/counters, never simulated percent; unknown totals are explicitly indeterminate.

## Caching and Scheduling

Cache keys include datasetId, data/filter/calculation versions, normalized filters, metric IDs and relevant view configuration. Coalesce identical in-flight requests. Byte-bounded LRU limits are defined in [data model](../data-model.md); enforce limits on insertion and release references on eviction. Oversized results are uncached. Date/sport/equipment indexes and common buckets are built once, not independently by every view.

An immediate repeated query with no intervening eviction must reuse its computation; after eviction, recomputation is permitted and must yield identical results. CPU work yields in bounded chunks for cancel/progress where feasible; worker location alone does not justify unbounded work. Route work may be reused across compatible filters without changing deterministic ownership/order or scientific meaning.

## Commit, Render and Export

Commit updates dataset identity, capabilities, report and all dataset-bound filters together. Reset selected sport, date ranges, equipment references, viewport dataset IDs, PB detail models and retained wordcloud sources. Dispose old models/charts and source handles. If the current tab is no longer available, choose the first meaningful existing tab through normal navigation rules.

Only the active tab builds its full model/chart. Availability matches existing meaningful-output rules using compact facts; tests compare capability results against independently specified examples and ensure no model builder is invoked. Tenfold registered-view growth must not scale retained histories or unopened models.

Every asynchronous render, library load and export capture checks generation and current request ticket after each await. A new filter request supersedes an older same-view request. Export uses the displayed view's dataset/filter snapshot; if that snapshot is invalidated before capture completes, cancel with a clear status rather than downloading mixed data. Existing local preview/download behavior and capture targets remain intact.

Import error/progress controls remain accessible, with visible reaction within 100 ms p95. Browser/CDN load failures are distinguishable from corrupt workout input and may be retried without reusing a permanently rejected dependency promise.