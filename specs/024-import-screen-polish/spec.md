# Feature Specification: Import-Screen Polish

**Feature Branch**: `024-import-screen-polish`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "Änderungen am Import-Screen: Während des Imports wechselnde Previews echter TriAnalytica-Visualisierungen und kurze humorvolle Statusmeldungen anzeigen; den GPS Track nicht doppelt zählen oder darstellen; die doppelte Status-Headline entfernen, sodass nur eine Hauptheadline und darunter Fortschrittsbalken mit schwarzer Detail-Statusbox verbleiben."

## Clarifications

### Session 2026-09-23

- Q: Sollen die Visualisierungs-Previews während des Imports live aus den bereits eingelesenen Nutzerdaten entstehen oder als vorbereitete Darstellungen bestehender TriAnalytica-Charts erscheinen? → A: Vorbereitete Darstellungen bestehender TriAnalytica-Charts.
- Q: Soll ein GPS-Track genau einmal pro importierter Aktivität oder genau einmal pro Quelldatei gezählt werden? → A: Genau ein GPS-Track pro importierter Aktivität mit GPS-Punkten; bei Multisport-Dateien werden die Punkte nach dem jeweiligen Sitzungszeitbereich segmentiert.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import mit Visualisierungs-Previews verfolgen (Priority: P1)

Als Nutzer, der einen Strava-Export importiert, möchte ich während der Verarbeitung wechselnde Previews echter TriAnalytica-Visualisierungen und kurze, leicht humorvolle Statusmeldungen sehen, damit der Import verständlicher wirkt und ich früh erkenne, welche Auswertungen mich danach erwarten.

**Why this priority**: Der Import ist der erste zentrale Nutzungsmoment. Eine verständliche und interessante Rückmeldung reduziert die wahrgenommene Wartezeit und macht den folgenden Dashboard-Nutzen sichtbar.

**Independent Test**: Einen gültigen Strava-Export importieren, die Importansicht während der Verarbeitung beobachten und prüfen, dass mindestens zwei unterschiedliche Visualisierungs-Previews sowie wechselnde Statusmeldungen erscheinen, ohne den Fortschritt zu blockieren.

**Acceptance Scenarios**:

1. **Given** ein Import wurde gestartet und die Verarbeitung läuft, **When** die Importansicht angezeigt wird, **Then** sieht der Nutzer eine Preview einer echten TriAnalytica-Visualisierung und eine kurze Statusmeldung.
2. **Given** die Verarbeitung dauert länger als einen einzelnen Anzeigezyklus, **When** der Import fortschreitet, **Then** wechseln Preview und/oder Statusmeldung automatisch, ohne dass der Nutzer eingreifen muss.
3. **Given** die Verarbeitung ist abgeschlossen oder fehlgeschlagen, **When** der Importstatus wechselt, **Then** endet die Preview-Rotation und die vorhandene Abschluss- oder Fehlermeldung bleibt eindeutig sichtbar.

### User Story 2 - Importfortschritt eindeutig lesen (Priority: P1)

Als Nutzer möchte ich eine einzige Hauptheadline und darunter den Fortschrittsbalken mit einer schwarzen Detail-Statusbox sehen, damit ich den Gesamtstatus und die aktuell verarbeitete Aktivität nicht doppelt angezeigt bekomme.

**Why this priority**: Doppelte Statusinformationen erzeugen Unsicherheit darüber, ob der Import zwei Schritte oder einen widersprüchlichen Zustand anzeigt.

**Independent Test**: Die Importansicht während eines Imports öffnen und die sichtbaren Überschriften und Statusbereiche zählen; es darf nur eine Hauptheadline geben, während die Detailaktivität ausschließlich in der schwarzen Statusbox erscheint.

**Acceptance Scenarios**:

1. **Given** die Importansicht ist geöffnet, **When** der Nutzer den Bereich betrachtet, **Then** erscheint genau eine Hauptheadline oberhalb des Fortschrittsbalkens.
2. **Given** eine konkrete Aktivität wird verarbeitet, **When** der Detailstatus aktualisiert wird, **Then** wird die Aktivität nur in der schwarzen Statusbox unter dem Fortschrittsbalken angezeigt und nicht zusätzlich als zweite Headline.
3. **Given** die Ansicht wird auf einem schmalen Bildschirm geöffnet, **When** Status und Preview dargestellt werden, **Then** bleiben Hauptheadline, Fortschrittsbalken und schwarze Statusbox lesbar und überlappen nicht.

