# Implementation Plan: Count Every Upload Without Browser-Persisted History

**Branch**: `014-count-every-upload` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-count-every-upload/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Stop treating the public analysis counter as a once-per-browser flag and instead increment it for every successfully completed upload. `src/analysis-counter.js` currently persists a single, permanent `localStorage` record (`trianalytics:analysis-counter:recorded:v1`) that short-circuits all future `recordAnalysis()` calls in that browser after the first success. The fix removes that persisted "already recorded" state entirely: each successful upload generates its own fresh, in-memory-only event ID and posts it to the existing `POST /v1/analyses` endpoint, which already has its own request-scoped idempotency (Firestore `analysisEvents` doc keyed by event ID) and unchanged abuse protections (client key, origin allow-list, rate limiting). No client-side duplicate-submission protection is added (per clarification), and a failed counting request continues to fail silently (console warning only, no retry, no user-facing error).

## Technical Context

**Language/Version**: JavaScript (ES2019+, browser + Node.js 18+ for Jest)

**Primary Dependencies**: None new. Browser `fetch`/`crypto.randomUUID` (already used), existing `services/api` Express service (unchanged)

**Storage**: Browser `localStorage` (used only as an optional fallback pass-through in the module signature; this feature removes the current write of a permanent "recorded" flag). Server-side Firestore (`services/api`) is unchanged.

**Testing**: Jest (`node` test environment) via root `npm test` for `src/analysis-counter.js` and `__tests__/analysis-counter.test.js`; `services/api` tests are unaffected since the server contract does not change.

**Target Platform**: Static browser app (`index.html`, served via any static file server); no build step

**Project Type**: Single static frontend project + existing separate Express API service (per repository structure; API is out of scope for code changes here)

**Performance Goals**: N/A (single fire-and-forget POST per user-initiated upload; no new performance target)

**Constraints**: Must not persist any "analysis already recorded" state in the browser (spec FR-002); must not add client-side dedup/retry logic (spec FR-003, FR-007); must preserve the existing public API of `createAnalysisCounter()` (constitution II) and the server's existing origin/client-key/rate-limit/Firestore behavior unchanged (constitution V)

**Scale/Scope**: Single module change (`src/analysis-counter.js`) plus its unit tests; no `index.html` call-site changes required since `recordCompletedAnalysis()` already calls `recordAnalysis()` once per successful import

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery**: PASS. No build step introduced; change is confined to an existing plain-JS module loaded via `<script>` tag.
- **II. Dual-Target Reusable Modules**: PASS. `src/analysis-counter.js` keeps its CommonJS `module.exports` + `window.AnalysisCounter` bridge and its existing public function names/signatures (`createAnalysisCounter`, `getCount`, `recordAnalysis`, `isConfigured`); only internal behavior changes (no more permanent "recorded" gate).
- **III. Narrowest-Scope Test-First Verification**: PASS (planned). Root `npm test` (Jest, `node` env) is the narrowest relevant command; `__tests__/analysis-counter.test.js` will be updated to assert the new every-upload-counts behavior and removal of the permanent recorded state. No dashboard tab is touched, so no tab-navigation updates are needed.
- **IV. Faithful Locale-Aware Data Parsing**: N/A. This feature does not touch CSV/GPX parsing or sport normalization.
- **V. Explicit Privacy & Network Boundaries**: PASS. `services/api` origin checks, client-key validation, rate-limiting, and Firestore event/count behavior are explicitly preserved unchanged (spec FR-004); the change only affects what the browser persists locally and how often it calls the existing endpoint. Product copy about "local file processing" is unaffected (no new network-request category is introduced, the analysis-counter call already existed).

No violations requiring Complexity Tracking.

**Post-Design Re-check** (after Phase 1): No new violations introduced by `data-model.md`, `contracts/analysis-counter-api.md`, or `quickstart.md` — the documented contract is explicitly unchanged, no new persisted storage or entities are added, and the only reusable-module surface touched (`src/analysis-counter.js`) keeps its existing public API. All gates remain PASS.

## Project Structure

### Documentation (this feature)

```text
specs/014-count-every-upload/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
└── analysis-counter.js        # Remove permanent "recorded" localStorage gate; generate a fresh, non-persisted event ID per recordAnalysis() call

__tests__/
└── analysis-counter.test.js   # Update/add cases: every call posts and counts; no permanent recorded state; failed call stays silent

index.html                     # No changes expected: recordCompletedAnalysis() already calls recordAnalysis() once per successful import

services/api/                  # Out of scope: existing origin/client-key/rate-limit/Firestore contract is unchanged
```

**Structure Decision**: Single static frontend project (per repository AGENTS.md). This feature is scoped entirely to the existing reusable module `src/analysis-counter.js` and its Jest tests; `services/api` is a separately-versioned service and is not modified, since its request-scoped idempotency (Firestore `analysisEvents` doc per event ID) and abuse protections already satisfy the spec's requirements when the client sends a fresh event ID per upload instead of one reused forever.

## Complexity Tracking

> No Constitution Check violations — this section is not applicable.
