# Quickstart Validation: Herzfrequenz-Min-/Max-Entwicklung

## Status und Voraussetzungen

Die Implementierung und ihre automatisierte sowie browserbasierte Abnahme sind abgeschlossen. Diese Anleitung beschreibt reproduzierbare Pruefungen; die tatsaechlich ausgefuehrten Nachweise und verbleibenden Plattformgrenzen stehen im Implementierungsprotokoll am Ende. Keine Server- oder API-Aenderung war erforderlich.

Voraussetzungen: Node.js/npm fuer Root-Jest, Python fuer einen statischen Server und ein vorhandener Browser mit Desktop-/Touch-Testmoeglichkeit. Befehle vom Repository-Root ausfuehren. Falls Root-Abhaengigkeiten fehlen, `npm install` verwenden. Nur synthetische oder ausdruecklich freigegebene lokale Exporte verwenden; private Gesundheitsdaten nicht versionieren.

## 1. Fokussierte automatisierte Pruefungen

Nach jeder Implementierungsscheibe zuerst den betroffenen Teil ausfuehren, nicht erst am Ende. Die neuen Testdateien muessen vorhanden sein; `--passWithNoTests=false` verhindert ein irrefuehrendes Gruen durch das aktuelle Root-Skript mit `--passWithNoTests`.

```powershell
npm test -- --runInBand --passWithNoTests=false --runTestsByPath __tests__/heart-rate-utils.test.js __tests__/dashboard-heart-rate.test.js
```

Erwartung: Validierung, unabhaengige Teilwerte, widerspruechliche Paare, chronologische Zuordnung, Einzelpunkte, stabile Trainingsschluessel, ueberlagerte Treffer und unveraenderte Eingaben sind belegt. Beide Reihen enthalten nur echte Punkte.

```powershell
npm test -- --runInBand --passWithNoTests=false --runTestsByPath __tests__/processing.test.js __tests__/zip-importer.test.js __tests__/relevant-export-extractor.test.js __tests__/apple-health-import.test.js __tests__/dashboard-import.test.js
```

Erwartung: Direkte Quellfelder und Einheiten entsprechen [contracts/import-fields.md](contracts/import-fields.md); fehlende Extremfelder schaden keinem Import. Echte Browser-CSV-Normalisierung und CommonJS-Pfad stimmen ueberein. Beide CSV-Reducer erhalten optionale Extremspalten. Ein synthetischer FIT-Decodiertest belegt Feldnummern und Invalid-Sentinel der festgelegten Parserfassung. Bisherige Daten/IDs/Zaehler/Duplikate bleiben gleich.

```powershell
npm test -- --runInBand --passWithNoTests=false --runTestsByPath __tests__/dashboard-core.test.js __tests__/visualization-availability.test.js __tests__/tab-navigation.test.js __tests__/tooltip-selection-utils.test.js __tests__/dashboard-tooltips.test.js __tests__/index-script-syntax.test.js
```

Erwartung: Gemeinsamer Selektor hat dieselbe bisherige Ergebnismenge, Filtergrenzen bleiben inklusiv, Navigation erreicht keine ausgeblendeten Tabs, Markup/Dispatch/Script-Reihenfolge stimmen. Die neue Bridge kollidiert nicht mit Classic-Script-Globals; zusaetzlich im Browser pruefen.

```powershell
npm test -- --runInBand --passWithNoTests=false --runTestsByPath __tests__/export-utils.test.js __tests__/dashboard-export-download.test.js __tests__/dashboard-heart-rate.test.js
```

Erwartung: Capture-Ziel, strukturierter Snapshot, alle drei PNG-Formate, Preview/Download, Leerzustandsperre und Revisionsschutz funktionieren. Bestehende Exportfamilien bleiben unveraendert. Nach Abschluss der betroffenen Scheiben die vorhandene Root-Regressionssuite mit `npm test -- --runInBand` ausfuehren; API-Tests sind ohne API-Aenderungen nicht betroffen.

