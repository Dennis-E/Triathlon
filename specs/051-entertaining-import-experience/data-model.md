# Data Model: Entertaining Import Experience

The feature keeps all session state in memory and introduces no persisted training data or server-side data model.

## ImportExperienceSession

One temporary presentation session bound to a single active import.

| Field | Type | Rules |
|---|---|---|
| `orderedMessageIds` | array of stable IDs | Randomized without replacement; contains only currently eligible humor/personal candidates. |
| `shownMessageIds` | set of IDs | An ID is shown at most once during the current candidate cycle. New valid personal candidates may be inserted into the remaining order, but never reinsert an already-shown ID. |
| `currentMessageId` | ID or null | Message paired with its corresponding local illustration. |
| `humorousMessageCount` | non-negative integer | Counts generic and personalized humorous messages; privacy reminders do not increment it. |
| `privacyReminderDue` | boolean | Becomes true after four humorous messages and clears after the reminder is shown. |
| `phase` | import phase | Sourced from real application status, not inferred from elapsed time or percentage. |
| `active` | boolean | False after success, error, modal close, teardown, or a new import replaces this session. |

**Lifecycle**: `created → active → stopped`. On stop, rotation and visibility resources are cleared. A subsequent import receives a new session and shuffle order.

## ImportMessage

A catalog entry whose ID is stable so copy and visuals can be changed independently.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Stable unique ID; generic messages use `message-01` through `message-20`; personal candidates use distinct IDs. |
| `kind` | enum | `humor` or `personal`; privacy copy is a recurring interstitial, not a shuffled candidate. |
| `text` / `template` | string | Static text or a template with explicitly named statistic placeholders. No fabricated defaults. |
| `illustrationPath` | relative local path | Must resolve to a checked-in SVG and match the message concept. Personal entries may reuse the nearest fitting illustration. |
| `requiresPhase` | phase or null | Only message 20 requires application-level `finalizing`; numeric progress alone is insufficient. |
| `requiresStatistic` | statistic key or null | For personal messages, candidate is eligible only when that statistic has `complete`/reliable status. |

## ReliableImportStatistic

A temporary derived scalar or date range calculated from the completed processed activity array.

| Statistic | Source and eligibility | Omit when |
|---|---|---|
| Activity count | Number of processed records with valid dates; unknown sport records remain included because they are part of the imported dashboard dataset. | No processed activities. |
| Cycling distance | Sum of distances for normalized `Bike` records whose `distanceAvailable` is true. | No Bike records or any Bike distance is unavailable; do not show a partial sum as a total. |
| Training history range | Earliest and latest activity dates in the processed dataset; presented as the inclusive calendar-year endpoints, not as an estimated number of training years. | No valid-dated activities. |
| Running-shoe count | Distinct trimmed, case-insensitive, non-placeholder equipment labels attached to normalized `Run` records. | No usable equipment records. |
| Longest ride | Maximum distance among normalized `Bike` records with reliable distance. | No Bike records or any Bike distance is unavailable, since a missing value could change the maximum. |
| Swimming activity count | Number of processed records normalized to `Swim`. | No swimming records. |

Statistics are derived only after CSV processing has completed. No ZIP, CSV, FIT, or GPX parsing is repeated. Numeric and distance rendering follows existing application formatters.

## ImportPhaseAndProgress

The existing progress percentage and current status are separate values. The percentage is updated only from actual progress callbacks; stage-only updates must not inject estimated phase weights or move the displayed value backward. Distinct ZIP-extraction `Finalizing...` and whole-application `Finalizing...` states must not be conflated for message-20 eligibility. Only the latter, after processed dashboard data is ready and before the existing close delay, qualifies.

## PrivacyReminder

One local reassurance text shown after each four humorous messages as secondary status. It neither consumes a joke slot nor counts as a randomized catalog entry. Copy is limited to the fact that imported training-file contents are processed in-browser and not uploaded to TriAnalytica servers; it does not claim the app makes no network requests.
