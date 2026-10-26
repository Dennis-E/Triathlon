# Feature Specification: Equipment Pace Color Selection and Progressive Fire Bars

**Feature Branch**: `TriAnalytica-dev-2`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "equipment: pace - colour option 'on fire' should be a filter possibility like in other visualizations - same UI element as in others. also the on fire should be not unicolour but progressive in the bar and should distinguish between minimum not = 0 but = slowest pace otherwise everything is 'hot'"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose the Equipment Pace Color Scheme (Priority: P1)

As an athlete comparing equipment pace, I want the same color-scheme selector used in other visualizations so I can choose On fire or Monochrome blue instead of receiving an automatic fire-only presentation.

**Why this priority**: Explicit, familiar controls make color an intentional display choice without changing the comparison itself.

**Independent Test**: Open Equipment, select Pace and Shoes or Bikes, and switch between both color schemes. Verify the familiar selector, selected state, and unchanged equipment values and ordering.

**Acceptance Scenarios**:

1. **Given** Equipment Pace with Shoes or Bikes selected, **When** the view opens, **Then** a labeled Color scheme selector offers On fire and Monochrome blue with the same control type, labels, styling, and keyboard interaction as the existing distribution and pie-chart selectors.
2. **Given** On fire is selected, **When** the athlete selects Monochrome blue, **Then** every eligible bar uses the established blue presentation while names, values, units, order, and bar lengths remain unchanged.
3. **Given** Monochrome blue is selected, **When** the athlete selects On fire, **Then** progressive fire bars appear without changing the underlying comparison.
4. **Given** a chosen scheme, **When** the athlete switches between Shoes and Bikes or leaves and returns to Pace during the same loaded session, **Then** the choice is retained.

---

### User Story 2 - Read Meaningful Progression Within Each Fire Bar (Priority: P1)

As an athlete, I want fire colors to progress along each bar and span the actual displayed performance range so that small differences remain distinguishable and the slowest equipment does not already appear hot.

**Why this priority**: A solid color based on distance from zero makes similar real-world paces look uniformly hot and obscures the comparison.

**Independent Test**: Compare three shoes at 6:00, 5:00, and 4:00 min/km, then three bikes at 20, 25, and 30 km/h. Verify a yellow slowest endpoint, an intermediate endpoint, a red fastest endpoint, and visible within-bar progression on bars extending beyond the slowest performance.

**Acceptance Scenarios**:

1. **Given** at least two distinct valid performances within Shoes or Bikes, **When** On fire is selected, **Then** the slowest displayed performance defines the yellow start of the comparison range and the fastest defines its red end; zero is not the color-range minimum.
2. **Given** shoes at 6:00, 5:00, and 4:00 min/km, **When** the bars are displayed, **Then** the 6:00 endpoint is yellow, the 5:00 endpoint is intermediate, and the 4:00 endpoint is red; lower time per distance means faster performance.
3. **Given** bikes at 20, 25, and 30 km/h, **When** the bars are displayed, **Then** the 20 km/h endpoint is yellow, the 25 km/h endpoint is intermediate, and the 30 km/h endpoint is red; greater speed means faster performance.
4. **Given** fire bars sharing a comparison range, **When** the athlete reads a bar from left to right, **Then** it stays yellow through the slowest-performance position and progressively transitions toward its endpoint color beyond that position; equal performance positions have equal colors across bars.
5. **Given** a selection change that changes the displayed valid equipment, **When** the chart updates, **Then** the fire range is recalculated from that displayed comparison set rather than hidden items or a previous selection.

---

### User Story 3 - Keep Other Equipment Views and Shared Images Consistent (Priority: P2)

As an athlete, I want the color choice to affect only eligible Pace views and to remain visible when I share the chart.

**Why this priority**: Display refinements must not change other metrics or remove the existing distinction between shoes and bikes in the mixed view.

**Independent Test**: Choose a scheme, switch to All and to a non-Pace metric, return to a single-type Pace view, and export it using the existing Share/Export action.

**Acceptance Scenarios**:

1. **Given** Pace with either scheme selected, **When** All is selected, **Then** shoes and bikes retain their existing type colors and units, and the color selector is hidden or disabled rather than implying that its scheme applies to the mixed view.
2. **Given** a non-Pace Equipment metric, **When** it is displayed, **Then** its existing colors and behavior remain unchanged and no active Pace-only color control is offered.
3. **Given** an eligible Pace view with a selected color scheme, **When** its existing Share/Export action produces a preview and downloaded image, **Then** both preserve the selected scheme, within-bar progression where applicable, and readable equipment values.

### Edge Cases

