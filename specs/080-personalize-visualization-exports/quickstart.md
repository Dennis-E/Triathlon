# Quickstart: Exportverbesserungen validieren

**Feature**: [spec.md](spec.md)
**Plan**: [plan.md](plan.md)
**Vertrag**: [export-personalization.md](contracts/export-personalization.md)

Diese Anleitung ist das Prüfprogramm für die spätere Implementierung, kein Nachweis bereits bestandener Laufzeitprüfungen. Der Specify-/Plan-Workflow erzeugt keine fertige Funktion. Der bestehende Fixturegenerator wird weiterverwendet; kein neues Testframework und keine privaten Trainingsdaten erforderlich.

## Voraussetzungen

- Repositoryroot als Arbeitsverzeichnis; Root-Abhängigkeiten installiert. Falls `node_modules` fehlt, `npm install` ausführen. Nicht im getrennten API-Service installieren oder testen.
- Python für den vorhandenen statischen Server; aktuelle stabile Desktopversionen von Chrome und Edge. Browser müssen die bestehenden CDN-Abhängigkeiten laden können.
- Ausschließlich synthetische oder ausdrücklich lokal bereitgestellte Trainingsdaten. Prüftexte/-titel dürfen keine echten persönlichen Informationen enthalten. Bilder mit Beispieldaten behalten ihre Kennzeichnung.

## 1. Engste automatisierte Prüfungen

Nach jedem implementierten Schnitt zuerst seine lokale Gruppe mit Präfix `F080 Tnnn` gemäß [tasks.md](tasks.md) und die für den Schnitt relevanten bereits implementierten Regressionstests ausführen. Beispielsweise prüft der folgende Befehl nach T010 nur dessen Kontextgruppe, nicht die vorab angelegten Branding-/Standardgruppen für T012/T013:

```powershell
npm test -- --runInBand __tests__/dashboard-export-download.test.js -t 'F080 T010\b'
```

Aktuelle und relevante bereits implementierte Tests müssen grün sein. Erwartete rote Gruppen für spätere Aufgaben bleiben ausführbar und werden erst bei ihrer zuständigen Aufgabe grün verlangt; keine `.skip`-/`.todo`-Markierungen oder abgeschwächten Assertions verwenden. Testnamenfilter und tatsächlich ausgeführte Testzahlen protokollieren; ein Lauf ohne passende Tests ist kein Erfolg. Die neue Punchline-Suite existiert erst nach ihrer Erstellung; `--passWithNoTests` ist kein Bestehensnachweis.

Beim Abschluss der Grundlagen und jeder Story sämtliche bis dahin betroffenen vollständigen Suiten ohne Testnamenfilter ausführen. Dafür gelten die folgenden Befehle; sie sind keine vorgezogene Vollsuite-Pflicht nach jeder einzelnen Teilimplementierung:

```powershell
npm test -- --runInBand __tests__/export-punchline-utils.test.js
npm test -- --runInBand __tests__/workout-time-utils.test.js
npm test -- --runInBand __tests__/export-utils.test.js
npm test -- --runInBand __tests__/dashboard-core.test.js
npm test -- --runInBand __tests__/dashboard-export-download.test.js
npm test -- --runInBand __tests__/dashboard-media.test.js
```

Nach Integration der Adapter und des Dialogs die angrenzenden Verträge prüfen:

```powershell
npm test -- --runInBand __tests__/power-pb-utils.test.js __tests__/index-script-syntax.test.js __tests__/tab-navigation.test.js
```

Erwartung: bestehende numerische/PB-/Filtersemantik bleibt unverändert; neue Regeln sind positiv und negativ getestet, nicht durch pauschale Snapshotaktualisierung verdeckt. VM-Harness und Scriptreihenfolgetest laden das neue Utility vor der Exportorchestrierung. Keine API-Tests erforderlich, da dort nichts geändert wird.

## 2. Starten

Im Repositoryroot einen freien Port verwenden, beispielsweise:

```powershell
python -m http.server 8000
```

Dann `http://localhost:8000` öffnen und Beispieldaten auswählen. Ist Port 8000 belegt, einen anderen freien Port wählen und die URL entsprechend ändern. Für PNG-Referenzfälle den vorhandenen Browser-Fixturegenerator unter [generate.js](../../__tests__/fixtures/reel-story-exports/generate.js) und dessen vorhandene Einstiegspunkte verwenden; insbesondere PB-Quellen und die neuen Analysefälle bei der Implementierung dort ergänzen, nicht ein zweites Generatorsystem anlegen.

