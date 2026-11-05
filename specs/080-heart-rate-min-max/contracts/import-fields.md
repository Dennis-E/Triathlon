# Import Contract: Direkte Trainings-Extremwerte

## Gemeinsame Ausgabe

Optionale Felder `minHeartRate` und `maxHeartRate`: endliche positive Zahlen in bpm oder `null`. Abwesenheit ist erlaubt. Die vorhandenen Felder und Identitaetsregeln bleiben unveraendert. Nur explizite Zusammenfassungen des jeweiligen Trainings qualifizieren; keine Rekonstruktion aus Durchschnitt, Samples, Laps, Tagesstatistiken oder anderen Trainings.

Feldweise ungueltige Angaben werden unabhaengig verworfen. Ein spaeter erkannter Paarwiderspruch (`min > max`) verhindert die Darstellung beider Werte, korrigiert aber nicht den importierten Datensatz. Es gibt keine medizinische Plausibilitaetsbewertung.

## Strava CSV

Die folgende Allowlist definiert die neu unterstuetzten expliziten Eingabeheader; sie ist keine Behauptung, dass jede echte Strava-Version diese Spalten liefert. Gross-/Kleinschreibung und aeussere Leerzeichen duerfen normalisiert werden. Keine Teilstring-Zuordnung.

| Ziel | Explizit akzeptierte Header | Einheit |
|------|----------------------------|---------|
| `minHeartRate` | `Min Heart Rate`, `Minimum Heart Rate`, `Minimale Herzfrequenz` | bpm gemaess diesem CSV-Feldvertrag. |
| `maxHeartRate` | `Max Heart Rate`, `Maximum Heart Rate`, `Maximale Herzfrequenz` | bpm gemaess diesem CSV-Feldvertrag. |

Die Headerkennung steht fuer eine explizite Herzfrequenzzusammenfassung, nicht fuer eine beliebige Zahl. Explizit widersprechende Einheitshinweise, etwa Hz, duerfen nicht ignoriert werden. Weitere Header-/Einheitenvarianten benoetigen belegte Semantik und einen eigenen synthetischen Vertragstest, bevor sie in die Allowlist aufgenommen werden.

- Vorhandene lokalisierte Zahlenverarbeitung verwenden, danach strikt auf endliche positive Werte pruefen. Kein `parseFloat`-Akzeptieren beliebiger Suffixe und keine Umdeutung leerer Angaben zu Null.
- Mehrere erkannte Spalten fuer dasselbe Extremfeld nur bei identischen gueltigen Angaben akzeptieren; Widersprueche machen das betroffene Feld unverfuegbar. Die andere Extremart bleibt unabhaengig nutzbar.
- `src/dashboard-import.js` und `src/dashboard-utils.js` muessen bei identischer CSV dieselben Extremfelder liefern. Die Browserpruefung muss die echte `processData`-Funktion verwenden, keinen Importharness-Stub.
- `importStravaZip` erhaelt weiterhin die Original-CSV. Exportierte Reduktion ueber `extractRelevantColumns` und der CLI-Reducer `reduceActivitiesRows` erhalten erkannte optionale Extremspalten am Ende ihrer bisherigen Ausgabe. Ohne diese Spalten bleibt das bisherige Ausgabeschema unveraendert.
- ID und bestehende Header-/Distanzreihenfolge nicht verschieben; erste `Distance`/`Distanz` bleibt km, zweite m. Keine neue CSV-Deduplizierung.

## TrainingPeaks FIT

| Eingabe | Ziel | Semantik |
|---------|------|----------|
| `fitData.sessions[i].min_heart_rate` | `minHeartRate` | FIT-Nachricht 18, Feld 64, bpm. |
| `fitData.sessions[i].max_heart_rate` | `maxHeartRate` | FIT-Nachricht 18, Feld 17, bpm. |

