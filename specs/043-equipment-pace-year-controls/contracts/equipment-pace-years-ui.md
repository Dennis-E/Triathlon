# UI Contract: Ausrüstungstempo und Jahre in „Pace vs ...“

## Ausrüstungsgrafik

- Der bestehende Panel- und Export-Schlüssel `equipment` sowie die Filter `All`/`Shoes`/`Bikes` und Kennzahlen `distance`/`pace`/`count`/`avgLength` bleiben erhalten; kein neuer Tab.
- Die Korrektur betrifft **Werte an den Enden der Balken**, nicht die Schuh-/Radnamen links oder die Farb-Legende der Equipment Timeline.
- Jeder sichtbare Balkenwert bleibt vollständig innerhalb des sichtbaren Chart-Wrappers. Einzeilig, wenn Platz vorhanden; andernfalls bis zu zwei Zeilen. Ist das unmöglich, steht der vollständige Wert als lesbarer, auch ohne Maus benutzbarer Text **innerhalb desselben Wrappers**. Die Darstellung ragt bei 320–1440 px nicht rechts hinaus und verdeckt keine Nachbarbalken.
- Bei `pace`: längere Balken bedeuten höhere relative Geschwindigkeit innerhalb derselben Art; gleich schnelle Teile haben gleich lange Balken. Die x-Achse ist als relativer Geschwindigkeitsvergleich (0–100 %; Referenz: schnellstes Teil derselben Art) beschriftet. Für `All` sind die Arten erkennbar getrennt und die artbezogene Referenz erklärt; Schuh- und Rad-Balken werden nicht als ein einziges absolutes Ranking dargestellt.
- Schuh-Balkenende und Tooltip zeigen die tatsächliche Pace als `mm:ss /km`; Rad-Balkenende und Tooltip zeigen tatsächliche Geschwindigkeit als `x.y km/h`. Achsenticks dürfen weder Radwerte als Pace noch Prozentwerte als gemessene Geschwindigkeit ausgeben. Der barbezogene Wert ist nur eine Präsentationsgröße, kein Messwert.
- Leere Filter zeigen den vorhandenen Leerzustand; andere Kennzahlen behalten Daten, Einheiten, Sortierung und Filterwirkung. Die bestehende Exportfunktion erfasst den vollständig sichtbaren Wrapper-Inhalt mitsamt eventueller Ersatzbeschriftung und Referenzerklärung.

## Jahressteuerung in „Pace vs ...“

- Weiterhin eine Checkbox je **aktuell vorhandenem** qualifiziertem Jahr, chronologisch sortiert; keine Checkbox für Jahre ohne Punkte im aktuellen Filter. Eine separate Checkbox steuert Trendlinien.
- Normaler Mausklick oder Tastaturaktivierung einer Jahrescheckbox ändert nur dieses Jahr und merkt es als Bereichsanfang. Shift+Mausklick auf eine Checkbox mit sichtbarem Bereichsanfang setzt sämtliche aktuell auswählbaren Jahre zwischen Anfang und Ziel *inklusive* auf den neuen Zustand des Ziels. Richtung egal; fehlende Kalenderjahre ohne Checkbox werden nicht angelegt. Ohne gültigen Anfang genau ein Jahr umschalten.
- Ein Shift-Bereich darf die Trendliniencheckbox nicht betätigen; bei deaktivierten Jahren verschwinden Punkte und zugehörige Linien, bei deaktivierten Trendlinien bleiben Punkte sichtbar. Jahr-Checkboxen zeigen nach Bereichsklick den tatsächlichen Zustand an.
- Sportart, Metrik und Datumsbereich können wechseln, ohne frühere Deaktivierungen zu löschen, auch über einen vorübergehenden Leerzustand hinweg. Für ein zurückkehrendes Jahr gilt seine frühere Auswahl; ein bisher unbekanntes Jahr ist aktiviert. Der Bereichsanfang wird verworfen, wenn er beim Wechsel nicht sichtbar ist. Nur beim Neuimport werden Ausschlüsse und Bereichsanfang zurückgesetzt; andere Tabs übernehmen diesen Zustand nicht.
- Die Sichtbarkeit ist rein clientseitig und ändert weder importierte Aktivitätsdaten noch deren Export- oder Netzwerkgrenzen.

## Zuordnung der Anforderungen

| Spec | UI-Nachweis |
|------|------------|
| FR-001–FR-002, SC-001 | Responsive Werte in Canvas/zugänglicher Wrapper-Alternative; Export ohne Überstand. |
| FR-003–FR-005, SC-002–SC-003 | Artbezogene Prozent-Balken, korrekte Original-Tempoangaben in allen drei Equipment-Filtern. |
| FR-006–FR-008, SC-004 | Einzel- und Shift-Bereichsklick, Checkbox- und Chart-Sichtbarkeit. |
| FR-009–FR-011, SC-005 | Filter- und Datumswechsel, Leerzustand, Neuimport, keine Nebenwirkungen. |