- A single valid item or identical valid performances provide no comparative range: all fire bars remain yellow without artificial heat differences, invalid colors, or rendering errors.
- Equal performances within a varied comparison set have identical endpoint colors and matching color progression.
- Missing, zero, negative, or otherwise invalid pace/speed values do not establish color bounds or receive an invented performance; the existing unavailable-data treatment is preserved.
- With no valid performances, the existing empty state remains available and no comparison range is implied.
- Very similar but distinct performances still span yellow to red at the endpoints; no artificial zero baseline compresses them into the hot end.
- Switching through All or another metric retains the selected eligible Pace scheme for the loaded session without applying it to those other views.
- On narrow screens, the selector remains operable and does not obscure chart values or neighboring filters.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Equipment Pace with Shoes or Bikes selected MUST expose the same labeled color-scheme selection control used by the existing distribution and pie-chart views, with On fire and Monochrome blue options and the same interaction and visual conventions.
- **FR-002**: On fire MUST remain the initial scheme for eligible Equipment Pace views. Selecting another scheme MUST update the chart without changing data inclusion, aggregation, ordering, values, units, or bar lengths.
- **FR-003**: The selected scheme MUST persist while changing Equipment filters, metrics, or dashboard views within the current loaded session; persistence after reloading is not required.
- **FR-004**: On fire MUST use a shared yellow-to-red progression within each bar, not a single solid color for each performance. The color at a given performance position MUST be consistent across bars in the same comparison set.
- **FR-005**: The fire color range MUST run from the slowest valid displayed equipment performance to the fastest valid displayed equipment performance within the selected type. It MUST NOT use zero performance as the lower color bound or use hidden items to establish either bound.
- **FR-006**: For a non-degenerate range, the slowest bar endpoint MUST be yellow and the fastest MUST be red. Intermediate endpoint colors MUST progress continuously toward red as performance improves, including when all displayed performances are close together.
- **FR-007**: Each fire bar MUST remain yellow from its origin through the slowest-performance position, then progress along the shared range up to its own endpoint. A bar extending beyond that position MUST exhibit a visible within-bar gradient rather than a uniformly applied endpoint color.
- **FR-008**: Faster performance MUST mean lower time per distance for shoes and higher speed for bikes. Equal performances MUST receive equal color treatment. With one valid performance or identical performances, fire bars MUST remain yellow without implying a ranking.
- **FR-009**: The fire range MUST be recalculated whenever the displayed valid comparison set changes. Invalid or unavailable performances MUST NOT affect bounds, create artificial heat, or replace the established empty/unavailable-data behavior.
- **FR-010**: Monochrome blue MUST use the established blue color convention from the other visualizations and MUST NOT retain fire coloring.
- **FR-011**: All MUST preserve the existing shoe/bike type colors and units. Other Equipment metrics MUST preserve their existing presentation and behavior. The Pace color selector MUST be hidden or disabled whenever its selection does not apply, without discarding that selection.
- **FR-012**: The selector MUST be labeled, keyboard-operable, visibly show the selected option, and remain usable without overlap at desktop and mobile widths.
- **FR-013**: The existing Equipment Share/Export preview and downloaded image MUST preserve the chosen eligible Pace scheme and any within-bar gradients, with names and performance labels readable.

### Key Entities *(include if feature involves data)*

- **Equipment performance**: A valid aggregated pace for a shoe or speed for a bike, associated with its equipment name, type, and displayed bar.
- **Pace color selection**: The athlete's current On fire or Monochrome blue choice, applicable to single-type Equipment Pace comparisons.
- **Displayed comparison range**: The slowest and fastest valid performances currently displayed for one equipment type, defining the shared fire progression independently of the chart's zero-based bar origin.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Both supported schemes can be selected through one familiar labeled control and appear in the chart within one second of selection for a comparison of 100 equipment items on the same reference device used for acceptance testing.
- **SC-002**: In 100% of acceptance comparisons with distinct valid performances, including tightly clustered values, the slowest endpoint is yellow, the fastest is red, and every faster-than-slowest bar visibly progresses within its fill.
- **SC-003**: In 100% of acceptance comparisons for shoes and bikes, endpoint colors rank performance in the correct direction, equal performances match, and single-item/equal-value sets show no artificial heat ranking.
- **SC-004**: In 100% of scheme-switching checks, equipment names, values, units, order, and bar lengths remain unchanged; All and non-Pace views retain their previous presentation.
- **SC-005**: The selector and its options are reachable and usable by keyboard and at 375 px and 1280 px viewport widths without overlapping adjacent controls or chart labels.
- **SC-006**: For each supported scheme, the shared preview and downloaded image match the chosen chart colors; On fire gradients and equipment values remain visible in both outputs.

## Assumptions

- This feature follows feature 066 and supersedes its automatic fire-only behavior and assumption that no color selector is needed. Its clarified rule that All retains type colors remains in effect.
- "Filter possibility" means a display color-scheme choice, not filtering activities or equipment out of the comparison.
- The existing distribution and pie-chart Color scheme selectors define the expected control and option naming. Monochrome blue is the existing alternative to On fire; no additional palettes are introduced.
- "Minimum = slowest pace" describes the color scale, not a request to truncate the bar axis or change relative-speed bar lengths. The existing relative-speed comparison remains unchanged.
- Fire progression follows comparable speed positions within one equipment type. It does not compare shoes directly with bikes or require equal pace differences to have equal color differences.
- There is no comparative evidence of high performance when only one distinct performance exists, so yellow is the neutral fire fallback.
- The existing imports, performance aggregation, local processing boundaries, and Share/Export flow are dependencies, not new capabilities. No new visualization tab, external service, data retention, or import behavior is in scope.