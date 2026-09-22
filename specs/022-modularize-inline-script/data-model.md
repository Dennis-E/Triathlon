# Data Model: Inline-Script von index.html in Feature-Module aufteilen

Dieses Feature verändert keine fachlichen Daten-Entitäten (Aktivitäten, Ausrüstung, Power-Werte
usw.) — es handelt sich um eine reine Code-Reorganisation. Die relevanten "Entitäten" sind daher
die Dateien/Module selbst und der zwischen ihnen geteilte Laufzeit-Zustand.

## Modul-Entitäten

| Datei | Verantwortungsbereich | Lädt nach | Definiert (Auszug) | Liest von |
|---|---|---|---|---|
| `src/dashboard-state.js` | Geteilter globaler Zustand | (nach bestehenden 9 `src/*.js`-Tags) | `rawCsvData`, `processedActivities`, `fitBestEffortsByActivityId`, `gpsTracksByActivityId`, `heatmapActivitySummaryIndex`, `heatmapTooltipSegmentKey`, `heatmapTooltipModel`, `importedDataset`, `selectedSportFilter`, `selectedAggregationLevel`, `selectedVisualizationTab`, `selectedTimeframeByAggregation`, `chartInstance` | — |
| `src/dashboard-core.js` | Generische Date/Format-Helfer + Dashboard-Aggregation | `dashboard-state.js` | `parseGermanDate`, `getMonday`, `formatDateIso/Label/Short`, `formatDuration`, `formatPaceLabel`, `formatSwimPaceLabel`, `formatSpeedLabel`, `formatPerformanceValue`, `getPerformanceMetaForSport`, `getCurrentTimeframeOption`, `getTimeframeRange`, `getActivitiesInTimeframe`, `getAggregatedData`, `aggregateActivitiesByDay/Month/Year/Week`, `renderDashboard`, `buildTrainingChart`, `setSportFilter`, `setTimeframeFilter`, `renderTimeframeButtons`, `setAggregationLevel`, `setBtnActive`, `updateStatusBadge` | `dashboard-state.js` |
| `src/dashboard-import.js` | Import-Flow (CSV/ZIP-Ingestion, Import-Progress-/Preview-Gate-Modal) | `dashboard-core.js` | `findHeaderIndex`, `normalizeMetricHeader`, `isElevationHeader`, `parseMetricNumber`, `processData`, `createImportedDataset`, `applyImportedDataset`, `setImportModalVisualState`, `showImportProgressModal`, `hideImportProgressModal`, `updateImportProgress`, `importCsvText`, `handleStravaIngest`, `hasImportedActivities`, `showPreviewGateModal`, `closePreviewGateModal` | `dashboard-state.js`, `dashboard-core.js`, `window.zipImporter`, `window.heatmapUtils` |
| `src/dashboard-equipment.js` | Equipment-Chart-Rendering | `dashboard-import.js` | `renderEquipmentChart`, `setEquipmentFilter`, `setEquipmentMetric`, `setEquipmentTimelineFilter`, `setEquipmentTimelineMode`, `renderEquipmentTimeline`, `_renderTimelineContinuous`, `_renderTimelineActivities` | `dashboard-state.js`, `dashboard-core.js`, `window.equipmentUtils` |
| `src/dashboard-power-pb.js` | Power-PB-Orchestrierung inkl. Detail-Overlay | `dashboard-equipment.js` | `PB_DISTANCES`, `PB_SPORT_COLOR`, `PB_MAX_RESULTS`, `PB_BIKE_POWER_DURATIONS`, `getPbMetricForEffort`, `computePbsForDistance`, `computeBikePowerPbsForDuration`, `formatDurationHms`, `renderPbDetailChart`, `openPbDetail`, `closePbDetail`, `renderPbChart` (inkl. aller bisherigen lokalen Closures unverändert) | `dashboard-state.js`, `dashboard-core.js`, `window.powerPbUtils` |
| `src/dashboard-distributions.js` | Distributions-Chart-Rendering | `dashboard-power-pb.js` (wegen `PB_SPORT_COLOR`) | `setDistributionsBtnActive`, `setDistributionsMetric`, `setDistributionsSportFilter`, `setDistributionsDisplayMode`, `initDistributionsDateSlider`, `renderDistributionsChart` | `dashboard-state.js`, `dashboard-core.js`, `window.distributionUtils`, `PB_SPORT_COLOR` (aus `dashboard-power-pb.js`) |
| `src/dashboard-scatter.js` | Scatter-/Heartrate-Pace-Chart | `dashboard-distributions.js` | `initScatterDateSlider`, `setScatterSportFilter`, `setScatterDataYearEnabled`, `setScatterTrendLinesVisible`, `renderHeartratePaceChart` | `dashboard-state.js`, `dashboard-core.js`, `window.scatterUtils` |
| `src/dashboard-heatmap.js` | Heatmap-Rendering | `dashboard-scatter.js` | `ensureLeafletLoaded`, `RouteCanvasLayerClass`, `ensureRouteCanvasLayerClass`, `setHeatmapSportFilter`, `showHeatmapActivityTooltip`, `hideHeatmapActivityTooltip`, `renderHeatmapFrequencyLegend`, `renderHeatmap`, `renderHeatmapPreviewMap` | `dashboard-state.js`, `window.heatmapUtils` |
| `src/dashboard-export.js` | Export/Sharing-Komposition | `dashboard-heatmap.js` | `showExportToast`, `getExportContext`, `getTabExportTarget`, `loadExportAssets`, `drawExportComposition`, `showExportPreviewModal`, `closeExportPreviewModal`, `downloadExportedImage`, `exportVisualizationTarget`, `exportVisualizationTab`, `exportActivePbDetail` | `dashboard-state.js`, `window.exportUtils`, `chartInstance`, `activePbDetailModel` |
| `src/dashboard-tabs.js` | Tab-Wiring + Bootstrap-Init | `dashboard-export.js` (lädt zuletzt) | `setVisualizationTab`, `handleVisualizationTabKeydown`, `openDashboardTab`, `goToLanding`, Analysis-Counter-Init (`analysisCounterClient`, `loadAnalysisCounter`, `recordCompletedAnalysis`), initiale `lucide.createIcons()`/`renderHeatmapPreviewMap()`/`setVisualizationTab(...)`-Aufrufe | `window.dashboardTabNavigation`, `window.AnalysisCounter`, alle vorherigen Dateien |

