# Implementation Plan: Apple Health Progress Percentage Display

**Branch**: `079-apple-health-percent-display` | **Date**: 2026-11-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/079-apple-health-percent-display/spec.md`.

## Summary

Show Apple Health import progress labels as rounded whole percentages followed by `%`, while preserving the original numeric progress for calculations and the progress indicator. Keep the existing presentation for Strava and TrainingPeaks imports. The behavior belongs at the existing dashboard import presentation boundary; no new dependencies, storage, tabs, or data model are needed.

## Technical Context

**Language/Version**: Existing browser-compatible JavaScript in classic scripts; CommonJS project configuration for Node-based tests.

**Primary Dependencies**: No new dependencies. Reuse the existing import orchestration and Jest test setup.

**Storage**: N/A. Progress is transient UI state and is not persisted.

**Testing**: Jest in the Node environment. Extend the existing focused `__tests__/dashboard-import.test.js` coverage.

**Target Platform**: Static browser app served over HTTP(S), with the existing supported browser runtime.

**Project Type**: Static browser application with a root Jest suite; no bundler or build step.

**Performance Goals**: No measurable processing overhead; formatting must not affect import progress calculations or the progress indicator.

**Constraints**: Only the Apple Health progress percentage label changes. Preserve its numeric progress value, existing bounds, stage-only update behavior, and all non-Apple Health progress presentation. No import, analytics, privacy, navigation, or visualization behavior changes.

**Scale/Scope**: One display label and focused regression coverage in the existing import dashboard owner and test file.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / gate | Design evidence | Result |
| --- | --- | --- |
| I: Static browser-first delivery | Reuse the existing classic browser script; no build tooling or runtime dependency added | PASS |
| II: Dual-target reusable modules | No reusable business logic or utility module is introduced or changed | PASS |
| III: Narrowest-scope test-first verification | Add focused fractional-value and unchanged-underlying-progress assertions in the existing dashboard import test; retain other-source regression coverage | PASS |
| III: Tab and Share/Export contracts | No tabs, visualizations, navigation, or export behavior change | PASS |
| IV: Faithful locale-aware parsing | No CSV, GPX, or activity parsing changes | PASS |
| V: Explicit privacy and network boundaries | No raw data, network, API, or analytics behavior changes | PASS |
| Dependency/runtime boundaries | Changes remain within the root browser app and root Jest suite | PASS |
| Scope and complexity | One source-specific presentation adjustment; no constitution exception or additional abstraction required | PASS |

No constitution violations or unresolved design questions were found.

## Project Structure

### Documentation (this feature)

```text
specs/079-apple-health-percent-display/
  spec.md
  plan.md
  research.md
  data-model.md
  contracts/
    ui-contract.md
  quickstart.md
  checklists/
    requirements.md
```

`tasks.md` is produced by the later `/speckit-tasks` phase and is not part of this plan.

### Source Code (repository root)

```text
src/
  dashboard-import.js
__tests__/
  dashboard-import.test.js
```

**Structure Decision**: Keep the behavior in the existing dashboard import orchestration, where the Apple Health progress callback reaches the shared progress display. Extend the adjacent dashboard import tests. No other source, markup, reusable utility, or API surface is needed for the planned behavior.

## Phase 0: Research Decisions

[research.md](research.md) records the current display boundary, source-specific scope decision, numeric-value preservation, and test ownership. Repository inspection resolved the only design choice; there are no external technology choices or unresolved clarifications.

## Phase 1: Design And Contracts

- [data-model.md](data-model.md) describes the transient progress value and its separate display representation; no persisted entity changes are introduced.
- [contracts/ui-contract.md](contracts/ui-contract.md) specifies the observable Apple Health label behavior and source regressions.
- [quickstart.md](quickstart.md) provides the focused Jest validation and expected outcomes.

The design changes only how the Apple Health progress label is presented. It does not change calculation inputs, progress bar values, stage messages, or any other import source.

## Post-Design Constitution Check

| Principle / gate | Design evidence | Result |
| --- | --- | --- |
| I: Static browser-first delivery | Uses existing browser code and test setup; no build step or dependency | PASS |
| II: Dual-target reusable modules | No reusable module is changed | PASS |
| III: Narrowest-scope verification | Focused test covers fractional and boundary display, exact progress preservation, stage-only updates, and other import sources | PASS |
| III: Tab and Share/Export contracts | No tab, visualization, or export changes | PASS |
| IV: Faithful locale-aware parsing | Parsing remains untouched | PASS |
| V: Privacy and network boundaries | No change to data handling or network behavior | PASS |
| Dependency/runtime boundaries | Root app and root Jest suite only | PASS |

No exceptions or complexity tracking entries are required.
