---

description: "Ausführbare Aufgaben für das Entfernen der Kontur trainingsfreier Kalendertage"
---

# Tasks: Remove Empty-Day Calendar Outlines

**Input**: Design documents from `/specs/042-remove-empty-day-outline/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [quickstart.md](quickstart.md)

**Tests**: Keine neuen Tests werden angelegt, da die Spezifikation keine Testentwicklung verlangt. Bestehende Jest-Suiten und die Browserprüfung werden als Verifikation ausgeführt.

**Organization**: Aufgaben sind nach der einzigen User Story geordnet, damit die Änderung unabhängig implementiert und geprüft werden kann.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Kann parallel ausgeführt werden, ohne Abhängigkeit von einer noch nicht abgeschlossenen Aufgabe.
- **[Story]**: User-Story-Zuordnung aus `spec.md`.
- Jede Aufgabe nennt den konkreten Dateipfad.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Projektinitialisierung und gemeinsame Infrastruktur.

Für dieses bestehende statische Projekt sind keine Setup-Änderungen erforderlich: Renderer, Jest und Browser-Startverfahren sind vorhanden.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Blockierende gemeinsame Voraussetzungen für User Stories.

Keine zusätzlichen grundlegenden Änderungen erforderlich; der vorhandene Kalender liefert bereits den Aktivitätszustand für jedes Tagesfeld.

## Phase 3: User Story 1 - Trainingsfreie Kalendertage ohne helle Kontur sehen (Priority: P1) 🎯 MVP

**Goal**: Trainingsfreie Datumsfelder ohne helle Standardumrandung darstellen, ohne aktive Tagesfelder, Füllfarben oder Fokusbedienung zu verändern.

**Independent Test**: Eine Kalenderansicht mit aktiven und trainingsfreien Tagen zeigt die trainingsfreien Felder ohne sichtbare helle Umrandung. Aktive Felder behalten ihre Füllung und Darstellung; dies gilt nach Wechsel von Palette, Sportfilter und Kalenderjahr. Tastaturfokus bleibt sichtbar.

### Implementation for User Story 1

- [X] T001 [US1] In `src/dashboard-training-calendar.js`, passe `createTrainingCalendarCell()` so an, dass datumsbezogene Tage ohne Aktivität keine helle Standardumrandung erhalten; aktive Zellen, Füllfarben und Tastatur-Fokusindikator bleiben unverändert.
- [X] T002 [P] [US1] Prüfe die Browser-Szenarien aus `specs/042-remove-empty-day-outline/quickstart.md` für aktive/leere Tage, alle Paletten, Sportfilter, mehrere Kalenderjahre und Tastaturfokus.

**Checkpoint**: Die Story ist unabhängig testbar und erfüllt FR-001 bis FR-004 sowie SC-001 bis SC-004.

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Bestehende Regressionen und Gesamtverhalten nach der Änderung prüfen.

- [X] T003 [P] Führe `npm test -- --runInBand __tests__/index-script-syntax.test.js __tests__/training-calendar-utils.test.js` gemäss `specs/042-remove-empty-day-outline/quickstart.md` aus und behebe durch die Renderer-Änderung verursachte Fehler.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Keine Aufgaben; bestehende Infrastruktur wird weiterverwendet.
- **Foundational (Phase 2)**: Keine Aufgaben; es gibt keine blockierenden Vorarbeiten.
- **User Story 1 (Phase 3)**: Kann unmittelbar beginnen.
- **Polish (Phase 4)**: Verifikation setzt die abgeschlossene Änderung aus T001 voraus.

### User Story Dependencies

- **User Story 1 (P1)**: Keine Abhängigkeit von anderen User Stories.

### Task Dependencies

- **T001** muss vor den Verifikationsaufgaben abgeschlossen sein.
- **T002** und **T003** können nach T001 parallel ausgeführt werden.

### Parallel Opportunities

- Nach T001 können die Browserprüfung T002 und die automatisierte Jest-Prüfung T003 parallel laufen; sie prüfen unabhängige Verifikationswege.
- Es gibt nur eine User Story, daher bestehen keine Parallelisierungsmöglichkeiten zwischen Stories.

## Parallel Example: User Story 1

```text
Nach Abschluss von T001:
- T002: Browser-Szenarien gemäss specs/042-remove-empty-day-outline/quickstart.md prüfen
- T003: Fokussierte Jest-Suites gemäss specs/042-remove-empty-day-outline/quickstart.md ausführen
```

## Implementation Strategy

### MVP First (User Story 1)

1. T001 umsetzen: nur die helle Standardumrandung der trainingsfreien Tagesfelder entfernen.
2. T002 und T003 parallel ausführen und die Story unabhängig validieren.
3. MVP ist abgeschlossen, sobald beide Verifikationswege erfolgreich sind und die Akzeptanzkriterien der User Story erfüllt sind.

### Incremental Delivery

Es gibt nur eine Story: Nach dem einzelnen fokussierten Renderer-Schritt wird die Änderung browserseitig und automatisiert validiert; weitere Stories oder Datenmodelländerungen sind nicht erforderlich.

## Notes

- `[P]` ist nur für voneinander unabhängige Verifikationsaufgaben nach T001 gesetzt.
- Es werden keine neuen Testdateien, Abhängigkeiten, Datenfelder oder externen Schnittstellen angelegt.
- Aufgaben mit `[US1]` gehören zur User-Story-Phase; Setup, Foundations und Polish bleiben ohne Story-Label.
