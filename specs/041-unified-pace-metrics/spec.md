# Feature Specification: Unified Pace versus Metrics Visualization

**Feature Branch**: `041-unified-pace-metrics`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "feedback to the cadence vs pace. 1) please put the checkboxes for selecting years 2) also checkbox for the trendlines. Both same as in heartrate vs pace 3) actually merge these two into a joint 'Pace vs ...' visualization with a filter for heartrate / cadence and also add height gain and distance"

## Clarifications

### Session 2026-09-25

- Q: Soll „Pace vs ...“ weiterhin „All Sports“ als gemeinsame Punktwolke erlauben? → A: Nur Run, Bike oder Swim erlauben.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Eine Pace-Metrik vergleichen (Priority: P1)

Als Athlet moechte ich eine gemeinsame Ansicht "Pace vs ..." nutzen, eine Sportart und Herzfrequenz, Kadenz, Hoehengewinn oder Distanz auswaehlen, damit ich die gewuenschte Leistungsbeziehung ohne zwischen getrennten Visualisierungen wechseln zu muessen untersuchen kann.

**Why this priority**: Eine gemeinsame Ansicht reduziert Navigation und stellt die vergleichbaren Scatteranalysen an einer vorhersehbaren Stelle bereit.

**Independent Test**: Ein Import mit qualifizierten Lauf-, Rad- und Schwimmaktivitaeten fuer alle vier Metriken wird geladen. Der Athlet kann genau eine Sportart und jede Metrik auswaehlen und sieht jeweils genau die Aktivitaeten mit einer gueltigen Pace oder Geschwindigkeit und einem gueltigen Wert fuer die gewaehlte Metrik.

**Acceptance Scenarios**:

1. **Given** importierte Aktivitaeten mit Pace und Herzfrequenz, **When** der Athlet Herzfrequenz auswaehlt, **Then** zeigt die Ansicht Herzfrequenz gegen die sportbezogene Pace oder Geschwindigkeit.
2. **Given** importierte Aktivitaeten mit Pace und Kadenz, **When** der Athlet Kadenz auswaehlt, **Then** zeigt die Ansicht die sportgerecht bezeichnete Kadenz gegen die sportbezogene Pace oder Geschwindigkeit.
3. **Given** importierte Aktivitaeten mit Pace und Hoehengewinn oder Distanz, **When** der Athlet die entsprechende Metrik auswaehlt, **Then** zeigt die Ansicht nur Aktivitaeten mit dem jeweiligen gueltigen Metrikwert.
4. **Given** eine Aktivitaet ohne den Wert der gewaehlten Metrik, **When** die Ansicht gezeichnet wird, **Then** erscheint diese Aktivitaet nicht als Nullpunkt.

---

### User Story 2 - Jahre und Trendlinien steuern (Priority: P2)

Als Athlet moechte ich einzelne Jahre per Checkbox ein- oder ausblenden und Trendlinien separat schalten, damit ich Trainingsperioden vergleichen kann, ohne die gesamte Punktwolke zu verlieren.

**Why this priority**: Die bestehende Herzfrequenzansicht zeigt, dass Jahresvergleiche fuer langfristige Trainingsdaten zentral sind; die gemeinsame Ansicht muss dieses Verhalten fuer jede Metrik bewahren.

**Independent Test**: Ein Import mit qualifizierten Punkten aus mindestens zwei Jahren wird geladen. Das Ausschalten eines Jahres verbirgt dessen Punkte und zugehoerige Trendlinie; das Ausschalten der Trendlinien blendet nur Linien aus.

**Acceptance Scenarios**:

1. **Given** mindestens zwei Jahre mit qualifizierten Punkten fuer die aktive Metrik, **When** der Athlet eine Jahrescheckbox deaktiviert, **Then** verschwinden genau die Punkte und die Trendlinie dieses Jahres.
2. **Given** sichtbare Trendlinien, **When** der Athlet die Checkbox fuer Trendlinien deaktiviert, **Then** bleiben die Punkte sichtbar und alle Trendlinien werden ausgeblendet.
3. **Given** ein Jahr mit weniger als zwei qualifizierten Punkten, **When** die Ansicht angezeigt wird, **Then** bleibt dessen Punkt sichtbar, ohne eine nicht berechenbare Trendlinie zu erzwingen.

---

### User Story 3 - Unverfuegbare Metriken klar behandeln (Priority: P3)

