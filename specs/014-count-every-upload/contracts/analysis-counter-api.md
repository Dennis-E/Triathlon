# Contract: Analysis Counter API (existing, unchanged)

This feature does not modify the HTTP contract between the browser and `services/api`. It is documented here only as a reference so implementation does not accidentally alter it.

## `POST {apiBaseUrl}/v1/analyses`

**Request headers**:
- `X-Analysis-Key: <clientKey>` — required, validated with constant-time comparison against configured `ANALYSIS_CLIENT_KEYS`.
- `X-Analysis-Event-Id: <uuid-v4>` — required, must match `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`. Under this feature, the client MUST generate a fresh UUID v4 for every call (never reused across calls).

**Responses**:
- `201 { "count": <non-negative integer> }` — event accepted (first time this exact event ID is seen) or replayed (same event ID resubmitted returns the current count without incrementing again — existing Firestore-transaction behavior, unused in normal operation once IDs are always fresh).
- `401 { "error": "Analysis key is invalid" }`
- `400 { "error": "Analysis event ID is invalid" }`
- `403 { "error": "Origin is not allowed" }` (when `Origin` header present and not in the allow-list)
- `429 { "error": "Too many analysis events. Please try again later." }`
- `500 { "error": "Could not process request" }`

**Client behavior under this feature**: On any non-2xx response or network failure, `recordAnalysis()` rejects; callers (`recordCompletedAnalysis()` in `index.html`) catch and log via `console.warn`, with no retry and no visible user-facing error (FR-007).

## `GET {apiBaseUrl}/v1/analyses/count`

Unchanged. Returns `{ "count": <non-negative integer> }`. Used to populate the counter on page load, independent of this feature.
