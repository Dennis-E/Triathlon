# Implementation Plan: Herzfrequenz-Min-/Max-Entwicklung

**Branch**: Git `main` (unveraendert); Spec-Kit-Kontext `080-heart-rate-min-max` | **Date**: 2026-11-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/080-heart-rate-min-max/spec.md`.
**Status**: Planung bis einschliesslich Phase 1 abgeschlossen; keine Implementierung und keine Aufgabenliste erstellt.

## Summary

Ein neuer Dashboard-Tab `heartRate` zeigt ausschliesslich explizite trainingsbezogene Min-/Max-Herzfrequenzen als zwei chronologische Punktreihen. Optionale normalisierte Extremfelder werden quellengetreu ergaenzt; bisherige Felder, Identitaeten, Zaehlungen und Berechnungen bleiben unveraendert. Ein einzelner gueltiger Wert genuegt fuer die importweite Verfuegbarkeit. Ein globaler Filter-Leerzustand versteckt den Tab nicht.

Die Loesung verwendet vorhandenes Chart.js, die bestehenden Sport-/Zeitfilter, Auswahlwerkzeuge sowie den lokalen strukturierten PNG-Vorschau-/Downloadpfad. Neue Messreihenberechnungen, Glaettung, Tagesaggregation, medizinische Bewertungen und Videoexport-Erweiterungen sind ausgeschlossen.

## Technical Context

**Language/Version**: Bestehendes browserkompatibles JavaScript mit CommonJS fuer wiederverwendbare Module; keine neue Sprach- oder Buildvorgabe.

**Primary Dependencies**: Vorhandenes Chart.js, PapaParse, Lucide, bestehender `fit-file-parser@1.10.0` und SAX-Import; vorhandene Exportbibliotheken und Worker. Keine neue Laufzeitabhaengigkeit vorgesehen.

**Storage**: Bestehende browserlokale Trainingshistorie; optionale Extremfelder und abgeleitete Ansichtsmodelle im Speicher. Keine Serverdatenbank, neue Persistenz oder Netzwerkschnittstelle.

**Testing**: Root-Jest 30, Node-Umgebung, bestehende VM-/Dokumentstubs, synthetische CSV/FIT/XML-Daten; Browserabnahme fuer Canvas, Touch, Layout und PNG-Ausgabe. API-Tests sind nicht betroffen.

**Target Platform**: Bestehende Desktop- und mobile Browser mit vorhandener Dashboard-/Exportunterstuetzung; Abnahmebreiten 320, 375, 768 und 1440 CSS-Pixel.

**Project Type**: Statische Browseranwendung ohne Bundler; keine Aenderung am Express-Service oder CLI-Einstieg.

**Performance Goals**: Importweite Eignungspruefung O(n) mit Kurzschluss, Modellbildung O(k log k) fuer k gefilterte Trainings und hoechstens 2k Messpunkte. Keine Sampleauswertung oder wiederholten Vollscans je Punkt. Laufzeit einer grossen synthetischen Historie protokollieren; die Spezifikation setzt kein neues Millisekunden-SLA.

**Constraints**: Kein veraenderter Trainingswert, keine neue Deduplizierung, keine erfundenen Extremwerte, keine UTC-Neuzuordnung von Trainingstagen. Aktuelle Filter sind eine Sport-Einzelauswahl und eine vom bestehenden Aggregationsmodus abhaengige Zeitfensterauswahl; der Verlauf selbst wird nie aggregiert.

**Scale/Scope**: Ein neuer Visualisierungstab; optionale direkte Zusammenfassungen aus drei bestehenden Importquellen. Zwei neue Produktionsmodule und zwei fokussierte neue Testsuiten; angrenzende Integrations- und Regressionstests in bestehenden Dateien erweitern.

## Constitution Check

*GATE: Pruefung vor Phase 0 und erneut nach Phase 1. Keine Ausnahme erforderlich.*

| Prinzip / Gate | Vor Recherche | Nach Design | Nachweis im Plan |
|----------------|---------------|-------------|------------------|
| I: Statische Browser-App | PASS | PASS | Classic-Script-Integration, bestehende CDN-Bibliotheken, kein Buildschritt. |
| II: Dual-Target-Utilities | PASS | PASS | `heart-rate-utils.js` mit CommonJS und `window.heartRateUtils`; Renderer ist DOM-Orchestrierung und kein CommonJS-Zwang. |
| III: Engste Tests und konsistente Tabs | PASS | PASS | Konstanten, IDs, Markup, Dispatch, Filteradapter und Tests gemeinsam erweitern; vorhandene IDs und relative Reihenfolge erhalten. |
| III: Share/Export jedes neuen Tabs | PASS | PASS | Capture-Ziel, Datenflags, strukturierter Snapshot, PNG-Renderer, Vorschau/Download, Leerzustand und Tests im selben Feature. |
| IV: Quelltreues Parsing | PASS | PASS | Enge DE/EN-Header, Distanzsemantik unveraendert, nur Run/Bike/Swim, keine GPX-Aenderung oder Sampleableitung. |
| V: Datenschutz | PASS | PASS | Synthetische Beispiele, lokale Gesundheitsdaten und Bilder, keine API-/Analytics-Erweiterung. |
| Repository-Grenzen / Public APIs | PASS | PASS | Nur additive Felder und kleine lokale Selektorergaenzung; bestehende Exporte/Signaturen bleiben erhalten, keine Service-Abhaengigkeiten. |

## Project Structure

### Documentation (this feature)

```text
specs/080-heart-rate-min-max/
  spec.md
  checklists/requirements.md
  plan.md
  research.md
  data-model.md
  contracts/
    import-fields.md
    dashboard-integration.md
  quickstart.md
