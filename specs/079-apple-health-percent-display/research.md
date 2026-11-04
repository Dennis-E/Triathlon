# Research: Apple Health Progress Percentage Display

## Decision 1: Keep rounding at the display boundary

**Decision**: Convert the Apple Health progress value to a whole-number percentage only when producing its visible percentage label. Keep the original bounded numeric value for the progress indicator and all progress decisions.

**Rationale**: The current progress owner uses the numeric value both for the indicator and for the label. Separating the label representation satisfies the display requirement without changing the underlying progress state.

**Alternatives considered**:
- Round the shared progress value before rendering: rejected because it would change the progress indicator and the underlying value, contrary to FR-003.
- Leave decimal precision in the visible label: rejected because it does not meet the feature requirement.

## Decision 2: Scope the new presentation to Apple Health

**Decision**: Apply the whole-percent label presentation only to the Apple Health progress path. Preserve the current presentation for Strava and TrainingPeaks.

**Rationale**: The progress renderer is shared, but the Apple Health caller is identifiable. Source-specific handling keeps the requested scope narrow and avoids an unintended UI change for other import types.

**Alternatives considered**:
- Round every import source in the shared renderer: rejected because FR-004 explicitly requires other sources to remain unchanged.
- Introduce a new progress subsystem: rejected as unnecessary for one source-specific display rule.

## Decision 3: Extend the existing dashboard import tests

**Decision**: Add behavior assertions to `__tests__/dashboard-import.test.js`, which already exercises the progress renderer and retains stage-only progress behavior.

**Rationale**: This test file owns the nearest existing coverage. It can verify the displayed label, unchanged precise indicator value, and non-Apple Health regression without adding a test framework or browser dependency.

**Alternatives considered**:
- Add a separate test file or browser test framework: rejected because the existing VM-based Jest harness already covers the relevant UI orchestration boundary.

## Resolved Context

- The Apple Health progress value may be fractional because import progress is derived from partial work ratios.
- The existing dashboard import progress renderer is shared by import sources, so the source-specific presentation must be explicit.
- No new dependency, data storage, public API, or unresolved technical question is introduced.