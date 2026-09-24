# Feature Specification: Training Calendar Contrast and Tooltips

**Feature Branch**: `038-calendar-tooltips`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "1) the colour shading for blue and green is not strong enough. the contrast must be bigger, stage 1 is barely visible. 2) please make a mouse-over tooltip where the activities on the day are shown. 3) leave out the \"tooltip\" at the bottom that changes when mouseover over some blocks. IF there are multiple years and user hoovers over boxes in first year he does not see that at the bottom things are shown."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Blue- und Green-Stufen klar erkennen (Priority: P1)

Als Athlet möchte ich die Intensitaetsstufen in den Blue- und Green-Schemata deutlich unterscheiden koennen, damit auch leichte Aktivitaetstage sofort sichtbar sind.

**Why this priority**: Wenn Stufe 1 kaum sichtbar ist, verliert die Kalenderansicht fuer leichte Trainingstage einen wesentlichen Teil ihrer Aussage.

**Independent Test**: Mit aktiven Tagen auf allen fünf Stufen werden Blue und Green ausgewaehlt; jede Stufe ist visuell unterscheidbar und Stufe 1 hebt sich klar vom hellen Leerzustand ab.

**Acceptance Scenarios**:

1. **Given** aktive Tage mit den Intensitaetsstufen 1 bis 5, **When** Green ausgewaehlt wird, **Then** sind alle fuenf Gruenstufen unterscheidbar und Stufe 1 ist klar sichtbar.
2. **Given** aktive Tage mit den Intensitaetsstufen 1 bis 5, **When** Blue ausgewaehlt wird, **Then** sind alle fuenf Blaustufen unterscheidbar und Stufe 1 ist klar sichtbar.
3. **Given** leere und aktive Tage nebeneinander, **When** Blue oder Green ausgewaehlt wird, **Then** bleibt die niedrigste aktive Stufe eindeutig von der hellen Leerzelle unterscheidbar.

### User Story 2 - Tagesaktivitaeten direkt am Feld sehen (Priority: P1)

Als Athlet möchte ich beim Ueberfahren eines aktiven Tagesfelds die Aktivitaeten dieses Tages direkt an dieser Stelle sehen, damit ich nicht zwischen mehreren Jahresbloecken nach einem separaten Detailbereich suchen muss.

**Why this priority**: Direkte Tagesdetails loesen die Orientierungsluecke bei mehreren untereinander dargestellten Jahren und machen die Heatmap ohne Zusatznavigation erklaerbar.

**Independent Test**: Mit einem Tag mit mehreren Aktivitaeten wird das Tagesfeld ueberfahren; ein lokaler Tooltip am Feld zeigt Datum, Aktivitaetsnamen, Sportarten sowie verfuegbare Dauer und Distanz.

**Acceptance Scenarios**:

1. **Given** ein aktiver Tag mit einer Aktivitaet, **When** der Nutzer das Tagesfeld ueberfaehrt, **Then** erscheint ein Tooltip neben oder ueber dem Feld mit Datum, Aktivitaetsname, Sportart und verfuegbaren Messwerten.
2. **Given** ein aktiver Tag mit mehreren Aktivitaeten, **When** der Nutzer das Tagesfeld ueberfaehrt, **Then** zeigt der Tooltip alle Aktivitaeten dieses Tages getrennt an.
3. **Given** ein aktiver Tag mit fehlender Distanz oder Dauer, **When** der Tooltip erscheint, **Then** werden fehlende Werte ausgelassen und nicht als erfundene null- oder Nullwerte dargestellt.
4. **Given** ein Tagesfeld wird per Tastatur fokussiert, **When** der Nutzer es erreicht, **Then** sind dieselben Tagesdetails ohne Mouseover zugaenglich.

### User Story 3 - Kein konkurrierender globaler Detailbereich (Priority: P2)

Als Athlet möchte ich keine wechselnden Tagesdetails in einem separaten unteren Bereich sehen, damit die Informationen immer eindeutig dem gerade betrachteten Tagesfeld zugeordnet bleiben.

**Why this priority**: Ein globaler Detailbereich kann bei mehreren Jahresbloecken den falschen Kontext suggerieren oder ausserhalb des sichtbaren Bereichs liegen.

**Independent Test**: Die Kalenderansicht mit mehreren Jahren wird geoeffnet; es existiert kein unterer globaler Kalender-Tooltip-/Detailbereich, und Tagesdetails werden nur am jeweiligen Feld angeboten.

**Acceptance Scenarios**:

1. **Given** mehrere Jahresbloecke sind sichtbar, **When** der Nutzer Tagesfelder in verschiedenen Bloecken ueberfaehrt, **Then** erscheint der Tooltip jeweils am aktuell betrachteten Feld und kein separater globaler Detailbereich aktualisiert sich.
2. **Given** der Nutzer verlaesst ein Tagesfeld, **When** kein anderes Feld fokussiert oder ueberfahren wird, **Then** verschwindet der lokale Tooltip oder wird geschlossen, ohne Inhalte an einer anderen Stelle zu veraendern.

### Edge Cases