## 2. Synthetische Referenzhistorie

Bestehende Testhelfer erweitern und eine Historie mit mindestens zwoelf unterstuetzten Trainings aufbauen. Keine neue Beispieldatenfunktion in der Anwendung erforderlich. Auf mehrere Tage/Zeitraeume verteilen und bewusst unsortiert anliefern:

| Fall | Eingabe | Erwartung |
|------|---------|-----------|
| Vollstaendig | min 80, max 170 | Zwei Punkte fuer dasselbe Training. |
| Nur Minimum | min 75 | Nur Minimumspunkt. |
| Nur Maximum | max 180 | Nur Maximumpunkt. |
| Nur Durchschnitt | avg 140 | Kein Extrempunkt. |
| Fehlend | Keine drei Herzfrequenzfelder | Kein Extrempunkt. |
| Ungueltige Gegenseite | min 0, max 165 | Nur Maximum bleibt. |
| Umgekehrtes Paar | min 180, max 160 | Keine Punkte, keine Quellkorrektur. |
| Gleiche Extrema | min 150, max 150 | Zwei einzeln erreichbare Reiheneintraege. |
| Gleiche Positionen | Zwei verschiedene Trainings mit gleichen Werten/Datum | Getrennte Trainingsdetails, keine Zusammenfassung. |
| Gleiche Startzeit | Zwei Trainings mit gleichen Startangaben | Stabile getrennte Schluessel. |
| Fehlende/doppelte IDs | Verschiedene Trainings | Eindeutige unveraenderliche Anzeigezuordnung. |
| Datumsgrenzen | Trainings exakt an min/max des bestehenden Zeitfensters | Einschluss wie bisher, ohne neue Zeitdefinition. |

Laufen, Radfahren und Schwimmen muessen vertreten sein. Weitere negative Faelle: leeres/ungueltiges Datum, unbekannte Sportart, Null/Leerstring/negative Werte, nicht endliche Zahlen und unbekannte Einheit. Diese Faelle duerfen bestehende andere Auswertungen nicht veraendern.

Je Quelle direkte Min-/Max-Faelle sowie nur Durchschnitt und fehlende/ungueltige Angaben entsprechend dem Importvertrag pruefen. Dieselben fachlichen Werte muessen dieselben Ansichtsergebnisse liefern. Synthetische Header sind Vertragsbeispiele, kein Nachweis der Abdeckung aller echten Exportvarianten.

## 3. Lokaler Browserstart

```powershell
python -m http.server 8000
```

Danach `http://localhost:8000` oeffnen. Ist der Port bereits belegt, einen freien Port wie 8001 verwenden. Der Server wird erst fuer die spaetere Browserabnahme benoetigt, nicht fuer die Planerstellung.

## 4. Daten, Filter und Navigation

1. Durchschnitt-only-Historie importieren: kein HeartRate-Tab, kein leeres Panel und kein exportierbares Ziel.
2. Historie mit genau einem datierten Maximum importieren: Tab sichtbar, ein klar erkennbarer Punkt und als leer gekennzeichnete Minimumsreihe. Dasselbe mit nur einem Minimum pruefen.
3. Referenzhistorie importieren: zwei korrekt benannte Reihen, bpm und chronologische Trainingszuordnung pruefen. Das Auswaehlen eines Punkts liefert Datum, Extremart, Sport und eindeutiges Training.
4. Sport jeweils auf All, Run, Bike und Swim setzen. Alle Zeitoptionen der vier vorhandenen Modi pruefen; die Daten bleiben pro Training, niemals Tages-/Wochenaggregate. Trainings exakt auf Grenzen entsprechen dem Distance-Auswahlpfad. Zeitanker bleibt das letzte Training der gesamten Historie, nicht heute oder das letzte Training des gewaehlten Sports.
5. Eine Kombination ohne passende Extremwerte waehlen: Tab bleibt erreichbar, Leerzustand ohne alte Punkte, Share/Export nicht moeglich. Filter zuruecksetzen: korrekte Punkte erscheinen wieder.
6. Bei aktiver HeartRate-Ansicht durch Durchschnitt-only-Import ersetzen: Tab verschwindet auch aus Pfeil-/Tastaturnavigation, aktiver Tab ist gueltig, alte Chart-/Auswahl-/Exportdaten sind nicht erreichbar. Ein fehlgeschlagener Import veraendert den bisherigen Stand nicht.
7. Gleiche Positionen und gleiche Min-/Max-Werte per Touch, Zeiger und Tastatur auswaehlen: jedes Ursprungstraining und jede Extremart ist ueber die lokale Trefferliste erreichbar, ohne verschobene oder erfundene Werte.

