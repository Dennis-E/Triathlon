# Feature Specification: Reliable PNG Export Downloads

**Feature Branch**: Not created; specification prepared on existing branch `main`.

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "export: 1) close pop-up windows after successful export 2) 'download' folder set as standard 3) error is shown even though a png is downloaded: 'Could not save export image. Failed to execute createWritable on FileSystemFileHandle: The request is not allowed by the user agent or the platform in the current context.' 4) the downloaded png cannot open in Windows."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Save a PNG that opens in Windows (Priority: P1)

A user downloads a visualization and opens the resulting image in Windows without encountering an invalid-file or unsupported-image error.

**Why this priority**: A downloaded file is not a usable export unless its contents are a complete, readable image.

**Independent Test**: Export a populated visualization through each available saving route, then open the resulting file in Windows Photos and compare it with the preview.

**Acceptance Scenarios**:

1. **Given** a prepared export preview, **When** the user confirms a save destination, **Then** the resulting non-empty PNG opens in Windows Photos and contains the complete previewed image.
2. **Given** destination selection is unavailable or blocked, **When** the user downloads through the browser's ordinary download route, **Then** the resulting PNG also opens in Windows Photos and matches the preview.
3. **Given** the prepared image is invalid or incomplete, **When** the user attempts a download, **Then** the app reports that it cannot prepare the image, does not report success, and offers recovery without discarding the user's visualization selection.

---

### User Story 2 - Receive one accurate export outcome (Priority: P1)

A user can download an image despite browser restrictions without seeing a contradictory save-error message after a usable download has been started.

**Why this priority**: The reported permission error undermines confidence and can accompany an unusable file; users need a clear distinction between success, cancellation, and failure.

**Independent Test**: Exercise a blocked destination dialog, a blocked write after destination confirmation, a cancelled dialog, and a genuine storage failure; verify the resulting file and the feedback for each outcome.

**Acceptance Scenarios**:

1. **Given** destination selection is unsupported or denied by access/context restrictions rather than a safety-check rejection, **When** Download is selected, **Then** one ordinary browser download is initiated and the user receives a non-error explanation that the browser controls its destination.
2. **Given** a destination was confirmed but the browser or platform denies writing in the current context, **When** the app can still initiate an ordinary browser download, **Then** it initiates that download once, explains the changed destination behavior, and does not also display a final save-failure message.
3. **Given** the user cancels destination selection, **When** the dialog closes, **Then** no fallback download starts, no success or error is reported, and the preview remains available for retry.
4. **Given** storage is full or saving otherwise fails without a usable recovery route, **When** the failure occurs, **Then** an understandable error is shown, no success is claimed, and the prepared preview remains available for retry.
5. **Given** an earlier export failed, **When** a later attempt succeeds or starts an ordinary browser download, **Then** feedback from the earlier failure is no longer displayed as the current outcome.

---

### User Story 3 - Return to the dashboard after download (Priority: P2)

A user completes a download and returns directly to the dashboard without manually closing export-related app pop-ups.

**Why this priority**: Closing completed export surfaces removes unnecessary steps while retaining recovery options for unsuccessful attempts.

**Independent Test**: Download from the standard preview and from any enlarged export surface, checking both destination-selected and ordinary browser downloads.

**Acceptance Scenarios**:

1. **Given** an export preview and any app-owned export overlays are open, **When** saving to the chosen destination completes, **Then** those export surfaces close automatically and the dashboard becomes usable without another dismissal.
2. **Given** the ordinary browser download route is used, **When** the app hands the prepared image to the browser for download, **Then** the app-owned export surfaces close without claiming that the browser has finished writing the file.
3. **Given** a download is cancelled or fails without recovery, **When** the outcome is known, **Then** the preview stays open so the user can retry or dismiss it.
4. **Given** the user returns to the dashboard after a download, **When** another visualization is exported, **Then** the new preview contains that visualization rather than stale content.

---

### User Story 4 - Start destination selection in Downloads (Priority: P2)

