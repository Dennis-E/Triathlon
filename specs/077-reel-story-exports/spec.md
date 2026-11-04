# Feature Specification: Reel / Story Export Layouts

**Feature Branch**: Not created; specification directory is independent of Git branch.

**Created**: 2026-11-03

**Status**: Draft

**Input**: Improve the full TriAnalytica image-export surface for Instagram Reels and Stories with dedicated 1080 x 1920 layouts, faithful data, phone readability, optional humour, and matching previews and downloads.

## Clarifications

### Session 2026-11-03

- Q: In which browsers must the complete export, including preview and download, work as a binding acceptance requirement? -> A: Option A: Chrome and Edge on desktop, using the current stable versions at acceptance; verify phone readability using exported image files. Other browsers and end-to-end mobile export are not required release gates.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Share Any Visualization as a Reel / Story Image (Priority: P1)

As an amateur triathlete exploring training on a desktop, I can export any shareable visualization as a finished vertical image that another athlete can understand on a phone.

**Why this priority**: Full coverage and deliberate vertical composition are the core value; adding a tall format to only a few charts does not meet the need.

**Independent Test**: Select each exportable view and detail variant in the inventory, choose Reel / Story, and inspect its downloaded image at full resolution and at phone size.

**Acceptance Scenarios**:

1. **Given** any populated exportable visualization, **When** I choose `Reel / Story · 9:16`, **Then** I receive a 1080 x 1920 image with a concise headline, necessary context, a content-specific visualization, and legible TriAnalytica branding.
2. **Given** charts of different structures, **When** I compare their exports, **Then** each preserves its own chart relationships and character while sharing typography, colour semantics, spacing, and branding principles.
3. **Given** sparse or dense content, **When** I export, **Then** the layout remains balanced and readable without inventing observations, stretching marks, hiding interpretive information, or shrinking everything into a fixed desktop-shaped rectangle.
4. **Given** an existing square or portrait export, **When** I open format selection, **Then** `Square · 1:1` and `Feed portrait · 4:5` remain available at 1080 x 1080 and 1080 x 1350 respectively.

---

### User Story 2 - Share the Correct Training Story (Priority: P1)

As an athlete, I can trust the export to describe my actual selected data without misleading claims or unnecessary personal details.

**Why this priority**: A polished image that changes the meaning of training data is not a valid export.

**Independent Test**: Compare exports with known reference datasets and selected filters, including non-default metrics, partial periods, synthetic data, and privacy-sensitive content.

**Acceptance Scenarios**:

1. **Given** a selected sport, period, metric, units, aggregation, and other active visualization settings, **When** I export, **Then** chart values and explanatory copy reflect that exact selection, not dataset-wide defaults.
2. **Given** a partial year, non-distance equipment ranking, or filtered record history, **When** a headline or summary appears, **Then** it makes no unsupported all-time, mileage, trend, comparison, or record claim.
3. **Given** synthetic example training data, **When** I preview or download any page, **Then** the image visibly identifies it as `Synthetic sample training data`.
4. **Given** activity titles, map locations, or pinned inspection details, **When** I export, **Then** no tooltip or inspection overlay appears and no additional titles or precise locations are disclosed beyond the existing explicitly selected, user-controlled content.

---

### User Story 3 - Download Exactly the Image Reviewed (Priority: P1)

As an athlete, I can review the whole image, change its format or caption, and download the image I actually approved.

**Why this priority**: A stale or cropped preview undermines both accuracy and confidence in sharing.

**Independent Test**: Change formats, captions, and series pages rapidly, download during and after updates, and compare the resulting files with the latest completed preview.

**Acceptance Scenarios**:

