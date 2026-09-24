# Data Model: Sticky News Header

This feature has no persisted or runtime data model. It defines two page-owned UI
entities and their layout relationship.

## News Header

- **Purpose**: Persistent navigation region for the News page.
- **Contents**: Existing TriAnalytica logo link and `Back to dashboard` link.
- **Behavior**: Remains at the top of the viewport during vertical scrolling and stays
  above page content.
- **Validation**: Both links remain present and usable at supported viewport widths.

## News Content

- **Purpose**: Page heading and published article content below the header.
- **Behavior**: Starts below the persistent header and remains readable while the
  header overlays the viewport's top layer.
- **Validation**: Initial content is not obscured and the page has no header-caused
  horizontal overflow.

## Relationship

The News Header has a fixed viewport position; News Content compensates for the
header's occupied visual height so the two regions do not overlap incoherently.