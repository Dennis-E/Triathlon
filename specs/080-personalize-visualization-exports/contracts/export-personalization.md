# Contract: Exportpersonalisierung und überprüfbare Aussagen

**Feature**: [spec.md](../spec.md)
**Model**: [data-model.md](../data-model.md)
**Status**: Verbindlicher Designvertrag für die folgende Implementierung, keine bereits implementierte Schnittstelle.

## 1. Aktuelles Zielinventar

Bestehende IDs und Verfügbarkeit bleiben unverändert. Diese Liste richtet sich nach `EXPORT_CAPTURE_TARGET_IDS`, nicht nach überholten Angaben früherer Featureinventare.

| Zielschlüssel | Capture-ID | Varianten / notwendige Prüfung |
|---------------|------------|-------------------------------|
| `totalDistance` | `totalDistanceChartWrapper` | Verfügbare Aggregationen, Sportauswahl, Teilperioden |
| `paceMetrics` | `paceMetricsChartWrapper` | Beide Messgrößen/Achsen, Pace/Speed, sichtbare Serien, Punktgröße |
| `equipment` | `equipmentChartWrapper` | Rankingmetrik, Equipmentfilter, Gleichstände |
| `equipmentTimeline` | `equipmentTimelineWrapper` | Markierungen/Nutzungsspannen, Equipmentfilter, Fortsetzungen |
| `personalBests` | `pbColumnsContainer` | Sichtbar angebotene Übersicht, alle datenbedingt verfügbaren Definitionen |
| `heatmap` | `heatmapMapContainer` | Sport, Zeitraum, Kartenansicht, Skala und Attribution |
| `distributions` | `distributionsChartWrapper` | Aktive Messgröße, Intervalle, Sport |
| `workoutTime` | `workoutTimeChartWrapper` | Granularitäten, Count/Dauer/Distanz, Startanalyse |
| `trainingCalendar` | `trainingCalendarYears` | Nur soweit Export regulär verfügbar; keine Defektreparatur |
| `wordcloud` | `wordcloudCanvas` | Ausgewählte Wörter und Gewichtung, kein zusätzlicher Titelabzug |
| `pieCharts` | `pieChartsCaptureArea` | Aktive Gruppierung, Anteilsgröße, Sport und Zeitraum |
| `lifetimeStatistics` | `lifetimeStatisticsExportArea` | Bestehender Inhaltsumfang; ausgeschlossene Inhalts-/Abschneidethemen getrennt |
| `mediaGallery` | `mediaGalleryExportArea` | Jahresrückblicke, Collagen, bewusste Medien-/Routenauswahl |

PB-Details verwenden zusätzlich `kind: 'pb-tile'`, ihre bestehende `detailKey`-Zuordnung und `pbDetailCaptureTarget`; sie gehören zur Familie `personalBests`, nicht zu einem neuen Tab. Zur Prüfung gehören alle verfügbaren Distanz-, längste-Aktivität-, Höhenmeter-, Bike-Power-Dauer- und All-time-Powerprofil-Details. Ein Aggregatprofil hat je Dauerpunkt eine eigene Quelle. Medien- und Fortsetzungsvarianten erben dieselbe Text-/Revisionsentscheidung.

## 2. Reine Hilfsschnittstellen

Neue Funktionen sind additive APIs, keine Umbenennung existierender Exports.

| Eigentümer / Funktion | Eingabe | Ausgabe / Verpflichtung |
|-----------------------|---------|-------------------------|
| `exportPunchlineUtils.validateCustomPunchline(input)` | Text oder ungültiger Eingabewert | `{valid, text, length, error}`; äußeres Trimmen, Unicode-Codepoints, 1–120, kein inneres Umschreiben; nicht-string als ungültig behandeln |
| `exportPunchlineUtils.buildPunchlineSuggestions(snapshot)` | Eingefrorener zulässiger Export-Snapshot | Deterministische Liste belegter Vorschläge mit `basis` plus neutralem Fallback; keine Datenmutation, kein I/O |
| `exportPunchlineUtils.resolvePunchline(selection, suggestions)` | Bestätigte Textquelle/Aktivierung und zum Snapshot gehörende Vorschläge | Genau ein Text oder deaktivierter Zustand; fehlender veralteter Vorschlag führt zu expliziter Invalidität, kein stiller Textwechsel |
| `workoutTimeUtils.analyzeWorkoutTimeStarts(activities, filters)` | Vorhandene Aktivitäten und Sport-/Datumsfilter | Kompakte `WorkoutStartTimeAnalysis`; keine Rohaktivitäten in der Ausgabe; bestehende Diagrammfunktionen bleiben unverändert |
| `exportUtils.planExportPages(snapshot, options, measurements)` | Bestehende API plus bestätigte Punchline-/Messinformationen | Gemessene Textblöcke und Seitenplan; höchstens zwei Punchlinezeilen, verständlicher Fitfehler statt Kürzung |

