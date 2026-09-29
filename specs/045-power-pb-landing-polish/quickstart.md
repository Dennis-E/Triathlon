# Quickstart: Power PB and Landing Preview Polish

## Prerequisites

- Repository checked out on `045-power-pb-landing-polish`.
- Node.js/npm available from the repository root.
- Use synthetic Bike power fixtures or explicitly supplied local data; do not commit personal exports.
- For visual validation, serve the static app from the repository root with `python -m http.server` and open `http://localhost:8000`.

## Focused automated validation

Run the focused utility and inline-script contracts:

```powershell
npm test -- --runInBand power-pb-utils index-script-syntax
```

Expected outcomes:

- The all-time profile retains one selected highest-watt record for each available duration and sorted duration order.
- The profile detail renderer uses duration-category values and duration labels, while ordinary PB timeline details continue to use date/year axes.
- The compact tile, detail view, and image export all reference the same profile point values and duration axis; the compact chart preserves its aspect ratio, remains inside the tile, has non-overlapping axis labels, and shows a vertical line for every duration point.
- The landing Personal Bests description no longer implies distance is the only PB measure.
- Each sport heading remains paired with its chart; the markup contract supports stacked narrow layout and three-column wide layout.
- The chart size and layout changes do not alter PB values, record count, export flow, or unrelated PB behavior.

Then run the complete root suite:

```powershell
npm test -- --runInBand
```

## Manual browser validation

1. Start the static server and load synthetic or explicitly supplied Bike data containing duration-specific power records for multiple durations (for example, 1m, 2m, 5m, and 10m).
2. Open **Personal Bests** at viewport widths of 390 px and 1280 px and measure the compact All-time power profile chart.
3. **Expected**: the chart fills at least 90% of the profile block's available inner content width, preserves its aspect ratio, remains within the tile at both widths, and has no overlapping or clipped axis labels; every measurement point has a visible vertical line to the duration axis.
4. Inspect the compact profile's duration labels and watt values.
5. Open the profile full-screen view.
6. **Expected**: the profile shows the same duration/watt points as the compact tile; its horizontal axis labels durations, not activity years. Ordinary duration-history tiles continue to use dates on their x-axis.
7. Use the existing image export control from the full-screen profile view and inspect the downloaded image.
8. **Expected**: the export shows the same all-time profile and duration labels as the compact and full-screen views; the existing local preview and download interaction remains intact.
9. Open the actual **Personal Bests** dashboard panel at a narrow mobile viewport (approximately 390px wide).
10. **Expected**: the shared sticky Swim/Bike/Run header is hidden. For each metric category, content appears in Run → Bike → Swim order, with a matching sport heading immediately before each sport's PB content; the Swim Elevation not-applicable message remains under Swim. The Bike-only Watt section has a Bike heading above its chart.
11. Review the same panel at a laptop/desktop viewport (for example 1280px wide).
12. **Expected**: the shared sticky Swim/Bike/Run header aligns with the three columns and no duplicate mobile headings are shown. The landing-page Personal Bests card description accurately says PB progress is broader than distance.
13. Confirm no PB record values, dashboard navigation, or unrelated chart behavior changed.
