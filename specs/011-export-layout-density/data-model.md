# Data Model: Export Layout Density

## Filter Row Layout

| Field | Type | Rules |
|------|------|-------|
| controls | ordered list | Preserves visible control order. |
| availableWidth | positive number | Width available for control labels and padding. |
| rowHeight | positive number | Includes control height and bottom padding. |
| rows | ordered list | Each row has a start, bottom, and control range; rows never overlap. |
| totalHeight | positive number | Includes all rows and inter-row spacing. |

## Export Header

| Field | Type | Rules |
|------|------|-------|
| title | string | Identifies the selected visualization or PB detail. |
| logo | local asset | Preserves source aspect ratio. |
| domain | string | Canonical `https://dennis-e.github.io/Triathlon/`. |
| qrCode | local asset | Appears once in the header. |
| height | positive number | Includes all header content without overlapping title or chart. |

## Export Content Region

| Field | Type | Rules |
|------|------|-------|
| kind | enum | Standard visualization or `pb-tile`. |
| x/y | number | Top-left content origin after the header. |
| width/height | positive number | Bounded region for the captured visualization and metadata. |
| margin | number | Intentional, small margin around the fitted capture. |
| fit | enum | Contain-fit; preserves captured aspect ratio. |

## Compact Composition

The composition contains exactly one header, one visualization/content region, one
metadata region, and no footer region. Domain and QR code belong to the header and are
not repeated elsewhere.