Als Athlet moechte ich bei fehlenden Messwerten einen klaren Zustand sehen, damit ich verstehe, welche Aufzeichnung meinem Export fehlt und nicht von einem fehlerhaften Diagramm ausgehe.

**Why this priority**: Herzfrequenz und Kadenz sind geraeteabhaengig; Hoehengewinn und Distanz koennen bei einzelnen oder manuell erstellten Aktivitaeten ebenfalls fehlen.

**Independent Test**: Ein Import ohne Kadenzwerte wird geladen. Die Kadenzoption zeigt einen erklaerenden Leerzustand, waehrend andere verfuegbare Metriken weiterhin waehlbar und nutzbar bleiben.

**Acceptance Scenarios**:

1. **Given** keine qualifizierten Punkte fuer die aktive Metrik und den aktiven Sportfilter, **When** der Athlet diese Auswahl trifft, **Then** zeigt die Ansicht einen erklaerenden Leerzustand und kein leeres oder fehlerhaftes Diagramm.
2. **Given** der Kadenzfilter und eine Schwimmaktivitaet mit Kadenz, **When** die Kadenzdetails angezeigt werden, **Then** wird der Wert neutral als Schwimmrhythmus bezeichnet und nicht als unbestaetigte Zugfrequenz ausgegeben.
3. **Given** die gemeinsame Ansicht ersetzt zwei bisherige Ansichten, **When** der Athlet das Dashboard betrachtet, **Then** existiert nur noch ein Pace-versus-Metrik-Tab und die entfernte Einzelansicht ist nicht mehr als separater Tab erreichbar.

### Edge Cases

- Die Metrikoptionen Herzfrequenz, Kadenz, Hoehengewinn und Distanz bleiben bedienbar; fehlende Werte erzeugen einen Leerzustand statt einer deaktivierten oder irrefuehrenden Option.
- Kadenz wird fuer Run als Schrittfrequenz, fuer Bike als Trittfrequenz und fuer Swim als Schwimmrhythmus bezeichnet.
- Hoehengewinn und Distanz verwenden metrische Einheiten und werden nicht mit Kadenz oder Herzfrequenz verwechselt.
- Beim Wechsel von Metrik oder Sportfilter werden Jahrescheckboxen auf die fuer die aktuelle Punktmenge verfuegbaren Jahre abgestimmt; es bleiben keine unsichtbaren Altzustände zurueck.
- Punkte und Trendlinien einer Jahresgruppe verwenden stets dieselbe Jahreszuordnung.
- Bestehende Sportfilter und die Berechnung von Laufpace, Radgeschwindigkeit und Schwimmpace bleiben erhalten.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Anwendung MUSS die bisherigen separaten Ansichten fuer Herzfrequenz-gegen-Pace und Kadenz-gegen-Pace durch genau einen Dashboard-Tab mit dem Namen "Pace vs ..." ersetzen.
- **FR-002**: Der gemeinsame Tab MUSS einen Metrikfilter mit Herzfrequenz, Kadenz, Hoehengewinn und Distanz bereitstellen; der aktive Filter bestimmt die y-Achse und die Punktdetails.
- **FR-003**: Der gemeinsame Tab MUSS die Auswahl von genau einer Sportart aus Run, Bike oder Swim verlangen und DARF keine gemeinsame "All Sports"-Punktwolke anbieten; fuer jede qualifizierte Aktivitaet verwendet er Pace in Minuten pro Kilometer fuer Run, Geschwindigkeit in Kilometern pro Stunde fuer Bike und Pace in Minuten pro 100 Meter fuer Swim.
- **FR-004**: Die Anwendung MUSS je Metrik nur Aktivitaeten mit einem endlichen, positiven Metrikwert und einer gueltigen sportbezogenen Pace oder Geschwindigkeit darstellen.
- **FR-005**: Der Kadenzfilter MUSS Run als Schrittfrequenz, Bike als Trittfrequenz und Swim neutral als Schwimmrhythmus bezeichnen; Schritte duerfen nur bei Run-Punktdetails erscheinen, sofern sie vorhanden sind.
- **FR-006**: Der Hoehengewinnfilter MUSS Hoehengewinn in Metern und der Distanzfilter Distanz in Kilometern als y-Achse und Punktdetail anzeigen.
- **FR-007**: Die Anwendung MUSS je aktuelle Punktmenge eine Checkbox pro vorhandenem Kalenderjahr anzeigen; beim Deaktivieren eines Jahres MUESSEN dessen Punkte und dessen Trendlinie ausgeblendet werden.
- **FR-008**: Die Anwendung MUSS eine Checkbox fuer Trendlinien anbieten; beim Deaktivieren MUESSEN alle Trendlinien ausgeblendet werden, ohne die sichtbaren Punkte zu beeinflussen.
- **FR-009**: Die Anwendung MUSS Trendlinien nur fuer Kalenderjahre mit mindestens zwei qualifizierten Punkten berechnen und anzeigen.
- **FR-010**: Fuer eine aktive Metrik oder Sportfilterkombination ohne qualifizierte Punkte MUSS die Anwendung einen erklaerenden Leerzustand statt eines leeren oder fehlerhaften Diagramms anzeigen.
- **FR-011**: Die Umstellung MUSS deutsche und englische Strava-Exportspalten weiter unterstuetzen, importierte Rohdaten lokal verarbeiten und bestehende Dashboard-Tabs ausser den ersetzten Einzelansichten unveraendert lassen.

