# Quickstart Validation: Heart-rate and Import Fixes

## Status und Voraussetzungen

Dies ist die kuenftige Implementierungs-/Abnahmeanleitung, kein Bericht bestandener Feature-081-Verhaltenstests. Der Planungsworkflow hat nur Designartefakte erstellt. Vorherige Nachweise von Feature 080 und der eine erfolgreiche synthetische Edge-/Loopback-Apple-Import sind Ausgangsevidenz, nicht Abnahme der hier geplanten Korrekturen.

Voraussetzungen: Root-Node/npm mit vorhandenen Abhaengigkeiten, statischer HTTP-Server, aktuelle Chrome-/Edge-/VS-Code-Browser und eine unterstuetzte sichere HTTPS-Bereitstellung desselben Kandidatenstands. Keine API-Aenderung oder neue Produktionsbibliothek erforderlich. Ein vorhandener unabhaengiger Browser darf fuer Screenshots/Downloads transient automatisiert werden; keine neue Projekt-Playwright-Infrastruktur voraussetzen.

Alle Befehle vom Repository-Root ausfuehren. Ausgewaehlte Health-/FIT-Dateien bleiben lokal. Versionierte Referenzfaelle sind synthetisch; reale Rohdaten, Messwerte, Trainingsdaten und Dateinamen gehoeren weder in diesen Bericht noch in die Versionsverwaltung.

## 1. Fokussierte automatisierte Gates

Vor jeder Produktionsaenderung den zugehoerigen Vertragstest ergaenzen und den erwarteten Ausgangsfehler bestaetigen. Nach jeder Aenderung den engsten betroffenen Schnitt pruefen, nicht erst die gesamte Suite am Ende. Die folgenden bestehenden Testdateien erweitern; `--passWithNoTests=false` verhindert falsch gruene fehlende Tests.

### US1: Alias, Quellenbelege und Fallback

```powershell
npm test -- --runInBand --passWithNoTests=false --runTestsByPath __tests__/heart-rate-utils.test.js __tests__/processing.test.js __tests__/zip-importer.test.js __tests__/relevant-export-extractor.test.js __tests__/dashboard-import.test.js
```

Erwartung nach [Importvertrag](contracts/heart-rate-import.md): beobachteter Strava-Alias in echter Browsernormalisierung und CommonJS, leere/identische/konfliktbehaftete Duplikate und beide Reducer. TrainingPeaks nur mit positivem Integritaets-/Abschlussbeleg und eindeutigen originalen Sessiongrenzen ergaenzen. Durchschnitt, Altfelder und Identitaeten bleiben gleich.

Pflichtfaelle fuer echte synthetische FIT-Bytes: direkte Min-/Max-Felder, fehlendes Minimum mit gueltigen Recorddaten, Invalid-Sentinel 255, CRC-Fehler, abgeschnittene Datei, Rueckkehr ohne Callback, Limit-/Downsamplingbeleg, ungueltige Grenzen/Zeitstempel und unbekannte Einheit. Pausentraining mit HR-Minimum nach Timerende, aber vor originalem Sessionende. Ueberlappende Sessions, gemeinsame Grenzrecords, uebersprungene Sportarten und fremde Samples duerfen keine falsche Zuordnung liefern. Keine Recordmocks als alleinigen Parser-/Vollstaendigkeitsnachweis akzeptieren.

### US2: Apple-Faehigkeiten, Fehler und Lifecycle

```powershell
npm test -- --runInBand --passWithNoTests=false --runTestsByPath __tests__/apple-health-import.test.js __tests__/dashboard-import.test.js
```

Erwartung nach [Apple-Vertrag](contracts/apple-health-runtime.md): sichere Enums, getrennte Deployment-/Kontext-/Funktion-/Bibliotheks-/Worker-/Hash-/Inputfehler, Init/Ready/Start, 30-Sekunden-Initialisierungswatchdog, Cleanup und Generationenschutz. Konstruktor-/Clone-/`messageerror`-/kein-Ready-Faelle sowie Abbruch und spaete Nachrichten einzeln testen. Fehlgeschlagener Import erhaelt alte Daten, Charts, Auswahl und Vorschau; Retry mit neuer Generation gelingt. Archiv-/XML-/Ressourcen-/SHA-256-Schutz nicht abschalten.

### US3: Kalender, Bereich und Details

T029 legt ausschliesslich Kalender-/Bereichs-, Control- und Detailtests an, keine neuen Snapshot-/Datenprovider-Assertions. Bestehende Regressionen werden erhalten und fuer die beabsichtigte Kalenderdarstellung korrekt weitergefuehrt, nicht uebersprungen. Deshalb kann T036 den folgenden vollstaendigen US3-Lauf bereits gruen verlangen; die neuen Snapshotvertraege werden erst in T038 unter US4 angelegt.

```powershell
npm test -- --runInBand --passWithNoTests=false --runTestsByPath __tests__/heart-rate-utils.test.js __tests__/dashboard-heart-rate.test.js __tests__/dashboard-core.test.js __tests__/visualization-availability.test.js __tests__/tab-navigation.test.js __tests__/index-script-syntax.test.js
```

Erwartung nach [Periodenvertrag](contracts/period-view-export.md): Filter vor Kalenderaggregation, min der Minima/max der Maxima, alle Gleichstaende mit Ursprungstraining, keine Durchschnitts-/Nullerfindung. Gemeinsame Selektor-/Datum-/Sportsemantik und Tab-IDs unveraendert. Begrenzte Achsen zeigen das angeforderte ungeklemmte Fenster, All die sportpassende Historie einschliesslich Trainings ohne Extrema.

### US4: Layout, Snapshot und PNG

T038 legt saemtliche neuen Snapshot-/Datenprovider-Tests einschliesslich des kopierten RenderContext in den bestehenden Renderer- und Exporttestsuiten an. T039 verlangt nur die Renderer-Datenprovider-/Snapshot-/Nichtmutationsteile gruen; T040 die Exportadapter-/Kontextintegration. T042 fuehrt danach den folgenden gemeinsamen Prueflauf vollstaendig aus.

