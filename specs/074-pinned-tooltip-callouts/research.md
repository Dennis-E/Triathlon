# Research: Pinned Tooltip Callouts

## 1. Lifetime Statistics Activation

**Decision**: Remove pinMarkup() buttons in src/dashboard-lifetime-statistics.js and move inspection to keyed statistic content targets using the existing delegated bindStatisticDetails() path.

**Rationale**: Current cards and sport rows are not themselves activatable; merely removing buttons would remove the only activation path. statisticDetails already contains reusable content and stable keys such as sport:Run. These items have no competing primary action. Use data-statistic-key and data-tooltip-inspector on a suitable focusable content target, with an accessible button interaction and pressed state; preserve table semantics and existing focus styling.

**Alternatives considered**: Hide the pin icon but leave a separate invisible button (poor discoverability); disable Lifetime pinning (contradicts the spec); change pin controls in every view (unnecessary and risks media/wordcloud/PB primary actions).

**Verification**: Extend the existing lifetime-statistics-dashboard harness for markup and delegated pointer/keyboard activation. Test replacement clears the old origin's selected state and rerender/dismiss does not focus a detached origin. Shared controller changes are limited to that directly affected state contract.

## 2. Text Fitting And Bubble Geometry

**Decision**: Retain computeTooltipAnnotationLayout() and computeExportContentLayout() public contracts. Add an additive pure computeTooltipCalloutLayout() export to src/export-utils.js that owns candidate text sizing, geometry, and placement fallback; dashboard-export.js owns Canvas drawing.

**Rationale**: Existing text fitting supports full content, wrapped complete headlines, missing-value content, and association notes, and throws RangeError when readable compact text cannot fit. Existing composition reserves a bottom annotation strip and draws its full width even though measured text width is available. A bounded body and four-side placement solve the requested presentation without a rendering library.

**Alternatives considered**: Restyle the existing bottom strip (still detached); render live tooltip DOM into every export (breaks isolated-layout placement and adds controls); new geometry dependency (unnecessary for four rectangular candidates).

**Decision**: Do not reserve a bottom annotation strip. Use the existing no-pin visualization fit, bounded content-sized bubble widths, protected header/legend/branding rectangles, and anchor clearance. Full text that fits dimensionally but has no valid placement must also trigger headline fallback. If headline plus mandatory association note cannot fit, report failure.

**Rationale**: Dimension-only fallback can produce an unreadable overlap despite passing a text-height check. The body may cover unselected data, but cannot obscure its own selected item or protected export regions.

## 3. Accurate Export Anchors

**Decision**: Add an export-only resolveExportAnchor(selection, captureContext) adapter contract, resolved from the isolated capture layout. Reuse adapter data identities rather than live viewport positions.

**Rationale**: normalizedPoint is viewport-relative. Chart capturePoint currently describes a canvas, not necessarily its enclosing capture target. Pie exports resize their canvas; map export temporarily changes map dimensions. Lifetime, calendar, PB, media, and wordcloud lack equivalent capturePoint metadata. Correct speech-bubble tails therefore require explicit source-to-capture transforms, not blind multiplication by final image dimensions.

**Alternatives considered**: Reuse normalizedPoint (wrong coordinate frame); apply canvas coordinates directly to wrapper images (wrong offsets); mark every unresolved anchor as not-in-export (misleading when the item is present); point at a generic center (false association).

**Decision**: Support all 13 tab targets and the PB-detail variant. Lifetime sport rows excluded from KPI capture and media items genuinely omitted from a collage use not-in-export with an explicit identity note. Off-screen map selections retain outside-view. Wordcloud selections must resolve the rendered word, not the inspection-list position.

**Rationale**: A truthful non-pointing bubble is valid only when the item really is outside or absent; missing projection for present content remains an implementation failure to fix.

## 4. Snapshot And Resource Ownership

**Decision**: Preserve exportVisualizationTarget() synchronous selection snapshot and createExportCaptureSnapshot() resource isolation. Resolve layout using request-owned capture resources; store only plain resolved geometry in the immutable composition target.

**Rationale**: Current capture copies canvas pixels explicitly, strips interactive overlays, fixes image sources, and uses independently owned media leases. Preview and download share one prepared PNG. Reading live layout after await or reusing live object URLs would reintroduce selection/data races unrelated to bubble appearance.

**Alternatives considered**: Recompute selection during preview/download (racy); second composition for download (can diverge); borrow live media URLs (revocation races); move all capture logic to a new abstraction (unnecessary scope).

## 5. Validation Strategy

**Decision**: Extend existing tests instead of adding a new test framework or duplicate suites. Use deterministic geometry assertions, real composition Canvas spies, per-target projection tests, and desktop/mobile browser inspection of generated PNGs.

**Rationale**: Jest uses Node, not jsdom. The current pinned snapshot test mocks composition, so it cannot prove that the correct bubble body and tail were drawn. Existing VM and fake-document harnesses are the appropriate integration style; actual image inspection detects projection errors that text-only assertions miss.

**Alternatives considered**: Rely only on snapshot immutability tests (does not exercise pixels); add jsdom (unnecessary environment change); use personal exports as committed fixtures (privacy violation).

All research questions are resolved. No dependency or architecture change requires user clarification. Exact contracts are in [contracts/pinned-callouts.md](contracts/pinned-callouts.md).