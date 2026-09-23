# Feature Specification: Calm Import Status

**Feature Branch**: `025-calm-import-status`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "Den Status 'extracting GPS tracks [...]' oberhalb des Fortschrittsbalkens anzeigen. Die Visualisierungen rotieren zu schnell; Nutzer sollen mehr Zeit zum Erfassen haben. Die Rotation soll ruhig wirken und etwa alle 5 oder 10 Sekunden wechseln."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Importstatus oberhalb des Fortschritts lesen (Priority: P1)

Als Nutzer möchte ich den aktuellen Verarbeitungsschritt wie „Extracting GPS tracks […]“ oberhalb des Fortschrittsbalkens sehen, damit ich den fachlichen Importstatus auf einen Blick erkenne, während die schwarze Statusbox weiterhin für die detaillierte Aktivität verwendet wird.

**Why this priority**: Der fachliche Status erklärt, was der Import gerade tut. Seine Position oberhalb des Fortschrittsbalkens entspricht der natürlichen Leserichtung und verhindert, dass Preview-Text mit dem Prozessstatus verwechselt wird.

**Independent Test**: Einen Import starten und prüfen, dass der aktuelle Verarbeitungsschritt oberhalb des Fortschrittsbalkens sichtbar ist, während Fortschrittsbalken und schwarze Detailbox weiterhin angezeigt werden.

**Acceptance Scenarios**:

1. **Given** ein Import verarbeitet GPS-Tracks, **When** der Status aktualisiert wird, **Then** erscheint „Extracting GPS tracks […]“ oberhalb des Fortschrittsbalkens.
2. **Given** der Import wechselt zu einer anderen Phase, **When** ein neuer Status gesetzt wird, **Then** wird der neue fachliche Status an derselben Position oberhalb des Fortschrittsbalkens angezeigt.
3. **Given** eine Importphase enthält eine detaillierte aktuelle Aktivität, **When** der Nutzer die Ansicht betrachtet, **Then** bleibt diese Detailinformation ausschließlich in der schwarzen Statusbox und wird nicht mit dem fachlichen Status vermischt.

### User Story 2 - Ruhige Visualisierungs-Previews betrachten (Priority: P1)

Als Nutzer möchte ich, dass die vorbereiteten Visualisierungs-Previews langsam und ruhig wechseln, damit ich Zeit habe, die dargestellte TriAnalytica-Auswertung zu erfassen, ohne von schnellen Wechseln abgelenkt zu werden.

**Why this priority**: Die Previews sollen neugierig machen und die wahrgenommene Wartezeit angenehm gestalten. Zu schnelle Wechsel erfüllen diesen Zweck nicht.

**Independent Test**: Einen ausreichend langen Import starten, die Uhrzeit jedes Preview-Wechsels erfassen und prüfen, dass zwischen zwei Wechseln mindestens 5 Sekunden liegen und die Statusmeldung synchron ruhig wechselt.

**Acceptance Scenarios**:

1. **Given** der Import läuft und eine Preview ist sichtbar, **When** noch keine 5 Sekunden vergangen sind, **Then** bleibt dieselbe Preview sichtbar.
2. **Given** der Import läuft länger als das Wechselintervall, **When** das Intervall abläuft, **Then** wechselt die Ansicht ruhig zur nächsten vorbereiteten Preview und passenden Statusmeldung.
3. **Given** der Import ist abgeschlossen oder fehlgeschlagen, **When** der Zustand wechselt, **Then** stoppt die Rotation und die Abschluss- oder Fehlermeldung bleibt stabil sichtbar.

### Edge Cases

