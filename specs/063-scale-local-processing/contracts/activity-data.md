# Activity Data Contract

**Version**: `tri-activities-v2`
**Scope**: Supported Strava CSV-in-ZIP and TrainingPeaks FIT/FIT.GZ-in-ZIP inputs; optional GPX/GPX.GZ details. This is not a new public upload endpoint.

## Source Profiles and Units

The shared normalizer takes an explicit profile: provider, format/version evidence, header aliases, units, numeric syntax, precision, timestamp convention and sport aliases. Tests and production call this same normalizer. Unsupported profile versions fail explicitly; unproven individual measures remain unavailable with a reason.

| Input | Required interpretation |
| --- | --- |
| Duplicate Distance or Distanz | First value kilometers, second meters. Convert before comparing. Preserve occurrence order even at column index zero. |
| Single unqualified Distance/Distanz | No unit default. Require a supported evidence-backed profile; otherwise invalid/ambiguous-unit, retaining usable activity fields. |
| FIT session total_distance | Meters from the current configured decoder, converted to kilometers exactly once. |
| FIT total_timer_time / total_elapsed_time | Seconds; retain separate meanings. Timer is not proof of moving time. |
| Explicitly unit-qualified future supported column | Only interpret through a registered profile, not heuristic string guessing. |

For duplicate columns, two valid values must agree after unit conversion within the profile's documented rounding intervals. With no documented rounding, require exact normalized decimal agreement, not an invented tolerance. Prefer the most precise documented representation deterministically. One absent column may use the other valid, known-unit value. A supplied invalid or conflicting partner makes the combined distance invalid and reports the conflicting fields.

Numeric parsing consumes the entire trimmed input using the profile's locale rules. Zero and string "0" are valid. Empty, absent, malformed, negative and non-finite inputs are distinct. Do not infer units from language or magnitude. Preserve original token and field reference only as needed for a session-local explanation; never transmit them.

## Sports and All

One reviewed registry preserves existing supported aliases, including currently supported walking/running and virtual cycling mappings. Unknown aliases are skipped with unsupported-sport; do not default them to Run. TrainingPeaks derives sport from supported FIT session fields, not arbitrary filename text.

All = Run union Bike union Swim among admitted canonical activities, after selected global/local filters. Metric-specific absence does not remove a row from this set. Sport-specific views intersect this set with their sport. Report both selected activity count and each measure's contribution count.

## Time and Recording Boundaries

Strictly parse supported timestamp syntax, preserving original offset and source meaning. Explicit source timezone/offset wins; a documented format convention may supply the interpretation. Otherwise the import requires an explicitly confirmed IANA timezone in the import flow. Missing timezone cannot inherit silently from the browser. FIT UTC instants still need an explicit/documented zone for athlete-local calendar dates.

Validate timezone conversion by round-tripping local components; reject invalid calendar dates and unresolved DST folds/gaps. Date-only source values can establish a calendar date but cannot fabricate a recording instant; if the supported source requires a start instant, skip that row with reason. Inclusive date selection compares local YYYY-MM-DD, not device-local Date objects. Week and year grouping use the same calendar, with existing Monday week start retained.

Recording ownership uses instants, not date filters. Preserve [062 import/heatmap ownership](../../062-restore-swim-heatmap/contracts/import-heatmap.md): standalone Strava FIT retains all recorded samples; shared recordings require valid unique IDs and uniquely owned time windows; overlap samples are omitted. TrainingPeaks keeps its session segmentation. GPX must also have a unique owner; no first-association fallback.

## Identity and Duplicate Resolution

Use provider plus stable source activity ID, looked up by supported named field, never CSV column position. Without a supported stable ID, use exact equality of all canonical summary attributes including value states, timestamp/calendar meaning, sport, equipment and title; source filename, archive order and detail presence are not identity attributes. Hashes are accelerators only; verify equality to avoid collisions. Do not use rounded distance/duration fingerprints or infer cross-provider identity.

An identical same-source summary group admits one row and reports all others as duplicates. Merge uniquely owned, compatible complementary details once. Same-ID summaries with differing canonical content quarantine the whole group; count all its input rows as skipped/identity-conflict. Input ordering must not determine totals, conflicts or chosen detail coverage. A new candidate replaces the active dataset; it does not append silently.

## Quality Report and Admission

Each input row receives accepted, skipped or duplicate disposition. Accepted rows can be partial because measures or details are missing, invalid or incomplete. Required sport/date identity failures skip the row; invalid distance/duration alone does not. Report stable reason codes and human-readable explanations with affected source entry/field references.

Required codes include unsupported-sport, invalid-date, timezone-required, ambiguous-time, ambiguous-unit, invalid-number, negative-value, conflicting-distance, duplicate, identity-conflict, unreadable-detail, missing-detail, ambiguous-recording-owner and partial-coverage. Unknown expected coverage is unknown, never 100 %. Detail entry counts and summary row counts are separate populations; see [data model](../data-model.md).

Strava ZIP/required CSV failure is fatal, while corrupt individual recordings are isolated. TrainingPeaks archive/FIT/FIT.GZ parse failure rejects the candidate multi-archive operation. Optional TrainingPeaks GPX failure remains a reported omission. Failure leaves the prior active dataset and filters intact.

## Compatibility and Loading

Keep current exported function names/signatures where practical; production/test processData wrappers delegate to the same pure implementation. Temporary adapters expose current kilometer and duration shapes with explicit availability, but must never aggregate numeric fallback zeros as real observations. Do not migrate every consumer in one unverified replacement.

Reusable modules expose CommonJS and window bridges plus a worker-safe globalThis/self bridge. Load the contract before ZIP/source adapters and the store/query modules before dashboard client orchestration. Keep current classic script dependency order and update [script wiring contract](../../022-modularize-inline-script/contracts/script-load-order.md) and syntax tests when the implementation changes index.html.

No parser, normalizer, worker or report sends workout data to the analysis counter or any other service. Source files and generated reports remain in browser-session memory only.