## 5. Responsive und Exportabnahme

1. Bei 320, 375, 768 und 1440 CSS-Pixel Breite pruefen: kein horizontaler Seitenueberlauf, keine ueberlappenden Filter/Legenden/Buttons, nichtleere Canvas-Darstellung und lesbare Details. Screenshot und sichtbare Canvas-Punkte protokollieren, nicht nur vorhandenes Canvas-Element pruefen.
2. Bei 375 Pixeln mit Touch und 1440 Pixeln mit Zeiger einzelne sowie ueberlagerte Trainings inspizieren. Tastaturfokus, Trefferauswahl, Pin und Escape pruefen.
3. Fuer beidseitige, nur einseitige und gefilterte Daten jeweils Share/Export oeffnen. Square (1080 x 1080), portrait (1080 x 1350) und story (1080 x 1920) als PNG pruefen. Vorschau und heruntergeladenes Bild muessen denselben angeforderten Stand, beide Reihennamen, unterscheidbare Kennzeichnung, Datum/bpm und Sport-/Zeitkontext ohne Clipping zeigen.
4. Vorschau schliessen: Filter und Ansicht bleiben erhalten. Filter wechseln und neu teilen: neuer Stand. Bei offenem Snapshot bedeutet ein Formatwechsel weiterhin denselben angeforderten Stand, nicht heimlich neue Daten.
5. Filter waehrend noch laufender Aufnahme aendern: keine neue Vorschau des alten Stands darf veroeffentlicht werden. Filter-Leerzustand beziehungsweise Ersatzimport schliesst eine alte HeartRate-Vorschau und sperrt deren Downloadziel. Keine Aenderung an den Exportregeln anderer Tabs.
6. Speicherdialog sowie vorhandenen Anchor-Downloadfallback pruefen, soweit der Testbrowser die Varianten unterstuetzt. Keine neue Remote-Share-Schnittstelle verwenden.

## 6. Regressions-, Datenschutz- und Skalierungsnachweis

Vorher-/Nachher-Ergebnisse fuer dieselben Referenzimporte vergleichen: nach Entfernen ausschliesslich der beiden optionalen Extremfelder muessen bisherige Trainingsfelder, IDs, Anzahl und Ergebnisse anderer Ansichten/Filter identisch sein. Exportbezeichnungen/Legenden anderer Familien duerfen sich nicht unbeabsichtigt aendern.

Browser-Netzwerkprotokoll beim Importieren, Betrachten und Exportieren inspizieren: keine durch das neue Feature verursachte Uebertragung individueller Herzfrequenzen. Bestehende CDN-/App-Anfragen sind nicht pauschal verboten; die App wird nicht als komplett netzwerkfrei bezeichnet.

Modellbildung zusaetzlich mit einer synthetischen Historie von 10.000 Trainings messen und Ergebniszahl dokumentieren: maximal 20.000 Punkte, keine verlorenen qualifizierten Trainings und keine Sampleverarbeitung. Browser-/Geraetekontext und Laufzeiten aufzeichnen; dies ist eine Skalierungsprobe, kein neu erfundenes Zeit-SLA.

