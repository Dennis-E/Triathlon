# Data Model: Umrandung trainingsfreier Kalendertage

## Überblick

Es werden keine neuen Entitäten, persistierten Werte oder Beziehungen eingeführt. Die Darstellung nutzt den bereits vorhandenen Kalendertag und seinen Aktivitätszustand.

## Kalender-Tagesfeld (bestehende Darstellung)

| Feld | Bedeutung für dieses Feature | Validierung / Darstellung |
|---|---|---|
| Datum | Identifiziert den angezeigten Kalendertag. | Ein Kalenderfeld entspricht genau einem Datum; Rasterlücken ohne Datum sind keine Tagesfelder. |
| Aktivitätsanzahl | Bestimmt, ob der Tag unter dem aktuell gewählten Filter Training enthält. | `0` bedeutet trainingsfrei; ein positiver Wert bedeutet aktiv. |
| Intensitätsstufe | Vorhandene Einordnung der Trainingsmenge. | Stufe `0` kennzeichnet einen trainingsfreien Tag; Stufen `1` bis `5` kennzeichnen aktive Tage. |
| Gewählter Sportfilter | Beeinflusst, welche Aktivitäten den Tageszustand bestimmen. | Der Zustand ist anhand der gefilterten Kalenderdaten zu beurteilen. |
| Gewählte Farbpalette | Bestimmt die Füllfarbe aktiver Tagesfelder. | Hat keinen Einfluss auf die fehlende helle Umrandung trainingsfreier Felder. |

## Zustandsübergänge

- Beim Rendern und nach einer Änderung von Filter oder Palette wird jedes datumsbezogene Feld anhand des aktuellen Tageszustands dargestellt.
- Ein Feld kann nach einem Filterwechsel zwischen aktiv und trainingsfrei wechseln; die Umrandung folgt dem neu berechneten Zustand.
- Die Füllfarbe, Aktivitätsinformationen, Tastaturbedienung und sonstigen Kalenderdaten werden durch dieses Feature nicht verändert.
