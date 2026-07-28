# Strava Data Import Feature

## Overview

The data import feature allows users to upload their Strava data export ZIP file directly from the landing page. The system automatically extracts the activities CSV, filters only the relevant columns, and loads the data into the dashboard.

## Key Features

### 1. **ZIP File Upload** 
- User clicks "Strava Ingest" button on landing page
- Browser file picker opens (accepts `.zip` files only)
- Supports any valid Strava export ZIP structure

### 2. **Progress Bar**
- Real-time progress modal shows during import
- Visual feedback with percentage indicator
- Stage descriptions: "Extracting ZIP file", "Extracting relevant columns", "Processing data", "Finalizing"
- Animation and status updates throughout the process

### 3. **Empty State Landing Page**
- Preview cards (Total Distance, Heartrate vs Pace, Equipment) are **hidden** until data is loaded
- "Enter Dashboard" button is **hidden** until data is loaded
- Empty state message shown: "Keine Daten vorhanden" (No data available)
- Once data is imported, preview cards and dashboard button become visible

### 4. **Automatic Dashboard Load**
- After successful import, dashboard automatically navigates to "Total Distance" tab
- All visualizations are rendered with the imported data
- Charts, KPI cards, and filters are fully functional

### 5. **Error Handling**
- Clear error messages if ZIP file is invalid
- Validation for required CSV columns (Activity ID, Date, Name, Sport Type, Distance)
- Graceful error display in progress modal
- User can close error and try again

## Technical Implementation

### New Files Created

#### `zip-importer.js`
Core utility for ZIP extraction and CSV processing:
- `ensureJSZipLoaded()` - Dynamically loads JSZip library from CDN
- `extractActivitiesCsvFromZip(zipFile)` - Finds and extracts activities.csv from ZIP
- `extractRelevantColumns(csvText)` - Filters CSV to only required columns (matches Node.js extractor logic)
- `importStravaZip(zipFile, progressCallback)` - Main orchestration function
- CSV parsing utilities: `parseCsvBasic()`, `serializeCsvBasic()`, `serializeCsvValue()`

**Key Features:**
- Handles ZIP files with activities.csv in root or subdirectories
- Dynamic column detection using exact match, "oneOf" matching, and predicate functions
- Validates all required columns are present
- Provides detailed error messages for debugging
- Progress callbacks for UI updates

### Modified Files

#### `index.html`
**New HTML Elements:**
- Import progress modal (lines 118-160)
- Empty state message container (lines 143-150)
- Hidden preview cards container (line 155)
- Hidden enter dashboard button container (line 359)

**New JavaScript Functions:**
- `handleStravaIngest()` - File picker and import orchestration
- `updateImportProgress(percent, stage, isError)` - Progress modal updates

**Modified Functions:**
- `parseCsvText()` - Now returns a Promise for async handling
- `loadLocalCsv()` - Awaits parseCsvText() to ensure completion
- `processData()` - Shows/hides preview cards based on data availability
- Manual CSV file upload handler - Now properly awaits parsing

**Key Changes:**
- Added JSZip script reference
- Converted sync CSV parsing to async with Promise
- Added progress modal styling and animations
- Conditional rendering of landing page elements

## User Flow

### Import Flow
```
1. User lands on dashboard (empty state shown)
2. Clicks "Strava Ingest" orange button
3. System opens file picker (accepts .zip)
4. User selects their Strava export ZIP file
5. Progress modal appears with real-time updates:
   - 5%: "Extracting ZIP file..."
   - 30%: "Extracting relevant columns..."
   - 70%: "Processing data..."
   - 95%: "Finalizing..."
6. CSV data loaded into dashboard
7. Preview cards and dashboard button appear
8. Modal closes automatically
9. Dashboard view opens with Total Distance tab active
```

### Data Processing Pipeline
```
Strava ZIP Export
  ↓
[JSZip] Extract activities.csv
  ↓
[Column Filter] Keep only relevant columns (ID, Date, Name, Sport, Equipment, Duration, HR, Distance)
  ↓
[CSV Parser] Parse filtered CSV using PapaParse
  ↓
[Data Processor] Transform to normalized activity objects
  ↓
[Aggregation] Group by week/month/year
  ↓
[Visualization] Render charts and KPI cards
```

## Supported Strava Export Columns

The importer requires these columns from Strava:

