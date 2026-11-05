# Research: Herzfrequenz-Min-/Max-Entwicklung

**Date**: 2026-11-04
**Status**: Abgeschlossen fuer die Planung; keine Implementierung oder Verhaltenspruefung erfolgt.

## 1. Additive Extremwerte statt Ersatzberechnungen

- **Decision**: Optionale Trainingsfelder `minHeartRate` und `maxHeartRate` in bpm ergaenzen. Nur explizite trainingsbezogene Quellzusammenfassungen uebernehmen; Felder unabhaengig pruefen. Durchschnittspuls und Messreihenverarbeitung bleiben unveraendert.
- **Rationale**: Alle drei Importwege uebernehmen bisher vor allem `avgHeartRate`. Die neue Ansicht darf diesen Wert nicht als Extremwert verwenden. Bestehende Felder und Identitaeten sind die Regressionsbasis.
- **Alternatives considered**: Extremwerte aus Samples berechnen (ausserhalb des Umfangs); Durchschnittspuls als Ersatz (fachlich falsch); unbekannte Quellen vollstaendig sperren (widerspricht datenbezogener Verfuegbarkeit).
- **Evidence**: `src/dashboard-import.js` (`processData`), `src/dashboard-utils.js` (`processData`), `src/zip-importer.js` (`normalizeTrainingPeaksSession`), `src/apple-health-utils.js` (`normalizeWorkout`).

## 2. Strava: expliziter Headervertrag und Erhalt optionaler Spalten

- **Decision**: Eine enge, dokumentierte deutsche/englische Header-Allowlist fuer Min-/Max-Herzfrequenz verwenden, definiert in `contracts/import-fields.md`. Keine unscharfe Suche nach bloss `min` oder `max`. Unbekannte oder einheitsunklare Angaben bleiben ungenutzt.
- **Rationale**: Der aktuelle Code und die vorhandenen synthetischen Beispiele belegen Durchschnittsheader, aber keine vollstaendige Liste echter Strava-Extremheader. Die Allowlist ist deshalb ein kuenftiger unterstuetzter Eingabevertrag, keine Zusicherung ueber jeden Strava-Export. Ihre Feldbedeutung und bpm-Semantik werden mit synthetischen Vertragsbeispielen getestet; weitere Varianten brauchen vor Aufnahme einen belastbaren Formatnachweis.
- **Alternatives considered**: Alle Herzfrequenzspalten heuristisch zuordnen (Verwechslung von Durchschnitt und Extremen); fehlendes Minimum aus Maximum ergaenzen (unzulaessig).
- **Evidence**: Browser- und CommonJS-Normalisierung sind getrennt. `importStravaZip` reicht die Original-CSV weiter; `extractRelevantColumns` und der separate CLI-Reducer `reduceActivitiesRows` reduzieren dagegen auf ausgewaehlte Spalten. Beide Reducer muessen erkannte optionale Extremspalten erhalten, ohne bestehende Headerreihenfolge oder die doppelte Distanzsemantik zu veraendern.

## 3. TrainingPeaks: Sessionwerte sind die einzige neue FIT-Quelle

- **Decision**: `session.min_heart_rate` und `session.max_heart_rate` des bestehenden `fit-file-parser@1.10.0` auswerten. Keine Laps, Records oder zusammengesetzten Streams verwenden. Den FIT-Invalidwert fuer `uint8` (255) nicht als bpm-Messung akzeptieren.
- **Rationale**: Das Profil dieser bereits verwendeten Parserfassung definiert in Nachricht 18 (`session`) Feld 64 als `min_heart_rate`, Feld 17 als `max_heart_rate`, jeweils bpm. Das belegt Parserfaehigkeit, nicht die Abdeckung beliebiger TrainingPeaks-Dateien.
- **Alternatives considered**: Parserwechsel oder Upgrade (unnoetige Regressionen); Min-/Max-Berechnung aus Records (ausgeschlossen).
- **Evidence**: `src/zip-importer.js` (`ensureFitParserLoaded`, `parseFitData`, `normalizeTrainingPeaksSession`); Profil der festgelegten Version: <https://unpkg.com/fit-file-parser@1.10.0/dist/fit.js>.
- **Validation requirement**: Bestehende Tests injizieren Sessionobjekte. Zusaetzlich ist ein kleiner synthetischer FIT-Decodiertest fuer diese Feldnummern und Invalid-Sentinel erforderlich. Die Parserfaehigkeit gilt erst nach diesem Test als implementierungsseitig bestaetigt.

## 4. Apple Health: vorhandene WorkoutStatistics nutzen

