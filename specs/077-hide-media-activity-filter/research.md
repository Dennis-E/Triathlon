# Research: Hide Media Activity Filter

## Decision 1: Remove Only the Activity Filter Surface

**Decision**: Remove the Activity selector from the Media gallery, its gallery-specific filter state and event wiring, and the Media export-control summary. Keep the year and sport filters.

**Rationale**: The request targets the visible Activity filter. Removing its control and dashboard wiring ensures users cannot filter the gallery by activity, while preserving the other explicitly required filters. The generic `media-utils.filterMediaAssets()` helper is reusable and does not need a breaking behavior change.

**Alternatives considered**: Keeping a hidden Activity selector or retaining Activity filtering through another UI path would contradict the request. Removing activity associations from media data would unnecessarily damage detail and route context.

## Decision 2: Preserve Activity Context and Associations

**Decision**: Retain the activity lookup in `src/dashboard-media.js`, media `activityIds`, and existing detail/route behavior. Only remove the lookup used to populate the Activity selector.

**Rationale**: `getMediaGalleryActivityOptions()` is also used to build pinned activity details and is used when presenting media context. Activity relationships are not the same thing as an Activity filter and remain required by FR-003.

**Alternatives considered**: Removing all activity lookup code would break linked-media context; changing import or association data is outside the feature scope.

## Decision 3: Keep Routes Out of Media Export Images

**Decision**: Preserve the existing Media tab, export action, year/sport export context, tab IDs, and navigation order. Remove the route-inclusion checkbox and its export-control summary entry; recap and collage images always omit route drawings. Keep route details and navigation available from associated media.

**Rationale**: The user requested removal of the visible route option. Always excluding routes is the privacy-preserving behavior when users can no longer choose an explicit opt-in. The export-control summary should reflect controls actually present.

**Alternatives considered**: Keeping hidden route state or a callable UI setter would preserve an inaccessible opt-in and make export behavior surprising. Changing tab registration is unrelated and remains out of scope.

## Decision 4: Use the Preview as Export Confirmation

**Decision**: Clear the gallery status after recap/collage preparation and open the existing export preview without the additional "ready for local preview" message.

**Rationale**: The preview itself confirms success and offers the next action. The extra status sentence duplicates that state.

**Alternatives considered**: Replacing the sentence with another success message would retain redundant status copy the user asked to remove.

## Decision 5: Remove Media Pin and Manual Selection Controls

**Decision**: Remove pin/inspect buttons and per-item Select checkboxes from Media cards, along with Media's pinned-tooltip adapter and selection state. A card click continues to open the existing media preview. Collages use all readable assets matching the active Year/Sport filters.

**Rationale**: The user requested removal of these controls in the Media gallery. Preserving direct card preview keeps media and activity details accessible, while using the active filters provides a clear collage source without per-item selection.

**Alternatives considered**: Removing pin interactions from other visualizations exceeds the confirmed scope. Keeping hidden selection state would leave an inaccessible second selection path and make collage contents harder to predict.

## Repository Evidence

- `index.html` owns the Media gallery's Year, Sport, and Activity select markup.
- `src/dashboard-media.js` owns the gallery filter state and event handlers; its activity lookup also supports linked details.
- `src/dashboard-export.js` enumerates visible Media controls for export context.
- Existing assertions are in `__tests__/dashboard-media.test.js`, `__tests__/dashboard-export-download.test.js`, and `__tests__/index-script-syntax.test.js`.
- Jest runs in Node; DOM behavior is verified through the repository's injected/mock document patterns and static markup assertions.