```

`tasks.md` wird erst durch `/speckit-tasks` erstellt. Die bestehende Spezifikation und ihre Qualitaetscheckliste bleiben in diesem Planungsschritt unveraendert.

### Source Code (repository root, planned changes only)

```text
index.html                              # Script-Tags, Tab, Panel, gemeinsame Filter, Exportaktion
src/
  heart-rate-utils.js                   # NEU: reine Validierung und Punktmodell
  dashboard-heart-rate.js               # NEU: Chart, Details, Lebenszyklus, Exportsnapshot
  dashboard-utils.js                    # CommonJS-CSV-Normalisierung
  dashboard-import.js                   # Browser-CSV, Import-Commit/Reset
  zip-importer.js                       # FIT-Sessionfelder, CSV-Spaltenerhalt
  apple-health-utils.js                 # Direkte WorkoutStatistics-Extrema
  visualization-availability.js         # Importweite Eignung
  tab-navigation.js                     # Reihenfolge, IDs, Panelumschaltung
  dashboard-core.js                     # Gemeinsamer Selektor, synchronisierte Filter/Refresh
  dashboard-tabs.js                     # Renderdispatch und Filteradapter
  tooltip-selection-utils.js            # Neuer Tab im Auswahlvertrag
  dashboard-export.js                   # Alle Exportregistrierungen und Snapshotpfad
  export-utils.js                       # Titel/Slug, Seitenplanung, unterscheidbare Legenden
scripts/relevant-export-extractor.js     # Erkannte optionale CSV-Extremspalten erhalten
__tests__/
  heart-rate-utils.test.js              # NEU: Punktmodell und Nichtmutation
  dashboard-heart-rate.test.js          # NEU: Renderer, Filter, Details, Exportstand
  fixtures/                            # Vorhandene synthetische Helfer erweitern
  processing.test.js
  zip-importer.test.js
  relevant-export-extractor.test.js
  apple-health-import.test.js
  dashboard-import.test.js
  dashboard-core.test.js
  visualization-availability.test.js
  tab-navigation.test.js
  tooltip-selection-utils.test.js
  dashboard-tooltips.test.js
  dashboard-export-download.test.js
  export-utils.test.js
  index-script-syntax.test.js
