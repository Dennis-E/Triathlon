# Training Data Import

## Overview

TriAnalytica supports Strava and TrainingPeaks exports through separate import options on the landing page. Both import paths normalize supported activities into the same dashboard model.

## Visualization availability

After each import, the dashboard shows only visualization tabs that can produce meaningful output from the imported activities and associated route or power data. Strava and TrainingPeaks imports use the same data-based rules; when a field is missing, only views that require that field are hidden. This changes dashboard visibility and selection only: imported files, activity records, and values are not modified or removed.

## Strava

Select a Strava export ZIP. The importer reads its `activities.csv`, retains the supported activity fields, and enriches activities with available FIT/GPX GPS tracks and bike power best efforts.

### Swim GPS regression and recording ownership

Standalone FIT recordings use all of their recorded samples for GPS and bike power extraction. CSV summary start times and Moving Time do not trim a recording that belongs to only one activity. This preserves outdoor-swim routes when summary and recording times disagree, the athlete paused, or GPS samples lack timestamps. Existing coordinate validation and route simplification still apply; pool swims without GPS and single-point recordings do not acquire invented routes.

The regression came from applying shared-recording time segmentation to standalone files whenever summary times were present. The end of that window was derived from Moving Time, not necessarily the elapsed recording duration. A synthetic swim with a two-hour summary/recording mismatch lost its whole route; a shorter moving duration retained only one point, leaving nothing drawable on the heatmap. This demonstrates a concrete defect, not confirmation of any particular unexamined personal export.

Earlier combined/separate extraction tests omitted summary dates and durations, so they bypassed the failing branch. The multisport test used aligned timestamps and therefore did not detect standalone timing disagreement. Regression coverage now includes full English/German summary headers, time mismatch, pauses, missing/invalid point timestamps, compressed FIT, and real import-to-heatmap sport filtering. The tests were observed failing before correction and passing afterward.

For a FIT file shared by multiple Strava activities, all associations require distinct activity IDs and valid increasing start/end windows. Only samples matching exactly one window are retained. Missing/invalid boundaries cause that file's shared records to be omitted; overlaps, including a point on two inclusive endpoints, are not assigned to either activity. There is no whole-file fallback to the first sport. These windows still depend on available CSV metadata: they do not reconstruct missing FIT-session boundaries, and a shared route may remain incomplete if the summary boundaries are incomplete or inaccurate.

An unreadable individual Strava recording does not erase other valid recordings. TrainingPeaks retains its separate FIT-session segmentation and its existing complete-import rejection for corrupt FIT/GZIP input; this correction does not introduce partial TrainingPeaks imports.

For focused regression commands, actual red/green results and browser acceptance limitations, see the [feature validation guide](../specs/062-restore-swim-heatmap/quickstart.md).

## TrainingPeaks

Select one or more TrainingPeaks Workout Files ZIP archives in a single import. Each export covers 12 months or less, so select all period archives needed for the training history. The supplied export format contains compressed FIT workout files and may include compressed GPX route files; FIT sessions provide normalized activity summaries, while GPX routes are associated only when their recorded time range unambiguously matches one session. FIT/GZIP parse failure rejects the whole multi-archive operation and leaves the active dashboard dataset unchanged. Unsupported sports are skipped and included in the import summary.

For provider-specific export steps, see [TrainingPeaks export instructions](trainingpeaks-export-how-to.html) and the [official TrainingPeaks Data Export article](https://help.trainingpeaks.com/hc/en-us/articles/204985370-Data-Export).

## Privacy and network behavior

Selected ZIP contents are read and processed in the active browser session; workout files, activity fields, routes, and derived power data are not uploaded or persisted by TriAnalytica. The existing analysis-counter request contains no workout payload. This describes workout-file handling only: the app still makes network requests for third-party browser libraries and its aggregate analysis counter.
