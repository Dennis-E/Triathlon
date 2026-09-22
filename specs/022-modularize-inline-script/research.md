# Phase 0 Research: Inline-Script von index.html in Feature-Module aufteilen

Alle offenen Punkte aus dem ursprünglichen Feature-Kontext wurden bereits in der
Clarify-Phase geklärt (siehe [spec.md](./spec.md#clarifications)). Dieses Dokument
konsolidiert die technischen Entscheidungen für den Split selbst, basierend auf einer
strukturellen Analyse von [index.html](../../index.html).

## Entscheidung 1: Domänengrenzen und Dateizuschnitt

**Decision**: Der große Inline-Block (ca. [index.html](../../index.html#L1570-L6110), ~4.540
Zeilen) wird in zehn Dateien unter `src/` aufgeteilt:
`dashboard-state.js`, `dashboard-core.js`, `dashboard-import.js`, `dashboard-equipment.js`,
`dashboard-distributions.js`, `dashboard-scatter.js`, `dashboard-heatmap.js`,
`dashboard-power-pb.js`, `dashboard-export.js`, `dashboard-tabs.js`.

**Rationale**: Eine strukturelle Analyse des Inline-Blocks (Top-Level-Funktionen/Variablen,
gruppiert nach Aufruf-Zusammenhang) ergab genau diese zehn klar abgrenzbaren Verantwortungsbereiche.
Die sieben in der Spec geforderten Bereiche (Import-Flow, Equipment, Distributions, Scatter,
Heatmap, Export/Sharing, Modals/Privacy) sind darin enthalten; zusätzlich wurden zwei technisch
notwendige Querschnittsbereiche identifiziert, die in der Spec nicht explizit benannt, aber für
eine saubere Aufteilung unumgänglich sind:
- **`dashboard-state.js`**: geteilter globaler Zustand (u. a. `processedActivities`,
  `heatmapActivitySummaryIndex`, `importedDataset`, `selectedVisualizationTab`), der laut
  FR-013 zentral und zuerst geladen werden muss, da er von praktisch allen Chart-Domänen gelesen
  wird.
- **`dashboard-core.js`**: generische Date-/Format-Helfer (`parseGermanDate`,
  `formatDuration`, `formatPaceLabel`, …) sowie die bereits existierende, aber bisher nicht
  eigenständig ausgelagerte "Total Distance"-Dashboard-Aggregation (`renderDashboard`,
  `buildTrainingChart`, `aggregateActivitiesBy...`). Diese Funktionen werden von mehreren
  Chart-Domänen (Equipment, Distributions, Scatter) genutzt und gehören funktional weder zu
  Import noch zu einer einzelnen Chart-Domäne.
- **`dashboard-power-pb.js`** entspricht der in der Spec nicht separat benannten, aber im
  Feature-Kontext ("Power PBs"-Tab) faktisch vorhandenen achten Domäne; sie wird in der Spec
  implizit unter "Chart.js-Rendering" mitgedacht.
- **`dashboard-tabs.js`** bündelt das Tab-Wiring (Aufrufe von `window.dashboardTabNavigation`)
  und den verbleibenden Bootstrap-/Init-Code (initiale Icon-/Analysis-Counter-Initialisierung,
  finaler `setVisualizationTab(...)`-Aufruf), da dieser Code naturgemäß zuletzt geladen werden
  muss, nachdem alle anderen Domänen ihre globalen Funktionen definiert haben.

**Alternatives considered**:
- *Exakt sieben Dateien wie im Feature-Wunsch benannt, Zustand/Helfer in die "nächstgelegene"
  Datei einsortieren*: verworfen, da geteilter Zustand dann in einer beliebigen Bereichsdatei
  läge und alle anderen Bereiche implizit von deren Ladereihenfolge abhingen — widerspricht
  FR-013 (zentrale State-Datei) und erhöht das Risiko von Zirkelbezügen.
- *Eine einzige "shared/misc"-Datei für Zustand, Helfer, PB-Domäne und Tabs zusammen*: verworfen,
  da das wieder eine unübersichtliche Sammel-Datei erzeugen und der Kernanforderung
  ("klar benannte Verantwortungsbereiche", FR-002) widersprechen würde.

## Entscheidung 2: Umgang mit `src/dashboard-utils.js` (bestehender Test-Only-Duplikat-Sonderfall)

**Decision**: `src/dashboard-utils.js` bleibt unangetastet. Der inline vorhandene, sehr ähnliche
Code (`findHeaderIndex`, `parseGermanDate`, `processData`, …) wird unverändert nach
`src/dashboard-import.js` bzw. `dashboard-core.js` verschoben — als weiterhin separate Kopie,
nicht konsolidiert mit `dashboard-utils.js`.

**Rationale**: `dashboard-utils.js` ist laut vorherigem Feature (`specs/019-distributions-refinements`)
bewusst ein reiner, nur von Jest genutzter Test-Zwilling der Inline-Logik und wird von
`index.html` nicht per `<script src>` geladen. Ihn jetzt zu konsolidieren wäre eine
Verhaltens-/Architekturänderung, die über reine Code-Reorganisation hinausgeht (FR-012 verbietet
das explizit) und ein eigenes Risiko-Assessment bräuchte. Diese Aufteilung berührt die Datei
daher nicht.

**Alternatives considered**: Zusammenführen beider Implementierungen und `index.html` künftig
`dashboard-utils.js` per `<script src>` laden lassen — verworfen als Scope-Erweiterung
(würde reale Verhaltensänderung am Lade-/Test-Setup bedeuten, nicht durch diese Spec gedeckt).

## Entscheidung 3: Fast-Duplikat `formatDuration` vs. `formatDurationHms`

**Decision**: Beide Funktionen bleiben als separate Funktionen bestehen, werden aber in ihre
jeweils zuständige Datei verschoben: `formatDuration` (u. a. für Dashboard-Zeitachsen) nach
`dashboard-core.js`, `formatDurationHms` (PB-spezifisches HH:MM:SS-Format) nach
`dashboard-power-pb.js`. Es wird keine Konsolidierung zu einer gemeinsamen Funktion vorgenommen.

**Rationale**: Beide haben unterschiedliches Ausgabeformat und unterschiedliche Aufrufer; ein
Zusammenführen wäre eine Verhaltens-/API-Änderung und damit außerhalb des Scopes einer reinen
Code-Reorganisation (FR-012).

**Alternatives considered**: Zusammenführen zu einer gemeinsamen Utility-Funktion mit Options-Parameter
— verworfen als unnötige Verhaltensänderung außerhalb des Feature-Scopes.

## Entscheidung 4: Cross-Domain-Konstante `PB_SPORT_COLOR`

**Decision**: `PB_SPORT_COLOR` (und die anderen `PB_*`-Konstanten) werden nach
`dashboard-power-pb.js` verschoben, da sie fachlich dort beheimatet sind. `dashboard-distributions.js`
liest sie als globale Konstante weiterhin, was voraussetzt, dass `dashboard-power-pb.js` **vor**
`dashboard-distributions.js` geladen wird.

**Rationale**: Eine Duplizierung der Konstante in beide Dateien würde zwei Quellen der Wahrheit
schaffen und bei künftigen Farb-Änderungen Inkonsistenzen riskieren; das widerspricht dem Ziel,
Merge-Konflikt-Risiko zu senken.

**Alternatives considered**: Konstante stattdessen nach `dashboard-state.js` oder
`dashboard-core.js` verschieben (dorthin, wo ohnehin "shared" Dinge landen) — als Alternative
akzeptabel, aber verworfen zugunsten der fachlichen Zuordnung zu PBs, um `dashboard-core.js`
nicht zu einer weiteren "Sammel-Datei" für PB-spezifische Farbkonstanten zu machen. Stattdessen
wird die Ladereihenfolge (`dashboard-power-pb.js` vor `dashboard-distributions.js`) explizit im
Contract dokumentiert (siehe [contracts/script-load-order.md](./contracts/script-load-order.md)).

## Entscheidung 5: Zerlegung der 800-Zeilen-Funktion `renderPbChart`

**Decision**: `renderPbChart` und alle ihre aktuell als lokale Closures definierten Helfer
(`appendTimelineAxes`, `showPbTooltip`, `renderPowerDurationTileChart`, `renderBikePowerSection`, …)
werden **als zusammenhängender Block unverändert** in `dashboard-power-pb.js` verschoben. Die
Closures werden NICHT zu eigenständigen Top-Level-Funktionen gemacht.

**Rationale**: FR-012 verbietet neue Funktionalität und Verhaltensänderungen; eine Zerlegung der
Closures wäre ein zusätzliches internes Refactoring über die reine Datei-Verschiebung hinaus und
erhöht das Regressions-Risiko unnötig, ohne einen von der Spec geforderten Nutzen zu erzeugen
(die Datei-Grenze allein liefert bereits den Auffindbarkeits-Gewinn aus User Story 1).

**Alternatives considered**: Innerhalb von `dashboard-power-pb.js` die Closures zu benannten
Top-Level-Funktionen machen, um sie potenziell später einzeln testbar zu machen — verworfen, da
laut Clarify-Antwort (Q1) keine zusätzliche Testabdeckung für Orchestrierungscode gefordert ist
und dies eine überflüssige Vergrößerung des Diffs wäre.

## Entscheidung 6: Anpassung von `__tests__/index-script-syntax.test.js`

**Decision**: `extractInlineScripts` wird erweitert, sodass sie zusätzlich die neuen
`src/dashboard-*.js`-Dateien einliest und deren Inhalt an den verbleibenden Inline-Code anhängt,
bevor die bestehende `new Function(...)`-Syntaxprüfung läuft. Die bestehenden inhaltlichen
`toContain`/`toMatch`-Assertions, die auf konkrete Funktionsnamen/Codefragmente aus dem
(vormals) Inline-Block prüfen, werden unverändert beibehalten — sie funktionieren weiter, weil
ihr Zielstring (`inlineCode`-Äquivalent) jetzt Inline-Rest + alle `dashboard-*.js`-Inhalte
umfasst.

**Rationale**: Das erhält den bisherigen Testzweck ("erkennt Syntaxfehler, die die ganze Seite
brechen würden") und die bisherige inhaltliche Aussagekraft (spezifische Assertions bleiben
gültig), ohne die Testdatei komplett neu zu schreiben — konsistent mit FR-011 und SC-005.

**Alternatives considered**: Für jede neue Datei einen eigenen, separaten Syntax-Test anlegen —
verworfen als unnötige Vervielfachung nahezu identischer Testlogik; ein gemeinsamer,
parametrisierter Ansatz (Inline-Rest + alle `dashboard-*.js`-Dateien in einem String) ist
einfacher zu warten und entspricht der bestehenden Teststruktur am nächsten.

## Entscheidung 7: Lade-Reihenfolge der neuen `<script src>`-Tags

**Decision**: Reihenfolge (nach den bestehenden neun `src/*.js`-Tags, vor dem verbleibenden
Rest-Inline-Code):

1. `dashboard-state.js`
2. `dashboard-core.js`
3. `dashboard-import.js`
4. `dashboard-equipment.js`
5. `dashboard-distributions.js`
6. `dashboard-scatter.js`
7. `dashboard-heatmap.js`
8. `dashboard-power-pb.js`
9. `dashboard-export.js`
10. `dashboard-tabs.js`

**Rationale**: Ergibt sich direkt aus der Abhängigkeitsanalyse (siehe Punkt 4 oben:
`dashboard-distributions.js` liest `PB_SPORT_COLOR` aus `dashboard-power-pb.js` → Power-PB muss
vor Distributions geladen werden; alle Chart-Domänen lesen Zustand aus `dashboard-state.js` und
Helfer aus `dashboard-core.js` → beide müssen zuerst geladen werden; `dashboard-tabs.js` löst den
initialen Render aus und muss daher zuletzt kommen).

Vollständig dokumentiert in [contracts/script-load-order.md](./contracts/script-load-order.md).

## Entscheidung 8: Kopplung zum bestehenden separaten Imprint/Privacy-Modal-Block

**Decision**: Der bereits separate Inline-Script-Block für Imprint/Privacy-Modals
([index.html](../../index.html#L1439-L1568)) bleibt unverändert an seiner Stelle (vor den neuen
`dashboard-*.js`-Einbindungen). Seine bestehende Referenz auf `closePbDetail()` und
`closePreviewGateModal()` (beide künftig in `dashboard-power-pb.js` bzw. `dashboard-import.js`
definiert) bleibt funktional bestehen, da diese Funktionen zur Laufzeit (nicht zur Parse-Zeit)
aufgerufen werden und der Imprint/Privacy-Block bereits nach allen `<script src>`-Tags im
Dokument steht.

**Rationale**: Die Referenzen werden erst bei tatsächlichem Tastatur-Escape-Event ausgeführt, zu
diesem Zeitpunkt sind alle Skripte längst geladen — die Reihenfolge der `<script>`-Tags im HTML
ist hier nicht ausschlaggebend, solange der Imprint/Privacy-Block nicht vor den
`dashboard-*.js`-Dateien im Dokument steht (was er bereits nicht tut, da er weiter oben im
Dokument bleibt, aber erst nach Body-Ladeabschluss ausgeführt wird). Kein Änderungsbedarf an
diesem Block.

**Alternatives considered**: Den Imprint/Privacy-Block ebenfalls nach `src/dashboard-modals.md`
verschieben — verworfen, da laut Clarify-Antwort Q2 dieser Block bereits korrekt isoliert ist und
keine funktionale Notwendigkeit für eine Verschiebung besteht (kein Nutzen, zusätzliches Risiko).
