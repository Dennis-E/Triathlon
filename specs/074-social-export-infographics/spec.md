# Feature Specification: Social Export Infographics

**Feature Branch**: `074-social-export-infographics`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: Develop all currently exportable views into polished, self-contained social-media infographics for athletes, with a clear personal story, readable data, square and portrait formats, and preview/download parity. Six visualization families receive additional family-specific layouts.

## Clarifications

### Session 2026-10-30

- Q: Wann soll eine Heatmap statt eines gemeinsamen Kartenausschnitts eine Regionsauswahl anbieten? → A: Die Heatmap exportiert exakt den zuvor vom Nutzer durch Scrollen und Zoomen festgelegten Kartenausschnitt.
- Q: Soll der neue Social-Export alle derzeit exportierbaren Ansichten umfassen oder nur die sechs in der Spezifikation genannten Familien? → A: Alle derzeit exportierbaren Ansichten; die sechs genannten Familien erhalten zusätzlich ihre spezifischen Layoutregeln.
- Q: Welche Regel soll Vorrang haben, wenn der exakt vom Nutzer gewählte Heatmap-Ausschnitt im Hochformat weniger als 65 % der nutzbaren Bildhöhe einnimmt? → A: Den exakten Nutzer-Ausschnitt bewahren; die 65-%-Vorgabe gilt nur, soweit dies ohne Beschneiden oder Verzerren möglich ist.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export a complete training story (Priority: P1)

An athlete selects an analysis and wants to export a ready-to-share image that makes the training story and its data understandable without the dashboard.

**Why this priority**: The image must stand on its own in a social feed; an attractive chart without a clear headline, units, or timeframe is not a finished post.

**Independent Test**: Export representative data for every currently exportable view in both formats. Confirm that each image has an accurate headline, its main visualization, and concise context identifying sport, metric, period, and unit, with no application controls; verify the additional family-specific rules for the six named families.

**Acceptance Scenarios**:

1. **Given** a supported analysis with data and selected dashboard filters, **When** the user previews and downloads an export, **Then** the selected filters determine the displayed data and the image explains its sport, metric, period, and unit without printing filter controls or a filter summary.
2. **Given** any currently exportable view, **When** its export is viewed without access to the dashboard, **Then** a short headline, the main visualization, and the necessary context make the subject and data understandable; the six named families also follow their specific layout rules.
3. **Given** a heatmap or scatter plot for which a standalone success statistic would be misleading, **When** the export is composed, **Then** the visualization remains the focal point and no unrelated headline metric is added.
4. **Given** an export image, **When** it is viewed, **Then** it contains no navigation, filter controls, filter overview, generic export copy, or large QR code, and its compact footer shows the logo and readable website address together.

### User Story 2 - Read the post in a social feed (Priority: P1)

A viewer sees the exported image at 360 pixels wide and wants to recognize its main statement and important values without zooming.

**Why this priority**: Social images are commonly viewed on phones; small labels or crowded rankings would hide the personal story the export is meant to share.

**Independent Test**: Display square and portrait exports at 360 pixels wide. Check headline, central value, data labels, context, chart legends, contrast, safe margins, clipping, and overlap.

**Acceptance Scenarios**:

1. **Given** a rendered image at 1080 pixels wide, **When** it is displayed at 360 pixels wide, **Then** the headline, central statement, and essential values remain readable without zoom and no essential text is clipped or overlapping.
2. **Given** data exceeding the supported number of visible ranking or timeline entries, **When** a standard image is exported, **Then** the image shows the defined top selection or a numbered series and clearly communicates that it is a selection.
3. **Given** a visualization with multiple data series, **When** it is exported, **Then** labels, markers, lines, and legend colors agree, and color is not the sole means of distinguishing series.

### User Story 3 - Choose a format and inspect the result (Priority: P2)

An athlete wants to choose a square or portrait composition, inspect the final image, and download that same image as a PNG.

**Why this priority**: Different social placements need different proportions, and an accurate preview prevents surprises after download.

**Independent Test**: Generate both formats from the same data at different application-window sizes; compare the preview and downloaded PNG composition and dimensions.

**Acceptance Scenarios**:

1. **Given** the export controls are opened, **When** no format has yet been chosen, **Then** square is selected by default and portrait is also available.
2. **Given** the user selects square or portrait, **When** the preview and PNG are generated from the same data state, **Then** their respective dimensions are 1080 × 1080 or 1080 × 1350 and the preview matches the downloaded image.
3. **Given** the same format and data state at different application-window sizes, **When** the export is generated, **Then** the composition and content are unchanged.
4. **Given** the user has adjusted a heatmap by scrolling or zooming, **When** the preview and PNG are generated, **Then** both use exactly the viewport the user defined.
5. **Given** required fonts or map resources have not finished loading or fail to load, **When** the user requests an export, **Then** downloading waits for completion or a clear error is shown instead of producing an incomplete image.

### User Story 4 - Add personality without changing the facts (Priority: P2)

