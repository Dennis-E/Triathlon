# Training Data Import

## Overview

TriAnalytica supports Strava and TrainingPeaks exports through separate import options on the landing page. Both import paths normalize supported activities into the same dashboard model.

## Visualization availability

After each import, the dashboard shows only visualization tabs that can produce meaningful output from the imported activities and associated route or power data. Strava and TrainingPeaks imports use the same data-based rules; when a field is missing, only views that require that field are hidden. This changes dashboard visibility and selection only: imported files, activity records, and values are not modified or removed.

## Strava

Select a Strava export ZIP. The importer reads its `activities.csv`, retains the supported activity fields, and enriches activities with available FIT/GPX GPS tracks and bike power best efforts.

## TrainingPeaks

Select one or more TrainingPeaks Workout Files ZIP archives in a single import. Each export covers 12 months or less, so select all period archives needed for the training history. The supplied export format contains compressed FIT workout files and may include compressed GPX route files; FIT sessions provide normalized activity summaries, while GPX routes are associated only when their recorded time range unambiguously matches one session. FIT/GZIP parse failure rejects the whole multi-archive operation and leaves the active dashboard dataset unchanged. Unsupported sports are skipped and included in the import summary.

For provider-specific export steps, see [TrainingPeaks export instructions](trainingpeaks-export-how-to.html) and the [official TrainingPeaks Data Export article](https://help.trainingpeaks.com/hc/en-us/articles/204985370-Data-Export).

## Privacy and network behavior

Selected ZIP contents are read and processed in the active browser session; workout files, activity fields, routes, and derived power data are not uploaded or persisted by TriAnalytica. The existing analysis-counter request contains no workout payload. This describes workout-file handling only: the app still makes network requests for third-party browser libraries and its aggregate analysis counter.
