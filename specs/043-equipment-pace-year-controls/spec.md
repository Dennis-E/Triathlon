# Feature Specification: Lesbare Ausrüstungsgrafiken und dauerhafte Jahresauswahl

**Feature Branch**: `043-equipment-pace-year-controls`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "equipment: 1) die legende steht rechts aus dem rand heraus. sie soll immer voll lesbar sein, im zweifel umbrechen in 2 zeilen 2) pace / bikes. skalierung is invertiert. schnellste sollte längstes bar haben, auch shoes 3) implementiere die möglichkeit per shift + mausklick mehrere Jahre gleichzeitig zu aktivieren, deaktivieren. Also ich will beispielsweise 2020-2025 gleichzeitig deaktivieren auf diese weise. 4) wenn jahre gefiltert wurden bei einer ansicht und ich wechsle auf einen anderen filter, behalte die selektion / deselektion für jahre bei."

## Clarifications

### Session 2026-09-28

- Q: Soll die Jahresauswahl nur beim Wechsel der Filter innerhalb von „Pace vs ...“ erhalten bleiben oder auch zwischen verschiedenen Visualisierungen gelten? → A: Nur zwischen Filtern innerhalb von „Pace vs ...“.
- Q: Welche Beschriftung ragt bei der Ausrüstungsansicht rechts über den Rand: die Werte an den Balken oder die Farb-Legende der Ausrüstungs-Zeitleiste? → A: Die Werte an den Balken der Ausrüstungsgrafik.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ausrüstungswerte vollständig lesen (Priority: P1)

Als Athlet möchte ich die Werte am Ende der Ausrüstungsbalken vollständig lesen, auch bei langen Wertangaben oder wenig Platz, damit ich die Ausrüstungsstatistik ohne Abschneiden oder horizontales Scrollen verstehe.

**Why this priority**: Abgeschnittene Beschriftungen machen die aktuell sichtbaren Ergebnisse unverständlich.

**Independent Test**: Einen Import mit unterschiedlich langen Wertangaben bei schmaler und breiter Ansicht öffnen; alle Balkenwerte bleiben innerhalb der Grafik vollständig lesbar, nötigenfalls in zwei Zeilen.

**Acceptance Scenarios**:

1. **Given** ein Balken mit einer Wertangabe nahe dem rechten Rand, **When** die Ausrüstungsgrafik angezeigt wird, **Then** ist die gesamte Angabe innerhalb der sichtbaren Grafik lesbar.
2. **Given** eine lange Wertangabe am Balken, **When** die verfügbare Breite für eine Zeile nicht ausreicht, **Then** wird sie möglichst auf zwei lesbare Zeilen verteilt und weder abgeschnitten noch über den Rand geschoben.
3. **Given** dieselben Daten, **When** der Athlet zwischen Ausrüstungsart und Kennzahl wechselt oder die Ansicht schmaler wird, **Then** bleiben die Balkenwerte vollständig lesbar, ohne andere Balken zu verdecken.

---

### User Story 2 - Tempo anhand der Balken vergleichen (Priority: P1)

Als Athlet möchte ich sowohl bei Rädern als auch bei Schuhen das schnellste Ausrüstungsteil am längsten Balken erkennen, damit die Balkenlänge nicht das Gegenteil der Leistung suggeriert.

**Why this priority**: Eine umgekehrte Balkenlänge führt zu falschen Schlussfolgerungen über die schnellste Ausrüstung.

**Independent Test**: Mindestens zwei Räder und zwei Schuhe mit unterschiedlichen Durchschnittstempi importieren und die Pace-Kennzahl jeweils bei „Bikes“, „Shoes“ und „All“ vergleichen: Das schnellste Teil hat innerhalb der jeweiligen Vergleichsgruppe den längsten Balken, bei weiterhin korrekten Tempoangaben.

**Acceptance Scenarios**:

