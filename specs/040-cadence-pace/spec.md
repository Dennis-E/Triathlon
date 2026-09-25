# Feature Specification: Cadence versus Pace Visualization

**Feature Branch**: `040-cadence-pace`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "a new visualization for cadence. show cadence vs pace. for run the steps/cadence, for bike please do research if such strava data has data on cadence (my example data i think does not have it, but others might have if this is measured) and in swimming do research if there is some stroke rythm in such data potentially that could be used."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Laufkadenz und Pace vergleichen (Priority: P1)

Als Athlet moechte ich die Schrittfrequenz und Pace meiner Laeufe gemeinsam betrachten, damit ich erkenne, wie sich mein Laufrhythmus bei unterschiedlichen Geschwindigkeiten verhaelt.

**Why this priority**: Die vorhandenen Exportdaten liefern fuer viele Laufaktivitaeten Kadenz und Pace; dies ist der unmittelbar nutzbare Kern der Visualisierung.

**Independent Test**: Ein Export mit Laufaktivitaeten, die jeweils Kadenz und Geschwindigkeit enthalten, wird importiert. Die Ansicht zeigt pro qualifizierter Aktivitaet einen Datenpunkt mit Kadenz und Pace sowie die Schrittzahl, wenn sie vorhanden ist.

**Acceptance Scenarios**:

1. **Given** importierte Laufaktivitaeten mit Kadenz und Pace, **When** der Athlet die Kadenzansicht oeffnet, **Then** kann er die Beziehung zwischen Schrittfrequenz und Pace fuer jede qualifizierte Aktivitaet sehen.
2. **Given** ein Laufpunkt mit gemeldeten Gesamtschritten, **When** der Athlet dessen Details aufruft, **Then** werden die Gesamtschritte zusammen mit Kadenz und Pace angezeigt.
3. **Given** Laufaktivitaeten ohne Kadenz oder ohne Pace, **When** die Ansicht erstellt wird, **Then** werden diese Aktivitaeten nicht als scheinbare Nullwerte dargestellt.

---

### User Story 2 - Radkadenz und Geschwindigkeit vergleichen (Priority: P2)

Als Athlet moechte ich, falls mein Radcomputer Kadenz aufgezeichnet hat, meine Trittfrequenz und Pace beziehungsweise Geschwindigkeit vergleichen, damit ich meine Trittfrequenz im Kontext des Fahrtempos beurteilen kann.

**Why this priority**: Strava unterstuetzt Kadenz fuer Radaktivitaeten, sie ist jedoch von Sensor und Aufzeichnung abhaengig und darf nur gezeigt werden, wenn sie im Export vorhanden ist.

**Independent Test**: Ein Export mit mindestens zwei Radaktivitaeten mit Kadenz und Geschwindigkeit wird importiert. Nach Auswahl von Rad werden nur diese Aktivitaeten mit einer pedalbezogenen Kadenzbeschriftung angezeigt.

**Acceptance Scenarios**:

1. **Given** Radaktivitaeten mit Kadenz und Geschwindigkeit, **When** der Athlet Rad auswaehlt, **Then** zeigt die Ansicht deren Pedalkadenz im Verhaeltnis zur Pace beziehungsweise Geschwindigkeit.
2. **Given** ein Export ohne qualifizierte Radkadenz, **When** der Athlet Rad auswaehlt, **Then** zeigt die Ansicht einen erklaerenden Leerzustand statt erfundener Werte.

---

### User Story 3 - Schwimmrhythmus nutzen, wenn gemessen (Priority: P3)

Als Athlet moechte ich bei Schwimmaktivitaeten einen vom Geraet gemeldeten Rhythmus zusammen mit der Schwimmpace sehen, damit ich dessen Zusammenhang mit meinem Tempo untersuchen kann, ohne dass die Anwendung ungesicherte Aussagen ueber die Messart trifft.

**Why this priority**: Die Beispielsdaten enthalten fuer einen Teil der Schwimmaktivitaeten Kadenzwerte. Die Bedeutung kann jedoch je nach Uhr, Plattform und Import variieren.

