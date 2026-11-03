# Feature Specification: Hide Media Activity Filter

**Feature Branch**: `077-hide-media-activity-filter`

**Created**: 2026-11-03

**Status**: Draft

**Input**: User description: "in visualization Media: do not show filter 'activity'"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Media ohne Aktivitätsfilter durchsuchen (Priority: P1)

Nutzer möchten die Media-Visualisierung öffnen und Medien ohne einen separaten Filter für Aktivitäten durchsuchen. Die Filter für Jahr und Sportart bleiben verfügbar; vorhandener Aktivitätskontext eines Mediums bleibt sichtbar.

**Why this priority**: Das Entfernen des nicht gewünschten Filters vereinfacht die Media-Ansicht, ohne die übrige Suche oder den Kontext der Medien zu verlieren.

**Independent Test**: Die Media-Ansicht mit einem importierten Medienbestand öffnen und prüfen, dass kein Activity-Filter angezeigt wird, Jahr- und Sportfilter jedoch weiterhin Medien eingrenzen und Aktivitätsdetails zugeordneten Medien weiterhin zugänglich sind.

**Acceptance Scenarios**:

1. **Given** die Media-Ansicht ist mit importierten Medien geöffnet, **When** die verfügbaren Filter angezeigt werden, **Then** gibt es keinen Filter für Activity.
2. **Given** die Media-Ansicht enthält Medien aus mehreren Jahren und Sportarten, **When** Jahr oder Sportart gefiltert wird, **Then** werden weiterhin nur passende Medien angezeigt.
3. **Given** ein Medium ist einer Aktivität zugeordnet, **When** der Nutzer dessen Kontext betrachtet, **Then** bleiben die zugehörigen Aktivitätsinformationen zugänglich, ohne einen Activity-Filter anzubieten.
4. **Given** ein zugeordnetes Medium verfügt über Routendaten, **When** der Nutzer einen Jahresrückblick oder eine Collage exportiert, **Then** enthält die exportierte Ansicht keine Route und es gibt keine Option, Routen einzublenden.
5. **Given** ein Jahresrückblick oder eine Collage wurde erfolgreich vorbereitet, **When** die Vorschau geöffnet wird, **Then** erscheint keine zusätzliche Statusmeldung „ready for local preview. Review it before downloading.“
6. **Given** Medien werden in der Galerie angezeigt, **When** der Nutzer die Kacheln durchsucht, **Then** werden keine Pin-Icons oder manuellen Select-Checkboxen angeboten und ein Klick auf eine Kachel öffnet weiterhin die Medienvorschau.
7. **Given** eine Collage wird aus der Galerie erstellt, **When** Jahr- oder Sportfilter aktiv sind, **Then** enthält die Collage alle passenden lesbaren Medien und keine manuell ausgewählte Teilmenge.

### Edge Cases

- Die Media-Ansicht enthält keine Medien; auch im leeren Zustand wird kein Activity-Filter angezeigt.
- Ein Medienbestand enthält sowohl zugeordnete als auch nicht zugeordnete Medien; die Filterentfernung macht keine Medien unauffindbar und ändert deren Zuordnungsstatus nicht.
- Jahr- oder Sportfilter liefern keine Treffer; der leere Ergebniszustand bleibt verständlich und die verfügbaren Filter bleiben nutzbar.
- Ein zugeordnetes Medium hat eine Route; Aktivitätsdetails und Routennavigation bleiben erreichbar, aber Recap- und Collage-Exporte enthalten keine Routen.
- Ein Recap oder eine Collage wird erfolgreich vorbereitet; die Vorschau wird geöffnet, ohne eine zusätzliche Meldung über die lokale Vorschau anzuzeigen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Media-Visualisierung MUST keinen Filter zur Auswahl einer Aktivität anzeigen.
- **FR-002**: Die Media-Visualisierung MUST die bestehenden Filter für Jahr und Sportart weiterhin anbieten und deren Filterverhalten beibehalten.
- **FR-003**: Das Entfernen des Activity-Filters MUST die Aktivitätszuordnungen von Medien und den Zugriff auf zugehörige Aktivitätsinformationen unverändert lassen.
- **FR-004**: Medien, die keiner Aktivität zugeordnet sind, MUST weiterhin in der Media-Visualisierung auffindbar bleiben.
- **FR-005**: Der Activity-Filter MUST auch bei leeren Ergebnissen oder leeren Medienbeständen nicht angezeigt werden.
- **FR-006**: Die Media-Visualisierung MUST keine Option zum Einblenden sichtbarer Routen in Recap- oder Collage-Exporten anbieten; diese Exporte MUST Routen ausschließen.
- **FR-007**: Nach erfolgreicher Vorbereitung eines Recaps oder einer Collage MUST die Vorschau weiterhin geöffnet werden, ohne die zusätzliche Statusmeldung „ready for local preview. Review it before downloading.“ anzuzeigen.
- **FR-008**: Die Media-Galerie MUST keine Pin-Icons oder manuellen Select-Checkboxen pro Medium anbieten. Das Öffnen eines Mediums durch Auswahl seiner Kachel MUST weiterhin möglich sein.
- **FR-009**: Eine Collage MUST aus den lesbaren Medien erstellt werden, die den aktuell gewählten Jahr- und Sportfiltern entsprechen; eine manuelle Medienauswahl MUST nicht erforderlich sein.

