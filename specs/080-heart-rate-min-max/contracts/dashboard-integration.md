# Dashboard Contract: HeartRate-Verlauf

## 1. Wiederverwendbare Utility

`src/heart-rate-utils.js` exponiert dieselben Funktionen ueber CommonJS und `window.heartRateUtils`; kapseln, damit Classic-Script-Namen nicht kollidieren.

| Funktion | Vertrag |
|----------|---------|
| `hasHeartRateData(allActivities)` | Boolean anhand derselben Validitaetsregeln wie das Modell, Kurzschluss beim ersten qualifizierten Feld, keine Sortierung. |
| `buildHeartRateTimeline(filteredActivities, { getActivityKey })` | Neues Modell gemaess [data-model.md](../data-model.md), ohne Filterengine und ohne Mutation. |

`getActivityKey(activity)` liefert `{ activityKey, sourceOrdinal }` aus der vom Renderer gehaltenen Registry. Fuer reine Utilitytests ohne Registry ist ein deterministischer lokaler Ordinalfallback erlaubt; die Dashboardintegration MUSS die importweite Registry verwenden. Leere/ungueltige Eingabelisten liefern ein leeres Modell beziehungsweise `false`.

## 2. Tab- und Markupvertrag

| Element | Kennung |
|---------|---------|
| Tabname | `heartRate` |
| Navigation | `vizTabHeartRate` |
| Panel | `vizPanelHeartRate` |
| Canvas | `heartRateChart` |
| Capture-Wrapper | `heartRateChartWrapper` |
| Filter-Leerzustand | `heartRateEmptyState` |
| Detail-/Trefferbereich | `heartRateDetails` |

`heartRate` wird unmittelbar nach `paceMetrics` eingefuegt. Alle bisherigen IDs und deren relative Reihenfolge bleiben erhalten. In `src/tab-navigation.js` muessen `TAB_ORDER`, `TAB_BUTTON_IDS`, `TAB_PANEL_IDS` und explizite Panelumschaltungen den neuen Tab gemeinsam enthalten. `src/dashboard-tabs.js` bekommt Renderdispatch und Filteradapter; `src/tooltip-selection-utils.js` die neue Tabkennung. Versteckte Tabs sind auch ueber Pfeile und Tastatur unerreichbar.

`src/visualization-availability.js` nutzt `heartRateUtils.hasHeartRateData(records)` importweit. Die Datenquelle selbst schaltet den Tab weder frei noch aus. Erfolgreicher Ersatzimport aktualisiert Verfuegbarkeit, aktive Auswahl und alle HeartRate-Ressourcen ueber den bestehenden Commitpfad; bei fehlender Eignung ist ein gueltiger Fallback erforderlich.

## 3. Globale Filter und Refresh

- Dieselben Zustandswerte verwenden: `selectedSportFilter = All|Run|Bike|Swim`, `selectedAggregationLevel = daily|weekly|monthly|yearly`, zugehoeriger Eintrag aus `selectedTimeframeByAggregation`.
- Keine neue Sport-Mehrfachauswahl. Der Spezifikationsbezug auf bestehende Auswahlsemantik erweitert diese nicht.
- Einen kleinen gemeinsamen Selektor aus der bisher in `renderDashboard` verwendeten Auswahl herausloesen. Er verwendet `getActivitiesInTimeframe` und danach die vorhandene Sportbedingung. Die alte Distance-Ergebnismenge wird durch direkte Paritaetstests abgesichert.
- `getTimeframeRange` bleibt unveraendert an der gesamten Historie verankert; beide Grenzen sind inklusive. Die vorhandenen `TIMEFRAME_OPTIONS` unveraendert wiederverwenden. Der neue Renderer gruppiert trotz Aggregationsmodus keine Trainings.
- Weil die vorhandenen Bedienelemente im Distance-Panel liegen, stellt das HeartRate-Panel kompakte, synchronisierte Bedienelemente fuer denselben Zustand bereit. Keine Verlagerung der gesamten Dashboardoberflaeche.
- Bestehende Setter `setSportFilter`, `setTimeframeFilter`, `setAggregationLevel` und der neue Filteradapter muessen die HeartRate-Darstellung beziehungsweise deren Modellrevision invalidieren und bei aktiver Ansicht aktualisieren. Verdeckte Ansichten duerfen lazy neu rendern, muessen aber sofort alte Exportmodelle ungueltig machen.
- Filterwechsel ruft keine importweite Neuberechnung der Tabverfuegbarkeit auf. Leeres Ergebnis: Chart zerstoeren/leeren, Details zuruecksetzen, klaren Leerzustand zeigen und Share/Export sperren.

## 4. Renderer und Trainingsdetails

`src/dashboard-heart-rate.js` besitzt die DOM-Orchestrierung. Seine schmale Browserfassade `window.heartRateDashboard` bietet `render()`, `reset()` und `getExportData()`; weitere Filteradapter-Helfer sind lokal oder folgen der vorhandenen Dashboardkonvention. Wiederverwendbare Validierung bleibt ausschliesslich in der Utility.

