# Research: Compact Export Context

**Feature**: [spec.md](spec.md)
**Date**: 2026-10-27

## Findings

- `src/dashboard-export.js` owns the shared capture and 1080 x 1080 canvas-composition flow for visualization tabs and Personal Best detail exports.
- Export targets already distinguish active `filters` from `availableControls`. `drawExportComposition` currently renders both, which explains why alternative views and options consume image space.
- `getExportContext` is the current source of selected values. The Distance view includes sport and timeframe but omits its active aggregation, although aggregation directly determines the displayed view.
- `src/export-utils.js` contains DOM-free helpers and exposes them through both CommonJS and `window.exportUtils`; existing tests already cover filter summaries, target metadata, and layout calculations.
- The current export UI contract specifies a square 1080 x 1080 PNG and a shared preview/download flow.

## Decisions

### Preserve the square PNG format

**Decision**: Keep the existing 1080 x 1080 output and scale each captured visualization to the largest bounds that fit after the title/branding and optional active-context line, preserving aspect ratio and avoiding crop or distortion.

**Rationale**: The user chose to keep the square export. Aspect-preserving maximum fit is the clearest way to use the available space without changing the established image format or making chart content harder to read.

**Alternatives considered**:
- Per-visualization image dimensions: rejected by the user's decision to keep the square format.
- Cropping or stretching chart captures to meet an area percentage: rejected because it can remove data or make the visualization misleading.

The 80% success threshold therefore applies to the limiting dimension of the available fit, rather than total pixel-area coverage, which varies with source aspect ratio.

### Render selected context only

**Decision**: Keep `target.filters` as the export's compact, non-interactive context and omit `target.availableControls` from the generated image. Omit the context line when there are no relevant values. Add the selected aggregation value to the Distance export context.

**Rationale**: The active values already describe the rendered view. Available controls repeat alternatives that are not part of the current image and should not be exported.

**Alternatives considered**:
- Continue rendering all available controls: rejected because this is the source of the wasted area.
- Remove all context: rejected because viewers need to identify the sport, period, year, or other selected values that determine the chart.
- Read a second filter state: rejected because it could drift from the state already used by the dashboard.

### Use the existing shared export path

**Decision**: Change the shared target/composition flow rather than add per-tab renderers, external services, or dependencies. Keep existing capture targets, preview, PNG validation, and download behavior.

**Rationale**: All current visualization exports pass through `src/dashboard-export.js`, so a shared composition change keeps tab and Personal Best detail output consistent. Pure layout rules remain testable in `src/export-utils.js`.

**Alternatives considered**:
- Implement per-visualization export layouts: rejected because it duplicates behavior and risks inconsistent output.
- Add a new capture or rendering library: rejected because the existing local capture and canvas composition already provide the required capabilities.

## Validation Approach

- Unit-test the content-region and aspect-preserving fit calculations, including empty and non-empty active context and narrow/wide source ratios.
- Test the composition boundary to verify active filter labels are rendered, available option/control labels are not, and chart draw bounds use the largest available fit.
- Test representative tab targets and a Personal Best detail target through the current preview/download flow, retaining no-data and selected-state behavior.
- Manually inspect representative square PNG previews and downloads using synthetic activity data; verify the image remains square, context is concise, no control options or empty context strip appears, and the chart is not clipped or distorted.
- Use the existing focused root Jest tests. No API, browser storage, or network behavior is introduced.