### User Story 3 - GPS-Track einmalig ausweisen (Priority: P1)

Als Nutzer möchte ich, dass der GPS-Track im Importfortschritt nur einmal gezählt und dargestellt wird, damit die angezeigten Importzahlen die tatsächlich verarbeiteten Werte korrekt widerspiegeln.

**Why this priority**: Doppelte Zählung verfälscht direkt das Vertrauen in die Importstatistik und kann den Eindruck eines fehlerhaften Imports erzeugen.

**Independent Test**: Einen Export mit GPS-Track importieren, die Importdetails beobachten und nach Abschluss die Zählung prüfen; der GPS-Track darf nur einen Zählbeitrag und eine sichtbare Darstellung liefern.

**Acceptance Scenarios**:

1. **Given** ein Datensatz enthält einen GPS-Track, **When** dieser verarbeitet wird, **Then** wird er genau einmal in der Importzählung berücksichtigt und genau einmal dargestellt.
2. **Given** ein Datensatz enthält keinen GPS-Track, **When** dieser verarbeitet wird, **Then** wird kein GPS-Track-Eintrag künstlich ergänzt oder doppelt gezählt.
3. **Given** mehrere Aktivitäten werden importiert, **When** die Importzählung fortschreitet, **Then** bleibt die Summe der GPS-Track-Einträge gleich der Anzahl der tatsächlich vorhandenen importierten GPS-Tracks.

### Edge Cases

- Bei sehr kurzen Importen, die schneller als ein Preview-Wechsel abgeschlossen sind, wird mindestens ein gültiges Preview ohne sichtbares Flackern angezeigt und die Abschlussansicht wird direkt erreicht.
- Bei einem Importfehler werden Preview und Rotation beendet oder in einen stabilen Fehlerzustand überführt; die Fehlermeldung darf nicht durch eine Statusmeldung verdeckt werden.
- Wenn für eine Preview erforderliche Daten noch nicht verfügbar sind, wird nur eine andere vorhandene echte TriAnalytica-Visualisierung gezeigt; Platzhaltergrafiken zählen nicht als Preview.
- Statusmeldungen dürfen auch bei langen Dateinamen, vielen Aktivitäten oder kleinen Bildschirmen nicht den Fortschrittsbalken oder die schwarze Statusbox überdecken.
- Eine Garmin-Multisport/FIT-Datei mit mehreren Sitzungen darf nicht den vollständigen Quell-Track an jede abgeleitete Aktivität anhängen; Swim, T1, Bike, T2 und Run erhalten jeweils nur die GPS-/Record-Punkte ihres eigenen Sitzungszeitbereichs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Importansicht MUSS während einer laufenden Verarbeitung eine vorbereitete Darstellung einer tatsächlich in TriAnalytica verfügbaren Visualisierung anzeigen.
- **FR-002**: Die Importansicht MUSS während eines laufenden Imports automatisch zwischen mindestens zwei vorbereiteten Darstellungen verfügbarer TriAnalytica-Visualisierungen wechseln, sofern die Verarbeitungsdauer einen Wechsel zulässt.
- **FR-003**: Die Importansicht MUSS kurze, leicht humorvolle Statusmeldungen anzeigen und diese während der Verarbeitung wechseln, ohne den fachlichen Fortschrittsstatus zu ersetzen.
- **FR-004**: Preview-Wechsel und Statusmeldungen DÜRFEN die Verarbeitung, Zählung oder den Abschluss des Imports nicht verzögern oder verändern.
- **FR-005**: Die Importansicht MUSS genau eine Hauptheadline für den Gesamtstatus anzeigen.
- **FR-006**: Die detaillierte aktuell verarbeitete Aktivität MUSS ausschließlich in der schwarzen Statusbox unter dem Fortschrittsbalken angezeigt werden; eine zweite Status-Headline DARF NICHT erscheinen.
- **FR-007**: Das Layout MUSS Hauptheadline, Fortschrittsbalken, schwarze Statusbox und Preview bei üblichen Desktop- und mobilen Ansichtsbreiten ohne Überlappung darstellen.
- **FR-008**: Jede importierte Aktivität mit GPS-Punkten MUSS genau einen GPS-Track zählen und genau einmal in den Importdetails darstellen; Aktivitäten ohne GPS-Punkte DÜRFEN nicht gezählt werden.
- **FR-009**: Bei einer Quelldatei mit mehreren importierten Aktivitäten MUSS jede Aktivität ausschließlich die GPS-/Record-Punkte aus ihrem eigenen Sitzungszeitbereich erhalten; der vollständige Quell-Track DARF NICHT an jede Aktivität angehängt werden.
- **FR-010**: Die bestehende Abschluss- und Fehlerbehandlung des Imports MUSS weiterhin eindeutig sichtbar sein; die Preview-Anzeige DARF diese Zustände nicht verdecken.
- **FR-011**: Die Importanzeige MUSS die vorhandenen lokalen Strava-Daten und deren bestehende fachliche Bedeutungen unverändert verarbeiten; die Änderung betrifft nur Darstellung, Statusrückmeldung und die Korrektur der doppelten GPS-Track-Ausweisung.

