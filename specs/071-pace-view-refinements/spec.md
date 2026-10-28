# Feature Specification: Pace-Ansichten verfeinern

**Feature Branch**: `071-pace-view-refinements`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "pace vs ...: 1) Behalte filter bei (eg 2021 und 2026 ausgewählt), wenn auf andere sicht gewechselt wird. 2) Die legende ist jetzt unterhalb der visualisierung und die ist deshalb vertikal gequetscht. legende rechts davon."

## Clarifications

### Session 2026-10-27

- Q: Ab welcher Bildschirmbreite soll die Legende rechts neben dem Diagramm stehen? → A: Ab 768 CSS-Pixeln; darunter darf sie unterhalb angeordnet werden.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Jahresauswahl beim Ansichtswechsel behalten (Priority: P1)

Als Athlet möchte ich meine aktivierten und deaktivierten Jahre behalten, wenn ich von einer Pace-Ansicht zu einer anderen Ansicht wechsle, damit ich unterschiedliche Grafiken für denselben Zeitraum vergleichen kann.

**Why this priority**: Ein beim Wechsel zurückgesetzter Jahresfilter erschwert direkte Vergleiche und zwingt dazu, die gewünschten Jahre wiederholt auszuwählen.

**Independent Test**: Mit importierten Daten aus mehreren Jahren beispielsweise 2021 und 2026 auswählen, weitere Jahre deaktivieren und zwischen den von dieser Anforderung erfassten Ansichten wechseln. Die ursprüngliche Auswahl ist nach dem Wechsel weiterhin sichtbar und steuert die angezeigten Daten.

**Acceptance Scenarios**:

1. **Given** mehrere Jahre sind ausgewählt und andere Jahre abgewählt, **When** der Athlet zu einer anderen erfassten Ansicht wechselt, **Then** bleibt jede Jahresauswahl erhalten.
2. **Given** ein ausgewähltes oder abgewähltes Jahr hat in der Zielansicht keine Daten, **When** der Athlet zu einer Ansicht mit Daten aus diesem Jahr zurückkehrt, **Then** gilt weiterhin dessen vorheriger Auswahlzustand.
3. **Given** eine Zielansicht enthält ein bisher nicht verfügbares Jahr, **When** diese Ansicht geöffnet wird, **Then** wird das neue Jahr standardmäßig ausgewählt, ohne bekannte Auswahlzustände zu verändern.

### User Story 2 - Legende neben der Visualisierung lesen (Priority: P1)

Als Athlet möchte ich die Legende rechts neben der Pace-Visualisierung sehen, damit die Legende nicht unterhalb des Diagramms dessen verfügbare Höhe verkleinert.

**Why this priority**: Die aktuelle Position unter der Visualisierung quetscht den vertikalen Diagrammbereich und erschwert das Erkennen der Daten.

**Independent Test**: Eine Pace-Ansicht mit Legende öffnen und prüfen, dass die Legende neben dem Diagramm steht, die Diagrammfläche nicht durch sie verkleinert oder überdeckt wird und beide Bereiche vollständig lesbar bleiben.

**Acceptance Scenarios**:

1. **Given** eine Pace-Ansicht zeigt Diagramm und Legende bei mindestens 768 CSS-Pixeln Darstellungsbreite, **When** die Ansicht geöffnet wird, **Then** steht die Legende rechts neben dem Diagramm und die Diagrammfläche bleibt vertikal nutzbar.
2. **Given** eine Pace-Ansicht wird bei weniger als 768 CSS-Pixeln Darstellungsbreite geöffnet, **When** der verfügbare Platz für eine seitliche Legende nicht ausreicht, **Then** werden Diagramm und Legende ohne Überlappung oder Abschneiden angeordnet und das Diagramm bleibt lesbar.
3. **Given** die Legende enthält mehrere Jahre oder Einträge, **When** sie angezeigt wird, **Then** bleiben die Einträge lesbar und eindeutig den dargestellten Daten zugeordnet.

### Edge Cases

