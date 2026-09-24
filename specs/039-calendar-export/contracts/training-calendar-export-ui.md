# UI Contract: Training Calendar Export

## Export control

- Reuse the existing `trainingCalendar` panel.
- Add one header export button with `onclick="exportVisualizationTab('trainingCalendar')"`.
- The button uses the existing branded export labels/icons and remains reachable on narrow screens.
- If there is no data, the button is disabled or the existing export flow displays a clear no-data message.

## Capture target

- The capture target is `trainingCalendarYears`, containing every visible YearBlock in newest-to-oldest order.
- The target must expand to include all year blocks and must not be clipped to viewport height.
- Empty years remain in the target.
- Tooltip layers, hover overlays, and transient focus details are excluded from the capture.

## Export context

- Export metadata includes the selected palette (`Green`, `Blue`, or `Fire`) and active sport filter.
- The existing export flow MUST open the image preview first; the preview MUST provide the existing download action with the export title, filename, branding, error, and close behavior.
- A successful export does not alter the selected palette, sport filter, year blocks, or tooltip state after restoration.

## Transparency

- Empty cells use `rgba(241,245,249,0.5)` in the normal view and export image.
- Active cells remain opaque and retain their selected palette colors.
