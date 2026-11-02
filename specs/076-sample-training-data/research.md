# Research: Silicon Valley Sample Training Data

## 1. Delivery and reproducibility

- Decision: Ship one prebuilt, versioned JSON payload at `sample-data/silicon-valley-training.json`, a curated `sample-data/routes.json` source catalogue, and `sample-data/README.md` containing provenance, licensing, regeneration instructions, and synthetic-data notice. Generate the payload offline with a deterministic Node script under `scripts/`; generation is not a visitor setup or app build requirement.
- Rationale: `createTrainingPeaksImportedDataset` in `src/dashboard-import.js` already accepts normalized activities without CSV. Public static assets avoid ZIP/FIT parsing costs, runtime randomness, external routing availability, and new backend responsibilities.
- Alternatives considered: A bundled ZIP exercises import parsing but is slower and larger; runtime generation makes validation less reproducible; an external demo service violates the static delivery boundary.

## 2. Dataset adapter and dates

- Decision: Keep `kind: 'tri-activities-v1'` at runtime. Add explicit sample provenance and hydrate the existing activity, GPS, and power-effort shapes in a dual-target `src/sample-data-utils.js` utility. Store local calendar dates and wall-clock start times as components, not UTC midnight strings. Construct `date`, `startTime`, and `monday` with local calendar constructors, matching current local getters.
- Rationale: Existing charts consume `Date` instances, distances in kilometers, duration in seconds, and optional measurements as `null`. Components preserve the fictional athlete's training day and time-of-day across visitor time zones without changing personal-import semantics.
- Alternatives considered: UTC timestamps can move activities across dates or years; a new dashboard dataset type would duplicate orchestration and availability logic.

## 3. Training and physiological coverage

- Decision: Generate a fixed-seed target of 1,600 activities and at least 700 tracked sessions across 2021-2025, satisfying the specification's lower bounds per year, month, sport, and route pattern. Include varied workloads, recovery/rest, shoes and bikes used over distinct periods, and cycling best efforts for 5, 30, 60, 120, 300, 600, 1200, and 3600 seconds.
- Rationale: `avgWatts` alone does not populate cycling personal bests; `src/dashboard-power-pb.js` consumes `powerEfforts` using the durations in `src/power-pb-utils.js`. Synthetic efforts must come from the same deterministic power profile as average power, with intervals no longer than activity duration. Store computed efforts, not the full generated power series.
- Alternatives considered: Flat annual copies hide comparisons; random unrelated measurements produce contradictory analyses; full power series add unnecessary transfer and parsing work.

## 4. Geographic realism and size

- Decision: Curate at least 12 running/cycling patterns plus two appropriate open-water patterns. Obtain road/trail geometry from a public, redistributable source, record source URL, retrieval date, attribution, and license for every pattern, and retain required attribution in distributed data documentation. Verify swimming locations against authoritative access information and review tracks against the map. No private routes or exports are inputs.
- Rationale: The repository's country boundaries cannot supply street or shoreline geometry. Existing map tiles provide background only. Repeated activity IDs referencing the same corridor generate meaningful frequency, unlike repeating points inside one activity.
- Decision: Share pattern geometry in the serialized payload; expand it into activity-keyed track records when hydrating. Keep route distance and activity distance consistent, and do not add positional jitter that moves tracks off paths. Prefer routes below 100 km, at most 2,000 points per pattern, and segment spacing at most 60 m, including loop closure when applicable. Reject invalid or discontinuous tracks.
- Rationale: `src/heatmap-utils.js` uses approximately 30 m matching and 90 m continuity thresholds. These budgets preserve visible continuity while avoiding hundreds of copies on the wire. Target total JSON payload <= 4 MiB uncompressed; measure the actual load rather than assuming this proves the 15-second goal.
- Alternatives considered: Hand-drawn polygons or distant straight-line waypoints fail geographic plausibility; runtime route requests add third-party dependencies and privacy concerns.
- Implementation prerequisite: Source geometry and swimming-access checks are not performed by this planning workflow. Acquisition, redistribution-license review, attribution, distance checks, and visual inspection are mandatory generation gates, not optional follow-up work. Unsuitable or unlicensed geometry must not be published.

