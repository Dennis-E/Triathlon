# Feature Specification: Strava Media Gallery

**Feature Branch**: `067-strava-media-gallery`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: Nach dem einmaligen Import eines Strava-ZIP-Exports Fotos und Videos lokal ansehen, zuverlässig Trainingsaktivitäten zuordnen, filtern und für Jahresrückblicke sowie Collagen exportieren.

## Clarifications

### Session 2026-10-26

- Q: Sollen exportierte Collagen und Jahresrückblicke eingebettete Standortdaten der Originalfotos immer entfernen, auch wenn eine sichtbare Route ausdrücklich eingeschlossen wird? → A: Eingebettete Standortdaten immer entfernen; sichtbare Routen bleiben separat wählbar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Strava-Medien mit einmaligem Import verfügbar machen (Priority: P1)

Ein Nutzer wählt seinen Strava-ZIP-Export wie bisher einmal aus. TriAnalytica erkennt enthaltene Fotos und Videos, prüft sämtliche Medien- und Aktivitätsreferenzen und stellt eindeutig zuordenbare Medien zusammen mit den importierten Trainingsaktivitäten bereit. Unvollständige oder fehlerhafte Medien beeinträchtigen den Trainingsimport nicht. Der Nutzer kann anschließend in den Medien-Reiter wechseln, ohne die ZIP-Datei erneut auszuwählen.

**Why this priority**: Ohne zuverlässigen Import und Zuordnung sind Galerie, Aktivitätskontext und Rückblicke nicht nutzbar.

**Independent Test**: Einen Strava-Export mit Medien einmal importieren und prüfen, dass lesbare Medien verfügbar sind, eindeutige Referenzen korrekt zugeordnet werden und Trainingsdaten auch bei fehlerhaften Medien erhalten bleiben.

**Acceptance Scenarios**:

1. **Given** ein gültiger Strava-Export mit lesbaren Fotos oder Videos, **When** der Nutzer ihn einmal importiert, **Then** wird ein Medien-Reiter angeboten und die Medien sind ohne erneute Dateiauswahl erreichbar.
2. **Given** eine Medienreferenz fehlt, ist beschädigt oder lässt sich nicht eindeutig auflösen, **When** der Import sie prüft, **Then** wird sie mit verständlichem Status ausgewiesen und keiner Aktivität willkürlich zugeordnet.
3. **Given** Medien können nicht gelesen oder zugeordnet werden, **When** der Trainingsimport abgeschlossen wird, **Then** bleiben gültige Trainingsaktivitäten und ihre bisherigen Ansichten verfügbar.
4. **Given** der Nutzer wechselt nach dem Import in einen anderen Reiter und zurück, **When** die Seite noch geöffnet ist, **Then** muss die ZIP-Datei nicht erneut ausgewählt werden.
5. **Given** der Nutzer schließt oder lädt die Seite neu, **When** er die Medien erneut nutzen möchte, **Then** darf ein erneuter Import erforderlich sein.

### User Story 2 - Medien und zugehörige Aktivitäten durchsuchen (Priority: P1)

Der Nutzer durchsucht seine Medien chronologisch und grenzt die Ansicht nach Jahr, Sportart oder zugehöriger Aktivität ein. Er kann ein Medium vergrößert ansehen, Videos ausdrücklich starten und zugeordneten Aktivitätsdetails sowie gegebenenfalls der Route folgen.

**Why this priority**: Das schnelle Wiederfinden und der Trainingskontext machen den persönlichen Medienbestand im Alltag nutzbar.

**Independent Test**: Einen Import mit mehreren Jahren, Sportarten, zugeordneten und nicht zugeordneten Medien öffnen; chronologische Reihenfolge und jeden Filter prüfen sowie eine Aktivität aus einem Medium aufrufen.

**Acceptance Scenarios**:

1. **Given** importierte Medien aus verschiedenen Jahren und Sportarten, **When** der Nutzer Jahr, Sportart oder Aktivität auswählt, **Then** zeigt die Galerie nur passende Medien und erlaubt das Zurücksetzen der Filter.
2. **Given** ein eindeutig zugeordnetes Medium, **When** der Nutzer es öffnet, **Then** kann er es größer ansehen und die zugehörigen Aktivitätsdetails sowie eine verfügbare Route erreichen.
3. **Given** ein nicht zugeordnetes Medium oder ein Video, **When** der Nutzer es öffnet, **Then** wird der fehlende Aktivitätskontext kenntlich gemacht und ein Video startet nicht automatisch.

