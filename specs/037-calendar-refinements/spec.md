# Feature Specification: Training Calendar Refinements

**Feature Branch**: `037-calendar-refinements`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "improvements: 1) the empty boxes should be much brighter to make much starker contrast to boxes with days that were active. 2) do not make a year filter but show all years below each other starting with the current year 3) give a filter possibility for colour scheme offer \"fire\" from yellow to red, \"blue\" and \"green\""

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Alle Trainingsjahre untereinander sehen (Priority: P1)

Als Athlet möchte ich alle Jahre meiner importierten Trainingsdaten gleichzeitig untereinander sehen, beginnend mit dem aktuellsten Jahr, damit ich Aktivitaetsmuster und Pausen ueber mehrere Jahre direkt vergleichen kann.

**Why this priority**: Die jahresuebergreifende Darstellung ist die zentrale gewuenschte Aenderung und ersetzt die bisherige Auswahl eines einzelnen Jahres.

**Independent Test**: Mit Daten aus mindestens drei Jahren wird die Kalenderansicht geoeffnet; fuer jedes vorhandene Jahr erscheint genau ein vollstaendiger Kalenderblock, der aktuellste zuerst, ohne Jahresauswahl als notwendige Bedienung.

**Acceptance Scenarios**:

1. **Given** importierte Trainingsdaten aus mehreren Jahren, **When** der Nutzer die Kalenderansicht oeffnet, **Then** werden alle Kalenderjahre vom neuesten bis zum aeltesten vorhandenen Jahr als getrennte Kalenderbloecke untereinander angezeigt, einschliesslich dazwischenliegender Jahre ohne Aktivitaeten.
2. **Given** ein Jahr ohne Aktivitaeten zwischen Jahren mit Aktivitaeten, **When** die Kalenderansicht angezeigt wird, **Then** bleibt dieses Jahr als vollstaendiger leerer Kalenderblock sichtbar.
3. **Given** importierte Daten aus nur einem Jahr, **When** die Kalenderansicht angezeigt wird, **Then** erscheint genau ein Kalenderblock ohne unnoetige Jahresauswahl.

### User Story 2 - Ruhetage klar von Aktivitaetstagen unterscheiden (Priority: P1)

Als Athlet möchte ich trainingsfreie Tage deutlich heller sehen als aktive Tage, damit Trainingspausen und Aktivitaetsmuster sofort erkennbar sind.

**Why this priority**: Der gewuenschte Kontrast verbessert die Lesbarkeit jeder Jahresansicht unmittelbar und ist fuer die Vergleichbarkeit mehrerer Jahre notwendig.

**Independent Test**: Mit einem Datensatz, der aktive und inaktive Tage enthaelt, werden beide Zelltypen gerendert; die leere Zelle hat einen deutlich helleren neutralen Farbwert als jede aktive Intensitaetsstufe.

**Acceptance Scenarios**:

1. **Given** ein Kalenderblock mit aktiven und inaktiven Tagen, **When** der Nutzer die Zellen betrachtet, **Then** sind inaktive Tage als helle neutrale Flaechen und aktive Tage als farbige Flaechen mit deutlich hoeherem Kontrast erkennbar.
2. **Given** ein Kalenderjahr ohne Aktivitaeten, **When** der Nutzer den Jahresblock betrachtet, **Then** bleiben alle Tagesfelder hell und die Legende erklaert den Zustand als keine Aktivitaet.
3. **Given** ein aktiver Tag mit der niedrigsten Intensitaet, **When** der Nutzer ihn mit einem leeren Tag vergleicht, **Then** bleiben beide Zustaende visuell eindeutig unterscheidbar.

### User Story 3 - Farbschema fuer die Kalenderdaten waehlen (Priority: P2)

Als Athlet möchte ich zwischen den Farbschemata Green, Blue und Fire waehlen, damit ich die Kalenderdarstellung an meine Vorlieben und die gewuenschte visuelle Aussage anpassen kann.

