# Data Model: Power PB and Landing Preview Polish

This feature changes presentation models only. Bike power record qualification, values, and activity source records remain unchanged.

## All-Time Power Profile Point

One highest recorded watt value for an available duration, produced by the existing profile helper.

| Field | Type | Rules |
|---|---|---|
| `durationSeconds` | positive number | Existing duration category; determines point identity and ascending category order. |
| `durationLabel` | string | Human-readable category label such as `1m` or `2m`; used for visible x-axis ticks and point context. |
| `watts` | positive finite number | Highest qualifying watt value selected for this duration; unchanged by display formatting. |
| `date` | Date | Date of the activity that supplied the profile point; context only, not the profile's x-axis value. |
| `title` | string | Source activity name or existing fallback; context only. |
| `record` | existing PB record | Retained for tooltip/context behavior. |
| `showLabel` | boolean | Existing duration-label visibility rule; hides crowded intermediate labels without removing points. |

**Ordering and identity**: Profile points are unique by `durationSeconds` and sorted ascending by duration. Missing duration records produce no placeholder points. The existing selection helper remains authoritative.

## All-Time Power Profile View Model

A display model shared by the compact profile and its full-screen detail/export presentation.

| Field | Type | Rules |
|---|---|---|
| `xAxisMode` | `duration-category` | Identifies duration-category profile rendering; other PB history models keep their existing date-based x-axis. |
| `points` | ordered list of All-Time Power Profile Point | Same points and order as the compact profile; no value or membership transformation. |
| `xAxisLabel` | string | Identifies duration as the horizontal metric. |
| `yAxisLabel` | string | Identifies power in watts. |

Rendering rules:

- Horizontal positions use evenly spaced positions in ascending `durationSeconds` order so duration labels remain readable; visible tick text comes from `durationLabel`.
- Vertical positions and labels use each point's `watts`.
- Dates and activity titles may appear as point context but never replace duration ticks.
- The downloaded image export captures the same full-screen profile chart and point set shown by the detail view.

## Personal Bests Dashboard Sport Cell

A sport-specific cell for one metric category in the Personal Bests dashboard.

| Field | Type | Rules |
|---|---|---|
| `sport` | `Run`, `Bike`, or `Swim` | Sport associated with the PB container; mobile order is Run → Bike → Swim. |
| `category` | existing PB category | Distance records, Elevation, Longest, or Watt. |
| `heading` | visible sport label | Mobile-only heading, immediately preceding this sport/category content. |
| `content` | existing PB container or applicability message | Same underlying visualization/content as before; no record calculation changes. |

**Responsive relationship**: On desktop, the shared sticky header labels the Swim/Bike/Run columns and cells retain their respective column placement. On mobile, the shared header is hidden and each category row stacks Run/Bike/Swim cells with their mobile headings.

## Landing Personal Bests Preview Card

The independent landing card contains an illustrative static preview and descriptive copy. The copy is updated to convey that Personal Best progress covers multiple records and metrics; its decorative sport mini charts are not the target of the responsive dashboard-heading behavior.

## State and persistence

No new persisted entity or state transition is introduced. Imported activities remain browser-local; the feature does not add an API, server write, or additional export data source.
