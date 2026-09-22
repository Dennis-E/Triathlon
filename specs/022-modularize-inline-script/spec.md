# Feature Specification: Inline-Script von index.html in Feature-Module aufteilen

**Feature Branch**: `[022-modularize-inline-script]`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "Die Datei index.html ist mit ca. 6.200 Zeilen zu groß geworden, davon allein ~4.660 Zeilen in einem einzigen Inline-<script>-Block, der DOM-Orchestrierung, Import-Flow-Steuerung, Chart.js-Rendering (Equipment, Distributions, Scatter, Heatmap), Export-Komposition und Modal-Handling enthält. Das erschwert Navigation, erhöht das Merge-Conflict-Risiko und ist nicht sinnvoll testbar. Ziel: Den großen Inline-<script>-Block in mehrere thematisch geordnete, klassische <script src=\"...\"> Dateien aufteilen, ohne die bestehende Architektur (kein Bundler, kein Build-Step, weiterhin globale Funktionen/Variablen, kein sichtbares Verhaltensänderung) zu brechen."

## Clarifications

### Session 2026-09-22

- Q: Sollen für die neu ausgelagerten Orchestrierungs-Dateien zusätzliche automatisierte Funktionstests geschrieben werden, oder reicht der angepasste Syntax-Check plus manuelle Verifikation aus? → A: Kein zusätzlicher Testaufwand über den angepassten Syntax-Check hinaus; Verhalten wird nur manuell verifiziert.
- Q: Zu welchem Verantwortungsbereich sollen die Import-bezogenen Modals (Import-Fortschritt, Preview-Gate, Export-Vorschau) gehören? → A: Sie gehören zu ihrem jeweiligen Fachbereich (Import-Fortschritt/Preview-Gate zu Import-Flow, Export-Vorschau zu Export/Sharing); der Bereich „Modals/Privacy“ enthält nur Imprint/Privacy Policy.
- Q: Wie soll geteilter Zustand (z. B. importierte Aktivitätsdaten, die von mehreren Chart-Bereichen genutzt werden) auf die neuen Dateien verteilt werden? → A: Geteilter Zustand bleibt zentral in einer eigenen, zuerst geladenen Datei; alle Bereichsdateien greifen lesend darauf zu.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Feature-Code schnell finden und ändern (Priority: P1)

Als Entwickler:in, die einen Bug im Equipment-Chart oder im Import-Flow beheben oder eine kleine Verbesserung einbauen möchte, will ich direkt in einer klar benannten, überschaubaren Datei für diesen Verantwortungsbereich landen, statt in einem 4.660-Zeilen-Inline-Skript nach der richtigen Stelle suchen zu müssen.

**Why this priority**: Dies ist der Kernnutzen der gesamten Umstrukturierung — schnellere Orientierung und geringeres Risiko, beim Ändern eines Bereichs versehentlich einen anderen zu beeinflussen. Ohne diesen Effekt hat das Refactoring keinen Wert.

**Independent Test**: Kann unabhängig verifiziert werden, indem man für jeden der genannten Verantwortungsbereiche (Import-Flow, Equipment-Charts, Distributions-Charts, Scatter-Charts, Heatmap-Rendering, Export/Sharing, Modals/Privacy) prüft, dass der zugehörige Code in einer eigenen, klar benannten Datei unter `src/` liegt und `index.html` nur noch Markup plus `<script src="...">`-Einbindungen sowie minimalen Bootstrap-Code enthält.

**Acceptance Scenarios**:

1. **Given** die aufgeteilte Codebasis, **When** eine Entwicklerin nach dem Equipment-Chart-Rendering sucht, **Then** findet sie den gesamten zugehörigen Code in einer einzigen, eindeutig benannten Datei (z. B. `src/dashboard-equipment.js`) statt verteilt im großen Inline-Block.
2. **Given** die aufgeteilte Codebasis, **When** eine Entwicklerin `index.html` öffnet, **Then** sieht sie eine deutlich kürzere Datei ohne einen dominanten mehrere-tausend-Zeilen-Inline-`<script>`-Block, und die Verantwortungsbereiche sind über die Dateinamen der eingebundenen `<script src="...">`-Dateien erkennbar.

---

### User Story 2 - Unverändertes Nutzerverhalten nach der Umstrukturierung (Priority: P1)