A user sees Downloads as the preferred initial save location while remaining free to choose a different folder and filename.

**Why this priority**: A predictable starting location makes the requested export workflow easier without overriding user preferences.

**Independent Test**: Start a download with destination selection available and verify the initial folder and ability to change it; repeat where the browser controls the destination.

**Acceptance Scenarios**:

1. **Given** the browser permits the app's initial-folder preference and no overriding browser or user preference applies, **When** the save dialog opens, **Then** it starts in the user's Downloads folder and presents the existing suggested PNG filename.
2. **Given** the dialog starts in Downloads, **When** the user selects another folder or changes the filename, **Then** the complete PNG is saved using that confirmed choice.
3. **Given** the browser ignores the initial-folder preference or uses ordinary download behavior, **When** Download is selected, **Then** browser and user settings determine the actual destination without blocking the export or claiming that Downloads is guaranteed.

### Edge Cases

- A visible file with a `.png` name may be empty or incomplete after a failed save; its existence alone must not count as success. If the user-selected destination could not be saved, feedback must not imply that it contains a usable export, even when a fallback download starts elsewhere.
- Destination selection and writing can be restricted independently; a restriction after destination confirmation must not leave the user with only a misleading error if ordinary downloading remains possible.
- A user cancellation is not a browser restriction and must never trigger an automatic fallback.
- Repeated clicks while an attempt is in progress must not create duplicate dialogs or downloads; a later intentional attempt must remain possible.
- Closing the preview must not interrupt image preparation or handoff, producing an empty, truncated, or unreadable file.
- The user may cancel a browser-managed download after handoff; the app must not claim to observe completion it cannot verify.
- Missing export content retains the existing no-data behavior and does not open a save dialog.
- Browser-owned download panels and unrelated app dialogs are outside the app's automatic-close responsibility.
- If a pending export originated from PB detail opening A and the user closes A and opens B before completion, the old export must not close B or move focus away from it, even if B shows the same PB record. A newer export preview must also remain untouched.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every existing visualization export Download action MUST produce a complete, non-empty PNG that opens in Windows Photos and reproduces the prepared preview, whether saved to a chosen destination or downloaded through ordinary browser behavior.
- **FR-002**: The system MUST prefer the user's Downloads folder as the initial location when destination selection supports that preference, while honoring overriding browser and user settings.
- **FR-003**: Users MUST retain the ability to choose another destination and filename where destination selection is supported; the suggested filename and PNG format MUST remain consistent with the existing export flow.
- **FR-004**: When destination selection is unsupported, or access/context permissions prevent destination selection or writing after selection, the system MUST initiate one ordinary browser download if that route remains available, and explain that browser settings now control the destination. It MUST NOT present the recovered restriction as a final save failure or claim the originally selected destination was saved. Safety-check rejections, genuine storage failures, and unknown failures MUST NOT trigger automatic fallback. An `AbortError` during destination selection MUST be treated as silent cancellation with no fallback; an `AbortError` during writing MUST be treated as a failure, not user cancellation.
- **FR-005**: User cancellation of destination selection MUST NOT initiate a download or display success or failure; the prepared preview MUST remain available for another attempt.
- **FR-006**: Image-preparation failures and unrecovered save failures MUST show an understandable explanation, MUST NOT be reported as success, and MUST preserve the current visualization selection and a retry opportunity. A valid prepared preview MUST be retained for save retries.
- **FR-007**: After a confirmed destination save completes, or after the prepared image is handed to the browser's ordinary download route, app-owned export previews and export-specific overlays still belonging to that attempt MUST close automatically, leaving the dashboard usable without another dismissal. A PB detail surface MUST close only if it is still the same opening from which the export originated. Unrelated dialogs, browser-owned windows, newer export previews, and reopened or replacement PB detail surfaces MUST NOT be closed or lose focus because an older attempt completes.
- **FR-008**: Automatic closure MUST NOT occur on cancellation or unrecovered failure and MUST NOT discard image content before saving or browser handoff has finished.
- **FR-009**: Each download attempt MUST have one coherent current outcome: completed destination save, browser-download handoff, cancellation, or unrecovered failure. Feedback from previous attempts MUST NOT contradict the current outcome, and browser handoff MUST NOT be described as verified on-disk completion.
- **FR-010**: Repeated clicks during one pending attempt MUST NOT create duplicate save dialogs or download handoffs. A subsequent intentional export MUST use the newly prepared image and a fresh destination choice where available.
- **FR-011**: The changes MUST apply consistently to every existing visualization export entry point while preserving existing preview content, branding, selected visualization filters, and no-data behavior.
- **FR-012**: Export preparation, destination selection, saving, and recovery MUST remain local; export images and personal activity data MUST NOT be uploaded by this workflow.

