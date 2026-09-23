# Research: Calm Import Status

## Decision 1: Use a fixed five-second preview interval

- **Decision**: Keep each prepared preview and its accompanying message visible for 5 seconds before advancing.
- **Rationale**: Five seconds is the shortest interval explicitly requested and provides enough time to recognize a chart without making long imports feel static. A fixed timer is independent of progress callbacks, so frequent GPS extraction updates cannot accelerate or reset the rotation.
- **Alternatives considered**:
  - Ten seconds: calmer, but may make short imports show too little variety.
  - The existing 1.8-second interval: rejected because users cannot comfortably digest the preview.
  - Advance on each import callback: rejected because callback frequency is data-dependent and visually erratic.

## Decision 2: Add a dedicated factual status row above the progress bar

- **Decision**: Render the current import stage, including text such as `Extracting GPS tracks (3/8)...`, in a dedicated status row immediately before the progress bar.
- **Rationale**: The requested status is factual process information and must be visually distinct from the black detail box and promotional preview message. Keeping one DOM target for the stage lets existing progress callbacks update it without changing import semantics.
- **Alternatives considered**:
  - Put the stage in the main headline: rejected because the headline should remain stable.
  - Put the stage only in the black detail box: rejected because the user explicitly wants it above the progress bar.
  - Put the stage in the preview message: rejected because humorous copy must not replace factual progress.

## Decision 3: Preserve import lifecycle and data behavior

- **Decision**: Change only modal markup and `dashboard-import.js` preview/status presentation; do not alter ZIP/FIT parsing, GPS segmentation, counting, or dataset state.
- **Rationale**: The specification explicitly excludes data behavior. This minimizes regression risk and preserves the already validated feature 024 behavior.
- **Alternatives considered**:
  - Refactor importer callbacks or progress calculation: rejected because the request is presentation-only.
  - Add a new reusable module: rejected because the behavior is DOM orchestration owned by the existing dashboard import script.
