# Phase 0 Research: Count Every Upload Without Browser-Persisted History

## Unknowns from Technical Context

None. This is a self-contained change to one existing, already-tested browser module (`src/analysis-counter.js`); no new language, framework, or infrastructure decisions are required. The two clarifications needed (idempotency identifier, failure UX) were already resolved during `/speckit-clarify` and are recorded in [spec.md](./spec.md#clarifications).

## Decision: Remove the permanent "recorded" localStorage gate

- **Decision**: Delete the `STORAGE_KEY`-based short-circuit in `recordAnalysis()` that returns a cached count forever once `status === 'recorded'`. Every call to `recordAnalysis()` performs a fresh `POST /v1/analyses` request.
- **Rationale**: This is the root cause identified during troubleshooting — the counter appeared "stuck" because the first successful browser recording permanently blocked all later ones. Removing the gate directly satisfies FR-001 (count every successful upload) and FR-002 (no persisted "already recorded" record).
- **Alternatives considered**:
  - *Keep the gate but reset it periodically (e.g., daily)* — rejected: still contradicts "count every successful upload" and adds arbitrary time-based complexity with no product requirement behind it.
  - *Keep a persisted per-analysis history (list of past event IDs)* — rejected: explicitly the "browser history" the user asked to avoid (spec FR-002); also unnecessary since the server does not need the client to deduplicate.

## Decision: Generate a fresh, non-persisted event ID per call, no client-side dedup

- **Decision**: `recordAnalysis()` calls `createId()` (existing `createEventId()` helper, `crypto.randomUUID()`) once per invocation and uses it only for that single request's `X-Analysis-Event-Id` header. Nothing is written to `storage` for this purpose.
- **Rationale**: The server (`services/api/src/app.js`) already validates the event ID format and uses it as a Firestore document key inside a transaction to guard against literal duplicate submissions of the *same* ID; since a fresh, effectively-unique ID is generated per call, this existing mechanism is never triggered in normal operation, exactly matching the clarified answer "no client-side deduplication" while still satisfying the server's required request shape.
- **Alternatives considered**:
  - *Add a short-lived in-memory (non-persisted) lock to prevent two rapid clicks from both firing* — rejected per clarification answer ("send no identifier at all" for double-submit protection); each accepted request is intentionally counted independently.
  - *Change the server API contract (e.g., make event ID optional)* — rejected: out of scope, server contract must remain unchanged (constitution V), and the existing contract already works correctly with fresh per-call IDs.

## Decision: Keep failure handling silent (no retry, no visible error)

- **Decision**: `recordCompletedAnalysis()` in `index.html` keeps its existing `try { ... } catch (error) { console.warn(...) }` behavior; no retry loop or user-facing error UI is added.
- **Rationale**: Matches the clarified answer directly (spec FR-007); avoids scope creep into UX/error-surfacing work not requested by the user.
- **Alternatives considered**:
  - *Automatic background retry* — rejected per clarification.
  - *Visible toast/error message* — rejected per clarification.

## Decision: `storage` parameter and `getStoredEvent`/`storeEvent` helpers

- **Decision**: Remove the now-unused `getStoredEvent`/`storeEvent`/`STORAGE_KEY` machinery from `src/analysis-counter.js` (or reduce to the minimum needed), and drop the `storage` constructor option if nothing still needs `localStorage` for this feature.
- **Rationale**: Keeping unused persistence code around would contradict FR-002 in spirit (dead code that suggests the module still writes browser history) and adds test/maintenance burden for a code path we now must guarantee is never invoked.
- **Alternatives considered**:
  - *Keep `storage`/`STORAGE_KEY` for potential future use* — rejected: constitution's "Development Workflow" section requires focused changes without speculative retention of unused code paths.

## Server-side (`services/api`) impact

- **Decision**: No server-side code changes.
- **Rationale**: The existing endpoint's per-event-ID idempotency, origin allow-list, client-key validation, and rate limiter already fulfill FR-004 unchanged; the feature only changes what the browser sends and remembers, not what the server accepts.
