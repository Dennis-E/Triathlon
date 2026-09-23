# UI Contract: Import Screen

## Active Import

The import modal must expose these user-visible regions in order:

1. One main headline describing the overall import.
2. A progress percentage and progress bar.
3. A black detail status box containing the current detailed stage/activity.
4. A prepared preview of an existing TriAnalytica visualization with a short rotating message.

The detailed stage/activity must not be rendered as a second headline. The preview and message are supporting content and must not replace or overwrite the factual detail status.

## Preview Rotation

- Rotation starts when the import modal enters its active state.
- Rotation may advance through at least two prepared previews during imports long enough to observe a change.
- Rotation stops on completion and on error.
- A short import still shows one valid preview without delaying completion.
- The preview region must remain readable at desktop and mobile widths without overlapping the progress or detail regions.

## Completion and Error

- Completion keeps the final progress state visible until the existing short close delay finishes.
- Error keeps the black detail box available for the error message and shows the existing error action.
- Neither state may be obscured by preview rotation or a rotating message.

## GPS Track Display Contract

- `gpsTracksByActivityId` contains at most one entry per imported activity ID.
- An entry exists only when that activity has GPS points.
- Multisport child activities receive only points in their own FIT session time range.
- A source FIT file is not counted as one track and is not copied in full to every child activity.
