# Feature Specification: Training Calendar Transparency and Export

**Feature Branch**: `039-calendar-export`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "1) the days without any activity should be even more light. maybe make them 50% transparent so they merge with the background 2) also implement the export button on this feature."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ruhetage dezent darstellen (Priority: P1)

Als Athlet möchte ich Tage ohne Aktivitaet noch unaufdringlicher sehen, damit aktive Trainingstage und Trainingspausen klar bleiben, ohne dass die leeren Felder die Kalenderflaeche dominieren.

**Why this priority**: Die visuelle Hierarchie der Kalenderansicht wird direkt durch die Darstellung der vielen inaktiven Tage bestimmt.

**Independent Test**: Mit aktiven und leeren Tagen wird die Kalenderansicht geoeffnet; leere Tagesfelder sind deutlich transparenter beziehungsweise heller als aktive Felder und verschmelzen optisch mit dem Kalenderhintergrund.

**Acceptance Scenarios**:

1. **Given** aktive und leere Tagesfelder sind sichtbar, **When** der Nutzer die Kalenderansicht betrachtet, **Then** erscheinen leere Felder mit etwa 50 % Transparenz und dominieren die Darstellung nicht.
2. **Given** Green, Blue oder Fire ist ausgewaehlt, **When** die Kalenderansicht gerendert wird, **Then** bleibt die transparente Darstellung leerer Tage in allen Farbschemata erhalten.
3. **Given** ein leerer Tag grenzt an einen aktiven Tag der niedrigsten Intensitaet, **When** beide Felder betrachtet werden, **Then** bleibt der aktive Tag eindeutig sichtbar und der leere Tag dezent.

### User Story 2 - Kalenderansicht exportieren (Priority: P1)

Als Athlet möchte ich die vollstaendige Kalenderansicht exportieren, damit ich meine jahresuebergreifenden Trainingsmuster mit Farbschema, Sportfilter und Tageskontext als Bild teilen oder speichern kann.

**Why this priority**: Der Kalender ist eine eigenstaendige Visualisierung; ohne funktionierenden Export fehlt ein wichtiger Teil des bestehenden Export-Workflows.

**Independent Test**: Mit importierten Daten aus mehreren Jahren wird der Exportbutton betaetigt; ein Bild der Kalenderansicht wird erzeugt und enthaelt die sichtbaren Jahresbloecke, das aktive Farbschema und den aktiven Sportfilter.

**Acceptance Scenarios**:

1. **Given** importierte Trainingsdaten und eine sichtbare Kalenderansicht, **When** der Nutzer den Exportbutton betaetigt, **Then** wird die Kalenderansicht im bestehenden Ablauf als Bildvorschau geoeffnet und kann daraus heruntergeladen werden.
2. **Given** mehrere Jahresbloecke, **When** der Export ausgefuehrt wird, **Then** enthaelt das Ergebnis alle sichtbaren Jahresbloecke in ihrer aktuellen Reihenfolge.
3. **Given** ein Farbschema und Sportfilter wurden gewaehlt, **When** der Export ausgefuehrt wird, **Then** verwendet das Ergebnis genau diese Auswahl.
4. **Given** es sind keine Trainingsdaten vorhanden, **When** der Nutzer den Exportbutton betrachtet, **Then** ist der Export deaktiviert oder zeigt eine klare Erklaerung, statt ein leeres oder fehlerhaftes Bild zu erzeugen.
5. **Given** Tooltipdetails sind gerade sichtbar, **When** der Export ausgefuehrt wird, **Then** werden keine schwebenden Tooltip-Overlays in das exportierte Ergebnis aufgenommen.

### Edge Cases