**Why this priority**: Farbschemata erweitern die Lesbarkeit und Personalisierung, sind aber nach der jahresuebergreifenden Darstellung und dem Grundkontrast nachgeordnet.

**Independent Test**: Mit einer Kalenderansicht kann der Nutzer jedes der drei Farbschemata auswaehlen; alle aktiven Intensitaetsstufen und die Legende wechseln konsistent, waehrend leere Tage hell und neutral bleiben.

**Acceptance Scenarios**:

1. **Given** die Kalenderansicht ist sichtbar, **When** der Nutzer Green auswaehlt, **Then** werden aktive Tage in einer gruenen Intensitaetsreihe und die Legende entsprechend dargestellt.
2. **Given** die Kalenderansicht ist sichtbar, **When** der Nutzer Blue auswaehlt, **Then** werden aktive Tage in einer blauen Intensitaetsreihe und die Legende entsprechend dargestellt.
3. **Given** die Kalenderansicht ist sichtbar, **When** der Nutzer Fire auswaehlt, **Then** werden aktive Tage von gelb fuer geringe bis rot fuer hohe Intensitaet dargestellt und die Legende entspricht dieser Reihenfolge.
4. **Given** ein Farbschema wurde gewaehlt, **When** der Nutzer zwischen Jahresbloecken oder Sportfiltern navigiert, **Then** bleibt das gewaehlte Farbschema konsistent angewendet.

### Edge Cases

- Die aktuelle Jahresansicht wird zuerst angezeigt, wenn das aktuelle Jahr im Datensatz vorhanden ist; andernfalls beginnt die Reihenfolge mit dem neuesten vorhandenen Jahr.
- Jahre mit Schaltjahren enthalten 366 echte Tagesfelder; alle anderen Jahre enthalten 365.
- Ein Jahr ohne qualifizierende Aktivitaeten bleibt sichtbar und zeigt ausschliesslich helle leere Tagesfelder sowie einen Leerzustand.
- Wenn keine Trainingsdaten importiert wurden, zeigt die Ansicht einen bestehenden oder neuen klaren Leerzustand statt leerer Farbschema-Steuerungen.
- Das Fire-Schema muss die Reihenfolge gelb -> orange -> rot wahrnehmbar einhalten; Blau und Gruen muessen ebenfalls eine zunehmende Intensitaet zeigen.
- Leere Tage behalten ihr neutrales helles Erscheinungsbild unabhaengig vom gewaehlten Farbschema.
- Die untereinander angeordneten Jahresbloecke bleiben auf schmalen Bildschirmen erreichbar; horizontales Scrollen darf keine Jahresueberschrift oder Tageszuordnung verschlucken.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Anwendung MUSS fuer jedes Kalenderjahr zwischen dem neuesten und dem aeltesten vorhandenen Aktivitaetsjahr einen eigenen vollstaendigen Kalenderblock darstellen, auch wenn ein Zwischenjahr keine Aktivitaeten enthaelt.
- **FR-002**: Die Anwendung MUSS die Kalenderbloecke absteigend nach Jahr sortieren und das aktuellste beziehungsweise neueste vorhandene Jahr zuerst darstellen.
- **FR-003**: Die Anwendung DARF keinen Jahresfilter voraussetzen, um zwischen den dargestellten Jahren zu wechseln; alle verfuegbaren Jahresbloecke MUESSEN gleichzeitig sichtbar oder erreichbar sein.
- **FR-004**: Die Anwendung MUSS trainingsfreie Tagesfelder in einem deutlich helleren neutralen Farbton darstellen als jede aktive Intensitaetsstufe.
- **FR-005**: Die Anwendung MUSS den hellen Zustand fuer trainingsfreie Tage in jedem Farbschema beibehalten.
- **FR-006**: Die Anwendung MUSS eine Farbschemaauswahl mit genau den Optionen Green, Blue und Fire anbieten.
- **FR-007**: Das Green-Schema MUSS fuenf zunehmende gruene Intensitaetsstufen fuer aktive Tage darstellen.
- **FR-008**: Das Blue-Schema MUSS fuenf zunehmende blaue Intensitaetsstufen fuer aktive Tage darstellen.
- **FR-009**: Das Fire-Schema MUSS fuenf zunehmende Intensitaetsstufen von Gelb ueber Orange bis Rot darstellen.
- **FR-010**: Die Anwendung MUSS die Legende bei jedem Farbschemawechsel aktualisieren und den hellen Zustand fuer keine Aktivitaet erklaeren.
- **FR-011**: Die Anwendung MUSS das gewaehlte Farbschema auf alle gleichzeitig dargestellten Jahresbloecke und deren Legenden anwenden.
- **FR-012**: Die Darstellung MUSS jeden Jahresblock auf Desktop- und schmalen Bildschirmbreiten bedienbar halten und die Datumszuordnung der Tagesfelder bewahren.
- **FR-013**: Die Anwendung MUSS die bestehende lokale Verarbeitung der Trainingsdaten und die vorhandenen Sportfilter beibehalten.