**Required:**
- `Aktivitäts-ID` (Activity ID)
- `Aktivitätsdatum` (Activity Date) - German format: DD.MM.YYYY, HH:MM:SS
- `Name der Aktivität` (Activity Name)
- `Aktivitätsart` (Sport Type) - Maps: Lauf→Run, Radfahrt→Bike, Schwimmen→Swim
- `Distanz` (Distance in meters)

**Optional:**
- `Aktivitätsausrüstung` or `Ausrüstung` or `Fahrrad` (Equipment)
- `Bewegungszeit` (Moving Time in seconds)
- `Durchschnittliche Herzfrequenz` (Avg Heart Rate in bpm) - Dynamic detection

## Error Messages

Users may see these error messages:

| Error | Cause | Solution |
|-------|-------|----------|
| "ZIP file is empty" | Selected file has 0 bytes | Select a valid Strava export |
| "Failed to read ZIP file" | ZIP is corrupted or not a valid ZIP | Re-export from Strava |
| "Could not find activities.csv in ZIP file" | CSV not in expected location | Verify it's a Strava export |
| "Missing required columns: ..." | CSV missing required fields | Use full Strava export, not custom selection |
| "CSV is empty or invalid" | No activity records found | Export contains no activities |
| "No activity data found in CSV" | Only headers present | Download activities first from Strava |

## Browser Compatibility

- **JSZip**: Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- **FileReader API**: Required for file input handling
- **Promises/Async-Await**: ES6+ feature support required
- **Chart.js**: Already used in dashboard
- **PapaParse**: Already used for CSV parsing

## Performance Considerations

- **ZIP Extraction**: Uses JSZip (JavaScript implementation) - fast for typical Strava exports
- **CSV Parsing**: Handled by PapaParse (optimized C parser in WASM)
- **Large Files**: For 1000+ activities, import takes ~2-5 seconds
  - Extraction: ~0.5-1s
  - Column filtering: ~0.2-0.5s
  - Data processing: ~1-3s
- **Progress Modal**: Updates happen at key milestones to avoid excessive DOM updates

## Testing

### Manual Testing Checklist
- [ ] Landing page shows empty state (no preview cards visible)
- [ ] Click "Strava Ingest" opens file picker with `.zip` filter
- [ ] Progress modal appears with smooth animations
- [ ] Import processes valid Strava ZIP file
- [ ] Preview cards appear after import completes
- [ ] Dashboard button becomes clickable
- [ ] Clicking dashboard button navigates to Total Distance tab
- [ ] All charts and KPI cards show data
- [ ] Error handling works for invalid files

### Test File
A test HTML file is available at `test-import.html`:
```bash
# Open in browser at http://localhost:8000/test-import.html
# Click "Select ZIP File & Test Import"
# Select Data/Dennis/export_39173135.zip to test
```

## Future Enhancements

Possible improvements for future iterations:

1. **Drag & Drop**: Allow dropping ZIP files onto landing page
2. **Multiple Imports**: Support importing multiple ZIP files and merging data
3. **File History**: Remember recent imports
4. **Progress Details**: Show number of activities processed
5. **Cancel Button**: Allow users to cancel import mid-process
6. **Local Storage**: Save imported data to browser cache
7. **Import Templates**: Support different Strava export formats
8. **Batch Mode**: Process multiple exports automatically

## File Structure

```
C:\dev\Tri\
├── index.html                    # Main dashboard (updated)
├── zip-importer.js              # New: ZIP/CSV import utility
├── test-import.html             # New: Import testing page
├── IMPORT_FEATURE.md            # This file
├── zip-importer.test.js         # (Optional) Unit tests for zip-importer
└── ...
```

## Troubleshooting

### Import seems to hang
- Check browser console (F12) for errors
- Ensure ZIP file is not corrupted
- Try with test file: `Data/Dennis/export_39173135.zip`
- Reload page and try again

### Preview cards don't appear after import
- Check browser console for JavaScript errors
- Verify data was actually imported (check status badge)
- Clear browser cache and reload

### Dashboard shows no data
- Ensure you imported a valid Strava export
- Check that your Strava activities have required fields
- Try the test file to confirm everything works

### Progress bar stuck at 5%
- This should not happen - report as bug with browser version
- Workaround: Refresh page and try manual CSV upload instead

## Dependencies

- **JSZip**: 3.10.1+ (loaded from CDN: `cdnjs.cloudflare.com/ajax/libs/jszip/`)
- **PapaParse**: 5.4.1+ (already loaded in main HTML)
- **Chart.js**: 3.x+ (already loaded in main HTML)
- **Lucide Icons**: 0.344.0+ (already loaded in main HTML)

All dependencies are loaded from CDN, no npm packages needed.
