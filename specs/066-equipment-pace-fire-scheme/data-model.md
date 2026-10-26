# Data Model: Equipment-Pace-Farben

Diese Änderung führt keine persistierten Daten, neuen Importfelder oder neue Entitäten ein. Sie verwendet vorhandene, für die Darstellung aufbereitete Equipment-Pace-Zeilen.

## Equipment-Pace-Zeile (bestehendes Anzeigeobjekt)

- `name`: Equipment-Bezeichnung für die Zeilenbeschriftung.
- `type`: `Shoes` oder `Bikes`, abgeleitet aus der bestehenden Equipment-Klassifikation.
- `paceMinPerKm`: aggregierte Zeit pro Kilometer; relevant für die Anzeige bei Schuhen.
- `speedKmh`: aus dem Pace-Wert abgeleitete Geschwindigkeit; relevant für die Anzeige bei Rädern und die typbezogene Sortierung.
- `maxSpeedOfType`: höchste Geschwindigkeit innerhalb des jeweiligen Typs in der aktuellen Auswahl.
- `barValue`: relative Geschwindigkeit `speedKmh / maxSpeedOfType`, im gültigen Bereich größer 0 bis einschließlich 1.

## Darstellungsregel

- Bei Kennzahl `Pace` mit Filter `Shoes` oder `Bikes` wird `barValue` als Position im vorhandenen Fire-Verlauf verwendet: kleiner steht für langsamer/gelber, größer für schneller/röter.
- Bei Filter `All` bleibt die bisherige Farbe anhand von `type` erhalten: Lila für Schuhe und Türkis für Räder.
- Bei jeder anderen Kennzahl bleiben bisherige Farben und Werte erhalten.
- Es wird kein zusätzlicher Zustand gespeichert. Fehlende oder ungültige Pace-Zeilen werden weiterhin durch die vorhandene Aufbereitung beziehungsweise den bestehenden Leerzustand behandelt.