An athlete wants a concise, good-humored optional line that makes the image feel personal without making unsupported claims.

**Why this priority**: A small touch of humor can make a post more recognizable, but factual accuracy and a useful humor-free export remain essential.

**Independent Test**: Preview the same supported analysis with the optional line enabled and disabled; verify the headline and data remain accurate and the disabled version remains complete.

**Acceptance Scenarios**:

1. **Given** the optional humor setting, **When** the user toggles it, **Then** only the humorous secondary line is added or removed; the factual headline, data, and visualization do not change.
2. **Given** a humorous line is shown, **When** the export is read, **Then** it is no more than ten words, is not demeaning or guilt-inducing, and does not imply an unsubstantiated performance improvement.
3. **Given** the optional line is hidden, **When** the image is viewed, **Then** the factual headline and visualization still form a complete, understandable post.

### Edge Cases

- No suitable data exists for the selected analysis: explain why in the preview and keep download unavailable; do not treat missing values as zero.
- Only one data point exists: show it meaningfully without implying a trend or inventing a comparison.
- A year is incomplete: label it "YTD" and do not infer improvement from unequal periods.
- Equipment lists exceed the visible limit: equipment rankings show "Top 5 of N" in square or "Top 7 of N" in portrait; a full ranking may be exported as a numbered series. Equipment timelines use a numbered series beyond five or seven rows, with a shared timescale and clear usage-period legend.
- Equipment names or other labels are long: wrap them while preserving their association with rank, value, and period; do not reduce text below the stated minimum sizes.
- A heatmap has distant route regions or a viewport aspect ratio that limits its size: export the exact viewport the user defined through scrolling and zooming, retain required map attribution, and do not crop or distort the map to meet the 65% height target.
- A pace/speed scatter plot has only one represented group or a point-size encoding: identify only represented groups and explain point size when it carries meaning; otherwise use uniform point sizes.
- A resource needed for rendering fails: show an understandable error and do not offer a partial download.
- The optional humorous line is disabled: retain the same factual content and a balanced composition.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The export experience MUST offer square 1080 × 1080 px and portrait 1080 × 1350 px formats, default to square, and provide a preview before PNG download.
- **FR-002**: Preview and downloaded PNG MUST depict the same selected data, format, labels, composition, and fully designed background. The same format and data state MUST produce the same composition independently of application-window size.
- **FR-003**: Every export MUST include a factual headline of at most seven words, the appropriate main visualization or key result, and a concise context line that identifies sport, metric, period, and unit. Selected filters MUST affect the exported data, but filter controls and filter summaries MUST NOT appear in the image.
- **FR-004**: Export images MUST omit application navigation, interactive controls, filter overviews, generic export copy, and the large QR code. They MUST show a compact footer containing the TriAnalytica logo and a readable website address.
- **FR-005**: The composition MUST keep at least 48 px of safety margin at each image edge. The headline MUST be 56–72 px and at most two lines; a suitable central value MUST be 88–120 px; essential values and categories MUST be at least 36 px; axes, legends, and context at least 30 px; and branding and source notes at least 24 px. Text MUST remain unclipped and non-overlapping.
- **FR-006**: Essential text MUST achieve at least 4.5:1 contrast against its background, and meaningful lines, markers, and bars at least 3:1 contrast against adjacent surfaces. Gridlines MUST remain subdued; multiple series MUST not rely on color alone for distinction, and legend colors MUST match their data.
- **FR-007**: A suitable central metric MUST be used only when it represents the analysis. Heatmaps and scatter plots MUST NOT receive an unrelated or fabricated success statistic. The map or chart MUST occupy at least half of the usable image height. A heatmap map MUST occupy at least 65% of that height when possible without cropping, distorting, or changing the user's selected geographic bounds; preserving those bounds takes precedence over the 65% target.
- **FR-008**: Total-distance exports MUST prominently show the total distance and unit for the selected period, followed by a readable period chart. A single image MUST show no more than ten annual bars. Daily or weekly charts MUST use a limited set of readable axis labels. Incomplete years MUST be marked "YTD". The export MUST NOT infer improvement from periods of unequal length.
- **FR-009**: Equipment rankings MUST use horizontal bars with each name and value directly associated. They MUST show no more than five entries in square or seven in portrait; the first rank MUST be highlighted. A capped ranking MUST be labeled "Top 5 of N" or "Top 7 of N" as applicable. A full ranking MAY be offered as a numbered image series. The export MUST NOT combine non-additive measures in an "Other" category.
- **FR-010**: Equipment timelines MUST show no more than five rows in square or seven in portrait. Each equipment name MUST be directly associated with its usage period. Larger lists MUST be available as a numbered image series whose images share the same timescale and scale. The legend MUST state whether marks represent a usage span or individual activities.
- **FR-011**: Personal-best and analogous record exports MUST place the best result prominently above any development chart and identify the discipline or distance, date, and event name when available. They MUST label no more than three distinct milestones: first available record, largest improvement step, and current record. With only one result, they MUST show a complete record card without an artificial trend. Official race times and activity-derived results MUST be distinguished when that source information is available.
- **FR-012**: Heart-rate-versus-pace/speed exports MUST use correctly named axes and units, distinguish pace from speed, and identify every displayed group, color, and trend line. Any meaningful point-size encoding MUST be explained; otherwise points MUST have uniform size. The export MUST NOT claim increased fitness or efficiency based only on point distribution.
- **FR-013**: Heatmap exports MUST use exactly the map viewport previously defined by the user through scrolling and zooming. The preview and downloaded image MUST show the same viewport. Heatmaps MUST use a quiet background that makes routes distinct and retain required attribution.
- **FR-014**: Export copy MUST be in English. Headlines MUST be concise and factual; an optional humorous secondary line MUST be no more than ten words, must not alter facts, and must not imply unsupported achievements, demean slower athletes, or induce guilt about rest or low volume. The export MUST remain complete without that line.
- **FR-015**: Values, units, and rounding MUST be consistent within each image, and all values MUST come from the selected training data. Missing data MUST NOT be represented as zero. If there is no suitable data, the preview MUST explain why and the download MUST be disabled.
- **FR-016**: Any multi-image series MUST consistently identify format, period, metric, and page numbering; all images in a series MUST use a consistent scale where specified.
- **FR-017**: Required fonts and map resources MUST finish loading before download. If a required resource fails, the user MUST receive an understandable error and MUST NOT receive an incomplete export.
- **FR-018**: Export generation MUST remain local in the browser; training data and generated images MUST NOT be uploaded for this feature.
- **FR-019**: The common social-export experience MUST apply to every visualization currently available through an export action, including views outside the six families with detailed rules in FR-008–FR-013. Each such view MUST retain its meaningful visualization and include a factual headline, necessary context, compact branding, both format choices, preview/download parity, and no application controls.