## Geteilte Zustands-Variablen (Detail zu `dashboard-state.js`)

| Variable | Geschrieben von (Datei) | Gelesen von (Dateien) |
|---|---|---|
| `processedActivities` | `dashboard-import.js` (`applyImportedDataset`) | `dashboard-core.js`, `dashboard-equipment.js`, `dashboard-distributions.js`, `dashboard-scatter.js`, `dashboard-power-pb.js` |
| `chartInstance` | `dashboard-core.js` (`buildTrainingChart`) | `dashboard-export.js` (`getExportableFlags`), Resize-Handler in `dashboard-tabs.js` |
| `heatmapActivitySummaryIndex` | `dashboard-import.js` | `dashboard-heatmap.js` |
| `heatmapTooltipSegmentKey` / `heatmapTooltipModel` | `dashboard-heatmap.js` | `dashboard-heatmap.js`, `dashboard-import.js` (Reset beim Re-Import) |
| `selectedVisualizationTab` | `dashboard-tabs.js` (`setVisualizationTab`) | — (nur intern gelesen) |
| `activePbDetailModel` | `dashboard-power-pb.js` (`openPbDetail`/`closePbDetail`) | `dashboard-export.js` (`exportActivePbDetail`), bestehender Imprint/Privacy-Modal-Block (`closePbDetail()` bei Escape) |

Keine dieser Variablen ändert Typ, Struktur oder Zeitpunkt der Zuweisung — sie werden 1:1 aus dem
Inline-Block übernommen.

## Zustandsübergänge

Keine neuen Zustandsübergänge. Die bestehenden Lifecycle-Abläufe (Import → Verarbeitung →
Chart-Rendering → Export) bleiben inhaltlich unverändert; lediglich der Ort der Funktionsdefinition
ändert sich.