### Key Entities *(include if feature involves data)*

- **Prepared Export Image**: The complete visualization image shown in the preview and offered as a PNG, including its suggested filename and selected visualization context.
- **Download Attempt**: One user-initiated effort to save a prepared image, with a pending state and one final app-observable outcome.
- **Save Destination**: A user-confirmed folder and filename, or the destination controlled by ordinary browser download settings; Downloads is the preferred starting location, not a guarantee.
- **Export Surface**: An app-owned export preview or export-specific overlay that remains available for recovery or closes after a completed save or download handoff.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of acceptance exports across existing visualization entry points and both saving routes, the resulting PNG is non-empty, opens in Windows Photos, and visually matches the prepared preview.
- **SC-002**: In 100% of successful destination saves and ordinary download handoffs, all app-owned export surfaces close within one second of that outcome and the user can use the dashboard without an additional dismissal.
- **SC-003**: In 100% of unsupported-picker and destination-dialog/post-selection access or context-denial tests where ordinary downloading remains available, exactly one fallback download is initiated and no contradictory final save-error message is displayed. Safety-check rejection, genuine storage failure, unknown failure, and destination-dialog cancellation tests initiate zero automatic fallback downloads.
- **SC-004**: In 100% of cancellation and unrecovered-failure tests, no success is claimed, no automatic export-surface closure occurs, and a new attempt is possible; destination-dialog cancellation initiates zero fallback downloads.
- **SC-005**: In 100% of destination-selection tests where initial-folder preferences are honored and not overridden, the dialog starts in Downloads; a user-selected alternative folder and filename are respected in every confirmed save test.
- **SC-006**: A double click during a pending save produces at most one dialog or download handoff, and a subsequent intentional export produces the newly previewed image in every repeat-export test.
- **SC-007**: Export and recovery tests result in zero uploads of export images or personal activity data.

## Assumptions

- "Close pop-up windows" means closing app-owned export previews and export-specific overlays, not the main browser tab, unrelated dialogs, or browser-managed download panels.
- "Download folder" means the operating system's user Downloads folder, including localized folder names. Browser policies, remembered choices, and explicit user preferences may override an app's initial-folder suggestion.
- The earlier destination-selection feature remains in scope and is refined rather than replaced by mandatory silent downloads; users can still choose where to save when supported.
- The app can verify completion of a destination save it controls, but ordinary browser downloading only permits a download handoff to be observed. Later user cancellation or device-storage failure in that route is managed by the browser.
- The reported Windows problem is an acceptance requirement, not a confirmed diagnosis of why the current file is unreadable. Validation must inspect actual downloaded files rather than only a filename or download notification.
- Windows 11 Photos is the baseline image-opening check. Browser checks cover current stable Edge and Chrome on Windows for destination-selected and restricted-write cases, and current stable Firefox on Windows for ordinary downloading. Existing mobile export behavior must remain available where supported.
- Validation uses synthetic or explicitly supplied local activity data and representative exports from all existing visualization entry points; no private repository data is assumed to be a fixture.
- No export redesign, new visualization, cloud storage, browser-setting changes, or unrelated dashboard behavior is included.