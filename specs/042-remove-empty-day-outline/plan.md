# Implementation Plan: Remove Empty-Day Calendar Outlines

**Branch**: `042-remove-empty-day-outline` | **Date**: 2026-09-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/042-remove-empty-day-outline/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Die helle Standardumrandung wird nur von datumsbezogenen Kalenderfeldern ohne Aktivität entfernt. Aktive Tagesfelder, neutrale Füllfarbe, Fokusindikator, Legende und äussere Kalenderrahmen bleiben erhalten. Die Anpassung ist eine bedingte Darstellungsänderung im bestehenden Kalender-Renderer; Datenmodell, Speicherung und externe Schnittstellen ändern sich nicht.

## Technical Context

**Language/Version**: JavaScript, browser-native; Node.js for Jest tests

**Primary Dependencies**: Existing browser DOM and Tailwind utility classes; no new dependencies

**Storage**: N/A; day activity state is derived from the currently filtered imported data

**Testing**: Jest in Node (`npm test`); browser smoke and visual validation via the static app

**Target Platform**: Modern desktop and mobile browsers served from a static web host

**Project Type**: Static browser application

**Performance Goals**: No measurable render cost beyond the existing per-cell class selection

**Constraints**: No bundler or build step; preserve keyboard focus visibility, active-day appearance, local processing, palettes, filters, and multi-year rendering

**Scale/Scope**: One focused conditional presentation change for all calendar day cells; no data or API changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Static Browser-First Delivery**: PASS — reuse the existing static dashboard renderer; no build tooling or network capability is added.
- **II. Dual-Target Reusable Modules**: PASS — the change is presentation-only in the existing DOM-orchestration script; no reusable business logic is introduced.
- **III. Narrowest-Scope Test-First Verification**: PASS — run the existing focused Jest suites and perform browser verification; no tab navigation is changed.
- **IV. Faithful Locale-Aware Data Parsing**: PASS — parsing and sport normalization are untouched.
- **V. Explicit Privacy & Network Boundaries**: PASS — no data leaves the browser and no API behavior changes.
- **Repository/dependency boundaries**: PASS — no dependency, storage, CLI, or service changes.

**Post-design re-check**: PASS — Phase 1 introduces no new entities, interfaces, dependencies, or architecture; all constitution gates remain satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/042-remove-empty-day-outline/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/
└── dashboard-training-calendar.js
__tests__/
├── index-script-syntax.test.js
└── training-calendar-utils.test.js
```

**Structure Decision**: Die bestehende Dashboard-Orchestrierung in `src/dashboard-training-calendar.js` ist die einzige produktive Änderungsstelle. Die vorhandenen Jest-Suiten decken Skriptsyntax und Kalenderdaten ab; die sichtbare Darstellung wird zusätzlich im Browser geprüft. Es gibt keine externe Schnittstelle, daher ist kein `contracts/`-Verzeichnis erforderlich.
