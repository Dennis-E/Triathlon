---

description: "Abhängigkeitsgeordnete Aufgaben für lesbare Ausrüstungswerte, Tempo-Balken und Jahresauswahl"
---

# Tasks: Lesbare Ausrüstungswerte und dauerhafte Jahresauswahl

**Input**: Design aus `specs/043-equipment-pace-year-controls/` ([plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [UI-Vertrag](contracts/equipment-pace-years-ui.md), [quickstart.md](quickstart.md)).

**Tests**: Wegen Verfassungsprinzip III sind gezielte Root-Jest-Tests nach jeder Dashboard-/Utility-Änderung Pflicht; neue Tests erst rot schreiben, dann implementieren. Root-Jest läuft in Node ohne jsdom. Synthetische Daten statt persönlicher Strava-Exporte.

**Organization**: Eine Phase je User Story; die beiden P1-Stories nutzen nacheinander dasselbe Ausrüstungsmodul, die beiden P2-Stories nacheinander dasselbe Scatter-Modul. Kein Bundler, neue Dienste oder Tab-Wechsel.

## Format: `[ID] [P?] [Story] Beschreibung mit Pfad`

- **[P]**: Unabhängig in anderer Datei und ohne offene Abhängigkeit ausführbar.
- **[US1]–[US4]**: Entsprechen der Reihenfolge der User Stories in [spec.md](spec.md).
- Pfade in Aufgaben beziehen sich auf das Repository-Root; mit **„neu“** gekennzeichnete Testdateien werden bei Implementierung angelegt.

## Phase 1: Setup (Bestandsprojekt)

**Purpose**: Baseline und Skriptgrenzen sichern; kein neues Framework initialisieren.

- [X] T001 Bestehende Chart-/Import-/Export-Verdrahtung in `index.html`, `src/dashboard-equipment.js`, `src/dashboard-scatter.js` und `src/dashboard-export.js` mit dem UI-Vertrag `specs/043-equipment-pace-year-controls/contracts/equipment-pace-years-ui.md` abgleichen; sicherstellen, dass `equipmentChartWrapper` Export-Capture-Ziel bleibt und keine Tab-IDs geändert werden.

---

## Phase 2: Foundational (blockiert alle Stories)

**Purpose**: Bestehende Berechnungs- und Testgrenzen nachweisen, bevor neue Tests/Änderungen erfolgen.

- [X] T002 Baseline `npm test -- --runInBand __tests__/equipment-utils.test.js __tests__/heartrate-pace-visualization.test.js __tests__/index-script-syntax.test.js` im Root ausführen und die bestehende Signatur/Rückgabe `aggregateEquipmentPace()` in `src/equipment-utils.js` als unveränderliche Schnittstelle bestätigen.

**Checkpoint**: Vorhandene Suite grün, statische Skriptreihenfolge bleibt erhalten; beide Themenstränge können beginnen.

---

## Phase 3: User Story 1 – Ausrüstungswerte vollständig lesen (Priority: P1) 🎯 MVP

**Goal**: Balkenwerte bei 320–1440 px vollständig lesbar, notfalls in zwei Zeilen bzw. als vollständige Alternative innerhalb des Export-Wrappers; andere Beschriftungen und Kennzahlen behalten ihre Bedeutung.

**Independent Test**: Bei 320, 375, 768 und 1440 px Werte verschiedener Länge und alle vier Kennzahlen prüfen; kein Textüberstand oder Überschneiden, HTML-Ausweichwert lesbar und im Export-Capture enthalten. Benötigt US2–US4 nicht.

### Tests (vor Implementierung rot)

- [X] T003 [US1] In `__tests__/dashboard-equipment.test.js` (neu; Node-VM mit injiziertem `document`, Canvas-`measureText()` und `Chart`-Double) Regressionen für rechten Rand, ein-/zweizeiligen Wert, Zeilenabstand, vollständigen schmalen Alternativwert, Leerzustand und Wechsel zwischen `distance`/`pace`/`count`/`avgLength` formulieren und Fehlschlag bestätigen.

### Implementierung

- [X] T004 [P] [US1] In `index.html` innerhalb von `equipmentChartWrapper` einen responsiven, auch ohne Hover/Tastaturmaus erreichbaren Textbereich für vollständige Werte vorsehen; bestehende `equipmentEmptyState`, Canvas und Wrapper-ID für `src/dashboard-export.js` erhalten.
- [X] T005 [US1] In `src/dashboard-equipment.js` die Wertdarstellung an tatsächliche Canvasbreite und gemessene Textbreite binden, max. zwei vollständig sichtbare Zeilen plus Wrapper-Fallback vorsehen, Zeilen/Chart-Höhe dynamisch auseinanderhalten und bei Resize, Filter-/Kennzahlwechsel sowie Leerzustand konsistent aktualisieren; Namen links und Equipment-Timeline nicht verändern.
- [X] T006 [US1] Die Tests in `__tests__/dashboard-equipment.test.js` um Export-Wrapper-Sichtbarkeit und Neuzeichnen nach Größenwechsel ergänzen; fokussierten Test mit `npm test -- --runInBand __tests__/dashboard-equipment.test.js __tests__/index-script-syntax.test.js` ausführen und Fehler beheben.

**Checkpoint**: US1 funktioniert bei allen Kennzahlen ohne andere Stories; Equipment-Export enthält die sichtbaren vollständigen Werte.

---

## Phase 4: User Story 2 – Tempo anhand der Balken vergleichen (Priority: P1)

**Goal**: Beim Pace-Filter hat innerhalb der Art das schnellere Teil den längeren Balken; tatsächliche Schuh-Pace und Rad-Geschwindigkeit bleiben sichtbar, All zeigt keinen irreführenden sportartenübergreifenden Vergleich.

**Independent Test**: Je zwei Schuhe/Räder mit verschiedenen bzw. gleichen Tempi in All/Shoes/Bikes vergleichen; Achse 0–100 % pro Art, tatsächliche Werte samt Einheit in Balken und Tooltip, `aggregateEquipmentPace()` weiter unverändert. US3/US4 nicht nötig.

### Tests (vor Implementierung rot)

- [X] T007 [US2] In `__tests__/equipment-utils.test.js` gewichtete Aggregation `[name, minPerKm][]`, gemischte Ausrüstung, Gleichstände und Filter mit synthetischen Aktivitäten absichern sowie für eine geplante reine Präsentationsfunktion artbezogene Maxima, `barValue ∈ [0,1]` und identische Balkenlänge bei gleichem Tempo testen; Fehlschlag für die neue Funktion bestätigen.
- [X] T008 [P] [US2] In `__tests__/dashboard-equipment.test.js` (auf Basis US1) Rendering-Verträge für Rad `x.y km/h`, Schuh `mm:ss /km`, echte Tooltip-Werte, Prozentachse, Erklärtext/Art-Gruppen bei All und unveränderte nicht-Pace-Kennzahlen formulieren; Fehlschlag bestätigen.

### Implementierung

- [X] T009 [US2] In `src/equipment-utils.js` eine reine CommonJS- und `window.equipmentUtils`-Präsentationsfunktion für `type ∈ {Shoes,Bikes}`, `paceMinPerKm` als positive endliche ungerundete Zahl, `speedKmh = 60 / paceMinPerKm`, `maxSpeedOfType` als positive endliche Höchstgeschwindigkeit **derselben Art** und `barValue = speedKmh / maxSpeedOfType` ergänzen; `aggregateEquipmentPace()`-Signatur, Rückgabe und Sortierung unverändert lassen.
- [X] T010 [P] [US2] In `index.html` eine nur für `pace` sichtbare, knappe Erklärung innerhalb von `equipmentChartWrapper` ermöglichen: „100 % = schnellstes Teil derselben Art“; im All-Modus Shoes und Bikes erkennbar getrennt kennzeichnen, ohne neuen Tab oder neue Legende in der Equipment Timeline.
- [X] T011 [US2] In `src/dashboard-equipment.js` nur für `pace` die neue relative Balkengröße und nach Art gruppierte Darstellung im All-Modus nutzen, x-Achse als 0–100 % relativen Geschwindigkeitsvergleich bezeichnen und in Balkenende/Tooltip ausschließlich ungerundete, korrekt formatierte Original-Pace (`mm:ss /km`) bzw. Radgeschwindigkeit (`x.y km/h`) ausgeben; andere Kennzahlen und US1-Beschriftungsschutz beibehalten.
- [X] T012 [US2] `npm test -- --runInBand __tests__/equipment-utils.test.js __tests__/dashboard-equipment.test.js __tests__/index-script-syntax.test.js` ausführen und Regressionen bei Gleichstand, All, Shoes, Bikes und übrigen Kennzahlen in diesen Dateien beheben.

**Checkpoint**: US2 ist als Equipment-Teilfunktion ohne Jahresfeature nachweisbar; gleiche Tempi ergeben gleich lange Balken und All hat keine gemischte Pace-/Geschwindigkeitsachse.

---

## Phase 5: User Story 3 – Jahresbereiche gemeinsam schalten (Priority: P2)

**Goal**: Shift+Mausklick aktiviert/deaktiviert aktuell auswählbare Jahre vom letzten normalen Klick bis zum Zieljahr inklusive; Punkte und Trendlinien stimmen mit den Checkboxen überein.

**Independent Test**: Jahre 2020–2025 vorwärts und rückwärts, mit Lücken und ohne Anker schalten; nur Bereichsjahre wechseln, Trendliniencheckbox bleibt unabhängig. US1/US2/US4 nicht nötig.

### Tests (vor Implementierung rot)

- [X] T013 [US3] In `__tests__/dashboard-scatter-years.test.js` (neu; Node-VM, injizierte Checkbox-/Chart-Doubles) normalen Klick, Shift-Klick vor-/rückwärts, Zieljahr-Zustand an/aus, inklusiven Bereich nur über sichtbare Jahre, Klick ohne Anker, nur ein Jahr und unabhängige Trendlinien mit Dataset-Sichtbarkeit testen; Fehlschlag bestätigen.

### Implementierung

- [X] T014 [US3] In `src/dashboard-scatter.js` für die Jahrescheckboxen einen einzigen `click`-Pfad statt doppelter `change`-/`click`-Verarbeitung einsetzen; normalen Klick als neuen Anker merken und Shift+Klick auf den **neuen** Checkboxzustand des Ziels für alle aktuell sichtbaren Jahre im inklusiven Bereich anwenden, ungültigen Anker als Einzelklick behandeln und Checkboxen samt Chart-Sichtbarkeit einmal synchronisieren.
- [X] T015 [US3] In `src/dashboard-scatter.js` die separate Trendliniencheckbox und `updatePaceMetricsChartVisibility()` mit der Bereichsauswahl verknüpfen, ohne Trendlinien-Schalter umzuschalten; beim Render überlebenden Anker nur für tatsächlich sichtbare Jahre verwenden und per Tastatur ausgelöste Einzelaktionen erhalten.
- [X] T016 [US3] `npm test -- --runInBand __tests__/dashboard-scatter-years.test.js __tests__/heartrate-pace-visualization.test.js __tests__/index-script-syntax.test.js` ausführen und Unterschiede zwischen Checkbox- und Bubble-/Linien-Sichtbarkeit beheben.

**Checkpoint**: US3 bewirkt den verlangten Mehrfachklick innerhalb der aktuellen Ansicht, auch ohne Filterpersistenz aus US4.

---

## Phase 6: User Story 4 – Jahresauswahl beim Filterwechsel behalten (Priority: P2)

**Goal**: Ein deaktiviertes Jahr bleibt über Sport-, Metrik-, Datums- und Leerzustandswechsel innerhalb eines Imports deaktiviert; Neuimport setzt alles zurück; andere Tabs unbeeinflusst.

**Independent Test**: Jahr deaktivieren, zu Filter ohne dieses Jahr und zu leerer Kombination wechseln, zurückkehren und weiterhin deaktiviert sehen; neues Jahr erstmals an, frischer Import setzt Auswahl/Anker zurück. Keine Equipment-Änderung nötig.

### Tests (vor Implementierung rot)

- [X] T017 [US4] In `__tests__/dashboard-scatter-years.test.js` Tests für verschwundene/wiederkehrende abgewählte Jahre, bisher unbekannte Jahre, Datums- und Sport-/Metrikfilter, leer→zurück, ungültigen Anker und Reset bei `initPaceMetricsControls({reset:true})` über den bestehenden Aufruf in `src/dashboard-import.js` ergänzen; alte Reaktivierung durch `synchronizePaceMetricsYears()` reproduzieren.

### Implementierung

- [X] T018 [US4] In `src/dashboard-scatter.js` die Jahresauswahl als `disabledYears`-Ausschlussmenge `Set<Ganzzahl>` nur für „Pace vs ...“ im Browserspeicher führen, sichtbar nur Jahre mit qualifizierten Punkten anzeigen und `enabled = !disabledYears.has(year)` ableiten; ausgeschlossene Jahre bei temporärem Verschwinden, leerem Filter oder Datumswechsel niemals löschen; neue Jahre standardmäßig aktivieren.
- [X] T019 [US4] In `src/dashboard-scatter.js` beim Neuimport-Reset `disabledYears` und Bereichsanker leeren, über `src/dashboard-import.js` den vorhandenen Aufruf von `initPaceMetricsControls({reset:true})` als Integrationspunkt verifizieren und bestehende Trendlinien-/Datumseinstellungen nur im vorgesehenen Importpfad zurücksetzen; andere Visualisierungen nicht anfassen.
- [X] T020 [US4] `npm test -- --runInBand __tests__/dashboard-scatter-years.test.js __tests__/heartrate-pace-visualization.test.js __tests__/index-script-syntax.test.js` ausführen und die Regressionen für Rückkehrer, unbekannte Jahre, Leerzustand und Neuimport beheben.

**Checkpoint**: Alle vier Stories sind eigenständig abgenommen; nur „Pace vs ...“ teilt seine Jahresauswahl zwischen seinen eigenen Filtern.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Zusammenwirken, Browserverhalten, Bildexport und Datenschutzgrenzen prüfen.

- [X] T021 Browser-Skriptbrücken und gemeinsame Syntax nach Einbau der neuen Utility in `index.html`, `src/equipment-utils.js`, `src/dashboard-equipment.js`, `src/dashboard-scatter.js` und `__tests__/index-script-syntax.test.js` prüfen; keine globalen Namenskollisionen, keine geänderten Tab-IDs oder unnötigen API-/Import-Anpassungen.
- [X] T022 In `__tests__/dashboard-equipment.test.js` und `__tests__/dashboard-scatter-years.test.js` die Cross-Story-Regressionsfälle All→Shoes/Bikes bei 320 px, Export-Wrapper-Fallback sowie „Filterwechsel nach Shift-Bereich und zurück“ absichern und mit der Root-Test-Suite `npm test -- --runInBand` validieren.
- [X] T023 Mit `specs/043-equipment-pace-year-controls/quickstart.md` die manuelle Browserprüfung bei 320/375/768/1440 px, lokalem synthetischem Mehrjahres-Import, Equipment-Bildexport, tatsächlichem Shift+Klick und zweitem Import durchführen; Abweichungen in `src/dashboard-equipment.js` bzw. `src/dashboard-scatter.js` beheben und jeweils den engsten Root-Test erneut ausführen.
- [X] T024 Die Abnahmekriterien FR-001–FR-011 und SC-001–SC-006 aus `specs/043-equipment-pace-year-controls/spec.md` gegen `specs/043-equipment-pace-year-controls/contracts/equipment-pace-years-ui.md` und `specs/043-equipment-pace-year-controls/quickstart.md` abschließend prüfen; für SC-006 zwei Klicks und den erhaltenen Zustand nach Filterwechsel nachweisen, keine persönlichen Daten einchecken und keine neuen Netzwerkaufrufe einführen.

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (T001) → Foundational (T002) → Story-Phasen. Beide Phasen ändern keine Laufzeitlogik.
- Ausrüstungsstrang: US1 (T003–T006) → US2 (T007–T012), da beide `src/dashboard-equipment.js`, `index.html` und die Equipment-Tests berühren. Die Stories bleiben funktional getrennt testbar.
- Jahresstrang: US3 (T013–T016) → US4 (T017–T020), da beide `src/dashboard-scatter.js` und die Jahres-Tests berühren. US3 funktioniert bereits vor US4 für aktuell sichtbare Jahre.
- Die beiden Stränge sind nach T002 voneinander unabhängig; Polish (T021–T024) folgt nach beiden. Kein globaler Feature-Blocker über T002 hinaus.

### Within Each User Story

- Testaufgaben (T003, T007–T008, T013, T017) vor der jeweiligen Implementierung rot ausführen; die Tests der abgeschlossenen Story nach Codeänderungen grün ausführen.
- Für US1: T003 → T004/T005 → T006. Für US2: T007/T008 → T009/T010 → T011 → T012.
- Für US3: T013 → T014 → T015 → T016. Für US4: T017 → T018 → T019 → T020.
- Testläufe und Browser-QA gehören zur Implementierung, nicht zu dieser reinen Aufgabengenerierung.

### Parallel Opportunities

- Nach T002 können US1 und US3 von getrennten Bearbeitern parallel begonnen werden; danach US2 und US4 (getrennte Quellmodule).
- `[P]` auf T004 und T010: Markup in `index.html` kann nach seinen Tests parallel zu Codeänderungen in `src/dashboard-equipment.js` bzw. `src/equipment-utils.js` erfolgen. T008 schreibt in einer anderen Testdatei als T007; beide Tests können unabhängig formuliert werden, T008 setzt aber die fertiggestellte US1 voraus.
- T022 darf erst nach T021 und beiden Strängen starten; T023 kann anschließend die Tests durch manuelle Browserprüfung ergänzen.

### Parallel Examples

**US1**: Nach T003 kann ein Bearbeiter T004 (`index.html`) und ein anderer T005 (`src/dashboard-equipment.js`) vorbereiten; erst nach beiden T006 prüfen.

**US2**: Nach US1 können T007 (`__tests__/equipment-utils.test.js`) und T008 (`__tests__/dashboard-equipment.test.js`) parallel rot geschrieben werden; T009 und T010 betreffen unterschiedliche Dateien, T011 integriert danach die Anzeige.

**US3**: Nach T013 sind T014 und T015 bewusst nacheinander im selben `src/dashboard-scatter.js` auszuführen; gleichzeitig kann US1 am unabhängigen Ausrüstungsstrang arbeiten.

**US4**: Nach T017 sind T018 und T019 bewusst nacheinander im selben `src/dashboard-scatter.js` auszuführen; gleichzeitig kann US2 am unabhängigen Ausrüstungsstrang arbeiten.

## Implementation Strategy

### MVP First (US1)

1. T001–T002 abschließen, T003 rot schreiben, T004–T006 implementieren und grün verifizieren.
2. **STOP & VALIDATE**: Nur Ausrüstungswerte der bestehenden Kennzahlen bei schmalen Ansichten und Export prüfen; bereits eigenständiger Nutzwert ohne geänderte Tempo- oder Jahreslogik.

### Incremental Delivery

1. US1 → US2: Mit Prozent-Skala und korrekten Einheiten Tempo-Balken nachvollziehbar machen.
2. Parallel oder anschließend US3 → US4: Bereichsklick und danach filterübergreifende Persistenz nur im Pace-Metrik-Tab ergänzen.
3. T021–T024: Gesamttests und manuelle Browser-Validierung einschließlich Zwei-Klick-Abnahme für SC-006.

## Notes

- Markierung `[P]` bedeutet verschiedene Dateien und keine offene notwendige Vorarbeit; Story-Abhängigkeiten bleiben gültig.
- Testdateien `__tests__/dashboard-equipment.test.js` und `__tests__/dashboard-scatter-years.test.js` werden erst durch die entsprechenden Aufgaben erzeugt, nicht durch die Planung.
- Bei Änderungen an `src/` oder `index.html` gilt stets die engste passende Root-Jest-Suite; für API/CLI gibt es hier keine Aufgaben.