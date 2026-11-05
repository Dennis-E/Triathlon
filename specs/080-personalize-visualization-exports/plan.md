# Implementation Plan: Verständliche und personalisierte Visualisierungs-Exporte

**Branch**: `TriAnalytica-dev-2` | **Date**: 2026-11-04 | **Spec**: [spec.md](spec.md)

**Feature Directory**: `specs/080-personalize-visualization-exports`

**Input**: Feature 080 zu GitHub Issue #5. Der vom Setup gemeldete Wert `080-personalize-visualization-exports` ist der Feature-Identifier, nicht der tatsächliche Git-Branch.

## Summary

Die bestehenden lokalen Bildexporte erhalten knappe, semantisch vollständige Kontexttexte, Reel / Story als Sitzungsstandard, ein sichtbar größeres Story-Logo und eine prominente, standardmäßig aktive Punchline. Nutzende wählen belegte Vorschläge, schreiben einen eigenen Text oder schalten die Punchline aus. Workout Time analysiert ausschließlich eindeutig belegbare lokale Aktivitätsstarts. PR-Exporte erhalten eindeutig zugeordnete Workout-Titel, verständliche Quellenangaben und datengerechte Kalenderachsen; Dauerprofile bleiben Dauerprofile.

Technisch werden die vorhandenen Familienadapter, der unveränderliche Export-Snapshot, `planExportPages` und die Exportrenderer erweitert. Ein kleines reines Punchline-Modul ergänzt Textvalidierung und Vorschlagsverträge; keine neue Laufzeitabhängigkeit und kein Backend. Die getrennte Datums-/Startzeitsemantik bestehender Diagramme und die PB-Berechnungen bleiben unverändert. Details und Alternativen stehen in [research.md](research.md).

## Technical Context

**Language/Version**: Vorhandenes modernes JavaScript ohne Transpilierung, HTML und CSS; CommonJS für Node/Jest, Browser-Globals für wiederverwendbare Module.

**Primary Dependencies**: Bestehende CDN-Browserbibliotheken und Canvas-/Chart.js-Exportpfade; Jest 30 aus dem Root-Paket für Tests. Keine neue Bibliothek, keine Versionsänderung, kein API-Zugriff für Vorschläge.

**Storage**: Flüchtiger Sitzungszustand und vorhandene vorbereitete PNG-/Blob-Ressourcen im Browser; keine neue Persistenz und kein Upload von Texten oder Trainingsdaten.

**Testing**: Root-Jest im Node-Environment; vorhandene VM-/Canvas-/Dokument-Doubles. Aktuelle stabile Chrome-/Edge-Desktopversionen für echte PNGs und Vorschauen; menschlicher Verständlichkeitstest nach SC-007.

**Target Platform**: Statisch ausgelieferte Browseranwendung. Vorschau bei Desktop- und schmaler Fensterbreite; Lesbarkeit exportierter Bilder bei 360 Pixeln Breite. Keine neue mobile Exportzertifizierung.

**Project Type**: Statische Webanwendung ohne Bundler; keine Änderungen an Express-Service oder Node-Export-CLI.

**Performance Goals**: Workout-Time-Analyse einmal je eingefrorener Auswahl in O(n) Zeit mit vier Zählern und begrenztem Zusatzspeicher; keine Vollkopie der Rohaktivitäten im Snapshot. Layout-/Textwechsel verwenden dieselbe Auswahl und berechnen keine PBs oder Importe erneut. Es wird keine unbelegte Millisekundengarantie eingeführt.

**Constraints**: 1080 × 1920 / 1080 × 1080 / 1080 × 1350; vorhandene Story-Sicherheitsfläche; mindestens 36 Pixel essentielle Schrift in den 1080-Pixel-Bildern, Punchline mindestens 125 Prozent Kontextschrift und höchstens zwei Zeilen. Sichtbares Story-Logo mindestens 150 Prozent Square-Höhe. Eigene Texte 1–120 Codepoints nach äußerem Trimmen; eigenständige Darstellbarkeitsprüfung. Nur belegte lokale Startzeiten, mindestens zehn und 60 Prozent Dominanz für Gewohnheiten.