Der Generator bietet jetzt `createPersonalizationReviewCases()`, `createPersonalBestReviewCases(groups)` und `createWorkoutTimeReviewCases()` sowie `prepareReviewCase(test)` und `inspectApprovedImage()`. Als Browserscript nach der Anwendung laden; die gewünschte Format-/Captionwahl erfolgt nach dem Exportstart. Startzeit-Grenzfälle ersetzen ausschließlich im Fixturekontext die Aktivitäten durch ausdrücklich synthetische, quellenlokale Referenzen. Die aktuelle Mediengalerie bietet keine Routenumschaltung; historische Referenzfälle mit `includeRoutes: true` sind als nicht angebotene Variante zu dokumentieren, nicht künstlich zu aktivieren. Vorhandene native Nachweise und bekannte ausgeschlossene Bildprobleme stehen in [acceptance.md](acceptance.md).

## 3. Kontext und Layout (SC-001 bis SC-003)

1. Je Ziel/Variante im Vertragsinventar einen verfügbaren Export öffnen. Erwartung: Story zuerst und ausgewählt, Punchline aktiv; keine Console-Referenzfehler. Square und Feed portrait bleiben erreichbar. Verfügbarkeit nicht durch künstliches Aktivieren defekter Ziele vortäuschen.
2. Einen Distance- und einen Zwei-Achsen-Export mit bekannten Filtern erstellen. Erwartung: direkte Messgröße, Zeitraum und Einheit, kurzer Zusammenhang wie `Length vs activities`; keine technischen Präfixe und kein `2-hour-blocks`. Notwendige Sporteinschränkung, Teilzeitraum, Skalen und Legenden bleiben verständlich.
3. Alle drei Layouts mit gleicher Auswahl herunterladen. Exakte Maße 1080 × 1920, 1080 × 1080 und 1080 × 1350 prüfen. Dateien vollständig bei nativer Auflösung und 360 Pixeln Breite ansehen; Story zusätzlich als 360 × 640.
4. Sichtbare Logohöhe proportional vergleichen: Story mindestens 1,5 × Square bei gleicher Bildbreite, nicht lediglich größere Leerbox. Punchline vor Detailkontext, höchstens zwei Zeilen und mindestens 1,25 × Kontextschrift. Story-Sicherheitsfläche sowie bestehende Mindestschrift-/Kontrastvorgaben prüfen.
5. Punchline ausschalten und erneut exportieren. Erwartung: kein Text, kein reservierter Captionleerraum; das Datenbudget wird neu geplant. Reine Datenmarken werden nicht verändert. Lange Titel und Fortsetzungsseiten ebenfalls prüfen.

Je verfügbare Familie mindestens ein belegbarer Vorschlag oder dokumentierte Begründung für einen neutralen Fallback, jeweils alle drei Layouts. Nicht jeder unabhängige Filter benötigt ein vollständiges kartesisches Kreuzprodukt; nicht-default Messgrößen, Gleichstände und Teilperioden müssen insgesamt abgedeckt sein.

## 4. Texte, Revisionen und Download (SC-004)

1. Standard, ausgewählten Vorschlag und eigenen bestätigten Text exportieren. Erwartung: genau ein Text; eigene Texte inhaltlich unverändert; Herkunft und bei Vorschlägen Beleg in der Steuerung erkennbar.
	Die aktuellen Controls heißen `Add a punchline`, `Suggestion` und `Own text`; die Iconaktionen besitzen die Namen `Apply punchline` und `Restore confirmed punchline`. Ein nicht bestätigter Entwurf verändert die bereits freigegebene Vorschau nicht.
