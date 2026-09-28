# Data Model: Ausrüstungstempo und Jahresauswahl

Alle Modelle sind flüchtige Darstellungs-/UI-Zustände, keine neue Persistenz. Quelle der Trainingswerte sind die bereits normalisierten `processedActivities` im Browser.

## Ausrüstungseintrag

| Feld | Typ | Bedeutung / Regel |
|------|-----|-------------------|
| `name` | String | Nicht leerer zugeordneter Ausrüstungsname; bestehende Gruppierungsidentität von `aggregateEquipmentPace()`. |
| `type` | `Shoes` \| `Bikes` | Bestehende Zuordnung über `getEquipmentType(name)`; keine neue Sportklassifikation. |
| `paceMinPerKm` | positive endliche Zahl | Aus der bestehenden Aggregation: Gesamtzeit in Minuten / Gesamtdistanz in km; *ungekürzt und ungerundet* für weitere Berechnung. |
| `speedKmh` | positive endliche Zahl | `60 / paceMinPerKm`; bei Rädern angezeigter Wert, bei Schuhen ausschließlich Grundlage der Balkenlänge. |

**Beziehung**: Mehrere qualifizierte Aktivitäten mit identischem Ausrüstungsnamen bilden einen Eintrag. Blankes Equipment, Distanz ≤ 0 oder Dauer ≤ 0 werden wie bisher ignoriert. Öffentliche Rückgabeform und Signatur von `aggregateEquipmentPace()` bleiben `[name, paceMinPerKm][]`.

## Tempoanzeige (je sichtbarem Eintrag)

| Feld | Typ | Bedeutung / Regel |
|------|-----|-------------------|
| `equipment` | Ausrüstungseintrag | Verweis auf Typ, Name und unverfälschtes Durchschnittstempo. |
| `maxSpeedOfType` | positive endliche Zahl | Höchste `speedKmh` innerhalb aller aktuell sichtbaren Einträge *derselben Art* (Shoes/Bikes). |
| `barValue` | Zahl von 0 bis 1 | `speedKmh / maxSpeedOfType`, für schnelle Teile ≥ langsamere derselben Art; gleiche Tempi → gleich. |
| `displayValue` | String | Schuhe: `mm:ss /km`; Räder: `x.y km/h`, aus Original-Pace formatierte Angabe, nicht `barValue`. |
| `displayLines` | 1–2 Strings | Sichtbare Balkenwert-Zeilen, nur wenn vollständig innerhalb der Chart-Grenzen darstellbar. |
| `fallbackValue` | String | Vollständiger `displayValue` im lesbaren, umbruchfähigen Bereich des Chart-Wrappers, falls Canvas-Platz fehlt. |

**Beziehung / Scope**: Bikes, Shoes und All benutzen dieselbe artbezogene Prozent-Achse; im gemischten Modus Gruppierung nach Art und eine sichtbare Erklärung „100 % = schnellstes Teil derselben Art“. Keine numerische Rangfolge zwischen Arten behaupten. Andere Kennzahlen (Distanz, Anzahl, Durchschnittslänge) bleiben unverändert. Bei leerer Menge gelten Leerzustand und keine alten Fallback-Werte. Wenn der Text nicht innerhalb zwei Canvas-Zeilen passt, ist `fallbackValue` notwendig; bei Export wird der vollständige Wrapper aufgenommen.

## Jahresauswahl (pro importiertem Datensatz und „Pace vs ...“)

| Feld | Typ | Bedeutung / Regel |
|------|-----|-------------------|
| `disabledYears` | Set&lt;Ganzzahl&gt; | Explizit ausgeschlossene Kalenderjahre; standardmäßig leer. Auch aktuell unsichtbare Jahre bleiben gespeichert. |
| `visibleYears` | sortierte Ganzzahl-Liste | Aus aktuell qualifizierten Punkten nach Sportart, Metrik und Datumsbereich; nur diese Jahre werden als Checkboxen angezeigt. |
| `anchorYear` | Ganzzahl oder `null` | Letztes ohne Shift angeklicktes Jahr, Ausgangspunkt für die nächste sichtbare Bereichsauswahl. |
| `trendLinesVisible` | Boolean | Bereits vorhandener, unabhängiger Schalter, bei neuem Import `true`. |

**Abgeleiteter Zustand**: Ein sichtbares Jahr ist aktiviert genau dann, wenn es **nicht** in `disabledYears` steht. Zu jedem deaktivierten Jahr sind sämtliche zugehörigen Punkte und Linien verborgen; die Trendlinien-Einstellung gilt zusätzlich für die Linien der aktiven Jahre. Ein zuvor unbekanntes Jahr ist automatisch aktiviert. `disabledYears` ist ausdrücklich **nicht** die Differenz der aktuellen sichtbaren Jahre und darf bei leerer Punktmenge nicht neu berechnet werden.

### Zustandsübergänge

| Ereignis | Änderung | Sichtbarer Effekt |
|----------|----------|------------------|
| Einfachklick auf Jahr Y | Y entsprechend neuem Checkboxzustand in `disabledYears` eintragen/entfernen; `anchorYear = Y`. | Nur Y und seine Linie(n) ändern Sichtbarkeit. |
| Shift-Klick auf Y mit sichtbarem Anker A | Alle Jahre in `visibleYears` mit `min(A,Y) ≤ Jahr ≤ max(A,Y)` auf **neuen Zustand von Y** setzen; andere Jahre nicht verändern. | Checkboxen, Punkte und Linien des Bereichs konsistent aktualisieren; Trendlinien-Schalter unverändert. |
| Shift-Klick ohne sichtbaren Anker | Nur Y umschalten; Y kann fortan als Anker dienen. | Kein unsichtbarer Bereich wird mitgeschaltet. |
| Sport-/Metrik-/Datumsfilter wechseln | `visibleYears` aus aktuellen Punkten neu bestimmen; `disabledYears` **unverändert** lassen; ungültigen Anker verwerfen. | Neue Jahre an, deaktivierte Rückkehrer weiterhin aus; kein sichtbares Jahr bei leerer Menge. |
| Trendlinien umschalten | Nur `trendLinesVisible` ändern. | Jahres-Checkboxen und Punkte unverändert. |
| Neuimport | `disabledYears` leeren, `anchorYear = null`, Trendlinien gemäß bestehendem Reset wieder aktivieren. | Keine Ausschlüsse aus dem alten Datensatz übernehmen. |

**Integrationsgrenze**: Dieser Zustand betrifft nur „Pace vs ...“ und wird nicht mit Kalender, Ausrüstung oder sonstigen Dashboard-Tabs geteilt. Browser-Neuladen beendet den Zustand. Es gibt keine Serverentität und keine Migration.