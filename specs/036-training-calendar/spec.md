# Feature Specification: Training Calendar View

**Feature Branch**: `036-training-calendar`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "neue visualisierung: Kalendersicht Trainings (wie github im screenshot anbei)"

## Clarifications

### Session 2026-09-24

- Q: Welche Trainingsmenge soll die Farbintensitaet eines Tages primaer bestimmen? → A: Trainingszeit, sonst Distanz, sonst Einheitenanzahl.
- Q: Wie soll die Kalenderansicht Aktivitäten behandeln, die keiner der Sportarten Run, Bike oder Swim entsprechen? → A: Als eigene, filterbare Kategorie "Other" anzeigen.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Jahreskalender der Trainingstage (Priority: P1)

Als Athlet möchte ich meine Trainingsaktivitaet als Jahreskalender im Stil einer Contribution-Heatmap sehen, damit ich Regelmaessigkeit, Pausen und konzentrierte Trainingsphasen auf einen Blick erkenne.

**Why this priority**: Die Kalenderansicht ist der Kern der angeforderten Visualisierung und liefert unmittelbar einen neuen Blick auf die vorhandenen Trainingsdaten.

**Independent Test**: Mit einem importierten Datensatz und mindestens zwei Trainings an unterschiedlichen Tagen laesst sich eine Jahresansicht oeffnen; jeder Trainingstag erscheint als eingefaerbtes Tagesfeld und trainingsfreie Tage bleiben als leere Felder erkennbar.

**Acceptance Scenarios**:

1. **Given** importierte Trainingsdaten aus mindestens einem Kalenderjahr, **When** der Nutzer die Kalenderansicht oeffnet, **Then** wird ein Kalender fuer das ausgewaehlte Jahr mit Wochenstruktur, Monatsbezeichnungen und Wochentagen angezeigt.
2. **Given** ein Tag mit einer oder mehreren Trainingseinheiten, **When** der Nutzer das Tagesfeld betrachtet, **Then** zeigt die Farbintensitaet die Trainingsmenge dieses Tages relativ zur dargestellten Jahresansicht.
3. **Given** ein Tag ohne Training, **When** der Nutzer das Tagesfeld betrachtet, **Then** bleibt das Feld als trainingsfreier Tag sichtbar und wird nicht mit einem Training verwechselt.

### User Story 2 - Tagesdetails und Sportarten unterscheiden (Priority: P2)

Als Athlet möchte ich die Details eines Tages und die beteiligten Sportarten sehen, damit ich nicht nur Trainingshaeufigkeit, sondern auch die Zusammensetzung meines Trainings nachvollziehen kann.

**Why this priority**: Detailinformationen machen die Farbmatrix fuer konkrete Trainingsentscheidungen nutzbar und erhalten die Bedeutung der bestehenden Run-, Bike- und Swim-Daten.

**Independent Test**: Mit einem Tag, der mehrere Sportarten oder Einheiten enthaelt, kann der Nutzer das Tagesfeld auswaehlen oder mit der Maus darauf zeigen und erhaelt Datum, Anzahl der Einheiten, Sportarten sowie aggregierte Distanz und Trainingszeit.

**Acceptance Scenarios**:

1. **Given** ein Tagesfeld mit Training, **When** der Nutzer es auswaehlt oder mit der Maus darauf zeigt, **Then** werden Datum, Einheitenanzahl, Sportarten und die verfuegbaren Summen fuer Distanz und Trainingszeit angezeigt.
2. **Given** ein Tag mit mehreren Sportarten, **When** die Tagesdetails angezeigt werden, **Then** werden die Sportarten getrennt und eindeutig erkennbar dargestellt.
3. **Given** ein Tag mit fehlender Distanz oder Zeit in einzelnen Importdaten, **When** die Tagesdetails angezeigt werden, **Then** wird die verfuegbare Information gezeigt, ohne fehlende Werte als null oder erfundene Werte auszugeben.

### User Story 3 - Jahre wechseln und Ansicht filtern (Priority: P3)

Als Athlet möchte ich zwischen verfuegbaren Jahren und den vorhandenen Sportarten wechseln, damit ich Trainingsmuster vergleichen kann, ohne die Daten erneut zu importieren.

