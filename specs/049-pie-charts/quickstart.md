# Quickstart: Pie Charts

## Automated checks

```powershell
npx jest __tests__/pie-chart-utils.test.js __tests__/tab-navigation.test.js __tests__/index-script-syntax.test.js __tests__/preview-assets.test.js
npm test
```

Expected: all green. Utility tests use synthetic activities and cover every dimension × measure × sport combination, ordering rules, "Other" merging, empty results, excluded counts, and color generation ([contract](contracts/pie-chart-utils.md)).

## Manual browser validation

1. `python -m http.server`, open `http://localhost:8000`.
2. Landing page: "And much more" tile lists "Pie charts" before "…" (narrow and wide widths, no horizontal scroll).
3. Import a Strava export (or synthetic CSV) and open **Pie Charts**.
   - Default: Sport / Activities / All Sports / On fire → Run, Bike, Swim slices.
4. Switch each dimension; verify ascending range ordering and units; Equipment shows "No equipment" and at most 8 slices including "Other".
5. Switch measure Activities → Time → Distance: slice sizes and summary change; grouping and colors stay.
6. Sport filter Run/Bike/Swim; Swim + Power → empty state; Sport dimension + Run → single 100 % slice.
7. Colour scheme: On fire ↔ Monochrome blue; adjacent slices distinguishable; scheme kept when other filters change.
8. Hover/tap slices: tooltip with label, value, count, percentage.
9. Export for Insta / Strava with data → preview with chart, legend, summary and selection context; download works. In an empty combination → standard no-data toast.
10. DevTools Network tab: no new requests while using the tab.

Data model and UI details: [data-model.md](data-model.md), [contracts/ui-contract.md](contracts/ui-contract.md).
