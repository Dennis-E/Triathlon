# Implementation Plan: Realistic Sample Training Data

**Branch**: `main` | **Date**: 2026-11-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/078-sample-data-realism/spec.md`, based on GitHub issue #1.


## Summary

Improve the fictional 2021-2025 sample history so its training load includes meaningful seasonal recovery and an extended break, and so equipment timelines distinguish correctly categorized shoes and bicycles with occasional item use. Preserve the static JSON delivery, existing activity shape, dashboard summaries, and personal-import behavior. Generate deterministic sample content from the existing route catalog and validate it with the existing sample-data contract and focused Jest tests.

## Technical Context

<!--
  Runtime and validation details for the selected project surfaces.
-->

**Language/Version**: JavaScript, Node.js runtime for generation and Jest; browser-compatible reusable utility

**Primary Dependencies**: Existing Node.js built-ins and repository utilities; no new package dependencies

**Storage**: Version-controlled static JSON under `sample-data/`

**Testing**: Jest in the root project; deterministic generator `--check`

**Target Platform**: Static browser app plus Node.js-based sample-data generation and validation

**Project Type**: Static web application with data-generation script

**Performance Goals**: Keep generated payload below the existing 4 MiB limit and retain the current dashboard's normal sample-load behavior

**Constraints**: Preserve the 2021-2025 history, all three supported sports, route consistency, existing public utility APIs, and fictional-data privacy boundary

**Scale/Scope**: One bundled sample dataset; no new visualization, import format, API, or personal-data workflow

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery**: PASS. The feature remains a bundled static JSON resource and does not add a build step, service, or runtime dependency.
- **II. Dual-Target Reusable Modules**: PASS. Equipment classification remains in the existing CommonJS/browser-global utility; sample generation remains a Node.js script.
- **III. Narrowest-Scope Test-First Verification**: PASS. No tab or dashboard behavior changes are required. Validate the sample payload and equipment classifier with the two focused Jest suites and run the deterministic generator check.
- **IV. Faithful Locale-Aware Data Parsing**: PASS. The feature does not alter CSV or GPX parsing or sport normalization.
- **V. Explicit Privacy & Network Boundaries**: PASS. All new activity and equipment values remain fictional public sample data; personal exports and API behavior are untouched.
- **Repository/dependency boundaries**: PASS. No dependency or service boundary changes.

No gate violations or unresolved technical clarifications.
Post-design recheck: PASS. The research and design artifacts preserve the same boundaries and add no interface, dependency, service, or personal-data workflow.

## Project Structure

### Documentation (this feature)

```text
specs/078-sample-data-realism/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (repository root)
```text
scripts/generate-sample-data.js
src/equipment-utils.js
src/sample-data-utils.js
sample-data/
├── routes.json
├── silicon-valley-training.json
└── README.md
__tests__/
├── equipment-utils.test.js
└── sample-data-utils.test.js
```

**Structure Decision**: Keep generation in the existing offline Node.js script, category inference in the reusable equipment utility, and the published history in the existing static `sample-data/` folder. Extend the existing data-contract tests rather than introducing a new testing surface. No external interface is added, so no `contracts/` artifact is needed.

## Complexity Tracking

No constitution violations; no complexity justification required.