### User Story 3 - Jahresrückblick und Collagen lokal exportieren (Priority: P2)

Der Nutzer erstellt einen Jahresrückblick oder eine Collage aus ausgewählten beziehungsweise passend gefilterten Medien und exportiert das Ergebnis lokal. Vor dem Export kann er die Ansicht prüfen und entscheiden, ob sensible Orts- oder Routendetails enthalten sein dürfen.

**Why this priority**: Rückblicke und teilbare Collagen schaffen einen wiederverwendbaren Mehrwert aus der importierten Galerie, setzen aber eine funktionierende Galerie voraus.

**Independent Test**: Medien eines Jahres beziehungsweise eine manuelle Auswahl für Rückblick und Collage verwenden, den lokalen Export abschließen und prüfen, dass Routen standardmäßig fehlen und nur nach ausdrücklicher Wahl erscheinen.

**Acceptance Scenarios**:

1. **Given** Medien aus einem Jahr oder eine gefilterte beziehungsweise manuelle Auswahl, **When** der Nutzer einen Rückblick oder eine Collage erstellt, **Then** enthält die Vorschau nur die ausgewählten passenden Medien und kann lokal exportiert werden.
2. **Given** ein exportierbarer Rückblick oder eine Collage, **When** der Nutzer die Exportansicht öffnet, **Then** kann er sie vor dem lokalen Herunterladen prüfen und anpassen.
3. **Given** eine Ansicht mit Aktivitätsroute oder Kartenbezug, **When** der Nutzer exportiert, **Then** sind Routen und genaue Ortsdetails standardmäßig ausgeschlossen; ihre Aufnahme erfordert eine ausdrückliche Wahl und wird vor dem Export kenntlich gemacht.
4. **Given** ausgewählte Videos, **When** sie in einer statischen Collage oder einem Bildrückblick erscheinen, **Then** werden sie als Standbild beziehungsweise Vorschau dargestellt und nicht automatisch abgespielt.
5. **Given** ein Export enthält ausgewählte Fotos, **When** der Nutzer ihn erstellt, **Then** enthält er keine eingebetteten Standortdaten aus den Originalfotos, auch wenn eine sichtbare Route eingeschlossen wurde.

### Edge Cases