**Why this priority**: Zeit- und Sportfilter erweitern den Nutzen der Jahresmatrix, sind aber fuer die erste sichtbare Kalenderdarstellung nicht zwingend erforderlich.

**Independent Test**: Mit Daten aus mehreren Jahren und Sportarten kann der Nutzer ein anderes Jahr sowie eine verfuegbare Sportart waehlen; die Matrix und die Zusammenfassung aktualisieren sich und zeigen nur die passende Teilmenge.

**Acceptance Scenarios**:

1. **Given** Trainingsdaten aus mehreren Jahren, **When** der Nutzer ein anderes Jahr waehlt, **Then** wird die Matrix fuer dieses Jahr mit dessen Trainingsdaten neu aufgebaut.
2. **Given** Trainingsdaten fuer mehrere unterstuetzte Sportarten, **When** der Nutzer eine Sportart filtert, **Then** werden nur Trainingseinheiten dieser Sportart in Intensitaet und Tagesdetails beruecksichtigt.
3. **Given** nur eine vorhandene Sportart, **When** der Nutzer die Filter betrachtet, **Then** bleibt die Ansicht verstaendlich und bietet keine wirkungslosen Sportfilter an.

### Edge Cases

- Ein Jahr ohne Training wird als vollstaendige, leere Jahresmatrix mit einer klaren Leerzustandsmeldung angezeigt.
- Trainings am Jahreswechsel werden dem korrekten Kalenderjahr ihres lokalen Datums zugeordnet.
- Mehrere Einheiten am selben Tag werden zu einem Tageswert zusammengefasst, ohne Einheiten zu verlieren.
- Ein Datensatz mit Einheiten ausserhalb von Run, Bike und Swim wird nicht stillschweigend einer dieser Sportarten zugeordnet; solche Einheiten werden als filterbare Kategorie "Other" kenntlich gemacht.
- Sehr grosse Datensaetze duerfen die Seite nicht unbedienbar machen; die Darstellung bleibt waehrend des Wechsels von Jahr oder Filter responsiv.
- Auf schmalen Bildschirmen bleibt jedes Tagesfeld erreichbar und die Monats- und Tagesorientierung erhalten, auch wenn die Matrix horizontal scrollen muss.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Anwendung MUSS eine Kalenderansicht mit einem Tagesfeld fuer jeden Tag des ausgewaehlten Jahres darstellen.
- **FR-002**: Die Anwendung MUSS Wochenbeginn, Monatsgrenzen und Wochentage so kennzeichnen, dass ein Nutzer jedes Tagesfeld zeitlich zuordnen kann.
- **FR-003**: Die Anwendung MUSS die Trainingsmenge je Tag aus den importierten Einheiten aggregieren und dabei primaer die Trainingszeit, ersatzweise die Distanz und zuletzt die Einheitenanzahl verwenden; sie MUSS fuenf positive, eindeutig unterscheidbare Intensitaetsstufen sowie eine separate Stufe 0 fuer keine Aktivitaet darstellen.
- **FR-004**: Die Anwendung MUSS eine Legende anzeigen, die Trainingsfreiheit und die Intensitaetsstufen erklaert.
- **FR-005**: Die Anwendung MUSS fuer einen Trainingstag Datum, Anzahl der Einheiten und die verfuegbaren aggregierten Werte fuer Distanz und Trainingszeit anzeigen, wenn der Nutzer das Tagesfeld betrachtet oder auswaehlt.
- **FR-006**: Die Anwendung MUSS mehrere Einheiten am gleichen Tag zusammenfassen und dabei alle Einheiten sowie ihre Sportarten beruecksichtigen.
- **FR-007**: Die Anwendung MUSS die unterstuetzten Sportarten Run, Bike und Swim sowie nicht zuordenbare Aktivitaeten als "Other" getrennt erkennbar machen, wenn ein Tag mehrere Sportarten enthaelt.
- **FR-008**: Die Anwendung MUSS zwischen allen Jahren wechseln koennen, fuer die importierte Trainingsdaten vorliegen, und beim Wechsel die gesamte Kalenderansicht aktualisieren.
- **FR-009**: Die Anwendung MUSS einen Sportfilter fuer vorhandene Sportarten einschliesslich "Other" anbieten und die Tageswerte sowie Tagesdetails entsprechend neu berechnen.
- **FR-010**: Die Anwendung MUSS einen nachvollziehbaren Leerzustand anzeigen, wenn keine Trainingsdaten oder keine Trainingsdaten fuer den gewaehlten Filter vorliegen.
- **FR-011**: Die Anwendung MUSS die lokale Verarbeitung der importierten Trainingsdaten beibehalten; fuer diese Visualisierung duerfen keine Rohdaten an einen externen Dienst gesendet werden.
- **FR-012**: Die Darstellung MUSS auf Desktop- und schmalen Bildschirmbreiten bedienbar bleiben, ohne Tagesfelder oder ihre Datumszuordnung unzugaenglich zu machen.