**Scale/Scope**: 13 registrierte Familien einschließlich bestehender PR-Übersicht/-Details, Leistungsdauerprofil, Medienvarianten und Fortsetzungsseiten, soweit regulär exportierbar. Drei Layouts; Standards und Textkontrollen gelten pro neuer Sitzung. Keine neuen Tabs oder Datenquellen. Die ausdrücklich ausgeschlossenen Reparaturen/Inhaltsänderungen bleiben außerhalb dieses Plans.

## Constitution Check

**Gate vor Phase 0: PASS. Gate nach Phase 1: PASS.** Grundlage ist Verfassung 1.1.1; keine Ausnahme erforderlich.

| Prinzip / Grenze | Vor Recherche | Nach Design | Nachweis im Entwurf |
|------------------|---------------|-------------|--------------------|
| I: Static Browser-First | PASS | PASS | Klassische Script-Tags; keine Kompilierung, kein Dienst, bestehender PNG-Pfad |
| II: Dual-Target Utilities | PASS | PASS | Neues reines Punchline-Modul mit `module.exports` und `window.exportPunchlineUtils`; Workout-Time-Analyse in bestehender Dual-Target-Utility; DOM bleibt in Dashboard-Orchestrierung |
| III: Engste Tests zuerst | PASS | PASS | Zuordnung je Änderungsschnitt unten; Jest vor Browserabnahme; Syntax-/Ladereihenfolge und unveränderte Tabverträge prüfen |
| IV: Importsemantik | PASS | PASS | Keine Änderungen an Parsern, Sportnormalisierung, Distanzspalten oder PB-Werten; unbekannte lokale Zeiten werden ausgeschlossen, nicht geraten |
| V: Datenschutz | PASS | PASS | PB-Quellenpfade gezielt freigeben, sonst Titel-/Ortsgrenzen beibehalten; ausschließlich lokale Vorschläge; synthetische Herkunft bleibt sichtbar |
| Repositorygrenzen / APIs | PASS | PASS | Keine API-/CLI-Abhängigkeit, bestehende Exportsignaturen bleiben kompatibel; neue Hilfsfunktionen sind additive Erweiterungen |
| Fokus und Ausschlüsse | PASS | PASS | Keine Calendar-Reparatur, Lifetime-Statistics-Inhalts-/Abschneidekorrektur oder Apple-Health-`geoPoint`-Änderung |

Keine Tab-ID, Reihenfolge oder Dispatch-Zuordnung wird geändert. Das neue Utility-Script wird vor Dashboard-Orchestrierung geladen; die bestehende Reihenfolge aller anderen Scripts bleibt erhalten. Der lebende Script-Ladereihenfolgevertrag wird bei der Implementierung um diese Abhängigkeit ergänzt.

## Project Structure

### Documentation (this feature)

```text
specs/080-personalize-visualization-exports/
  spec.md
  checklists/requirements.md
  plan.md
  research.md
  data-model.md
  contracts/export-personalization.md
  quickstart.md
```

Die Aufgabenliste entsteht erst durch `/speckit.tasks`; sie wird in diesem Workflow nicht erzeugt.

### Source Code (repository root)

```text
index.html                                     Exportdialog, Defaults, neues Utility-Script
src/
  export-punchline-utils.js                     Neu: reine Vorschlags-/Textregeln
  export-utils.js                              Kontextlayout, Punchlinebudget, PB-Zeilenmessung
  dashboard-export.js                          Zustand, Snapshot, Kontext, Rahmen, PR-Renderer
  workout-time-utils.js                        Additive Startzeitanalyse
  dashboard-workout-time.js                    Kompakte Analyse im Exportmodell
  dashboard-power-pb.js                        Quellinformationen im Exportadapter
__tests__/
  export-punchline-utils.test.js                Neu: Tests des neuen Utility-Moduls
  export-utils.test.js                         Bestehende Layouttests erweitern
  dashboard-export-download.test.js            Bestehende Orchestrierungs-/Datenschutztests
  workout-time-utils.test.js                   Analyse und Zeitzonenunabhängigkeit
  dashboard-core.test.js                       Workout-Time-Modell und Auswahlwechsel
  power-pb-utils.test.js                       Unveränderte Leistungsprofilsemantik
  index-script-syntax.test.js                   Script-Verfügbarkeit und Syntax
  tab-navigation.test.js                       Bestehende IDs/Dispatch bleiben konsistent
  fixtures/reel-story-exports/generate.js       Vorhandene Browserfälle/Quellen weiterreichen
README.md                                     Exportstandards, eigene Texte, PR-Titel
specs/022-modularize-inline-script/contracts/script-load-order.md
```

