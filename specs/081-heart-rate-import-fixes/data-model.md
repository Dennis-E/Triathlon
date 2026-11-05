# Data Model: Heart-rate and Import Fixes

**Status**: Phase-1-Entwurf; keine Daten oder Anwendungsmodule werden in diesem Schritt veraendert.

## 1. Bestehende Aktivitaet und Extremfeldevidenz

Alle bisherigen Felder einschliesslich `id`, `date`, `startTime`, `sport`, `distance`, `duration`, `avgHeartRate`, Routen-/Powerzuordnung bleiben nach ihrem aktuellen Vertrag erhalten. `minHeartRate`/`maxHeartRate` bleiben Zahlen in bpm oder `null`; alte Aktivitaeten ohne die Eigenschaften bleiben gueltig. Provenienz ist optional und wird ausserhalb der bisherigen Identitaets-/Fingerprintberechnung ergaenzt.

`HeartRateFieldEvidence` ist ein reines, kopierbares Wertobjekt:

| Feld | Typ / Regel |
|------|-------------|
| `value` | Endliche positive bpm-Zahl oder `null`; niemals Durchschnittsersatz. |
| `status` | `valid`, `missing`, `invalid`, `conflict` oder `unqualified`. |
| `source` | `summary`, `records` oder `null`. |
| `reason` | Fester Code aus dem Importvertrag oder `null`, keine persoenlichen Inhalte. |
| `sampleCount` | Nichtnegative ganze Zahl bei Records, sonst `null`; keine Mindestmenge als medizinische Heuristik. |
| `readComplete` | Bei Records `true` nur mit positivem Lesebeleg; bei direkter Zusammenfassung `null`. |

Optionale Activity-Eigenschaft `heartRateProvenance` enthaelt `minimum` und `maximum` mit diesen Evidenzen. Zahl und Evidenz muessen uebereinstimmen. Fehlt bei Altaktivitaeten Provenienz, darf die bestehende Zahl fuer Kompatibilitaet weiter angezeigt werden, aber nicht nachtraeglich ohne Nachweis als recordsbasiert bezeichnet werden.

### Validierung und Vorrang

1. Direkte Felder unabhaengig inspizieren. Leere CSV-Duplikate sind keine Kandidaten; identische valide Kandidaten ergeben einen Wert. Nichtleere ungueltige beziehungsweise widerspruechliche Kandidaten ergeben `invalid` beziehungsweise `conflict`, nicht einen geratenen Ersatz.
2. TrainingPeaks: Nur `missing` darf aus qualifizierten Records ergaenzt werden. `valid` bleibt direkt; `invalid`/`conflict` bleibt diagnostiziert. Kein Vergleich mit dem Durchschnittspuls zur Reparatur.
3. Gueltige direkte umgekehrte Paare bleiben unveraendert gespeichert und fuer die Ansicht ungeeignet. Wenn erst eine Ergaenzung dem direkten Gegenwert widerspricht, wird die Ergaenzung verworfen (`inconsistent_with_summary`), nicht der direkte Gegenwert korrigiert.
4. Zwei aus derselben qualifizierten Reihe bestimmte Werte sind deren tatsaechliches beobachtetes Minimum/Maximum. Das ist keine Garantie medizinisch vollstaendiger Messabdeckung.
5. Eine gueltige einzelne Extremart genuegt weiterhin fuer importweite Verfuegbarkeit. Durchschnitt-only unterstuetzt gegebenenfalls andere Ansichten, nicht den Min-/Max-Tab.

## 2. FIT-Lesebeleg und Sessionqualifizierung

`FitHeartRateReadEvidence` ist nur importlokal und wird nicht in Exportsnapshots kopiert:

| Feld | Regel |
|------|-------|
| `readStatus` | `complete`, `incomplete` oder `unknown`; nur `complete` erlaubt Ableitung. |
| `lengthValidated`, `integrityValidated`, `strictParseCompleted`, `recordsComplete` | Alle `true` erforderlich. Ein fehlender strikter Callback ist kein Abschluss. |
| `resourceLimited` | Muss `false` sein; Limits, Downsampling oder Trunkierung sperren die Ableitung. |
| `unit` | Nachgewiesenes `bpm` des FIT-Herzfrequenzfelds, sonst `null`. |
| `reason` | Begrenzter sicherer Grundcode, keine Dateinamen oder Parser-Rohmeldungen. |