- **Decision**: Ausschliesslich `minimum` und `maximum` aus `WorkoutStatistics` mit `type="HKQuantityTypeIdentifierHeartRate"` und bekannter Einheit `count/min` auswerten. Die bestehenden SAX-Attribute reichen dafuer aus. Neue Extremwertregeln strikt von der Durchschnitts- und Record-Logik trennen.
- **Rationale**: Der SAX-Pfad behaelt bereits alle Attribute; `normalizeWorkout` wertet davon bislang `average` aus. Tageswerte und ueberlappende Alltagsmessungen sind kein verlaesslicher Ersatz.
- **Alternatives considered**: Zweiten Record-Durchlauf fuer Extremwerte erweitern (ausserhalb des Umfangs); Rohstatistiken zur Normalisierung umschreiben (kann Identitaeten veraendern).
- **Evidence**: `src/apple-health-importer.js` (WorkoutStatistics-SAX-Pfad und separater Record-Durchlauf), `src/apple-health-utils.js` (`summary`, `quantity`, Fingerprint).
- **Decision on ambiguity**: Verschachtelung stellt die Workoutzuordnung her. Sind Statistik-Zeitgrenzen angegeben, muessen beide gueltig sein und exakt die Workoutgrenzen bezeichnen. Fehlende Zeitattribute sind bei eindeutig verschachtelten Zusammenfassungen erlaubt. Mehrere Angaben pro Extremfeld werden nur bei identischen gueltigen Werten akzeptiert; widerspruechliche oder teilweise zeitlich abgegrenzte Angaben machen das betroffene Feld unverfuegbar. Keine Kombination von Teilintervallen.

## 5. Identitaeten und Duplikate unveraendert lassen

- **Decision**: Bestehende Importidentitaeten und Deduplizierungsentscheidungen unveraendert lassen. Keine nachtraegliche Zusammenfuehrung komplementaerer Duplikate.
- **Rationale**: Strava verwendet die bestehende CSV-ID. TrainingPeaks verwendet Start/Sport/Dauer/Distanz beziehungsweise den bestehenden Quellenfallback; der erste Duplikattreffer bleibt massgeblich. Apples Fingerprint enthaelt bereits die rohen Statistikattribute. Das blosse Ableiten neuer Activity-Felder aendert bei identischer Eingabe keinen dieser Schluessel.
- **Alternatives considered**: Extremwerte in FIT-Schluessel aufnehmen oder Apple-Rohstatistiken umschreiben (wuerde Aktivitaetszahlen/IDs veraendern).

## 6. Filter wiederverwenden, nicht neu interpretieren

- **Decision**: Einen kleinen gemeinsamen Selektor fuer die bisher in `renderDashboard` verwendete Zeit-/Sportauswahl bereitstellen und dessen bisherige Ergebnismenge durch Paritaetstests sichern. Neue Utility-Funktionen nehmen bereits gefilterte Trainings entgegen. Die neue Ansicht verwendet synchronisierte Bedienelemente fuer denselben Zustand.
- **Rationale**: `getTimeframeRange` ist am letzten Training der gesamten Historie verankert; `getActivitiesInTimeframe` schliesst beide Grenzen ein. Der Sportfilter ist derzeit eine Einzelauswahl `All|Run|Bike|Swim`. FR-010 verlangt den Erhalt dieser bestehenden Auswahlsemantik; eine neue Mehrfachauswahl wird nicht eingefuehrt.
- **Alternatives considered**: Eigene Zeitraumengine oder Aggregationsbuckets verwenden (abweichende Grenzen beziehungsweise unerwuenschte Zusammenfassung). Globale Filter komplett in ein neues Layout verschieben (unnoetiger Umbau).
- **Evidence**: `src/dashboard-core.js` (`TIMEFRAME_OPTIONS`, `getTimeframeRange`, `getActivitiesInTimeframe`, `renderDashboard`, Filtersetter), `src/dashboard-state.js`, vorhandene Filter im Distance-Panel in `index.html`.

## 7. Punktreihen, Auswahl und stabile Trainingszuordnung

- **Decision**: Vorhandenes Chart.js mit zwei Scatter-Datasets, `showLine: false`, unterschiedlichen Punktformen und beschrifteter Legende verwenden. Numerische Zeitachse aus bestehendem Trainingstag, kein neuer Datumsadapter. Keine Glaettung, Jitter oder Aggregation.
- **Rationale**: Einzelpunkte und einseitige Angaben bleiben sichtbar, ohne fehlende Werte zu ueberbruecken. `dashboard-equipment.js` zeigt bereits einen Scatter-Zeitverlauf. Vorhandenes `dashboardTooltips.attachChart` unterstuetzt Tap/Klick und Tastatur.
- **Alternatives considered**: Linien mit ueberbrueckten Luecken (irrefuehrend); indexbasierte Paarung beider Reihen (falsch bei fehlenden Werten).
- **Decision on overlaps**: Treffer am gleichen Ort nach Trainingsschluessel und Extremart sortieren; im lokalen Detailbereich eine fokussierbare Liste aller Treffer mit nativen Auswahloptionen anbieten. Zeiger, Touch und Tastatur muessen jedes Training erreichen koennen. Ueberlagerte gleiche Extrema behalten beide Eintraege.
- **Decision on identity**: Datasetlokale Registry ausserhalb der Trainingsobjekte vor Filterung aufbauen. Bestehende ID plus Ursprungsordinal liefert stabile eindeutige Anzeigeschluessel auch bei doppelten/fehlenden IDs. Registry bei erfolgreichem Ersatzimport erneuern.