```powershell
npm test -- --runInBand --passWithNoTests=false --runTestsByPath __tests__/dashboard-heart-rate.test.js __tests__/export-utils.test.js __tests__/dashboard-export-download.test.js __tests__/index-script-syntax.test.js
```

Erwartung: bestehende Exportbeschriftung/Symbolfolge/IDs, Gruppierung und angeforderte Range im kopierten Renderkontext, alle drei Formate und dieselben Revisions-/Published-/Leerzustandsregeln. Andere Exportfamilien und ihre Legenden/Bilder bleiben unveraendert.

## 2. Synthetische Kalenderreferenz

Mindestens zwoelf Trainings aus Run/Bike/Swim ueber mehrere Wochen, mindestens drei Monate und zwei Kalenderjahre. Erwartete Werte pro Training und Periode unabhaengig notieren. Pflichtkonstellationen:

| Fall | Erwartung |
|------|-----------|
| Mehrere Trainings einer Woche mit unterschiedlichen Extremen | Genau min(Minima)/max(Maxima), Ursprung je Extremart erhalten. |
| Nur eine Extremart beziehungsweise gleichwertige Gewinner | Gegenart bleibt fehlend; alle gleichwertigen Trainings erreichbar. |
| Woche ueber Dezember/Januar | Genau eine Montag-bis-Sonntag-Periode, korrekte Jahreskennzeichnung. |
| Monats-/Jahresgrenzen und Sommerzeit | Kalendergrenzen statt rollierender Summen oder 24h-DST-Verschiebung. |
| Zeitraum schneidet Kalenderperiode | Nur eingeschlossene Trainings; Aggregatpunkt bleibt innerhalb der sichtbaren Schnittmenge. |
| Gleichbleibende Trainings bei laengerem begrenztem Fenster | Gleiche y-Werte erlaubt, angeforderte Achsen-/Kontextgrenzen trotzdem anders. |
| All bei einem Sport mit spaeteren Trainings anderer Sportarten | Ganze passende Historie; begrenzte Fenster behalten dagegen den Gesamtimport-Anker. |
| Trainierte Tage ohne Extremwerte und leere Abschnitte | Grenzen behalten History-/Zeitraumsemantik, keine Null- oder Zwischenpunkte. |
| Filter ohne geeignete Extrema | Tab bleibt importweit verfuegbar, Chart/Details/Exportmodell leer. |
| Import ersetzt reichhaltige durch datenarme Historie | Gueltiger Navigationfallback ohne Altchart/-vorschau/-downloadziel. |

Alle vorhandenen Sport-/Zeitoptionen je Aggregationsmodus manuell und per Keyboardadapter pruefen. Fuer denselben Kandidaten muessen Controls, Periodenwerte, Details, Achse und neuer Export dieselbe Auswahl verwenden.

## 3. Reale Apple-Browsermatrix

Lokaler Start, sofern Port 8000 frei ist:

```powershell
python -m http.server 8000
```

Bei bereits belegtem Port einen freien Port verwenden. Fuer die Planung keinen zweiten Server starten. Lokaler Nachweis ueber `http://localhost:8000` oder `http://127.0.0.1:8000`; IPv6-Loopback zusaetzlich als Umgebungsfall pruefen. HTTPS erfordert eine bereits vertrauenswuerdige Bereitstellung desselben Kandidatenstands, keine Umgehung von TLS-/Browser-Sicherheitsregeln. Dieser Workflow deployt nichts und installiert keine Zertifikate.

| Browser | Lokales HTTP | Sicheres HTTPS |
|---------|--------------|----------------|
| Aktueller Chrome | Echter synthetischer Original-ZIP-Import. | Derselbe Kandidat und dieselbe Datei. |
| Aktueller Edge | Echter synthetischer Original-ZIP-Import. | Derselbe Kandidat und dieselbe Datei. |
| Integrierter VS-Code-Browser | Echter Dateiauswahl-/Workerimport. | Derselbe Kandidat und dieselbe Datei. |

Versionen, sichere Kontextklasse, Kandidatenstand und Ergebnis lokal dokumentieren. Alle sechs Durchlaeufe muessen Fortschritt, erwartete Trainings, stabile Wiederimport-IDs und nutzbare verfuegbare Ansichten nachweisen. Nur das direkte Aufrufen der Importerfunktion mit injiziertem ZIP/SAX/Hash oder eine Fake-Worker-Nachricht genuegt nicht. Ein Headless-Edge-Erfolg zaehlt nicht als Chrome-/VS-Code-Nachweis.

Negative Faelle: `file:`, unsicheres Remote-HTTP, fehlende benoetigte Funktion im Fenster oder Worker, blockierte Bibliothek, falscher Export, Worker-Start-/Ready-/Laufzeit-/Transportfehler, Hashfehler und defektes Archiv. Richtige feste Diagnose und passende Abhilfe pruefen, ohne Rohmeldungen/Dateinamen zu loggen. Initialisierung ohne Ready endet nach dem definierten Fenster; laufende grosse valide Imports erhalten kein neues pauschales Zeitlimit. Alter Stand bleibt bei jedem Fehler/Abbruch erhalten, ein bewusster Retry funktioniert.

Der historische Nutzerfehler ist erst konkret reproduziert, wenn dieselbe Fehlerklasse in seiner tatsaechlichen Bereitstellung/Umgebung belegt ist. Kein pauschales Versprechen, dass allein ein anderer Browser ihn behebt. Nicht vorhandene Browser-/HTTPS-Umgebungen bleiben unverifiziert und SC-005 bleibt dann offen.

## 4. Layout und echter Export