Optionaler importlokaler `summaryFieldPresence`-Beleg enthaelt je Originalsession nur `{ minimum, maximum }` mit `missing`, `valid` oder `invalid`. Er unterscheidet vom Decoder entfernte uint8-Invalidwerte von tatsaechlich fehlenden Summaryfeldern; keine Rohwerte oder Trainingsdaten. Ohne sichere strukturelle Pruefung kein positiver Fallbackbeleg.

`QualifiedHeartRateSession` referenziert den Originalsessionindex, originale gueltige `start_time`/`timestamp` und genau zugeordnete unverkuerzte Records derselben Datei. Alle Rohsessions nehmen an der Eigentuemerklaerung teil, auch spaeter uebersprungene Sportarten. Grenzen sind inklusive; mehrdeutige gemeinsame Endpunkte werden nicht willkuerlich zugeteilt.

- Ungueltige oder fehlende Originalgrenzen verhindern den Aufzeichnungsfallback.
- Ueberlappende Sessions oder mehrdeutige HR-Grenzrecords sperren betroffene Sessions; unzuordenbare HR-Records ohne gueltigen Zeitpunkt sperren den Aufzeichnungsfallback.
- Valide FIT-HR-Werte sind ganze Zahlen `1..254`; 255 ist eine Format-Invalidkennung. Andere ungueltige Messwerte werden nicht zu Punkten.
- Timer-/Bewegungsdauer, naechster Sessionstart, GPS-Toleranz, Trackvereinfachung und Power-Normalisierung liefern keine HR-Zuordnungsgrenzen.
- Die qualifizierende Zusatzpruefung darf bestehende tolerante Parserausgaben, Identitaeten, Duplikatentscheidungen oder deren Auswertungen nicht ersetzen. Ihre Rohlisten werden nach der lokalen Zusammenfassung freigegeben.

## 3. Lokale Quellenabdeckung

Ein optionaler `heartRateCoverage`-Block in den bestehenden Importdiagnosen zaehlt je Extremart direkte, beobachtete, fehlende, ungueltige und nicht qualifizierte Angaben; vorhandene Durchschnittspulse werden getrennt erfasst. Keine Rohwerte, Zeitstempel, Quell-IDs oder personenbezogenen Dateinamen in diesem summarischen Block. Er wird nicht automatisch an Analyse-/Diagnosedienste uebertragen.

Bestehende Importhinweise und Wertdetails zeigen daraus eine knappe sachliche Datenverfuegbarkeit. Es entsteht weder ein neuer Tab noch eine Behauptung, dass Durchschnittspuls gleichbedeutend mit fehlenden Herzfrequenzdaten ist.

## 4. Kalenderperiodenmodell

Neuer reiner Einstieg: `buildHeartRatePeriodModel(filteredActivities, { aggregation, getActivityKey, rangeStart, rangeEnd })`. Die Eingabeliste ist bereits durch die bestehenden Sport-/Zeitfilter ausgewaehlt. Der bisherige `buildHeartRateTimeline` bleibt kompatibel und liefert weiterhin die Trainingsdetails/Validierung fuer andere Aufrufer.

| Modellfeld | Inhalt |
|------------|--------|
| `aggregation` | `daily`, `weekly`, `monthly` oder `yearly`. |
| `periods` | Chronologisch sortierte belegte Perioden mit mindestens einer gueltigen Extremart; keine erfundenen Leerperiodenwerte. |
| `minimumPoints`, `maximumPoints` | Getrennte Punktarrays, hoechstens ein Punkt je Extremart und Periode. |
| `activityCount` | Zahl verschiedener qualifizierter Trainings, nicht Punkt-/Periodenzahl. |
| `periodCount` | Zahl belegter Perioden. |

Eine Periode hat `periodKey`, `label`, `startMs`, `endExclusiveMs`, `visibleStartMs`, `visibleEndMs`, kopierte `contributors[]`, `minimum` und `maximum`. Ein Extremobjekt enthaelt `value` oder `null` und `sources[]` mit allen gleichwertigen Ursprungstrainings fuer diese Extremart. Contributors behalten die bestehenden datasetlokalen `activityKey`-/`sourceOrdinal`-Schluessel sowie kopierte Datum-/Startzeit-/Sport-/Anzeigeangaben und Provenienz; keine Rohaktivitaetsreferenzen oder Samples.

