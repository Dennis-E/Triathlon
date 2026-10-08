# Internal UI Contract: Import Experience

This is an internal browser UI contract, not a public API. It defines the boundary between the local message catalog, the existing import orchestrator, and the import modal.

## Catalog contract

- The catalog exposes stable IDs for the twenty specified humorous entries, optional personal-message templates, and the recurring privacy reminder.
- Every humorous and personal entry has a local SVG illustration path; personalized entries may reuse a semantically matching base illustration.
- Catalog records contain copy, eligibility metadata, and an asset path only. They do not own DOM access, timers, import progress mutation, user data persistence, or network calls.
- Catalog/helper behavior is testable from Node/Jest through the repository's CommonJS export and available to the browser through a `window` bridge.
- All new code loaded as classic scripts is isolated from shared top-level lexical declarations.

## Import orchestrator contract

- `dashboard-import.js` remains the only owner of import-modal DOM updates and rotation lifecycle.
- It starts one experience session per import and stops it on success, error, modal close, teardown, or replacement by a subsequent import.
- Message selection is timer-driven and independent of progress callbacks. A stage/progress callback updates factual status; it does not trigger, reset, or accelerate the message rotation.
- Personal candidates are added only after the processed activity list is complete and only when the corresponding metric is reliable.
- Message 20 eligibility is driven only by the whole-application finalization phase after activity processing/dashboard preparation; the ZIP importer's earlier same-labeled callback and numeric percentages do not qualify.
- Privacy reminders appear after every four humorous message presentations as secondary copy; the current primary message/illustration pair remains synchronized.
- The import experience does not send file content, activity data, or derived statistics to network services and does not change the import API payload.

## Modal presentation contract

- Preserve the current progress bar, percentage where available, factual phase/status, detail/error areas, and single import headline.
- Display one primary message and its matched illustration at a time. The image alternative text identifies meaningful scene content, or the image is marked decorative when the adjacent text conveys the same information.
- Only the message text is announced on message change; the SVG itself must not cause repeated screen-reader announcements. Privacy reminders are announced politely without turning the whole preview region into a frequent live region.
- Message changes reserve stable layout space. Reduced-motion preference disables/minimizes illustration motion and the transition while preserving all content.
- When the document is hidden, rotation/animation may pause; on return, continue with the next eligible message without rapid catch-up or repeats.
- The UI retains the last actual progress percentage for stage-only updates and never regresses due to an invented percentage mapping.

## Static asset contract

- All scene assets are first-party local SVG files beneath `assets/import-illustrations/`; no third-party logos or remote asset URLs.
- SVGs use bounded lightweight animation and include an internal `prefers-reduced-motion: reduce` fallback.
- Every catalog asset path resolves to an existing SVG. Each of the twenty base IDs maps to its own relevant visual concept.
