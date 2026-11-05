# Data Model: Herzfrequenz-Min-/Max-Entwicklung

**Status**: Entwurf fuer eine spaetere Implementierung; bestehende Datensaetze werden hier nicht geaendert.

## 1. Bestehendes Training mit optionalen Ergaenzungen

| Feld | Typ / Einheit | Regel |
|------|---------------|-------|
| `id` | Bestehender Typ | Unveraendert; fuer diese Ansicht nicht als allein garantiert eindeutig behandeln. |
| `date` | Bestehendes gueltiges Trainingsdatum | Quell-/Browser-Kalendertag nach bisherigem Importvertrag, kein neues UTC-Tagesmapping. |
| `startTime` | Bestehender optionaler Zeitpunkt | Nur Reihenfolge und Details; kein Ersatz fuer den Trainingstag. |
| `sourceLocalStart` | Bestehender optionaler Quellstart | Fuer Apple-Details verwenden, falls vorhanden; nicht neu berechnen. |
| `sport` | `Run`, `Bike`, `Swim` | Keine Umklassifizierung unbekannter Sportarten. |
| `name` | Bestehender optionaler Text | Nur Anzeige; kein neues Quellfeld oder Wordcloud-Eintrag. |
| `avgHeartRate` | Bestehender Wert | Unveraendert und niemals Ersatz fuer eines der neuen Felder. |
| `minHeartRate` | Optional `number` in bpm oder `null` | Nur direkte verlaessliche Trainingszusammenfassung gemaess Importvertrag. |
| `maxHeartRate` | Optional `number` in bpm oder `null` | Unabhaengig vom Minimum; gleiche Herkunftsanforderung. |

Fehlende neue Eigenschaften in alten oder spaerlichen Datensaetzen sind gleichbedeutend mit `null`. Einfuehrung neuer Felder veraendert keine alten Pflicht-/Optionalregeln. Es gibt keine Schema-Migration und keine nachtraegliche Mutation der bereits geladenen Historie durch die Ansicht.

## 2. Extremwertvalidierung

1. Das Training besitzt ein gueltiges, nicht leeres `date` und eine unterstuetzte Sportart. Null/Leerstring darf nicht als Epoch-Datum gelten.
2. Jedes Extremfeld wird strikt als endliche positive Zahl bewertet. Die Importnormalisierung hat die bpm-Semantik bereits nachgewiesen; die Utility interpretiert keine Rohstrings oder Einheiten.
3. Ein einzeln fehlender/ungueltiger Wert wird zu einem nicht darstellbaren Feld, ohne einen gueltigen Gegenwert zu entwerten.
4. Sind beide Zahlen gueltig und `minHeartRate > maxHeartRate`, ist das Paar widerspruechlich: keine Punkte aus diesem Training. Die importierten Felder bleiben unveraendert erhalten.
5. Gleichheit ist gueltig und erzeugt einen Punkt pro Reihe; beide muessen einzeln inspizierbar bleiben.
6. Kein Vergleich mit `avgHeartRate`, keine Schaetzung und kein medizinisch begruendeter Grenzwert. Quellformatspezifische Invalid-Sentinels werden bereits beim Import ausgeschlossen.

## 3. Datasetlokale Identitaetsregistry

Der Renderer erstellt beim erfolgreichen Import-Commit eine externe Registry fuer die gesamte importierte Liste, bevor Filter angewendet werden. Eine bestehende Quell-ID zusammen mit dem Ursprungsordinal liefert den Anzeige-/Auswahlschluessel. Fehlende oder doppelte Quell-IDs sind dadurch kein Grund, Trainings zusammenzufassen.

- Schluessel bleiben innerhalb derselben geladenen Historie bei Sport-/Zeitwechseln stabil.
- Ein deterministischer, sichtbarer Ersatzname wie `Training 7` nutzt das Ursprungsordinal, wenn Name/Startzeit allein nicht eindeutig sind.
- Ein Snapshot enthaelt kopierte Anzeigeangaben, keine Referenz auf das urspruengliche Trainingsobjekt.
- Die Registry wird bei Ersatzimport erneuert; sie veraendert weder Quell-ID noch Fingerprint oder Deduplizierung.

## 4. TimelineModel und Verlaufspunkt

`buildHeartRateTimeline(filteredActivities, { getActivityKey })` liefert ein neues Modell:

| Feld | Inhalt |
|------|--------|
| `minimumPoints` | Chronologisch geordnete Punkte fuer gueltige Minima. |
| `maximumPoints` | Chronologisch geordnete Punkte fuer gueltige Maxima. |
| `activityCount` | Anzahl verschiedener qualifizierter Ursprungstrainings, nicht die Summe der Punkte. |