1. Bei 320/375/768/1440 CSS-Pixeln HeartRate- und benachbarte Kopfzeilen vergleichen: bestehende Strava/Text/Instagram-Folge, Groesse, Abstaende, Exportposition und bestehendes Umbruchmuster. Genau ein nutzbarer Exportbutton, kein horizontaler Seitenueberlauf oder ueberlagertes Diagramm.
2. Feste unabhaengige Viewports verwenden; tatsaechliche `innerWidth`/`innerHeight` und Canvasmarker pruefen. Der integrierte Browserhost kann seine Groesse an der Editor-Pane zuruecksetzen; solche Screenshots gelten nicht als Viewportnachweis. Screenshots nach vollstaendigem Renderframe aufnehmen und visuell pruefen.
3. Periodengleichstaende bei 375 Pixeln per Touch und bei 1440 Pixeln per Maus sowie Tastatur einzeln inspizieren. Ursprungstraining, direkte/beobachtete Herkunft und Extremart stimmen; globale Tabnavigation darf die fokussierte Dateninspektion nicht uebernehmen.
4. Weekly, Monthly und Yearly jeweils als square/portrait/story ausloesen: neun echte lokale Vorschau-/Downloadfaelle. PNG-Abmessungen 1080 x 1080 / 1080 x 1350 / 1080 x 1920 sowie Periodenwerte, Gruppierung, Sport, angeforderte Grenzen, bpm und Legende pruefen. Die echte gespeicherte PNG-Datei dekodieren und visuell kontrollieren.
5. Filter waehrend laufender Aufnahme wechseln: keine veraltete Veroeffentlichung. Veroeffentlichte Vorschau bei gueltigem Filterwechsel und Formatwechsel eingefroren halten; neue Share-Anforderung nimmt neuen Stand. Filter-Leerzustand und Ersatzimport schliessen Vorschau/Downloadziel. Andere Exportfamilien gleich lassen.
6. Native Speicherdialogvariante und Anchor-Fallback nach Browserunterstuetzung pruefen; eine nicht automatisierte OS-Dialoginteraktion explizit dokumentieren. Ein ausgeloester Link oder ein nicht beobachtbares Downloadereignis ist kein Dateisystemnachweis.

## 5. Altverhalten, Datenschutz und Ressourcen

Vor jeder Implementierungsscheibe Ausgangswerte derselben synthetischen Referenzen erfassen. Vorher-/Nachher-Vergleich darf ausschliesslich die vorgesehenen HeartRate-Extrem-/Provenienzfelder und die korrigierte HeartRate-Ansicht unterscheiden. Alte Durchschnittswerte, IDs, Zaehlungen, Duplikatentscheidungen, Entfernungs-/Zeitwerte und Power-/GPS-/sonstige Visualisierungsergebnisse muessen gleich bleiben.

Lokale reale Referenzexporte nur zur Quellen-/Abdeckungsvalidierung verwenden; keine personenbezogenen Rohdaten oder Einzelwerte in Berichte/Fixtures uebernehmen. Netzwerkbeobachtung bestaetigt null neue Requests mit Gesundheitsdaten; Diagnosen enthalten nur sichere feste Enums/Booleans und werden nicht automatisch uebertragen.

Skalierung mit derselben synthetischen grossen Historie vor/nach Periodenaggregation sowie mit zunehmend grossen gueltigen FIT-/Apple-Eingaben dokumentieren. Optionale strikte FIT-Pruefung nur fuer Kandidatendateien, keine zweite Extraktion oder dauerhafte Rohlistenduplikation. Bestehende Apple-Grossimport-/Limit-/Fortschrittsvertraege bleiben Pflicht; kein erfundenes Performance-SLA.

Nach den fokussierten Tests als gemeinsames Abschlussgate:

```powershell
npm test -- --runInBand
```

API-Tests sind ohne API-Aenderung nicht betroffen. Fremdfehler getrennt berichten, nicht durch den Featureauftrag nebenbei reparieren.

## 6. Traceability und Freigabe

| Kriterium | Verbindlicher Nachweis |
|-----------|-----------------------|
| SC-001 | Strava-Alias-/Duplikatmatrix, echte Browser-/CommonJS-Paritaet und lokale Referenzabdeckung ohne Einzelwerte. |
| SC-002 | Echte FIT-Decoder-/Integritaets-/Grenz-/Provenienzmatrix, direkter Vorrang und konservative Abwesenheit. |
| SC-003 | Zwoelf Trainings ueber Wochen, drei Monate und zwei Jahre; exakte Kalenderextrema und Contributors. |
| SC-004 | Alle vorhandenen Filteroptionen, Randperioden, gleiche Punkte bei verschiedenen angeforderten Achsenfenstern. |
| SC-005 | Sechs echte Browser-/Bereitstellungsimporte und getrennte negative Ursachen, Cleanup/Retry/Altstanderhalt. |
| SC-006 | Vier unabhaengige Viewports mit visueller Nachbarreferenz, Button-/Control-/Ueberlaufnachweis. |
| SC-007 | Neun Perioden-/PNG-Kombinationen mit echter Vorschau, gespeicherter Datei und Revisions-/Leerzustandstests. |
| SC-008 | Altwerte-/ID-/Zaehler-/Visualisierungsparitaet, Root-Regression und keine neue Gesundheitsdatenuebertragung. |

Freigabebericht nennt Kandidatenstand, Browser-/Bereitstellungsumgebungen, ausgefuehrte Befehle und tatsaechliche Ergebnisse. Nicht ausgefuehrte FIT-/Apple-/Browser-/Downloadchecks sind offen, nicht gruen. Planungsartefakte und bestandene Dokumentpruefung ersetzen diese Nachweise nicht.

## 7. Implementierungsnachweise

### T001 - Baseline am 2026-11-05