### Key Entities *(include if feature involves data)*

- **Jahresblock**: Ein vollstaendiger Kalender fuer ein vorhandenes Trainingsjahr, einschliesslich Jahresueberschrift und Tagesfeldern.
- **Leerer Tag**: Ein Tag ohne qualifizierende Aktivitaet mit hellem neutralem Erscheinungsbild unabhaengig vom Farbschema.
- **Aktiver Tag**: Ein Tag mit Trainingsdaten und einer Intensitaetsstufe von 1 bis 5.
- **Farbschema**: Eine Auswahl aus Green, Blue und Fire mit fuenf aktiven Intensitaetsstufen und einem gemeinsamen neutralen Leerzustand.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Bei Daten aus mindestens fuenf Jahren werden innerhalb von 2 Sekunden nach dem Oeffnen mindestens fuenf vollstaendige Jahresbloecke in der korrekten Reihenfolge sichtbar.
- **SC-002**: In 100 % der geprueften Farbschemata erreicht der gemessene relative Luminanzkontrast zwischen leeren Tagesfeldern und der niedrigsten aktiven Stufe mindestens 3:1; leere Tagesfelder muessen dabei heller bleiben.
- **SC-003**: 95 % der Testnutzer koennen in einem Datensatz mit aktiven und inaktiven Tagen innerhalb von 10 Sekunden einen leeren Zeitraum erkennen.
- **SC-004**: Nach jeder der drei Farbschemaauswahlen werden 100 % der sichtbaren aktiven Jahresbloecke und Legenden aktualisiert, ohne den gewaehlten Sportfilter oder die Tagesdetails zu verlieren.
- **SC-005**: In einem Datensatz mit mindestens drei Jahren bestaetigen 100 % der geprueften Jahresbloecke die korrekte Anzahl echter Tagesfelder: 365 oder 366 gemaess Kalenderjahr.
- **SC-006**: Die Farbschemaauswahl ist auf Desktop und schmalen Bildschirmbreiten erreichbar, ohne dass Jahresbloecke oder Tageszuordnungen unbedienbar werden.

## Assumptions

- Die bisherige einzelne Jahresauswahl wird fuer diese Visualisierung entfernt; die Jahresbloecke werden gemeinsam gerendert.
- Das aktuelle Jahr wird bevorzugt, wenn es Trainingsdaten enthaelt; bei fehlenden Daten beginnt die Darstellung mit dem neuesten vorhandenen Jahr. Alle Kalenderjahre bis zum aeltesten vorhandenen Aktivitaetsjahr bleiben als vollstaendige Bloecke sichtbar.
- Green bleibt das Standardschema, damit bestehende Nutzer eine vertraute Darstellung erhalten.
- Das Farbschema gilt fuer aktive Tagesfelder aller vorhandenen Sportfilter; Sportfilter selbst bleiben unveraendert.
- Die Farbschemaauswahl gilt fuer die aktuelle Browser-Sitzung und muss nicht dauerhaft gespeichert werden.
- Die neutrale helle Farbe fuer leere Tage ist in allen drei Schemata identisch.
