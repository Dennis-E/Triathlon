---
description: "Ausführbare Aufgaben für das Fire-Farbschema bei Equipment-Pace"
---

# Tasks: Fire-Farbschema für Equipment-Pace

**Input**: Design documents from `/specs/066-equipment-pace-fire-scheme/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/equipment-pace-chart.md`, `quickstart.md`

**Tests**: Ein fokussierter Jest-Test ist gemäß Constitution III erforderlich. Der Test wird vor der Implementierung erweitert.

**Organization**: Aufgaben sind nach User Story gruppiert; die einzige Story ist unabhängig abnehmbar.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Nur für Aufgaben, die parallel in verschiedenen Dateien und ohne offene Abhängigkeiten erledigt werden können.
- **[Story]**: User-Story-Zuordnung; erforderlich bei Story-Aufgaben.
- Alle Aufgaben nennen die konkreten Projektpfade.

## Phase 1: Setup

**Purpose**: Vorhandenes Projekt und Testgerüst verwenden; zusätzliche Initialisierung ist nicht erforderlich.

Keine Setup-Aufgaben. Die statische App, Jest-Konfiguration und Equipment-Chart-Harness sind bereits vorhanden.

---

## Phase 2: Foundational

**Purpose**: Gemeinsame, alle Stories blockierende Infrastruktur bereitstellen.

Keine Foundational-Aufgaben. Es gibt keine neue Abhängigkeit, Datenstruktur, API oder gemeinsame Infrastruktur.

---

## Phase 3: User Story 1 - Pace-Leistung mit Fire-Farben erkennen (Priority: P1) - MVP

**Goal**: Einzelne Shoes- oder Bikes-Pace-Ansichten verwenden die bestehende Fire-Skala; „All“ und Nicht-Pace-Kennzahlen behalten ihre bisherigen Farben und Werte.

**Independent Test**: `npm test -- --runInBand __tests__/dashboard-equipment.test.js` bestätigt Fire-Farben für langsame/schnelle Shoes und Bikes, bisherige Typfarben für „All“ und unveränderte Farben für andere Kennzahlen.

### Tests for User Story 1

> Tests zuerst ergänzen und vor der Implementierung fehlschlagen lassen.

- [X] T001 [US1] Erweitere den Chart-Harness in `__tests__/dashboard-equipment.test.js` um `distributionUtils` und prüfe Fire-Farben für Shoes/Bikes sowie Lila/Türkis für „All“ und Nicht-Pace-Kennzahlen; bestätige den Fehlschlag vor der Implementierung.

### Implementation for User Story 1

- [X] T002 [US1] Passe `src/dashboard-equipment.js` so an, dass Pace-Balken bei Filter `Shoes` oder `Bikes` `getFireGradientColor(row.barValue)` verwenden und „All“ sowie andere Kennzahlen ihre bestehenden Typfarben behalten.
- [X] T003 [US1] Führe `npm test -- --runInBand __tests__/dashboard-equipment.test.js` aus und behebe featurebezogene Fehler.

**Checkpoint**: Die isolierten Shoes-/Bikes-Pace-Ansichten verwenden Fire; „All“, Nicht-Pace-Farben, angezeigte Werte und Einheiten bleiben unverändert.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Sichtbares Verhalten im Browser gegen die dokumentierten Szenarien absichern.

- [X] T004 Führe die manuellen Browserprüfungen aus `specs/066-equipment-pace-fire-scheme/quickstart.md` durch und bestätige Farbrichtung, „All“-Typfarben, Beschriftungen, Einheiten und Leerzustand.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Keine Änderungen erforderlich; vorhandenes Projekt kann direkt verwendet werden.
- **Foundational (Phase 2)**: Keine Änderungen erforderlich; keine gemeinsamen Blocker.
- **User Story 1 (Phase 3)**: Kann sofort beginnen; Testaufgabe T001 muss vor Implementierung T002 abgeschlossen sein.
- **Polish (Phase 4)**: T004 folgt auf die Implementierung und den fokussierten Test.

### User Story Dependencies

- **User Story 1 (P1)**: Unabhängig und einziger Lieferumfang; kein Abhängigkeitsverhältnis zu anderen Stories.

### Within User Story 1

- T001 → T002 → T003 → T004.
- Keine Aufgaben sind parallelisierbar: Test und Implementierung berühren aufeinander abgestimmte Oberflächen; der Browser-Smoke-Check setzt die funktionierende Implementierung voraus.

## Parallel Opportunities

Für diese Story gibt es keine sicheren parallelen Aufgaben. Alle Aufgaben bilden eine kurze abhängige Kette; daher wird kein Parallel-Ausführungsbeispiel angegeben.

## Implementation Strategy

### MVP First

1. T001 als Test zuerst ergänzen und den erwarteten Fehlschlag beobachten.
2. T002 nur für die Pace-Farbzuordnung umsetzen.
3. T003 als fokussierte Verifikation ausführen.
4. T004 gegen die Browser-Szenarien prüfen.

Die P1-Story ist das vollständige MVP; weitere Stories sind nicht definiert.

## Notes

- **[P]** wird bewusst nicht verwendet, da keine Aufgaben unabhängig parallel erledigt werden können.
- Die Fire-Farbwerte werden über das bestehende `src/distribution-utils.js`-Utility bezogen; Palette und Pace-Aggregation werden nicht dupliziert oder geändert.
- „All“ muss seine bestehenden Shoes-/Bikes-Typfarben behalten.