### Key Entities

- **Importfortschritt**: Der sichtbare Gesamtstatus eines laufenden Imports einschließlich Hauptheadline, Fortschrittsbalken und aktueller Detailaktivität.
- **Visualisierungs-Preview**: Eine während des Imports angezeigte Vorschau einer realen TriAnalytica-Auswertung.
- **Statusmeldung**: Ein kurzer begleitender Text, der die laufende Importphase verständlich und leicht humorvoll beschreibt.
- **GPS-Track-Eintrag**: Der einmalige Import- und Anzeigeeintrag pro importierter Aktivität mit GPS-Punkten, einschließlich der zugehörigen Punkte innerhalb ihres Sitzungszeitbereichs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In mindestens 95 % der beobachteten Imports, die länger als 3 Sekunden dauern, sehen Nutzer mindestens zwei unterschiedliche echte Visualisierungs-Previews und mindestens zwei unterschiedliche Statusmeldungen.
- **SC-002**: 100 % der geprüften Imports zeigen genau eine Hauptheadline und keine zweite Status-Headline für die aktuelle Aktivität.
- **SC-003**: In 100 % der geprüften Imports entspricht die Anzahl der GPS-Track-Einträge der Anzahl der importierten Aktivitäten mit GPS-Punkten; kein GPS-Track wird doppelt gezählt oder dargestellt.
- **SC-004**: Mindestens 90 % der Testnutzer können während eines Imports ohne zusätzliche Erklärung den Gesamtstatus und die aktuell verarbeitete Aktivität korrekt unterscheiden.
- **SC-005**: Die zusätzliche Importanzeige verändert die gemessene Verarbeitungsdauer bei einem repräsentativen Export um höchstens 5 % gegenüber der bisherigen Importverarbeitung.
- **SC-006**: Nach Abschluss oder Fehler eines Imports ist der nächste Zustand für mindestens 95 % der Testfälle innerhalb eines Blicks erkennbar, ohne dass eine Preview oder Statusmeldung die Abschluss- oder Fehlermeldung verdeckt.

## Assumptions

- Die Importansicht verfügt bereits über einen Fortschrittsbalken und eine schwarze Statusbox; diese werden weiterverwendet und nicht durch einen neuen Importablauf ersetzt.
- Für die Previews werden ausschließlich vorbereitete Darstellungen von Visualisierungen verwendet, die bereits im TriAnalytica-Dashboard existieren; künstliche Beispielgrafiken und eine Abhängigkeit von den gerade importierten Nutzerdaten sind nicht erforderlich.
- Die Statusmeldungen dürfen auf Englisch bleiben, da die vorgegebenen Beispieltexte englisch sind und die bestehende Importoberfläche diese Sprache verwendet.
- Preview-Rotation und Meldungswechsel werden zeitgesteuert oder ereignisbasiert so abgestimmt, dass kurze Importe nicht unnötig verlängert werden.
- Die Korrektur umfasst die Importzählung, die sichtbare Importdarstellung und die zeitbereichsbasierte Zuordnung der GPS-Punkte zu Aktivitäten; bei Multisport-Dateien gilt jede Child-Aktivität als eigenständige Aktivität.
- Tests verwenden synthetische oder ausdrücklich bereitgestellte lokale Exportdaten und keine privaten Rohdaten aus dem Repository.