- Eine Ansicht enthält nur ein Jahr oder keine Daten für eines der zuvor gefilterten Jahre; der gespeicherte Auswahlzustand darf dadurch nicht verloren gehen.
- Zwischen zwei Ansichten wechseln, die unterschiedliche verfügbare Jahre haben, und anschließend zur ersten Ansicht zurückkehren.
- Die Legende enthält viele Einträge oder lange Bezeichnungen.
- Der verfügbare Platz ist zu schmal für eine rechte Legende; Diagramm und Legende müssen dennoch vollständig lesbar bleiben.
- Eine Zielansicht hat keine darstellbaren Daten; vorhandene Jahresauswahl und verständlicher Leerzustand bleiben erhalten.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Anwendung MUSS die aktivierten und deaktivierten Kalenderjahre beim Wechsel zwischen den Ansichten innerhalb von „Pace vs ...“ erhalten. Andere Dashboard-Visualisierungen MÜSSEN ihre Jahresauswahl unabhängig verwalten.
- **FR-002**: Die Anwendung MUSS den Auswahlzustand eines Jahres auch dann erhalten, wenn dieses Jahr in der aktuell geöffneten Ansicht keine Daten hat, und ihn wieder anwenden, sobald eine Ansicht Daten aus diesem Jahr enthält.
- **FR-003**: Ein in den erfassten Ansichten neu auftretendes Kalenderjahr MUSS standardmäßig ausgewählt sein, ohne Auswahlzustände bereits bekannter Jahre zu verändern.
- **FR-004**: Änderungen an der Jahresauswahl MÜSSEN sich in den angezeigten Daten der aktiven Ansicht widerspiegeln; das Wechseln der Ansicht DARF die Auswahl nicht unbeabsichtigt zurücksetzen.
- **FR-005**: Ab einer Darstellungsbreite von 768 CSS-Pixeln MUSS die Legende rechts neben der Pace-Visualisierung angeordnet sein, sodass sie nicht unterhalb des Diagramms dessen vertikalen Darstellungsbereich verkleinert.
- **FR-006**: Unterhalb von 768 CSS-Pixeln MÜSSEN Visualisierung und Legende ohne Überlappung, Abschneiden oder unlesbar kleine Darstellung angeordnet werden; die Legende darf unter das Diagramm wechseln.
- **FR-007**: Die Legende MUSS ihre Einträge vollständig und eindeutig lesbar darstellen und die Zuordnung zu den dargestellten Daten beibehalten.

### Key Entities *(include if feature involves data)*

- **Jahresauswahl**: Aktivierungszustand je Kalenderjahr, der beim Wechsel zwischen den erfassten Ansichten derselben geladenen Trainingsdaten erhalten bleibt.
- **Pace-Ansicht**: Eine Visualisierung im Bereich „Pace vs ...“, die Jahresauswahl und Legende für die dargestellten Daten verwendet.
- **Legende**: Zuordnung der sichtbaren Jahre oder Datenreihen zu den entsprechenden Markierungen in einer Pace-Visualisierung.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In allen geprüften Ansichtswechseln innerhalb des bestätigten Geltungsbereichs bleiben 100 % der vorher bekannten Jahresauswahlzustände erhalten.
- **SC-002**: In allen geprüften Ansichtswechseln werden Daten ausschließlich für die ausgewählten Jahre gezeigt; vorübergehend nicht vorhandene Jahre kehren mit ihrem vorherigen Zustand zurück.
- **SC-003**: Bei Darstellungsbreiten ab 768 CSS-Pixeln steht die Legende rechts neben dem Diagramm und verkleinert dessen vertikale Fläche nicht durch eine darunterliegende Anordnung.
- **SC-004**: Bei schmalen Darstellungsbereichen bleiben Diagramm und sämtliche Legendeneinträge in 100 % der geprüften Fälle ohne Überlappung oder Abschneiden lesbar.
- **SC-005**: Nutzer können in mindestens 90 % der Gebrauchstests die Zuordnung eines Legendeneintrags zu den dargestellten Daten ohne zusätzliche Erklärung korrekt erkennen.

## Assumptions

- „Pace vs ...“ bezeichnet den vorhandenen Bereich mit Pace-bezogenen Ansichten und den dazugehörigen Jahresfiltern.
- Der Jahresauswahlzustand gilt für die Dauer des geladenen Datensatzes; ein neuer Import darf die bisherige Auswahl zurücksetzen.
- Die Jahresauswahl gilt für die Ansichten innerhalb von „Pace vs ...“; Jahresauswahlen anderer Dashboard-Visualisierungen bleiben unabhängig.
- Die seitliche Legende ist für ausreichend breite Darstellungsbereiche vorgesehen. Bei schmalen Ansichten darf sie unter das Diagramm wechseln, sofern beide Bereiche lesbar bleiben.
- Diese Änderung betrifft die Auswahl und Darstellung vorhandener Daten und fügt keine neue Visualisierung oder Netzwerkfunktion hinzu.