## 7. Traceability und Abschluss

| Erfolgskriterium | Verbindlicher Nachweis |
|-----------------|-----------------------|
| SC-001 | Zwoelf-Trainings-Modelltest und Browserdetails, exakter Vergleich aller Punktzuordnungen. |
| SC-002 | Quellen-/Validitaetsmatrix einschliesslich echter FIT-Decodierung und unabhaengiger Teilwerte. |
| SC-003 | Einwert-, Nullwert- und Ersatzimportpruefungen in Verfuegbarkeit, Navigation und Export. |
| SC-004 | Selektor-Paritaet und vollstaendige Sport-/Zeitoptionsmatrix einschliesslich Grenzen/Leerzustand. |
| SC-005 | Vier Layoutbreiten und Touch-/Zeiger-/Tastaturpruefung ueberlagerter Punkte. |
| SC-006 | Drei PNG-Formate je Datenkonstellation, Vorschau/Download sowie Revisions-/Leerzustandspruefungen. |
| SC-007 | Vergleich bestehender Trainingsfelder/IDs/Zaehler und bisheriger Visualisierungsergebnisse; Root-Regressionssuite. |
| SC-008 | Netzwerkpruefung des neuen lokalen Daten-/Exportflusses. |

Abnahmeergebnisse mit Datum, Browser, Viewports, ausgefuehrten Tests und verbleibenden Einschraenkungen dokumentieren. Nicht ausgefuehrte Browser-/Dateidialog-/Parserchecks als unverifiziert kennzeichnen, nicht als bestanden. Erst nach vollstaendiger Implementierung und diesen Nachweisen ist die Funktion fertig.

## Implementierungsprotokoll 2026-11-04

