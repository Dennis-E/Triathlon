# Implementation Plan: Fix Power PB Enlarge Button

**Branch**: `029-fix-pb-enlarge-button` | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/029-fix-pb-enlarge-button/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Restore the visible enlarge icon on Bike power Personal Best duration tiles and keep
the existing full-screen detail action unchanged. The implementation will align the
power-tile control with the shared PB detail-button convention already used by the
other Personal Best tiles, then verify icon visibility, responsive layout, and the
existing detail-view behavior.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: JavaScript (browser ES-compatible scripts; Node.js for Jest)

**Primary Dependencies**: Existing CDN-loaded Lucide icon library and Tailwind utility classes

**Storage**: N/A; the control is presentation-only

**Testing**: Jest syntax/regression tests plus manual browser verification with a local static server

**Target Platform**: Modern desktop and narrow-viewport browsers served from a static file server

**Project Type**: Static browser web application

**Performance Goals**: No measurable runtime cost beyond the existing icon rendering; PB tiles remain responsive during display and interaction

**Constraints**: No bundler or build step; preserve the existing shared detail-button API, accessibility label, click behavior, PB calculations, and local-data boundaries

**Scale/Scope**: One shared PB detail-control path and its Bike power duration-tile usage; no new screens, data entities, or network interfaces

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery**: PASS. The change remains in the existing static browser scripts and uses already loaded browser assets.
- **II. Dual-Target Reusable Modules**: PASS. The affected file is DOM orchestration owned by `index.html`; no reusable data-processing module is introduced.
- **III. Narrowest-Scope Test-First Verification**: PASS. The plan includes the focused `index-script-syntax` Jest test and manual browser checks for the rendered control and detail action.
- **IV. Faithful Locale-Aware Data Parsing**: PASS / NOT APPLICABLE. No parsing or sport classification behavior changes.
- **V. Explicit Privacy & Network Boundaries**: PASS. No raw data flow, API call, or network boundary changes.
- **Gate result**: PASS. No constitution violation requires complexity tracking.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
└── dashboard-power-pb.js       # shared PB tile/detail-control orchestration

__tests__/
└── index-script-syntax.test.js # existing script and control wiring assertions

specs/029-fix-pb-enlarge-button/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   └── ui.md
└── quickstart.md
```

**Structure Decision**: Keep the existing static-app structure. The shared power PB
button path remains in `src/dashboard-power-pb.js`, the focused regression coverage
stays with the existing root Jest suite, and this feature's planning artifacts remain
under its numbered `specs/` directory. No new application directory or dependency is
needed.

### Post-Design Constitution Check

- **I. Static Browser-First Delivery**: PASS. Research and design retain the static script and CDN-based delivery model.
- **II. Dual-Target Reusable Modules**: PASS. No reusable module or public module API is added or changed.
- **III. Narrowest-Scope Test-First Verification**: PASS. The quickstart starts with the focused Jest check and requires browser verification for the visual behavior before the full regression suite.
- **IV. Faithful Locale-Aware Data Parsing**: PASS / NOT APPLICABLE. The design has no parsing, normalization, or data-selection changes.
- **V. Explicit Privacy & Network Boundaries**: PASS. The quickstart explicitly keeps personal exports local and the design introduces no network behavior.
- **Post-design gate result**: PASS. No violations or unresolved clarifications remain.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. No complexity justification required.
