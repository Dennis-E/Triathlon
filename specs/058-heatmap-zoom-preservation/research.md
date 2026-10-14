# Phase 0 Research: Heatmap Zoom Preservation

## Decision 1: Fit route bounds only for a new dataset's first non-empty map render

- **Decision**: Keep the existing initial `fitBounds()` when a dataset first has visible
  GPS-backed routes. Mark a fit as pending when the imported dataset identity changes, and
  consume that pending fit only after valid route bounds are available. Sport-filter changes
  and repeated heatmap-tab renders for the same dataset update route segments and legend but
  do not fit bounds.
- **Rationale**: The current map instance and custom canvas layer already remain alive during
  a filter change. Re-running `fitBounds()` after every render is what changes center/zoom.
  A pending-fit state preserves the established initial framing, handles an initially empty
  sport filter, and retains the current behavior of fitting a subsequently imported dataset.
  Dataset identity is already represented by the imported dataset object managed by the
  dashboard state/import flow; comparing the current reference avoids coupling the heatmap
  script back to the import orchestrator.
- **Alternatives considered**:
  - Capture center/zoom on every filter change and restore after fitting: rejected because
    avoiding the unnecessary fit is simpler and also avoids camera changes during tab revisit.
  - Fit only when the Leaflet map instance is first created: rejected because an imported
    replacement dataset can reuse the existing map instance and still needs its established
    initial framing.
  - Reset the Leaflet map instance for each new import: rejected because destroying and
    rebuilding the map is unnecessary and risks event/listener and rendering regressions.

## Decision 2: Keep empty-result and visibility lifecycle unchanged

- **Decision**: When the active filter yields no GPS routes, retain the existing empty-state
  display and hide the map container without clearing the Leaflet instance or consuming a
  pending initial fit. When a later filter has routes, update the existing route layer and
  legend, show the map, and preserve its viewport unless the pending fit is for a new dataset.
  Keep the existing delayed `invalidateSize()` after showing the map.
- **Rationale**: The map's in-memory view survives hiding its container. This is necessary to
  satisfy empty-filter transitions while preserving current no-data feedback.
- **Alternatives considered**:
  - Destroy or reset the map when no route matches: rejected because that discards the exact
    view users need when returning to a populated filter.
  - Change the no-GPS-data empty state or legend behavior: rejected as outside scope.

## Decision 3: Validate with narrow Jest coverage and browser interaction checks

- **Decision**: Add focused dashboard render-lifecycle coverage using the existing Node/Jest
  environment and controlled DOM/Leaflet stubs. Retain the heatmap-utils and inline-script
  syntax suites, and document real map/filter/empty-state checks in `quickstart.md`.
- **Rationale**: The behavior belongs to the global DOM/Leaflet orchestrator and is not
  covered by pure heatmap utility tests. Stubs can assert fit eligibility and route updates;
  browser checks validate the actual map viewport, hidden-to-visible sizing, and interaction.
- **Alternatives considered**:
  - Add a browser test framework: rejected because it adds project-wide runtime/test setup for
    one focused dashboard behavior.
  - Test only source text or utility functions: rejected because it would not verify render
    lifecycle interactions or regressions in the map state.

## Resolved Technical Questions

- **Does this require persistence or an external interface?** No. Center and zoom are already
  held by the existing in-memory Leaflet map; this feature changes only when auto-fit occurs.
- **Does a change to imported data keep the old viewport?** No. Detection of a replacement
  dataset enables one new initial fit on its first non-empty heatmap render.
- **What happens if the selected sport has no routes?** The existing empty state remains; the
  map's retained view and any pending new-dataset fit remain available for the next populated
  filter.