1. **Given** an open export preview in a supported desktop browser at desktop or phone-sized viewport dimensions, **When** the image is displayed, **Then** the entire image is visible without cropping or distortion and its native dimensions correspond to the chosen format.
2. **Given** a preview, **When** I change format or humour, **Then** the preview updates using the same captured visualization and filters without changing the dashboard selection.
3. **Given** several overlapping updates, **When** they finish out of order or I attempt a download before completion, **Then** an obsolete image cannot replace the latest choice or be downloaded as that choice.
4. **Given** a ready preview, **When** I download, **Then** the image matches its content, page, layout, styling, and native dimensions; display scaling is the only preview difference.
5. **Given** a multi-image export, **When** I review and download a page, **Then** the file is that exact page, all pages are reachable, and ordering and scope are clear.
6. **Given** generation or saving fails or is cancelled, **When** I retry, **Then** I receive a clear outcome and cannot accidentally save an older image as the failed selection.
7. **Given** an export fails after dashboard filters or the dataset have changed, **When** I retry, **Then** the same captured selection is used if still available; otherwise download remains blocked with an explanation, and only an explicit new export request starts a new session using the current selection.

---

### User Story 4 - Choose a Little Humour (Priority: P2)

As an athlete, I can add one short, relevant, friendly caption or share a clean data-only image.

**Why this priority**: Humour adds personality but must remain optional and subordinate to the visualization.

**Independent Test**: Toggle humour on and off for every inventory entry, including Pace vs metrics and every available sport/equipment mode, then compare previews and downloaded files.

**Acceptance Scenarios**:

1. **Given** any exportable visualization, **When** humour is enabled, **Then** exactly one short relevant line appears, including for views or filter combinations that previously supplied none.
2. **Given** humour is disabled, **When** I view the image, **Then** the caption and its reserved space are absent and the composition rebalances.
3. **Given** a caption is shown, **When** I compare it with the selection, **Then** it is friendly and self-aware, makes no unsupported data claim, and neither obscures data nor reveals private details.

### Edge Cases

- No data, unsupported metrics, unavailable source fields, or content still loading: explain why export is unavailable or wait for readiness; never create a blank or stale image.
- One observation, one record, one equipment item, one calendar year, or one media item: retain truthful scales, time spans, and proportional encodings without inventing a trend or filling the canvas with exaggerated marks.
- Many observations, categories, years, records, or media items: preserve interpretation through content-specific arrangement, selective nonessential annotations, or clearly scoped continuation images, not unreadable shrink-to-fit.
- Long equipment names, large values, long legends, and translated labels: wrap or reorganize without overlap, ambiguous truncation, or unit loss.
- Pace versus speed, inverted pace scales, mixed sports, zero values, missing measurements, and ties: retain existing semantics and distinguish missing from zero.
- Map zoom, viewport, palette, route extent, and attribution: retain the selected geographic story without stretching geography, inventing coverage, or introducing precise labels not selected for sharing.
- Leap years, incomplete current years, calendar intensity legends, and split periods: retain date alignment, meaningful colour scales, and explicit partial-period context.
- Humour, provenance notices, long context, and legends compete for room: reflow or paginate rather than remove essential context or violate the safe area.
- Pinned or hovering details: exclude inspection overlays, even when present in the dashboard at export time.
- A dataset replacement, filter change, close/reopen, delayed media load, or delayed previous render occurs during export: maintain one coherent captured selection; new exports use the new selection and old work cannot overwrite them.
- Media with unreadable assets or video sources: preserve the existing readable-asset selection rules and still-image representation; report failures without substituting unrelated images.

## Requirements *(mandatory)*

### Functional Requirements

#### Coverage and Formats

- **FR-001**: Every current export target and user-accessible detail or generated variant in [export-inventory.md](export-inventory.md) MUST support 9:16. This includes Distance, Pace vs metrics, Equipment ranking, Equipment Timeline, Personal Best details and their registered overview target, GPS Heatmap, Distributions, Workout Time, Training Calendar, Workout Title Wordcloud, Pie Charts, Lifetime Statistics, and Media Gallery annual recaps and collages.
- **FR-002**: Format selection MUST clearly distinguish `Reel / Story · 9:16` (1080 x 1920), `Square · 1:1` (1080 x 1080), and `Feed portrait · 4:5` (1080 x 1350). All outputs remain still PNG images, not videos or direct social posts.
- **FR-003**: Every visualization added later with image export MUST meet these same format, layout, integrity, caption, preview, and review requirements. Its variants MUST be added to the inventory and release-review matrix before it is considered complete.

