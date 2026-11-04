# Data Model: Reel / Story Exports

**Scope**: In-memory export-domain records only; no database, persistent personal-data store, or network schema.
**Related**: [spec.md](spec.md), [plan.md](plan.md), [contracts/export-contracts.md](contracts/export-contracts.md).

## ExportFormat

| Field | Type / Rule |
| --- | --- |
| key | `square`, `portrait`, or new `story`; existing keys retain their meanings. |
| label | Square / Feed portrait / Reel / Story, with visible ratio. |
| width, height | Integer pixels: 1080 x 1080, 1080 x 1350, 1080 x 1920 respectively. |
| contentBounds | Source-pixel rectangle. Story: x=72, y=240, width=888, height=1320. Shorter formats use measured margins, not story's vertical coordinates. |
| typography, palette | Existing shared identity adapted to minimum essential 36-pixel text and 4.5:1 text contrast. |

Validate positive dimensions, exact supported combinations and supported keys. Unknown formats fail explicitly; no square fallback for a requested story. User selection initially remains square.

## ExportAdapterDescriptor

One descriptor per registered target key, plus PB detail-kind dispatch and media variant dispatch. Fields: `targetKey`, `family`, `captureSelection`, `renderPage`, supported format keys and readiness validation. These are private adapter responsibilities, not a new public chart framework.

All 13 target keys must have matching capture/display/filename/adapter coverage. PB definitions and media generators have stable variant identities beneath their owner target. Future exports must supply these fields and acceptance cases before registration is complete.

## ExportSelectionSnapshot

| Field | Type / Rule |
| --- | --- |
| selectionId | Unique per new captured selection; format/caption changes reuse it. |
| datasetIdentity | Existing dataset object/token identity captured at start; not raw file content or a new persistent identifier. |
| targetKey, targetKind, variantKey | Registered target, `tab` or `pb-tile`, and applicable record/media definition identity. |
| capturedAt | Capture instant for diagnostics/consistent filename generation; does not replace training-period context. |
| filters | Frozen selected values, including sport, dates, metric, aggregation, years, groups, palette, visible series, trend and route choices where applicable. |
| period | Actual selected start/end or meaningful pattern/summary scope, display label and partial-period status; distinguish selected scope from observed data extent. |
| metric, units | Explicit metric identity and display units, with separate X/Y/point-size encodings where applicable. |
| familyData | Allowlisted data below; no live chart, DOM, entire activity object or mutable dashboard array. |
| legend, scale | Selected entries, colours, ordering, axis direction/domains and the global/per-year semantics required by the original visualization. |
| provenance, attribution | Synthetic-data flag and readable source/map notices; copied to each resulting image. |
| disclosure | Existing user-controlled title-derived content, selected map viewport and media route-inclusion choice. Does not grant new title/location disclosure. |
| pbOpening | Existing PB-dialog identity when relevant; prevents a save from closing a later opening. |

Copy/freeze plain values before the first await. Record timestamps as finite epoch milliseconds, calendar days as local `YYYY-MM-DD` keys; do not JSON-serialize Date objects and later test them as Dates. Axis values remain numeric; display strings do not become the calculation source. Missing remains missing, not zero.

### Family Data

| Family | Required attributes and integrity rules |
| --- | --- |
| Distance | Complete ordered period keys/labels, sport series and stacks, totals, aggregation, partial-period flags; global value domain across continuation pages. |
| Pace metrics | Numeric points, year/series membership, visibility, frozen trend results/visibility, axis titles/domains/direction, sport pace/speed units, point-size normalization and meaning. No callback may read live owner state. |
| Equipment ranking | Ordered item IDs/names/types, metric values/display units, ties and explicit subset/total counts if limited. |
| Equipment timeline | Item identities/names, date epochs, actual activity dates, mode, common time domain; usage span is distinct from activity events. |
| PB detail / overview | Stable definition, sport, full record sequence, values/units, source attribution, axis mode; power profile includes duration seconds/labels and is not an improvement chronology. Overview contains its own grouped models, not active detail state. |
| Heatmap | Selected projected viewport/extent and aspect, selected route/frequency layer, sport/year/palette, scale meaning, attribution and immutable capture resources; never derive a replacement extent from all activities. |
| Distributions | Existing selected bin edges and special bins, counts/frequencies, visible sport series, units, axis semantics and period. |
| Workout Time | Existing grouping/pattern dataset, granularity, selected measure, sport, availability, zero/null distinction and common domain. |
| Calendar | Selected local day keys, year/month/weekday positions, day values, coverage status, palette, metric and original intensity scale metadata. If scale is per year, retain that association explicitly. |
| Wordcloud | Included terms, counts, colours and one global weight mapping; do not include raw activity titles beyond the already selected title-derived content. Track every placed term. |
| Pie charts | Full existing slices, values, category IDs, colours, percentages/denominator, legend entries, grouping/measure and selected period. Existing Other is retained; new export aggregation is forbidden. |
| Lifetime statistics | Currently exported totals, milestone values/dates, equipment counts, country-summary availability and units; omit incidental activity titles and dashboard-only table fields. |
| Media | Annual/collage kind, frozen ordered readable asset keys, selected/eligible/displayed counts, explicit selection versus filters, route inclusion, already permitted captions, prepared video stills and route visuals. Source references live in the resource lease, not persisted snapshot JSON. |