### Key Entities *(include if feature involves data)*

- **Medium**: Ein in der Media-Visualisierung dargestelltes Foto oder Video, das einer Aktivität zugeordnet sein kann oder nicht.
- **Aktivität**: Der Trainingskontext, der für ein zugeordnetes Medium weiterhin erreichbar bleibt, aber nicht mehr als Filteroption in der Media-Ansicht angeboten wird.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100 % der geprüften Media-Ansichten wird kein Activity-Filter angezeigt, einschließlich leerer und gefilterter Ergebnisse.
- **SC-002**: Jahr- und Sportfilter schränken Medien weiterhin korrekt auf die gewählten Kriterien ein.
- **SC-003**: Nutzer können Aktivitätsinformationen zu weiterhin zugeordneten Medien erreichen; die Änderung erzeugt oder entfernt keine Medienzuordnungen.
- **SC-004**: Zugeordnete und nicht zugeordnete Medien bleiben in den passenden Ansichten auffindbar.
- **SC-005**: In 100 % der geprüften Media-Recap- und Collage-Exporte sind keine Routen eingebettet und es wird keine Routen-Opt-in-Option angezeigt.
- **SC-006**: Nach erfolgreicher Exportvorbereitung öffnet sich die Vorschau; die zusätzliche Statusmeldung „ready for local preview“ erscheint nicht.
- **SC-007**: In 100 % der geprüften Media-Kacheln sind keine Pin- oder Select-Steuerelemente vorhanden; ein Kachelklick öffnet weiterhin die Vorschau.
- **SC-008**: Eine Collage enthält alle passenden lesbaren Medien des aktiven Jahr-/Sportfilters, ohne manuelle Auswahl.

## Assumptions

- Die Anforderung betrifft ausschließlich den sichtbaren Activity-Filter der Media-Visualisierung.
- Die übrigen Media-Filter und die Anzeige beziehungsweise Navigation zu Aktivitätsinformationen sollen bestehen bleiben.
- Aktivitätsdetails und Routennavigation aus einem Medium bleiben verfügbar; nur die Einbettung von Routen in exportierte Bilder und ihre Opt-in-Steuerung entfallen.
- Die Exportvorschau selbst bleibt die sichtbare Rückmeldung nach erfolgreicher Vorbereitung; eine zusätzliche Erfolgsstatusmeldung ist nicht erforderlich.
- „Pin icons“ bezeichnet die Pin-Detail-Schaltflächen in der Media-Galerie; diese Änderung betrifft nicht Pin-/Inspect-Interaktionen anderer Visualisierungen.
- Collagen verwenden die aktuelle Filteransicht statt einer manuellen Auswahl einzelner Kacheln.
- Die bestehende Media-Galerie und ihre importierten Daten bleiben unverändert; eine Änderung des Datenmodells ist nicht Teil dieser Anforderung.