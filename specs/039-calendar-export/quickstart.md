# Quickstart: Training Calendar Transparency and Export

## Prerequisites

- Node.js and npm installed.
- A local dataset spanning at least three years, with active and empty days.
- Existing image-export assets available locally.

## Automated validation

```powershell
npm test -- training-calendar-utils export-utils index-script-syntax --runInBand
```

Expected result: transparent empty-cell styling, calendar export target registration, filter metadata, tooltip exclusion, no-data handling, and full-container capture contracts pass.

## Manual validation

1. Serve the repository:

   ```powershell
   python -m http.server
   ```

2. Import data spanning at least three years and open **Training Calendar**.
3. Confirm empty cells use `rgba(241,245,249,0.5)` in Green, Blue, and Fire while active cells remain opaque.
4. Select a sport filter and palette, then click the Training Calendar export button.
5. Confirm the export first opens the image preview, whose download action produces an image containing every visible year block in order, including empty years, and reflects the selected palette and sport filter.
6. Hover a day to show a tooltip, then export. Confirm no tooltip overlay appears in the exported image.
7. Try export with no imported activities. Confirm the action is blocked or a clear no-data message appears.
8. Trigger an export failure scenario if available. Confirm the calendar, selected palette, sport filter, and year blocks remain unchanged.
9. Repeat on a narrow viewport and confirm the export button remains reachable and the full calendar capture is not clipped.

## Expected outcomes

- Empty days visually merge with the calendar background without becoming indistinguishable from active days.
- One export artifact contains the full multi-year calendar.
- Palette and sport filter metadata match the visible selection.
- Tooltips are excluded from the captured result.
