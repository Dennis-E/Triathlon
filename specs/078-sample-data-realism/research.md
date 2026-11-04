# Research: Realistic Sample Training Data

## Scope

GitHub issue #1 refines the existing fictional Silicon Valley sample history. The repository already has a deterministic offline generator, a committed route catalog and JSON payload, a payload validator, and equipment aggregation utilities. No external service, new dependency, or unresolved product question is required.

## Decisions

### Keep the existing static sample-data flow

**Decision**: Continue generating the public JSON payload offline from the committed route catalog and load it through the existing sample dashboard path.

**Rationale**: This preserves static-site delivery, keeps generation out of visitor sessions, and does not change personal imports or network/privacy boundaries.

**Alternatives considered**: Generating records in the browser or introducing a sample-data service. Both add runtime complexity and are unnecessary for this bounded dataset change.

### Encode seasonal and recovery patterns in the deterministic activity history

**Decision**: Reduce planned sessions during winter recovery periods, adjust indoor distances with the existing seasonal signal, and include one extended recovery gap in the 2023 history.

**Rationale**: Existing activities already carry dates and distances, so current monthly views can show the change without a new field or dashboard behavior. The fixed seed keeps the published data reproducible.

**Alternatives considered**: Add a separate training-load or season entity. That would duplicate information derivable from activities and require changes beyond the issue.

### Preserve the activity shape and infer equipment type from names

**Decision**: Keep equipment as the existing optional activity string, recognize explicit shoe wording in addition to supported shoe brands, and use occasional equipment names on selected trail-route periods.

**Rationale**: The dashboard already aggregates and filters by the equipment name; this fixes the misclassification without a schema migration. Swim sessions with no named physical item remain unassigned to equipment.

**Alternatives considered**: Add a typed equipment registry or a new type field to every activity. Those alternatives expand the payload contract without being needed by the existing summaries.

### Reuse existing validation and tests

**Decision**: Extend `sample-data-utils.test.js` and keep `equipment-utils.test.js` as the narrow regression gate; run the offline generator's `--check` mode for byte reproducibility.

**Rationale**: These checks already cover payload validity, hydration, equipment categorization, and the bundled/generated payload relationship.

**Alternatives considered**: Add a new test runner or external integration test. This change introduces no new runtime boundary that would justify either.

## Research Outcome

No NEEDS CLARIFICATION items remain. No external interface contract is added; the sample payload remains an internal static app resource.