## 8. Verfuegbarkeit und Lebenszyklus

- **Decision**: `hasHeartRateData(allActivities)` verwendet dieselben Validitaetsregeln wie das Punktmodell, aber kurzschliessend und ohne Sortierung. Ein qualifizierter Wert genuegt. Filter-Leerstaende aendern die Importverfuegbarkeit nicht.
- **Rationale**: `refreshVisualizationTabs` arbeitet bereits auf der gesamten importierten Historie. `applyImportedDataset` ist die Commitgrenze fuer Ersatzimporte. Chart, Auswahl und Exportmodell muessen dort geleert werden; fehlgeschlagene Imports lassen den bisherigen Stand erhalten.
- **Alternatives considered**: Verfuegbarkeit bei jedem Filterwechsel neu bestimmen (verschwindende Navigation); mindestens ein vollstaendiges Paar verlangen (verwirft valide Teilwerte).
- **Evidence**: `src/visualization-availability.js`, `src/dashboard-tabs.js`, `src/dashboard-import.js`, `src/dashboard-state.js`.

## 9. Lokaler strukturierter Bildexport

- **Decision**: Capture-Ziel plus strukturierten Chart-Neuzeichnungspfad registrieren; bestehende PNG-Formate square, portrait und story ueber lokale Vorschau/Download verwenden. Kein neues Video-, Netzwerk- oder Dateiformatfeature.
- **Rationale**: Nur ein Capture-Ziel zu registrieren reicht nicht. Exportflags, Kontext, Titel/Slug, Seitenplanung, Ressourcenliste und Familienrenderer benoetigen die neue Ansicht. Der Export erhaelt einen kopierten Snapshot ohne Aktivitaetsreferenzen oder live lesende Callbacks.
- **Alternatives considered**: Eigener Screenshot-/Downloadpfad (inkonsistent); DOM-Capture als einziger Pfad (schlechtere Formatkontrolle).
- **Decision on staleness**: Neue Exportanforderungen lesen immer den aktuellen Modellstand. HeartRate-spezifische Filter-/Renderrevision vor Veroeffentlichung einer noch laufenden Aufnahme pruefen; bei Wechsel abbrechen. Eine bereits veroeffentlichte Vorschau bleibt ein klar zugeordneter eingefrorener Stand; Formatwechsel verwenden diesen Stand. Bei Filter-Leerzustand oder Ersatzimport Vorschau schliessen und Export sperren. Keine generelle Aenderung anderer Exportfamilien.
- **Evidence**: `src/dashboard-export.js` (`EXPORT_CAPTURE_TARGET_IDS`, `getExportableFlags`, Kontext-/Strukturdatenfunktionen, `EXPORT_FAMILY_RENDERERS`, Ressourcenverwaltung), `src/export-utils.js` (`planExportPages`, Legenden, Formate).

## 10. Pruefung und Umfang

- **Decision**: Bestehende Import-, Filter-, Navigations-, Tooltip-, Export- und Syntax-Tests erweitern; nur fuer neue Utility und Renderer je eine fokussierte Testsuite ergaenzen. Synthetische Daten, VM und injizierbare Dokumente statt neuer DOM-Testumgebung.
- **Rationale**: Root-Jest verwendet Node; Classic-Scripts teilen im Browser einen globalen Scope. Browser-Smoke-Tests bleiben fuer Ladereihenfolge, Canvas, Touch und Layout notwendig.
- **Alternatives considered**: Neue Build-/Browser-Testinfrastruktur, neues UI-Framework oder Aenderungen am API-Service (nicht erforderlich).
- **Performance decision**: O(n) Verfuegbarkeit, O(k log k) Sortierung und hoechstens 2k Punkte fuer k ausgewaehlte Trainings; keine quadratischen Vollscans oder Messreihenverarbeitung. Laufzeit mit einer synthetischen grossen Historie dokumentieren, ohne aus der Spezifikation ein nicht vereinbartes Zeitlimit abzuleiten.

## Offene Punkte

Keine offenen fachlichen oder architektonischen Entscheidungen. Synthetische Feld-/Parsernachweise, Browser- und Regressionstests sind verpflichtende spaetere Implementierungspruefungen, keine hier behaupteten Testergebnisse. Zusaetzliche reale Exportvarianten werden nur nach belegter Semantik aufgenommen; ihr Fehlen blockiert die konservativ definierte Eingabeschnittstelle nicht.