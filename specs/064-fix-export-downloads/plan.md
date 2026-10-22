# Implementation Plan: Reliable PNG Export Downloads

**Branch**: `main` (actual Git branch; setup feature identifier: `064-fix-export-downloads`) | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/064-fix-export-downloads/spec.md`

This phase produces design artifacts only; application code and tests remain unchanged.

## Summary

Repair the shared export workflow: validate PNG content before enabling Download, retain an immutable image snapshot, prefer Downloads in the native save dialog, recover specifically from permission/context restrictions, and close owned export surfaces after completed saving or browser handoff. Preserve cancellation, retry, filenames, filters and branding.

The Windows failure is not diagnosed. A selected filename can exist as an empty placeholder when writing fails; existing tests accept `hello` as PNG content. Actual-byte and actual-file checks must discriminate these risks rather than assume a cause.

## Technical Context

**Language/Version**: Existing browser-compatible JavaScript, classic scripts; CommonJS for utilities and Jest. No new runtime requirement.

**Primary Dependencies**: Existing html2canvas, Canvas/Image/Blob and File System Access APIs, `window.exportUtils`. No new dependencies.

**Storage**: Temporary browser memory and user-local files; no persisted handle, folder or server storage.

**Testing**: Jest 30 in Node, existing VM download harness and utility tests; actual browser downloads and Windows Photos supplement mocks.

**Target Platform**: Static app over localhost/HTTPS; Windows 11 Edge/Chrome for native saving, Firefox for ordinary downloads; preserve supported mobile fallback.

**Project Type**: Static browser application, no bundler/build step.

**Performance Goals**: Close owned surfaces within one second after save/handoff. Decode once before preview readiness; at most one pending attempt and fallback.

**Constraints**: Picker needs transient user activation. Downloads is a hint; anchor click cannot prove disk completion. Keep exports local, preserve public APIs/script order, never delete chosen files or bypass safety-check failures.

**Scale/Scope**: All 12 current tab capture targets and PB detail through the shared handler; no new tab, service or capture redesign.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Pre-research: PASS. Post-design: PASS. No exceptions required.

| Principle / Boundary | Compliance |
|----------------------|------------|
| I. Static browser-first | Existing scripts/native APIs; no build step or service. |
| II. Dual-target utilities | Pure byte checks in existing `src/export-utils.js` with CommonJS/browser bridges; DOM/decode/save orchestration stays in `src/dashboard-export.js`. |
| III. Narrow verification | Extend existing Jest suites first; focused tests after implementation edits; actual downloads/Photos for readability. No new tabs/navigation changes. |
| IV. Locale-aware parsing | Parsing untouched; synthetic or authorized local inputs only. |
| V. Privacy/network | No upload/remote validation; no claim the whole app is network-free. |
| Repository boundaries | API/CLI untouched; existing handler names and public exports preserved. |

Post-design review confirms existing ownership boundaries suffice. See [research.md](research.md) and [contracts/export-download.md](contracts/export-download.md).

## Project Structure

### Documentation (this feature)

```text
specs/064-fix-export-downloads/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/export-download.md
  checklists/requirements.md
```

### Source Code (repository root)
```text
src/dashboard-export.js
src/dashboard-power-pb.js  # per-opening identity wiring only if required
src/export-utils.js
__tests__/dashboard-export-download.test.js
__tests__/export-utils.test.js
__tests__/index-script-syntax.test.js
index.html      # existing preview controls; touch only if necessary
README.md       # concise behavior/limitation update
```

**Structure Decision**: Reuse existing modules and test harnesses, not a new download service. Pure validation belongs in existing utilities; browser-dependent behavior stays in dashboard export. Only if current PB opening state cannot identify a particular opening, add narrowly scoped identity wiring in the existing PB module and run its relevant existing tests. Inspect existing bindings before touching markup. `tasks.md` is deferred to `/speckit-tasks`.

## Phase 0: Research

Complete in [research.md](research.md); no unresolved design questions. Prefer Downloads, prepare/decode PNG before readiness, classify errors by phase, commit only after stream close, retain data-URL fallback, and guard a single pending attempt with immutable ownership.

## Phase 1: Design

### Preparation and ownership

Keep capture/composition unchanged. Before publishing a downloadable preview, validate MIME/base64, non-empty bytes, PNG signature/plausible header dimensions, then browser decode with positive dimensions. Pure byte checks are not a complete decoder. Store data URL, matching Blob, target and dimensions together. Invalid preparation preserves selected filters and offers regeneration.

Snapshot the prepared image and mark pending before invoking the picker directly from the click, without new async work. Ignore duplicate clicks. Pending bytes survive global cleanup/manual dismissal; late completion cannot dismiss a newer preview.

### Saving and feedback

Add `startIn: 'downloads'` to existing picker options. Missing picker or named permission/context denial (`NotAllowedError`, `SecurityError`, classified by operation) uses one ordinary download. Picker `AbortError` is silent cancellation with no fallback; write-stage `AbortError` is a failure, not cancellation. Unknown, disk and safety-check failures never trigger automatic fallback, as required by FR-004 and SC-003.

Retain the stream for best-effort abort after failed writing/closing; preserve the original error, never close in error cleanup or delete the selected file. After post-selection fallback, explain the selected destination was not saved and the browser controls the new location. Clear stale feedback/timeouts on new attempts and release the pending guard on every terminal path.

### Closure and origin

Close owned surfaces after successful write plus close, or completed anchor handoff without synchronous error. For `target.kind === 'pb-tile'`, snapshot the PB detail's per-opening identity alongside preview ownership and close it using the existing routine only if that exact opening remains current. Closing and reopening the same PB record creates a different opening; a model reference or target kind alone is insufficient. Validate ownership before closing or restoring focus, so old completion cannot affect a replacement detail or newer preview. Snapshot origin before cleanup clears global state. Cancellation/failure retains the valid preview unless explicitly dismissed. Never close unrelated dialogs or claim browser handoff proves disk completion.

### Verification coverage

| Requirements | Evidence |
|--------------|----------|
| FR-001, FR-006 | Genuine PNG fixture, malformed data/decode cases, exact Blob bytes, real download and Windows Photos. |
| FR-002, FR-003 | Picker options plus actual Downloads/alternative folder and filename. |
| FR-004, FR-005, FR-009 | Phase-specific errors, cancellation, one fallback, stale feedback clearing, accurate destination message. |
| FR-007, FR-008 | Deferred writes/close, owned-modal state, per-opening PB origin identity, A-close/B-open race (including the same PB record), focus preservation, failure retention. |
| FR-010 | Deferred promises, double click, retry, fresh export, dismissed-preview race. |
| FR-011 | Existing target/no-data checks and every tab/PB-detail browser matrix; unchanged content/branding/filters. |
| FR-012 | No upload/new network code; scoped network inspection. |

Start implementation checks with `npm test -- --runTestsByPath __tests__/dashboard-export-download.test.js`, then utility and script-syntax suites for their touched slices. Follow [quickstart.md](quickstart.md) for actual-file evidence; mocked success cannot prove Windows readability.

## Complexity Tracking

No constitution violations or additional architectural layers; existing modules and native APIs suffice.