- Ein leerer Tag zeigt keinen Aktivitaetslisten-Tooltip, kann aber Datum und den Hinweis „keine Aktivitaet“ anzeigen.
- Ein Tooltip mit vielen Aktivitaeten bleibt begrenzt und scrollbar, ohne andere Tagesfelder dauerhaft zu verdecken.
- Ein Tooltip am oberen oder unteren Rand wird innerhalb des sichtbaren Kalenderbereichs positioniert.
- Ein Tooltip in einem aelteren Jahresblock darf nicht durch Details eines anderen Jahres ersetzt werden.
- Auf schmalen Bildschirmen bleibt der Tooltip lesbar und darf horizontal oder vertikal innerhalb des Kalenderbereichs ausweichen.
- Die Entfernung des globalen Detailbereichs darf den bestehenden Import-, Sportfilter- oder Farbschema-Leerzustand nicht entfernen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Anwendung MUSS in den Blue- und Green-Schemata fuenf visuell unterscheidbare aktive Intensitaetsstufen darstellen.
- **FR-002**: Die Anwendung MUSS sicherstellen, dass die niedrigste aktive Blue- und Green-Stufe deutlich von der hellen Leerzelle unterscheidbar ist.
- **FR-002a**: Die Anwendung MUSS leere Tagesfelder in einem sehr hellen Grau (`#F1F5F9`) statt in reinem Weiss darstellen; dieser Farbwert MUSS in allen Farbschemata unveraendert bleiben.
- **FR-003**: Die Anwendung MUSS beim Mouseover eines aktiven Tagesfelds einen lokalen Tooltip am jeweiligen Tagesfeld anzeigen.
- **FR-004**: Der lokale Tooltip MUSS das Datum, den Aktivitaetsnamen, die Sportart und verfuegbare Dauer- und Distanzwerte jeder Aktivitaet anzeigen.
- **FR-005**: Der lokale Tooltip MUSS bei mehreren Aktivitaeten am selben Tag jede Aktivitaet als getrennten Eintrag darstellen.
- **FR-006**: Fehlende Aktivitaetswerte MUESSEN im Tooltip ausgelassen werden und duerfen nicht als erfundene Nullwerte erscheinen.
- **FR-007**: Tagesdetails MUESSEN auch bei Tastaturfokus des Tagesfelds ohne Mouseover zugaenglich sein.
- **FR-008**: Die Anwendung DARF keinen separaten globalen unteren Kalender-Tooltip- oder Detailbereich anzeigen oder aktualisieren.
- **FR-009**: Beim Wechsel zwischen Jahresbloecken MUSS jeder lokale Tooltip ausschliesslich die Aktivitaeten des aktuell betrachteten Tagesfelds anzeigen.
- **FR-010**: Tooltips MUESSEN innerhalb des sichtbaren Kalenderbereichs positioniert werden und bei vielen Eintraegen scrollbar bleiben.
- **FR-011**: Die bestehende Mehrjahresdarstellung, Sportfilter, Farbschemaauswahl und lokale Verarbeitung MUESSEN erhalten bleiben.

### Key Entities *(include if feature involves data)*

- **Lokaler Tagestooltip**: Eine kontextgebundene Darstellung der Aktivitaeten eines einzelnen Tagesfelds.
- **Tooltip-Aktivitaet**: Ein einzelner Aktivitaetseintrag mit Name, Sportart und optionaler Dauer sowie Distanz.
- **Intensitaetsstufe**: Eine der fuenf aktiven Blue- oder Green-Farbabstufungen, die visuell unterscheidbar sein muss.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100 % der geprueften Blue- und Green-Darstellungen sind die fuenf aktiven Intensitaetsstufen anhand ihrer sichtbaren Farbwerte unterscheidbar.
- **SC-002**: Die relative Luminanzdifferenz zwischen der sehr hellgrauen Leerzelle (`#F1F5F9`) und Blue-/Green-Stufe 1 erreicht mindestens 3:1; die Leerzelle darf nicht rein weiss (`#FFFFFF`) sein.
- **SC-003**: Bei einem Tag mit mehreren Aktivitaeten erscheinen innerhalb von 300 Millisekunden nach Mouseover alle zugehoerigen Aktivitaetseintraege im lokalen Tooltip.
- **SC-004**: In 100 % der geprueften Jahresbloecke zeigt ein Tooltip nur die Aktivitaeten des jeweils fokussierten oder ueberfahrenen Tages.
- **SC-005**: In 100 % der geprueften Kalenderansichten existiert kein globaler unterer Detailbereich, der Tagesinformationen aktualisiert.
- **SC-006**: 95 % der Testnutzer koennen nach dem Mouseover eines Tagesfelds innerhalb von 5 Sekunden die Aktivitaetsnamen und Sportarten dieses Tages benennen.

## Assumptions

- Die bestehenden Tagesdaten werden um Aktivitaetsnamen und die fuer Tooltips erforderlichen Rohwerte ergaenzt, ohne die importierten Quelldaten zu mutieren.
- Der lokale Tooltip wird fuer Mouseover und Tastaturfokus verwendet; Touchgeraete erhalten dieselben Details ueber Fokus oder Tap, soweit der Browser dies unterstuetzt.
- Ein Tooltip darf als eigener Layer innerhalb des Kalenderpanels umgesetzt werden, solange er kontextgebunden am aktiven Feld erscheint und kein globaler unterer Detailbereich entsteht.
- Die bestehenden Farbschemata Fire und die Mehrjahresdarstellung bleiben unveraendert, ausser dass alle Kalenderfelder die verbesserten lokalen Tooltipdetails verwenden.
- Die Farbschemaauswahl bleibt auf Green, Blue und Fire beschraenkt.
- Leere Tagesfelder verwenden dauerhaft `#F1F5F9` als sehr helles Grau und behalten diesen Wert unabhaengig von Palette und Sportfilter.