- Git bleibt auf `main`; vorhandene Feature-080-Aenderungen wurden nicht zurueckgesetzt.
- Checklisten: `requirements.md` mit 16/16 geprueften Kriterien, keine offenen Marker; unveraendert.
- Node v24.19.0, `fit-file-parser@1.10.0`, Root-Jest im Node-Environment; keine Installation oder Abhaengigkeitsaenderung.
- Die 13 unterschiedlichen Suiten aus Abschnitt 1 gemeinsam mit `--runInBand --passWithNoTests=false --runTestsByPath` ausgefuehrt: 13/13 Suiten, 799/799 Tests bestanden, 43.309 Sekunden. Keine Baseline-Fremdfehler beobachtet.
- Chrome 156.0.8078.80 und Edge 156.0.4314.58 installiert. Der integrierte VS-Code-Browser und echte Dateiauswahl werden bei T025 verifiziert; Installation allein ist kein Importnachweis.
- Lokale HTTP-Bereitstellung ist vorgesehen. Eine bereits vertrauenswuerdige HTTPS-Bereitstellung desselben Kandidaten ist noch nicht nachgewiesen; keine Bereitstellung oder Zertifikatsinstallation vorgenommen. Die sechs positiven T025-Faelle bleiben offen.
- `.gitignore` deckt private Daten, Abhaengigkeiten, Build-/Coverageausgaben, Umgebungsdateien und Logs ab. Keine Docker-/ESLint-/Prettier-/Terraform-Konfiguration im Root, kein npm-Publishing vorgesehen; keine zusaetzlichen Ignoredateien erforderlich.

### T002 - Reale FIT-Decoderprobe

- `makeHeartRateFit` in der bestehenden ZIP-Testsuite liefert synthetische Originalsession-/Recordnachrichten mit 14-Byte-Header, korrekter deklarierter Laenge sowie echten Header-/Datei-CRCs. Die Bibliotheks-CRC ist gegen den unabhaengigen Standardvektor `123456789` = `0xbb3d` geprueft.
- Engster Lauf: `npm test -- --runInBand --passWithNoTests=false --runTestsByPath __tests__/zip-importer.test.js --testNamePattern='strict FIT decoder evidence probe'`: 6/6 Tests bestanden.
- Bei gueltiger Datei ruft `fit-file-parser@1.10.0` den Callback synchron genau einmal fehlerfrei auf; strikte und tolerante Recordausgabe stimmen ueberein. Originalende und Timerdauer bleiben verschieden, damit ein spaeterer Fallback nicht an der Timerdauer abschneidet.
- Header-CRC-Fehler, Datei-CRC-Fehler und Trunkierungen um ein beziehungsweise fuenf Bytes kehren im strikten Modus ohne Callback zurueck. Kein Promise wartet auf diesen fehlenden Abschluss. Ein toleranter Erfolg bei defekter Datei-CRC ist nachgewiesen und darf allein keinen Vollstaendigkeitsbeleg liefern.
- Dies ist ein Parserverhaltensnachweis, noch keine implementierte positive Fallbackqualifizierung.

### T003 - Unabhaengige Kalenderreferenz

- `calendarReferenceHistory` in der bestehenden Utilitytestsuite enthaelt zwoelf synthetische, eingefrorene Trainings aus allen drei Sportarten: Dezember 2025 sowie Januar, Februar und Maerz 2026. Abgedeckt sind einseitige Angaben, ein Training ohne Extrema, Gleichstaende, Jahres-/Wochenwechsel und der lokale Sommerzeitwechsel im Maerz.
- Die erwarteten Werte sind literal und nicht mit der spaeteren Periodenfunktion berechnet: 11 geeignete Trainingstage, 7 belegte Montagwochen, 4 Monate und 2 Jahre. Monatswerte: Dezember 75/180, Januar 65/190, Februar 60/195, Maerz 60/200 bpm. Jahreswerte: 2025 = 75/180, 2026 = 60/200 bpm. Diese Werte betreffen ausschliesslich synthetische Testdaten.
- Unveraenderte Timeline: 11 geeignete Trainings, 10 Minima und 10 Maxima; Ursprungsordinal und Nichtmutation geprueft. Zeitraum-Teilfaelle werden in T028/T029 aus derselben Referenz festgelegt.
- Engster Lauf: `npm test -- --runInBand --passWithNoTests=false --runTestsByPath __tests__/heart-rate-utils.test.js`: 20/20 Tests bestanden. Kalenderaggregation selbst ist noch nicht implementiert oder abgenommen.

### T004-T012 - Quellen, Evidenz und lokale Hinweise

- Vertragstests vor Produktionsaenderungen angelegt und rote Ausgangsfaelle nachgewiesen. Der beobachtete Strava-Alias funktioniert ueber echte Browsernormalisierung, CommonJS sowie beide Reducer, einschliesslich beider unveraendert erhaltener Duplikatspalten. T007-Gate: 57/57 fokussierte Tests in vier Suiten.
- T008-Gate: 49/49 fokussierte Lese-/Altparser-/GPS-/Powertests. T009-Gate: 17/17 Decoder-/Lesebeleg-/Eigentuemerfaelle. Nur Originalsessiongrenzen und qualifizierte unverkuerzte Records werden fuer den neuen Fallback verwendet.
- Zusaetzlich real reproduziert: Der festgelegte Decoder entfernt Session-Invalidwerte 255 und liefert dabei dasselbe Objekt wie bei nicht vorhandenem Feld. Daher prueft ein begrenzter importlokaler Cursor ausschliesslich HR-Summaryfeldpraesenz und Invalidkennungen; er dekodiert keine Trainingsdaten und ersetzt keinen Decoder. Unbekannte Strukturen, komprimierte Nachrichten, nicht standardkonforme HR-Felder oder uneindeutige Sessionanzahlen erhalten keinen positiven Beleg. Die erweiterte Lese-/Eigentuemergruppe besteht mit 18/18 Tests.
- T010-Gate nach diesem Beleg: vollstaendige Utility-/ZIP-Suiten, 149/149 Tests. Positive echte FIT-Ableitung, fehlende Gegenart, direkte Prioritaet, 255, CRC/Trunkierung, Pausen-/Originalende, Identitaet und Altwerte geprueft. Rohrecordlisten werden nicht in Aktivitaeten oder Exporte kopiert.
- T011-Gate: vollstaendige CSV-/Dashboardimport-/Apple-Suiten, 146/146 Tests. Direkte CSV-/Apple-Provenienz und lokale Abdeckung getrennt vom Durchschnitt; Apple-Fingerprints bleiben aus denselben Rohattributen/statistischen Quelldaten gebildet. Keine neue Strava-/Apple-Recordableitung.
- T012-Gate: Dashboardimport, HeartRate-Renderer, Utility und Script-/Markupsyntax, 212/212 Tests. Erreichbare Datenhinweise auch ohne Min-/Max-Tab; kopierte direkte/beobachtete Herkunft in Wertdetails. Kleine Hinweiszeile unter dem bestehenden Headerstatus, kein neuer Tab oder Diagnoseupload.
- US1 ist noch nicht abgenommen: T013-T015 einschliesslich privatem lokalem Quellenvergleich sind offen. Kalender-, Apple-Laufzeit-, Exportlayout- und Browserabnahme bleiben spaetere Aufgaben.

