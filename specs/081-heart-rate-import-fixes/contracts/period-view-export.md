# Contract: Heart-rate Calendar View, Range and Export

## 1. Reine Periodenbildung

`buildHeartRatePeriodModel(filteredActivities, { aggregation, getActivityKey, rangeStart, rangeEnd })` in `src/heart-rate-utils.js` liefert das Modell aus [data-model.md](../data-model.md). Eingabe ist die bestehende global gefilterte Trainingsliste; keine zweite Sport-/Zeitraumengine in der Utility. Bisherige Timeline-/Validierungsfunktionen bleiben kompatibel.

| Modus | Kalenderperiode / Schluessel | Extremregeln |
|-------|-----------------------------|-------------|
| `daily` | Lokaler Trainingstag, `YYYY-MM-DD` | min der gueltigen Trainingsminima, max der Maxima. |
| `weekly` | Montag bis Sonntag, eindeutiges Montagdatum | Dieselben getrennten Regeln; Wochen ueber Jahreswechsel nicht aufspalten. |
| `monthly` | Kalendermonat, `YYYY-MM` | Keine rollierende 30-Tage-Gruppe. |
| `yearly` | Kalenderjahr, `YYYY` | Keine rollierende 365-Tage-Gruppe. |

Reihenfolge: bestehende Filter -> bestehende Extremvalidierung -> Kalendergruppe -> unabhaengige Extremwerte. Keine Summen/Mittelwerte, Paarpflicht, Glaettung, Jitter, Nullperioden oder Verbindungslinien. Kalenderfortschaltung mit lokalen Date-Operationen; normalisiertes `date` statt neuer UTC-Ableitung verwenden.

Jede Periode behaelt kopierte Contributors und je Extremart alle gleichwertigen Ursprungstrainings mit `activityKey`, `sourceOrdinal` und Provenienz. Ein Aggregatpunkt darf nicht nachtraeglich so dargestellt werden, als sei er ein einzelnes zufaellig gewaehltes Training. Die bestehende Detailtrefferliste faechert die jeweiligen `sources` auf; alle Contributors bleiben in den Periodendetails erreichbar.

## 2. Bestehende Filter, neue lokale Anzeigegrenzen

`src/dashboard-heart-rate.js` verwendet weiterhin `getDashboardFilteredActivities`, `selectedSportFilter`, `selectedAggregationLevel`, `selectedTimeframeByAggregation` und den bisherigen Keyboardadapter. Kein unabhaengiger Zustand und keine Sport-Mehrfachauswahl.

Lokale HeartRate-Funktion `getHeartRateViewRange(filteredActivities)`:

- begrenzte Option: vorhandenen Gesamtimport-Maximaltermin aus `getTimeframeRange` und `shiftDateByUnit` mit `getCurrentTimeframeOption` verwenden, aber den vorgeschlagenen Anfang fuer die Anzeige nicht an der Historie klemmen;
- All: erste/letzte gueltige Datierung aller ausgewaehlten unterstuetzten Trainings, auch ohne Extrema;
- keine gemeinsamen Core-Grenzen, Anker oder Datefilter anderer Ansichten aendern;
- echte Displaygrenzen und angeforderte Grenzen separat halten, falls ein All-Einzelpunkt rein optisches Padding benoetigt.

Perioden erst aus den ausgewaehlten Trainings bilden. `x` liegt mittig zwischen `max(periodStart, rangeStart)` und `min(periodEndExclusive - 1, rangeEnd)`; dadurch bleibt ein Randperiodenwert sichtbar. Unterschiedlich angeforderte begrenzte Zeitfenster zeigen unterschiedliche Achsen und Kontext, auch wenn dieselben Trainings enthalten sind. Leerabschnitte bleiben ohne Messpunkte.

Die ausgewaehlte Gruppierung wird sichtbar als Kalendergruppierung bezeichnet, nicht bloss als Auswahl von Zeitoptionen. Der Zeitraumkontext nennt den angeforderten Bereich. Die vorhandenen Controls/Adapter aktualisieren sich bei Maus, Tastatur, Tabwechsel und Ersatzimport konsistent. Ein leerer gefilterter HR-Stand entfernt Chart/Details/Exportsnapshot und sperrt Export; der importweit geeignete Tab bleibt erreichbar.

