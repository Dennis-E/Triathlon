# Implementation Plan: Import PNG Illustrations

**Branch**: `056-import-png-illustrations` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/056-import-png-illustrations/spec.md`

## Summary

Use the supplied PNGs 01–19 for import messages 02–20, remove the message without a PNG and all import SVG usage, and remove the separate “Still local” reminder. Clean each PNG of its ordinal, bottom caption sentence, and decorative progress track while retaining illustration details. If an image fails, show no image rather than a vector; keep the real status/progress UI unchanged. Personal messages use the PNG for their reused scene, applying the same one-number offset.

## Technical Context

**Language/Version**: JavaScript (existing browser runtime; Node.js for Jest tests)

**Primary Dependencies**: None added; static local PNG/SVG assets and existing browser image element

**Storage**: N/A; assets are static repository files, with no new persistent data

**Testing**: Jest in Node environment; focused suites `__tests__/import-experience.test.js`, `__tests__/dashboard-import.test.js`, and `__tests__/index-script-syntax.test.js`; manual responsive browser check

**Target Platform**: Static browser app served from a local/static HTTP server; desktop and mobile viewports

**Project Type**: Static frontend web application

**Performance Goals**: No material delay to import or message rotation; provided images are approximately 91–138 KB each and 307–384 × 256 pixels

**Constraints**: No bundler/build step, new package, external image request, or import-pipeline change; preserve local processing and existing UI accessibility/layout behavior

**Scale/Scope**: 19 cleaned PNGs paired with catalog messages 02–20, PNG-backed personal messages, no SVG-backed message, and unchanged finalization gating for message 20

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Result | Evidence |
|---|---|---|
| Static browser-first delivery | PASS | Reuses existing image element and local static assets; no build step or new dependency. |
| Dual-target reusable modules | PASS | No new reusable logic required; existing CommonJS/browser catalog interface remains intact. |
| Narrowest-scope test-first verification | PASS | Plan includes focused Jest coverage for catalog mapping, local assets, modal markup, and fallback behavior. |
| Faithful data parsing | PASS / N/A | No CSV, GPX, activity, or parsing behavior changes. |
| Explicit privacy/network boundaries | PASS | Images remain local; no imported data or personal statistics are transmitted. |
| Repository/dependency boundaries | PASS | Change is limited to the static frontend, its local assets, and root Jest tests. |

**Pre-design gate**: PASS. No constitution violations or unresolved product clarifications identified.

## Project Structure

### Documentation (this feature)

```text
specs/056-import-png-illustrations/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md             # Generated later by /speckit-tasks
```

### Source Code (repository root)
```text
src/
├── import-experience-catalog.js  # PNG-backed message metadata
└── dashboard-import.js           # existing modal PNG assignment/error handling
index.html                        # existing initial modal image source and responsive UI
assets/import-illustrations/
├── 01.png ... 19.png             # provided primary artwork
└── message-01.svg ... message-20.svg # legacy assets are not loaded by the import dialog
__tests__/
├── import-experience.test.js     # catalog and pair mapping checks
└── index-script-syntax.test.js   # local asset, markup, and display contract checks
```

**Structure Decision**: Keep the current single static frontend. Update the existing import message catalog and modal renderer; do not add modules, directories, external contracts, or dependencies. There is no separately exposed system interface for this presentation-only change, so a `contracts/` artifact is not applicable.

## Phase 0: Research

Research decisions and alternatives are recorded in [research.md](research.md). No unknowns remain: repository inspection confirms the image paths, renderer, tests, file dimensions, and static delivery constraints.

## Phase 1: Design

- [Data model](data-model.md): transient message/image pair and load-fallback behavior.
- [Quickstart validation](quickstart.md): focused tests, browser/responsive checks, and a local fallback scenario.
- External API or other-system contracts: not applicable; this is an internal UI presentation behavior with no new externally consumed interface.

**Post-design Constitution Check**: PASS. The design preserves static delivery, local assets, existing catalog semantics, and focused test coverage; there are no constitution violations.

## Complexity Tracking

No constitution violations; no complexity justification required.