Neue Browserbridge `window.exportPunchlineUtils` und gleichnamiger CommonJS-Export. Keine Browser- oder DOM-Zugriffe beim Laden. Das neue Script wird direkt nach den vorhandenen Export-Utilities und vor Dashboard-Orchestrierung eingefügt. Die vorherige relative Reihenfolge aller bestehenden Scripts wird nicht verändert. Syntax-/Loader-Doubles müssen das Utility ebenfalls vor `dashboard-export.js` laden.

Die bestehenden Optionen `humorEnabled`, `caption` und das Präsentationsfeld `secondaryLine` dürfen als interne Kompatibilitätsbrücke erhalten bleiben, werden aber aus dem einen bestätigten Punchlinezustand gespeist. Es gibt keine zweite Caption und keine unabhängigen widersprüchlichen Humor-/Punchlinequellen. Die bisherige Zehnwortnormalisierung ist nicht der Validierungspfad für eigene Texte.

## 3. Exportdialog

- Reihenfolge der Layoutoptionen: Reel / Story (`story`), Square (`square`), Feed portrait (`portrait`). Beim bewussten Start jeder Sitzung ist `story` ausgewählt; Auswahlwechsel innerhalb derselben Sitzung bleibt bestehen.
- Die bestehende Humor-/Light-line-Steuerung wird als `Add a punchline` geführt, standardmäßig aktiv. Eine native Checkbox/ein Toggle steuert nur ihre Sichtbarkeit.
- Vorschläge sind über ein Auswahlmenü erreichbar; eigener Text besitzt ein klar beschriftetes Eingabefeld und eine explizite Bestätigung. Ein separater Rückkehrbefehl stellt den vorherigen bestätigten Text wieder her. Kein Vorschlag überschreibt eine bestätigte Nutzereingabe von selbst.
- Die Quelle ist in der Steuerung als eigener Text oder Vorschlag erkennbar. Für Datenvorschläge ist die Grundlage einsehbar; sie besteht aus fachlichem Auswahlbezug, Messkriterium, Wert/Anteil und notwendigen Einschränkungen. Neutraltexte sind keine Analysebefunde.
- Fehler werden am Textfeld verständlich gemeldet. Eine angewendete ungültige aktive Fassung sperrt den Download, auch wenn das vorige Bild noch sichtbar ist. Die Vorschau darf das alte Bild während der Aktualisierung zeigen, aber nicht als fertige neue Fassung ausgeben.
- Die Kontrollen müssen per Tastatur bedienbar und programmatisch beschriftet sein. Die schmale Vorschau darf weder Bild noch Eingabe-/Downloadkontrollen unzugänglich machen.
- Keine Persistenz zwischen Sitzungen, keine neuen Nutzerkonten und kein Dienst für Formulierungen. Die Anwendung rendert Texte als Text, nicht als HTML.

## 4. Semantischer Kontext und Bildhierarchie

Der Kontext wird vor der Bildzeichnung aus erlaubten Daten aufgebaut, nicht durch nachträgliche Textsuche im Bild bereinigt.

| Ausgangsbedeutung | Vertragsgemäße Ausgabe |
|-------------------|-----------------------|
| Messgröße Distance | `Distance`, nicht `Metric: Distance` |
| Zeitraum 2024–2025 | `2024–2025`, ohne vorangestellte Periodenbezeichnung |
| Einheit Kilometer | `km`, ohne `Unit:`; nicht doppelt, wenn dieselbe Einheit bereits eindeutig danebensteht |
| Zwei Achsen Länge/Aktivitäten | Kurzer Zusammenhang wie `Length vs activities`; notwendige Skalen/Einheiten bleiben |
| Standard All sports | Nur weglassen, wenn die Auswahl anderweitig eindeutig ist; Einzelsporeinschränkung sonst erhalten |
| Interne Auflösung `2-hour-blocks` | Nicht ausgeben; die sichtbaren verständlichen Zeitintervalle bleiben interpretierbar |
| Teiljahr, Schätzung, begrenzte Medienauswahl | Notwendige Einschränkung erhalten, auch bei kürzerem Text |

