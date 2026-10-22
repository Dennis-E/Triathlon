# Feature Specification: Consistent Export Button Width

**Feature Branch**: `065-fix-export-button-width`
**Created**: 2026-10-22
**Status**: Draft
**Input**: User description: "Bei schmalem Fenster und einspaltigem Visualisierungslayout soll der Exportbutton nicht die gesamte verfügbare Breite einnehmen und rechts unnötigen Leerraum erzeugen. Der Button soll eine kompakte, feste Größe behalten."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Exportbutton kompakt und konsistent sehen (Priority: P1)

Nutzer sehen beim Wechsel zwischen Visualisierungen einen gleichmäßig dimensionierten Exportbutton. Wenn der Kopfbereich auf eine Spalte wechselt, bleibt der Button am Inhaltsrand statt sich über die ganze Zeile zu strecken.

**Why this priority**: Der überbreite Button erzeugt bei schmalen Fenstern eine unnötig dominante Fläche und erschwert das schnelle Erfassen von Überschrift und Filtern.
**Independent Test**: Visualisierungskopfzeilen bei mehreren schmalen und breiten Ansichtsfenstern prüfen und Buttonbreite, Ausrichtung, Beschriftung sowie Erreichbarkeit vergleichen.

**Acceptance Scenarios**:

1. **Given** ein schmales Fenster, in dem die Kopfzeile einspaltig dargestellt wird, **When** eine Visualisierung geöffnet wird, **Then** bleibt der Exportbutton kompakt und am Inhaltsrand ausgerichtet, statt die freie Zeilenbreite auszufüllen.
2. **Given** mehrere Visualisierungen mit derselben Exportaktion, **When** zwischen ihnen gewechselt wird, **Then** haben ihre Exportbuttons bei gleicher Fensterbreite dieselbe sichtbare Größe und Ausrichtung.
3. **Given** ein breites Fenster mit nebeneinander angeordnetem Kopfbereich, **When** eine Visualisierung geöffnet wird, **Then** bleibt der Exportbutton inhaltsbreit und belegt nicht den übrigen Platz der Kopfzeile.
4. **Given** ein sehr schmales unterstütztes Fenster, **When** der Button angezeigt wird, **Then** bleiben Symbol und Beschriftung lesbar und bedienbar, ohne aus dem Ansichtsfenster herauszuragen.
5. **Given** ein Exportbutton, **When** er aktiviert wird, **Then** bleiben die vorhandene Exportvorschau, der Download und die zugehörige Visualisierung unverändert funktionsfähig.

### Edge Cases

- Ansichtsbreiten nahe dem Wechsel zwischen ein- und mehrspaltigem Kopfbereich.
- Sehr schmale unterstützte Ansichten, in denen die vollständige Beschriftung andernfalls überlaufen könnte.
- Visualisierungen mit unterschiedlichen Überschriften- und Filterlängen.
- Tastaturfokus, Hover, deaktivierter oder ausgeblendeter Exportbutton.
- Verhindern, dass die Buttonanpassung Diagramme, Filter oder Exportaufnahmen in ihrer Größe verändert.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Exportbuttons in Visualisierungskopfzeilen MÜSSEN ihre kompakte, durch Inhalt und Gestaltung bestimmte Breite behalten und dürfen nicht automatisch die gesamte verfügbare Zeilenbreite einnehmen.
- **FR-002**: Dieselbe Exportaktion MUSS über alle Visualisierungen hinweg bei gleicher Ansichtsbreite konsistent dimensioniert und ausgerichtet sein.
- **FR-003**: In einem einspaltigen Kopfbereich MUSS der Exportbutton am Inhaltsrand ausgerichtet bleiben; die Ausrichtung darf nicht von der Breite des umgebenden Kopfbereichs abhängen.
- **FR-004**: Die Buttonbreite MUSS innerhalb des Ansichtsfensters bleiben. Beschriftung und Symbole müssen sichtbar und bedienbar bleiben; Abschneiden oder horizontales Überlaufen ist nicht zulässig.
- **FR-005**: Fokus-, Hover- und sonstige vorhandene Interaktionszustände MÜSSEN erhalten bleiben.
- **FR-006**: Die bestehende Exportaktion, Vorschau, Download, Datenzuordnung und Darstellung im exportierten Bild DÜRFEN durch die Größenanpassung nicht verändert werden.
- **FR-007**: Die Anpassung MUSS für alle betroffenen Visualisierungskopfzeilen einheitlich gelten und darf Filter, Diagramme oder andere Schaltflächen nicht unbeabsichtigt strecken oder verschieben.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Bei Ansichtsbreiten von 320, 375, 640, 768, 1024 und 1440 Bildschirmpunkten nimmt kein Exportbutton die gesamte verfügbare Breite seiner Kopfzeile ein.
- **SC-002**: Bei gleicher Ansichtsbreite unterscheiden sich die sichtbaren Abmessungen gleichartiger Exportbuttons über die Visualisierungen hinweg um höchstens 2 Bildschirmpunkte.
- **SC-003**: In einspaltigen Kopfzeilen beträgt der Abstand zwischen Button und Inhaltsrand höchstens 8 Bildschirmpunkte; rechts davon bleibt kein Button-Hintergrund, der lediglich die Zeile auffüllt.
- **SC-004**: Bei der schmalsten unterstützten Ansichtsbreite bleiben Beschriftung und Symbole ohne Abschneiden sichtbar, und der Button verursacht kein horizontales Scrollen.
- **SC-005**: Alle bestehenden Exportaktionen erzeugen weiterhin die richtige Vorschau und den richtigen Download; der bestehende fokussierte Exporttestbestand bleibt erfolgreich.

## Assumptions

- Die kompakte Breite wird durch den gemeinsamen Inhalt aus Symbolen, Beschriftung, Abständen und Innenabstand bestimmt; die Spezifikation schreibt keinen konkreten Pixelwert oder eine CSS-Technik vor.
- Alle Standard-Exportbuttons in Visualisierungskopfzeilen sind umfasst. Der separate Export im persönlichen-Bestzeiten-Detailbereich ist nur umfasst, falls er dieselbe gestreckte Kopfzeilenstruktur verwendet.
- Die existierende Breakpoint- und Kopfzeilenstruktur bleibt bestehen; diese Funktion ändert nicht die Reihenfolge oder Gruppierung von Titel, Filtern und Exportaktion.
- Die Funktion ändert weder Exportinhalte noch das lokale Datenschutz- und Downloadverhalten.