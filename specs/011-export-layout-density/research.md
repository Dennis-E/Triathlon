# Research: Export Layout Density

## Decision 1: Measure filter rows from actual wrapping

**Decision**: Compute each control row from measured label widths and the available content width. Return row starts, row bottoms, and total height, including line padding and inter-row spacing.

**Rationale**: A fixed row estimate cannot represent a one-row block's bottom padding or multiple wrapped rows. Actual row boundaries allow the next block to start after the true rendered bottom.

**Alternatives considered**:
- Add a larger fixed row height: rejected because long control sets still vary.
- Disable wrapping: rejected because it clips controls at narrow widths.
- Reduce font size: rejected because readability is the requested outcome.

## Decision 2: Use one header and remove the footer

**Decision**: Place logo, title, domain, and QR code in one header region and remove footer rectangles and repeated footer elements from the canvas composition.

**Rationale**: The requested export should spend less space on repeated branding and preserve a clear header hierarchy.

**Alternatives considered**:
- Keep footer and shrink it: rejected because the user explicitly wants no footer.
- Duplicate domain in header and footer: rejected because it repeats content and wastes space.
- Remove QR code: rejected because it remains required export metadata.

## Decision 3: Increase typography with layout together

**Decision**: Increase canvas font sizes for metadata and supporting labels, then use the measured row/layout results to reserve enough space for the larger text.

**Rationale**: Font size alone would recreate the overlap and clipping problems. Typography and geometry must be changed as one layout contract.

**Alternatives considered**:
- Increase only the headline: rejected because filters and legends remain unreadable.
- Scale the entire image after drawing: rejected because it does not improve relative readability.

## Decision 4: Use a tighter PB content fit

**Decision**: Give PB tile captures a target-kind-specific content box with intentional small margins, then contain-fit the captured chart within it.

**Rationale**: PB tiles currently inherit a broad generic composition box, producing excessive blank space around their visualization. A tighter PB box improves use of the image without cropping.

**Alternatives considered**:
- Stretch PB charts to fill the box: rejected because it distorts chart geometry.
- Crop chart edges: rejected because labels and records may be lost.
- Change the PB chart renderer: rejected because export composition is the source of the waste.