```

**Structure Decision**: Vorhandene Dateien erweitern statt Import-/Filter-/Exportabstraktionen neu aufzubauen. Die zwei neuen Module besitzen die neue fachliche Auswertung beziehungsweise ihre DOM-Orchestrierung; benoetigter lokaler Chart-/Revisionszustand bleibt im Renderer. `src/apple-health-importer.js` und der Worker benoetigen nach Recherche keine Transportaenderung; bestehende rohe Attribute und zusaetzliche Activity-Felder werden bereits weitergereicht. Den Ladereihenfolgevertrag unter `specs/022-modularize-inline-script/contracts/script-load-order.md` sowie README/Importdokumentation waehrend der Implementierung eng begrenzt aktualisieren.

## Phase 0: Research Results

Die Recherche ist in [research.md](research.md) dokumentiert. Alle architektonischen Entscheidungen sind getroffen:

- `minHeartRate` und `maxHeartRate` sind optionale bpm-Felder mit unabhaengiger Validierung; widerspruechliche Paare liefern keine Ansichtspunkte.
- Direkte Quellenfelder und konservative Abwesenheitsregeln stehen in [contracts/import-fields.md](contracts/import-fields.md). Parserfaehigkeit ist von tatsaechlicher Exportabdeckung getrennt.
- Filterauswahl bleibt exakt wie bisher: gesamte Historie als Zeitanker, inklusive Grenzen, dann Sport. Der Modus waehlt nur vorhandene Zeitoptionen; der neue Verlauf nutzt keine Aggregationsbuckets.
- Punktreihen ohne Verbindungslinien vermeiden irrefuehrende Luecken. Native Trefferlisten machen identische Positionen ohne Jitter einzeln erreichbar.
- Verfuegbarkeit wird importweit, Darstellung dagegen auf gefilterten Trainings bestimmt.
- Export verwendet die bestehende strukturierte PNG-Neuzeichnung in allen drei Bildformaten; lokale Revisionspruefungen verhindern neue veraltete Ausgaben.

## Phase 1: Design and Contracts

### Datenfluss und Ownership

1. Importer ergaenzen nur belegte direkte Extremfelder. Kein bestehender Wert oder Identitaetsschluessel wird veraendert.
2. Der erfolgreiche Import-Commit erneuert die datasetlokale Identitaetsregistry und leert Chart, Punktdetails und Exportmodell des neuen Tabs. Fehlgeschlagene Imports behalten den bisherigen Stand.
3. Die Verfuegbarkeitspruefung liest die gesamte importierte Historie. `heartRate` wird nach `paceMetrics` eingefuegt; bestehende Tabs behalten ihre relative Reihenfolge.
4. Ein gemeinsam genutzter, durch Paritaetstests abgesicherter Selektor liefert die bisherige Sport-/Zeit-Auswahl. Synchronisierte HeartRate-Bedienelemente verwenden dieselben Setter und den vorhandenen Filteradapter-Vertrag.
5. Die Utility baut aus einer Kopie der gefilterten Liste getrennte Punktreihen. Keine Aktivitaet wird annotiert, sortiert oder medizinisch bewertet.
6. Der Renderer besitzt Chart, Detailtrefferliste und aktuelle Modellrevision. Er zerstoert alte Charts und verwirft veraltete asynchrone Arbeit.
7. Export liest einen kopierten Snapshot dieses Modells; Filter-Leerstaende haben kein exportierbares Modell. Exportressourcen bleiben im bestehenden Vorschau-/Download-Lebenszyklus.

### Deliverables

- [data-model.md](data-model.md): additive Felder, Validierung, Schluessel, Punktmodell und Zustandsuebergaenge.
- [contracts/import-fields.md](contracts/import-fields.md): unterstuetzte Quellenfelder, Einheiten, Reduktion und Nichtveraenderungsregeln.
- [contracts/dashboard-integration.md](contracts/dashboard-integration.md): Modulvertrag, IDs, Filter, Auswahl, Ladereihenfolge und Exportregistrierungen.
- [quickstart.md](quickstart.md): kuenftige fokussierte Tests, manuelle Abnahme, Erfolgskriterienzuordnung und Schutz vor falsch gruenen fehlenden Tests.

### Verification Strategy

Nach jeder Implementierungsscheibe zuerst den engsten betroffenen Test ausfuehren. Auf neuen gemeinsamen Filterpfaden bestehende Ergebnismengen direkt vergleichen. Importregressionen vergleichen alle bisherigen Felder, IDs, Zaehler und Duplikatentscheidungen bei identischer Eingabe. Navigation inklusive nicht sichtbarer Tabs, Script-Reihenfolge und CommonJS-/Browser-Bridge zusammen pruefen.

Die Freigabe erfordert zusaetzlich Browserpruefungen bei den vier spezifizierten Breiten, Touch-/Zeigerauswahl ueberlagerter Punkte, nichtleere Canvas-Darstellung, alle PNG-Formate sowie keine durch diese Funktion verursachte Uebertragung individueller Werte. Die Kriterien SC-001 bis SC-008 sind in der Quickstart-Anleitung Pruefungen zugeordnet. In diesem Planungsschritt werden diese Verhaltenstests nicht als bestanden behauptet.

## Complexity Tracking

Keine Verfassungsverletzung und keine zusaetzliche Infrastruktur erforderlich. Die kleine Selektorergaenzung und die Erhaltung optionaler Spalten in vorhandenen Reducern sind notwendige Integrationsarbeit, keine allgemeine Filter-/Importrefaktorierung. Neue APIs, Datenbanken, Sampleberechnungen und serviceuebergreifende Aenderungen bleiben ausgeschlossen.