- Die Zahl vorhandener Mediendateien stimmt nicht mit den Medienlisteneinträgen oder Aktivitätsreferenzen überein; jede Referenz und Datei muss in der Importübersicht einen nachvollziehbaren Status erhalten.
- Eine Aktivität nennt mehrere Medien, ein Medium wird mehrfach referenziert oder eine Referenz passt zu mehr als einer Datei; keine mehrdeutige Beziehung wird automatisch festgelegt.
- Ein Medium fehlt, ist beschädigt oder hat ein nicht unterstütztes Format; andere lesbare Medien und Trainingsdaten bleiben nutzbar.
- Es sind keine lesbaren Medien vorhanden; der Medien-Reiter wird nicht angeboten und der Nutzer erhält einen verständlichen Importstatus.
- Medien haben kein Datum, eine Aktivität hat keine Route oder ein Medium ist keiner Aktivität zugeordnet; Sortierung und Filter bleiben verständlich und zeigen keine erfundenen Werte.
- Ein Jahr oder Filter liefert keine Ergebnisse; die Galerie zeigt einen leeren Zustand und ermöglicht das Ändern der Auswahl.
- Der Export enthält private Ortsinformationen oder eine Route; genaue Ortsdetails dürfen nicht unbemerkt in einer exportierten Ansicht erscheinen. Eingebettete Standortdaten der Originalfotos werden unabhängig von sichtbaren Routen immer entfernt.
- Ein großer Medienbestand darf die Oberfläche nicht dazu zwingen, alle Originaldateien gleichzeitig darzustellen; Videos dürfen beim Durchsuchen und Erstellen von Rückblicken nicht automatisch starten.
- TrainingPeaks-Import, bestehende Trainingsansichten und bestehende Exportabläufe bleiben unverändert nutzbar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Der Strava-Import MUST Fotos und Videos im ausgewählten ZIP-Export erkennen und die für diese Funktion unterstützten Medien zugänglich machen. TrainingPeaks-Medienimport ist nicht Teil dieses Features.
- **FR-002**: Der Import MUST Medienreferenzen vollständig gegen die enthaltenen Medien und Aktivitäten prüfen. Jede Referenz und jede gefundene Mediendatei MUST als eindeutig zugeordnet, nicht zugeordnet, mehrdeutig, fehlend, beschädigt oder nicht unterstützt nachvollziehbar sein.
- **FR-003**: Die Anwendung MUST ein Medium nur dann einer Aktivität zuordnen, wenn die Referenz eindeutig und vollständig validiert ist. Sie MUST fehlende oder mehrdeutige Beziehungen weder erraten noch als bestätigte Zuordnung anzeigen.
- **FR-004**: Fehler bei Erkennung, Lesen oder Zuordnung einzelner Medien MUST den übrigen Trainingsimport und bestehende Trainingsansichten nicht verhindern. Der Nutzer MUST einen verständlichen Status zu betroffenen Medien erhalten.
- **FR-005**: Ein Medien-Reiter MUST nur angeboten werden, wenn mindestens ein lesbares Medium gefunden wurde. Nach einem erfolgreichen Import MUST der Nutzer zwischen Ansichten wechseln können, ohne die ZIP-Datei erneut auszuwählen.
- **FR-006**: Importierte Medien und ihre Zuordnungen MUST während der geöffneten Seite für die Galerie verfügbar bleiben. Diese Funktion MUST sie nicht dauerhaft im Browser speichern; ein erneuter Import nach Schließen oder Neuladen der Seite ist zulässig.
- **FR-007**: Die Galerie MUST Medien chronologisch anzeigen und Filter nach Jahr, Sportart und zugehöriger Aktivität anbieten. Nicht zugeordnete Medien müssen auffindbar bleiben.
- **FR-008**: Nutzer MUST ein ausgewähltes Medium größer ansehen können. Zugeordnete Aktivitätsdetails und eine gegebenenfalls vorhandene Route müssen von dort erreichbar sein. Videos MUST eine ausdrückliche Nutzeraktion zum Abspielen erfordern.
- **FR-009**: Nutzer MUST einen Jahresrückblick und Collagen aus ausgewählten oder gefilterten passenden Medien erstellen und über einen funktionierenden lokalen Vorschau- und Exportablauf ausgeben können. Videos in statischen Ausgaben werden als Standbild oder Vorschau dargestellt.
- **FR-010**: Medien, Bildunterschriften, Aktivitätsdaten und daraus abgeleitete Medienansichten MUST auf dem Gerät des Nutzers bleiben und dürfen weder an Anwendungsserver noch an Drittanbieter übertragen werden. Die Medienfunktion MUST keine dauerhafte Speicherung ohne ausdrückliche Zustimmung veranlassen.
- **FR-011**: Routen, Kartenbezüge und genaue Ortsdetails MUST in exportierten Ansichten standardmäßig ausgeschlossen sein. Vor ihrer ausdrücklichen Aufnahme MUST die Exportvorschau den Ortsbezug erkennbar machen; der Nutzer muss die Ausgabe vor dem Export prüfen können. Eingebettete Standortdaten aus Originalfotos MUST aus jedem Export entfernt werden, auch wenn eine sichtbare Route ausdrücklich eingeschlossen wird.
- **FR-012**: Bei großen Medienbeständen MUST Medien bedarfsgerecht angezeigt werden; das Durchsuchen oder Erstellen von Ansichten darf nicht voraussetzen, alle Originale zugleich zu laden. Videos MUST niemals automatisch starten.
- **FR-013**: Die Funktion MUST automatische Objekt-, Gesichts- und KI-Bildanalyse ausschließen.
- **FR-014**: Der bestehende Strava-Trainingsimport, der TrainingPeaks-Import und vorhandene Trainings- und Exportansichten MUST ohne Regression nutzbar bleiben.

