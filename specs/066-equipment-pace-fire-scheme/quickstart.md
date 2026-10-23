# Quickstart: Equipment-Pace-Farben validieren

## Voraussetzungen

- Repository-Abhängigkeiten installiert (`npm install` falls Jest lokal noch nicht verfügbar ist).
- Für den manuellen UI-Check: statische App lokal bereitstellen und Equipment-Daten mit mindestens zwei unterschiedlichen Schuh- und Rad-Pace-Werten importieren.

## Fokussierter Test

```powershell
npm test -- --runInBand __tests__/dashboard-equipment.test.js
```

Erwartetes Ergebnis: Der Equipment-Chart-Test besteht; einzeln gewählte Shoes/Bikes verwenden Fire-Farben entsprechend ihrer relativen Geschwindigkeit, `All` behält die Typfarben, und andere Kennzahlen bleiben unverändert.

## Manuelle Browserprüfung

1. App mit `python -m http.server` starten und einen Datensatz mit mehreren Schuh- und Radwerten laden.
2. Equipment öffnen, Kennzahl `Pace` und Filter `Shoes` wählen: langsamere Pace gelblich, schnellere rot.
3. Filter `Bikes` wählen: niedrigere Geschwindigkeit gelblich, höhere rot.
4. Filter `All` wählen: Schuhe bleiben lila, Räder türkis; Pace-/Geschwindigkeitswerte und Einheiten bleiben sichtbar.
5. Kennzahl `Distance`, `Count` oder `Avg Length` wählen und bestätigen, dass bisherige Farben und Darstellung erhalten sind.
6. Mit einem Datensatz ohne gültige Pace-Werte prüfen, dass der vorhandene Leerzustand unverändert bleibt.