Inhaltsgleiche Angaben werden semantisch dedupliziert, nicht anhand bloßer gleichlautender Wörter. Quell-/Datumsangaben und ein vom Nutzer geschriebener Text sind keine zu bereinigenden Filterlabels.

Lesefolge: Thema/gegebenenfalls Schlüsselwert, aktive Punchline, erforderlicher Detailkontext, Visualisierung und Branding. Provenienz/Attribution bleiben an sicherer lesbarer Position. Punchline mindestens 1,25 × unterstützende Kontextschrift, höchstens zwei Zeilen. Ausgeschaltet: kein Captionblock, kein reservierter Leerraum. Die Komposition gewinnt den Platz zurück.

Story-Sicherheitsbereich: x=72 bis 960, y=240 bis 1560 bei 1080 × 1920. Vorhandene Mindestsichtbarkeit und Kontraste bleiben gültig. Logo proportional; tatsächliche sichtbare Höhe im Story-Bild mindestens 1,5 × Square bei gleicher Bildbreite. Boxgröße allein genügt nicht als Nachweis. Alle Formate behalten ihre Maße; geänderte Header-/Footerhöhen fließen vor der Pagination in das verbleibende Datenbudget ein.

## 5. Evidenzregeln für Vorschläge

- Bezug immer auf denselben eingefrorenen Snapshot und die aktive Messgröße, nicht auf beliebige Gesamtdaten oder eine spätere Filteränderung.
- Datenvorschläge nur bei vorhandener vollständiger Vergleichsgrundlage. Ein führender Wert darf nicht als alleiniger Sieger bezeichnet werden, wenn Gleichstand besteht. Ein Punkt trägt keine Verbesserung oder Gewohnheit.
- Keine Gesundheits-, Charakter-, Kausalitäts- oder nicht erfassten Alltagsaussagen. Spielerischer Ton darf die Fakten nicht verändern.
- Jede Familie aus Abschnitt 1 bekommt einen dokumentierten belegten Vorschlag oder einen begründeten neutralen Fallback nach der Fähigkeitsmatrix in [research.md](../research.md). Ein verfügbarer eindeutiger Befund wird nicht pauschal ignoriert, um die Prüfung zu umgehen.
- Workout-Time-Vorschläge nutzen ausschließlich die vier Fenster und Mindestwerte aus [data-model.md](../data-model.md). `Morning bird` nur für Morgen, `Night owl` nur für Nacht; Abend und Nachmittag erhalten wörtlich passende Vorschläge. Der Beleg nennt gültige/ausgeschlossene Anzahl und startbezogene Berechnung, auch bei Dauer-/Distanzgrafiken.
- Fehlender Uhrzeitnachweis führt zum Ausschluss samt Grund, nicht zu einer geratenen Zeit. Die vorhandene Diagramm-Auswertung kann davon unabhängig ihre bisherigen Legacy-Zeiten verwenden; diese werden ausdrücklich nicht nachträglich als verlässliche Quellen für Gewohnheiten behandelt.
- Vorschläge zu Beispieldaten beziehen sich sichtbar weiterhin auf synthetische Daten. Es werden weder echte Erfolge behauptet noch sensible Originaldaten als Prüfartefakte veröffentlicht.

## 6. PR-Quellen und Achsen

`buildPbExportData` erhält bestehende Rekordwerte und ihre Zuordnung, ergänzt nur `source`. Der Snapshot erlaubt diese Quellfelder nur an PB-Recordpositionen. Generelle Verbote für Rohaktivitäten, Aktivitätsnamen/-titel und präzise Orte anderer Familien bleiben bestehen. Die gezielte PB-Titeloffenlegung wird in der Vorschau sichtbar; keine zusätzliche Titelweitergabe in neutrale Vorschläge anderer Familien.