- Ein Jahr ohne Aktivitaeten bleibt im Export als vollstaendiger, transparenter Kalenderblock erhalten.
- Ein Export mit vielen Jahresbloecken darf nicht durch die Hoehe des Kalenderinhalts abgeschnitten werden.
- Der Export darf keine persoenlichen Rohdaten oder Netzwerkantworten ausserhalb der sichtbaren Kalenderinformationen enthalten.
- Ein Exportfehler zeigt eine verstaendliche Fehlermeldung und laesst die Kalenderansicht unveraendert.
- Exportierte Leerzellen bleiben transparent beziehungsweise hintergrundnah, waehrend aktive Farben sichtbar bleiben.
- Der Exportbutton bleibt auf schmalen Bildschirmen erreichbar und darf die Jahresblöcke nicht verdecken.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Anwendung MUSS leere Tagesfelder mit einem festen RGBA-Farbwert mit 50 % Alpha (`rgba(241,245,249,0.5)`) darstellen.
- **FR-002**: Die Anwendung MUSS die Transparenz leerer Tagesfelder in Green, Blue und Fire gleichermassen anwenden.
- **FR-003**: Die Anwendung MUSS einen Exportbutton fuer die Training Calendar-Visualisierung anzeigen, wenn Trainingsdaten vorhanden sind.
- **FR-004**: Der Export MUSS alle sichtbaren Jahresbloecke in ihrer aktuellen Reihenfolge und mit ihren aktuellen Tagesfeldern enthalten.
- **FR-005**: Der Export MUSS das aktive Farbschema und den aktiven Sportfilter der Kalenderansicht abbilden.
- **FR-006**: Der Export DARF keine sichtbaren Tooltip-Overlays oder schwebenden Detail-Layer in das Ergebnis aufnehmen.
- **FR-007**: Die Anwendung MUSS bei fehlenden Trainingsdaten den Export verhindern oder einen verständlichen Leerzustand anzeigen.
- **FR-008**: Die Anwendung MUSS Exportfehler verständlich anzeigen, ohne die Kalenderansicht zu beschädigen.
- **FR-009**: Der Export MUSS auf Desktop- und schmalen Bildschirmbreiten erreichbar bleiben.
- **FR-010**: Die bestehende lokale Verarbeitung der Trainingsdaten, Mehrjahresdarstellung, Farbschemaauswahl, Sportfilter und lokalen Tooltips MUSS erhalten bleiben.

### Key Entities *(include if feature involves data)*

- **Kalenderexport**: Ein Bild der sichtbaren Kalenderansicht mit Jahresblöcken, Tagesfeldern, Legende und aktiven Filter-/Farbschemaangaben.
- **Exportstatus**: Der Zustand bereit, in Bearbeitung, erfolgreich oder fehlgeschlagen.
- **Transparenter Ruhetag**: Ein leerer Tag, der im Export und in der Ansicht etwa 50 % transparent beziehungsweise hintergrundnah erscheint.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100 % der geprüften Farbschemata verwenden leere Tagesfelder `rgba(241,245,249,0.5)` und unterscheiden sich visuell klar von aktiven Tagesfeldern.
- **SC-002**: Bei Daten aus mindestens drei Jahren enthält 100 % der geprüften Exportbilder alle sichtbaren Jahresblöcke in korrekter Reihenfolge.
- **SC-003**: In 100 % der geprüften Exporte stimmen Farbschema und Sportfilter mit der zum Exportzeitpunkt sichtbaren Auswahl überein.
- **SC-004**: In 100 % der geprüften Exporte sind keine Tooltip-Overlays oder temporären Detail-Layer sichtbar.
- **SC-005**: 95 % der Testnutzer können den Kalenderexport auf Desktop und schmalen Bildschirmen innerhalb von 10 Sekunden auslösen.
- **SC-006**: Bei einem Export mit bis zu zehn Jahresblöcken wird kein Jahresblock oder aktives Tagesfeld abgeschnitten.

## Assumptions

- Der Export nutzt den bestehenden Bildexport-Workflow der Anwendung und ergänzt keinen separaten Serverdienst.
- Der Exportbutton befindet sich im Header der Training Calendar-Ansicht und folgt dem bestehenden Exportmuster anderer Visualisierungen.
- Exportiert wird die Kalenderansicht ohne offene Tooltip-Overlays; die Tagesfelder, Jahresüberschriften, Legende und aktiven Filter bleiben erhalten.
- Die Transparenz leerer Tage wird als Darstellungseigenschaft umgesetzt, die sowohl in der normalen Ansicht als auch im Export nachvollziehbar bleibt.
- Der Export benötigt keine dauerhafte Speicherung und sendet keine Rohdaten an einen externen Dienst.
