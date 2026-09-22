# UI Contract: Bike Power PB Refinement

## Section placement

The existing Bike Personal Bests column keeps its current distance, elevation, and
Longest sections. A dedicated section titled `Watt` appears immediately below the Bike
Longest section. The section is absent when there is no qualifying duration-specific
Bike power data.

The section MUST NOT contain an activity-average power progression card or title.
Whole-activity average watts may remain visible in unrelated activity details, but not
in this Personal Bests section.

## Duration cards

The Watt section supports these labels in ascending duration order:

`5s`, `30s`, `1m`, `2m`, `5m`, `10m`, `20m`, `60m`.

Each available duration has a progression card with:

- an unambiguous duration label;
- watt values with a visible `W` unit;
- chronological successive best records;
- date and activity context in the existing detail/tooltip interaction; and
- source wording that identifies a duration-specific FIT effort.

Unavailable duration cards are omitted from the Watt section. When fewer than two
durations remain available, the profile area shows a limited-profile message instead
of a chart. They never receive a value from whole-activity average watts.

## All-time profile

The Watt section includes an all-time profile when at least two durations are available.
The x-axis is labeled `Duration` and uses seconds/minutes labels. The y-axis is labeled
`Power (W)` or equivalent wording. There is at most one point per duration, and each
point is that duration's highest qualifying watt value.

Missing durations are omitted and the available points are connected directly. No
interpolation or estimated point is drawn. With zero points, the Watt section uses the
no-data state; with one point, it shows a limited-profile message instead of implying
a complete profile.

## Preservation and privacy

The existing Bike distance, elevation, and Longest sections and all Run/Swim sections
remain unchanged. Power values and the profile are computed from the local imported
dataset and are not sent to a server.

## Accessibility and responsive behavior

Duration labels, axis labels, watt units, and record details remain readable at narrow
viewport widths. Existing keyboard-accessible PB detail interactions remain available.
SVG labels and points must not overlap the surrounding Watt cards or section heading.