### Key Entities *(include if feature involves data)*

- **Social Export**: A self-contained image for sharing, with a factual headline, visualization, concise context, branding, and an optional humorous line.
- **Export Format**: One of the square or portrait output proportions, each with fixed pixel dimensions and a corresponding composition.
- **Export Series**: A numbered collection of images for data that exceeds a single image's readable capacity, with shared context and scales.
- **Export Context**: Sport, metric, period, unit, and source information needed to interpret the visualization, distinct from interactive filter controls or a filter summary.
- **Visualization Family**: One of total distance, equipment ranking, equipment timeline, personal bests, heart rate versus pace/speed, or heatmap, each with its own data presentation rules.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every currently exportable visualization can be previewed and downloaded in both formats, and the image dimensions are exactly 1080 × 1080 px or 1080 × 1350 px as selected.
- **SC-002**: At 360 px display width, 100% of representative exports show their headline, main statement, and essential values without zoom, clipping, or overlap.
- **SC-003**: In all representative exports, typography meets the specified minimum sizes, edge safety margins are at least 48 px, and specified text and data-mark contrast ratios are met.
- **SC-004**: For matching data and format, preview and downloaded image have matching composition and content, and changing the application-window size does not change the result.
- **SC-005**: The six detailed visualization families meet their specific limits, labels, units, and series rules; all other currently exportable views retain their meaningful content and required context. In 100% of checked exports, titles, legends, units, and displayed data agree.
- **SC-006**: In a five-person hobby-triathlete comprehension test, at least four participants correctly state the image's subject and main point after five seconds.
- **SC-007**: In the same test, the median response to "I would post this image with my own data" is at least 4 out of 5.
- **SC-008**: When no suitable data exists or a required resource fails, no incomplete image can be downloaded and the preview communicates the reason.
- **SC-009**: Training data and generated images remain in the browser and are not uploaded as part of export generation.
- **SC-010**: Heatmap exports in both formats preserve the exact user-selected geographic bounds; the map reaches at least 65% of usable image height whenever this can be done without cropping, distortion, or changing those bounds.

## Assumptions

- The feature changes the export experience and images only; import, dashboard layout, and existing analysis calculations remain unchanged.
- Automatic posting, social-media integrations, and an AI text-generation service are out of scope.
- Dashboard selections continue to determine the data shown. The concise export context communicates the selected sport, metric, period, and unit but does not print the dashboard's filter controls or filter summary.
- The standard equipment ranking is capped at five or seven items; full rankings may be made available as a numbered series. Oversized equipment timelines use a numbered series.
- The six named visualization families have the detailed layouts in FR-008–FR-013; all other currently exportable views use the common social-export structure and retain their meaningful analysis content.
- For heatmaps, the user-defined viewport from scrolling and zooming determines the exported map crop, including when routes span distant regions.
- The existing dark TriAnalytica brand world, turquoise, and purposeful accent colors are retained, with contrast and legibility taking precedence over decorative styling.
- English sample headlines and humorous lines in the request are examples; their sport and metric wording is adapted to the actual analysis and never asserts an unsupported achievement.
- The five-person comprehension and posting-intent checks are feature acceptance activities, not claims about existing user research.