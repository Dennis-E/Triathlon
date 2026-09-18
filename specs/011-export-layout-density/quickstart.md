# Quickstart: Export Layout Density

## Prerequisites

- Node.js and npm installed.
- Static server available through Python.
- Synthetic or local Strava data sufficient to populate visualizations and PB details.

## Automated Validation

```powershell
npm test -- --runInBand --runTestsByPath __tests__/export-utils.test.js __tests__/index-script-syntax.test.js
npm test -- --runInBand
```

Expected results:

- Utility tests cover measured row heights, larger-layout boundaries, PB content fitting, and header metadata.
- Inline-script tests confirm no footer drawing, header domain/QR placement, larger typography, and dynamic row positioning.
- Full root tests pass without changes to parsing or API behavior.

## Browser Validation

Start the app:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/index.html`, import data, and verify:

1. Export a visualization with one filter row. Confirm the entire row and bottom padding are visible.
2. Export a visualization with enough controls to wrap to multiple rows. Confirm rows do not overlap and the legend starts below the last row.
3. Inspect the export at a narrow viewport. Confirm larger text remains readable and within its regions.
4. Export a personal-best detail. Confirm the chart fills most of the content area without distortion or excessive blank space.
5. Inspect the header. Confirm it contains the title, TriAnalytica logo, canonical domain, and QR code.
6. Confirm there is no separate footer and no repeated logo, domain, or QR code at the bottom.
7. Compare preview and downloaded image for the same layout and readable metadata.

## References

- [Export UI contract](contracts/export-ui.md)
- [Data model](data-model.md)
- [Feature specification](spec.md)
