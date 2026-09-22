# Feature Specification: Count Every Upload Without Browser-Persisted History

**Feature Branch**: `014-count-every-upload`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "I dont want this to be stored in the users browser history. I want to count every successful upload."

## Clarifications

### Session 2026-09-22

- Q: Should each upload's counting request still carry a fresh, non-persisted identifier to guard against accidental double submission? → A: Send no identifier at all — no client-side protection against duplicate submissions of the same click; each accepted request counts independently.
- Q: If a successful upload's counting request to the server fails, what should happen? → A: Fail silently (no retry, no visible error) — matches current behavior; only a developer-facing console warning.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Every successful upload increases the public counter (Priority: P1)

As a visitor who imports a Strava export, I want the public "analyses completed" counter to go up every time I successfully complete an import, not just the first time in this browser, so the counter reflects real usage.

**Why this priority**: This is the core defect being fixed — the counter currently freezes for a browser after its first successful analysis, so the majority of successful uploads are invisible to the public counter.

**Independent Test**: In a browser that has already completed one successful import, perform a second, distinct successful import and confirm the displayed counter increases by one.

**Acceptance Scenarios**:

1. **Given** a browser that has never completed an import, **When** the user completes a successful upload, **Then** the counter increases by exactly one.
2. **Given** a browser that has already completed one or more successful imports, **When** the user completes another successful upload, **Then** the counter increases by exactly one again.
3. **Given** a user closes and reopens the browser (or reloads the page) after a prior successful import, **When** they complete a new successful upload, **Then** the counter still increases by one.

---

### User Story 2 - No persistent local record of past analyses (Priority: P1)

As a privacy-conscious visitor, I don't want the site to keep a permanent local record in my browser showing that I've previously completed an analysis, so that reopening the site does not carry forward any trace of past uploads.

**Why this priority**: This is the explicit privacy requirement driving the change, alongside the counting fix; both must hold together for the feature to be complete.

**Independent Test**: Complete a successful upload, then inspect the browser's local storage/cookies for this site and confirm no entry persists that identifies a previously completed analysis.

**Acceptance Scenarios**:

1. **Given** a successful upload has just completed, **When** the browser's local storage and cookies for the site are inspected, **Then** no record remains that marks a prior analysis as completed.
2. **Given** the browser is closed and reopened, **When** the site is reloaded, **Then** no leftover record from a previous session influences whether the next upload is counted.

---

### Edge Cases

- What happens if the counting request fails permanently (e.g., server unreachable) for an otherwise successful upload? The visible counter should not increase for that attempt, the failure fails silently (no retry, no visible user-facing error, only a developer-facing console warning), and the failure must not create a persisted local record that blocks a later, separate upload from being counted.
- What happens if a user has browser storage disabled or cleared mid-session? Each successful upload must still be eligible to be counted; the absence of storage must not prevent counting.
- What happens if a user rapidly triggers multiple uploads in a row, or accidentally double-submits the same upload (e.g., double click)? Each accepted counting request is counted independently; no deduplication is applied.
- What happens if the server-side abuse protections (client key, origin restriction, rate limiting) reject a request? The counter must not increase, consistent with current behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST increase the publicly displayed analysis counter by one for every successfully completed upload/import, including when the same browser has already completed one or more prior successful uploads.
- **FR-002**: System MUST NOT persist, in the browser (e.g., local storage, cookies, or any other client-side storage that survives beyond the current upload), any record indicating that an analysis was previously completed.
- **FR-003**: System MUST NOT apply any client-side deduplication against accidental duplicate submissions (e.g., a double click); each accepted counting request is treated and counted independently.
- **FR-004**: System MUST continue to reject counting requests that fail existing server-side abuse protections (client key validation, allowed-origin check, and rate limiting), and such rejections MUST NOT increase the counter.
- **FR-005**: System MUST update the visible counter value after each successful upload without requiring the user to clear any local data or take any manual action.
- **FR-006**: System MUST NOT increase the counter for uploads that do not complete successfully.
- **FR-007**: System MUST fail silently when a counting request fails (no retry, no visible user-facing error; a developer-facing console warning is acceptable), matching current behavior.

### Key Entities

- **Analysis Event**: A single upload/import action that triggers one counting request; each such request is counted independently, with no deduplication against other requests.
- **Analysis Counter**: The aggregate, publicly displayed total of all successfully counted analysis events across all users and browsers.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successfully completed uploads result in exactly one increment of the publicly displayed counter, regardless of how many prior successful uploads occurred in the same browser.
- **SC-002**: After a successful upload, and after closing and reopening the browser, no locally persisted record exists that identifies a previously completed analysis.
- **SC-003**: A failed counting request produces no visible user-facing error and does not block subsequent, separate uploads from being counted.
- **SC-004**: Existing abuse-protection rejection rates (invalid key, disallowed origin, rate limit exceeded) are unchanged compared to current behavior.

## Assumptions

- "Browser history" refers to any persisted client-side storage (local storage, cookies, or similar) that the site uses to remember prior recorded analyses, not the browser's URL/navigation history.
- No client-side protection against accidental duplicate submissions (e.g., double-click) is required; each accepted counting request counts independently.
- A failed counting request fails silently (matching current behavior): no retry, no visible user-facing error, only an optional developer-facing console warning.
- Existing server-side abuse protections (client key validation, origin allow-list, rate limiting) remain in scope unchanged; this feature only changes what the browser records locally and how often the counter is incremented per browser.
- The counter continues to be a simple aggregate total (not a per-user or per-browser unique count) as already exposed via the existing counter API.
