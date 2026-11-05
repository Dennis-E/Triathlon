# Implementation Plan: Herzfrequenz- und Importkorrekturen

**Branch**: Git `main` unveraendert; Spec-Kit-Kontext `081-heart-rate-import-fixes` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

**Input**: `specs/081-heart-rate-import-fixes/spec.md`.
**Status**: Planungsworkflow bis Phase 1 abgeschlossen; kein Anwendungscode implementiert, keine Aufgabenliste erzeugt.

## Summary

Die sechs gemeldeten Probleme werden in vier fachlichen Arbeitsschnitten behoben: beobachteten Strava-Header erkennen und einen konservativen TrainingPeaks-Messreihenfallback mit Herkunft bereitstellen; Apple-Importfaehigkeiten und Fehlerursachen sauber trennen; HeartRate nach echten Kalenderperioden aggregieren und angeforderte Zeitfenster sichtbar machen; Exportlayout und Bildinhalt an die etablierten Vertraege angleichen.

Feature 080 bleibt die Implementierungsbasis, nicht ein zu wiederholender Neuaufbau. Bestehende Trainingsfelder, Durchschnittspulse, Identitaeten, Zaehlungen und andere Visualisierungen bleiben unveraendert. Neue optionale Provenienz wird nur lokal gehalten. Tab-IDs, relative Reihenfolge, globaler Sportzustand, bestehende Zeitraumfilter und der lokale PNG-Vorschau-/Downloadpfad bleiben erhalten.

## Technical Context

**Language/Version**: Bestehendes browserkompatibles JavaScript, CommonJS und `window`-/`globalThis`-Bruecken; kein neuer Buildschritt.

**Primary Dependencies**: Vorhandenes Chart.js, PapaParse, `fit-file-parser@1.10.0`, ZIP.js 2.8.11, SAX 1.6.1, WebCrypto SHA-256 und bestehende Exportbibliotheken. Keine neue Produktionsbibliothek und kein Parserupgrade vorgesehen.

**Storage**: Browser-/Worker-Speicher; keine neue Persistenz, Datenbank oder Remote-Diagnoseschnittstelle. Rohe FIT-/Health-Messungen bleiben beim Import und werden nicht in dauerhafte Dashboard-/Exportsnapshots kopiert.

**Testing**: Root-Jest im Node-Environment, vorhandene synthetische CSV/FIT/XML-/ZIP-Fixtures und VM-Helfer. Reale Worker-/Dateiimporte in aktuellem Chrome, Edge und VS Code ueber lokales HTTP sowie HTTPS; responsive Screenshot-/Canvas-/Touch-/Mauspruefung und echte PNG-Downloads.

**Target Platform**: Aktuelle Chrome-/Edge-/VS-Code-Browser in unterstuetztem sicherem Kontext; HTTPS und HTTP auf localhost/IPv4-/IPv6-Loopback. `file:` und unsicheres Remote-HTTP bekommen zutreffende Bereitstellungsfehler, keine Abschaltung der Sicherheitspruefungen.

**Project Type**: Statische Browser-App mit bestehendem Apple-Worker und separatem Node-CSV-Reducer; `services/api/` bleibt unberuehrt.

**Performance Goals**: Kalenderaggregation O(n + p log p) fuer n gefilterte Trainings und p belegte Perioden, hoechstens zwei Punkte je Periode. HR-Fallback nur fuer Kandidatendateien ohne direkte Felder, aus vollstaendig gelesenen unverkuerzten Records. Ein zusaetzlicher strikter Parse darf nur dieselben bereits entpackten Bytes qualifizieren; keine erneute ZIP-Extraktion und keine duplizierten dauerhaften Recordlisten. Laufzeit-/Speicherveraenderungen gegen die gleiche Ausgangshistorie dokumentieren, kein erfundenes SLA.

**Constraints**: Bestehende Public APIs und Quellsemantik erhalten; direkter Extremwert gewinnt, ungeeignete Daten bleiben fehlend. Keine Messreihenrekonstruktion fuer Strava/Apple als Nebenumfang. Kalenderaggregation und qualifizierter TP-Fallback ersetzen gezielt die vorherigen Feature-080-Beschraenkungen. SHA-256, Streaming, XML-/Archivschutz und Ressourcenlimits bleiben erhalten. Nur Initialisierung hat ein neues begrenztes 30-Sekunden-Ready-Fenster, nicht die Verarbeitung grosser Archive.

**Scale/Scope**: Ein bestehender Tab, drei bestehende Quellen, vier User Stories, 16 funktionale Anforderungen und acht Erfolgskriterien. Vorhandene Module und Tests erweitern; keine neue dauerhafte Code- oder Testdatei ist zwingend erforderlich.

## Constitution Check