**Structure Decision**: Ein neues Utility und dessen einzelne Testdatei sind durch wiederverwendbare, DOM-freie Text-/Evidenzregeln gerechtfertigt. Keine neue Ebene für jede Familie. Bestehende Exportanbieter anderer Familien werden nur dann lokal um kompakte Evidenz erweitert, wenn ihre ohnehin vorhandenen Exportwerte den benötigten Befund nicht bereits liefern; kein pauschaler Umbau aller Dashboard-Dateien. Die Fähigkeitsmatrix in [research.md](research.md) steuert diese Entscheidung. Historische Feature-077-Dokumente werden nicht rückwirkend umgeschrieben.

## Phase 0 - Research

Abgeschlossen in [research.md](research.md): tatsächlicher Exportpfad, Sitzungszustand, Datenschutz-Allowlist, Quellenfelder, lokale Zeitprovenienz, familientaugliche Belege, Layoutgrenzen und historische Vertragsabweichungen sind aufgelöst. Die bestehenden Abhängigkeiten genügen; keine Technologieauswahl bleibt offen.

Wesentliche Grenzen: CSV-/TrainingPeaks-`Date` ohne lokale Zeitprovenienz trägt keine Gewohnheitsbehauptung. Ein maximal 120 Zeichen langer Text ist nicht automatisch in zwei großen Zeilen darstellbar. Ein Powerprofil gehört nicht zwangsläufig zu einem einzigen Workout. Für alle drei Fälle ist ein expliziter, testbarer Fallback festgelegt.

## Phase 1 - Design and Contracts

### Datenfluss und Eigentum

1. Familienadapter liefern die vorhandene Darstellungsauswahl. Workout Time ergänzt kompakte Startanalyse; PB ergänzt zugeordnete Quellen, ohne Rangfolge oder Werte zu berechnen.
2. `captureExportSelection` erstellt einen unabhängigen, eingefrorenen Snapshot. Neue Analysefelder kommen ausdrücklich auf die Top-Level-Allowlist; PB-Titel werden ausschließlich in definierten Record-Quellpfaden zugelassen.
3. Das reine Punchline-Modul baut aus diesem Snapshot stabile Vorschläge mit Beleg. Kein Zugriff auf DOM, aktuelle globale Aktivitäten oder externe Dienste. Ein neutraler familienbezogener Vorschlag bleibt verfügbar.
4. Der Exportdialog verwaltet Aktivierung, gewählten Text, Entwurf und bestätigte Präsentationsrevision. Neue Sitzung: Story und Punchline an. Layout-/Seitenwechsel ändern die Auswahl nicht.
5. Präsentationsadapter und Seitenplaner erzeugen semantisch verdichteten Kontext, die eine bestätigte Punchline, gemessene PB-Quellenzeilen und formatabhängiges Logo. Nicht darstellbare Textfassungen werden erklärt und gesperrt.
6. Komposition und Download bleiben an dieselbe Auswahl und letzte erfolgreich abgeschlossene Präsentationsrevision gebunden. Vorbereitete Bytes werden weder für Download neu gerendert noch zwischen unterschiedlichen Sitzungen unkontrolliert geteilt.

Die Entityfelder, Invarianten und Zustandsübergänge stehen in [data-model.md](data-model.md); konkrete Modul-/UI-Verträge und Zielinventar in [export-personalization.md](contracts/export-personalization.md).

### Abhängige Implementierungsschnitte

