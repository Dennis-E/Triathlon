# Training Data Import

## Overview

TriAnalytica supports Strava, TrainingPeaks and Apple Health exports through separate import options on the landing page. Each import path normalizes its supported activities into the same dashboard model while retaining provider-specific format and failure behavior.

## Public Sample History

Choose **Use exemplary data** to open the regular dashboard without selecting files.
The public `sample-data/silicon-valley-training.json` payload contains 1,600
synthetic activities and 923 geographic tracks across 2021-2025. Supported non-media
analyses use the normal filters, tooltips and image-preview/download flow;
the dashboard and images identify synthetic training. Source/license details and
offline regeneration commands are in [sample-data/README.md](../sample-data/README.md).

Sample loading fetches public app resources, not personal exports, and does not
increment the personal-analysis counter. Loading feedback, recoverable errors and
retry are available beside the button. A successful sample or personal import
replaces the entire previous history. Failed preparation preserves the last valid
dataset, and older operations cannot overwrite newer selections or their status.
Superseded media reads cannot restore old gallery content; separately acquired
export sources retain their own lifetime until the export completes.

## Apple Health

Select one original Apple Health ZIP from the landing page; do not extract or repackage it. The importer reads the primary Health export and does not import the duplicate clinical representation. Only explicitly recorded running, cycling and swimming workouts become activities. Walking, hiking, strength, sleep, body measurements, energy totals, ECG and other health records do not become workouts or medical-dashboard views.

Workout summaries supply distance, active duration and ascent when their units are supported. Heart rate, running steps, cadence and cycling power remain unavailable unless their source, timing, units and coverage support an unambiguous workout measurement. A short power series may support a shorter best-effort window without being treated as a full-workout average; average power alone does not create power personal bests. An export's hardware name is not equipment, and fallback workout labels are not treated as source titles.

Only explicitly referenced, valid routes are attached. Separate GPX route segments remain disconnected. Equipment, equipment timeline, title word cloud, heatmap, media gallery, optional metrics and other views appear only when their required imported data can produce meaningful output. Missing fields are not replaced with invented values.

Apple Health export steps are in [apple-health-export-how-to.html](apple-health-export-how-to.html). Serve the app over trusted HTTPS or secure local HTTP on localhost/loopback; opening a local file or using insecure remote HTTP produces a specific deployment hint. Required functions are checked in the actual worker context, including secure SHA-256, before the file is sent. Library-loading, missing-export, capability, worker, hash and archive errors have distinct safe codes. Retry is explicit; initial readiness has a 30-second limit, not the processing of large valid exports. Failures preserve the previous dashboard. Local HTTP imports have been verified in Chrome, Edge and the integrated VS Code browser; the complete HTTPS browser matrix remains pending. Raw health files are processed in the active browser session; the app still requests external libraries, public resources and its metadata-only analysis counter.

## Visualization availability

After each import, the dashboard shows only visualization tabs that can produce meaningful output from the imported activities and associated route or power data. Each provider uses current data-based rules; when a field is missing, only views and controls that require that field are hidden or unavailable. This changes dashboard visibility and selection only: imported files, activity records, and values are not modified or removed.

## Heart-rate minimum and maximum

The Heart rate tab appears only when the current history contains at least one dated Run, Bike, or Swim workout with a usable minimum or maximum in bpm. Daily, Weekly, Monthly and Yearly group by local training day, Monday-to-Sunday week, calendar month and calendar year. The period minimum is the smallest available training minimum; the maximum is the largest available training maximum. Each field is independent, without averages, zero-filled periods or connecting lines. A reversed direct pair is excluded without correcting the source values. Details retain all contributing trainings and tied extreme sources.

- Strava: supported explicit headers include `Min Heart Rate`, `Minimum Heart Rate`, `Minimale Herzfrequenz`, and `Max Heart Rate`, `Maximum Heart Rate`, `Maximale Herzfrequenz`, `Max. Herzfrequenz`. Empty duplicate cells do not invalidate usable values; conflicting or nonempty invalid candidates make only that field unavailable. Optional extrema survive both CSV reducers without shifting existing columns.
- TrainingPeaks: reliable `min_heart_rate`/`max_heart_rate` session summaries take priority. Only missing fields can use actual integer bpm observations from fully read, integrity-checked FIT records with unambiguous original session boundaries. Timer duration is not a replacement end boundary. Explicit invalid values, including uint8 sentinel 255, are not repaired. Unsupported structures, unknown read evidence, overlaps or ambiguous boundary records block fallback. Direct and recorded values are distinguished in details and local import notes; observed extrema are not a medical completeness guarantee. No minimum sample-coverage heuristic is used.
- Apple Health: only unambiguous HeartRate `WorkoutStatistics.minimum` / `.maximum` in `count/min` qualify. If statistics declare time boundaries, both must match the workout. Daily measurements, partial statistics, conflicting summaries and ordinary Records are not used to create extrema.

Existing workout fields, averages, identity/deduplication decisions and other visualization calculations remain unchanged. The existing sport/timeframe filters run before period aggregation. Bounded axes show the requested unclamped window using the existing history end anchor; All includes the whole matching history, including trainings without extrema. Filter-empty results keep the tab reachable and clear old chart/export data; replacing the history recomputes availability and removes unsupported views. Import notes distinguish average-only heart-rate data from usable extrema.

Export for Insta / Strava uses the established local PNG preview/download route in square, portrait and story formats. Each new request captures the rendered grouping, period count/labels, sport and requested date range; it never rereads live filters for that snapshot. Published previews retain their requested snapshot through format changes and download; an empty selection or replacement import closes them. Unfinished stale captures are discarded. Imported heart-rate values, safe diagnostics and exported images are not uploaded by this feature; this does not imply the entire app makes no network requests.

## Strava

Select a Strava export ZIP. The importer reads its `activities.csv`, retains the supported activity fields, and enriches activities with available FIT/GPX GPS tracks and bike power best efforts.

### Strava media gallery

When the selected Strava ZIP contains readable JPG photos or MP4 videos, the dashboard also offers a Media tab. The media manifest and activity references are checked against archive filenames; only a complete, unique match is linked. Missing or ambiguous references are left unassigned and reported, and media failures do not block the training import. The gallery is available for the current page session only, so switching tabs does not require choosing the ZIP again, but closing or reloading the page may require a new import. Videos start only after the user selects them.

Filter media by year, sport, or activity, then create an annual recap or a collage from the visible or selected items. These views use the existing local preview/download flow. Routes are excluded unless explicitly selected, and exports are rasterized locally so embedded location metadata from original photos is not retained. Media files and captions are not uploaded or saved to browser storage by this feature.

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

Selected ZIP contents are read and processed in the active browser session; workout files, activity fields, routes, and derived power data are not uploaded or persisted by TriAnalytica. The existing analysis-counter request contains no workout payload. This describes workout-file handling only: the app still makes network requests for third-party browser libraries, public sample data and its aggregate analysis counter.