*GATE: Vor Phase 0 und nach Phase 1 geprueft. Keine Ausnahme beantragt.*

| Gate | Vor Recherche | Nach Design | Nachweis |
|------|---------------|-------------|----------|
| I: Static Browser-First | PASS | PASS | Bestehende Classic-Scripts, CDN-Bibliotheken und Worker; kein Bundler oder Backend. |
| II: Dual-Target Utilities | PASS | PASS | Reine HR-/Kalenderlogik in vorhandener Dual-Target-Utility; Diagnosevertrag workerfaehig in Apple-Utilities. |
| III: Engste Tests / Tabkonsistenz | PASS | PASS | Fokusgruppen je Schnitt, vorhandene Tab-/Scriptvertraege regressionspruefen, IDs/Reihenfolge nicht aendern. |
| III: Funktionierender lokaler Export | PASS | PASS | Periodenmodell und angeforderte Grenzen in allen PNG-Formaten, Layoutabnahme und bestehende Revisionsguards. |
| IV: Quelltreues Parsing | PASS | PASS | Exakter DE-Alias, unabhaengige Duplikatpruefung, Originalsessiongrenzen, keine Distanz-/Sport-/GPX-Neudeutung. |
| V: Datenschutz / Netzwerkgrenzen | PASS | PASS | Nur synthetische versionierte Daten, sichere lokale Fehlerenums, keine Gesundheitsdaten in Telemetrie oder Diagnoseuploads. |
| Repo-/API-Grenzen | PASS | PASS | Bestehende Signaturen kompatibel erweitern, kein Servicezugriff; tolerante Altberechnungen und IDs behalten. |

## Project Structure

### Documentation (this feature)

```text
specs/081-heart-rate-import-fixes/
  spec.md
  checklists/requirements.md
  plan.md
  research.md
  data-model.md
  contracts/
    heart-rate-import.md
    apple-health-runtime.md
    period-view-export.md
  quickstart.md
```

`tasks.md` wird erst im naechsten `/speckit-tasks`-Schritt angelegt. Feature-080-Artefakte und die vorhandene Qualitaetscheckliste werden hier nicht umgeschrieben.

### Source Code (repository root; planned ownership, no edits yet)

```text
src/heart-rate-utils.js              # Alias, Evidenz/Provenienz, reine Record-/Periodenlogik
src/zip-importer.js                  # TP-Lesebelege, Originalsession-Eigentuemer und Fallback
src/dashboard-utils.js               # CommonJS-Paritaet und optionale Evidenzuebernahme
src/dashboard-import.js              # Browser-Provenienz, Datenhinweise, Apple-Worker-Lebenszyklus
src/apple-health-utils.js            # Fehlercodes, sichere Diagnosen und Hashfehler
src/apple-health-importer.js         # Capability-/Bibliotheksfehler getrennt erhalten
src/apple-health-worker.js           # Init/Ready, Kontextpruefung, sichere Fehler und Cleanup
src/dashboard-heart-rate.js          # Periodenmodell, angeforderte Achse, Details, Renderkontext
src/dashboard-export.js              # Gruppierungs-/Zeitkontext im bestehenden Snapshotpfad
index.html                          # Bestehender Exportstandard und responsive Kopfzeile
scripts/relevant-export-extractor.js # Nur Alias-/Spaltenerhaltregression; kein CLI-Neudesign
__tests__/heart-rate-utils.test.js
__tests__/processing.test.js
__tests__/zip-importer.test.js
__tests__/relevant-export-extractor.test.js
__tests__/apple-health-import.test.js
__tests__/dashboard-import.test.js
__tests__/dashboard-heart-rate.test.js
__tests__/dashboard-core.test.js
__tests__/visualization-availability.test.js
__tests__/tab-navigation.test.js
__tests__/index-script-syntax.test.js
__tests__/export-utils.test.js
__tests__/dashboard-export-download.test.js
README.md
docs/IMPORT_FEATURE.md
```

**Structure Decision**: Die bestehende Struktur erweitern. Pure Logik bleibt in den vorhandenen Utilities; Rohsession-/Recordeigentuemerschaft bleibt beim FIT-Importer. Apple-Fehleraufloesung wird dort vorgenommen, wo der Fehler entsteht, nicht erst durch Textaustausch im UI. Gemeinsame Zeitraumsemantik, Power-/GPS-Normalisierung, API-Service und bestehende Navigation werden nicht refaktoriert.

## Phase 0: Research Results

[research.md](research.md) dokumentiert acht Entscheidungen mit Begruendung und Alternativen. Wichtige Abgrenzungen:

