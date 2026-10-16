# UI Contract: Visualization Availability

## Availability

- Evaluate each of the 12 registered visualization tabs from valid renderable output in the currently loaded dataset and any associated in-memory auxiliary data.
- A field name, source label, supported sport, or imported activity count alone does not make a view available; the view-specific model must have meaningful output.
- Availability is based on the complete active dataset, not a transient chart filter selection. Changing filters does not reorder or hide dashboard tabs.
- Re-evaluate on every successfully completed import. Do not preserve visibility from a prior import.
- This is a presentation-only behavior: do not modify, filter out, or delete imported source files, normalized activity records, or field values.

## Navigation and Content

- Available tabs remain in the existing canonical order.
- An unavailable tab button is hidden and cannot be activated by click, keyboard cycling, or programmatic dispatch.
- Only the active available tab panel is displayed. Unavailable and inactive panels remain hidden.
- Left/right keyboard navigation cycles over available tabs only and wraps at the ends.
- If the selected tab becomes unavailable after import, select the first available tab in canonical order.
- If no tabs are available, select no visualization, hide all visualization panels, and present the stable no-visualizations state. Other dashboard navigation remains available.
- Keep ARIA `aria-selected`, `tabindex`, and panel relationships consistent with the visible tab set.

## Share and Export

- Existing Share/Export controls and capture behavior are unchanged; export behavior is outside this feature's visibility contract.

## Import Source Behavior

- The active dataset may originate from Strava or TrainingPeaks. Source identity is informational; the same view readiness rules apply to either source.
- A new import becomes the dashboard's current input. This does not mean the imported data is modified; this feature does not add a source-merging workflow.