1. **Given** zwei Räder mit verschiedenen Durchschnittsgeschwindigkeiten, **When** „Pace“ und „Bikes“ gewählt werden, **Then** hat das Rad mit der höheren Geschwindigkeit den längeren Balken und beide Werte werden als Geschwindigkeit bezeichnet.
2. **Given** zwei Schuhe mit verschiedenen Durchschnittspaces, **When** „Pace“ und „Shoes“ gewählt werden, **Then** hat der Schuh mit der niedrigeren Zeit pro Kilometer den längeren Balken und beide Werte werden weiterhin als Pace bezeichnet.
3. **Given** gemischte Schuhe und Räder, **When** „Pace“ und „All“ gewählt werden, **Then** werden Schuhe und Räder mit ihrer jeweils passenden Tempoangabe dargestellt; die Balkenlänge innerhalb jeder Ausrüstungsart nimmt mit der Geschwindigkeit zu, ohne Pace-Zeiten als Geschwindigkeit auszugeben.

---

### User Story 3 - Jahresbereiche gemeinsam schalten (Priority: P2)

Als Athlet möchte ich in „Pace vs ...“ mit Umschalt und Mausklick zusammenhängende Jahre zugleich aktivieren oder deaktivieren, damit ich nicht jede Jahrescheckbox einzeln bedienen muss.

**Why this priority**: Die Auswahl längerer Zeiträume ist sonst unnötig aufwendig.

**Independent Test**: Mindestens sechs Jahre mit Daten anzeigen, 2020 per normalem Klick deaktivieren und 2025 mit gedrückter Umschalttaste anklicken; 2020 bis einschließlich 2025 sind deaktiviert. Derselbe Ablauf in Gegenrichtung aktiviert den Bereich.

**Acceptance Scenarios**:

1. **Given** die Jahre 2020 bis 2025 sind aktiviert, **When** 2020 normal deaktiviert und 2025 mit Umschalt+Klick deaktiviert wird, **Then** sind alle sechs Jahre einschließlich der Endpunkte deaktiviert und ihre Daten sowie Trendlinien verborgen.
2. **Given** die Jahre 2020 bis 2025 sind deaktiviert, **When** 2020 normal aktiviert und 2025 mit Umschalt+Klick aktiviert wird, **Then** sind alle sechs Jahre einschließlich der Endpunkte aktiviert und ihre vorhandenen Daten sichtbar.
3. **Given** ein einzelnes Jahr wird ohne vorherigen Jahresklick mit Umschalt+Klick betätigt, **When** kein Bereichsanfang feststeht, **Then** ändert sich nur dieses Jahr.
4. **Given** eine bestehende Auswahl, **When** ein Jahr ohne Umschalttaste angeklickt wird, **Then** ändert sich nur dieses Jahr und es dient als neuer Bereichsanfang.

---

### User Story 4 - Jahresauswahl beim Filterwechsel behalten (Priority: P2)

Als Athlet möchte ich meine gewählten und abgewählten Jahre beim Wechsel zwischen Sportarten und Messgrößen in „Pace vs ...“ behalten, damit ich verschiedene Ansichten über denselben Zeitraum vergleichen kann.

**Why this priority**: Eine automatisch zurückgesetzte Jahresauswahl macht Vergleiche über mehrere Filter hinweg mühsam und irreführend.

**Independent Test**: Ein Jahr deaktivieren, zu einer Messgröße oder Sportart ohne dieses Jahr wechseln und anschließend zurückwechseln; das Jahr ist weiterhin deaktiviert. Den Vorgang mit mehreren Jahren und einer Kombination ohne Punkte wiederholen.

**Acceptance Scenarios**:

1. **Given** ein oder mehrere Jahre sind deaktiviert, **When** der Athlet Messgröße oder Sportart wechselt, **Then** bleibt der aktivierte/deaktivierte Zustand aller bereits bekannten Jahre unverändert.
2. **Given** ein deaktiviertes Jahr hat unter dem neuen Filter keine Daten, **When** der Athlet zurück zu einem Filter mit Daten aus diesem Jahr wechselt, **Then** ist es weiterhin deaktiviert.
3. **Given** ein Filter bringt ein bisher unbekanntes Jahr hinzu, **When** dieses Jahr zum ersten Mal angezeigt wird, **Then** ist es zunächst aktiviert, ohne die Zustände bekannter Jahre zu ändern.
4. **Given** ein neuer Datensatz wird importiert, **When** die Jahresauswahl initialisiert wird, **Then** beginnt sie für den neuen Datensatz mit allen verfügbaren Jahren aktiviert und ohne alte Auswahl aus dem vorherigen Import.

### Edge Cases