Die bestehende Parserfassung `fit-file-parser@1.10.0` definiert diese Sessionfelder. `undefined`, `null`, nicht endliche/nicht positive Werte sowie der FIT-Invalid-Sentinel 255 qualifizieren nicht. Dieser Sentinel ist eine Formatregel, keine medizinische Obergrenze.

Normalisierung und Dekompression behalten ihre bisherigen Wege und Optionen. Kein Parserupgrade und keine Record-/Lap-Auswertung fuer Extremwerte. Sessions ohne die Felder bleiben valide Trainings. Vorhandene Session-Identitaet, Duplikatentscheidung und First-wins-Verhalten bleiben unveraendert; komplementaere Duplikate werden nicht zusammengefuehrt.

Nachweis waehrend der Implementierung: synthetisches Sessionobjekt fuer die Normalisierung sowie ein minimales synthetisches FIT mit diesen Feldnummern und einem Invalidwert durch den tatsaechlich verwendeten Parser decodieren. Kein Download zur Testlaufzeit; bei benoetigtem Testparser ausschliesslich dieselbe Version als Root-Dev-Abhaengigkeit, nicht als neue Browserbibliothek oder Service-Abhaengigkeit verwenden.

## Apple Health XML

| Eingabe innerhalb des konkreten `Workout` | Ziel | Einheit |
|-----------------------------------------|------|---------|
| `WorkoutStatistics[type=HKQuantityTypeIdentifierHeartRate].minimum` | `minHeartRate` | `count/min`, numerisch bpm. |
| `WorkoutStatistics[type=HKQuantityTypeIdentifierHeartRate].maximum` | `maxHeartRate` | `count/min`, numerisch bpm. |

- Die bestehende SAX-Erfassung behaelt Statistikattribute; keine Parser- oder Worker-Transportaenderung voraussetzen.
- Die Statistik muss direkt zum normalisierten Workout gehoeren. Falls `startDate`/`endDate` in der Statistik angegeben sind, muessen beide gueltig sein und exakt den Workoutzeitraum bezeichnen. Unvollstaendige, abweichende oder widerspruechliche Zeitzuordnung ist keine Grundlage fuer Extremwerte.
- Ohne Statistik-Zeitattribute ist die eindeutige Workout-Verschachtelung ausreichend. Mehrere Angaben derselben Extremart sind nur bei uebereinstimmenden gueltigen Werten nutzbar. Keine Aggregation ueber Teilstatistiken; mehrdeutige Kandidaten machen die betroffene Extremart unverfuegbar.
- Nur bekannte Einheit `count/min`; andere Einheiten bleiben fuer diese Erweiterung unverfuegbar. Bestehende Mengen-/Durchschnittsregeln nicht veraendern.
- Der bisherige Record-Durchlauf kann weiterhin nach seinem bestehenden Vertrag Durchschnittspuls ergaenzen, aber niemals die neuen Min-/Max-Felder.
- Rohstatistiken und Fingerprint unveraendert lassen. Aus denselben Dateien muessen vor und nach der Erweiterung dieselben IDs, Aktivitaetszahlen, bestehenden Mittelwerte und Duplikatentscheidungen entstehen.

## Gemeinsame Abwesenheits- und Regressionsregeln

Nur Durchschnittspuls bedeutet fuer diese Ansicht: keine passenden Werte. Ein Maximum allein beziehungsweise Minimum allein genuegt. Unlesbare optionale Extremwerte verwerfen kein ansonsten gueltiges Training und verhindern keinen Import. Quellen ohne Extremfelder erzeugen keinen leeren Tab.

Referenzvergleiche entfernen vor dem Vergleich ausschliesslich die beiden neuen optionalen Felder. Alle sonstigen Ausgaben, einschliesslich IDs, Datum, Sport, Distanz, Dauer, Mittelwerten, Routen-/Powerzuordnung und Zaehlern, muessen bei identischer Eingabe gleich bleiben. Testdaten sind synthetisch; echte Exportdateien bleiben lokal und ausserhalb der Versionsverwaltung.