#### Shared Layout Contract

- **FR-004**: Each image MUST have a clear reading order: concise truthful headline, necessary selection context, primary visualization, and TriAnalytica branding. Supporting context and an optional caption MUST remain subordinate to the visualization, with no repeated metadata that adds no meaning.
- **FR-005**: The 9:16 composition MUST be designed for that ratio, using additional height for readable chart detail, larger useful visual content, label spacing, or meaningful separation. Stretching a chart, adding blank background around an unchanged desktop capture, and applying one fixed chart rectangle to every visualization MUST NOT qualify.
- **FR-006**: Essential chart content, text, values, legends, provenance, attribution, and branding in 9:16 MUST stay inside the central rectangle from x=72 to x=960 and y=240 to y=1560, measured from the image's top-left. Only nonessential background may extend outside it. This is a conservative product safe area, not a guarantee against every Instagram overlay.
- **FR-007**: At a whole-image display size of 360 x 640, essential labels, units, values, context, captions, and branding MUST be readable without zoom. Essential text MUST be at least 36 pixels in the 1080-pixel-wide source image (12 pixels at that display size); text contrast MUST be at least 4.5:1 against its actual background. Headings and key values MUST have visibly greater emphasis. Size alone does not replace the required visual review.
- **FR-008**: Exports MUST retain a consistent athletic, confident, clear visual identity and recognizable TriAnalytica branding across formats. Playfulness MUST be confined to optional copy or appropriate visual emphasis, not decorative clutter. Desktop controls, filter buttons, hover tooltips, pinned inspection callouts, selection handles, and unrelated interface decoration MUST NOT appear.
- **FR-009**: Layout-induced overlaps that obscure essential chart content, labels, values, legends, or branding, and clipping of essential content, MUST NOT occur. Natural overlap between data marks at their faithful plotted positions is allowed; observations MUST NOT be shifted, altered, or removed merely to separate those marks. Long labels MUST be accommodated by reflow, spacing, or a suitable alternative composition, not by reducing essential text below FR-007 or silently removing meaning.
- **FR-010**: Sparse layouts MUST balance the available information with intentional spacing and truthful scale, rather than enlarging isolated marks to suggest greater volume or unsupported relationships. Dense layouts MUST simplify only nonessential labels or annotations, or use explicit continuation images when necessary; no unannounced data truncation is permitted.

#### Content-Specific Composition