- T001: Vor Codeaenderungen alle 13 vorhandenen Import-/Core-/Availability-/Navigations-/Tooltip-/Syntax-/Export-Suiten aus dieser Anleitung mit `--runInBand --passWithNoTests=false --runTestsByPath` ausgefuehrt: 779 Tests bestanden, keine Fehler, 33.911 Sekunden unter Windows/Node.js 24.19.0.
- Setup: Statische Browser-App und Root-Jest bestaetigt. `.gitignore` deckt `node_modules/`, `coverage/`, `dist/`, `build/`, `.env*`, Logs und private Daten ab. Keine neue Docker-/Terraform-/Helm-/Lint-/Publishing-Konfiguration erforderlich.
- T002: `fit-file-parser@1.10.0` als exakte Root-Dev-Abhaengigkeit installiert; ein synthetisches FIT mit Sessionfeldern 64/17 decodiert offline Minimum 75 und Maximum 180 bpm. npm meldet 13 Sicherheitswarnungen im Abhaengigkeitsbaum; kein pauschales Audit-Fix/Parserupgrade ausgefuehrt.
- T003-T006: Rote Ausgangstests fuer fehlende Utility/Selektor bestaetigt; danach 16 Validitaetstests und die vollstaendige Core-Suite gruen (zusammen 53 Tests, 0.586 Sekunden). Alle vorhandenen Sport-/Zeitoptionen und inklusive Datumsgrenzen bleiben identisch.
- T007-T019: Quellenvertraege zuerst rot bestaetigt, danach 7 Suiten / 242 Tests gruen (10.484 Sekunden). Echte FIT-Sessionfelder einschliesslich Invalid-Sentinel, Browser-/CommonJS-CSV-Paritaet, Apple-Statistikzuordnung, beide Reducer, zwoelf Trainings und Renderer-Ueberlagerungen nachgewiesen.
- T020-T027: 8 Integrationssuiten / 310 Tests gruen (1.180 Sekunden). Browser-Smoke unter `http://127.0.0.1:8000`: echte Script-Bruecken, Punktzahlen `[1, 2]`, drei gemeinsame Filterfelder, stabil erreichbarer Filter-Leerzustand mit gesperrtem Share sowie datenloser Ersatzimport mit Distance-Fallback und zerstoertem Altchart bestaetigt.
- Browserumgebung: Die integrierte Instanz hielt zeitweise alte Classic-Scripts im Cache. Ein frischer Loopbackabruf und eine lokale Script-Route mit Build-Parameter und ohne bedingte Cache-Header stellten die aktuelle Ausfuehrung sicher. Die abschliessenden erfolgreichen Pruefungen verwenden echte CDN-Bibliotheken, keine Wordcloud-/Chart-Stubs. Der bestehende entfernte Analysezaehler meldet fuer localhost/Loopback CORS; das neue Feature uebertraegt keine Herzfrequenzwerte dorthin.
- T028-T035: 7 Utility-/Core-/Tooltip-/Export-Suiten / 420 Tests gruen (1.232 Sekunden); danach Exportmarker anhand der echten Vorschau fuer PNG-Lesbarkeit auf 10 Pixel vergroessert und Renderer-Snapshottests erneut gruen.
- T036: 24 echte Browser-PNG-Faelle bestanden: 375 und 1440 CSS-Pixel, jeweils beide Extremarten, nur Minimum, nur Maximum und Bike-Filter, jeweils square/portrait/story. Dekodierte Groessen 1080 x 1080 / 1080 x 1350 / 1080 x 1920, erwartete Punktzahlen 16 / 1 / 1 / 4 und gueltige PNG-Blobs (je 142-178 kB) bestaetigt. Die Square-Vorschau wurde visuell geprueft.
- T034/T036 Browser: Veroeffentlichten Bike-Snapshot nach Wechsel auf Run einschliesslich Formatwechsel erhalten; neuer Share-Aufruf nimmt Run. Filter-Leerzustand schliesst Vorschau/Downloadziel. Eine vor der Fontfreigabe veraltete Aufnahme wird ohne Veroeffentlichung verworfen; neue Anforderungen bleiben moeglich.
- Anfaengliche Downloadgrenze: Der integrierte Browserhost liefert beim Anchor-Fallback kein Playwright-Downloadereignis. Dieser erste Versuch allein war kein Dateisystemnachweis. Die Luecke wurde anschliessend durch den unten dokumentierten unabhaengigen Edge-Lauf mit echter gespeicherter PNG-Datei geschlossen. Der native Betriebssystem-Speicherdialog wurde weiterhin nicht automatisiert bedient; dessen Picker-/Fehler-/Cleanupvertraege sind in den bestehenden Downloadtests gruen.
- T037: README und Importdokumentation beschreiben direkte optionale Quellwerte, Einzelauswahl, Filter-Leerzustand und lokale Exporte. Beispieldaten ohne Extremwerte erhalten keinen erfundenen HeartRate-Tab; der zugehoerige Bestandstest prueft dies explizit.
- T038: Finale vollstaendige Root-Suite: 47 Suiten / 1477 Tests bestanden, keine Fehler, 48.902 Sekunden. Vorherige Trainingsfelder, IDs, Zaehlungen und Filterparitaet sind abgesichert; keine API-Service-Aenderung.
- T039: Unabhaengige Abnahme mit vorhandenem Microsoft Edge 156.0.4314.58 (headless), transientem Playwright 1.56.1, Windows x64, Device Scale Factor 1. Feste Viewports 320/375/768/1440 x 1000 CSS-Pixel, keine horizontalen Ueberlaeufe, alle Controls passend, jeweils nachgewiesene gruene und rosa Canvas-Marker. Screenshots aller vier Breiten visuell geprueft. Der integrierte Browserhost hatte Bildschirmgroessen-/Compositorartefakte und wird fuer diese Screenshotnachweise nicht herangezogen.
- T039 Interaktion: Bei 375 Pixeln vier ueberlagerte Min-/Max-Eintraege durch echten Touch-Tap einzeln erreichbar; Auswahl identifiziert das zweite Ursprungstraining. Bei 1440 Pixeln liefert der echte Mausklick dieselben vier Eintraege. ArrowRight, Enter und Escape pruefen fokussierte Inspektion, Pin und Dismiss. Alle 76 bestehenden Sport-/Zeitoptionskombinationen liefern die erwarteten Punktmengen.
- T036/T039 Downloadnachweis: Der unabhaengige Edge-Lauf dekodiert square/portrait/story mit 1080 x 1080 / 1080 x 1350 / 1080 x 1920 Pixeln. Ein echter Anchor-Download wurde fehlerfrei auf dem Dateisystem gespeichert und sein PNG-Header geprueft: 1080 x 1080, 148964 Bytes. Die heruntergeladene Datei wurde visuell auf lesbare Achsen, Kontext und getrennte Kreis-/Dreiecklegende geprueft. Bericht, Screenshots und synthetisches PNG liegen nur im lokalen Temp-Verzeichnis, nicht im Repository.
- T040: 10.000 synthetische Trainings ergeben exakt 20.000 Punkte, ohne Mutation. Auf Node.js 24.19.0 / Windows x64: Worst-Case-Eignungspruefung mit passendem Wert erst im letzten Training 0.9583 ms; Modellbildung inklusive Sortierung 8.2671 ms. Dies sind Messwerte, kein neues Zeit-SLA. Utility-Suite mit Skalierung: 19 Tests bestanden.
- T041: Neue Utility und Renderer enthalten keine Fetch-/XHR-/Beacon-/WebSocket- oder Browser-Persistenzschnittstellen. Der unabhaengige Browserlauf beobachtete null entfernte Requests mit Herzfrequenzfeldern und null JavaScript-Laufzeitfehler. Alle neu verwendeten Fixture- und Browserdaten sind synthetisch; bestehende CDN-/App-Netzwerkgrenzen bleiben unveraendert.
- T042: FR-001 bis FR-015 sind umgesetzt und den Aufgaben-/Abnahmenachweisen zugeordnet. Native Touch-Hardware und der Betriebssystem-Speicherdialog wurden nicht manuell bedient; Touch-Emulation, echter PNG-Download und die vorhandenen Pickervertraege sind nachgewiesen. Die temporaere externe Browserautomation fuegt keine Projektabhaengigkeit oder Repository-Testinfrastruktur hinzu.

