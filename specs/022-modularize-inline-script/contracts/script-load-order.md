# Contract: Script-Ladereihenfolge in `index.html`

Da dieses Feature keine externe API oder ein UI-Contract im klassischen Sinn einführt, ist die
einzige echte "Schnittstelle" zwischen den neuen Modulen ihre **Ladereihenfolge und die dadurch
implizit garantierte Verfügbarkeit globaler Funktionen/Variablen** zum Zeitpunkt, an dem eine
nachfolgende Datei geparst wird. Dieser Contract MUSS bei der Implementierung exakt eingehalten
werden, sonst schlagen `ReferenceError`s zur Laufzeit fehl.

## Pflicht-Reihenfolge der `<script src="...">`-Tags

```html
<!-- bestehende, unveränderte Utility-Module (Reihenfolge bleibt wie bisher) -->
<script src="./src/tab-navigation.js"></script>
<script src="./src/scatter-utils.js"></script>
<script src="./src/distribution-utils.js"></script>
<script src="./src/equipment-utils.js"></script>
<script src="./src/export-utils.js"></script>
<script src="./src/power-pb-utils.js"></script>
<script src="./src/zip-importer.js"></script>
<script src="./src/heatmap-utils.js"></script>
<script src="./src/analysis-counter.js"></script>

<!-- NEU: Dashboard-Orchestrierung, in dieser exakten Reihenfolge -->
<script src="./src/dashboard-state.js"></script>
<script src="./src/dashboard-core.js"></script>
<script src="./src/dashboard-import.js"></script>
<script src="./src/dashboard-equipment.js"></script>
<script src="./src/dashboard-power-pb.js"></script>
<script src="./src/dashboard-distributions.js"></script>
<script src="./src/dashboard-scatter.js"></script>
<script src="./src/dashboard-heatmap.js"></script>
<script src="./src/dashboard-export.js"></script>
<script src="./src/dashboard-tabs.js"></script>
```

> Hinweis: `dashboard-power-pb.js` MUSS vor `dashboard-distributions.js` geladen werden, weil
> `renderDistributionsChart` die dort definierte Konstante `PB_SPORT_COLOR` referenziert
> (siehe [research.md](../research.md#entscheidung-4-cross-domain-konstante-pb_sport_color)).

## Abhängigkeitsregeln

1. **`dashboard-state.js`** darf keine Funktionen aus anderen `dashboard-*.js`-Dateien aufrufen
   (nur Variablendeklarationen, keine Logik) — es ist die einzige Datei ohne eingehende
   Abhängigkeit auf andere neue Dateien.
2. **`dashboard-core.js`** darf nur auf `dashboard-state.js` und die bereits bestehenden
   `src/*.js`-Utility-Module zugreifen.
3. Jede Chart-Domänen-Datei (`dashboard-equipment.js`, `dashboard-distributions.js`,
   `dashboard-scatter.js`, `dashboard-heatmap.js`, `dashboard-power-pb.js`) darf auf
   `dashboard-state.js`, `dashboard-core.js` und ihr jeweiliges bestehendes Utility-Modul
   (`window.equipmentUtils`, `window.distributionUtils`, …) zugreifen, aber NICHT auf eine andere
   Chart-Domänen-Datei — außer der explizit dokumentierten Ausnahme `PB_SPORT_COLOR`
   (Distributions liest von Power-PB).
4. **`dashboard-export.js`** darf auf `dashboard-state.js`, `dashboard-core.js` und alle
   Chart-Domänen-Dateien lesend zugreifen (für Export-Snapshots von Charts/PB-Detail).
5. **`dashboard-tabs.js`** lädt zuletzt und darf auf alle vorherigen Dateien zugreifen; es
   enthält den einzigen Code, der beim Parsen sofort ausgeführt wird und den initialen
   Render auslöst (`setVisualizationTab(selectedVisualizationTab)`).
6. Der bereits bestehende separate Inline-Script-Block für Imprint/Privacy-Modals
   ([index.html](../../index.html#L1439-L1568)) bleibt an seiner bisherigen Position **vor**
   allen `dashboard-*.js`-Tags. Seine Laufzeit-Referenzen auf `closePbDetail()` und
   `closePreviewGateModal()` sind zulässig, weil sie erst bei einem `keydown`-Event nach
   vollständigem Laden aller Skripte ausgeführt werden (kein Parse-Zeit-Zugriff).

## Verifikation dieses Contracts

- Manuell: Öffnen der Browser-Konsole beim Laden von `index.html` über
  `python -m http.server` darf keine `ReferenceError`/`is not defined`-Meldungen zeigen
  (siehe [quickstart.md](../quickstart.md)).
- Automatisiert: Der überarbeitete
  [__tests__/index-script-syntax.test.js](../../__tests__/index-script-syntax.test.js) prüft die
  Syntaxgültigkeit aller Dateien; die tatsächliche Ladereihenfolge wird zusätzlich durch einen
  einfachen Regex-Test auf die Tag-Reihenfolge in `index.html` abgesichert (neuer Testfall, siehe
  tasks.md).
