# Implementation Plan: Lesbare Ausrüstungswerte und dauerhafte Jahresauswahl

**Branch**: `043-equipment-pace-year-controls` | **Date**: 2026-09-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/043-equipment-pace-year-controls/spec.md`

## Summary

Die Balkenwerte der Ausrüstungsgrafik innerhalb der verfügbaren Breite halten (bei Bedarf zweizeilig bzw. als vollständig sichtbare schmale Alternative), Pace-Balken nach Geschwindigkeit mit artbezogener Vergleichsskala darstellen und weiterhin die echten Schuh-Pace- bzw. Rad-Geschwindigkeitswerte ausgeben. Die Checkboxen von „Pace vs ...“ erhalten eine Umschalt+Klick-Bereichsauswahl; die Jahreszustände bleiben über Sport-, Metrik- und Datumsfilter desselben Imports erhalten. Implementierung erfolgt in den vorhandenen statischen Dashboard-Skripten mit testbarer Logik in den vorhandenen Browser/Node-Utility-Modulen; Details und verworfene Alternativen in [research.md](research.md).

## Technical Context

**Language/Version**: Browser-JavaScript (ES2020+), CommonJS für Utility-Module unter Node.js (projektlokale Laufzeit, keine feste Version im Manifest)

**Primary Dependencies**: Chart.js (bereits im Browser geladen), bestehende Dashboard-Utilities; keine neue Laufzeitabhängigkeit

**Storage**: Importierte Aktivitäten und UI-Jahresauswahl ausschließlich im Browserspeicher; keine Persistenz

**Testing**: Jest 30 im Node-Testumfeld, isolierter Dashboard-Test mit DOM-/Chart-Doubles; ergänzend manuelle Browserprüfung für responsive Canvas-Labels und Export

**Target Platform**: Moderner Desktop- und Mobilbrowser, statisch ausgeliefert; 320–1440 px Ansichtsbreite

**Project Type**: Statische Browseranwendung ohne Bundler und Build

**Performance Goals**: Checkboxen und Diagramm werden bei einer Jahresauswahl gemeinsam aktualisiert, ohne zusätzlichen Netzwerkrundlauf.

**Constraints**: Keine neuen Netzwerkzugriffe für importierte Daten, keine Änderungen an externen APIs; Wrapper-Inhalt muss im bestehenden Bildexport lesbar bleiben; bestehende CommonJS/`window.*`-Brücken und öffentliche Aggregationssignaturen erhalten

**Scale/Scope**: Zwei Dashboard-Panels („Equipment mileage“, „Pace vs ...“), vier Ausrüstungskennzahlen und Jahresreihen über mindestens sechs Jahre; keine Änderungen an anderen Tabs

## Constitution Check

*GATE: Vor Phase 0 geprüft und nach Phase 1 erneut bestätigt. Kein begründungsbedürftiger Verstoß.*

| Verfassungsprinzip | Vor Research | Nach Design | Maßnahme |
|---|---|---|---|
| I. Static Browser-First Delivery | PASS | PASS | Bestehende Skriptreihenfolge und CDN-Chart.js; kein Bundler. |
| II. Dual-Target Reusable Modules | PASS | PASS | Neue reine Berechnungs-/Zustandshelfer bei Bedarf als CommonJS + `window.*`; DOM-/Chart-Anbindung verbleibt in Dashboard-Dateien. |
| III. Narrowest-Scope Test-First Verification | PASS | PASS | Gezielte Jest-Tests für Aggregation, Darstellung, Jahresauswahl und Skriptsyntax; Browser-Layout und Export zusätzlich visuell prüfen. Kein Tabwechsel. |
| IV. Faithful Locale-Aware Data Parsing | PASS | PASS | Nur normalisierte Aktivitäten verwenden; CSV/GPX-Parsing, Sport-Normalisierung und Einheiten-Semantik nicht verändern. |
| V. Explicit Privacy & Network Boundaries | PASS | PASS | Filterzustände nur im Speicher; keine Übertragung importierter Aktivitäten oder neue externe Schnittstellen. |
| Repository-/Dependency-Grenzen und fokussierte Änderungen | PASS | PASS | Nur Root-Frontend und -Tests; API und CLI unangetastet; `aggregateEquipmentPace()` unverändert. |

## Project Structure

### Documentation (this feature)

```text
specs/043-equipment-pace-year-controls/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
├── checklists/requirements.md
└── contracts/equipment-pace-years-ui.md
```

### Source Code (repository root)
```text
index.html                           # Equipment-Wrapper/ggf. schmaler Textbereich
src/
├── dashboard-equipment.js           # Chart-Werte, responsives Layout, Axis/Tooltip
├── equipment-utils.js               # vorhandene Pace-Aggregation; pure Präsentationshilfe bei Bedarf
├── dashboard-scatter.js             # Shift-Klick und importbezogener Jahreszustand
├── dashboard-import.js              # bestehender Import-Reset als Integrationspunkt
├── dashboard-core.js                # vorhandene Pace-/Geschwindigkeitsformatierer
└── dashboard-export.js              # bestehender Wrapper-Capture; nur bei Bedarf aktualisieren
__tests__/
├── equipment-utils.test.js          # Aggregation und artbezogene Balkensemantik
├── heartrate-pace-visualization.test.js # vorhandenes Verhalten der Jahresgruppen
├── dashboard-equipment.test.js       # geplante Rendering-/Label-Regressionen mit Chart-Double
├── dashboard-scatter-years.test.js   # geplante Interaktions-/Reset-Regressionen mit Node-VM
└── index-script-syntax.test.js       # bestehende Skriptreihenfolge und Syntax
```

**Structure Decision**: In-place-Weiterentwicklung des Root-Frontends statt neuer App-Struktur; vorgeschlagene Testdateien werden erst bei Implementierung angelegt. Keine Tab-IDs oder Reihenfolge ändern.

## Complexity Tracking

Keine Verfassungsverstöße oder zusätzlichen Infrastrukturkomponenten geplant.
