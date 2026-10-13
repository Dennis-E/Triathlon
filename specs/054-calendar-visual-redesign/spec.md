# Feature Specification: Training Calendar Visual Redesign

**Feature Branch**: `054-calendar-visual-redesign`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "calendar: the grey is still much to prominent for zero activity. The design is not good." Reference: the provided GitHub contributions calendar screenshot.

## Clarifications

### Session 2026-10-13

- Q: Wie sollen Tage ohne Aktivität im Kalender im Vergleich zum dunklen Hintergrund erscheinen? → A: Sehr dezent erkennbare dunkle Felder, die sich leicht vom Hintergrund abheben, ohne helle Füllung oder dauerhafte helle Kontur.

## Visual Reference

The user-provided screenshot is the layout reference. It shows the GitHub contributions calendar; use its compact structure and restrained treatment of inactive days as inspiration, while retaining TriAnalytica's dark visual theme, training terminology, filters, and multi-year presentation.

![GitHub contributions calendar reference screenshot](../../private-data/interim/Screenshot%202026-10-13%20090200.png)

Key characteristics to carry into this feature:

- A short summary and relevant controls sit above a compact contribution grid.
- Weeks run left to right as columns, with seven consistent weekday rows; month labels sit above and align with the corresponding weeks.
- Inactive days are quiet, low-contrast squares; active days form the visual focus through a small, ordered intensity palette.
- A horizontal scrollbar supports the full time range when it does not fit in the available width.
- A compact Less-to-More legend sits below the grid and explains inactive plus increasing activity levels.
- The reference's GitHub-specific contribution wording and single-year controls are not copied; existing training labels, filters, export, and stacked years remain.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trainingsfreie Tage zurücknehmen (Priority: P1)

Als Athlet möchte ich trainingsfreie Tage als ruhigen, nahezu hintergrundgleichen Zustand sehen, damit die vielen inaktiven Tage den Kalender nicht dominieren und Trainingstage sofort hervorstechen.

**Why this priority**: Leere Tage machen den größten Teil einer Jahresübersicht aus. Ihre derzeitige graue Fläche zieht zu viel Aufmerksamkeit auf sich und kehrt die gewünschte visuelle Hierarchie um.

**Independent Test**: Eine Jahresübersicht mit leeren Tagen sowie aktiven Tagen aller Intensitätsstufen wird angezeigt. Leere Tage fügen sich in den dunklen Kalenderhintergrund ein, während selbst die niedrigste aktive Stufe eindeutig als Aktivität erkennbar bleibt.

**Acceptance Scenarios**:

1. **Given** ein Kalender enthält aktive und inaktive Tage, **When** er angezeigt wird, **Then** wirken inaktive Tage nahezu wie der Hintergrund und heller graue Flächen oder helle Umrandungen dominieren das Raster nicht.
2. **Given** ein inaktiver Tag grenzt an einen aktiven Tag der niedrigsten Stufe, **When** beide betrachtet werden, **Then** ist der aktive Tag deutlich erkennbar und der inaktive Tag bleibt visuell zurückgenommen.
3. **Given** ein Jahr oder ein Sportfilter enthält keine Aktivität, **When** der Kalender angezeigt wird, **Then** bleiben alle Datumsspalten und -zeilen auffindbar, ohne dass leere Felder wie hervorgehobene Kacheln erscheinen.

### User Story 2 - Trainingsmuster in einer klaren Jahresmatrix erfassen (Priority: P1)

Als Athlet möchte ich die Jahreskalender in einer an der bereitgestellten GitHub-Beitragskalenderansicht orientierten Wochenmatrix lesen, damit ich Aktivitätsphasen und Pausen schnell erkenne und Jahre vergleichen kann.

**Why this priority**: Die Kalenderansicht soll nicht nur einzelne Farben zeigen, sondern mit einer ruhigen und klar orientierbaren Struktur Trainingsmuster schnell verständlich machen.

**Independent Test**: Bei importierten Daten aus mehreren Jahren kann eine Testperson Monat, Wochentag und Reihenfolge eines Tagesfeldes zuordnen sowie aktive Phasen und trainingsfreie Abschnitte erkennen.

**Acceptance Scenarios**:

1. **Given** ein oder mehrere Kalenderjahre sind sichtbar, **When** der Nutzer das Raster liest, **Then** verlaufen Wochen als Spalten chronologisch von links nach rechts und die sieben Wochentage bilden gleichbleibende Zeilen.
2. **Given** ein Kalenderjahr ist sichtbar, **When** der Nutzer eine Position im Raster sucht, **Then** sind Monatsnamen oberhalb der passenden Wochen ausgerichtet und die sieben Reihen bilden ein gleichmäßiges, chronologisch lesbares Raster; Tagesdaten bleiben über die vorhandenen Tageshinweise verfügbar.
3. **Given** mehrere Jahre sind vorhanden, **When** die Ansicht geöffnet wird, **Then** erscheinen die Jahresraster untereinander, neuestes Jahr zuerst, jeweils mit klar zugeordnetem Jahrstitel und ohne schwer wirkende, wiederholte Dekoration.
4. **Given** die Ansicht wird auf einem schmalen Bildschirm betrachtet, **When** das Wochenraster nicht vollständig in die verfügbare Breite passt, **Then** kann es horizontal erkundet werden, ohne die Zuordnung zu Monat oder Jahr zu verlieren.

