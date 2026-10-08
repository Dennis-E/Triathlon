# Research: Entertaining Import Experience

## Decision 1: Keep the feature in the existing static browser application

**Decision**: Add no framework, bundler, animation package, or backend dependency. Keep the existing import modal and its orchestration in `src/dashboard-import.js`; expose message definitions and pure selection/statistic helpers through one small reusable module; keep SVG illustrations as local static assets.

**Rationale**: The project is a static HTML application whose classic scripts are served directly, and reusable utilities are tested in Node/Jest. This meets the import feature's performance/privacy constraints while making the copy and art independently maintainable.

**Alternatives considered**:
- React components: rejected because the application does not use React and has no build step.
- External animation library: rejected because CSS/SVG motion is sufficient and import performance takes priority.
- Inline every illustration in the catalog or import controller: rejected because it couples art editing to application logic and increases script size.

## Decision 2: Separate copy/catalog from per-message SVG illustrations

**Decision**: Maintain a local catalog module at `src/import-experience-catalog.js` with stable message IDs, copy/templates, message type, eligibility/statistic keys, and a relative SVG asset path. Store the twenty corresponding illustrations at `assets/import-illustrations/message-01.svg` through `message-20.svg`. Catalog entries for personal observations may point to a thematically matching existing illustration rather than requiring duplicate art.

**Rationale**: Copy can be revised or reordered without editing SVG artwork; an individual illustration can be replaced independently; the static application can load the assets without a build pipeline. This directly addresses ongoing content-maintenance needs.

**Alternatives considered**:
- One SVG sprite: fewer requests, but more coupling and less straightforward per-scene styling/accessibility.
- Inline SVG source strings in the catalog: rejected due to copy/art coupling and large JavaScript payload.
- One external JSON file: rejected because this app has no fetch/build abstraction for local content and the catalog needs pure helper functions and CommonJS tests. A small dual-target JS module fits existing conventions.

## Decision 3: Animate locally with lightweight SVG/CSS and honor reduced motion in both layers

**Decision**: Each scene uses simple SVG primitives and short, bounded CSS/SVG animations; the import UI uses a subtle opacity transition. Each animated SVG disables or minimizes its internal motion under `prefers-reduced-motion: reduce`, and the UI suppresses its transition for the same preference. No canvas, GIF/video, remote asset, or per-frame JavaScript loop is introduced.

**Rationale**: A standalone SVG loaded as an image cannot reliably be animated by selectors in the parent page, so animation rules and the reduced-motion fallback belong inside each SVG. The page-level transition is separately controlled by application CSS.

**Alternatives considered**:
- A continuously updated canvas: rejected for CPU/memory overhead and accessibility.
- JavaScript animation timers: rejected because CSS/SVG animations do not compete with the import loop.
- Outer CSS movement only: insufficient to represent distinct visual concepts for all twenty message scenes.

## Decision 4: Keep DOM and timer lifecycle in the existing import orchestrator; keep selection logic pure

**Decision**: Replace the existing five-second preview/message rotator in `src/dashboard-import.js`. Keep DOM rendering, visibility handling, and start/stop cleanup there. Put pure eligibility, session shuffle-without-replacement, dynamic candidate insertion, privacy cadence, and personal-stat formatting/selection helpers in the catalog module (or an adjacent pure utility only if the source grows enough to warrant it). Load the catalog before `dashboard-import.js` in `index.html` and lock that order in `__tests__/index-script-syntax.test.js`.

**Rationale**: There is already one owner for import modal lifecycle; a second controller would create competing timers. Pure helpers remain independently testable without jsdom. Classic script files share a browser global lexical scope, so the new module must be wrapped to avoid top-level declaration collisions.

**Alternatives considered**:
- Keep the existing timer and add a separate experience timer: rejected due to duplicate rotation state, races, and cleanup risk.
- Move all modal DOM work into a new generalized component: rejected as a speculative refactor outside the feature boundary.

## Decision 5: Derive personalization only after the activity array is complete, without rereading the archive

**Decision**: Accumulate personal statistic scalars as each valid processed activity is created during the existing `processData()` CSV pass, then finalize the compact statistics object only after that parse succeeds. Use the activity's normalized sport, date, distance availability, and equipment fields. Do not make a later pass over the activity array, copy it, or reparse ZIP/CSV/FIT/GPX data. Prefer already-produced lifetime summary values where they are available without recomputation.

**Rationale**: `processData()` omits invalid-date rows and marks distance availability explicitly. The activity list already has normalized `Run`, `Bike`, and `Swim` classifications, with unsupported types retained as null. Incremental accumulation during the established parse means no partial ZIP-level estimate is shown and no separate analytics pass is needed; the candidate messages are published only after the parse succeeds.

