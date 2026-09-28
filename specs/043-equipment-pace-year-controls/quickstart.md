# Quickstart: Feature 043 validieren

Diese Anleitung beschreibt die Prüfung **nach** der Implementierung; Planung und Spezifikation allein ändern das Laufzeitverhalten nicht. Verbindliche Details stehen in [data-model.md](data-model.md) und [UI-Vertrag](contracts/equipment-pace-years-ui.md).

## Voraussetzungen

- Im Repository-Root: Node.js und installierte Root-Abhängigkeiten für Jest (`npm install`, falls nötig), Python für den statischen HTTP-Server; moderner Browser mit Zugriff auf die bisherigen CDN-Abhängigkeiten.
- Keine echten Strava-Exporte ins Repository kopieren. Synthetische bzw. ausdrücklich lokal bereitgestellte Aktivitäten verwenden: zwei Räder mit ungleichen Geschwindigkeiten, zwei Schuhe mit ungleichen Pace-Zeiten, Daten in 2020–2025 und wenigstens ein Filter ohne Punkte.

## Automatische Tests

1. Im Repository-Root die fokussierte Root-Suite ausführen: `npm test -- --runInBand __tests__/equipment-utils.test.js __tests__/dashboard-equipment.test.js __tests__/dashboard-scatter-years.test.js __tests__/heartrate-pace-visualization.test.js __tests__/index-script-syntax.test.js` (die neuen Dashboard-Testdateien werden erst bei der Implementierung angelegt).
2. Zum Abschluss `npm test -- --runInBand` ausführen. Erwartung: Alle Root-Tests bestehen, Skripte lassen sich gemeinsam parsen, keine Änderung an Tab-IDs oder API-Code. Kein API-Test nötig, solange `services/api` unangetastet bleibt.

## Sichtprüfung der Ausrüstungsgrafik

1. Vom Repository-Root `python -m http.server 8000` starten; `http://localhost:8000` öffnen und lokale synthetische Daten importieren.
2. „Equipment mileage“ öffnen und nacheinander `Pace` mit `Bikes`, `Shoes` und `All` prüfen: schnelleres Rad und schnellerer Schuh haben innerhalb ihrer Art längere Balken; Gleichstände bleiben gleich lang. Radwerte/Tooltip sind km/h, Schuhwerte/Tooltip Pace pro km. Prozentachse und artbezogene Erklärung auch in `All` lesbar.
3. Ansichtsbreiten 320, 375, 768 und 1440 px prüfen, danach `distance`, `count` und `avgLength` sowie Filter wechseln. Alle Balkenwerte müssen vollständig lesbar (bei Platzmangel maximal zweizeilig oder vollständig in der zugänglichen Wrapper-Alternative) und ohne Überstand sein; die Balken dürfen sich nicht gegenseitig mit Text überdecken.
4. In 320 px Equipment-Export auslösen: Der exportierte Bildausschnitt enthält alle sichtbaren Werte/Alternativtexte ohne rechten Beschnitt und die richtige Tempo-Referenz. Leeren Filter auf verständlichen Leerzustand prüfen.

## Sichtprüfung der Jahresauswahl

1. „Pace vs ...“ mit Punkten aus 2020–2025 öffnen; 2020 normal abwählen, 2025 mit Shift+Klick abwählen: alle sechs Jahre aus, deren Punkte und Trendlinien verborgen. Andere Jahre unverändert. Zurück in umgekehrter Klickrichtung aktivieren; gleiches Ergebnis.
2. Shift+Klick ohne zuvor gewählten Anfang, einzelne Checkboxen und die unabhängige Trendliniencheckbox prüfen. Lücken in Jahren wirken nur auf sichtbare Checkboxen.
3. Ein Jahr abwählen; Sportart/Metrik/Datumsbereich so ändern, dass das Jahr vorübergehend nicht vorkommt (ggf. leerer Zustand), danach zurückwechseln: Es bleibt abgewählt. Neu hinzukommende Jahre sind zunächst an. Mit einem zweiten Import müssen frühere Deaktivierungen und Bereichsanfang weg sein.

**Erfolg**: Alle Szenarien aus [spec.md](spec.md) und der [Qualitätscheckliste](checklists/requirements.md) sind testbar; dieser Guide ersetzt nicht die manuelle Prüfung echter Canvas-/Bildexport-Geometrie.