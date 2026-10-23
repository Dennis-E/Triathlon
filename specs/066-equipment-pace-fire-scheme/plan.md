# Implementation Plan: Fire-Farbschema für Equipment-Pace

**Branch**: `066-equipment-pace-fire-scheme` | **Date**: 2026-10-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification in `specs/066-equipment-pace-fire-scheme/spec.md`

## Summary

Bei einzeln ausgewähltem „Shoes“ oder „Bikes“ färbt die Equipment-Pace-Ansicht ihre Balken mit dem bestehenden Fire-Farbverlauf nach relativer Geschwindigkeit ein. Die vorhandene `getFireGradientColor`-Funktion und der bestehende Pace-Wert `barValue` vermeiden eine zweite Palette oder eine Änderung der Aggregation. Bei „All“ bleiben die Typfarben Lila/Türkis erhalten; andere Kennzahlen bleiben unverändert. Details und geprüfte Entscheidungen stehen in [research.md](research.md).

## Technical Context

**Language/Version**: Browser-JavaScript, kompatibel mit dem im Repository verwendeten Node.js/Jest-Testlauf

**Primary Dependencies**: Chart.js (bereits in der statischen App geladen); `window.distributionUtils.getFireGradientColor` aus `src/distribution-utils.js`

**Storage**: N/A; es werden keine Daten gespeichert oder persistente Einstellungen ergänzt

**Testing**: Jest im Node-Environment; fokussiert `__tests__/dashboard-equipment.test.js`

**Target Platform**: Statische Browser-App, ohne Bundler oder Build-Schritt

**Project Type**: Bestehende statische Webanwendung

**Performance Goals**: Kein neues Leistungsziel erforderlich; pro Equipment-Zeile wird nur die schon vorhandene relative Kennzahl in eine Farbe übersetzt

**Constraints**: „All“ behält Lila/Türkis; Nicht-Pace-Kennzahlen behalten ihre bestehenden Farben. `distribution-utils.js` wird vor `dashboard-equipment.js` geladen. Importdaten und Aggregationswerte bleiben unverändert.

**Scale/Scope**: Bestehende Equipment-Visualisierung und ihr bestehender Chart-Test; keine neue Registerkarte, kein Import-/Export- oder API-Verhalten

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Vor Phase 0: PASS**

- I. Static Browser-First Delivery: Änderung verbleibt in der bestehenden statischen UI und benötigt keinen Build-Schritt.
- II. Dual-Target Reusable Modules: Es wird keine neue wiederverwendbare Geschäftslogik eingeführt; die bestehende browserfähige Fire-Funktion wird verwendet.
- III. Narrowest-Scope Test-First Verification: Dashboard-Verhalten wird durch den fokussierten Equipment-Jest-Test geprüft. Es wird keine Dashboard-Registerkarte ergänzt; der bestehende Exportpfad bleibt unverändert.
- IV. Faithful Locale-Aware Data Parsing: CSV-/GPX-Verarbeitung und Sportnormalisierung werden nicht berührt.
- V. Explicit Privacy & Network Boundaries: Keine neuen Netzwerkaufrufe; importierte Trainingsdaten bleiben lokal.

**Nach Phase 1: PASS**

- Der Entwurf ändert weder öffentliche Daten-/Modul-APIs noch Persistenz, Netzwerkverhalten oder Exportzuordnung.
- Alle Änderungen bleiben auf Equipment-Chart-Farben und deren fokussierte Tests begrenzt.

## Project Structure

### Documentation (this feature)

```text
specs/066-equipment-pace-fire-scheme/
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   └── equipment-pace-chart.md
├── quickstart.md
└── tasks.md             # Wird in Phase 2 durch /speckit-tasks erstellt
```

### Source Code (repository root)

```text
src/
├── dashboard-equipment.js    # Equipment-Chart-Darstellung
└── distribution-utils.js     # Vorhandener Fire-Farbverlauf
__tests__/
└── dashboard-equipment.test.js
```

**Structure Decision**: Die bestehende DOM-Orchestrierung in `src/dashboard-equipment.js` bleibt für die Auswahl zuständig. Sie nutzt das bereits vorab geladene Farbschema-Utility. Die bestehenden Jest-Tests erweitern den Chart-Harness; ein neuer Utility-Baustein oder eine Änderung an `index.html` ist nicht vorgesehen.

## Complexity Tracking

Keine Constitution-Verstöße oder zusätzlichen Architekturkomponenten.
