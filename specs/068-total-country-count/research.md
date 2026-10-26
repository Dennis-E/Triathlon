# Phase 0 Research: Countries Visited in Lifetime Statistics

No unresolved Technical Context questions remain. The following decisions resolve the geographic matching, data-source, filter, privacy, and integration choices for Phase 1.

## Decision 1: Reuse imported GPS tracks as the only location evidence

- **Decision**: Read `gpsTracksByActivityId`, whose records already contain a sport and simplified `[latitude, longitude]` points for Strava and TrainingPeaks imports. Do not infer countries from activity names, start locations, or addresses.
- **Rationale**: The import pipeline already parses GPX/FIT tracks and applies them to the current imported dataset. Reusing that map avoids duplicate parsing and keeps location matching local.
- **Alternatives considered**:
  - *Infer a location from activity metadata*: rejected because no consistent country field exists and a start location can omit places reached later in a route.
  - *Reparse raw GPX/FIT files for this KPI*: rejected because simplified tracks are already available to dashboard views.

## Decision 2: Bundle Natural Earth Admin 0 country geometry locally

- **Decision**: Use a reduced GeoJSON derived from Natural Earth's 50m Admin 0 Countries dataset, retaining only each feature's country identity and Polygon/MultiPolygon geometry. Deduplicate by `ADM0_A3`. Follow the dataset's default de facto country/territory classification; do not count subnational regions separately.
- **Rationale**: The 50m download is approximately 782 KB zipped, substantially smaller than the 10m dataset's 4.7 MB, while providing country-level geometries suitable for activity-route classification. Natural Earth states that its vector data is public domain and does not require attribution. Keeping the reduced geometry in the app avoids sending activity coordinates to a geocoding service and avoids a runtime boundary-data request.
- **Alternatives considered**:
  - *Natural Earth 10m*: more detailed but a larger source dataset than needed for a country count.
  - *Natural Earth 110m*: smaller, but less suitable for identifying routes in small countries and near borders.
  - *Online reverse geocoding*: rejected because it would transmit sensitive route locations and introduce service availability and rate-limit dependencies.

## Decision 3: Match route geometry against country polygons

- **Decision**: Use Turf's focused `booleanIntersects` operation to test valid route points/LineStrings against candidate country polygons, with bounding-box checks before exact intersections. A one-point track uses point-in-polygon semantics; a track with multiple points uses its complete LineString so a border-crossing country is counted even when no sampled point falls inside it. Keep matching behind an injectable pure utility boundary for Jest.
- **Rationale**: Testing only points can miss a narrow country crossed between sampled points. A mature GeoJSON geometry operation handles Polygon/MultiPolygon features and boundary intersection more reliably than a custom geometry implementation. The focused operation avoids loading the full Turf bundle.
- **Alternatives considered**:
  - *Count only countries containing recorded points*: simpler, but can miss a country crossed between two route samples and conflicts with the spec's border-crossing scenario.
  - *Implement polygon/line intersection from scratch*: rejected due to handling holes, multipolygons, and boundary cases correctly being established geospatial work.
  - *Send route points to a geocoding service*: rejected for privacy and service dependency reasons.

## Decision 4: Treat the country count as all-time and independent of chart filters

- **Decision**: Aggregate every currently imported activity route across Run, Bike, Swim, and the complete imported date range. Sport and timeframe controls continue to affect the existing chart and its current-period KPI cards but do not change the all-time country count.
- **Rationale**: The request asks for the overall number of countries, and the spec defines the count over the currently imported dataset. Recalculating it with chart filters would turn an all-time total into an implicit filter-dependent statistic.
- **Alternatives considered**:
  - *Apply the selected sport and timeframe filters*: rejected because the resulting value would not consistently represent the requested overall country count.

## Decision 5: Calculate per dataset and expose coverage

- **Decision**: Calculate once when the active dataset or country geometry becomes available, cache the summary for that dataset, and avoid repeating geometry work on visualization filter changes. Report complete coverage when every imported activity has a usable track, partial coverage when some do, and unavailable when none do. If country geometry or the intersection operation cannot load, display an unavailable state rather than a misleading zero.
- **Rationale**: The summary is filter-independent. Coverage communicates that activities without GPS data are not represented, and an unavailable state prevents infrastructure/data-loading errors from appearing as a real country count.
- **Alternatives considered**:
  - *Recalculate on every chart render*: rejected as redundant work unrelated to chart filters.
  - *Display zero after a failed geometry load*: rejected because it conflates failure with a valid empty result.

## Decision 6: Place the country tile in Lifetime Statistics

- **Decision**: Render the country count, country names, and neutral coverage text in Lifetime Statistics, including its existing export capture. Remove the country tile and country metadata from Distance. Change the visible title and export title of the existing distance visualization to "Distance" without changing its internal tab key.
- **Rationale**: Lifetime Statistics is the user's requested home for historical lifetime measures, and its dedicated capture area already includes KPI tiles. This keeps country context with the lifetime summary and avoids expanding the Distance chart export.
- **Alternatives considered**:
  - *Keep the country count in Distance*: rejected because the user explicitly requested Lifetime Statistics.
  - *Add a new visualization tab/export target*: rejected because the existing Lifetime Statistics view and export flow meet the requirement.

## Sources

- Natural Earth, [50m Admin 0 Countries](https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries/): dataset scope, country classification, and source download size.
- Natural Earth, [Terms of Use](https://www.naturalearthdata.com/about/terms-of-use/): public-domain status.
- Turf, [`booleanIntersects`](https://turfjs.org/docs/api/booleanIntersects): GeoJSON intersection API.
- Turf, [`booleanPointInPolygon`](https://turfjs.org/docs/api/booleanPointInPolygon): Polygon/MultiPolygon point-in-polygon behavior and boundary option.

**Output**: All Technical Context items are resolved; no `NEEDS CLARIFICATION` items remain.