### Key Entities *(include if feature involves data)*

- **Pace-Metrikpunkt**: Ein Datenpunkt aus einer Aktivitaet mit sportbezogener Pace oder Geschwindigkeit als x-Wert, aktivem Metrikwert als y-Wert, Sportart, Datum und Kalenderjahr.
- **Metrikfilter**: Die Auswahl Herzfrequenz, Kadenz, Hoehengewinn oder Distanz, die Einheit, Beschriftung, Qualifikationsregel und Punktdetails bestimmt.
- **Jahresgruppe**: Alle qualifizierten Pace-Metrikpunkte eines Kalenderjahres mit gemeinsamer Sichtbarkeitscheckbox und optionaler Trendlinie.
- **Trendlinienstatus**: Die globale Auswahl, ob berechenbare Trendlinien sichtbarer Jahresgruppen angezeigt werden.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In einem Import mit qualifizierten Daten fuer alle vier Metriken erzeugt jede Metrik-Auswahl fuer 100 % ihrer qualifizierten Aktivitaeten genau einen Punkt und fuer keine unqualifizierte Aktivitaet einen Punkt.
- **SC-002**: In einem Import mit mindestens zwei qualifizierten Jahren wird bei 100 % der geprueften Jahrescheckboxen genau die zugehoerige Punkt- und Trendliniengruppe ein- oder ausgeblendet.
- **SC-003**: Bei 100 % der geprueften Betätigungen der Trendliniencheckbox veraendert sich nur die Sichtbarkeit von Trendlinien, nicht die Sichtbarkeit der aktivierten Jahrespunkte.
- **SC-004**: In 100 % der geprueften Kadenzdetails erscheinen Lauf-Schritte nur fuer Run, Bike-Trittfrequenz ohne Schritte und Schwimmrhythmus ohne unbestaetigte Zugbehauptung.
- **SC-005**: Bei fehlenden qualifizierten Werten fuer eine aktive Filterkombination erscheint in 100 % der geprueften Faelle innerhalb einer Sekunde ein erklaerender Leerzustand.
- **SC-006**: Mindestens 95 % der Testnutzer koennen nach einem Import innerhalb von 15 Sekunden eine der vier Metriken auswaehlen und einen zugehoerigen Datenpunkt lesen.

## Assumptions

- Der bisherige Sportfilter wird als verpflichtende Einzelsportauswahl Run, Bike oder Swim uebernommen; eine gemischte "All Sports"-Punktwolke ist ausgeschlossen, weil ihre x-Achse nicht vergleichbare Einheiten vermischen wuerde.
- Die bestehende Datumsbereichsauswahl der Herzfrequenzansicht bleibt Teil der gemeinsamen Ansicht.
- Herzfrequenz, Kadenz, Hoehengewinn und Distanz werden aus Aktivitaetsdurchschnitts- oder Gesamtwerten dargestellt, nicht aus sekundenweisen Zeitreihen.
- Der gemeinsame Tab uebernimmt die vorhandene jahrweise Farblogik und die Checkboxdarstellung der Herzfrequenzansicht.
- Ein Metrikfilter ohne passende Messwerte bleibt als Auswahl sichtbar und erklaert den fehlenden Messwert im Leerzustand.
- Diese Umstellung erweitert keine Exportfunktion und fuegt keinen neuen Netzwerkdienst hinzu.