- **FR-011**: Time-based Distance charts MUST preserve chronological order, selected aggregation, period coverage, sport stacking, units, and partial-period indicators. Additional height MUST improve plotting and label separation; no selected years or intervals may silently disappear.
- **FR-012**: Pace vs metrics MUST preserve both axes, sport-specific pace/speed units and direction, selected years and visible series, trend visibility, and point-size meaning. Vertical arrangement MUST make those encodings readable without changing the apparent relationship through arbitrary distortion or dropping observations.
- **FR-013**: Equipment rankings MUST preserve selected metric, ordering, ties, categories, and displayed values. Row spacing and label/value placement MUST adapt to item count and name length; a deliberately limited top subset MUST explicitly state its scope and total rather than imply completeness.
- **FR-014**: Equipment timelines MUST preserve activity-marker versus usage-span mode, equipment selection, chronology, and gaps. Additional height MUST support readable rows. Continuation images MUST retain a common time scale and clear page and subset context.
- **FR-015**: Personal Best exports MUST cover all currently exportable distance, longest-session, elevation, power-duration, and all-time power-profile details. They MUST preserve the selected record definition, value and unit, record chronology or duration axis, and relevant source attribution. One-record histories MUST NOT imply improvement; the overview target, where exposed, MUST retain interpretable record grouping.
- **FR-016**: GPS Heatmap exports MUST preserve selected sport, year, map view, palette, route relationships, density meaning, and required attribution. The map MUST use the available vertical composition deliberately while keeping geographic proportions and the selected extent, without silently zooming to a different story. A truthful map may require spacing or context rather than stretching or cropping routes.
- **FR-017**: Distribution exports MUST preserve selected sport, metric, bins, units, axis semantics, and frequencies; Workout Time exports MUST preserve selected granularity, period, sport, count/duration/distance measure, and temporal pattern. Their distinct distributions and encodings MUST remain distinguishable after reflow.
- **FR-018**: Training Calendar exports MUST preserve day/date alignment, year and month context, sport selection, palette, and intensity meaning. Years or months MAY be arranged vertically or continued across clearly ordered images; they MUST NOT become illegible miniatures or imply that missing dates are zero-training dates.
- **FR-019**: Workout Title Wordcloud exports MUST preserve included terms and their relative frequency emphasis, using a tall composition without inventing words or changing weighting. This existing explicitly title-derived view is not permission to add activity titles to other exports.
- **FR-020**: Pie Chart exports MUST preserve selected grouping, slice-size measure, sport, period selection, category proportions, colours, values, and legend mapping. A vertically arranged chart and legend MUST remain readable without turning the circular chart into an ellipse or silently combining categories.
- **FR-021**: Lifetime Statistics exports MUST preserve the meaning and scope of currently exported totals, milestones, equipment counts, and country summary where available. Their hierarchy MUST adapt to a vertical summary rather than shrink the existing multi-column overview; missing fields MUST not be presented as zero or fabricated accomplishments.
- **FR-022**: Media Gallery annual recaps and collages MUST receive deliberate vertical compositions preserving the explicitly selected or filtered media set, chronological meaning where applicable, route-inclusion choice, and still-image treatment of video sources. Reformatting MUST NOT silently change item selection or introduce new activity titles, filenames, or precise location details. Existing selection limits MUST be disclosed rather than imply that a recap contains all media.

#### Integrity, Privacy, and Captions

- **FR-023**: Each image MUST reflect one coherent captured visualization selection: data, active filters, period, metric, units, aggregation, visible series, and relevant view settings. Format or humour changes MUST reuse that selection and MUST NOT mutate dashboard state. A newly requested export MUST use the then-current selection.
- **FR-024**: Headlines, context, summaries, and captions MUST use only supported facts from that captured selection. They MUST NOT invent insights, comparisons, trends, records, or complete-period claims. Dates and units needed for interpretation MUST be explicit; neutral literal headlines MUST be used when a stronger claim is unsupported.
- **FR-025**: Exports MUST NOT introduce activity titles or precise location details unless the existing export supports their user-controlled inclusion and that inclusion is selected. Existing intentionally shared wordcloud content, selected map content, and opted-in media routes remain subject to that choice; metadata, callouts, and copy MUST NOT add new disclosure.
- **FR-026**: Every exported image and continuation page using synthetic training data MUST visibly include `Synthetic sample training data` inside the safe area, in preview and download. Required source and map attribution MUST remain legible as well.
- **FR-027**: One humour control MUST behave consistently for every exportable visualization and variant. Enabled means exactly one short, relevant, friendly, self-aware line; disabled means no line and no empty caption slot. Captions MUST fit on one readable line and MUST NOT obscure data, mock athletes, disclose private details, or imply unsupported conclusions. Humour remains off by default.
- **FR-028**: Training data, media preparation, composition, preview, and download MUST continue to be processed locally in the browser without uploading personal training data or images for export. This does not claim that the entire application makes no network requests; existing asset and map dependencies remain distinct.

#### Preview and Download

