# UI Contract: Equipment-Pace-Chart

## Eingabezustand

- Kennzahl `Pace`; Equipment-Filter `Shoes`, `Bikes` oder `All`.
- Die bestehende Pace-Anzeige liefert pro Equipment-Zeile den typbezogenen Wert `barValue` von 0 bis 1.

## Sichtbares Verhalten

- Bei `Pace` + `Shoes`: Jeder Balken verwendet die vorhandene Fire-Skala; langsamer ist gelblicher, schneller rötlicher.
- Bei `Pace` + `Bikes`: Jeder Balken verwendet dieselbe Fire-Skala; niedrigere Geschwindigkeit ist gelblicher, höhere Geschwindigkeit rötlicher.
- Bei `Pace` + `All`: Schuhe behalten Lila, Räder Türkis; Fire wird nicht angewendet.
- Bei Nicht-Pace-Kennzahlen bleiben die bisherigen Farben unverändert.
- Die Pace-/Geschwindigkeitsbeschriftungen, Einheiten, Tooltips, Balkenwerte und Leerzustände ändern sich nicht.

## Abnahmebeispiele

- `barValue` 0 ergibt das bestehende gelbe Fire-Ende; 1 ergibt das rote Fire-Ende.
- Innerhalb eines einzeln gefilterten Typs erhält eine höhere relative Geschwindigkeit eine rötlichere Farbe.
- Für `All` bleibt das Shoes-/Bikes-Farbpaar Lila/Türkis erhalten, unabhängig von Pace-Werten.