# Feature Specification: Remove Empty-Day Calendar Outlines

**Feature Branch**: `042-remove-empty-day-outline`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "calendar: remove white outline on the \"no training\" day boxes"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trainingsfreie Kalendertage ohne helle Kontur sehen (Priority: P1)

Als Athlet möchte ich trainingsfreie Tagesfelder ohne weisse beziehungsweise helle Umrandung sehen, damit die Kalenderansicht ruhiger wirkt und die Felder nicht wie hervorgehoben erscheinen.

**Why this priority**: Die Kontur fällt in der kompakten Kalenderansicht um jedes trainingsfreie Feld auf und beeinträchtigt unmittelbar deren gewünschtes neutrales Erscheinungsbild.

**Independent Test**: Eine Kalenderansicht mit trainingsfreien und aktiven Tagen wird angezeigt; alle trainingsfreien Tagesfelder erscheinen ohne sichtbare weisse oder helle Kontur, während aktive Tagesfelder und deren Farben unverändert bleiben.

**Acceptance Scenarios**:

1. **Given** ein angezeigtes Kalenderjahr enthält trainingsfreie Tage, **When** der Nutzer die Felder betrachtet, **Then** haben diese Tagesfelder keine sichtbare weisse oder helle Umrandung.
2. **Given** ein Kalender enthält aktive und trainingsfreie Tage, **When** beide Feldtypen angezeigt werden, **Then** bleiben Füllfarbe, Intensitätsstufen und Darstellung aktiver Tage unverändert.
3. **Given** mehrere Jahre, Farbschemata oder Sportfilter sind verfügbar, **When** der Nutzer zwischen ihnen wechselt, **Then** bleiben trainingsfreie Tagesfelder in allen angezeigten Kalenderblöcken ohne weisse oder helle Kontur.

### Edge Cases

- Ein vollständig trainingsfreies Jahr zeigt alle datumsbezogenen Tagesfelder ohne die Kontur; Monats- und Jahresbeschriftungen bleiben unverändert.
- Ein Filter, unter dem ein zuvor aktiver Tag trainingsfrei wird, zeigt diesen Tag ebenfalls ohne helle Kontur.
- Leere Rasterabstände, die keinem Datum entsprechen, sind keine Tagesfelder und müssen nicht eigens gestaltet werden.
- Die neutralen Füllfarben trainingsfreier Tage sowie die Konturen oder Rahmen anderer Kalenderelemente sind nicht Teil dieser Änderung.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Anwendung MUSS die sichtbare weisse oder helle Umrandung an jedem datumsbezogenen Tagesfeld ohne Training entfernen.
- **FR-002**: Die Anwendung MUSS dieses Erscheinungsbild für trainingsfreie Tagesfelder in allen angezeigten Kalenderjahren, verfügbaren Farbschemata und Sportfilterzuständen beibehalten.
- **FR-003**: Die Anwendung MUSS Füllfarbe, Intensitätsdarstellung und Bedienbarkeit aktiver Tagesfelder sowie die neutrale Füllfarbe und Kalenderanordnung unverändert erhalten.
- **FR-004**: Die Anwendung MUSS Monats- und Jahresbeschriftungen sowie Rahmen anderer Kalenderelemente unverändert lassen.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100 % der geprüften Kalenderansichten sind datumsbezogene Felder ohne Training frei von sichtbaren weissen oder hellen Umrandungen.
- **SC-002**: In 100 % der geprüften Kombinationen aus Kalenderjahr, Farbschema und Sportfilter bleibt die Umrandung trainingsfreier Tagesfelder entfernt.
- **SC-003**: In 100 % der geprüften Fälle bleiben aktive Tagesfelder, ihre Intensitätsstufen und ihre Bedienbarkeit unverändert.
- **SC-004**: Mindestens 95 % der Testnutzer können in einer Ansicht mit aktiven und trainingsfreien Tagen die beiden Zustände weiterhin korrekt unterscheiden.

## Assumptions

- „No training“-Felder sind datumsbezogene Tagesfelder, die im aktuell angezeigten Sportfilter keine Aktivität enthalten.
- Die bestehende neutrale Füllfarbe und die Position sowie Grösse der Tagesfelder bleiben erhalten; nur deren helle Umrandung wird entfernt.
- Die Änderung betrifft weder die Legende noch Jahresblock-Rahmen oder sonstige dekorative Elemente ausserhalb der trainingsfreien Tagesfelder.