### User Story 3 - Aktivität, Filter und Tagesdetails zuverlässig verstehen (Priority: P2)

Als Athlet möchte ich Intensitätsstufen, Tagesdetails und die vorhandenen Filter weiterhin eindeutig nutzen können, damit eine ruhigere Gestaltung keine Trainingsinformation oder Bedienmöglichkeit entfernt.

**Why this priority**: Die optische Überarbeitung ist nur erfolgreich, wenn die bestehende Funktion und Zugänglichkeit der Kalenderansicht erhalten bleiben.

**Independent Test**: Mit mehreren Sportarten, Jahren und Tagesaktivitäten lassen sich Farbschema und Sportfilter nutzen; aktive Tagesfelder zeigen weiterhin die zugehörigen Details per Maus und Tastatur.

**Acceptance Scenarios**:

1. **Given** ein Farbschema und ein Sportfilter sind gewählt, **When** die Ansicht angezeigt oder der Filter gewechselt wird, **Then** bleiben aktive Intensitätsstufen unterscheidbar und inaktive Tage dezent.
2. **Given** ein aktives oder inaktives Tagesfeld wird mit Maus oder Tastatur fokussiert, **When** es betrachtet wird, **Then** bleiben Datum und vorhandene Tagesdetails zugänglich; bei inaktiven Tagen wird keine Aktivität vorgetäuscht.
3. **Given** der Nutzer exportiert die Kalenderansicht, **When** die bestehende Exportfunktion verwendet wird, **Then** entspricht das exportierte Raster der sichtbaren Jahres-, Farb- und Filterauswahl und erhält die zurückgenommene Darstellung inaktiver Tage.

### Edge Cases

- Ein vollständig leeres Jahr oder ein Filter ohne passende Aktivitäten behält ein lesbares Raster; der Leerzustand bleibt verständlich, ohne durch helle Tagesflächen zu dominieren.
- Der erste oder letzte Tag des Jahres sowie Schaltjahre bleiben an der richtigen Kalenderposition und ändern die Ausrichtung der übrigen Jahresraster nicht.
- Ein Wechsel des Sportfilters kann einen zuvor aktiven Tag inaktiv machen; dieser Tag muss unmittelbar den dezenten Nullaktivitätszustand annehmen.
- Farbpaletten müssen auch auf dunklem Hintergrund genügend Abstand zwischen Nullaktivität und der niedrigsten aktiven Stufe sowie untereinander aufeinanderfolgenden aktiven Stufen bewahren.
- Auf kleinen Bildschirmen dürfen Überschriften, Monatsmarken und Tagesdetails beim Erkunden eines breiten Rasters nicht verloren gehen.
- Fokusindikatoren bleiben für Tastaturnutzer sichtbar, ohne die dauerhafte Darstellung trainingsfreier Felder in helle, hervorgehobene Kacheln zu verwandeln.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Anwendung MUSS Tagesfelder ohne Aktivität als sehr dezente dunkle Felder darstellen, deren relativer Helligkeitskontrast zum umgebenden Kalenderhintergrund über 1,0:1 und höchstens 1,2:1 beträgt, damit die Tagesposition erkennbar bleibt, ohne stärker hervorzutreten als aktive Tage.
- **FR-002**: Die Anwendung DARF trainingsfreie Tagesfelder nicht mit einer auffälligen hellgrauen oder weißen Füllung oder einer hellen dauerhaften Umrandung darstellen.
- **FR-003**: Die Anwendung MUSS für trainingsfreie Tage die räumliche Position im Raster sowie Datum, Fokusbedienbarkeit und vorhandene Tageshinweise erhalten.
- **FR-004**: Die Anwendung MUSS aktive Tage von inaktiven Tagen und voneinander aufeinanderfolgenden Intensitätsstufen in jedem angebotenen Farbschema klar unterscheidbar darstellen.
- **FR-005**: Die Anwendung MUSS ein kalenderübliches Wochenraster mit sieben Wochentagszeilen und chronologisch von links nach rechts angeordneten Wochenspalten darstellen.
- **FR-006**: Die Anwendung MUSS Monatsmarken oberhalb der zugehörigen Wochen ausrichten und die Datumsermittlung über die bestehenden Tageshinweise ermöglichen; zusätzliche Wochentagsbeschriftungen am Rasterrand sind nicht erforderlich.
- **FR-007**: Die Anwendung MUSS mehrere vorhandene Jahresraster untereinander und vom neuesten zum ältesten Jahr anzeigen; Jahresüberschriften MÜSSEN klar dem jeweiligen Raster zugeordnet bleiben.
- **FR-008**: Die Anwendung MUSS eine ruhige visuelle Hierarchie mit gleichmäßigen Abständen und zurückhaltender Rahmung verwenden; einzelne Tagesfelder und wiederholte Rahmen DÜRFEN nicht stärker hervortreten als die Trainingsdaten.
- **FR-009**: Die Anwendung MUSS eine kompakte Legende unterhalb des Rasters anbieten, die den inaktiven Zustand und steigende Aktivität von „Weniger“ bis „Mehr“ erklärt.
- **FR-010**: Die Anwendung MUSS auf schmalen Bildschirmen alle Tagesfelder horizontal erreichbar halten und die Zuordnung zu Monat und Jahr bewahren.
- **FR-011**: Die Anwendung MUSS die bestehenden Trainingsdaten, Aggregation, Farbschemata, Sportfilter, Tagesdetails, lokale Verarbeitung und Kalenderexport-Funktionalität erhalten.