2. Leere/Whitespace-Eingabe, 1/120/121 Codepoints, innere Mehrfachleerzeichen, Umlaute, Zeichen außerhalb der Unicode-Basisebene und eine wie HTML aussehende Eingabe prüfen. Erwartung: richtige Zeichenzählung, keine HTML-Auswertung, kein stilles Kürzen oder Umschreiben.
3. Einen maximal langen Text aus breiten Zeichen anwenden. Erwartung: falls nicht in zwei ausreichend großen Zeilen darstellbar, verständlicher Layoutfehler und kein Download als neue fertige Fassung. Anschließend kürzeren Text bestätigen oder ausdrücklich vorherigen Text wiederherstellen.
4. Einen ungültigen Entwurf anwenden, Punchline ausschalten und captionlosen Export abschließen. Erwartung: Download dieser captionlosen Fassung möglich; erneutes Einschalten aktiviert nicht still eine ungültige Fassung. Entwurf und Auswahl bleiben erhalten.
5. Rasch Vorschlag/Text, Format und Aktivierung wechseln; verzögerte ältere Kompositionen erst danach beenden. Erwartung: nur letzte bestätigte Fassung ist aktuell herunterladbar. Vorhandene Testdoubles zur kontrollierten Fertigstellungsreihenfolge verwenden.
6. Seite einer Serie wechseln, schließen/wiederöffnen und Dataset/Filter vor einer neuen Sitzung ändern. Erwartung: Text bleibt auf Seiten und Layouts derselben Sitzung gleich; neue Sitzung beginnt mit Story/Punchline an und neuer Auswahl. Alte Arbeiten können diese nicht überschreiben.
7. Download während Aktualisierung, begonnenen Save während späterem Textwechsel, Speichercancel und vorhandenen Picker-/Download-Fallback prüfen. Erwartung: Save erhält genau die bei seiner Freigabe bestätigten vorbereiteten Bytes; keine alte Fassung wird als neue ausgegeben. Vorhandene Sicherheits-/Fehlerunterscheidungen bleiben erhalten.
8. Einen bestätigten, zeichenvaliden Text verwenden, der im bisherigen Format passt, im neu gewählten Format aber nicht in zwei ausreichend große Zeilen. Erwartung: Text bleibt unverändert, Darstellungsfehler wird erklärt und Download gesperrt. Rückkehr zum passenden Format, passende Textkorrektur und Ausschalten separat prüfen: Erst die jeweils erfolgreich vorbereitete gewählte Fassung ist wieder herunterladbar; kein stiller Ersatztext und keine Freigabe eines veralteten Bildes.

## 5. Workout Time und andere Vorschläge (SC-005)

Synthetische Aktivitätsobjekte mit expliziter gültiger Ortszeit verwenden; Diagrammbalken alleine sind kein Eingang für diese Analyse. Startzeit-/Filterfälle in den vorhandenen Utility-/Dashboardtests anlegen.

| Referenzfall | Erwartung |
|-------------|-----------|
| 9 gültige Starts, alle morgens | Keine Gewohnheits-Punchline; Mindestmenge erklärt |
| 10 gültige Starts, 6 morgens | `Morning bird`, Beleg 6/10, Startbasis sichtbar |
| 100 gültige Starts, 59 beziehungsweise 60 morgens | Kein Gewohnheitslabel bei 59, zulässig bei 60; keine Entscheidung aus gerundeter Prozentanzeige |
| Starts genau 05:00, 12:00, 18:00, 22:00, 00:00 | Morgen, Nachmittag, Abend, Nacht, Nacht |
| 10 gültige Starts, 6 um 19:00 | Abendvorschlag, niemals `Night owl` |
| 10 gültige Starts, 6 nachts | `Night owl` mit korrektem Anteil und Mitternachtsüberlauf |
| Gleichmäßig verteilte Starts | Kein Dominanzbefund; neutraler Fallback |
| Zusätzliche Starts ohne Ortszeitnachweis | Separat ausgeschlossen; Nenner ist Zahl gültiger Starts |
| Datum-ohne-Uhrzeit / nur normalisiertes Date | Nicht als Mitternachtsnachweis akzeptieren |
| Ungültiges oder widersprüchliches `sourceLocalStart` | Ausschluss mit Grund; keine Browserzeitzonen-Heilung |
| Count → Dauer → Distanz | Tageszeitbefund unverändert startbezogen; keine Distanz-/Zeitdominanz behaupten |
| Neuer Sport-/Datumsfilter, neue Sitzung | Nur neue Auswahl; keine alten Vorschläge |

Dieselben quellenlokalen Starts unter mindestens zwei unterschiedlichen Browserzeitzonen prüfen: Analyseergebnis und Beleg bleiben gleich. Eine anders aussehende Legacy-Diagrammzuordnung ist keine Erlaubnis, unbekannte Zeiten für die Vorschläge zu erraten.