### Key Entities *(include if feature involves data)*

- **Kalenderjahr**: Ein ausgewaehltes Jahr mit allen Kalendertagen und der zugehoerigen Trainingszusammenfassung.
- **Trainingstag**: Die Zusammenfassung eines Datums mit Einheitenanzahl, Trainingsmenge, Distanz, Trainingszeit und beteiligten Sportarten.
- **Trainingseinheit**: Eine importierte Aktivitaet mit Datum, Sportart und den verfuegbaren Messwerten.
- **Sportfilter**: Eine Auswahl der angezeigten Sportart oder aller vorhandenen Sportarten.
- **Intensitaetsstufe**: Eine relative Kategorie, die die Trainingsmenge eines Tages innerhalb der aktuellen Jahres- und Filterauswahl beschreibt.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In einem Datensatz mit bis zu 10.000 Trainingseinheiten erscheint die erste Kalenderansicht innerhalb von 2 Sekunden nach Abschluss des Imports.
- **SC-002**: Mindestens 95 % der Testnutzer koennen in einem Usability-Test innerhalb von 30 Sekunden den trainingsreichsten Tag und einen trainingsfreien Zeitraum im ausgewaehlten Jahr identifizieren.
- **SC-003**: Bei einem Datensatz mit mehreren Jahren aktualisiert sich die Ansicht nach einem Jahreswechsel innerhalb von 1 Sekunde und zeigt keine Daten des zuvor ausgewaehlten Jahres mehr.
- **SC-004**: Bei einem Datensatz mit mindestens zwei Sportarten stimmen die angezeigten Tages- und Jahreswerte in 100 % der geprueften Faelle mit einer unabhaengigen Aggregation der importierten Einheiten ueberein.
- **SC-005**: Die Kalenderansicht bleibt auf einer schmalen Bildschirmbreite bedienbar; 100 % der Tagesfelder koennen erreicht und eindeutig einem Datum zugeordnet werden.
- **SC-006**: In einem qualitativen Test bewerten mindestens 80 % der Nutzer die Ansicht als geeignet, um Trainingsregelmaessigkeit und Pausen schneller zu erkennen als in einer reinen Liste.

## Assumptions

- Die Kalenderansicht wird als zusaetzliche Visualisierung in den bestehenden Dashboard-Navigationsfluss integriert.
- Die fuer die Intensitaetsstufen verwendete Trainingsmenge wird aus Trainingszeit und, falls diese fehlt, aus Distanz oder Einheitenanzahl abgeleitet.
- Datumswerte werden fuer die Kalenderzuordnung in der lokalen Zeitzone des Nutzers interpretiert.
- Die v1 benoetigt keine Bearbeitung, Loeschung oder manuelle Erfassung von Trainingseinheiten.
- Die Jahresauswahl zeigt nur Jahre, die im aktuell importierten Datensatz vorkommen; ein leerer Zustand deckt fehlende Daten ab.
- Das Erscheinungsbild orientiert sich an einer Contribution-Heatmap: kompakte Tagesfelder, Monatsbeschriftungen, Intensitaetslegende und klare Aktivitaetsdetails, ohne die Trainingsdaten auf GitHub-Beitraege umzudeuten.