**Metric eligibility decisions**:
- Activity count is the count of processed, valid-dated activity rows, including rows whose sport is unknown; this matches the imported dashboard dataset.
- Swimming activity count counts only records normalized to `Swim`.
- Cycling distance is shown only if at least one Bike activity exists and all Bike distances are available; otherwise omit it rather than label a partial sum as a total.
- Longest ride is shown only if at least one Bike exists and every Bike distance is available; a missing distance could conceal the true maximum.
- Training history is represented as the earliest-to-latest activity year range, not an estimated integer number of “training years”; the endpoints are real imported dates.
- Running-shoe count is the number of distinct non-empty, non-placeholder equipment labels attached to `Run` activities. Labels are trimmed and compared case-insensitively; if no usable labels exist, omit the message. This follows the existing lifetime-statistics convention that running-activity equipment represents shoes and avoids guessing from manufacturer names.

**Alternatives considered**:
- Show ongoing ZIP counts/distances: rejected because they are partial and can double-count or change after final CSV processing.
- Reuse FIT best-effort timing/record counts: rejected because they are not complete dashboard statistics and may be segmented per multisport session.
- Report shoe counts using brand-name guessing: rejected; gear names are user-supplied and brand inference is not proof of type.
- Build another full lifetime-statistics pipeline: rejected; use one bounded pass or existing final summary values.

## Decision 6: Treat privacy copy as a recurring interstitial, not a shuffled joke

**Decision**: After every four humorous messages (generic and personalized humorous entries both count), briefly display one privacy reminder as secondary copy while retaining the current message/illustration pairing. The reminder does not count toward the four-message cadence or the no-repeat shuffle cycle.

**Rationale**: This gives a predictable interpretation of “after approximately every 4–5 humorous messages,” keeps the privacy reminder periodic on long imports, and avoids introducing a third competing primary visual state. Its wording is restricted to local processing/non-upload of the file contents.

**Alternatives considered**:
- Randomly shuffle privacy copy with jokes: rejected because reminders could cluster or be absent for too long.
- Replace the primary illustration with a privacy card: rejected because it breaks message/illustration synchronization and consumes a humor slot.

## Decision 7: Gate message 20 on application-level finalization, never on percentage alone

**Decision**: Message 20 is eligible only after CSV processing and dashboard data application have completed, when the application emits its explicit finalizing/preparation status immediately before the existing close delay. At that point, if not already shown, move it to the front of the remaining message order and display it immediately. The ZIP extractor's earlier `Finalizing...` callback is not sufficient. Never extend the import or modal lifetime to show it.

**Rationale**: The ZIP stage can report finalization before the outer import has parsed the CSV and rendered dashboards. A distinct application-level phase is the reliable signal selected during clarification.

**Alternatives considered**:
- Treat any `Finalizing...` text as sufficient: rejected because the same label is emitted before dashboard processing.
- Trigger at 90% or another percentage: rejected by the clarification and because percentages are not consistent phase identity.
- Guarantee that message 20 is shown: rejected because quick finalization must not delay import completion.

## Decision 8: Do not invent new phase percentages; remove the existing presentation regression

**Decision**: Preserve percentages from actual progress callbacks. For subsequent stages that have no independent numeric update, update the textual phase without forcing a new percentage. Remove the current hard-coded 70% CSV-processing update that follows ZIP callbacks up to 95%, and keep the actual finalization callback/value. Start status at 0% before the first ZIP callback rather than displaying an invented 5%.

**Rationale**: Current outer orchestration can visibly move backward from 95% to 70%, and the initial 5% is a fixed value rather than a measured callback. The feature explicitly requires accurate progress. Retaining the last actual percentage while updating the phase text is less misleading than fabricating phase weights; this does not alter archive processing or introduce artificial advancement.

**Alternatives considered**:
- Assign new percentage weights to CSV parsing, dashboard calculation, and rendering: rejected because these phases expose no measured progress and the specification prohibits invented phase percentages.
- Leave the 95%→70% regression unchanged: rejected because it conflicts with the explicit progress-accuracy requirement.

## Decision 9: Test pure rules in Jest and verify static UI wiring separately

**Decision**: Add focused Node/Jest tests for selection order, eligibility, privacy cadence, dynamic personalized candidate insertion, value eligibility/formatting, and lifecycle timer cleanup through injected clock/visibility seams. Extend static HTML/script checks for asset existence, unique ID pairing, script load order, reduced-motion hooks, and removal of obsolete five-second copy/timer. Use a manual browser pass for rendering, visual quality, responsive layout, and reduced-motion behavior.

**Rationale**: Root Jest runs in Node rather than jsdom. Pure functions and injected interfaces preserve the current testing boundary, while browser inspection covers rendering that static assertions cannot prove.

**Alternatives considered**:
- Add jsdom or a browser automation dependency: rejected because it expands dependencies solely for this UI and is not needed to validate the core selection/lifecycle logic.
- Rely on string assertions alone: rejected because they do not exercise ordering, eligibility, or timer cleanup.

## Unresolved items

None blocking the design. The existing ZIP pipeline's underlying large-archive capacity is outside this feature's scope; the feature must not add archive copies or parsing passes and does not claim new 2 GB support.