Für jede weitere Familie den konkreten vorhandenen Befund mit der Fähigkeitsmatrix in [research.md](research.md) vergleichen. Gleichstände, fehlende Werte, ungeeignete Vergleichsgrundlage und synthetische Herkunft gezielt prüfen. Null erfundene Rekord-/Trend-/Gewohnheitsbehauptungen.

## 6. PR-Quellen und Zeitachsen (SC-006)

1. Vorhandenen zugeordneten Workout-Titel, fehlenden/generischen Titel sowie modellierte, ganze-Aktivität- und gemessene Abschnittsquelle prüfen. Erwartung: richtige Zuordnung und verständliche Quellbezeichnung; Schätzung bleibt trotz Titel sichtbar. Keine rohen `modeled`-/`full-activity`-Beschriftungen.
2. Einpunktfall, mehrere Gleichtagspunkte, Jahreswechsel, Schaltjahr, große Datenlücke und einen fremden datasetweiten Zeitraum prüfen. Erwartung: originale Records bleiben erhalten, eindeutige Daten, begrenzte Achse und keine suggerierte Entwicklung bei einem Tag.
3. Fehlendes/ungültiges Datum und komplett undatierte Records prüfen. Erwartung: Quellen-/Wertzeilen erhalten, keine erfundenen Punkte oder 1970-/Heute-Fallbacks.
4. Dauerprofile mit aus verschiedenen Workouts stammenden Punkten exportieren. Erwartung: Dauerachse bleibt, jeder Punkt erhält eigene Quelle; fehlende Dauerpunkte werden nicht ergänzt.
5. Titel/Quelldaten nach Capture verändern und eine verzögerte Komposition fertigstellen. Erwartung: eingefrorene Quelle bleibt korrekt; andere Familien erhalten durch die neue Freigabe keine zusätzlichen Titel oder Orte.
6. Lange Titel in Übersicht, Detail und Fortsetzungsseiten prüfen. Erwartung: gemessene Umbrüche, unveränderte Werte, geordnete vollständige Quellenzeilen und identische vollständige Achsendomain auf allen Seiten derselben Gruppe.

## 7. Verständlichkeit und Abnahmenachweise (SC-007)

Mindestens fünf Freizeitausdauersportlerinnen/-sportler sehen Zeitreihe, Zwei-Achsen-Grafik, Workout Time und PR bei 360 Pixeln Bildbreite für je fünf Sekunden. Pro Familie müssen mindestens vier Thema, relevanten Zeitraum, Messgröße/Einheit und Kernaussage korrekt wiedergeben. Mindestens vier führen ohne Anleitung in höchstens 60 Sekunden die Abfolge eigener Text, Vorschlag wählen und Punchline ausschalten aus. Keine echte Person oder bestandene Quote erfinden; Ergebnis erst nach Durchführung protokollieren.

Abnahmematrix pro Ziel/Variante: Datenreferenz, Filter, Messgröße, Provenienz, Format, Aktivierungszustand, Textquelle, Beleg/Fallbackgrund, Bildmaße, tatsächliche Schrift-/Logogrößen, Dateireferenz, Browser/Version, Pass/Fail und prüfende Person. Für mehrteilige Ausgaben erste, gegebenenfalls mittlere und letzte Seite sowie Vollständigkeit des gesamten Inhalts nachweisen. Beide verbindlichen Browser müssen denselben Inhalt in Vorschau und Datei zeigen.

## Explizite Nichtziele

Der defekte Training-Calendar-Export, bestehendes Lifetime-Statistics-Abschneiden und die dort gewünschten Inhaltslöschungen sowie der Apple-Health-Heatmap-`geoPoint`-Fehler werden separat vermerkt. Sie sind keine Reparatur-/Abnahmeaufträge dieses Features. Wird ein Fall dadurch blockiert, den konkreten Vorfehler samt nicht prüfbarer Zeile dokumentieren; weder als Erfolg zählen noch die Einschränkung verschweigen. Neue, durch die Exportänderung verursachte Regressionen bleiben Abnahmefehler. Lokale Dateiverarbeitung ist keine Behauptung, dass die gesamte Anwendung keine Netzwerkzugriffe ausführt.