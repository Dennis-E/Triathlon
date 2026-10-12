# TrainingPeaks Import Contract

**Feature**: [TrainingPeaks Data Import](../spec.md)

This is a user-interface and in-memory import contract. The feature adds no server API and exposes no file-upload endpoint.

## Source selection

- The landing page presents separate, clearly named choices for Strava and TrainingPeaks.
- Choosing Strava preserves the existing single Strava-export workflow.
- Choosing TrainingPeaks opens a ZIP file picker that allows selecting one or more `.zip` archives in one operation.
- Cancelling the picker leaves the current imported dataset unchanged.

## TrainingPeaks archive acceptance

- An accepted archive contains at least one readable gzip-compressed FIT workout entry; optional `.GPX.gz` route entries may accompany workouts. The supplied samples contain no CSV.
- `.fit` entries may also be accepted when technically supported, but unsupported/malformed entries must not be silently treated as successful activities.
- Timestamped GPX trackpoints may be associated with one FIT session only when their time range identifies that session unambiguously; if association is ambiguous, omit the route. Prefer FIT-record route points when available for the same activity.
- A selected operation succeeds only if all selected archives and every contained FIT/GZIP workout entry are readable and processable. Any invalid archive or unreadable FIT/GZIP entry rejects the entire operation; the error identifies the archive and, when relevant, the entry, and leaves any previously active dataset unchanged.
- A readable FIT session with an unsupported sport is not a parse failure: do not map it to Run/Bike/Swim; skip it and include it in the visible skipped-activity count.
- Duplicate sessions across overlapping exports are counted once; legitimate separate sessions, including same-day workouts, remain distinct.

## Processing and result

- Archives and contained FIT files are processed locally, sequentially, with visible aggregate progress.
- Progress identifies the current archive and processed/total file counts without exposing workout metrics in diagnostic copy.
- On success, the status summary identifies TrainingPeaks, the number of imported ZIP archives, total activities, and any skipped-workout/unmatched-route counts. Selected archive names may be kept in memory for this active-session summary only; they are not persisted or transmitted.
- A successful operation creates one chronological in-memory dataset through the existing dashboard state/application flow.
- Each supported FIT session becomes an activity associated with its own sport. Missing values remain unavailable, and only supported activity metrics are passed to the visualizations.
- GPS and bike-power enrichments are associated with the corresponding activity/session when present.
- The previous dataset is replaced only after the full operation succeeds.

## Failures and privacy

- Empty selection, invalid ZIP, no recognizable FIT files, corrupt gzip/FIT content, and invalid essential session metadata produce actionable user-facing errors. A corrupt FIT/GZIP entry fails the complete multi-ZIP operation and names both archive and entry; unsupported sports are skipped and summarized separately.
- Raw archive bytes and workout contents are never sent to a server or stored beyond normal in-memory processing.
- Normalized activity/session fields, route points, and derived power data are never written to browser-persistent storage or an application database.
- The existing analysis counter may be incremented once after a successful import. Its request must use only the existing event metadata headers, contain no body, and include no workout/activity fields; failed or cancelled imports must not trigger the counter.
- The existing Firestore counter stores only the aggregate analysis count and event timestamp metadata. No TrainingPeaks data model, collection, or schema is added.
- Landing-page privacy copy may describe local file processing, but must not promise that the entire app makes no network requests.

## Export help

- TrainingPeaks help is distinct from Strava's export instructions.
- It explains that each export covers at most 12 months and that all required period ZIPs can be selected together.
- Exact provider screen/menu labels are verified against the live TrainingPeaks export flow before release.
