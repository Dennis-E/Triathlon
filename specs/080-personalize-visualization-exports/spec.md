# Feature Specification: Verständliche und personalisierte Visualisierungs-Exporte

**Feature Branch**: Bestehender Branch `TriAnalytica-dev-2`; kein neuer Branch angelegt.

**Created**: 2026-11-04

**Status**: Draft

**Input**: Exportverbesserungen aus [GitHub Issue #5](https://github.com/Dennis-E/Triathlon/issues/5): verständliche Kontexttexte, Reel / Story als Standard, sichtbareres Logo, prominente und frei wählbare Punchline, nachvollziehbare PR-Exporte und datenbasierte Vorschläge insbesondere für Workout Time. Die unten genannten eigenständigen Fehlerbehebungen sind ausgeschlossen.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Eine verständliche Trainingsgrafik teilen (Priority: P1)

Als trainierende Person möchte ich eine Visualisierung exportieren, deren Thema, Zeitraum und Messgrößen ohne technische Filtertexte verständlich sind. Das standardmäßig gewählte Reel-/Story-Layout soll meine Daten und die Marke klar präsentieren.

**Why this priority**: Verständlichkeit und eine klare visuelle Hierarchie verbessern jeden Export, auch ohne Personalisierung.

**Independent Test**: Eine Zeitreihe und ein Zwei-Achsen-Diagramm mit bekannten Filtern exportieren, die Kontexttexte vergleichen und die Dateien in Smartphone-Darstellungsgröße betrachten.

**Acceptance Scenarios**:

1. **Given** eine neu geöffnete Exportvorschau ohne vorherige Auswahl, **When** die Layoutauswahl erscheint, **Then** steht `Reel / Story` an erster Stelle und ist ausgewählt; Square und Feed portrait bleiben auswählbar.
2. **Given** Distance, Kilometer und der Zeitraum 2024–2025, **When** ich exportiere, **Then** stehen dort, soweit zum Verständnis nötig, `Distance`, `2024–2025` und `km`, ohne die Präfixe `Metric:`, `Period:` oder `Unit:` und ohne inhaltsgleiche Wiederholungen.
3. **Given** ein Diagramm mit Länge und Aktivitätsanzahl, **When** ich exportiere, **Then** beschreibt etwa `Length vs activities` den Zusammenhang; technische Kontexttexte wie `X axis:`, `Y axis:` und `2-hour-blocks` fehlen, während notwendige Achsenwerte und Einheiten verständlich bleiben.
4. **Given** dass eine Sportauswahl bereits eindeutig aus der Grafik hervorgeht, **When** ich exportiere, **Then** entfällt ein redundantes `All sports`; eine sonst nicht erkennbare Einschränkung auf eine Sportart bleibt sichtbar.
5. **Given** derselbe Inhalt in den drei Layouts, **When** ich die Bilder bei gleicher Breite betrachte, **Then** ist das Logo im Reel-/Story-Layout erkennbar größer, ohne Daten oder notwendige Beschriftungen zu verdrängen.

---

### User Story 2 - Die eigene Punchline bestimmen (Priority: P1)

Als trainierende Person möchte ich eine prägnante Aussage deutlich sichtbar teilen, einen passenden Vorschlag auswählen, selbst einen Text formulieren oder ganz ohne Punchline exportieren.

**Why this priority**: Die persönliche Kernaussage ist der zentrale neue Gestaltungsspielraum; Nutzerkontrolle verhindert ungewollte oder unpassende Aussagen.

**Independent Test**: Dieselbe Grafik mit Standardtext, ausgewähltem Vorschlag, eigenem Text und ausgeschalteter Punchline exportieren und jede Datei mit ihrer Vorschau vergleichen.

**Acceptance Scenarios**:

1. **Given** eine neue Exportsitzung mit auswertbaren Daten, **When** ich die Vorschau öffne, **Then** ist `Add a punchline` eingeschaltet und genau eine kurze, zum Inhalt passende Aussage sichtbar; die bisherige `Light line` ist nicht länger eine unauffällige Nebenzeile.
2. **Given** eine aktive Punchline, **When** ich sie für diesen Export ausschalte, **Then** enthält weder Vorschau noch Download eine Punchline oder einen leeren Platzhalter; Daten und Filter bleiben gleich.
3. **Given** mehrere passende Vorschläge, **When** ich einen davon auswähle, **Then** ersetzt er die bisherige Punchline, statt als zusätzliche Zeile daneben zu erscheinen.
4. **Given** ein eigener Text mit 1–120 Unicode-Codepoints nach äußerem Trimmen, der im gewählten Format in höchstens zwei lesbare Zeilen passt, **When** ich ihn bestätige, **Then** erscheint genau dieser Text als Punchline in Vorschau und Download und wird nicht automatisch umgeschrieben oder durch einen Vorschlag ersetzt.
5. **Given** ein leerer oder zu langer eigener Text, **When** ich ihn bestätigen möchte, **Then** erhalte ich eine verständliche Rückmeldung; ein ungültiger Text wird nicht stillschweigend gekürzt oder als fertiger Export angeboten.
6. **Given** ein gewählter Text, **When** ich das Layout wechsle oder die Punchline aus- und wieder einschalte, **Then** bleibt meine Textauswahl innerhalb dieser Exportsitzung erhalten.
7. **Given** ein zeichenvalider eigener Text, der bei den vorgeschriebenen Schriftgrößen nicht in zwei Zeilen passt, **When** ich ihn anwenden möchte, **Then** erklärt die Vorschau den Darstellungsfehler und sperrt den Download dieser Fassung; der Text wird weder gekürzt noch umgeschrieben und kann korrigiert oder ausdrücklich verworfen werden.
8. **Given** ein bestätigter Text, der im bisherigen Format darstellbar ist, **When** ich zu einem Format wechsle, in dem er nicht in zwei lesbare Zeilen passt, **Then** bleibt der Text erhalten und der Download bleibt gesperrt, bis ich ihn passend korrigiere, zum passenden Format zurückkehre oder die Punchline ausschalte; erst die erfolgreich vorbereitete neue Fassung ist herunterladbar.

---

### User Story 3 - Einen persönlichen Rekord nachvollziehbar zeigen (Priority: P1)

Als trainierende Person möchte ich bei einem PR-Export erkennen, welches Workout zu dem Rekord gehört und wann die dargestellten Leistungen erbracht wurden, ohne interne Fachbegriffe entschlüsseln zu müssen.

**Why this priority**: Ein Rekordbild braucht verständliche Herkunft und zeitliche Einordnung, um glaubwürdig und persönlich zu sein.

**Independent Test**: PR-Verläufe mit einem, mehreren und weit auseinanderliegenden Datenpunkten sowie fehlenden Workout-Titeln exportieren und mit den zugrunde liegenden Aktivitäten vergleichen.

**Acceptance Scenarios**:

1. **Given** ein ausgewählter PR mit bekanntem zugehörigem Workout, **When** ich exportiere, **Then** steht der tatsächliche Workout-Titel beim Rekord; `modeled` und `full-activity` dienen nicht als Ersatz für den Titel.
2. **Given** ein Rekord ohne verfügbaren Titel oder ohne eindeutig zugehöriges Workout, **When** ich exportiere, **Then** wird kein Titel erfunden oder einem fremden Workout entnommen; eine verständliche neutrale Bezeichnung mit verfügbarem Datum ersetzt ihn.
3. **Given** mehrere datierte Rekordpunkte, **When** ich exportiere, **Then** sind die Datumsbeschriftungen eindeutig und lesbar, die Reihenfolge bleibt chronologisch und die Zeitachse orientiert sich am frühesten und spätesten dargestellten Punkt statt an einem sachfremden Gesamtzeitraum.
4. **Given** nur ein Rekordpunkt oder mehrere Punkte am selben Datum, **When** ich exportiere, **Then** ist dieses Datum erkennbar und die Darstellung suggeriert weder einen Verlauf noch zusätzliche Messpunkte.
5. **Given** eine PR-Darstellung mit Leistungsdauer statt Kalenderzeit als Achse, **When** ich exportiere, **Then** bleibt diese fachliche Achsenbedeutung erhalten; sie wird nicht durch erfundene Datumswerte ersetzt.

---

### User Story 4 - Eine belegbare Trainingsgewohnheit entdecken (Priority: P2)

Als trainierende Person möchte ich Vorschläge erhalten, die zu meinen tatsächlich ausgewählten Trainingsdaten passen, insbesondere zu meinen Trainingszeiten, ohne daraus unbelegte persönliche Eigenschaften abzuleiten.

**Why this priority**: Kontextbezogene Vorschläge machen die Personalisierung nützlicher, dürfen aber nur dort Aussagen treffen, wo Daten sie tragen.

**Independent Test**: Workout-Time-Auswahlen mit Morgen-, Abend-, Nacht-, gemischter und unzureichender Datengrundlage sowie weitere Visualisierungen mit und ohne klaren Befund vergleichen.

**Acceptance Scenarios**:

1. **Given** mindestens zehn Aktivitäten mit gültiger lokaler Startzeit, davon mindestens 60 Prozent zwischen 05:00 einschließlich und 12:00 ausschließlich, **When** ich Workout Time exportiere, **Then** bietet die Analyse `Morning bird` an und erklärt den zugrunde liegenden Anteil und die berücksichtigte Anzahl.
2. **Given** dieselbe Mindestanzahl und mindestens 60 Prozent der Starts zwischen 22:00 einschließlich und 05:00 ausschließlich, **When** ich die Vorschläge öffne, **Then** steht `Night owl` zur Auswahl; überwiegend um 19:00 beginnende Trainings werden nicht als Nachttrainings bezeichnet.
3. **Given** eine gefilterte Auswahl ohne dominante Tageszeit oder mit weniger als zehn gültigen Starts, **When** Vorschläge angezeigt werden, **Then** fehlen tageszeitbezogene Gewohnheitsbehauptungen; bei aktivierter Punchline bleibt eine kurze neutrale, nicht als Analysebefund ausgegebene Alternative möglich.
4. **Given** ein Wechsel von Sport, Zeitraum oder Messgröße vor Beginn einer neuen Exportsitzung, **When** ich erneut exportiere, **Then** beruhen Analyse und Vorschläge ausschließlich auf der neuen Auswahl; die Tageszeit-Einordnung nach Aktivitätsstarts bleibt unabhängig von der dargestellten Messgröße erkennbar.
5. **Given** eine andere Visualisierung mit einem belegbaren Befund, **When** ich Vorschläge öffne, **Then** erhalte ich dazu passende Auswahltexte samt nachvollziehbarer Grundlage; fehlen die benötigten Daten, erscheint der betreffende Vorschlag nicht.

### Edge Cases

- Fehlende Sport-, Zeitraum- oder Einheitenangaben: Redundanz entfällt nur, wenn die Interpretation eindeutig bleibt; unbekannte Angaben werden nicht ergänzt.
- Leere Auswahl oder nicht verfügbare Visualisierung: keine angeblich datenbasierte Punchline und kein erfundener Rekord; bestehende Exportverfügbarkeitsregeln bleiben bestehen.
- Fehlende oder mehrdeutige lokale Startzeiten: aus der Tageszeit-Analyse ausschließen und Anzahl ausgeschlossener Aktivitäten kenntlich machen; keine Uhrzeit oder Zeitzone erraten.
- Genau zehn gültige Starts, genau 60 Prozent, Starts um 05:00, 12:00, 18:00 und 22:00: konsistente Zuordnung gemäß den dokumentierten Grenzen.
- Gleichstände, ausschließlich gleiche Werte, kurze Zeiträume und unvollständige Jahre: keine eindeutige Dominanz, Verbesserung oder Ganzjahresaussage behaupten, wenn sie nicht belegt ist.
- PR-Punkte am selben Tag, Jahreswechsel, Schaltjahr, fehlendes Datum oder ein extrem weit entfernter Punkt: tatsächliche Daten erhalten, Datumsauflösung sinnvoll wählen, fehlende Datierung kenntlich machen und keine interpolierten Rekorde erfinden.
- Lange Workout-Titel oder Punchlines: lesbare Umbrüche statt Überlagerungen; den gewählten eigenen Text nicht unbemerkt verändern.
- Ausschalten während einer Vorschauaktualisierung, rascher Text-/Layoutwechsel oder Schließen und erneutes Öffnen: nur die zuletzt bestätigte Fassung ist herunterladbar; eine neue Sitzung beginnt mit den festgelegten Standards.
- Synthetische Beispieldaten: Analysen beziehen sich nur auf diese Beispiele; ihre bestehende Herkunftskennzeichnung bleibt erhalten und suggeriert keine persönlichen Leistungen.

## Requirements *(mandatory)*

### Functional Requirements

#### Umfang und verständlicher Kontext

- **FR-001**: Die gemeinsamen Exportverbesserungen MÜSSEN auf alle bereits verfügbaren Visualisierungs-Exporte und deren angebotene Varianten in Vorschau und Download angewendet werden. Neue Visualisierungstabs, neue Datenquellen und Änderungen an Trainingsberechnungen gehören nicht zum Umfang.
- **FR-002**: Kontexttexte MÜSSEN technische Präfixe durch direkte Inhaltsangaben ersetzen, beispielsweise `Distance`, `2024–2025`, `km` und `Length vs activities`. Interne Begriffe wie `2-hour-blocks` DÜRFEN NICHT im Export erscheinen. Die im Diagramm dargestellte zeitliche Auflösung MUSS trotzdem durch verständliche Zeitangaben interpretierbar bleiben.
- **FR-003**: Inhaltlich gleiche Angaben MÜSSEN nur einmal erscheinen. `All sports` und vergleichbare Standardkontexte MÜSSEN entfallen, wenn die Grafik sie bereits eindeutig vermittelt. Nicht anderweitig erkennbare Einschränkungen, Einheiten, Vergleichsgrößen, Teilzeiträume und Aggregationsbedeutungen MÜSSEN erhalten bleiben. Kürzere Kontexttexte ersetzen nicht notwendige Skalen oder Legenden.

#### Layout und visuelle Hierarchie

- **FR-004**: `Reel / Story` MUSS die erste und in jeder neu begonnenen Exportsitzung standardmäßig ausgewählte Layoutoption sein. Ein bewusst gewähltes anderes Layout MUSS innerhalb dieser Sitzung bestehen bleiben. Die vorhandenen Ausgabegrößen 1080 × 1920, 1080 × 1080 und 1080 × 1350 für Reel / Story, Square und Feed portrait bleiben erhalten.
- **FR-005**: Das Reel-/Story-Logo MUSS den zusätzlichen vertikalen Raum nutzen. Bei gleicher Bildbreite MUSS seine sichtbare Höhe mindestens 150 Prozent der Logohöhe des Square-Layouts betragen, bei unveränderten Proportionen und ohne notwendige Daten oder Beschriftungen zu verdecken. Bestehende Sicherheitsabstände und Herkunftshinweise bleiben erhalten.
- **FR-006**: Die bisherige `Light line` MUSS als eine zentrale, optionale Punchline erscheinen. Ihre Schriftgröße MUSS mindestens 125 Prozent der unterstützenden Kontextschrift betragen; sie MUSS vor der Detailkontextzeile im Lesefluss stehen. Sie darf höchstens zwei lesbare Zeilen beanspruchen und keine Daten überdecken. Diagramm, notwendiger Kontext und Punchline MÜSSEN bei einer Darstellung mit 360 Pixeln Bildbreite ohne Zoom lesbar sein; bestehende strengere Lesbarkeitsregeln bleiben gültig.

#### Steuerung und eigene Punchlines

- **FR-007**: `Add a punchline` MUSS in jeder neuen Exportsitzung eingeschaltet sein. Ausschalten MUSS für den aktuellen Export möglich sein und die Punchline samt reserviertem Leerraum aus Vorschau und Datei entfernen. Es DARF dabei NICHT die Datenauswahl verändern.
- **FR-008**: Bei eingeschalteter Punchline MUSS genau ein bestätigter Text ausgegeben werden: ein belegbarer Standardvorschlag, ein gewählter Vorschlag oder eigener Text. Falls keine Analysebehauptung gestützt ist, MUSS ein kurzer neutraler Standard ohne Behauptung über die Trainingsdaten verwendet werden.
- **FR-009**: Nutzende MÜSSEN Vorschläge auswählen und eine eigene Punchline eingeben können. Zeichenvalidität und Darstellbarkeit MÜSSEN getrennt geprüft werden: Eigene Texte sind nach Entfernung äußerer Leerzeichen bei 1–120 Unicode-Codepoints zeichenvalide; für einen Export mit aktiver Punchline MÜSSEN sie zusätzlich im gewählten Format bei den nach FR-006 vorgeschriebenen Schriftgrößen in höchstens zwei lesbare Zeilen passen. Eine gültige Zeichenlänge allein garantiert keine Darstellbarkeit. Zeichenfehler und fehlende Darstellbarkeit MÜSSEN mit verständlicher Rückmeldung den Download der betroffenen Fassung sperren, ohne Text oder Schriftgrößengrenzen stillschweigend zu verändern. Bei einem Formatwechsel MUSS der gewählte Text erhalten und erneut auf Darstellbarkeit geprüft werden. Der Download bleibt bis zur passenden Korrektur, expliziten Rückkehr zu einem gültigen vorherigen Text, Rückkehr zu einem passenden Format oder Deaktivierung der Punchline gesperrt; er darf erst nach erfolgreicher Vorbereitung der gewählten Fassung freigegeben werden. Zeichenvalide und darstellbare Texte MÜSSEN unverändert, gegebenenfalls umbrochen, erscheinen; stilles Kürzen und automatische inhaltliche Änderungen sind ausgeschlossen.
- **FR-010**: Eigener Text DARF NICHT als automatisch belegter Analysebefund bezeichnet werden. Die Exportsteuerung MUSS ihn als eigenen Text von Vorschlägen unterscheiden; er benötigt im Bild keine zusätzliche Herkunftszeile. Die Anwendung MUSS ausschließlich ihre eigenen Vorschläge auf Datenbelegbarkeit prüfen und DARF Nutzereingaben NICHT in erfundene Analyseergebnisse umdeuten.
- **FR-011**: Ein Layoutwechsel, Seitenwechsel bei mehrteiligen Exporten oder Aus-/Einschalten MUSS den gewählten Text innerhalb derselben Exportsitzung erhalten. Vorschau und Download MÜSSEN hinsichtlich Text, Aktivierung und Layout übereinstimmen. Veraltete Aktualisierungen DÜRFEN NICHT als aktuelle Fassung herunterladbar sein.

#### Datenbasierte Vorschläge und Workout Time

- **FR-012**: Automatische Punchlines MÜSSEN kurz, verständlich und freundlich sein und ausschließlich auf der für den Export ausgewählten Datenbasis beruhen. Rekorde, Vergleiche, Trends, Superlative und Gewohnheiten DÜRFEN nur angeboten werden, wenn die erforderlichen Werte und Vergleichsgrundlagen vorliegen. Aussagen über Gesundheit, Charakter oder nicht beobachtete Trainingszeiten sind ausgeschlossen.
- **FR-013**: In der Exportsteuerung MUSS bei jedem datenbezogenen Vorschlag seine Grundlage einsehbar sein, einschließlich betrachteter Auswahl, maßgeblicher Messgröße sowie relevantem Wert oder Anteil. Diese Erklärung MUSS NICHT vollständig im Bild stehen. Erforderliche Einschränkungen wie ein Teilzeitraum DÜRFEN im Bild nicht verloren gehen.
- **FR-014**: Workout Time MUSS eine Analyse der Aktivitätsstarts mit passenden Punchline-Vorschlägen anbieten. Jeder Aktivitätsstart zählt einmal; fehlende oder mehrdeutige lokale Startzeiten werden ausgeschlossen. Die Analyse MUSS gültige und ausgeschlossene Anzahlen nennen und DARF fehlende Uhrzeiten NICHT aus Dauer oder Distanz ableiten.
- **FR-015**: Für Tageszeitgewohnheiten MÜSSEN mindestens zehn gültige Starts vorliegen und mindestens 60 Prozent in demselben Zeitfenster liegen. Die disjunkten Fenster sind Morgen [05:00, 12:00), Nachmittag [12:00, 18:00), Abend [18:00, 22:00) und Nacht [22:00, 05:00). `Morning bird` und `Night owl` DÜRFEN nur bei erfüllter Morgen- beziehungsweise Nachtbedingung angeboten werden. Für Nachmittag oder Abend MUSS ein entsprechend wörtlicher, nicht nächtlicher Vorschlag verfügbar sein, wenn die Bedingung erfüllt ist.
- **FR-016**: Die Workout-Time-Analyse MUSS offenlegen, dass die Zuordnung auf Aktivitätsstarts beruht, auch wenn die Grafik Dauer oder Distanz zeigt. Sie DARF eine mengenmäßig dominante Tageszeit NICHT als zeit- oder distanzdominant ausgeben. Ohne ausreichenden Befund MUSS sie dies verständlich anzeigen und auf eine Gewohnheitsbehauptung verzichten.
- **FR-017**: Für jede andere verfügbare Visualisierungsfamilie MUSS geprüft und in der Abnahme dokumentiert werden, welche Vorschläge ihre vorhandenen Daten sinnvoll tragen. Wo ein eindeutig belegbarer Befund vorliegt, MUSS mindestens ein kontextbezogener Vorschlag verfügbar sein, etwa eine führende Kategorie nach ausgewählter Messgröße oder eine tatsächlich ausgewiesene Rekordleistung. Bei Gleichstand ist nur ein ausdrücklich gemeinsamer Spitzenplatz zulässig. Wo kein geeigneter Befund vorliegt, MUSS eine neutrale Alternative statt eines erfundenen Analyseergebnisses angeboten werden. Eine feste Anzahl an Vorschlägen ist nicht vorgeschrieben.

#### Persönliche Rekorde und Datumsverständlichkeit

- **FR-018**: PR-Exporte MÜSSEN den vorhandenen Workout-Titel des zugehörigen Rekords als persönliche Quellenbezeichnung verwenden. Bei mehreren dargestellten Rekorden MUSS die Zuordnung des jeweiligen Titels zu seinem Rekord eindeutig sein. Ohne eindeutige Quelle MUSS eine neutrale Bezeichnung verwendet werden; fremde Titel und erfundene Titel sind ausgeschlossen. Die Vorschau MUSS die Titel vor dem Download sichtbar machen.
- **FR-019**: `modeled` und `full-activity` DÜRFEN NICHT als unerklärte Exportbeschriftungen erscheinen. Falls eine Schätzung oder die Unterscheidung zwischen ganzer Aktivität und Abschnitt für das Verständnis nötig ist, MUSS eine kurze verständliche Formulierung diese Bedeutung erhalten. Ein Workout-Titel DARF eine notwendige Kennzeichnung als Schätzung NICHT ersetzen.
- **FR-020**: Datumsbeschriftungen in PR-Exporten MÜSSEN bei überjährigen Daten den Jahresbezug eindeutig machen und so verteilt sein, dass sie lesbar bleiben. Dargestellte Datumswerte MÜSSEN den vorhandenen Rekorddaten entsprechen; fehlende Daten DÜRFEN NICHT geraten werden.
- **FR-021**: Kalenderbasierte PR-Achsen MÜSSEN sich auf die früheste und späteste tatsächlich dargestellte Beobachtung mit höchstens einem angezeigten Beschriftungsintervall Rand je Seite begrenzen; ein größerer ausdrücklich ausgewählter Vergleichszeitraum ist ausgenommen und MUSS als solcher erkennbar sein. Bei nur einem Zeitpunkt MUSS dieser als einzelne Beobachtung dargestellt werden. Dauerbasierte Leistungsprofile behalten ihre Dauerachse. Datenpunkte DÜRFEN NICHT hinzugefügt oder entfernt werden, um eine attraktivere Entwicklung vorzutäuschen.

#### Kontinuität und Grenzen

- **FR-022**: Alle Änderungen MÜSSEN innerhalb der bestehenden lokalen Exportvorschau und des Downloads nutzbar sein. Trainingsdaten und eigene Texte DÜRFEN für diese Funktion NICHT an einen externen Dienst übertragen werden. Das ist keine Aussage darüber, dass die gesamte Anwendung ohne Netzwerkzugriffe arbeitet.
- **FR-023**: Bestehende Herkunftskennzeichnungen, Quellenangaben, Filtersemantik und Datenschutzauswahl MÜSSEN erhalten bleiben. Die Workout-Titel in PR-Exporten sind die ausdrücklich beauftragte Erweiterung persönlicher Inhalte; zusätzliche Titel oder präzise Orte in anderen Exporten sind nicht beauftragt.
- **FR-024**: Die Behebung des nicht funktionierenden Training-Calendar-Exports, abgeschnittener Inhalte bei Lifetime Statistics sowie des Heatmap-Fehlers `Cannot read properties of undefined (reading 'geoPoint')` beim Apple-Health-Import ist ausdrücklich NICHT Bestandteil dieses Features. Ebenso ausgeschlossen sind die gewünschten Lifetime-Statistics-Inhaltsänderungen: Entfernen von KPIs, besuchten Ländern sowie des Textes zur Zahl aufgezeichneter Aktivitäten im Höhenbereich. Bestehende Fehler werden separat erfasst und durch diese Spezifikation nicht zu zusätzlichen Abnahmeanforderungen.

### Key Entities *(include if feature involves data)*

- **Exportsitzung**: Eine bewusst gestartete Exportvorbereitung mit zusammengehöriger Datenauswahl, Filtern, Layout, Punchline-Auswahl und gegebenenfalls mehreren Bildseiten. Erneutes Öffnen beginnt eine neue Sitzung.
- **Exportkontext**: Die zum Verständnis nötigen Angaben zu Zeitraum, Sport, Messgrößen, Einheiten, Vergleichen und Datenherkunft; redundante Angaben werden nicht doppelt dargestellt.
- **Punchline**: Genau ein optionaler Kurztext mit Quelle Standard, gewählter Vorschlag oder Nutzereingabe und separatem Aktivierungszustand.
- **Vorschlagsgrundlage**: Der nachvollziehbare Bezug eines Vorschlags zur ausgewählten Datenmenge, seinem Messkriterium, Mindestdatenumfang und Ergebnis; fehlt die Grundlage, ist der Vorschlag nicht zulässig.
- **PR-Quelle**: Der Bezug zwischen Rekordwert, Datum, gegebenenfalls Workout-Titel und notwendiger Aussage über Messung oder Schätzung; nicht jeder Rekord besitzt alle Angaben.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Bei 100 Prozent der neu begonnenen Prüfsitzungen steht Reel / Story an erster Stelle, ist ausgewählt und `Add a punchline` ist aktiv. Ein bewusster Layoutwechsel und Ausschalten funktionieren bei allen verfügbaren Exportfamilien.
- **SC-002**: In einer dokumentierten Auswahl mit mindestens einem verfügbaren Export je Visualisierungsfamilie und allen angebotenen Layouts treten null technische Kontextpräfixe aus FR-002, null `2-hour-blocks` und null inhaltsgleichen Kontextduplikate auf; alle zur Interpretation erforderlichen Filter und Einheiten bleiben korrekt erkennbar.
- **SC-003**: In allen geprüften Layouts ist die Punchline höchstens zweizeilig und mindestens 25 Prozent größer als die unterstützende Kontextschrift; das Reel-/Story-Logo ist mindestens 50 Prozent höher als im Square-Layout bei gleicher Bildbreite. Die geänderten Elemente bleiben bei 360 Pixeln Bildbreite lesbar und überdecken keine notwendigen Inhalte. Das ist keine Abnahme der separat ausgeschlossenen Lifetime-Statistics-Abschneidefehler.
- **SC-004**: In sämtlichen Prüffällen für Standardtext, Vorschlagswechsel, eigenen Text, Grenzlängen, Aus-/Einschalten und schnellen Layoutwechsel entspricht der Download genau der zuletzt bestätigten Vorschau. Zeichenvalide, aber nicht darstellbare aktive Texte werden in 100 Prozent der entsprechenden Prüffälle einschließlich Formatwechsel mit verständlichem Fehler und Downloadsperre behandelt; nach passender Korrektur, expliziter Rückkehr oder Deaktivierung ist nur die erfolgreich vorbereitete gewählte Fassung herunterladbar. Es gibt null still gekürzte eigene Texte und null Punchlines in ausdrücklich deaktivierten Exporten.
- **SC-005**: Referenzfälle mit 9 und 10 gültigen Starts, 59 und 60 Prozent Dominanz, allen vier Zeitfenstern, fehlenden Uhrzeiten und geänderten Filtern erfüllen zu 100 Prozent die Regeln FR-012 bis FR-017. Jeder automatisch angebotene Datenbefund ist anhand der angezeigten Grundlage nachvollziehbar; unbelegte Gewohnheits-, Trend- oder Rekordbehauptungen treten nullmal auf. Für jede weitere verfügbare Visualisierungsfamilie ist mindestens ein belegbarer Vorschlag oder eine begründete neutrale Alternative dokumentiert.
- **SC-006**: In allen geprüften PR-Varianten mit einem Punkt, mehreren Punkten, Jahreswechsel, fehlendem Titel, fehlendem Datum und Dauerachse stimmen Werte, Quellenzuordnung und verfügbare Daten mit der Referenz überein. Unerklärtes `modeled`/`full-activity`, erfundene Datumswerte und sachfremde Achsenbereiche treten nullmal auf.
- **SC-007**: In einem Verständlichkeitstest mit mindestens fünf Freizeitausdauersportlerinnen oder -sportlern können mindestens vier nach fünf Sekunden Betrachtung bei 360 Pixeln Bildbreite Thema, relevanten Zeitraum, Messgröße/Einheit und Kernaussage korrekt wiedergeben. Mindestens vier können ohne Anleitung innerhalb von 60 Sekunden einen eigenen Text setzen, einen Vorschlag wählen und die Punchline ausschalten. Getestet werden eine Zeitreihe, ein Zwei-Achsen-Diagramm, Workout Time und ein PR-Export.

## Assumptions

- Diese Spezifikation ist eine zusammenhängende Weiterentwicklung der vorhandenen Exporte, kein neuer Exportkanal. Bilder bleiben statische Bilder; Videos, Direktveröffentlichung, Konten und ein neuer Speicher für persönliche Präferenzen sind nicht enthalten.
- Die Vorgaben dieses Features ersetzen gezielt die bisherigen Annahmen aus Feature 077: Square ist nicht länger der Startstandard, Punchlines sind nicht länger standardmäßig deaktiviert und dürfen für bessere Wirkung bis zu zwei statt einer Zeile nutzen. Weitere Format-, Sicherheitsabstands-, Herkunfts- und Lesbarkeitsregeln bleiben erhalten. Die Rekorddarstellung selbst und ihre Berechnungen ändern sich nicht.
- Die Mindestanzahl von zehn Starts, 60 Prozent Dominanz, vier Tageszeitfenster, 120 Zeichen und visuellen Größenverhältnisse sind dokumentierte Produktannahmen für eine überprüfbare erste Fassung, keine medizinisch oder statistisch validierten Aussagen über eine Person. Eigene Texte dürfen beliebig formuliert sein; die Anwendung behauptet dafür keine faktische Prüfung.
- Tageszeit bezeichnet die eindeutig verfügbare lokale Startzeit der Aktivität. Verfügbare Trainingsquellen können unterschiedliche Felder liefern; fehlende Informationen werden nicht ergänzt. Die Aussagen beschreiben nur die ausgewählte Datenmenge, nicht den gesamten Lebensstil.
- Die vorhandene Sprache der Exportoberfläche bleibt maßgeblich; die englischen Beispieltexte sind keine Anforderung an eine neue Übersetzungsfunktion. Datumswerte müssen unabhängig von der Sprache eindeutig lesbar sein.
- Die bestehende Verfügbarkeit der Visualisierung und ihrer Quelldaten ist Voraussetzung. Vorhandene separate Defekte werden nicht als zusätzliche Reparaturaufträge behandelt; die gemeinsamen Regeln gelten auch dort, sobald ein Export regulär verfügbar ist. Lifetime Statistics erhält keine der ausdrücklich ausgeschlossenen Inhaltsänderungen.
- Die verbindliche Browserabnahme folgt dem bisherigen Exportumfang: aktuelle stabile Desktop-Versionen von Chrome und Edge, einschließlich schmaler Vorschauansichten; Smartphone-Lesbarkeit wird anhand der exportierten Bilder bewertet. Neue Browser- oder Mobilgeräteunterstützung wird nicht eingeführt.
- Die Anforderungen sind ohne entscheidende offene Produktfrage planbar. Es verbleiben keine klärungsbedürftigen Platzhalter.