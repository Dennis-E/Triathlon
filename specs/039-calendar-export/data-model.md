# Data Model: Training Calendar Transparency and Export

## Transparent Rest Day

- `emptyCellColor`: fixed `rgba(241,245,249,0.5)` token with 50% alpha over the calendar background.
- `isActive`: false.
- `paletteIndependent`: true.

Active cells remain opaque and use the selected Green, Blue, or Fire level.

## CalendarExportTarget

A local image-export target derived from the visible calendar state:

| Field | Type | Rule |
|---|---|---|
| `kind` | `tab` | Uses the existing tab export contract. |
| `key` | `trainingCalendar` | Stable target key for title, filename, and capture lookup. |
| `targetElementId` | string | Points to the complete multi-year calendar container, not one year or viewport. |
| `title` | string | Human-readable Training Calendar title. |
| `filters` | list | Includes active sport filter and palette. |
| `availableControls` | grouped controls | Includes view, palette, sport, and available year context where applicable. |
| `hasData` | boolean | False when no imported activities qualify for display. |
| `tooltipVisibleDuringCapture` | boolean | Must be false in the captured image. |

## ExportStatus

- `idle`: no active export.
- `checking`: target and data are being validated.
- `blocked-no-data`: export is prevented because no calendar data exists.
- `capturing`: image capture is in progress.
- `previewing`: image is ready in the existing preview flow.
- `capture-failed`: error shown while the calendar remains unchanged.