| Interne Quellenart | Verständliche Bedeutung im Bild |
|--------------------|--------------------------------|
| `modeled` | Aus Aktivitätsdurchschnitt geschätzt; niemals als gemessene Zieldistanz ausgeben |
| `full-activity` | Ganze Aktivität; abweichende Quell-/Zieldistanz bei Relevanz offenlegen |
| `fit-rolling` | Gemessener Aktivitätsabschnitt |
| Unbekannt | Neutrale Quellbezeichnung; keine Aussage über Messgenauigkeit erfinden |

Workout-Titel ergänzt die Quelle, ersetzt keine notwendige Schätzungskennzeichnung. Ohne eindeutigen Titel neutrale Bezeichnung mit verfügbarem Datum. Keine Zuordnung anhand gleichen Datums, Bestwerts oder ähnlichen Namens.

Kalenderdomain aus tatsächlich dargestellten gültigen Recorddaten, maximal ein angezeigtes Tickintervall Rand je Seite. Ein ausdrücklich ausgewählter größerer Vergleichszeitraum ist nur mit sichtbarer Kennzeichnung zulässig. Keine datasetweite All-time-Grenze als stiller Ersatz. Jahresbezug muss auch bei einem Jahreswechsel über wenige Tage erkennbar sein. Ticks berücksichtigen tatsächliche Textbreite, nicht nur Datensatzanzahl.

Ein Tag: keine suggerierte zeitliche Entwicklung und keine künstlich versetzten Datenpunkte. Mehrere echte Gleichtagsrecords bleiben in Quellen-/Wertzeilen einzeln erhalten. Fehlendes Datum: kein Tick/Punkt bei 1970 oder heute; Record als undatiert zugeordnet erhalten. Keine gültigen Daten: kein erfundener Kalenderverlauf. Dauerprofile behalten ihre Dauerachse, ihre eigenen Punktquellen und fehlende Dauerlücken. Alle Fortsetzungsseiten eines Verlaufs verwenden dieselbe vollständige Domain und geordnete, vollständig erhaltene Recordzeilen.

## 7. Konsistenz, Fehler und Ressourcen

Ein Download benötigt eine fertig vorbereitete Bildseite der aktuellen Sitzung und Präsentationsrevision. Neue Textbestätigung, Aktivierung oder Formatwahl invalidiert die alte Freigabe vor asynchroner Arbeit. Veraltete Fertigstellungen werden verworfen. Ein gestarteter Save bleibt an seine ursprünglichen freigegebenen Bildbytes gebunden. Close-/Dataset-/Capture-Invalidierung verhindern verspätete Aktivierung.

Bild-/Blob-/Medienressourcen behalten die vorhandenen Eigentums-/Freigaberegeln: neue Komposition darf keine Quelle widerrufen, die eine laufende Komposition oder begonnene Speicherung noch benötigt. Keine Blob-Rekonstruktion beim Save. Bestehender Native-Picker-/Download-Fallback und seine Sicherheits-/Fehlerunterscheidung bleiben unverändert; die neuen Zustände werden in denselben Downloadfreigabetest integriert.

Rückmeldungen unterscheiden Eingabefehler, nicht darstellbaren Text, fehlende Analysegrundlage, noch laufende Komposition und Bild-/Speicherfehler. Retry verwendet dieselbe eingefrorene Auswahl; ein neuer Export ist eine explizite neue Sitzung. Deaktivierte Punchline ist ein legitimer Textzustand, kein Analysefehler.

## 8. Ausschlüsse und Kompatibilität

Keine Änderung von Tab-IDs, Navigation, Trainingswerten, Importformaten, Messdefinitionen oder Quellenverfügbarkeit. API-Service und CLI bleiben unberührt. Keine Reparatur des Training-Calendar-Exports, keine Lifetime-Statistics-Inhaltslöschungen oder Abschneidekorrektur, keine Apple-Health-Heatmap-`geoPoint`-Reparatur. Neue Regressionen an gemeinsamen Exportregeln sind trotzdem zu beheben.

Dieser Vertrag ersetzt nur die betreffenden älteren Standards: Square → Story, Humor aus → Punchline an, eine Light-line-Zeile → maximal zwei prominente Punchlinezeilen, PB-Titelunterdrückung → gezielte PB-Quellenfreigabe. Alle anderen gültigen Datenschutz-, Lesbarkeits-, Herkunfts- und Downloadanforderungen bleiben bestehen.