# Specification Quality Checklist: Restore Swim GPS Heatmap Visibility

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-20
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Validation completed on 2026-10-20: all 16 quality items pass; no clarification markers remain. This validates specification readiness, not delivery of the correction.
- Content and scope evidence: Story 1 describes route recovery; Story 2 preserves multisport attribution and export; FR-001 through FR-009 map to acceptance scenarios; SC-001 through SC-005 define observable outcomes.
- Edge cases and assumptions explicitly cover missing GPS, timestamps, summary timing differences, ambiguous shared ownership, privacy, compatibility, and excluded redesign work.
- Investigation evidence: a synthetic standalone swim with three valid locations and a two-hour summary/recording time mismatch retains two drawable locations after normal simplification in `extractGpsTracksFromZip`, but has no route in `extractGpsAndPowerFromZip`.
- Existing checks: `npm test -- --runInBand __tests__/zip-importer.test.js __tests__/dashboard-heatmap.test.js` passes all 49 tests despite that reproduction. The combined/separate comparison cases omit summary dates and durations; the shared multisport case aligns timestamps exactly.
- Code investigation: `src/zip-importer.js` applies session segmentation when summary times exist, including a single-owner recording, using an end time derived from Moving Time. Git history traces `parseGpsFileEntries` to commit `de5421f` (`import: previews included`); this alone does not establish the user's exact failing export or prove that every swim-loss report has the same cause.
- Planning review (2026-10-20): the user explicitly approved preserving TrainingPeaks complete-import failure behavior; FR-005 and edge cases now state this exception. All 16 quality criteria remain satisfied after this clarification.
- Shared-recording review found existing unsafe fallbacks for incomplete or overlapping windows. The specification now requires conservative omission rather than assuming existing behavior is safe; the plan includes explicit ownership checks and regression scenarios.
- Phase 0/1 design artifacts are complete, with no unresolved design questions or constitution violations. No application code has been changed. Next phase: `/speckit-tasks`.