### Key Entities *(include if feature involves data)*

- **Kalenderjahr**: Ein Jahresraster mit allen Kalendertagen, zugehöriger Trainingsintensität und einer dem Raster eindeutig zugeordneten Jahresüberschrift.
- **Kalendertag**: Eine Position im Wochenraster mit Datum, Aktivitätsstatus, Intensitätsstufe und vorhandenen Tagesdetails.
- **Nullaktivitätszustand**: Die Darstellung eines Tages ohne passende Aktivität, die nahe am Kalenderhintergrund bleibt und dennoch als Datum erreichbar ist.
- **Kalenderlayout**: Die räumliche Anordnung von Jahresrastern, Wochen, Wochentagen, Monatsmarken und Intensitätslegende.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Der relative Helligkeitskontrast trainingsfreier Tagesfelder zum Kalenderhintergrund liegt über 1,0:1 und höchstens bei 1,2:1; leere Felder bleiben weniger hervorgehoben als die niedrigste aktive Intensitätsstufe und haben keine dauerhafte helle Umrandung.
- **SC-002**: Die niedrigste aktive Intensitätsstufe erreicht gegenüber dem Nullaktivitätszustand mindestens 3:1 Kontrast, und alle fünf aktiven Stufen sind innerhalb jeder Farbpalette unterscheidbar.
- **SC-003**: Mindestens 90 % der Testnutzer erkennen in einem Kalender mit gemischter Aktivität innerhalb von 10 Sekunden sowohl aktive Trainingsphasen als auch einen trainingsfreien Abschnitt.
- **SC-004**: 100 % der geprüften Jahresraster ordnen jeden Tag dem korrekten Jahr, der richtigen Wochentagszeile und der richtigen chronologischen Wochenspalte zu; Monatsmarken sind den passenden Wochen zugeordnet.
- **SC-005**: Mindestens 95 % der Testnutzer können auf Desktop und schmalen Bildschirmen einen dargestellten Tag innerhalb von 10 Sekunden einem Monat und Jahr zuordnen.
- **SC-006**: In 100 % der geprüften Fälle bleiben Tagesdetails, Sportfilter, Farbschemata und der bestehende Bildexport nach der visuellen Überarbeitung nutzbar.

## Assumptions

- Die bereitgestellte GitHub-Beitragskalenderaufnahme ist die Layoutreferenz: kompakte Wochenmatrix, Monatsnamen oberhalb, zurückhaltende inaktive Zellen, Intensitätslegende darunter und horizontales Erkunden des Zeitraums. Die Aufnahme wird nicht als pixelgenaue Vorlage behandelt.
- Die GitHub-spezifischen Begriffe, Contribution-Zähler und Jahresauswahl werden nicht übernommen; die bestehende Training-Kalender-Funktionalität und Mehrjahresdarstellung bleiben maßgeblich.
- Die Anwendung behält ihr bestehendes dunkles Erscheinungsbild; Nullaktivität wird als leicht vom Kalenderhintergrund abgesetztes dunkles Feld dargestellt, nicht als weiße oder helle Graukachel und nicht als vollständig unsichtbare Rasterposition.
- Alle im aktuellen Kalender vorhandenen Jahre bleiben gleichzeitig sichtbar und in absteigender Reihenfolge angeordnet.
- Die Intensitätsberechnung, Datumszuordnung, Farbschemata, Filter, Tooltips und Exportinhalte werden funktional nicht neu definiert.
- Leere Tagesfelder müssen auch dann über Datum und Fokus erreichbar bleiben, wenn ihre Füllung optisch nahezu mit dem Hintergrund verschmilzt.