- Chart.js scatter mit numerischer Zeitachse und Datumsbeschriftung; zwei Datasets Minimum/Maximum, `showLine: false`, unterschiedliche Formen und beschriftete Legende.
- Keine Extra-Messpunkte fuer Einzelpunktachsen, keine Koordinatenverschiebung/Jitter. Achsengrenzen duerfen fuer Lesbarkeit rein optisch aufgeweitet werden.
- Namen, Datum, vorhandene Startzeit, Sport, bpm und Extremart in Details anzeigen. Datasetlokale Ersatzkennung macht fehlende/mehrdeutige Namen eindeutig. Kein ungeprueftes HTML aus Trainingsnamen.
- `dashboardTooltips.attachChart` fuer bestehendes Klick-/Tap-Pinning, Canvasfokus und Escape verwenden. `resolveHits` sammelt alle Treffer statt indexbasierter Min-/Max-Paarung. `describeContent`, `anchorPoint` und `inspectionKeys` anhand echter Punktidentitaeten bilden.
- Lokale native Auswahlliste im Detailbereich stellt bei Ueberlagerung jedes Training und jede Extremart einzeln bereit. Alle Kandidaten sind per Touch und Tastatur erreichbar; keine neuen allgemeinen Pin-Regeln oder Pins im Export.
- Responsive Chartflaeche mit stabiler Hoehe, `min-width: 0`, umbrechbarer Legende/Filterzeile und passenden Detailflaechen. Bestehende Gestaltung uebernehmen; Share-Aktion mit vorhandenem Lucide-Symbol und zugaenglichem Namen.

## 5. Ladereihenfolge und Lebenszyklus

`heart-rate-utils.js` wird vor `visualization-availability.js` geladen. `dashboard-heart-rate.js` nach den benoetigten State/Core-/Scatter-/Tooltip-Grundlagen und vor `dashboard-export.js` und `dashboard-tabs.js` einhaengen. Fuer tatsaechliche Abhaengigkeiten die vorhandene Reihenfolge in `index.html` respektieren; keine pauschale Neuordnung bestehender Scripts.

Den dokumentierten Ladereihenfolgevertrag sowie `index-script-syntax.test.js` im selben Implementierungsschritt aktualisieren. Im Browser die `window.heartRateUtils`-/`window.heartRateDashboard`-Bruecken und fehlerfreie gemeinsame Classic-Script-Ausfuehrung pruefen; CommonJS-Tests allein erkennen globale Namenskollisionen nicht.

`reset()` zerstoert alte Chartinstanz, Trefferlisten und Modell-/Exportdaten, invalidiert lokale Renderarbeit und erneuert bei neuem Dataset die Registry. Vorhandene Dashboard-Revisions-/Rendertoken verwenden, wo sie den noetigen Zustand abdecken. Ergaenzend eine HeartRate-lokale Modellrevision fuer Filterveraenderungen verwenden; bestehende Exportfamilien nicht umdeuten.

## 6. Share-/Exportvertrag

Capture-Registrierung `heartRate -> heartRateChartWrapper` ist notwendig, aber nicht ausreichend. Im selben Feature gemeinsam erweitern:

| Datei / Oberflaeche | Erforderliche Ergaenzung |
|--------------------|------------------------|
| `dashboard-export.js`: `EXPORT_CAPTURE_TARGET_IDS` | Aufnahmebereich der neuen Ansicht. |
| `getExportableFlags`, `getTabExportTarget` | Importweite Eignung und aktuelles nichtleeres Punktmodell; keine Leer-/Altziele. |
| `getAvailableControlContext`, `getExportContext`, `getExportPresentationData` | Tab/View, Sport, gewaehlter Zeitraum und tatsaechliche Grenzen, Reihen und bpm. |
| `getStructuredExportData` | Kopierter HeartRate-Snapshot ohne Aktivitaetsobjekte oder live lesende Callbacks. |
| `EXPORT_FAMILY_RENDERERS`, Chart-Ressourcenliste | HeartRate ueber vorhandene Chart-Neuzeichnung rendern und korrekt freigeben. |
| `export-utils.js`: Titel/Slug und `planExportPages` | `heartRate` als scatterartige Chartfamilie, kein DOM-only-Sonderweg. |
| Legende / ChartInput | Benannte Reihen mit unterscheidbaren Punktglyphen auch im PNG; bisherige Familien visuell nicht veraendern. |

`getExportData()` liefert `null`, wenn kein aktuelles nichtleeres Modell existiert, sonst die kopierten Punkt-/Kontextdaten aus [data-model.md](../data-model.md). Formatabhaengige private Neuzeichnung verwendet nur diesen angeforderten Stand.

Unterstuetzte PNG-Formate: square 1080 x 1080, portrait 1080 x 1350 und story 1080 x 1920 einschliesslich vorhandener Safe Bounds. Vorschau, Schliessen, Speicherdialog und Anchor-Fallback bleiben der vorhandene lokale Ablauf. Keine JPEG-/WebP-/SVG-/Video-Erweiterung.

Vor Veroeffentlichung einer noch laufenden HeartRate-Aufnahme muessen Dataset- und lokale Modellrevision passen. Eine schon sichtbare Vorschau bleibt als Snapshot des angeforderten Stands gueltig; Formatwechsel verwenden diesen Stand. Neuer Share-Aufruf nach Filterwechsel verwendet immer den neuen Stand. Bei Filter-Leerzustand oder Ersatzimport alte HeartRate-Vorschau schliessen und deren Downloadziel ungueltig machen. Bestehende Objekt-URL-Ownership und Freigabe nicht fuer andere Ansichten veraendern.

## 7. Erforderliche Integrationspruefungen

Tabkonstanten, Markup, Dispatch und Tests muessen im selben Feature konsistent sein. Testfaelle decken eine einzelne Extremart, beide Arten, Ueberlagerungen, importweite Verfuegbarkeit, Filter-Leerzustand, Quellenwechsel, Snapshotwechsel und Nichtmutation ab. Die konkrete Abnahmeanleitung und Befehle stehen in [quickstart.md](../quickstart.md).