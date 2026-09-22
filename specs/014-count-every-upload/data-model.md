# Data Model: Count Every Upload Without Browser-Persisted History

This feature does not introduce persisted storage or new entities; it removes a client-side persisted record. The following describes the in-memory/transient shapes involved.

## Analysis Event (transient, in-memory only)

Represents a single counting attempt tied to one successfully completed upload. Never written to `localStorage`, cookies, or any other client-side persistence.

| Field | Type | Notes |
|---|---|---|
| `eventId` | string (UUID v4) | Generated fresh per call via `createEventId()` (`crypto.randomUUID()` or the existing fallback). Used only as the `X-Analysis-Event-Id` header value for the single in-flight `POST /v1/analyses` request. Discarded after the request settles (success or failure). |

**Lifecycle**: created → sent once → discarded. No state transitions are persisted across calls or page reloads.

**Validation rules**: Must match the server's existing UUID v4 pattern (`isValidEventId` in `services/api/src/app.js`); this is already guaranteed by `createEventId()`.

## Analysis Counter (server-owned aggregate, unchanged)

| Field | Type | Notes |
|---|---|---|
| `count` | non-negative safe integer | Stored server-side in Firestore (`metrics/analyses` doc); returned by `GET /v1/analyses/count` and `POST /v1/analyses`. Not modified by this feature. |

## Removed: persisted browser record

Prior to this feature, `localStorage` key `trianalytics:analysis-counter:recorded:v1` held:

```json
{ "eventId": "...", "status": "pending" | "recorded", "count": 42 }
```

This shape and its storage key are removed entirely by this feature (FR-002). No replacement persisted record is introduced.