Als Endnutzer:in der Anwendung möchte ich, dass Dashboard, Import, Diagramme, Export und Modals nach der internen Umstrukturierung exakt so funktionieren wie vorher — ohne sichtbare Unterschiede in Funktionalität, Darstellung oder Reihenfolge der Abläufe.

**Why this priority**: Das Refactoring darf keine Regressionen einführen; das ist eine harte Bedingung, ohne die die Umstrukturierung nicht akzeptiert werden kann.

**Independent Test**: Kann unabhängig verifiziert werden, indem die App lokal per `python -m http.server` gestartet wird und alle bestehenden Kernabläufe (Strava-Import, Tab-Wechsel, Diagramm-Rendering für Equipment/Distributions/Scatter/Heatmap, Export-Vorschau, Öffnen/Schließen von Modals) manuell durchgespielt werden und sich identisch zum Verhalten vor der Umstrukturierung verhalten; zusätzlich müssen alle bestehenden automatisierten Tests (`npm test`) weiterhin grün sein.

**Acceptance Scenarios**:

1. **Given** eine importierte Strava-Aktivitätendatei, **When** der Import-Flow durchlaufen wird, **Then** erscheinen Fortschrittsanzeige, Dashboard-Daten und alle Diagramme identisch zum bisherigen Verhalten.
2. **Given** das geöffnete Dashboard, **When** zwischen Tabs (Equipment, Distributions, Scatter, Heatmap, Power PBs) gewechselt wird, **Then** werden die jeweiligen Diagramme wie bisher korrekt gerendert.
3. **Given** das geöffnete Dashboard, **When** ein Export oder ein Modal (Import-Fortschritt, Preview-Gate, Export-Vorschau, Imprint, Privacy Policy) geöffnet und geschlossen wird, **Then** verhält es sich identisch zum bisherigen Verhalten.

---

### User Story 3 - Verlässliche Testabdeckung nach der Aufteilung (Priority: P2)

Als Entwickler:in möchte ich, dass der bestehende Syntax-Check-Test weiterhin sinnvoll ist, nachdem der Code aus dem Inline-Block in mehrere Dateien ausgelagert wurde, damit Syntaxfehler in den neuen Dateien genauso zuverlässig erkannt werden wie zuvor im Inline-Block.

**Why this priority**: Ohne Anpassung würde der bestehende Test nach der Umstrukturierung nur noch einen stark geschrumpften (oder leeren) Inline-Block prüfen und einen großen Teil des tatsächlichen Anwendungscodes nicht mehr erfassen — ein stiller Verlust an Testabdeckung.

**Independent Test**: Kann unabhängig verifiziert werden, indem ein absichtlich eingefügter Syntaxfehler in einer der neuen ausgelagerten Dateien den entsprechenden Test fehlschlagen lässt.

**Acceptance Scenarios**:

1. **Given** eine der neu ausgelagerten Dateien enthält einen Syntaxfehler, **When** `npm test` ausgeführt wird, **Then** schlägt der Syntax-Check-Test fehl und benennt die betroffene Datei.
2. **Given** alle ausgelagerten Dateien sind syntaktisch korrekt, **When** `npm test` ausgeführt wird, **Then** ist der Syntax-Check-Test (wie alle anderen bestehenden Tests) grün.

---

### Edge Cases