### T013-T015 - US1-Abschluss

- T013: komplette Availability-Suite, 15/15 Tests. Direkte oder qualifiziert beobachtete einzelne Extremfelder genuegen; Durchschnitt-only, Konflikt und unqualifizierte Daten nicht. Andere durchschnittsgestuetzte Ansichten bleiben identisch; kein Produktionspatch an der Availability erforderlich.
- T014: lokale Referenzpruefung mit strukturiertem ZIP-/FIT-Zugriff, ohne Upload oder Rohdatenartefakte im Repository. Strava: 2646 Aktivitaeten, zwei Maximumsspalten, keine Minimumsspalte, 2307 nutzbare direkte Maxima, 339 fehlende Maxima; 2123 Trainings mit vom bestehenden Normalisierer gueltig erkanntem positivem Durchschnitt. Beide Reducer und alte Trainingsfelder stimmen exakt mit dem Vergleich ohne Extremspalten ueberein. Header-Zellbelegung und valide normalisierte Durchschnittswerte sind unterschiedliche Zaehler.
- TrainingPeaks: sieben lokale Archive, 1826 normalisierte Aktivitaeten. Minima: 1214 qualifiziert beobachtet, 74 explizit ungueltig, 538 nicht qualifiziert; keine direkten Minima. Maxima: 1626 direkt, 155 ungueltig, 45 nicht qualifiziert. Gruende ueber beide Extremarten: 303 ungueltige Grenzen, 229 Invalidangaben, 45 fehlende nutzbare Samples, 14 mehrdeutige Grenzrecords, 221 unbekannte Lesebelege. Diese Faelle wurden nicht ergaenzt. Alte Aktivitaetsfelder/IDs/Zaehlungen sowie vollstaendige Routen-/Powerergebnisse stimmen mit demselben Import bei gesperrter optionaler Qualifizierung exakt ueberein.
- Der lokale Vergleichshelfer und private Eingaben liegen ausschliesslich ausserhalb der Versionsverwaltung; nur diese aggregierten Zaehler und Paritaetsresultate werden dokumentiert.
- T015: dieselben 13 Baseline-Fokussuiten gemeinsam erneut ausgefuehrt: 872/872 Tests bestanden, 22.802 Sekunden, keine ausgelassenen Tests. Alle neuen T004-T006-Vertragsstufen sind gruen; einschliesslich Apple-, Navigation-, Syntax- und bestehenden Exportsnapshotregressionen.
- Synthetischer realer Browserlauf ueber lokales HTTP: PapaParse -> echte CSV-Normalisierung -> Dataset-Commit -> HeartRate-Ansicht. Zwei Maxima, null erfundene Minima, zwei dargestellte Punkte, nichtleerer Canvas und freigegebene bestehende Exportaktion. Screenshot zeigt erreichbare lesbare Datenhinweise. Ersatz durch Durchschnitt-only-Daten: Hinweis erhalten, Tab verborgen, alte Details und Exportsnapshot entfernt. Kein Analysezaehler durch diesen direkten synthetischen Testcommit ausgeloest.
- US1 abgeschlossen. Dies ersetzt weder den echten Apple-Dateiauswahl-/Workerpfad noch Kalender-/Vier-Viewport-/Neun-PNG-Abnahme in den spaeteren Storyphasen.

### T016-T024 - Automatisierte Apple-Laufzeit

- T016/T017: sichere Fehler-/Diagnose- und echte Workerdatei-/Fenstervertragstests vor den jeweiligen Produktionsstufen angelegt; erwartete Ausgangsfehler nachgewiesen. VM-/Fake-Worker-Faelle sind keine Browserkompatibilitaetsbelege.
- T018: 13/13 gezielte Helfer-/Grundlagentests. HTTPS/sicheres Loopback, direkte Datei und Remote-HTTP getrennt; tatsaechliche Arbeitskontextfunktionen statt Browsername. Diagnosefelder/Enums/Generation und begrenzte eindeutige Capabilityliste strikt validiert. Alte `failure`-Signatur und ihr Default unveraendert.
- T019: vollstaendige Apple-Suite nach Fehlertrennung, 58/58 Tests. Libraryladung, falscher Export, fehlende Funktionen, SHA-256- und interne Fehler getrennt; vorhandene XML-/Encoding-/Archiv-/Limit-/Identitaetsvertraege erhalten. Keine Ersatzhashes oder neuen Strava-/Apple-Messreihenextrema.
- T020: Workerinitialisierung und Syntax-/Scriptgruppe, 94/94 Tests. `init -> ready -> start`, benoetigte Libraryexports/Funktionen vor Ready und konstante SHA-256-Probe; Abschluss genau einmal, Dateiverarbeitung erst nach Ready. Die Probe verifiziert inzwischen den bekannten SHA-256-Testvektor `abc`, nicht nur eine aufgeloeste Promise.
- T021: vollstaendige Dashboardimport-Suite, 64/64 Tests. Initialisierung maximal 30 Sekunden, danach kein neues Verarbeitungszeitlimit. Konstruktor, Init-/Starttransport, `messageerror`, Runtimefehler, Protokoll und ungueltige Ergebnisse sicher abfangen; Heartbeat/Watchdog/Handler/Worker genau einmal beenden. Bereits geloeschter Ready-Timer bleibt auch bei verspaeteter Callbackausfuehrung wirkungslos.
- T022: Dashboardimport und Markup-/Scriptregressionen, 176/176 Tests. Sichere feste Dialogmeldung/Code statt roher Exception; bewusster Retry mit neuer Generation und neuem Worker. Die ausgewaehlte Datei bleibt nur lokal bis Retry, Dialogschluss oder neuem Import gehalten; kein automatischer Wiederholungsversuch.
- T023: zusaetzliche integrierte fehlende Utilities-/Funktionen-, falsche Library-/Hashausgabe-, Constructor-/Clone-/Ready-/Runtime-/Protokoll-/Ergebnis-, Abbruch-/Spaetergebnis-/Altstand-/Retryfaelle. Konkrete sichere Diagnosekomponenten bleiben beim Uebertragen erhalten. Keine privaten Rohmeldungen im UI-/Diagnosepfad; bisherige IDs/Streaming-/XML-/Archivschutz regressionsgeprueft.
- T024: exakter US2-Fokuslauf aus Abschnitt 1, beide vollstaendigen Suiten, 143/143 Tests bestanden in 2.136 Sekunden. Keine offen rote T016-/T017-Stufe.
- Reale sechs Browser-/Bereitstellungsimporte, negative Umgebungsfaelle und Grossimportabnahme T025-T027 bleiben offen. Der historische Nutzerfehler ist nicht ohne seinen konkreten Kontext reproduziert oder als generell behoben erklaert.