- Bei nur einem Ausrüstungsteil oder gleichen Tempi bleibt die Beschriftung korrekt; gleich schnelle Teile erscheinen gleich lang.
- Sehr lange Wertangaben bleiben bei schmaler Ansicht zugänglich, auch wenn zwei Zeilen allein nicht ausreichen; es werden keine Werte stillschweigend abgeschnitten.
- Bei „All“ bleiben die Tempoeinheiten für Schuhe (Zeit pro Kilometer) und Räder (Geschwindigkeit) unterscheidbar; die Balken werden nicht als direkte sportartenübergreifende Leistungsrangliste ausgegeben.
- Bei nur einem vorhandenen Jahr verhält sich Umschalt+Klick wie ein Einzelklick; Bereiche gelten nur für tatsächlich auswählbare Jahre zwischen den beiden angeklickten Jahren.
- Ein Filter ohne passende Messwerte zeigt weiterhin den bestehenden verständlichen Leerzustand; zuvor getroffene Jahresauswahlen werden dadurch nicht gelöscht.
- Datumsbereichswechsel innerhalb desselben Imports löschen keine ausdrücklich abgewählten Jahre; kehrt ein Jahr in den sichtbaren Zeitraum zurück, gilt sein vorheriger Zustand.
- Die Trendlinien-Auswahl bleibt von der Jahresauswahl unabhängig; ausgeblendete Jahre zeigen auch bei aktivierten Trendlinien keine Trendlinien.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Ausrüstungsgrafik MUSS die Wertangaben an den Balken innerhalb des verfügbaren Darstellungsbereichs lesbar halten, auch nach Wechsel von Kennzahl oder Ausrüstungsart und bei schmaler Ansicht.
- **FR-002**: Reicht eine Zeile für eine Wertangabe am Balken nicht aus, MUSS die Anzeige eine lesbare zweizeilige Darstellung ermöglichen; reichen zwei Zeilen nicht, MUSS der vollständige Wert weiterhin ohne Datenverlust zugänglich sein.
- **FR-003**: Bei der Ausrüstungskennzahl „Pace“ MUSS bei Rädern eine höhere Durchschnittsgeschwindigkeit und bei Schuhen eine niedrigere durchschnittliche Zeit pro Kilometer jeweils einem längeren Balken entsprechen; gleiche Tempi ergeben gleiche Balkenlängen.
- **FR-004**: Die Ausrüstungsgrafik MUSS die tatsächliche Durchschnittsgeschwindigkeit von Rädern und die tatsächliche durchschnittliche Pace von Schuhen samt korrekter Einheit anzeigen; eine für die Balkenlänge verwendete Vergleichsgröße DARF NICHT als gemessener Wert ausgegeben werden.
- **FR-005**: Die Ansichten „Bikes“, „Shoes“ und „All“ MÜSSEN die zur Ausrüstungsart passende Tempoanzeige behalten; die gemischte Ansicht DARF keine irreführende direkte Rangliste zwischen unterschiedlichen Ausrüstungsarten oder Einheiten behaupten.
- **FR-006**: Die Jahresauswahl in „Pace vs ...“ MUSS per normalem Klick ein einzelnes Jahr umschalten und dieses als Anfang für einen anschließenden Bereichsklick merken.
- **FR-007**: Ein Umschalt+Klick auf eine Jahresauswahl MUSS alle auswählbaren Jahre vom gemerkten Anfang bis zum angeklickten Jahr einschließlich beider Endpunkte auf den durch diesen Klick gewählten Aktivierungszustand setzen; ohne gemerkten Anfang MUSS nur das angeklickte Jahr umgeschaltet werden.
- **FR-008**: Jede Änderung der Jahresauswahl MUSS die zugehörigen Punkte und Trendlinien sichtbar machen oder verbergen, ohne die unabhängige Trendlinien-Einstellung zu verändern.
- **FR-009**: Die Jahresauswahl MUSS für jedes Kalenderjahr während eines Imports beim Wechsel von Sportart, Messgröße oder Datumsbereich innerhalb von „Pace vs ...“ erhalten bleiben, auch wenn das Jahr vorübergehend keine Daten liefert; neue Jahre beginnen aktiviert. Die Jahresauswahl anderer Visualisierungen bleibt unabhängig.
- **FR-010**: Ein neuer Import MUSS die gemerkte Jahresauswahl und den Bereichsanfang zurücksetzen; bestehende Leerzustände bei fehlenden Daten MÜSSEN erhalten bleiben.
- **FR-011**: Andere Ausrüstungskennzahlen und andere Dashboard-Ansichten MÜSSEN ihre bisherige Bedeutung und Filterwirkung behalten; importierte Trainingsdaten bleiben bei der Auswertung lokal.