Ein Punkt enthaelt ausschliesslich kopierte Werte:

| Feld | Inhalt |
|------|--------|
| `x` / `dateEpoch` | Numerischer Wert des bestehenden Trainingstags fuer die Achse; kein Jitter. |
| `y` | Herzfrequenz in bpm. |
| `kind` | `minimum` oder `maximum`. |
| `activityKey` | Datasetlokaler eindeutiger Schluessel. |
| `sourceOrdinal` | Stabiler Ursprung fuer Tie-Breaking und Ersatzanzeige. |
| `startTimeEpoch` | Gueltige vorhandene Startzeit, sonst `null`. |
| `dateLabel`, `startTimeLabel` | Darstellungsangaben unter Erhalt bisheriger Kalender-/Quellsemantik. |
| `sport`, `name`, `displayName` | Bestehender Sport, optionaler Originalname und eindeutige Anzeigezuordnung. |

Sortierung: `dateEpoch`, dann gueltige Startzeit (fehlende Startzeit nach vorhandenen Zeiten desselben Tages), dann `sourceOrdinal`. Vergleich und Sortierung erfolgen nur auf abgeleiteten Kopien. Zwei Punkte mit gleicher Position bleiben zwei Dateneintraege; die Min-/Max-Arrays duerfen unterschiedliche Laengen besitzen und werden nie per Arrayindex miteinander gepaart.

## 5. Ansichts- und Filterzustand

Die Ansicht besitzt keinen eigenen Sport-/Zeitfilter. Sie liest `selectedSportFilter`, `selectedAggregationLevel` und `selectedTimeframeByAggregation` sowie die vorhandene Datumsbereichsermittlung. Der Aggregationsmodus bestimmt lediglich die angebotenen Zeitfenster, nicht die Punktaggregation.

| Zustand | Anzeige | Export |
|---------|---------|--------|
| `unavailable` | Kein erreichbarer Tab, kein aktives Panel/Chart. | Kein Ziel, keine Daten. |
| `available-empty` | Tab bleibt erreichbar; eindeutiger Filter-Leerzustand. | Aktion gesperrt/ausgeblendet, keine alten Daten. |
| `available-data` | Punktreihen, Legende und Trainingsdetails. | Aktueller kopierter Snapshot verfuegbar. |

Erfolgreicher Ersatzimport: alte Chart-/Detail-/Exportressourcen leeren, Registry erneuern, Importverfuegbarkeit berechnen und gueltigen Tab waehlen. Filterwechsel: Modellrevision erhoehen, Auswahl invalidieren, nur Darstellung neu bestimmen; die Importverfuegbarkeit bleibt erhalten. Fehlgeschlagener Import: kein Commit, keine Veraenderung des bisherigen Zustands.

## 6. Auswahlmodell

Ein Treffereintrag besteht aus `activityKey` plus `kind`. Treffer am gleichen Ort werden deterministisch nach Trainingsreihenfolge und Extremart geordnet. Der lokale Detailbereich stellt die gesamte Treffergruppe als native fokussierbare Auswahlliste dar. Zeiger, Touch und Tastatur koennen jeden Eintrag erreichen. Labels und Punktformen unterscheiden die Reihen unabhaengig von Farbe.

Vorhandene Pin-/Escape-Regeln bleiben erhalten. Filter-/Importwechsel invalidieren bisherige Auswahlen; Pins werden nicht in PNG-Snapshots aufgenommen. Angezeigte Trainingsnamen werden als Text behandelt, nicht als HTML interpretiert.

## 7. ExportSnapshot

Der HeartRate-Exportstand enthaelt Tabkennung, Datasetrevision, lokale Modell-/Filterrevision, kopierte Punktreihen und Legenden, Titel, bpm-Einheit, aktiven Sport und tatsaechliche Zeitgrenzen sowie rein datenbasierte Chart-Eingaben. Keine Aktivitaetsobjekte, live lesenden Zustandsfunktionen oder Auswahl-Pins werden gespeichert.

Ein laufender Aufnahmevorgang darf nur bei noch passender Dataset- und Modellrevision eine neue Vorschau veroeffentlichen. Nach Veroeffentlichung repraesentiert die Vorschau den angeforderten eingefrorenen Stand; ein Formatwechsel zeichnet diesen Stand neu. Ein neuer Share-Aufruf nimmt immer den aktuellen Stand. Bei Filter-Leerzustand oder Ersatzimport werden HeartRate-Vorschau und Downloadstand geschlossen beziehungsweise ungueltig. Bestehende Objekt-URL-/Chart-Ressourcenregeln des Exporters gelten unveraendert.