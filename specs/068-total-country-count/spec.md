# Feature Specification: Countries Visited in Lifetime Statistics

**Feature Branch**: `068-total-country-count`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "in der \"total\" visualisierung, zähle die gesamt-anzahl der länder, in denen sport getrieben wurde"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See countries represented in training (Priority: P1)

As an athlete reviewing Lifetime Statistics, I want to see how many different countries my recorded activities reached and which countries they were, so that I can understand the geographic reach of my training at a glance.

**Why this priority**: The requested country total is the primary value of this feature and should be useful without exploring another dashboard view.

**Independent Test**: Load synthetic activities whose routes cover a known set of countries, including repeated routes in one country, and verify that Lifetime Statistics displays the distinct-country count and country names.

**Acceptance Scenarios**:

1. **Given** imported activities with recorded routes in several countries, **When** the user opens Lifetime Statistics, **Then** it displays the number and names of distinct countries represented by those routes.
2. **Given** multiple activities take place in the same country, **When** the country total is calculated, **Then** that country contributes only once to the total.
3. **Given** one recorded activity route crosses an international border, **When** the country total is calculated, **Then** each country reached by the route contributes once to the total.

---

### User Story 2 - Understand location-data coverage (Priority: P2)

As an athlete, I want the country tile to distinguish unavailable location information from a true zero, so that I do not mistake activities without recorded locations for activities in no countries.

**Why this priority**: Location coverage varies across imported activities; clear availability context prevents an incomplete count from appearing to describe the full history.

**Independent Test**: Compare datasets with no route data, complete route data, and a mixture of route-bearing and route-less activities; verify the country tile and its coverage context in each case.

**Acceptance Scenarios**:

1. **Given** no imported activity has usable location data, **When** Lifetime Statistics is shown, **Then** the country tile is identified as unavailable rather than shown as zero.
2. **Given** only some imported activities have usable location data, **When** the tile is shown, **Then** its coverage context identifies how many imported activities are represented.
3. **Given** the country tile is included in the Lifetime Statistics Share/Export image, **When** the user exports the view, **Then** the image shows the same count, names, and availability context as the visible tile.

### Edge Cases

- Repeated activities in the same country contribute that country only once to the overall total.
- A route that passes through more than one country contributes each reached country once, even if it crosses a border repeatedly.
- Activities without a usable recorded route do not contribute to the count.
- If route data is absent for every activity, the metric is unavailable, not a numeric zero.
- If route data is present for only part of the imported history, the count is displayed with an explicit partial-coverage indication.
- Locations that cannot be assigned to a country from the available route data do not create a country entry or cause Lifetime Statistics to fail.
- Changing or replacing the imported activity dataset recalculates the total from the currently loaded data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Lifetime Statistics MUST display the number and names of distinct countries represented by the usable recorded routes of the currently imported activities.
- **FR-002**: Each country MUST contribute at most once to the total, regardless of how many activities or route segments reach it.
- **FR-003**: A recorded route that reaches multiple countries MUST contribute each reached country once to the total.
- **FR-004**: The country tile MUST distinguish a genuine count of zero from unavailable location information; when no usable route locations exist, it MUST identify the count as unavailable.
- **FR-005**: When only some imported activities have usable route locations, the visualization MUST indicate that the country total is based on partial location coverage.
- **FR-006**: The country count, country names, and any availability or coverage context MUST be included in the existing Lifetime Statistics Share/Export image.
- **FR-007**: The country total MUST be recalculated when the currently imported activity dataset changes and MUST NOT be retained as a stale value from a previous dataset.
- **FR-008**: Activity files, route locations, and derived country information MUST remain within the existing local activity-processing experience; this feature MUST NOT send them to a new external service.
- **FR-009**: The country tile, including its names and coverage context, MUST remain legible in Lifetime Statistics on narrow and wide screens.

### Key Entities *(include if data involved)*

- **Activity route**: The recorded geographic path associated with an imported activity, when available.
- **Country total**: The number and display names of distinct countries represented by usable activity routes in the current imported dataset, along with whether location coverage is complete, partial, or unavailable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The displayed country count matches the independently determined distinct-country total for 100% of validation datasets with known route coverage, including repeated and cross-border routes.
- **SC-002**: In 100% of validation cases, the visualization distinguishes unavailable route data and partial route coverage from a complete country count.
- **SC-003**: At least 4 of 5 first-time reviewers can find the Countries visited tile and correctly interpret its count and names within 30 seconds of opening Lifetime Statistics.
- **SC-004**: In 100% of export checks, the Lifetime Statistics image presents the same country count, names, and coverage status as the visible tile.

## Assumptions

- The countries-visited metric belongs to Lifetime Statistics; the separate Distance visualization does not display country counts or country names.
- Countries are determined from recorded GPS route locations already available in imported activity data; an activity's home location or other inferred location is not treated as evidence that it took place in a country.
- A country is counted when usable route locations place an activity route within its mapped territory; regional subdivisions are not counted as separate countries.
- The metric describes countries represented by available GPS routes, not necessarily every country in the athlete's complete training history. Partial coverage must be communicated.
- The existing Lifetime Statistics sharing behavior captures the country tile; no visualization tab or export target is added.
- The visible title of the existing `totalDistance` visualization is changed to “Distance”; its internal navigation identifiers remain unchanged.