### Key Entities *(include if feature involves data)*

- **Medium**: Ein Foto oder Video aus einem Strava-Export mit verfügbarer Datei, Datum und gegebenenfalls Bildunterschrift.
- **Medienreferenz**: Eine im Export enthaltene Beziehung zwischen einem Medium und einer Trainingsaktivität, deren Validierungsstatus nachvollziehbar ist.
- **Trainingsaktivität**: Ein importiertes Training mit Datum, Sportart und verfügbaren Details sowie gegebenenfalls Route.
- **Medienansicht**: Eine chronologische, gefilterte, jährliche oder manuell zusammengestellte Auswahl von Medien, die vergrößert angesehen oder lokal exportiert werden kann.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Für den bereitgestellten Referenzexport mit 1.458 Medieneinträgen und 924 Aktivitäten mit befülltem Medienfeld erhält jede Referenz und jede gefundene Mediendatei einen nachvollziehbaren Validierungsstatus; nur eindeutig bestätigte Beziehungen werden zugeordnet.
- **SC-002**: Ein Nutzer kann den Referenzexport einmal auswählen, danach mindestens ein lesbares Medium öffnen und zwischen Galerie und Trainingsansichten wechseln, ohne die ZIP-Datei erneut auszuwählen.
- **SC-003**: Bei einer Nutzbarkeitserprobung können mindestens 9 von 10 Nutzern ein Medium nach Jahr, Sportart und Aktivität filtern und eine zugeordnete Aktivität ohne Anleitung erreichen.
- **SC-004**: Bei einem Bestand von mindestens 1.000 Medieneinträgen erscheint eine angeforderte Medienvorschau innerhalb von 2 Sekunden auf dem Referenzgerät, ohne alle Originalmedien gleichzeitig anzuzeigen.
- **SC-005**: Nutzer können einen Jahresrückblick und eine Collage lokal exportieren; in 100 % der Prüfungen enthält der Export ohne ausdrückliche Wahl keine Route oder genaue Ortsdetails und enthält unabhängig von der Routenauswahl keine eingebetteten Standortdaten aus Originalfotos.
- **SC-006**: Tests und Nutzungsprüfung bestätigen, dass Medien und deren Inhalte nicht an Anwendungsserver oder Drittanbieter übertragen, nicht ohne ausdrückliche Zustimmung dauerhaft gespeichert und Videos nie automatisch gestartet werden.
- **SC-007**: Ein Strava-Trainingsimport ohne lesbare Medien sowie ein TrainingPeaks-Import bleiben erfolgreich; bestehende Trainingsansichten und Exportabläufe funktionieren weiterhin.

## Assumptions

- Die zunächst unterstützten Medienformate orientieren sich am bereitgestellten Referenzexport mit JPG-Fotos und MP4-Videos. Weitere Formate sind erst nach ausdrücklicher Festlegung Teil des Umfangs.
- Der Referenzexport enthält 1.256 JPG-Dateien, 205 MP4-Dateien, 1.458 Medieneinträge mit Dateinamen und Bildunterschriften sowie 924 Aktivitäten mit befülltem Medienfeld. Diese Zahlen begründen die Prüfung auf fehlende, zusätzliche und mehrdeutige Referenzen; sie garantieren keine vollständige Zuordnung.
- Trainingsdaten und Mediendateien gehören zu einer Import-Sitzung. Ein dauerhafter Import über Schließen oder Neuladen der Seite hinweg ist nicht Teil dieses Features.
- Jahresrückblicke und Collagen sind statische, lokal exportierbare Ansichten; Videos erscheinen darin als Standbild oder Vorschau, bleiben in der Galerie aber manuell abspielbar.
- „Lokal verarbeitet“ bezieht sich auf die ausgewählten Trainings- und Mediendateien. Die Formulierung verspricht nicht, dass die übrige Anwendung keinerlei Netzwerkanfragen stellt.
- Der bestehende lokale Visualisierungs-Export dient als Nutzerablauf für Vorschau und Ausgabe; Medieninhalte selbst werden dabei nicht an einen Dienst übertragen.