- **FR-029**: Users MUST be able to select a format, view the entire uncropped image at its correct aspect ratio, and download the displayed image in Chrome and Edge on desktop, using the current stable versions at acceptance. In those browsers, preview containment MUST work at desktop and phone-sized viewport dimensions without hiding the image behind controls. Phone readability MUST be verified using exported image files; other browsers and end-to-end mobile export are not required release gates.
- **FR-030**: A format or caption change MUST update the preview. While an update is pending, downloading the superseded image as the new selection MUST be prevented. Only the latest requested, successfully completed selection may become downloadable; delayed earlier updates MUST NOT overwrite it.
- **FR-031**: Preview and downloaded image MUST match in content, layout, intrinsic pixel dimensions, and styling. A save operation MUST remain tied to the image and page shown when download was requested, even if later choices change. Native dimensions MUST be independent of screen size and display density.
- **FR-032**: Continuation images MUST retain format, captured filters, caption setting, provenance, branding, meaningful scale consistency, page order, and clear scope. All pages MUST be previewable and individually downloadable with distinguishable filenames. Changing format MUST recompute pagination where needed without losing content.
- **FR-033**: Empty, unfinished, failed, or invalidated exports MUST produce a clear unavailable/error state and MUST NOT permit blank, corrupted, or obsolete downloads. Users MUST be able to retry or close without changing their selected visualization or filters. Retry MUST reuse the same captured selection, never silently recapture current dashboard data. If that selection or its required sources are no longer available, download MUST remain blocked with an explanation; only an explicit new export request may start a new session with a new selection identity using the current dashboard selection.

### Key Entities *(include if feature involves data)*

- **Exportable visualization**: A shareable view or detail variant with its own data relationships, meaningful encodings, selection context, and layout needs; includes future additions.
- **Captured selection**: The coherent data and filter state approved for one export session, including privacy choices, visible series, provenance, units, and aggregation.
- **Export format**: A labelled aspect ratio with fixed output dimensions and format-appropriate composition and safe area.
- **Export presentation**: Headline, necessary context, visual content, legend, optional caption, provenance, attribution, and branding describing the captured selection.
- **Export image series**: One or more ordered images covering explicitly stated content without unreadable compression or silent loss.
- **Preview revision**: The latest requested format/caption/page presentation and its readiness; only a matching ready image can be downloaded.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the 13 registered export targets and every reachable detail/generated variant in the inventory support 9:16; every downloaded 9:16 file measures exactly 1080 x 1920. Square and feed portrait remain exactly 1080 x 1080 and 1080 x 1350.
- **SC-002**: Every case in the visual-review matrix passes full-resolution and 360 x 640 whole-image review for 9:16, with zero layout-induced overlaps obscuring essential content, clipping, safe-area violations, or unreadable essential text. Natural overlap between faithfully positioned data marks is not a failure and MUST NOT be removed by shifting, altering, or dropping observations. Existing formats receive equivalent whole-image readability and clipping checks.
- **SC-003**: Every reviewed family demonstrates deliberate vertical composition through useful plotting space, readable rows, separated legends, vertical grouping, or date/media arrangement. No family passes solely by showing an unchanged landscape capture on taller background.
- **SC-004**: Reference-data checks show zero unsupported claims or changes in values, units, period, filters, aggregation, ordering, proportions, or essential scale meaning across all tested exports. Every synthetic-data page is visibly identified.
- **SC-005**: In every tested format/caption/page change and out-of-order completion case, the downloaded image matches the approved preview revision and dimensions; zero obsolete exports are downloadable as the latest choice.
- **SC-006**: Every export variant passes humour-enabled and humour-disabled review: exactly one relevant readable line when on, none and no reserved gap when off; preview and download agree in every case.
- **SC-007**: In a review with at least five amateur endurance athletes, at least four can identify the subject, period, metric/unit, and main visible takeaway of each visualization family after a five-second phone-size view, without relying on fabricated narrative. At least four rate clarity and willingness to share at 4 or higher on a five-point scale for each family.

### Visual Review and Acceptance Evidence

The release review MUST cover the complete inventory, not only Distance, Equipment, and Personal Bests. Evidence MUST consist of actual downloaded image files, not only dashboard or modal screenshots.