### T025 - Teilnachweis und Bereitstellungsblocker

Stand: drei lokale HTTP-Faelle bestanden, drei HTTPS-Faelle offen. T025 bleibt deshalb unabgeschlossen; gemaess Aufgabenreihenfolge beginnt US3 noch nicht.

| Browser | Lokales HTTP | Vertrauenswuerdiges HTTPS |
|---------|--------------|--------------------------|
| Chrome 156.0.8078.80 | Zwei echte Dateiauswahlimporte bestanden; ein erwartetes synthetisches Workout, korrekte direkte Extrema, Fortschritt und stabile Wiederimport-ID. | Offen: kein freigegebenes Ziel desselben Kandidaten. |
| Edge 156.0.4314.58 | Dieselben zwei Original-ZIP-Importe bestanden, korrekte Daten, Fortschritt und stabile Wiederimport-ID. | Offen: kein freigegebenes Ziel desselben Kandidaten. |
| Integrierter VS-Code-Browser, Chromium 150.0.7871.250 | Zwei echte Dateiauswahlimporte bestanden, ein erwartetes Workout, korrekte Extrema, Fortschritt und stabile Wiederimport-ID. | Offen: kein freigegebenes Ziel desselben Kandidaten. |

- Alle drei lokalen Kontexte waren tatsaechlich sicher. Beobachtete Nachrichten pro Import: `ready`, drei Fortschrittsnachrichten, `complete`. Echter Worker, originale CDN-Bibliotheken und sichere SHA-256-Verarbeitung, keine ersetzten Importbausteine. Die Analysezaehlung wurde nur fuer diese synthetische Abnahme lokal beobachtet, nicht an den Analysedienst uebertragen.
- Chrome/Edge wurden mit bereits vorhandenem transientem Playwright und installierten Browsern unabhaengig automatisiert; keine Projektabhaengigkeit installiert. Der integrierte Browser wurde ueber die echte Dateiauswahl mit einer generierten synthetischen temporaeren ZIP geprueft.
- Ein voriger integrierter Navigationsversuch wartete bei deaktiviertem Cache auf eine sachfremde CDN-Ressource und startete keinen Import. Nach Entfernen der Test-Routingregel geladen und beide echten Importe erfolgreich; der Navigationsfehler zaehlt nicht als Apple-Importfehler.
- Keine vertrauenswuerdige HTTPS-Bereitstellung desselben Arbeitsstands bekannt. Keine TLS-Umgehung, Bereitstellung, Zertifikatsinstallation oder Aenderung am API-Service vorgenommen. Fuer die Fortsetzung von T025 ist ein bestehendes geeignetes Ziel oder eine ausdrueckliche Freigabe zur Einrichtung erforderlich. SC-005 bleibt offen; T026-T050 sind nicht als abgeschlossen markiert.
- Root-Regressionspruefung am aktuellen Zwischenstand: `npm test -- --runInBand`, 47/47 Suiten und 1597/1597 Tests bestanden in 97.211 Sekunden. Keine offen roten vorbereiteten Vertraege und keine Editorfehler an den geaenderten Anwendungs-/Test-/Designdateien. Dies ist eine Zwischenstandspruefung, kein vorgezogener Abschluss von T046 oder der Browser-/Kalender-/Exportabnahme.
- Nachlauf-Hooks geprueft: `.specify/extensions.yml` ist nicht vorhanden, daher keine Implementierungs-Hooks auszufuehren.

### T026-T027 - Reale Fehler- und Grossimportfaelle

- T026: Edge 156 ueber echtes lokales HTTP mit derselben synthetischen Datei: direkte `file:` -> `UNSUPPORTED_DEPLOYMENT`; unsicheres Remote-HTTP -> `INSECURE_CONTEXT`; fehlender Worker -> `MISSING_CAPABILITY`; blockierte SAX-Datei -> `DEPENDENCY_LOAD_FAILED`; geladener falscher SAX-Export -> `DEPENDENCY_INVALID`; unerwarteter Workerstartfehler -> `WORKER_RUNTIME_FAILED`; kaputtes ZIP -> `INVALID_ARCHIVE`. In allen sieben Faellen blieb der vorherige synthetische Dashboardstand erhalten, keine Rohfehlermeldung wurde im Dialog gezeigt. Nach Behebung von Worker/Library/Archiv gelang der bewusste Retry. `file:`/Remote-HTTP benoetigen zuerst eine unterstuetzte Bereitstellung; die festen Diagnosen und Altstanderhaltung waren real sichtbar.
- T027: vorhandener Generator erzeugte ausschliesslich synthetisch 100000 irrelevante Records und 2000 Workouts, 75996063 Bytes entpacktes XML. Neuer READY-Zeitgeber endet vor `start`; echter Lauf wurde in Chrome/Edge mit Worker, Progress und Dateiauswahl erfolgreich zweimal ausgefuehrt (2000 Workouts, stabile IDs). Keine neue Verarbeitungsfrist, kein ungepruefter Voll-Ladevorgang, SHA-256- oder Main-Thread-Fallback. Vorher-/Nachher-Nodeimport derselben Datei: 2000/2000 Workouts, gleiche alte Trainingsfelder/IDs, monotone 9/10 Fortschrittsmeldungen; 6.593/7.817 ms, beobachtete Heapdelta 17.476.992/698.032 Bytes. Einzelwerte sind nur aggregierte Laufzeit-/Heapbeobachtungen unter Node v24.19.0, kein SLA oder Browserpeakspeichergrenzwert. Bereits vorhandene Abbruch-/Ressourcenlimittests waren in der vollen Apple-Suite gruen.

