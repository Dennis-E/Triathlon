# Feature Specification: Hide Partial Country Coverage Note

**Feature Branch**: `071-hide-country-coverage`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "- countries visited: \"Based on 599 of 744 activities\" dont show this"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Länderübersicht ohne Teilabdeckungshinweis ansehen (Priority: P1)

Eine Person sieht in den Lifetime Statistics, welche Länder sie besucht hat. Wenn nur ein Teil der Aktivitäten für die Länderbestimmung verwendet werden kann, soll die Karte „Countries visited“ trotzdem die Länderzahl und Ländernamen zeigen, aber nicht zusätzlich den Satz „Based on … activities“.

**Why this priority**: Der Hinweis lenkt in der kompakten Länderkarte von der gewünschten Information über besuchte Länder ab.

**Independent Test**: Eine Länderübersicht mit partieller Aktivitätsabdeckung anzeigen und sowohl die normale Dashboard-Karte als auch ihre Exportdarstellung prüfen. Die Länderzahl und -namen müssen sichtbar sein; der Teilabdeckungssatz darf in keiner der beiden Darstellungen erscheinen.

**Acceptance Scenarios**:

1. **Given** eine Länderübersicht hat partielle Abdeckung, **When** die Lifetime Statistics im Dashboard angezeigt werden, **Then** enthält die Karte die Länderzahl und Ländernamen, aber keinen Hinweis im Format „Based on X of Y activities“.
2. **Given** dieselbe Länderübersicht wird exportiert, **When** die Exportdarstellung erzeugt wird, **Then** enthält sie ebenfalls die Länderzahl und Ländernamen ohne den Teilabdeckungshinweis.
3. **Given** eine Länderübersicht hat vollständige Abdeckung, **When** Dashboard oder Export dargestellt werden, **Then** bleiben die bestehende Länderkarte und ihr Verhalten unverändert.

### Edge Cases

- Wenn Länderinformationen noch berechnet werden oder nicht verfügbar sind, bleiben die bestehenden Lade- und Verfügbarkeitszustände unverändert.
- Wenn sich die Anzahl der Aktivitäten oder die Teilabdeckung ändert, darf der ausgeblendete Hinweis in keiner Darstellung wieder erscheinen.
- Das Entfernen des Hinweises darf weder die Länderzahl noch die sortierte Liste der Ländernamen verändern.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Bei partieller Aktivitätsabdeckung DARF die Karte „Countries visited“ in Dashboard und Export keinen erklärenden Satz im Format „Based on X of Y activities“ anzeigen.
- **FR-002**: Das Ausblenden des Teilabdeckungshinweises MUSS die angezeigte Länderzahl und die Ländernamen unverändert lassen.
- **FR-003**: Bei vollständiger Abdeckung MÜSSEN die bisherige Darstellung und bestehende Hinweise unverändert bleiben.
- **FR-004**: Bestehende Lade- und Nichtverfügbarkeitszustände MÜSSEN unverändert bleiben.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Bei partieller Abdeckung erscheint der Teilabdeckungshinweis in 0 von 2 geprüften Darstellungen: Dashboard-Karte und Export.
- **SC-002**: In beiden Darstellungen bleiben Länderzahl und sämtliche Ländernamen mit den Werten der zugrunde liegenden Länderübersicht identisch.
- **SC-003**: Bei vollständiger, ladender und nicht verfügbarer Länderübersicht bleibt das bisherige Verhalten in 100 % der geprüften Zustände erhalten.

## Assumptions

- Mit „Based on 599 of 744 activities“ ist ausschließlich der erklärende Hinweis bei partieller Abdeckung gemeint.
- Die Anforderung gilt für die Länderkarte in der normalen Lifetime-Statistics-Ansicht und in deren Exportdarstellung.
- Der Hinweis bei vollständiger Abdeckung sowie Länderzahl, Ländernamen, Ladezustand und Nichtverfügbarkeitszustand bleiben außerhalb des beschriebenen Teilabdeckungshinweises unverändert.