### Key Entities *(include if feature involves data)*

- **Ausrüstungseintrag**: Zuordnung eines Namens und einer Art (Schuhe oder Rad) zu den importierten Aktivitäten und einem aggregierten Durchschnittstempo.
- **Tempoanzeige**: Sportartgerechte Angabe in Minuten pro Kilometer für Schuhe oder Kilometern pro Stunde für Räder, zusammen mit einer Balkenlänge, die „schneller“ stets als „länger“ ausdrückt.
- **Jahresauswahl**: Pro importiertem Kalenderjahr gemerkter Aktivierungszustand, unabhängig davon, ob das Jahr unter dem aktuell gewählten Filter sichtbar ist.
- **Bereichsanfang**: Zuletzt ohne Umschalttaste gewähltes Jahr als Ausgangspunkt für das gleichzeitige Umschalten eines Jahresbereichs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Bei allen geprüften Breiten von 320 bis 1440 Bildpunkten sind 100 % der dargestellten Balkenwerte vollständig lesbar oder ohne Datenverlust erreichbar; kein Balkenwert ragt über den sichtbaren Darstellungsbereich hinaus.
- **SC-002**: Bei 100 % der geprüften Schuh- und Radpaare mit verschiedenem Tempo hat das schnellere Teil den längeren Balken; gleiche Tempi ergeben gleich lange Balken.
- **SC-003**: In allen geprüften Darstellungen entsprechen die angezeigten Pace- und Geschwindigkeitswerte den aggregierten Aktivitätsdaten und tragen die passende Einheit.
- **SC-004**: Bei allen geprüften Bereichsklicks ändern genau die auswählbaren Jahre zwischen Anfang und Ziel einschließlich beider Endpunkte ihren Zustand wie gewünscht; Jahre außerhalb des Bereichs bleiben unverändert.
- **SC-005**: Bei 100 % der geprüften Filter- und Datumsbereichswechsel innerhalb eines Imports bleibt die Auswahl bekannter Jahre erhalten, auch nach einem zwischenzeitlichen Leerzustand; bei einem neuen Import bleiben 0 alte Deaktivierungen erhalten.
- **SC-006**: In einem Datensatz mit auswählbaren Jahren 2020–2025 lassen sich alle sechs Jahre mit genau zwei Klicks gemeinsam deaktivieren oder aktivieren (normaler Klick auf das erste Jahr, Umschalt+Klick auf das letzte Jahr); nach einem Filterwechsel bleibt derselbe Auswahlzustand erhalten.

## Assumptions

- „Legende rechts aus dem Rand“ bezeichnet ausschließlich die Wertangaben am rechten Ende der Balken in der Ausrüstungsgrafik. Ausrüstungsnamen und die separate Farbkennzeichnung der Ausrüstungs-Zeitleiste sind von dieser Änderung nicht betroffen.
- Die Punkte 3 und 4 beziehen sich ausschließlich auf die vorhandenen Jahrescheckboxen der Ansicht „Pace vs ...“; andere Visualisierungen teilen diese Auswahl nicht. Die Ausrüstungsgrafik hat gegenwärtig keine Jahresauswahl und erhält durch dieses Feature keine neue.
- Die Auswahl eines Jahres gilt für alle Sportarten und Messgrößen desselben Imports, nicht getrennt pro Filter. Bei Jahresbereichen übernimmt der gesamte Bereich den neuen Zustand des angeklickten Zieljahres.
- Das aktive Datumsintervall und die separate Trendlinien-Einstellung bleiben bei Filterwechseln wie bisher bestehen; dauerhaft über mehrere Besuche oder nach Neuladen der Seite gespeicherte Präferenzen sind nicht Teil dieses Features.
- Die bestehende Berechnung der Durchschnittstempi aus den importierten Aktivitäten bleibt die fachliche Grundlage; die Änderung betrifft deren vergleichbare Darstellung und die Interaktion mit Jahresfiltern, nicht die importierten Rohdaten.