- Was passiert, wenn zwei ausgelagerte Dateien beide eine globale Funktion oder Variable mit demselben Namen definieren (Namenskollision)? Die Aufteilung muss solche Kollisionen vermeiden, da es weiterhin ein einziger globaler Scope ist (kein Modul-Scoping).
- Was passiert, wenn eine ausgelagerte Datei eine Funktion aus einer anderen ausgelagerten Datei benötigt, bevor diese im DOM geladen wurde? Die Ladereihenfolge der `<script src="...">`-Tags in `index.html` muss die tatsächlichen Abhängigkeiten zwischen den neuen Dateien widerspiegeln.
- Wie wird sichergestellt, dass Code, der aktuell auf Ausführungsreihenfolge innerhalb des einen Inline-Blocks angewiesen ist (z. B. Initialisierung beim Laden), nach der Aufteilung auf mehrere Dateien weiterhin in der richtigen Reihenfolge läuft?
- Was passiert mit `onclick="..."`-Attributen und anderem inline referenziertem Markup, das globale Funktionsnamen erwartet? Diese Referenzen müssen weiterhin gültig bleiben, unabhängig davon, in welcher Datei die referenzierte Funktion nun liegt.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Der bestehende große Inline-`<script>`-Block in `index.html` MUSS in mehrere klassische, per `<script src="...">` eingebundene JavaScript-Dateien aufgeteilt werden, thematisch geordnet nach Verantwortungsbereich (mindestens: Import-Flow-Steuerung, Equipment-Charts, Distributions-Charts, Scatter-Charts, Heatmap-Rendering, Export/Sharing-Komposition, Modals/Privacy-Handling). Import-bezogene Modals (Import-Fortschritt, Preview-Gate) gehören zum Bereich Import-Flow, die Export-Vorschau zum Bereich Export/Sharing; der Bereich Modals/Privacy umfasst ausschließlich Imprint- und Privacy-Policy-Handling. Da dieser Code bereits vor diesem Feature in einem eigenen, isolierten Inline-Script-Block vorlag (siehe research.md Entscheidung 8), gilt die Anforderung für diesen Bereich als erfüllt, ohne dass er zusätzlich in eine neue `src/`-Datei verschoben werden muss.
- **FR-002**: Jede neu ausgelagerte Datei MUSS über ihren Dateinamen erkennbar machen, welchen Verantwortungsbereich sie orchestriert (z. B. konsistentes Namensschema wie `dashboard-<bereich>.js`).
- **FR-003**: Die Anwendung MUSS weiterhin ohne Bundler und ohne Build-Step lauffähig sein, insbesondere weiterhin über `python -m http.server` bedienbar.
- **FR-004**: Die neuen ausgelagerten Dateien MÜSSEN als klassische, nicht-modulare Skripte eingebunden werden (kein `type="module"`, kein ESM-Umbau) und weiterhin globale Funktionen/Variablen verwenden, konsistent mit den bereits bestehenden Dateien unter `src/`.
- **FR-005**: Die bereits vorhandenen, testbaren Module unter `src/` (u. a. `equipment-utils.js`, `distribution-utils.js`, `heatmap-utils.js`, `export-utils.js`, `scatter-utils.js`, `power-pb-utils.js`, `zip-importer.js`, `tab-navigation.js`, `analysis-counter.js`) DÜRFEN durch diese Umstrukturierung inhaltlich nicht verändert werden.
- **FR-006**: Die neu entstehenden Orchestrierungs-Dateien MÜSSEN die bestehenden `src/`-Module weiterhin exakt so nutzen (Aufruf-Reihenfolge, übergebene Parameter, erwartete Rückgabewerte) wie vor der Umstrukturierung.
- **FR-007**: Nach der Aufteilung MUSS `index.html` deutlich kleiner sein als vorher und darf keinen dominanten, mehrere-tausend-Zeilen-umfassenden Inline-`<script>`-Block mehr enthalten.
- **FR-008**: Die Lade-Reihenfolge der neuen `<script src="...">`-Einbindungen in `index.html` MUSS die tatsächlichen Abhängigkeiten zwischen den neuen Dateien und den bestehenden `src/`-Modulen korrekt widerspiegeln, sodass beim Laden keine Referenzen auf noch nicht definierte globale Funktionen/Variablen auftreten.
- **FR-009**: Sämtliche für Endnutzer:innen sichtbare Funktionalität (Dashboard-Darstellung, Import-Flow, alle Diagrammtypen, Export/Sharing, Tab-Navigation, alle Modals) MUSS nach der Umstrukturierung unverändert funktionieren.
- **FR-010**: Alle bestehenden automatisierten Tests (`npm test` im Root sowie `npm test` in `services/api`) MÜSSEN nach der Umstrukturierung weiterhin erfolgreich durchlaufen, ohne dass ihre inhaltliche Aussagekraft reduziert wird.
- **FR-011**: Der bestehende Test [__tests__/index-script-syntax.test.js](__tests__/index-script-syntax.test.js) MUSS so angepasst werden, dass er weiterhin Syntaxfehler zuverlässig erkennt — sowohl im (ggf. verbleibenden, minimalen) Inline-Skript in `index.html` als auch in allen neu ausgelagerten Orchestrierungs-Dateien. Über diesen Syntax-Check hinaus sind KEINE zusätzlichen automatisierten Funktions-/Verhaltenstests für die neuen Orchestrierungs-Dateien erforderlich; die Verhaltensgleichheit wird durch manuelle Verifikation (siehe User Story 2) sichergestellt.
- **FR-012**: Die Umstrukturierung DARF keine neue Funktionalität einführen und MUSS sich auf reine Code-Reorganisation beschränken.
- **FR-013**: Zustand, der aktuell im Inline-Skript zwischen mehreren Verantwortungsbereichen geteilt wird (z. B. importierte/verarbeitete Aktivitätsdaten, die von Equipment-, Distributions-, Scatter- und Heatmap-Charts gemeinsam genutzt werden), MUSS in einer zentralen, vor allen bereichsspezifischen Dateien geladenen Datei verbleiben; die bereichsspezifischen Orchestrierungs-Dateien greifen lesend darauf zu, statt eigene Kopien zu führen.