### T028-T036 - Kalender- und Zeitraumansicht

- T028: unabhaengiger T003-Oracle fuer Daily/Weekly/Monthly/Yearly, ISO-Kalenderwechsel, Mehrfachgleichstaende, einseitige Angaben, Randperioden und Nichtmutation; zusaetzlich 10000 eingefrorene Trainings, genau eine Jahresperiode, 10000 Quellen je Extrem und genau zwei Diagrammpunkte. Utilitysuite 50/50 Tests; bestehende Timeline bleibt bestehen.
- T029: 8/8 fokussierte Renderer-/Periodenfälle einschliesslich ungeklemmt begrenzter Fenster, History ohne Extremum, All-Einzelpunktpadding, Filter vor Gruppierung, Filterleerzustand und alle Contributors.
- T030/T031: lokale Kalenderfortschaltung statt DST-fester Millisekunden. Monats-/Jahresschluessel, Montagwochen mit ISO-Jahreslabel, Punkt in inklusiver Schnittmenge der Periode mit angefordertem Fenster; bestehende Corefilter/date/timeframe APIs bleiben semantisch unveraendert. Kalendergrouping nutzt lineare Trainingsdurchlaeufe plus Sortierung der belegten Perioden (`O(n + p log p)`), mit stabilen contributor-Maps.
- T032/T033: Der echte Filter gibt Trainings vor der Periodenbildung aus. Controls benennen die Gruppierung, sichtbare Bereichszeile/Chartachse nutzen den angeforderten Zeitraum, auch wenn gleiche Datenpunkte bleiben. Perioden enthalten alle Contributor und Ties; nur numerische Extrempunkte im Chart. Herkunft/Name/Datum bleiben in sicheren lokalen Details, ohne Rohsamples oder Aktivitaetsreferenzen im Share-Snapshot.
- T034: vollstaendige Core-/Availability-/Navigation-/Syntax-/Utility-/Renderergruppe, 286/286 Tests. Einzel-Sport, inklusive Grenzen, Gesamtimport-Endanker, IDs und relative Reihenfolge unveraendert.
- T035: reale Edge-156-Matrix mit synthetischen Trainings: 76 sichtbare Kombinationen aus Daily/Weekly/Monthly/Yearly, allen vier Sportwahlen und allen jeweils angebotenen Timeframe-Optionen. Jede y-Reihe und Punktzahl gegen unabhaengig aus gefilterten Trainings berechnete Oracle geprueft; fuers nichtleere Chart 76/76 Achsengrenzen gleich `displayStart`/`displayEnd`; 76 Keyboardadapter-Transitions. 1-Jahr/2-Jahr-Fall behielt identische Trainingswerte und denselben Endeanker, zeigte jedoch verschiedene verlangte Anfangsgrenzen. Teilperioden, All ohne/mit Extremtrainings und leere Sportergebnisse enthalten.
- T036: vollstaendiger US3-Fokuslauf, 286/286 Tests in 4.632 Sekunden. Funktionaler Edge-Matrixlauf erfolgreich; Screenshots in temporaerem Ordner ausserhalb des Repositories.

### T037-T045 und T047-T048 - Export, Abnahme und Dokumentation

- T037/T041: eine gebrandete `heartRateShareBtn`-Aktion in gemeinsamer Kopf-/Bedienleiste: Strava -> Export for Insta / Strava -> Instagram. IDs/Handler/Captureziel, Tab-/Scriptreihenfolge bleiben erhalten. Auf kleinen Viewports gibt der Filterblock dem Export eine eigene Zeile; Zeitraumtext bleibt lesbar.
- T038-T040: kopierter RenderContext, aggregation/period labels/count, numeric series, angeforderte `periodStart`/`periodEnd`, sichtbare `viewBounds`; keine spaetere Livefilterabfrage, Rohsamples, Aktivitaetsnamen oder Objektreferenzen. Kalendergruppierung und Formatkontext sind im bestehenden strukturierten Bildpfad enthalten; `periodCount` ist gezielt allowlisted. UI- und Exportpunkte verwenden `clip:false`, damit Randmarker bei exakt verlangter Achse nicht beschnitten werden.
- T042: bestehende Export-/Renderer-/Navigations-/Markupgruppe zusammen 513/513 Tests. Nach Resource-/Endregression weitere vollstaendige Endgate-Laeufe dokumentiert.
- T043: unabhaengige Edge-Viewports 320/375/768/1440 CSS-Pixel bestanden: keine horizontale Seitenueberbreite, Buttonposition/-assets/Text erreichbar und Controls nicht geclippt. 375 Touchmarker plus Contributor-Auswahl/Tastatur; 1440 Mausmarker plus Contributor-Auswahl/Tastatur. Screenshots nach frischem Kandidaten und stabilem Viewport visuell geprueft; kompakte Smartphonebedienleiste und breite Toolbar korrekt.
- T044: neun reale Vorschau-/Downloaddateien in Edge: Weekly/Monthly/Yearly x square/portrait/story. Jede Datei gespeichert, PNG-Header und dekodierte Pixel ergaben exakt 1080x1080/1080x1350/1080x1920, nichtleere Marker beider Reihen, Gruppierung/Zeitraum/bpm sichtbar. Vier bzw. zwei synthetische belegte Perioden passend zur Gruppierung. Veroeffentlichte Preview blieb bei Filterwechsel gleich; nach jeder Datei schloss der bestehende Downloadvertrag die Vorschau, die naechste Anforderung oeffnete eine neue. Pending/Filterleer/Ersatzimport sperrten alte Ziele/Bilder. Der echte Anchor-Download in ein vom Browser automatisiert gespeichertes Dateisystemartefakt war beobachtet. Native OS-Dateiauswahldialoge wurden nicht geoeffnet; dieser optionale Pfad bleibt ungeprueft.
- T045: README und Importdokumentation behandeln jetzt Kalenderaggregation, Headeralias, qualifizierten TP-Fallback, Herkunft, Ranges, Exportstandard und konkrete Apple-Origin-/Fehlerklassen; keine medizinische Garantie oder generelle Netzwerkfreiheitsbehauptung.
- T047: 10000 Trainings: 365 Tages-, 53 Wochen-, 12 Monats- und 1 Jahresperiode; entsprechend 730, 106, 24 und 2 Punkte statt 20000 Timelinepunkten. Node v24.19.0 gemessen 47.49/42.53/54.12/33.19 ms (daily/weekly/monthly/yearly), keine zweite ZIP-Extraktion oder dauerhaften Rohrecordkopien. Laufzeit/Heap sind beobachtete Umgebungswerte, kein SLA.
- T048: Edge-Requestbeobachtung waehrend Layout-/Filter-/Share-/PNG-/Ersatzimportlauf: null Requests mit HR-Feldnamen oder synthetischen Trainingsidentifikatoren. Separater lokaler Browsertest unterband ausschliesslich die Analysezaehlung. Bestehende CDN-/Apprequests bleiben erwartungsgemaess erhalten; keine Netzwerkfreiheitsbehauptung.