Kalenderschluessel: Tag `YYYY-MM-DD`, Woche als Montagdatum, Monat `YYYY-MM`, Jahr `YYYY`. Kalendergrenzen mit lokalen Date-Operationen fortschalten. Wochenlabels nutzen echte ISO-Wochenjahre oder den eindeutigen Datumsbereich. `activity.date` ist massgeblich; `startTime` und `sourceLocalStart` dienen Details, keiner UTC-Neuzuordnung.

Aggregation: kleinste qualifizierte Trainingsminima und groesste Trainingsmaxima je Gruppe. Alle Gleichstaende bleiben in `sources`. Die Punktposition `x` ist die Mitte der Schnittmenge aus Kalenderperiode und angefordertem inklusivem Fenster; `y` bleibt der originale bpm-Wert. Fuer den exklusiven Periodenendpunkt wird zur geschlossenen Darstellung `endExclusiveMs - 1` verwendet. Teilperioden verwenden ausschliesslich die bereits gefilterten Trainings. Keine Mittelwerte, Glaettung, Jitter oder Verbindungslinien.

## 5. Angeforderter Bereich und RenderContext

`HeartRateViewRange = { rangeStart, rangeEnd, displayStart, displayEnd, timeframeKey, aggregation }` verwendet Epoch-Millisekunden:

- Begrenzt: Ende ist das bestehende Gesamtimport-Maximaldatum, Anfang das ungeklemmte Ergebnis der bestehenden Kalenderarithmetik fuer die gewaehlte Option. Die bisherige Trainingsfilterung bleibt unveraendert.
- All: Grenzen der gesamten ausgewaehlten gueltig datierten Run-/Bike-/Swim-Historie, auch wenn einzelne Trainings keine Extrema haben. Das ist kein blosses Punktminimum/-maximum.
- Displaygrenzen entsprechen normalerweise den angeforderten Grenzen. Nur ein degenerierter All-Einzelpunktbereich darf rein optisch aufgeweitet werden; angeforderte Grenzen bleiben unveraendert dokumentiert.
- Keine qualifizierten Werte ergibt weiterhin einen Filter-Leerzustand ohne Chart-/Exportmodell; die importweite Verfuegbarkeit aendert sich nicht.

`HeartRateRenderContext` kopiert beim Rendern Sport, Aggregation, Timeframe-Schluessel, ViewRange, Datasetrevision und lokale Modellrevision. Neue UI-Details und Exporte lesen diesen Kontext, nicht einen inzwischen geaenderten Livezustand.

## 6. Exportsnapshot

Der bestehende Snapshot enthaelt weiterhin `points`, benannte/formunterscheidbare Reihen und kopierte Chart-Eingaben. Er ergaenzt `aggregation`, Periodenlabels, `periodStart`/`periodEnd` als angeforderte Grenzen, `viewBounds` als Darstellungsgrenzen sowie `activityCount` und `periodCount`. Keine rohen Recordreihen, Trainingsobjekte, persoenlichen Namen oder live lesenden Zustandsfunktionen in der Bildfamilie.

Die bestehende HeartRate-Revisionsregel bleibt: Noch laufende veraltete Aufnahmen nicht veroeffentlichen; bereits veroeffentlichte Snapshots behalten ihren angeforderten Stand bei Formatwechsel/Download. Filter-Leerzustand und Ersatzimport schliessen alte Vorschauen/Downloadziele. Andere Exportfamilien bleiben unveraendert.

## 7. AppleRuntimeDiagnostic und Zustandsuebergaenge

Ein sicherer lokaler Diagnoseumschlag enthaelt `v: 1`, festen `code`, `phase`, `component`, `generation`, `environment`, `missingCapabilities[]` und `action`. `environment` enthaelt ausschliesslich `scheme`, `hostClass`, `secureContext` und `realm`; Werte sind Enums/Booleans, keine freien Browser-/URL-/Dateitexte. Details und Codes stehen in [contracts/apple-health-runtime.md](contracts/apple-health-runtime.md).

Lebenszyklus: `idle -> initializing -> ready -> processing -> prepared -> committed`, mit `failed` oder `cancelled` vor jedem Commit. Ein `ready` ist erst nach erfolgreichen Kontext-/Library-/Export-/SHA-256-Pruefungen erlaubt. Die 30-Sekunden-Frist betrifft nur `initializing`. Jede Fehl-/Abbruchkante terminiert genau einmal Worker, Heartbeat und Watchdog; die bereits vorhandene Historie bleibt bis zum gueltigen Commit unangetastet.