# Implementation Plan: Concise TrainingPeaks Import Status

**Branch**: `TriAnalytica-dev-2` | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/064-concise-trainingpeaks-status/spec.md`

## Summary

Show exactly `Imported TrainingPeaks history` in the top-right status after a successful TrainingPeaks import. Keep every status update in the import flow consistent so archive, activity, skipped-workout, and unmatched-route details never appear in the success badge. Preserve progress and failure feedback and the Strava status wording. This is a focused change to existing browser-side dashboard orchestration, validated by the existing Jest import suite.

## Technical Context

**Language/Version**: JavaScript in classic browser scripts; Node.js for tests

**Primary Dependencies**: Existing browser import libraries; no new dependencies

**Storage**: No feature-specific storage; status is transient UI text

**Testing**: Jest 30 in the Node environment; focused suite `__tests__/dashboard-import.test.js`

**Target Platform**: Static browser app served without a build step

**Project Type**: Static web application

**Performance Goals**: No additional processing; show the concise status as part of the existing import completion flow

**Constraints**: Preserve TrainingPeaks processing, progress and failure feedback, and Strava status wording. Do not add a bundler, dependency, or persisted field.

**Scale/Scope**: One top-right success status for TrainingPeaks imports and its focused tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Pre-design gate**

- Principle I, Static Browser-First Delivery: PASS. The change stays in existing classic browser scripts and requires no build step.
- Principle II, Dual-Target Reusable Modules: PASS. No reusable data-processing utility is introduced or changed.
- Principle III, Narrowest-Scope Test-First Verification: PASS. Update the existing focused import tests and run the narrow Jest suite.
- Principle IV, Faithful Locale-Aware Data Parsing: PASS. Import parsing and activity classification are unchanged.
- Principle V, Explicit Privacy & Network Boundaries: PASS. No personal data flow, network behavior, or privacy claims change.

No constitution violations or exceptions are required.

## Project Structure

### Documentation (this feature)

```text
specs/064-concise-trainingpeaks-status/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
```text
src/dashboard-import.js                 # Existing import and status orchestration
__tests__/dashboard-import.test.js      # Focused Jest coverage
specs/064-concise-trainingpeaks-status/  # Feature design artifacts
```

**Structure Decision**: Keep the change in the existing DOM-orchestration module and its adjacent Jest suite. No tab, reusable utility, API, or shared data model is added.

## Constitution Check (Post-Design)

- Principle I: PASS. Design retains the static browser app and requires no build step.
- Principle II: PASS. The status remains in DOM orchestration; no reusable module boundary is affected.
- Principle III: PASS. The plan requires focused Jest verification for the changed import flow.
- Principle IV: PASS. Parsing and sport normalization are unchanged.
- Principle V: PASS. No personal-data transmission, network, or privacy behavior is introduced.

No violations or exceptions were introduced by the design.

## Complexity Tracking

No constitution violations were found, so no complexity exceptions need tracking.
