# Feature Specification: Fire-Farbschema für Equipment-Pace

**Feature Branch**: `066-equipment-pace-fire-scheme`
**Created**: 2026-10-23
**Status**: Draft
**Input**: User description: "Equipment: farbschema bei \"pace\" filter: fire"

## Clarifications

### Session 2026-10-23

- Q: Wie sollen Schuhe und Räder in „All“ unterscheidbar bleiben, wenn beide das Fire-Farbschema verwenden? → A: Fire gilt nur bei Auswahl von „Shoes“ oder „Bikes“; „All“ behält die bisherigen Typfarben.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pace-Leistung mit Fire-Farben erkennen (Priority: P1)

Als Athlet möchte ich in der Equipment-Ansicht bei der Kennzahl „Pace“ ein Fire-Farbschema sehen, damit ich langsamere und schnellere Ausrüstungsteile auf einen Blick unterscheiden kann.

**Why this priority**: Die Farbe ergänzt den Pace-Vergleich um eine schnell erfassbare Leistungsorientierung, ohne die angezeigten Messwerte zu ersetzen.

**Independent Test**: In der Equipment-Ansicht „Pace“ jeweils mit „Shoes“ und „Bikes“ auswählen und Datensätze mit unterschiedlich schnellem Tempo vergleichen. Langsamere Werte erscheinen im gelben, schnellere im roten Bereich des Fire-Spektrums; bei „All“ bleiben die bisherigen Typfarben erhalten.

**Acceptance Scenarios**:

1. **Given** mehrere Schuhe mit unterschiedlichen Pace-Werten, **When** die Kennzahl „Pace“ angezeigt wird, **Then** liegen langsamere Schuh-Paces im gelben und schnellere im roten Bereich des Farbschemas.
2. **Given** mehrere Räder mit unterschiedlichen Geschwindigkeiten, **When** die Kennzahl „Pace“ angezeigt wird, **Then** liegen langsamere Geschwindigkeiten im gelben und schnellere im roten Bereich des Farbschemas.
3. **Given** die Kennzahl „Pace“ und die Ausrüstungsart „All“, **When** Schuhe und Räder gemeinsam angezeigt werden, **Then** behalten Schuhe und Räder ihre bisherigen unterschiedlichen Typfarben und ihre jeweiligen Einheiten, ohne dass die Farben einen direkten Leistungsvergleich nahelegen.
4. **Given** eine andere Equipment-Kennzahl als „Pace“, **When** die Ansicht angezeigt wird, **Then** bleiben deren bestehenden Farben und Darstellung unverändert.
5. **Given** es gibt keine gültigen Pace-Werte für die aktuelle Auswahl, **When** die Ansicht angezeigt wird, **Then** bleibt der bestehende Leerzustand erhalten und es werden keine irreführenden Pace-Farben angezeigt.

### Edge Cases

- Wenn alle angezeigten Ausrüstungsteile denselben Pace-Wert haben, werden keine unterschiedlichen Leistungsstufen durch die Farben suggeriert.
- Fehlende oder ungültige Tempoangaben erhalten keine Farbe, die eine Leistung vortäuscht.
- Bei „All“ bleibt die bestehende Typfarbgebung für Schuhe und Räder erhalten; Fire wird in dieser gemischten Ansicht nicht angewendet.
- Bei nur einem gültigen Ausrüstungsteil bleibt die Ansicht verständlich, ohne einen Vergleich mit nicht vorhandenen Werten anzudeuten.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Wenn die Equipment-Kennzahl „Pace“ und genau eine Ausrüstungsart („Shoes“ oder „Bikes“) ausgewählt ist, MUSS die Ansicht das Fire-Farbschema von Gelb für langsamere bis Rot für schnellere Werte verwenden.
- **FR-002**: Bei Schuhen MUSS die Farbrichtung anhand der Pace in Zeit pro Strecke bestimmt werden; eine niedrigere Zeit gilt als schneller.
- **FR-003**: Bei Rädern MUSS die Farbrichtung anhand der Geschwindigkeit bestimmt werden; eine höhere Geschwindigkeit gilt als schneller.
- **FR-004**: Bei der Ausrüstungsart „All“ MUSS die Equipment-Ansicht ihre bisherigen unterschiedlichen Typfarben für Schuhe und Räder beibehalten; das Fire-Farbschema DARF in dieser gemischten Ansicht NICHT angewendet werden.
- **FR-005**: Die Farbcodierung MUSS die angezeigten Pace- oder Geschwindigkeitswerte und deren Einheiten unverändert lassen.
- **FR-006**: Die Farbcodierung MUSS sich auf die Kennzahl „Pace“ beschränken. Farben und Verhalten aller anderen Equipment-Kennzahlen MÜSSEN unverändert bleiben.
- **FR-007**: Fehlende oder ungültige Pace-Werte DÜRFEN NICHT als gültige Leistungswerte eingefärbt werden; vorhandene Leerzustände MÜSSEN bestehen bleiben.
- **FR-008**: Für gleiche Pace- beziehungsweise Geschwindigkeitswerte MUSS die Fire-Farbdarstellung innerhalb derselben einzeln ausgewählten Ausrüstungsart gleich sein.

### Key Entities *(include if feature involves data)*

- **Equipment-Pace-Wert**: Durchschnittliches Tempo eines Ausrüstungsteils; bei Schuhen als Zeit pro Strecke und bei Rädern als Geschwindigkeit dargestellt.
- **Fire-Farbskala**: Farbverlauf von Gelb für langsamere bis Rot für schnellere gültige Werte innerhalb einer Ausrüstungsart.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100 % der geprüften Pace-Ansichten mit einzeln ausgewählten Schuhen oder Rädern werden langsamere gültige Werte gelblicher und schnellere gültige Werte rötlicher dargestellt.
- **SC-002**: Bei 100 % der geprüften Ausrüstungsteile bleiben angezeigte Messwerte und Einheiten nach Anwendung der Farbskala unverändert.
- **SC-003**: Bei der Auswahl „All“ behalten 100 % der geprüften Ansichten die bisherigen unterschiedlichen Typfarben für Schuhe und Räder bei und wenden das Fire-Schema nicht an.
- **SC-004**: Bei 100 % der geprüften Nicht-Pace-Kennzahlen bleiben Farben und sichtbare Darstellung gegenüber dem bisherigen Verhalten unverändert.
- **SC-005**: Bei fehlenden oder ungültigen Pace-Werten werden in 100 % der geprüften Fälle weder Leistungsfarben noch erfundene Werte angezeigt.

## Assumptions

- „Farbschema bei ‚Pace‘: Fire“ bedeutet, dass Fire automatisch gilt, wenn „Pace“ und einzeln „Shoes“ oder „Bikes“ ausgewählt sind; ein zusätzlicher Farbschema-Schalter ist nicht Teil dieser Anfrage.
- Fire folgt der im Projekt bereits etablierten Bedeutung: Gelb steht für langsamere beziehungsweise niedrigere Leistung, Rot für schnellere beziehungsweise höhere Leistung.
- Bei „All“ bleiben die bestehenden Typfarben erhalten, damit Schuhe und Räder trotz ihrer unterschiedlichen Einheiten unterscheidbar bleiben.
- Der Umfang beschränkt sich auf die bestehende Equipment-Ansicht und verändert weder Filter noch Aggregation, Kennzahlen oder Datenimporte.