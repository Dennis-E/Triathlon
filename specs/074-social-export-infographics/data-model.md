# Data Model: Social Export Infographics

This feature adds no persisted data and does not change training analytics. These are transient presentation models assembled from the selected dashboard state.

## Export Request Snapshot

Represents one consistent user request captured when export begins.

| Field | Meaning | Validation / rules |
|---|---|---|
| targetKind | Dashboard tab or personal-best detail | Must map to an existing export target |
| targetKey | Stable current view identifier | Must have an export capture target and data |
| title | Factual headline | English, at most seven words, at most two lines |
| sport | Selected sport, when relevant | Must describe the data actually shown |
| metric | Selected analysis measure | Must match plotted values and labels |
| period | Selected date/time range | Must match the activities represented |
| unit | Display unit, when applicable | Values and rounding consistent within image |
| centralValue | Main result, optional | Present only when meaningful for the view |
| visualization | Captured chart, map, or view image | Must correspond to the same selection as metadata |
| seriesLegend | Named groups and visual encodings, optional | Every item must map to a displayed series |
| format | `square` or `portrait` | Required; dimensions resolved from Format definition |
| humorousLineEnabled | Whether optional copy is included | Changes no underlying facts or data |
| heatmapViewport | User-defined visible map extent, heatmaps only | Preserve exact pan/zoom extent; do not auto-fit, crop, or distort. The 65% height target is subordinate when incompatible. |

## Export Format

| Value | Output dimensions | Rules |
|---|---:|---|
| `square` | 1080 × 1080 px | Default; five equipment ranking/timeline rows maximum |
| `portrait` | 1080 × 1350 px | Seven equipment ranking/timeline rows maximum |

The format determines the composition geometry, not the selected data. The same request snapshot must not depend on the app window dimensions.

## Social Composition

An ordered visual arrangement of:

1. Factual headline.
2. Optional suitable central value.
3. Main captured visualization.
4. Concise sport/metric/period/unit context.
5. Optional humorous secondary line.
6. Compact logo and readable website footer.

The layout model supplies fixed bounds, edge safety margins, type sizes, and minimum contrast. It omits app controls, filter summaries, generic export copy, and the QR code.

## Visualization Presentation Metadata

Each existing export target maps to a presentation family and provides common context without owning new analytics.

| Family | Additional data and validation |
|---|---|
| Total distance | Total distance/unit; period series; annual bars capped at ten; incomplete year marked YTD |
| Equipment ranking | Ordered item name/value pairs; additive metric/unit; visible limit five or seven; top-rank emphasis |
| Equipment timeline | Ordered equipment/usage-period rows; usage-span versus activity legend; pages share timeline scale |
| Personal bests and analogous records | Best result, discipline/distance, date/event when available, source type when known; up to three distinct labeled milestones |
| Heart rate versus pace/speed | Correct axis names and units, represented series/line labels, optional point-size encoding explanation |
| Heatmap | Current user-defined map viewport, route data, palette, and map attribution; export does not refit or mutate live map |
| Other current export views | Meaningful existing visualization plus relevant factual title and available context; no fabricated numeric highlight |

## Export Series

A numbered sequence of exports for content that exceeds a single image's readable capacity.

| Field | Meaning | Validation / rules |
|---|---|---|
| pageNumber | One-based page position | Present on every image in series |
| pageCount | Number of images | Consistent across the series |
| format | Shared output format | Same dimensions on every page |
| period / metric | Shared data context | Identical on all pages |
| scale | Chart/timeline scale | Shared across pages where required |
| items | Visible rows on this page | No duplicates or omissions across pages |

Equipment timelines exceeding the format limit must be available as a series. Equipment ranking series are optional; the default single image is explicitly labeled Top 5/7 of N.

## Resource Readiness

Tracks only resources needed by the selected request: brand images, active fonts, and map tiles for the preserved viewport.

| State | Meaning | User-visible behavior |
|---|---|---|
| `loading` | At least one required resource is pending | Preview/download remain unavailable or show loading state |
| `ready` | All required resources loaded and renderable | Compose preview and downloadable PNG |
| `failed` | A required resource failed or timed out | Show actionable error; do not create a partial downloadable image |

## Relationships

- One Export Request Snapshot selects exactly one target and one format.
- One Export Request Snapshot produces one Social Composition and one PNG byte sequence.
- The same PNG byte sequence backs the preview and download.
- A target may produce a single image or an Export Series; every series item has its own request snapshot output but shared context and scale rules.
- Resource Readiness gates composition for the selected target.