**Independent Test**: Ein Export mit Schwimmaktivitaeten, die jeweils einen Rhythmuswert und Pace enthalten, wird importiert. Nach Auswahl von Schwimmen zeigt die Ansicht diese Aktivitaeten und bezeichnet die Messung neutral als Rhythmus.

**Acceptance Scenarios**:

1. **Given** Schwimmaktivitaeten mit gemeldetem Rhythmus und Pace, **When** der Athlet Schwimmen auswaehlt, **Then** zeigt die Ansicht diese Werte als Schwimmrhythmus und Pace.
2. **Given** die Datenquelle bezeichnet den Wert nicht eindeutig als Zugfrequenz, **When** die Schwimmansicht beschriftet wird, **Then** behauptet sie nicht, eine spezifische Zugtechnik oder Zuganzahl gemessen zu haben.
3. **Given** keine Schwimmaktivitaet beide Werte besitzt, **When** der Athlet Schwimmen auswaehlt, **Then** erhaelt er einen klaren Leerzustand mit Hinweis auf fehlende Geraete- oder Exportmesswerte.

### Edge Cases

- Eine Aktivitaet mit fehlender, leerer, null oder ungueltiger Kadenz oder Pace wird nicht als Datenpunkt gezeichnet.
- Die Ansicht bleibt verstaendlich, wenn nur eine der drei Sportarten qualifizierte Aktivitaeten liefert.
- Fehlende Gesamtschritte bei einem Lauf verhindern nicht die Darstellung von Kadenz und Pace; die Schrittzahl wird dann als nicht verfuegbar behandelt.
- Die Fahrradbeschriftung darf Trittfrequenz nicht mit Lauf-Schrittfrequenz vermischen.
- Die Schwimmbeschriftung bleibt bei uneindeutigen Exportdaten neutral und darf keine unbestaetigte Zugfrequenz vortaeuschen.
- Sehr viele qualifizierte Aktivitaeten duerfen die Auswahl einzelner Punkte und das Lesen ihrer Details nicht unmoeglich machen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Anwendung MUSS nach einem erfolgreichen Import eine Kadenz-gegen-Pace-Visualisierung bereitstellen, sobald mindestens eine qualifizierte Aktivitaet vorhanden ist.
- **FR-002**: Die Visualisierung MUSS je qualifizierter Aktivitaet Kadenz und Pace aus derselben Aktivitaet gemeinsam darstellen.
- **FR-003**: Die Anwendung MUSS Lauf-, Rad- und Schwimmaktivitaeten getrennt auswählbar machen und nur Sportarten als Datenansicht anbieten, fuer die qualifizierte Aktivitaeten vorhanden sind.
- **FR-004**: Die Laufansicht MUSS Kadenz als Schrittfrequenz bezeichnen und in den Punktdetails Gesamtschritte anzeigen, sofern der Import diese fuer die Aktivitaet enthaelt.
- **FR-005**: Die Radansicht MUSS Kadenz als Trittfrequenz bezeichnen und darf keine Schritte anzeigen oder daraus ableiten.
- **FR-006**: Die Schwimmansicht MUSS einen vorhandenen Kadenzwert neutral als Schwimmrhythmus bezeichnen, solange die Datenquelle seine Bedeutung nicht eindeutig als Zugfrequenz ausweist.
- **FR-007**: Die Anwendung MUSS Aktivitaeten mit fehlender, leerer, null oder ungueltiger Kadenz oder Pace aus der jeweiligen Darstellung ausschliessen und diese nicht als Nullwerte anzeigen.
- **FR-008**: Die Details eines Datenpunkts MUESSEN mindestens Sportart, Aktivitaetsdatum, Kadenz und Pace zeigen; bei Laeufen mit vorhandenem Wert MUESSEN sie auch die Gesamtschritte zeigen.
- **FR-009**: Fuer eine ausgewaehlte Sportart ohne qualifizierte Aktivitaeten MUSS die Anwendung einen erklaerenden Leerzustand statt eines leeren oder fehlerhaften Diagramms zeigen.
- **FR-010**: Die Visualisierung MUSS mit deutschen und englischen Strava-Exportspalten funktionieren und bestehende Sportfilter sowie bestehende importierte Visualisierungen unveraendert lassen.
- **FR-011**: Die neue Visualisierung MUSS die importierten Rohdaten lokal verarbeiten und darf keine Aktivitaetsrohdaten fuer diese Funktion an einen neuen externen Dienst uebertragen.