### Offene Freigabepunkte

- Der Nutzer gab ausdruecklich frei, trotz der nicht verfuegbaren drei HTTPS-Umgebungen mit US3/US4 fortzufahren. Diese Ablaufreihenfolge ist hiermit als bewusst genehmigte Prozessausnahme dokumentiert; sie aendert nicht SC-005, den Apple-HTTPS-Vertrag, T025 oder die Freigabeschwelle. Keine HTTPS-Umgehung/Bereitstellung/Zertifikatsinstallation ohne separates autorisiertes Ziel.
- T025/SC-005 bleibt unabgeschlossen: Chrome, Edge und VS Code ueber localhost/127.0.0.1 bestanden, aber derselbe Kandidatenstand konnte nicht ueber vertrauenswuerdiges HTTPS in den drei Browsern verifiziert werden. Der historische individuelle Nutzerfehler ist nicht reproduziert. Das Feature darf nicht als vollstaendig abgenommen berichtet werden.
- API blieb unveraendert. Keine neue Runtimeabhaengigkeit, kein Buildschritt, keine versionierte private Export-/Benchmarkdatei. Nachlauf-Hooks fehlen.

### T046, T049 - Regression und Erfolgskriterien

- T046: abschliessender Rootlauf `npm test -- --runInBand`: 47/47 Suiten, 1614/1614 Tests bestanden in 124.502 Sekunden; keine bewusst uebersprungenen Tests. Synthetische FIT-/Strava-/Apple-/Periodenreferenzen und lokale aggregierte Referenzen verglichen. Alte IDs, Zaehler, Durchschnitt, Power, GPS und andere Ansichten bleiben erhalten; fuer Apple-Messreihen sind keine Werte abgeleitet. Die Apple-HTTPS-Abnahme ist kein Roottest und bleibt gesondert offen.
- T049: FR/SC-Rueckverfolgung; Test-/Browser-/Quellen-/Dateiartefakte, wo vorhanden, ausschliesslich synthetisch oder aggregiert.

| Kriterium | Ergebnis | Beleg / Grenze |
|-----------|----------|----------------|
| SC-001 | Bestanden | Exakter deutscher Alias, Duplikate/Reducer, lokale Referenzabdeckung und Browser-/CommonJS-Paritaet; 2307 nutzbare Strava-Maxima. |
| SC-002 | Bestanden | Echte FIT-/CRC-/Invalid-/Originalgrenzen-/Zuordnungsfaelle, 1214 qualifizierte beobachtete Minima und konservativ gesperrte Grenzfaelle. |
| SC-003 | Bestanden | 12 eingefrorene Trainings, sieben Wochen, vier Monate/zwei Jahre; unabhaengige Oraclewerte, All-Sport-/Randperioden-/Gleichstandtests. |
| SC-004 | Bestanden | Edge-156: 76 Filterkombinationen plus 76 Keyboardadapterwechsel; Werte, contributor Quellen und Achsen stimmen. Laengere Fenster koennen bei gleichen Punkten andere verlangte Grenzen zeigen. |
| SC-005 | **Offen** | Chrome, Edge und VS Code ueber lokales HTTP bestanden; drei HTTPS-Faelle desselben Kandidaten fehlen. T025 offen, kein positiver Vollmatrix-/Allgemeinkompatibilitaetsclaim. Historischer Einzeluserfehler nicht reproduziert. |
| SC-006 | Bestanden | Vier CSS-Breiten, visuelle Nachbarreferenz, Branded Button, keine horizontale Ueberbreite/Clipping, Touch/Maus/Tastatur. |
| SC-007 | Bestanden | Neun gespeicherte/destinierte und dekodierte PNGs, korrekte Dimensionen/Marker/Perioden und Snapshot-/Leerzustandsregeln; optionaler nativer OS-Speicherdialog nicht geprueft. |
| SC-008 | Bestanden | Voller Rootlauf, gleiche alte Trainingsfelder/IDs/Zaehlungen/Routen/Power bei Quellenvergleich, null neue Browserrequests mit HR-Feldern/Test-Trainingsdaten. Bestehende CDN-/Appanfragen bleiben. |

- Damit sind 7/8 SC belegt; SC-005 bleibt wegen nicht verfuegbarer vertrauenswuerdiger HTTPS-Umgebungen offen. T046 und diese ehrliche Teilmatrix sind abgeschlossen. Ein ausstehendes SC darf weder in dieser Matrix noch in der Produktabnahme als gruen dargestellt werden.