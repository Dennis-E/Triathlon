---

description: "Task list template for feature implementation"
---

# Tasks: Inline-Script von index.html in Feature-Module aufteilen

**Input**: Design documents from `/specs/022-modularize-inline-script/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/script-load-order.md](./contracts/script-load-order.md), [quickstart.md](./quickstart.md)

**Tests**: Es werden keine neuen automatisierten Funktionstests generiert (per Clarify-Antwort Q1 / FR-011 reicht der angepasste Syntax-Check + manuelle Verifikation). Die Anpassung des bestehenden Syntax-Check-Tests ist selbst Teil von User Story 3 (Phase 5).

**Organization**: Tasks sind nach User Story aus [spec.md](./spec.md) gruppiert (US1 = Auffindbarkeit, US2 = unverändertes Verhalten, US3 = verlässliche Testabdeckung).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Kann parallel laufen (unterschiedliche Dateien, keine Abhängigkeit von unfertigen Tasks)
- **[Story]**: Zugehörige User Story (US1, US2, US3)
- Exakte Dateipfade sind in jeder Beschreibung enthalten

## Path Conventions

Single-Project-Layout: `src/` und `__tests__/` im Repository-Root (siehe [plan.md](./plan.md#project-structure)).

---

## Phase 1: Setup

**Zweck**: Baseline sichern, bevor Code verschoben wird

- [X] T001 Baseline sichern: `npm test` (Root) ausführen und grünen Ausgangszustand bestätigen; aktuelle Zeilenzahl von [index.html](../../index.html) notieren (`(Get-Content index.html).Count`), um SC-001/SC-007 später zu verifizieren

---

## Phase 2: Foundational (blockierend für alle User Stories)

**Zweck**: Zentraler Zustand und generische Helfer müssen zuerst existieren, da alle Chart-Domänen darauf zugreifen (FR-013, data-model.md)

**⚠️ KRITISCH**: Keine User-Story-Phase darf beginnen, bevor diese Phase abgeschlossen ist

- [X] T002 Neue Datei [src/dashboard-state.js](../../src/dashboard-state.js) anlegen: die geteilten globalen Zustandsvariablen `rawCsvData`, `processedActivities`, `fitBestEffortsByActivityId`, `gpsTracksByActivityId`, `heatmapActivitySummaryIndex`, `heatmapTooltipSegmentKey`, `heatmapTooltipModel`, `importedDataset`, `selectedSportFilter`, `selectedAggregationLevel`, `selectedVisualizationTab`, `selectedTimeframeByAggregation`, `chartInstance` unverändert aus dem Inline-Block in [index.html](../../index.html#L1570-L6110) (aktuell ~L1576-1615) übernehmen und dort entfernen (siehe data-model.md "Modul-Entitäten")
- [X] T003 Neue Datei [src/dashboard-core.js](../../src/dashboard-core.js) anlegen: generische Date-/Format-Helfer (`parseGermanDate`, `getMonday`, `formatDateIso/Label/Short`, `formatDuration`, `formatTimePerUnitLabel`, `formatPaceLabel`, `formatSwimPaceLabel`, `formatSpeedLabel`, `paceMinPerKmToSpeedKmh`, `formatPerformanceValue`, `getPerformanceMetaForSport`) sowie die Dashboard-Aggregation (`getCurrentTimeframeOption`, `getTimeframeRange`, `getActivitiesInTimeframe`, `getWeeksInDisplayedHorizon`, `getAggregatedData`, `aggregateActivitiesByDay/Month/Year/Week`, `renderDashboard`, `buildTrainingChart`, `setSportFilter`, `setTimeframeFilter`, `renderTimeframeButtons`, `setAggregationLevel`, `setBtnActive`, `updateStatusBadge`) unverändert aus dem Inline-Block übernehmen und dort entfernen; `src/dashboard-utils.js` bleibt dabei laut research.md Entscheidung 2 unangetastet (keine Konsolidierung)
- [X] T004 In [index.html](../../index.html) nach dem bestehenden `<script src="./src/analysis-counter.js"></script>`-Tag (Zeile 30) zwei neue Tags in dieser Reihenfolge einfügen: `<script src="./src/dashboard-state.js"></script>` gefolgt von `<script src="./src/dashboard-core.js"></script>` (vor dem verbleibenden großen Inline-Block), gemäß [contracts/script-load-order.md](./contracts/script-load-order.md)
- [X] T005 Nach T002-T004: `npm test` (Root) ausführen und im Browser (`python -m http.server`) prüfen, dass keine `ReferenceError`-Meldungen in der Konsole auftreten, bevor mit den User-Story-Phasen fortgefahren wird

**Checkpoint**: Zentraler Zustand und generische Helfer sind ausgelagert; Restcode im Inline-Block referenziert sie weiterhin korrekt als globale Symbole

---

## Phase 3: User Story 1 - Feature-Code schnell finden und ändern (Priority: P1) 🎯 MVP

**Goal**: Jeder der acht verbleibenden Verantwortungsbereiche liegt in einer eigenen, klar benannten Datei unter `src/`, statt im monolithischen Inline-Block

**Independent Test**: Für jeden Bereich prüfen, dass sein gesamter Code in genau einer eindeutig benannten `src/dashboard-*.js`-Datei liegt (siehe spec.md User Story 1, Acceptance Scenario 1)

- [X] T006 [P] [US1] Neue Datei [src/dashboard-import.js](../../src/dashboard-import.js) anlegen: Import-Flow-Code unverändert übernehmen — `findHeaderIndex`, `normalizeMetricHeader`, `isElevationHeader`, `parseMetricNumber`, `processData`, `createImportedDataset`, `applyImportedDataset`, `setImportModalVisualState`, `showImportProgressModal`, `hideImportProgressModal`, `updateImportProgress`, `importCsvText`, `handleStravaIngest`, `hasImportedActivities`, `showPreviewGateModal`, `closePreviewGateModal` (aktuell ca. [index.html](../../index.html#L1683-L2040) und [index.html](../../index.html#L5555-L6020)); Code aus dem Inline-Block noch NICHT entfernen (das erledigt T014)
- [X] T007 [P] [US1] Neue Datei [src/dashboard-equipment.js](../../src/dashboard-equipment.js) anlegen: Equipment-Chart-Code unverändert übernehmen — `renderEquipmentChart`, `setEquipmentFilter`, `setEquipmentMetric`, `setEquipmentTimelineFilter`, `setEquipmentTimelineMode`, `_timelineSetCanvasHeight`, `_timelineDateLabel`, `_timelineFullDateLabel`, `_renderTimelineContinuous`, `_renderTimelineActivities`, `renderEquipmentTimeline` (aktuell ca. [index.html](../../index.html#L2043-L2440)); Code im Inline-Block vorerst unverändert lassen
- [X] T008 [P] [US1] Neue Datei [src/dashboard-power-pb.js](../../src/dashboard-power-pb.js) anlegen: Power-PB-Code unverändert übernehmen — `PB_DISTANCES`, `PB_SPORT_COLOR`, `PB_MAX_RESULTS`, `PB_BIKE_POWER_DURATIONS`, `getPbMetricForEffort`, `computePbsForDistance`, `computeBikePowerPbsForDuration`, `formatDurationHms`, `activePbDetailModel`, `pbDetailReturnFocus`, `createSvgElement`, `getCompactPbRecords`, `getDetailTimeTicks`, `getNiceTicks`, `wrapPbActivityTitle`, `renderPbDetailChart`, `openPbDetail`, `closePbDetail`, `renderPbChart` samt aller bisherigen lokalen Closures (`appendTimelineAxes`, `appendYAxisLabel`, `appendCurrentBest`, `appendPbDetailButton`, `showPbTooltip`, `movePbTooltip`, `hidePbTooltip`, `showPowerPbTooltip`, `renderRecordCard`, `renderPowerDurationTileChart`, `renderBikePowerSection`) unverändert als zusammenhängenden Block (aktuell ca. [index.html](../../index.html#L4652-L5765)); keine Zerlegung der Closures (research.md Entscheidung 5); Code im Inline-Block vorerst unverändert lassen
- [X] T009 [P] [US1] Neue Datei [src/dashboard-distributions.js](../../src/dashboard-distributions.js) anlegen: Distributions-Chart-Code unverändert übernehmen — `setDistributionsBtnActive`, `setDistributionsMetric`, `setDistributionsSportFilter`, `setDistributionsDisplayMode`, `initDistributionsDateSlider`, `updateDistributionsDateRangeLabel`, `updateDistributionsDateRangeTrack`, `getDistributionsDateBounds`, `setDistributionsDateRange`, `renderDistributionsChart` (aktuell ca. [index.html](../../index.html#L2762-L3050)); die Datei referenziert `PB_SPORT_COLOR` als globale Konstante aus `dashboard-power-pb.js`, ohne sie zu duplizieren (research.md Entscheidung 4); Code im Inline-Block vorerst unverändert lassen
- [X] T010 [P] [US1] Neue Datei [src/dashboard-scatter.js](../../src/dashboard-scatter.js) anlegen: Scatter-/Heartrate-Pace-Chart-Code unverändert übernehmen — `initScatterDateSlider`, `updateScatterDateRangeLabel`, `getScatterDateBounds`, `setScatterDateRange`, `updateScatterDateRangeTrack`, `setScatterSportBtnActive`, `setScatterSportFilter`, `setScatterDataYearEnabled`, `setScatterTrendLinesVisible`, `updateScatterChartVisibility`, `renderScatterTrendControls`, `renderHeartratePaceChart` (aktuell ca. [index.html](../../index.html#L2410-L2760) und [index.html](../../index.html#L3690-L3970)); Code im Inline-Block vorerst unverändert lassen
- [X] T011 [P] [US1] Neue Datei [src/dashboard-heatmap.js](../../src/dashboard-heatmap.js) anlegen: Heatmap-Code unverändert übernehmen — `ensureLeafletLoaded`, `RouteCanvasLayerClass`, `ensureRouteCanvasLayerClass`, `setHeatmapSportBtnActive`, `setHeatmapSportFilter`, `hideHeatmapActivityTooltip`, `showHeatmapActivityTooltip`, `renderHeatmapFrequencyLegend`, `renderHeatmap`, `buildDemoRouteSegments`, `renderHeatmapPreviewMap` (aktuell ca. [index.html](../../index.html#L3070-L3690)); Code im Inline-Block vorerst unverändert lassen
- [X] T012 [P] [US1] Neue Datei [src/dashboard-export.js](../../src/dashboard-export.js) anlegen: Export/Sharing-Code unverändert übernehmen — `showExportToast`, `isEmptyStateHidden`, `getExportableFlags`, `getActiveButtonText`, `getControlSnapshot`, `getControlGroup`, `getAvailableControlContext`, `getExportContext`, `getTabExportTarget`, `loadExportAssets`, `drawWrappedText`, `drawAvailableControls`, `drawExportComposition`, `waitForChartRenderSettle`, `showExportPreviewModal`, `closeExportPreviewModal`, `downloadExportedImage`, `exportVisualizationTarget`, `exportVisualizationTab`, `exportActivePbDetail`, sowie `exportRequestState`, `exportToastTimeoutId`, `lastExportedImage`, `exportAssetsPromise`, `EXPORT_CAPTURE_TARGET_IDS`, `EXPORT_DOMAIN` (aktuell ca. [index.html](../../index.html#L5455-L6080)); Code im Inline-Block vorerst unverändert lassen
- [X] T013 [US1] Neue Datei [src/dashboard-tabs.js](../../src/dashboard-tabs.js) anlegen: Tab-Wiring- und Bootstrap-Code unverändert übernehmen — `setVisualizationTab`, `handleVisualizationTabKeydown`, `openDashboardTab`, `goToLanding`, Analysis-Counter-Init (`ANALYSIS_COUNTER_API_BASE_URL`, `ANALYSIS_COUNTER_CLIENT_KEY`, `analysisCounterClient`, `setAnalysisCounter`, `loadAnalysisCounter`, `recordCompletedAnalysis`), sowie den initialen Bootstrap-Code (`lucide.createIcons(); setTimeout(renderHeatmapPreviewMap, 0);` ganz am Anfang, `loadAnalysisCounter();`-Aufruf, alle direkten `addEventListener`-Verdrahtungen für Keydown/PB-Detail/Export-Preview/Preview-Gate, sowie den abschließenden `setVisualizationTab(selectedVisualizationTab);`-Aufruf); diese Datei muss als letzte aller neuen Dateien geladen werden, da sie den initialen Render auslöst; hängt von T006-T012 ab, da sie auf deren globale Funktionen zugreift, aber nicht von deren `index.html`-Bereinigung
- [X] T014 [US1] In [index.html](../../index.html): den kompletten verbliebenen Inline-Code der acht in T006-T013 ausgelagerten Bereiche aus dem großen `<script>`-Block (aktuell [index.html](../../index.html#L1570-L6110)) entfernen und stattdessen acht neue `<script src="...">`-Tags nach den in T004 eingefügten Tags einfügen, in exakt dieser Reihenfolge (siehe [contracts/script-load-order.md](./contracts/script-load-order.md)): `dashboard-import.js`, `dashboard-equipment.js`, `dashboard-power-pb.js`, `dashboard-distributions.js`, `dashboard-scatter.js`, `dashboard-heatmap.js`, `dashboard-export.js`, `dashboard-tabs.js`; danach darf im verbleibenden `<script>`-Tag kein mehrere-hundert-Zeilen-Rest mehr stehen (SC-001); hängt von T006-T013 ab (alle Inhalte müssen zuerst in den neuen Dateien existieren, bevor sie aus dem Inline-Block gelöscht werden)

**Checkpoint**: Alle sieben aus der Spec geforderten Verantwortungsbereiche (plus Power-PB) liegen in eigenen, klar benannten Dateien; `index.html` enthält keinen dominanten Inline-Block mehr

---

## Phase 4: User Story 2 - Unverändertes Nutzerverhalten nach der Umstrukturierung (Priority: P1)

**Goal**: Bestätigen, dass Dashboard, Import, Diagramme, Export und Modals nach der Aufteilung exakt wie vorher funktionieren

**Independent Test**: Manueller Durchlauf aller Kernabläufe gemäß [quickstart.md](./quickstart.md) Abschnitt 3, ohne wahrnehmbare Verhaltensänderung

- [X] T015 [US2] `npm test` (Root) ausführen und bestätigen, dass alle vor der Umstrukturierung bestehenden Tests unverändert grün sind (SC-003); Abweichungen sofort beheben, bevor fortgefahren wird
- [X] T016 [US2] `npm test` in [services/api](../../services/api) ausführen und bestätigen, dass die API-Testsuite unberührt grün bleibt (FR-010)
- [X] T017 [US2] Manuellen Durchlauf gemäß [quickstart.md](./quickstart.md) Abschnitt 3 durchführen: `python -m http.server` starten, Konsole auf `ReferenceError`/`is not defined` prüfen, Import-Flow (Fortschritts-Modal, Preview-Gate-Modal), alle Tab-Wechsel (Equipment, Distributions, Scatter, Heatmap, Power PBs), PB-Detail-Overlay öffnen/mit Escape schließen, Export-Vorschau, Imprint- und Privacy-Policy-Modal durchspielen; jede Abweichung vom bisherigen Verhalten dokumentieren und beheben (SC-004)
- [X] T018 [US2] Zeilenzahl von [index.html](../../index.html) erneut prüfen und mit der in T001 notierten Baseline vergleichen, um die deutliche Reduktion zu bestätigen (SC-001, SC-007)

**Checkpoint**: Keine Regressionen; Verhalten und automatisierte Tests entsprechen exakt dem Stand vor der Umstrukturierung

---

## Phase 5: User Story 3 - Verlässliche Testabdeckung nach der Aufteilung (Priority: P2)

**Goal**: Der bestehende Syntax-Check-Test erkennt Syntaxfehler weiterhin zuverlässig, jetzt auch in den neuen `src/dashboard-*.js`-Dateien

**Independent Test**: Ein absichtlich eingefügter Syntaxfehler in einer neuen Datei lässt den Test fehlschlagen (siehe spec.md User Story 3)

- [X] T019 [US3] In [__tests__/index-script-syntax.test.js](../../__tests__/index-script-syntax.test.js) die Funktion `extractInlineScripts` so erweitern, dass sie zusätzlich den Inhalt aller `src/dashboard-*.js`-Dateien (glob oder explizite Liste: `dashboard-state.js`, `dashboard-core.js`, `dashboard-import.js`, `dashboard-equipment.js`, `dashboard-power-pb.js`, `dashboard-distributions.js`, `dashboard-scatter.js`, `dashboard-heatmap.js`, `dashboard-export.js`, `dashboard-tabs.js`) an `inlineCode` anhängt, bevor die bestehende `new Function(...)`-Syntaxprüfung läuft (research.md Entscheidung 6); alle bestehenden `toContain`/`toMatch`-Assertions in dieser Datei müssen dabei unverändert bleiben und weiterhin grün sein
- [X] T020 [US3] In [__tests__/index-script-syntax.test.js](../../__tests__/index-script-syntax.test.js) einen neuen Testfall ergänzen, der per Regex auf den `<script src="...">`-Text von [index.html](../../index.html) prüft, dass die zehn `dashboard-*.js`-Tags exakt in der in [contracts/script-load-order.md](./contracts/script-load-order.md) festgelegten Reihenfolge erscheinen
- [X] T021 [US3] `npm test -- index-script-syntax` ausführen und bestätigen, dass er grün ist; anschließend testweise einen Syntaxfehler in eine beliebige `src/dashboard-*.js`-Datei einfügen, bestätigen dass der Test fehlschlägt und die Ursache benennt (SC-005), und den Testfehler danach wieder rückgängig machen

**Checkpoint**: Syntax-Check-Test deckt Inline-Rest und alle neuen Dateien ab; Regressionstest für SC-005 bestätigt

---

## Phase 6: Polish & Cross-Cutting Concerns

**Zweck**: Abschließende Konsistenzprüfungen, die keiner einzelnen User Story zugeordnet sind

- [X] T022 [P] [AGENTS.md](../../AGENTS.md) Abschnitt "Project shape" aktualisieren: die neuen `src/dashboard-*.js`-Orchestrierungs-Dateien als Teil der Dashboard-Orchestrierung erwähnen (analog zu den bereits genannten `src/`-Modulen), ohne bestehende Aussagen zu entfernen
- [X] T023 Finale Verifikation: `npm test` (Root und `services/api`) ein letztes Mal vollständig ausführen und den in T001/T018 begonnenen Zeilenzahl-Vergleich sowie alle Punkte aus [quickstart.md](./quickstart.md) Abschnitt 4 ("Abnahmekriterien") als erfüllt bestätigen

---

## Dependencies & Execution Order

### Phasenreihenfolge

1. **Setup (Phase 1)**: T001 — keine Abhängigkeiten
2. **Foundational (Phase 2)**: T002 → T003 → T004 → T005 — MUSS vor allen User-Story-Phasen abgeschlossen sein
3. **User Story 1 (Phase 3)**: T006-T012 parallel möglich (unterschiedliche neue Dateien, nur lesender Zugriff auf `index.html`), T013 danach, T014 zuletzt (schreibender Zugriff auf `index.html`, hängt von allen vorherigen ab)
4. **User Story 2 (Phase 4)**: hängt von Phase 3 (T014) ab — Verhalten kann erst nach vollständiger Aufteilung final verifiziert werden
5. **User Story 3 (Phase 5)**: kann inhaltlich parallel zu Phase 4 vorbereitet werden (T019/T020 hängen nur von der Existenz der neuen Dateinamen ab, nicht vom Abschluss der manuellen Verifikation), T021 sollte aber erst nach Phase 3 laufen
6. **Polish (Phase 6)**: hängt von Phase 3-5 ab

### Kritischer Pfad

Setup → Foundational → US1 (Dateien anlegen → index.html bereinigen) → US2 (Verifikation) / US3 (Testanpassung) → Polish

### Parallelisierungsbeispiel (Phase 3)

```text
# Nach Abschluss von Phase 2 (T002-T005), gleichzeitig starten:
T006 [P] [US1] src/dashboard-import.js
T007 [P] [US1] src/dashboard-equipment.js
T008 [P] [US1] src/dashboard-power-pb.js
T009 [P] [US1] src/dashboard-distributions.js
T010 [P] [US1] src/dashboard-scatter.js
T011 [P] [US1] src/dashboard-heatmap.js
T012 [P] [US1] src/dashboard-export.js
# danach sequenziell: T013, dann T014
```

## Implementation Strategy

**MVP-Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) liefern bereits den vollständigen
strukturellen Nutzen (Code liegt in klar benannten Dateien) und sind unabhängig testbar über
die "Independent Test"-Kriterien der jeweiligen Story. Phase 4 (US2) und Phase 5 (US3) sind
zwingende Abnahmebedingungen dieses Features (P1/P2), sollten aber unmittelbar im Anschluss an
die MVP-Phase erledigt werden, bevor das Feature als fertig gilt — bei einer reinen
Code-Reorganisation ohne Endnutzer-Feature ist ein "MVP ohne Verhaltensverifikation" nicht
sinnvoll auslieferbar.

**Inkrementelle Lieferung**: Nach Phase 3 kann bereits ein Zwischenstand committet werden
(Dateien existieren, `index.html` bereinigt); Phase 4 und 5 liefern die Abnahme-Nachweise dazu.
