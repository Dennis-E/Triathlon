# Quickstart: Training Calendar Contrast and Tooltips

## Prerequisites

- Node.js and npm installed.
- Local synthetic or supplied activity data containing several years and a day with multiple activities.

## Automated validation

```powershell
npm test -- training-calendar-utils index-script-syntax tab-navigation --runInBand
```

Expected result: palette contrast, tooltip activity summaries, keyboard/focus behavior, multi-year isolation, and removal of the global detail area pass with the existing calendar tests.

## Manual validation

1. Serve the repository:

   ```powershell
   python -m http.server
   ```

2. Import data spanning at least three years, including multiple activities on one day and activities with missing duration or distance.
3. Open **Training Calendar** and select Green. Confirm all five active levels are visible, level 1 is clearly distinct from an empty day, and empty cells are very light gray (`#F1F5F9`) rather than pure white.
4. Select Blue and repeat the contrast check.
5. Hover an active day in the newest year. Confirm a tooltip appears beside the day field and lists only that day's date, activity names, sports, and available metrics.
6. Hover an active day in an older year. Confirm the tooltip moves to that field and does not show activities from another year.
7. Hover a day with multiple activities. Confirm each activity appears as a separate row.
8. Focus a day with the keyboard. Confirm the same details are available without mouseover.
9. Leave the day field. Confirm the local tooltip closes and no lower global detail area changes.
10. Resize to a narrow viewport and test a day near the panel edge. Confirm the tooltip remains readable, bounded, and scrollable when needed.

## Expected outcomes

- Green and Blue level 1 are clearly visible.
- Empty cells use `#F1F5F9` consistently across all palettes and are never pure white.
- Tooltip response is immediate and remains tied to the active day.
- Missing values are omitted rather than rendered as zero.
- No `trainingCalendarDetails` global area is present or updated.