## 3. Unveraenderte Navigations- und Aufnahmeidentitaeten

`heartRate`, `vizTabHeartRate`, `vizPanelHeartRate`, `heartRateChart`, `heartRateChartWrapper`, `heartRateShareBtn`, `heartRateEmptyState`, `heartRateDetails` und vorhandene Filter-IDs bleiben erhalten. Keine Umordnung oder Umbenennung bestehender Tabs. Navigation, Markup, Dispatch und zugehoerige Tests werden konsistent regressionsgeprueft, nicht kuenstlich neu verdrahtet.

Da keine neue Scriptdatei vorgesehen ist, bleibt die bestehende Ladereihenfolge erhalten. CommonJS-/Browserausfuehrung der erweiterten Utility und die bisherigen Syntax-/Reihenfolgetests muessen bestehen bleiben.

## 4. Exportbutton nach etabliertem Layout

Die bestehende Nachbarkopfzeile ist die Referenz, kein neues freies Design: Strava-Logo -> `Export for Insta / Strava` -> Instagram-Logo, bestehende `viz-export-button`-Klasse und etablierte Border-/Padding-/Typography-/Disabled-Regeln. Capture- und Button-ID sowie bestehender Exporthandler bleiben erhalten.

Titel, kompakte Filter und genau ein Exportbutton bilden dieselbe responsive Kopf-/Bedienleiste wie vergleichbare Diagrammansichten. Auf breiten Viewports bleibt der Export an der vorgesehenen Position, auf schmalen Viewports folgt er dem etablierten Umbruchmuster. Keine gestreckten Vollbreitenbuttons, abgeschnittenen Texte oder Ueberlagerungen des Diagramms. Zugaenglicher Name und sichtbare Aktion bleiben konsistent.

Abnahme bei 320/375/768/1440 CSS-Pixeln mit visueller Referenz und geometrischem Ueberlaufcheck. Nur die Existenz einer Klasse oder Button-ID ist kein Layoutnachweis.

## 5. Snapshot und PNG-Vertrag

Beim Rendern kopierter `HeartRateRenderContext` ist die Quelle fuer `getExportData`. Keine spaetere Neuinterpretation von Sport-/Timeframe-/Aggregationsglobals innerhalb eines bereits angeforderten Stands. Snapshot enthaelt:

- `aggregation`, Periodenlabels, getrennte numerische Punktreihen und `activityCount`/`periodCount`;
- angeforderte `periodStart`/`periodEnd`, sichtbare `viewBounds` und dazu passenden Sport-/Zeitkontext;
- benannte Minimum-/Maximum-Reihen mit Kreis-/Dreieckunterscheidung und bpm;
- eigenstaendige Chart-Eingaben ohne Aktivitaetsobjekte, Rohsamples, persoenliche Namen, Pins oder live lesende Zustandsfunktionen.

Der bestehende strukturierte Scatter-/Chartressourcenpfad bleibt erhalten. Der Exportkontext muss die Gruppierung sichtbar nennen; Snapshotkopierer darf noetige neue skalare Felder nicht durch eine fehlende Allowlistregistrierung verlieren. `periodCount` bei Bedarf gezielt in der bestehenden Allowlist ergaenzen, statt beliebige neue Daten zu erlauben. Andere Familien bleiben unveraendert.

Alle vorhandenen Formate: square 1080 x 1080, portrait 1080 x 1350 und story 1080 x 1920 einschliesslich Safe Bounds. Neun Weekly/Monthly/Yearly-Formatkombinationen erfordern lesbare Vorschau und echten PNG-Download mit den erwarteten Periodenwerten.

Die bestehende Snapshotregel wird nicht abgeschwaecht: neue Share-Anforderung nimmt aktuelles Modell; laufende veraltete Aufnahme wird verworfen; veroeffentlichte Vorschau behaelt ihren Stand bei Formatwechsel/Download. Filter-Leerzustand und Ersatzimport schliessen alte HeartRate-Vorschauen/Downloadziele. Bestehende Ressourcen-/Objekt-URL-Ownership und Exportfamilien bleiben unangetastet.