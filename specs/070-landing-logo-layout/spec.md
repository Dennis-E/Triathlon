# Feature Specification: Landingpage Logo Layout

**Feature Branch**: `070-landing-logo-layout`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "- landing page: bei schmalem layout wird das logo gequetscht, das soll nicht passieren"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Landingpage auf schmalen Displays ansehen (Priority: P1)

Besucher öffnen die Landingpage auf einem schmalen Bildschirm und möchten das TriAnalytica-Logo vollständig und in seinen ursprünglichen Proportionen sehen. Das Logo darf dabei nicht durch benachbarte Inhalte zusammengedrückt oder verdeckt werden.

**Why this priority**: Das Logo ist ein zentraler Markenbestandteil der Landingpage. Eine verzerrte Darstellung beeinträchtigt die Wiedererkennbarkeit direkt.

**Independent Test**: Die Landingpage bei schmalen Viewport-Breiten öffnen und prüfen, ob Logo, Kopfbereich und Hauptbereich vollständig und ohne Verzerrung sichtbar sind.

**Acceptance Scenarios**:

1. **Given** die Landingpage wird bei 320 CSS-Pixeln Breite angezeigt, **When** Kopfbereich und Hauptbereich dargestellt werden, **Then** bleiben beide Logo-Darstellungen vollständig sichtbar und unverzerrt.
2. **Given** die verfügbare Breite reicht nicht für alle Inhalte im Kopfbereich, **When** die Seite dargestellt oder in der Breite verändert wird, **Then** wird die Anordnung angepasst, ohne dass das Logo gequetscht wird, Inhalte einander überdecken oder horizontaler Seitenüberlauf entsteht.
3. **Given** die Landingpage wird auf einem breiteren Viewport angezeigt, **When** das Layout dargestellt wird, **Then** bleiben die Logo-Proportionen erhalten und die übrige Landingpage weiterhin nutzbar.

### Edge Cases

- Bei der kleinsten unterstützten Breite von 320 CSS-Pixeln konkurrieren Logo und Navigation um den Platz im Kopfbereich.
- Beim Ändern der Fensterbreite muss das Logo ohne kurzzeitige oder bleibende Verzerrung in die neue Anordnung übergehen.
- Lange oder mehrzeilige Inhalte dürfen weder das Logo überlagern noch einen horizontalen Seitenüberlauf verursachen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Die Landingpage MUSS sämtliche TriAnalytica-Logo-Darstellungen mit unverändertem Seitenverhältnis anzeigen.
- **FR-002**: Bei schmalen Viewports MUSS die Anordnung benachbarter Inhalte so angepasst werden, dass das Logo vollständig sichtbar bleibt und nicht gequetscht oder überdeckt wird.
- **FR-003**: Die Landingpage DARF bei Viewport-Breiten ab 320 CSS-Pixeln durch die Logo-Darstellung keinen horizontalen Seitenüberlauf erzeugen.
- **FR-004**: Logo und umgebende Inhalte MÜSSEN bei einer Änderung der Viewport-Breite lesbar und nutzbar bleiben.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Bei Viewport-Breiten von 320, 375, 768 und 1280 CSS-Pixeln ist jede Logo-Darstellung vollständig sichtbar und weist keine erkennbare Verzerrung auf.
- **SC-002**: Bei Viewport-Breiten von 320 bis 767 CSS-Pixeln gibt es keinen horizontalen Seitenüberlauf und keine Überdeckung zwischen Logo und benachbarten Inhalten.
- **SC-003**: In einer Sichtprüfung bleibt das TriAnalytica-Logo bei allen geprüften Breiten eindeutig erkennbar, und die Landingpage-Inhalte bleiben zugänglich.

## Assumptions

- Gemeint sind alle Logo-Darstellungen auf der Landingpage, einschließlich der Darstellung im Kopfbereich und der Darstellung im Hauptbereich.
- Das bestehende Logo und seine Gestaltung bleiben unverändert; die Anordnung der umgebenden Inhalte darf sich an schmale Viewports anpassen.
- Viewports ab 320 CSS-Pixeln bilden die kleinste unterstützte Breite für dieses Verhalten.