1. Maintain one review-matrix row per registered target and per reachable Personal Best definition, power profile, media annual recap/collage, and continuation-page variant. Record selected data, filters, metric, units, period, format, caption state, expected scope, and actual file dimensions.
2. For every reachable variant, export sparse and dense reference cases in all three formats with humour both enabled and disabled. Sparse means the minimum meaningful nonempty content; dense means enough observations, labels, categories, years, records, or media to exercise its layout limit. Mark genuinely inapplicable density cases with a reason, never silently skip the variant.
3. Cover every available metric, aggregation, sport, grouping, and display mode across the review set, including non-default options. Include long labels, large values, missing fields, partial years, hidden/visible trend series, inverted pace, multi-year calendars, map viewport preservation, and routes on/off where supported. The full Cartesian product of unrelated filters is not required.
4. Inspect each actual file at its native resolution and as a whole image scaled to 360 pixels wide (360 x 640 for 9:16, 360 x 450 for 4:5, 360 x 360 for square). Review once without and once with a safe-area/Instagram-overlay simulation. Check all essential marks, text, values, legends, branding, and provenance against FR-006 through FR-010 and the corresponding family rules.
5. Record a family-specific reason the taller composition improves readability or content hierarchy. Dense continuation cases MUST include first, middle where present, and last pages; verify the entire series has no unannounced omissions or duplicates and retains meaningful scales.
6. In both Chrome and Edge on desktop, using the current stable versions at acceptance, compare downloaded files with their completed previews for identical visual content and native dimensions, allowing only display scaling. Exercise rapid format and caption changes, page changes, download during updates, close/reopen, new filters/datasets, failed renders, and save cancellation. Record browser versions and verify preview containment at desktop and phone-sized viewport dimensions. Verify phone readability using the exported files as described in step 4; real mobile-browser export and other desktop browsers are not required release gates.
7. Include real-data-shaped synthetic fixtures with visible provenance in every family and privacy-sensitive synthetic titles/coordinates to check disclosure boundaries. Do not publish personal training data as review evidence.
8. Each row MUST record pass/fail, artifact references, observed defects, and reviewer sign-off. Unreviewed exports, failed acceptance criteria, missing variant coverage, and placeholders are release blockers. Extend this matrix whenever another exportable visualization is added.

## Assumptions

- This feature changes image exports and their preview experience, not dashboard navigation, chart definitions, analytical calculations, import behaviour, or available data sources.
- The existing square selection remains the initial default; users explicitly choose Reel / Story. No new session-persistence preference is required.
- Binding browser acceptance covers current stable Chrome and Edge on desktop. Phone-size layout checks use those browsers at narrow viewport dimensions, and phone readability uses actual exported files; no end-to-end mobile export or additional browser certification is required.
- Instagram sharing means downloading a still image for the user's own Reel or Story workflow. Video encoding, sound, posting integrations, accounts, and automated publishing are out of scope.
- The conservative 9:16 safe area and 360-pixel-wide phone review are product defaults chosen to make acceptance repeatable. Platform overlays vary; changes to these defaults require updating the documented acceptance dimensions, not silently loosening them.
- Existing square and 4:5 dimensions, privacy behaviour, image-series support, and local download workflow remain supported. Their layouts may reflow as needed for shared readability, integrity, and caption requirements; the 9:16 safe-area coordinates do not apply to shorter formats.
- Explicitly scoped top rankings and current media selection limits may remain if disclosed. Other selected data must not be silently truncated; continuation images are available when one image cannot preserve legibility and meaning.
- Excluding pinned inspection callouts from social images is intentional for this feature, even though the current exporter can include them. It does not remove dashboard inspection or introduce a new export disclosure control.
- Successful image generation depends on the selected visualization and required fonts, media, map content, and branding assets being ready. Existing user-facing errors and retry behaviour must remain meaningful; no server-side export service is introduced.
- The current Personal Best overview is a registered export target without a visible overview export button. Its registration is covered, but adding a new overview button is not required; existing detail actions remain the user-facing path.