### Key Entities

- **Zentraler Dashboard-Zustand (neu)**: Eine zuerst geladene Datei unter `src/`, die den zwischen mehreren Verantwortungsbereichen geteilten Zustand (z. B. importierte/verarbeitete Aktivitätsdaten) als globale Variablen hält, auf die alle bereichsspezifischen Orchestrierungs-Dateien lesend zugreifen.

- **Orchestrierungs-Datei (neu)**: Eine klassische JavaScript-Datei unter `src/`, die einen abgegrenzten Verantwortungsbereich der Dashboard-Steuerung übernimmt (z. B. Import-Flow, ein bestimmter Chart-Typ, Export/Sharing oder Modal-Handling), als globales Skript per `<script src="...">` in `index.html` eingebunden wird und die bestehenden testbaren Utility-Module aus `src/` nutzt.
- **Bestehendes Utility-Modul (unverändert)**: Eines der bereits vorhandenen, getesteten Module unter `src/` (z. B. `equipment-utils.js`, `heatmap-utils.js`), das reine Daten-/Visualisierungslogik kapselt und von den Orchestrierungs-Dateien aufgerufen wird.
- **index.html (reduziert)**: Die verbleibende HTML-Datei, die nach der Umstrukturierung primär Markup sowie die geordneten `<script src="...">`-Einbindungen enthält, ohne den bisherigen dominanten Inline-Codeblock.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `index.html` enthält nach der Umstrukturierung keinen Inline-`<script>`-Block mehr, der mehr als einen kleinen Bruchteil (deutlich unter 500 Zeilen) des bisherigen ~4.660-Zeilen-Blocks ausmacht.
- **SC-002**: Für sechs der sieben genannten Verantwortungsbereiche (Import-Flow, Equipment, Distributions, Scatter, Heatmap, Export/Sharing) existiert genau eine klar benannte, eigenständige Datei unter `src/`, die diesen Bereich orchestriert. Für Modals/Privacy gilt die Anforderung als erfüllt, wenn der bestehende, bereits vor diesem Feature isolierte Imprint/Privacy-Script-Block unverändert erhalten bleibt.
- **SC-003**: 100 % der vor der Umstrukturierung bestehenden automatisierten Tests (Root und `services/api`) laufen nach der Umstrukturierung unverändert erfolgreich durch.
- **SC-004**: Ein manueller Durchlauf aller Kernabläufe (Import, Tab-Wechsel, alle Diagrammtypen, Export, alle Modals) zeigt keine für Endnutzer:innen wahrnehmbare Verhaltensänderung gegenüber dem Stand vor der Umstrukturierung.
- **SC-005**: Ein absichtlich in eine ausgelagerte Datei eingefügter Syntaxfehler wird vom angepassten Syntax-Check-Test zuverlässig erkannt und lässt den Testlauf fehlschlagen.

## Assumptions

- Die Aufteilung erfolgt ausschließlich strukturell (Verschieben von Code in neue Dateien plus Anpassen der Ladereihenfolge); es werden keine Bundler, Modul-Loader oder Build-Tools eingeführt.
- Die neuen Dateien werden unter `src/` abgelegt, analog zu den bereits bestehenden ausgelagerten Modulen, um Konsistenz in der Projektstruktur zu wahren.
- Bestehende `onclick="..."`- und andere inline referenzierte Funktionsnamen im Markup bleiben unverändert gültig, da alle Funktionen weiterhin im globalen Scope definiert werden.
- Eine feingranularere Aufteilung als die sieben genannten Bereiche (z. B. weitere Unterdateien) ist zulässig, solange die Benennung weiterhin klar den jeweiligen Verantwortungsbereich erkennen lässt.
- Der bestehende Test [__tests__/index-script-syntax.test.js](__tests__/index-script-syntax.test.js) darf inhaltlich erweitert/angepasst werden, um zusätzliche Dateien einzubeziehen, ohne dass dadurch bestehende Prüfungen entfernt werden.