## ExportPresentation and ExportLayoutPlan

`ExportPresentation` contains only accurate headline, necessary context entries, optional factual summary, legend, synthetic notice, attribution, branding and optional humour line. Disabled humour has no caption field/height. Enabled humour has exactly one measured, relevant line; neutral family-specific humour is permitted when stronger data-dependent wording would be unsupported.

`ExportLayoutPlan` relates one snapshot and immutable format/caption options to a list of page plans. Fields: output dimensions, safe bounds, measured typography, header/context/footer/legend/caption rectangles, family content rectangles, page count and family layout identity. A page may have several meaningful content regions; no universal fixed chart box is mandated.

Each page plan holds `pageIndex`, `scopeLabel`, ordered item/period/group ranges, shared scale references, and layout bounds. Validate final-pixel containment and text metrics; any bitmap fit must prove effective font sizes remain at least 36 pixels. Unfit nonempty content requires supported continuation or a clear error, never silent clipping.

Continuation completeness rules depend on the family: disjoint chronological/row ranges cover all required items exactly once; repeated common context or a repeated full pie chart is intentional and marked as such. Explicitly limited rankings/media carry total/subset disclosure. Natural co-location of source data must not be changed by jitter or value alteration merely to solve a layout-label collision.

## ExportSession and CompositionRequest

| Record / Field | Rule |
| --- | --- |
| sessionId | Monotonically changing identity for new sessions and close/invalidation; never reused by delayed callbacks. |
| snapshot | One immutable selection; separate from current dashboard selection after capture. |
| state | `capturing`, `composing`, `ready`, `failed`, or `closed`; the controller may be `idle` without a session. |
| compositionRevision | Increment synchronously for each requested format/caption change, including changes while capture is pending. |
| request options | Copy of sessionId, compositionRevision, format and humour; never read mutable global options inside page loops. |
| viewRevision, pageIndex | Increment view identity on page selection; valid only within the ready series. New composition starts at page 1. |
| approvedSeries | Atomically published complete prepared-image array for the current composition only. |
| approvedImage | Current ready page plus session/composition/view identity; cleared as a download approval while pending. |
| error | Current request error only; stale rejections cannot overwrite current state. |

### State Transitions

| Event | Transition / invariant |
| --- | --- |
| New valid export | Idle/new identity -> capturing; snapshot/resources acquired before awaiting; download unavailable. |
| Format/caption change during capture | Record newer request/options; capture selection stays fixed; only latest options may compose/publish once ready. |
| Capture completes | Current session -> composing latest request; stale session releases its own resources without UI changes. |
| Recompose | Ready/failed -> composing with new composition revision; download and old series navigation unavailable. |
| Valid complete candidate | Current composing -> ready, atomically publish all pages, pageIndex=0, new approval. |
| Page selection | Ready -> ready with valid pageIndex and incremented viewRevision; no rerender. |
| Render/validation failure | Current request -> failed, no download approval; retry uses the same snapshot/selectionId and never recaptures current dashboard data. If that selection or its required sources are unavailable, remain failed with an explanation and download blocked. Only an explicit new export request creates a new sessionId and selectionId from the current dashboard selection. |
| Close/new session | Current identity invalidated synchronously -> closed/next session; delayed work may not reopen or reset UI. |
| Dataset/filter change | Existing frozen session remains coherent; no live state substitution. The next explicitly requested export captures the new selection. |

## PreparedExportImage and SaveAttempt

`PreparedExportImage`: frozen session/composition identity, selection ID, format, page index/count, immutable target metadata and filename basis, PNG blob/data URL, decoded width/height and validation result. PNG signature/header dimensions and decoded image dimensions must both match the format before publication. Canvas drawing calls alone are not dimension evidence.

`SaveAttempt`: unique attempt ID, approved image object, originating view revision, filename, page, PB opening and outcome (`saved`, `downloaded`, `cancelled`, `failed`). Only one save attempt runs at once. Before its first await it binds the exact approved blob; later selections do not change its bytes. Closing the preview does not rewrite a save already authorized by the user. Attempt completion may release its own lock but may not enable, close or advance a newer preview incorrectly.

## ExportResourceLease

Request-local handle with immutable source references, `prepare`/acquire-consumer behaviour and idempotent `release`. Applies to isolated charts/canvases, temporary DOM, decoded images, object URLs, media-source leases and isolated map content.

States: acquired -> preparing/consumed -> release requested -> released. Close/staleness requests release immediately, but actual source disposal waits for any already-started consumer to finish. Constructor/preparation failures release partial ownership. Format changes reuse session resources but do not borrow the currently active gallery's mutable URLs. Prepared PNG blobs retained by a save remain valid independently of source cleanup.

Discard superseded candidate images, destroy temporary chart instances, detach cloned DOM and release working canvases after encoding. Retain only the current format's candidate/approved series and active consumers, not all format permutations. No training data or resource handle is logged or uploaded as acceptance evidence.