# Quickstart: Validate Export Download Location Selection

## Prerequisites

- Root dependencies installed.
- Run the app from `http://localhost` using the documented static server or from its secure
  HTTPS deployment; browser policy determines whether a save-location dialog is offered.
- Use synthetic activity data or a local personal export that is not committed to the repo.
- At least one exportable visualization is available to open an export preview.

## 1. Run focused automated validation

```powershell
npm test -- --runInBand __tests__/dashboard-export-download.test.js __tests__/export-utils.test.js __tests__/index-script-syntax.test.js
```

Expected: picker success, cancellation, picker-unavailable fallback, write failure/retry,
filename/MIME type, existing filename helpers, and script syntax checks pass.

## 2. Start the static app

```powershell
python -m http.server
```

Open `http://localhost:8000`, load or prepare exportable data, open a visualization's export
preview, and select **Download**.

## 3. Validate destination selection

1. In a browser/environment that supports save-location selection, choose a custom directory
   and filename.
2. Confirm the dialog.
3. Expected: one PNG appears in the chosen location; it opens and visually matches the preview.
4. Repeat Download and select a different directory to confirm each click asks for a fresh
   destination.

## 4. Validate cancellation and failures

1. Open the save dialog and cancel it.
2. Expected: no file is saved, no fallback download starts, the preview remains visible, and
   another attempt can be made.
3. Exercise a denied/unavailable picker environment or the focused automated fallback case.
4. Expected: the existing browser download occurs and the user is told that a location could
   not be selected.
5. Exercise a simulated write failure and retry.
6. Expected: a clear error appears, the preview remains available, and retry starts a new
   picker attempt.

## 5. Verify privacy and regression

- Confirm there is no application network request for the PNG or activity data during saving.
- Verify the saved image is PNG and unchanged from the preview.
- Run the broader root suite with `npm test -- --runInBand` if the focused checks pass.