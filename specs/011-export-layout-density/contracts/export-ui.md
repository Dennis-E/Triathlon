# Export Layout Density Contract

## Filter Rows

- Control labels wrap into rows based on available width.
- Every row includes its full control height, text baseline, and bottom padding.
- The next row starts after the prior row's actual bottom plus spacing.
- Filters and legends begin only after the final control row has finished.

## Typography

The export uses larger readable typography for the title, active filters, available controls,
legend, domain, QR-adjacent text, and supporting labels than the previous compact layout.
Larger text must remain inside its assigned region.

## PB Content

For `pb-tile` exports, the selected chart is contain-fitted into a tighter content region
with intentional small margins. The chart is not stretched, clipped, or surrounded by
unnecessary blank space.

## Header-Only Composition

The generated preview/download contains:

- One header with TriAnalytica logo, title, canonical domain, and QR code.
- The selected visualization and its metadata below the header.
- No separate footer rectangle, footer logo, repeated domain, or repeated QR code.

All regions remain non-overlapping at supported desktop and narrow sizes.