### Key Entities *(include if feature involves data)*

- **Kadenzpunkt**: Die zusammengehoerigen Kadenz- und Pacewerte einer einzelnen qualifizierten Aktivitaet mit Sportart und Aktivitaetsdatum.
- **Laufmetrik**: Schrittfrequenz sowie optional die insgesamt aufgezeichneten Schritte einer Laufaktivitaet.
- **Radmetrik**: Die von einem Rad- oder Leistungsmesser gemeldete Trittfrequenz einer Radaktivitaet.
- **Schwimmrhythmus**: Ein vorhandener, geraetegemeldeter Kadenzwert einer Schwimmaktivitaet, dessen genaue Messsemantik nicht ohne Quellennachweis angenommen wird.
- **Qualifizierte Aktivitaet**: Eine Aktivitaet der gewaehlten Sportart mit gueltiger Kadenz und gueltiger Pace.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In einem Import mit mindestens zehn qualifizierten Laufaktivitaeten zeigt die Laufansicht fuer 100 % dieser Aktivitaeten genau einen Kadenz-gegen-Pace-Punkt.
- **SC-002**: In einem Import mit gemessener Radkadenz zeigt die Radansicht fuer 100 % der qualifizierten Radaktivitaeten einen Punkt; bei fehlender Radkadenz zeigt sie in 100 % der geprueften Faelle einen erklaerenden Leerzustand.
- **SC-003**: In einem Import mit Schwimmrhythmus und Pace zeigt die Schwimmansicht fuer 100 % der qualifizierten Aktivitaeten einen Punkt und verwendet in 100 % der geprueften Faelle eine neutrale Rhythmusbezeichnung, sofern keine eindeutige Zugfrequenz vorliegt.
- **SC-004**: In 100 % der geprueften Faelle erscheinen Aktivitaeten mit fehlender oder ungueltiger Kadenz oder Pace nicht als Nullpunkte.
- **SC-005**: In einem dokumentierten, moderierten Usability-Check koennen mindestens 95 % der Testnutzer nach dem Import innerhalb von 15 Sekunden eine Kadenz-Pace-Beziehung fuer eine verfuegbare Sportart finden und einen Datenpunkt lesen.
- **SC-006**: In 100 % der geprueften Laufpunktdetails werden Gesamtschritte angezeigt, wenn die Quellaktivitaet einen Schrittwert enthaelt.

## Assumptions

- Die Visualisierung verwendet die pro Aktivitaet im Strava-Export vorhandene Durchschnittskadenz und Durchschnittspace; sie setzt keine sekunden- oder zuggenaue Zeitreihe voraus.
- Strava dokumentiert Kadenz fuer Aktivitaeten, Runden und Streams in Umdrehungen pro Minute. Die sportliche Bedeutung des Felds ist von Aktivitaetsart und aufzeichnendem Geraet abhaengig.
- Die aktuelle Beispiel-CSV belegt 717 Laufaktivitaeten mit Kadenz, 605 Radaktivitaeten mit Kadenz und 183 Schwimmaktivitaeten mit durchschnittlicher Kadenz. Diese Zahlen sind kein Mindestumfang fuer andere Importe.
- Fuer Schwimmen wird ohne explizite Herkunftskennzeichnung nicht angenommen, dass der Wert eine exakte Zugfrequenz, eine Zuganzahl oder eine bestimmte Schwimmtechnik beschreibt.
- Die Visualisierung ergaenzt bestehende Visualisierungen und ersetzt keine Pace-, Herzfrequenz- oder Leistungsauswertung.