- Bei einem sehr kurzen Import wird mindestens eine Preview angezeigt, aber der Importabschluss wird nicht künstlich verzögert.
- Wenn ein Importstatus häufiger aktualisiert wird als die Preview wechseln darf, beeinflusst dies den Preview-Timer nicht und setzt ihn nicht hektisch zurück.
- Bei Fehlern während der GPS-Verarbeitung wird der letzte fachliche Status oder die Fehlermeldung oberhalb des Fortschrittsbalkens lesbar angezeigt; die Detailbox bleibt für die Fehlerdetails verfügbar.
- Die Statuszeile bleibt bei langen Statusmeldungen und kleinen Bildschirmen lesbar und überlappt weder Fortschrittsbalken noch Preview.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Importansicht MUSS den aktuellen fachlichen Verarbeitungsschritt oberhalb des Fortschrittsbalkens anzeigen.
- **FR-002**: Der fachliche Status MUSS während der GPS-Verarbeitung den Fortschrittstext einschließlich Zähler anzeigen, zum Beispiel „Extracting GPS tracks (3/8)…“.
- **FR-003**: Die schwarze Statusbox MUSS weiterhin die detaillierte aktuelle Aktivität oder Fehlerdetails anzeigen und DARF NICHT durch den fachlichen Status ersetzt werden.
- **FR-004**: Eine sichtbare vorbereitete Visualisierungs-Preview MUSS während eines laufenden Imports mindestens 5 Sekunden unverändert bleiben, bevor zur nächsten Preview gewechselt wird.
- **FR-005**: Preview und begleitende humorvolle Statusmeldung MÜSSEN gemeinsam und ruhig wechseln; fachliche Fortschrittsupdates DÜRFEN den Preview-Wechsel nicht beschleunigen.
- **FR-006**: Preview-Rotation MUSS bei erfolgreichem Abschluss, Fehler oder Schließen des Importdialogs beendet werden.
- **FR-007**: Die Änderung DARF weder Importverarbeitung, GPS-Zählung, GPS-Segmentierung noch Abschlussverhalten fachlich verändern.
- **FR-008**: Status, Fortschrittsbalken, schwarze Detailbox und Preview MÜSSEN auf üblichen Desktop- und mobilen Ansichtsbreiten ohne Überlappung lesbar bleiben.

### Key Entities

- **Fachlicher Importstatus**: Der aktuelle Verarbeitungsschritt einschließlich optionalem Fortschrittszähler, der oberhalb des Fortschrittsbalkens angezeigt wird.
- **Preview-Zyklus**: Der zeitgesteuerte, ruhige Wechsel zwischen vorbereiteten Visualisierungs-Previews und begleitenden Meldungen.
- **Importdetail**: Die konkrete Aktivität oder Fehlerbeschreibung in der schwarzen Statusbox.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100 % der geprüften GPS-Importphasen erscheint der fachliche Status oberhalb des Fortschrittsbalkens und enthält bei zählbaren Phasen den aktuellen Zähler.
- **SC-002**: In 100 % der geprüften Imports bleibt eine Preview mindestens 5 Sekunden sichtbar, bevor sie wechselt.
- **SC-003**: Mindestens 90 % der Testnutzer können nach einem Preview-Wechsel die dargestellte Visualisierung und den fachlichen Importstatus korrekt benennen.
- **SC-004**: In 100 % der geprüften Abschluss- und Fehlerfälle stoppt die Preview-Rotation innerhalb von 100 Millisekunden nach dem Zustandswechsel.
- **SC-005**: Die gemessene Importdauer und die Anzahl der importierten GPS-Track-Einträge bleiben gegenüber dem vorherigen Verhalten unverändert.

## Assumptions

- Das bestehende Importmodal aus Feature 024 wird weiterverwendet.
- Das gewünschte Intervall wird mit 5 Sekunden festgelegt, damit Nutzer genug Zeit zum Erfassen haben und der Import dennoch lebendig bleibt.
- Der fachliche Status darf als separate, dezente Statuszeile oberhalb des Fortschrittsbalkens erscheinen; die Hauptheadline bleibt unverändert.
- Die Änderung betrifft nur Statusposition und Preview-Timing, nicht GPS-Datenmodell, FIT-Segmentierung oder Importzählung.
- Tests verwenden synthetische oder ausdrücklich bereitgestellte lokale Daten und keine privaten Rohdaten aus dem Repository.