- Beobachteter Strava-Alias ist nachgewiesen; keine allgemeine Prioritaet zwischen widerspruechlichen Spalten erfinden.
- Originale FIT-Endgrenzen und positive Lesebelege sind Pflicht fuer Recordfallback. Timerende/Folgestart sind kein Ersatz.
- Fehlender Callback im strikten FIT-Parser ist kein Erfolg. Ohne reproduzierbaren Integritaets-/Abschlussnachweis bleibt der Fallback gesperrt.
- Der vorherige Edge-/Loopback-Erfolg beweist keine Ursache des gemeldeten Apple-Fehlers. Konkrete sichere Diagnose und die sechs echten Browser-/Bereitstellungsnachweise sind Bestandteil der Umsetzung.
- Angeforderter HeartRate-Achsenbereich wird lokal berechnet; die Auswahl anderer Visualisierungen bleibt unveraendert.

## Phase 1: Design and Contracts

### Datenfluss und Integrationsgrenzen

1. Quellenfelder unabhaengig inspizieren und in kompatible Zahlenfelder plus optionale Provenienz projizieren. Vorhandenen Durchschnitt nicht veraendern.
2. Im TP-Kandidatenpfad nur positiv qualifizierte Originalrecordreihen ergaenzen; direkte Angaben und bestehende Duplikatentscheidung behalten.
3. Bestehende importweite `hasHeartRateData`-Entscheidung nutzt aufgeloeste Zahlenfelder; Quellenhinweise erklaeren fehlende oder beobachtete Werte ohne neuen Diagnosetab.
4. Globale Trainingsauswahl wie bisher anwenden, dann ein neues reines Kalenderperiodenmodell bilden. Details koennen alle beitragenden Trainings und Extremgleichstaende aufloesen.
5. Angeforderte Range und Modellkontext beim Rendern kopieren. Neue Exporte lesen diesen Stand, nicht neu interpretierte Live-Filter.
6. Apple-Worker prueft Libraries und benoetigte Funktionen vor `ready`; Fehler tragen sichere feste Codes und Kontextklassen. Erst erfolgreicher Abschluss erreicht den unveraenderten Dataset-Commit.
7. Kopfzeile und Button verwenden das Nachbarmuster. PNG-Formate, Preview/Download und Revisionsschutz bleiben derselbe lokale Exportablauf.

### Deliverables

- [data-model.md](data-model.md): Extremfeldevidenz, Provenienz, Lesebelege, Perioden und Import-/Exportzustaende.
- [contracts/heart-rate-import.md](contracts/heart-rate-import.md): Alias-/Duplikatvertrag und konservativer FIT-Fallback.
- [contracts/apple-health-runtime.md](contracts/apple-health-runtime.md): sichere Umgebungs-/Fehler-/Workerprotokolle und Retry.
- [contracts/period-view-export.md](contracts/period-view-export.md): Kalender, angeforderte Achse, Trainingsdetails und Layout-/Exportsnapshot.
- [quickstart.md](quickstart.md): kuenftige fokussierte Tests, reale Browsermatrix, Referenzpruefungen und Erfolgskriterienzuordnung.

### Verification Strategy

Vor jeder Produktionsaenderung den engsten Vertragstest schreiben und erwarteten Ausgangsfehler bestaetigen; nach jeder Aenderung denselben Schnitt pruefen. Strikte FIT-Qualifizierung benoetigt echte synthetische Binaerdaten mit CRC-/Trunkierungsfehlern, nicht nur Sessionmocks. Apple benoetigt echte Dateiauswahl und unveraenderten Worker-/Library-/SHA-256-Pfad in drei Browsern jeweils lokal/HTTPS. Fehlende Umgebungen oder Nachweise bleiben unverifiziert und blockieren ihre jeweiligen Erfolgskriterien, nicht die Erstellung dieses Plans.

Die Abnahme umfasst ausserdem mindestens zwoelf Trainings ueber Wochen-/Monats-/Jahresgrenzen, alle vorhandenen Filterkombinationen, vier Viewportbreiten, Canvas-/Screenshot-/Touch-/Mausnachweise, neun Perioden-/PNG-Kombinationen und echten gespeicherten Download. Ein Vorher-/Nachher-Vergleich entfernt nur neu vorgesehene HR-/Provenienzfelder; alle bisherigen Werte und Visualisierungsergebnisse muessen gleich bleiben. Root-Regressionssuite als Abschlussgate, keine API-Tests ohne API-Aenderung.

## Complexity Tracking

Keine Verfassungsverletzung. Die zusaetzliche strikte FIT-Qualifizierung ist ausschliesslich ein konservativer HR-Nachweis und keine neue Parserengine. Der begrenzte Worker-Handshake behebt einen bestehenden unklaren Initialisierungszustand. Weitere Abstraktionen, Produktionsabhaengigkeiten, neue Diagnosetabs oder ein allgemeiner Import-/Exportumbau sind nicht vorgesehen.