## 5. Race-safe activation and counting

- Decision: Introduce one import-operation generation shared by sample, Strava, TrainingPeaks, and standalone CSV entry points. Start it at a confirmed nonempty selection or sample activation; nested helpers inherit the token. Stage and validate all required resources before the final current-token check and synchronous activation. Token-bind progress, errors, timers, and cleanup, not only the dataset assignment.
- Rationale: `applyImportedDataset` currently replaces globals without generation guards; personal import paths count separately. A slow old demo or old error handler must not overwrite a newer selection or dismiss its progress. Cancellation is an optimization, not the correctness mechanism.
- Decision: Count exactly once only for a personal operation that successfully commits; never count a sample. Bind counting to that committed operation rather than reading the later active dataset. Discarded candidates release their resources, not the active dataset's resources.
- Decision: Validation, hydration, and preparable indices occur before activation. Invalid, unavailable, or superseded sample resources leave the last committed dataset intact. Rendering errors after an accepted commit are surfaced as rendering errors, not resource-load failures; no full DOM rollback framework is introduced.
- Alternatives considered: Independent per-source tokens cannot prevent cross-source races; disabling every import control prevents the specified later selection; releasing current media at load start destroys the fallback dataset.

## 6. Source identity, exports, and media lifetime

- Decision: Carry `sourceType: 'sample'` and immutable sample provenance into dashboard context and export-target snapshots. Add a reserved synthetic-data line in the shared image composition, including normal tabs and PB detail, independent of bounded optional context lines and layout/humor toggles.
- Rationale: `applyImportedDataset` currently labels unknown sources as Strava. `createExportTarget` in `src/export-utils.js` does not automatically retain unknown fields. `src/dashboard-export.js` snapshots targets before asynchronous capture, so consulting current dataset state later would mislabel in-flight exports after switching datasets.
- Decision: Keep the sample media-free; preserve the existing media-gallery unavailable behavior. During replacement, invalidate stale gallery/collage work, clear old dashboard references and PB selection, and release previous dataset ownership only after the new candidate is accepted. Existing independent export media leases remain valid until their own consumers finish.
- Alternatives considered: A landing-only sample label disappears in exported images; deriving provenance from free-text labels is fragile; revoking export-owned URLs on dataset replacement breaks in-flight downloads.

## 7. Heatmap year requirement

- Decision: Add a compact heatmap year selector using the same represented-year domain as the active dataset, with an All years option. Preserve existing tab IDs/order, sport controls, and zoom-preservation behavior. Filter active activities before passing them to the heatmap renderer; include year in asynchronous render identity and export snapshot context.
- Rationale: `src/dashboard-heatmap.js` currently filters only by sport. User Story 3 and SC-004 explicitly require sport/year maps, so data inspection alone cannot satisfy acceptance. This is a bounded enhancement to an existing view, not a new visualization tab.
- Alternatives considered: Quietly reducing acceptance to aggregate maps would contradict the approved specification; adding a new map tab is unnecessary.

## 8. Verification and unresolved research

- Decision: Extend existing import, export, media, heatmap, and navigation tests, plus one focused sample-data utility/data-invariants suite. Use injected fetch and deferred promises to test failure and completion orders. Verify timezone hydration in separate processes and visually inspect desktop/mobile output and exported images.
- Rationale: Node Jest does not catch classic-script global collisions, real map framing, image-label clipping, or actual loading time. Browser and first-time visitor acceptance remain required in addition to focused unit tests.
- Alternatives considered: Full-suite-only testing obscures failure ownership; unit tests alone cannot prove geographic quality or user comprehension.
- Status: All architectural research questions are resolved. Public geometry acquisition, timing measurements, and first-time visitor evaluation are explicit implementation/acceptance work, not completed research claims. No new runtime package or API service change is required.