| Erfolgskriterium | Ergebnis | Tatsaechlicher Nachweis |
|-----------------|----------|------------------------|
| SC-001 | PASS | Zwoelf Trainings, exakte getrennte Punktzuordnung und Nichtmutation in Utility-/Renderer-/Browsertests. |
| SC-002 | PASS | CSV-Browser-/CommonJS-Paritaet, echte FIT-Felddecodierung/Invalid-Sentinel und konservative Apple-Statistikmatrix. |
| SC-003 | PASS | Null-/Einwertschwelle, Filter-Leerzustand und Ersatzimport ohne alte Chart-/Navigations-/Exportziele. |
| SC-004 | PASS | Selektor-Paritaet einschliesslich Grenzen und 76 echte Browser-Filterkombinationen. |
| SC-005 | PASS | Vier unabhaengige Viewports/Screenshots/Canvaschecks; Touch, Maus und Tastatur identifizieren Ueberlagerungen. |
| SC-006 | PASS | 24 PNG-Daten-/Format-/Viewportfaelle, eingefrorene Vorschau, Revisionsabbruch und echter gespeicherter Download. |
| SC-007 | PASS | Unveraenderte Altwerte/IDs/Zaehler und 47 gruen bestandene Root-Regressionssuiten. |
| SC-008 | PASS | Statischer Schnittstellencheck und Netzwerkbeobachtung ohne entfernte Herzfrequenzrequests. |