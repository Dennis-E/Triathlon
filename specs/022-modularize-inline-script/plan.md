# Implementation Plan: Inline-Script von index.html in Feature-Module aufteilen

**Branch**: `022-modularize-inline-script` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/022-modularize-inline-script/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

`index.html` enthält einen einzigen monolithischen Inline-`<script>`-Block von ca. 4.540 Zeilen
([index.html](../../index.html#L1570-L6110)), der Import-Flow, Dashboard-Aggregation,
alle Chart-Rendering-Domänen (Equipment, Distributions, Scatter, Heatmap, Power-PBs), Export/Sharing
und Tab-Wiring/Bootstrap-Code vermischt. Der technische Ansatz: den Block anhand der bereits
identifizierten Domänengrenzen in benannte, klassische `src/dashboard-<bereich>.js`-Dateien
aufteilen, die per `<script src="...">` in der bisherigen, abhängigkeitskorrekten Reihenfolge
geladen werden — ohne Bundler, ohne ESM-Umbau, ohne Verhaltensänderung. Geteilter Zustand
(z. B. `processedActivities`) wandert in eine zuerst geladene `src/dashboard-state.js`. Der
bestehende Syntax-Check-Test wird erweitert, um auch die neuen Dateien zu prüfen.

## Technical Context

**Language/Version**: Vanilla JavaScript (ES2017+), CommonJS für Jest (Node.js, `node`-Environment)

**Primary Dependencies**: Chart.js, PapaParse, html2canvas, Lucide Icons (alle via CDN `<script>`-Tags), Leaflet (zur Laufzeit dynamisch nachgeladen für die Heatmap)

**Storage**: N/A — rein clientseitig, kein Persistenzlayer; Zustand lebt nur in globalen JS-Variablen im Browser-Tab

**Testing**: Jest (Root, `node`-Environment, kein `jsdom`); betroffen sind primär [__tests__/index-script-syntax.test.js](../../__tests__/index-script-syntax.test.js) sowie alle bestehenden Modul-Tests unter `__tests__/`, die unverändert bleiben müssen

**Target Platform**: Statische Browser-App, lauffähig über `python -m http.server`, kein Node-Runtime-Anteil im Auslieferungspfad

**Project Type**: Single-Page-Static-Web-App (Frontend-only für dieses Feature; `services/api/` bleibt unberührt)

**Performance Goals**: Keine neuen Performance-Ziele; bestehende Ladezeiten/Render-Verhalten müssen erhalten bleiben (zusätzliche `<script src>`-Requests sind akzeptabel, da bereits 9 solcher Dateien geladen werden)

**Constraints**: Kein Bundler/Build-Step; klassische, nicht-modulare Skripte mit globalem Scope; Ladereihenfolge der `<script src>`-Tags MUSS die tatsächlichen Abhängigkeiten zwischen den neuen Dateien und den bestehenden `src/`-Modulen widerspiegeln; keine inhaltliche Änderung an bestehenden `src/`-Modulen (FR-005)

**Scale/Scope**: ~4.540 Zeilen Inline-Code werden auf ca. 9–10 neue Dateien unter `src/` verteilt; `index.html` schrumpft entsprechend; keine neuen Endnutzer-Features

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery** — PASS. Es wird kein Bundler/Build-Step eingeführt; alle neuen Dateien werden als klassische `<script src="...">`-Tags eingebunden und bleiben mit `python -m http.server` lauffähig.
- **II. Dual-Target Reusable Modules** — PASS. Die neuen `src/dashboard-<bereich>.js`-Dateien sind **DOM-Orchestrierung**, kein wiederverwendbares, datenverarbeitendes Modul wie `equipment-utils.js`. Sie werden bewusst **nicht** als CommonJS-Module mit `window.*`-Bridge implementiert (das entspricht dem Status quo des Inline-Codes, der ebenfalls nicht Jest-importierbar ist) — FR-004/FR-012 verbieten explizit einen ESM-/Modul-Umbau in diesem Feature. Dies ist seit Constitution v1.0.1 explizit durch eine Klarstellung in Principle II gedeckt (DOM-Orchestrierungsdateien ohne eigenständige wiederverwendbare Logik bleiben Teil der `index.html`-Domäne aus Principle I). Reine Datenlogik, die zufällig im Inline-Block mit auftaucht (z. B. `processData`, `parseGermanDate`), wird NICHT nach `src/dashboard-utils.js` verschoben oder mit diesem konsolidiert, da dieses Modul laut [research.md](./research.md) bereits ein bekannter, test-only Duplikat-Sonderfall ist, dessen Bereinigung außerhalb des Scopes dieses reinen Reorganisations-Features liegt.
- **III. Narrowest-Scope Test-First Verification** — PASS mit Auflage: Nach jeder Extraktion wird `npm test` (Root) ausgeführt; da keine dashboard-Tabs umbenannt/verschoben werden, ist keine Anpassung an `src/tab-navigation.js` nötig. [__tests__/index-script-syntax.test.js](../../__tests__/index-script-syntax.test.js) MUSS überarbeitet werden (siehe research.md), da seine bestehenden `inlineCode`-Assertions sonst valide fehlschlagen.
- **IV. Faithful Locale-Aware Data Parsing** — PASS. CSV/GPX-Parsing-Code wird 1:1 verschoben, keine Semantikänderung an Spalten-Erkennung, Sport-Normalisierung oder Distance/Distanz-Interpretation.
- **V. Explicit Privacy & Network Boundaries** — PASS. `services/api/` und dessen Contract (Origin-Checks, Client-Key, Rate-Limiting, Firestore) werden nicht angefasst; Import bleibt lokal im Browser.

Kein Constitution-Verstoß, der einen Eintrag in Complexity Tracking erfordert.

**Post-Design Re-Check (nach Phase 1)**: Die in data-model.md und contracts/script-load-order.md
getroffenen Entscheidungen (zentrale State-Datei, unveränderte Ladereihenfolge-Abhängigkeiten,
keine Änderung an bestehenden `src/`-Modulen inkl. `dashboard-utils.js`) bestätigen alle fünf
Prinzipien weiterhin als PASS. Keine neuen Verstöße eingeführt.

## Project Structure

### Documentation (this feature)

```text
specs/022-modularize-inline-script/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── script-load-order.md  # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
index.html                     # Deutlich verkleinert: Markup + <script src="..."> Einbindungen
                                # + minimaler verbleibender Inline-Rest (Bootstrap-Aufruf am Ende)

src/
├── tab-navigation.js          # bestehend, unverändert
├── scatter-utils.js           # bestehend, unverändert
├── distribution-utils.js      # bestehend, unverändert
├── equipment-utils.js         # bestehend, unverändert
├── export-utils.js            # bestehend, unverändert
├── power-pb-utils.js          # bestehend, unverändert
├── zip-importer.js            # bestehend, unverändert
├── heatmap-utils.js           # bestehend, unverändert
├── analysis-counter.js        # bestehend, unverändert
├── dashboard-utils.js         # bestehend, unverändert (bekannter test-only Duplikat-Sonderfall)
│
├── dashboard-state.js         # NEU — geteilter globaler Zustand (processedActivities, ...), zuerst geladen
├── dashboard-core.js          # NEU — generische Date/Format-Helfer + Dashboard-Aggregation/-Rendering (Total-Distance-Chart)
├── dashboard-import.js        # NEU — Import-Flow-Orchestrierung (CSV/ZIP-Ingestion, Import-/Preview-Gate-Modals)
├── dashboard-equipment.js     # NEU — Equipment-Chart-Rendering
├── dashboard-distributions.js # NEU — Distributions-Chart-Rendering
├── dashboard-scatter.js       # NEU — Scatter-/Heartrate-Pace-Chart-Rendering
├── dashboard-heatmap.js       # NEU — Heatmap-Rendering (inkl. Leaflet-Lazy-Load)
├── dashboard-power-pb.js      # NEU — Power-PB-Orchestrierung (renderPbChart & Detail-Overlay)
├── dashboard-export.js        # NEU — Export/Sharing-Komposition (Export-Vorschau-Modal, html2canvas)
└── dashboard-tabs.js          # NEU — Tab-Wiring + Bootstrap-Init (lädt zuletzt, startet setVisualizationTab)

__tests__/
└── index-script-syntax.test.js  # überarbeitet: prüft Inline-Rest UND alle neuen dashboard-*.js-Dateien
```

**Structure Decision**: Neue Dateien leben unter `src/` neben den bestehenden Modulen, um mit der
bestehenden Projektstruktur konsistent zu bleiben (Assumptions in spec.md). Die Reihenfolge der
`<script src>`-Tags in `index.html` folgt exakt der Abhängigkeitsreihenfolge:
`dashboard-state.js` → `dashboard-core.js` → `dashboard-import.js` → Chart-Domänen
(`dashboard-equipment.js`, `dashboard-power-pb.js`, `dashboard-distributions.js`,
`dashboard-scatter.js`, `dashboard-heatmap.js`) → `dashboard-export.js` → `dashboard-tabs.js`
(lädt zuletzt, da es den initialen `setVisualizationTab(...)`-Aufruf auslöst). Details und
Begründung in [research.md](./research.md) und [contracts/script-load-order.md](./contracts/script-load-order.md).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Keine Einträge — keine ungerechtfertigten Constitution-Verstöße.