| Schnitt | Eigentümer | Abhängigkeit / engste erste Prüfung |
|---------|------------|------------------------------------|
| A: Reine Text-/Evidenzregeln und Startanalyse | Neues Utility, `workout-time-utils.js`, ihre Tests | Ohne UI implementierbar; einzelne Utility-Suite zuerst |
| B: Kompakte Modellfelder und gezielte Snapshotfreigaben | Workout-Time-/PB-Adapter, `captureExportSelection` | A; Adapter-/Datenschutzfälle in bestehenden Dashboardtests |
| C: Kontext, zweizeilige Punchline, Logo und PB-Zeilenbudget | `export-utils.js`, Exportpräsentation/-rahmen | A/B; `export-utils.test.js`, dann Rendererfälle |
| D: PR-Datums-/Quellenrenderer | PB-Exportrenderer | B/C; PR- und Profilfälle, keine Dashboardachsenänderung |
| E: Dialog, Standards und Revisionsschutz | `index.html`, `dashboard-export.js` | A/B/C; Zustands-/Download-Races, Script-/Tabvertrag |
| F: Bild-/Nutzerabnahme und Bedienungsdokumentation | Bestehender Fixturegenerator, README, Abnahmenachweise | C/D/E; echte Dateien in Chrome/Edge, anschließend SC-007 |

Diese Schnitte sind keine ausführbare Aufgabenliste. Gemeinsame Änderungen an `dashboard-export.js` werden nacheinander integriert, nicht als unabhängig parallelisierbare Schreibaufträge behandelt. Nach jedem Codeschnitt zuerst dessen fokussierte Jest-Prüfung, danach angrenzende Arbeit.

### Traceability und Verifikation

| Anforderung | Konkreter Vertrag / Prüfung |
|-------------|----------------------------|
| FR-001 | Vollständiges aktuelles Zielinventar, jede verfügbare Variante in drei Layouts |
| FR-002, FR-003 | Semantische Kontextbestandteile; notwendiger Sport-/Einheiten-/Teilperiodenkontext, keine technischen Präfixe |
| FR-004, FR-007 | Defaults bei Beginn, explizite Abweichung bleibt bis Sitzungsende, Wiederöffnen setzt zurück |
| FR-005, FR-006 | Sichtbare Logohöhen, Schriftverhältnis, Lesefluss, maximal zwei Zeilen, Platzrückgewinn |
| FR-008, FR-009, FR-010, FR-011 | Genau ein Text, eigene Eingabe, Validierung, Herkunft, Revision und bytegleicher Download |
| FR-012, FR-013 | Jeder Datenvorschlag mit Auswahl-/Messgrößenbeleg, neutrale Alternative ohne Tatsachenbehauptung |
| FR-014, FR-015, FR-016 | Analysegrundmenge, gültige/exkludierte Starts, Grenzwerte und messgrößenunabhängige Zuordnung |
| FR-017 | Fähigkeiten-/Abnahmematrix je Familie; belegter Vorschlag oder begründeter neutraler Fallback |
| FR-018, FR-019 | Recordgebundene Titel/Quelle, gezielte Freigabe und verständliche Schätzungs-/Messbegriffe |
| FR-020, FR-021 | Datumsvalidierung, Jahresbezug, Datenextent, Einpunkt-/Gleichtagsfall, Dauerprofil |
| FR-022, FR-023 | Lokale Verarbeitung, keine Rohdaten-/Textübertragung, PB-Ausnahme sonst restriktiv, Herkunft bleibt |
| FR-024 | Ausschlüsse separat protokollieren; weder Reparaturen noch Inhaltslöschungen als Aufgaben einplanen |

Messverfahren für SC-001 bis SC-007 und ausführbare Befehle stehen in [quickstart.md](quickstart.md). Das Browserprüfprotokoll nennt Versionen, Auswahl, Variante, Format, Punchlinequelle/-status, erwarteten Beleg, PNG-Maße und Ergebnis. Schon bekannte ausgeschlossene Defekte bleiben als solche sichtbar; neue Regressionen durch die gemeinsame Exportänderung sind keine zulässige Ausnahme.

## Complexity Tracking

Keine Verfassungsverletzung und keine zusätzliche Infrastruktur. Ein reines Utility mit einer Testdatei ist die einzige neue produktive Abstraktion. Alle weiteren Ergänzungen verwenden vorhandene Eigentümer und Verträge.

## Planning Completion

Phase 0 und Phase 1 sind abgeschlossen und auf Verfassungskonformität nachgeprüft. Keine ungelösten technischen oder fachlichen Klärungen. Es sind nur Designunterlagen erzeugt; Implementierung, Laufzeittests, PNG-Abnahme und Nutzertest sind nicht als ausgeführt oder bestanden zu verstehen. Nächster Workflow: `/speckit.tasks`.
