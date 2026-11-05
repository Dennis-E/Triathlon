# Contract: Heart-rate Source Evidence and Fallback

## 1. Kompatible gemeinsame Utility

Die folgenden reinen Funktionen gehoeren in die bestehende gekapselte Dual-Target-Utility `src/heart-rate-utils.js`, nicht in ein neues Parserframework:

| Funktion | Vertrag |
|----------|---------|
| `getCsvHeartRateKind(header)` | Bisherige Erkennung plus exakter normalisierter Alias `max. herzfrequenz`; unbekannte oder einheitswidersprechende Varianten nicht raten. |
| `inspectCsvHeartRateExtrema(headers, row)` | Feldweise Evidenz fuer `minimum` und `maximum` nach [data-model.md](../data-model.md). |
| `parseCsvHeartRateExtrema(headers, row)` | Bestehende kompatible Projektion auf `{ minHeartRate, maxHeartRate }`; Signatur und strikte Zahlenregeln erhalten. |
| `deriveTimedHeartRateExtrema(records, qualification)` | Nur aus positiv qualifizierten Records Minimum/Maximum und deren beobachtete Provenienz bestimmen; keine Inputmutation. |
| `resolveHeartRateExtrema(directEvidence, observedEvidence)` | Direkten Vorrang, ergaenzbare Fehlfelder und Konfliktregeln anwenden; Zahlenfelder plus optionale `heartRateProvenance` zurueckgeben. |

Bestehendes `hasHeartRateData` bleibt an verwendbare aufgeloeste Zahlen gebunden. Die neue Provenienz ist weder ein neuer Identitaetsschluessel noch Voraussetzung fuer die Kompatibilitaet bereits vorhandener numerischer Altaktivitaeten.

## 2. Strava-Alias und doppelte Spalten

Der Alias `Max. Herzfrequenz` hat dieselbe bekannte bpm-Semantik wie die bisherigen expliziten Maximumsheader. Gross-/Kleinschreibung und aeussere Leerzeichen werden wie bisher normalisiert; keine unscharfe Teilstringzuordnung. Kein Minimum aus einem Maximum oder Durchschnitt.

| Gleichartige Spaltenkandidaten | Ausgabe |
|-------------------------------|---------|
| Alle leer / Header fehlt | `missing`, Wert `null`. |
| Eine valide Zahl, andere leer | Valide Zahl, `summary`. |
| Mehrere identische valide Zahlen | Genau ein valider Wert, `summary`. |
| Verschiedene valide Zahlen ohne belegte semantische Prioritaet | `conflict`, betroffene Metrik `null`. |
| Nichtleere ungueltige Kandidaten | `invalid`, betroffene Metrik nicht als verdeckten Fallback reparieren. |

Die Zahlengrammatik bleibt positiv/endlich, optionales `+`, Dezimalpunkt oder -komma. Keine Suffixe, Exponenten oder `parseFloat`-Teilstringannahmen. Nichtleere Quell-Invalidkennungen sind keine Messungen. Vorhandene Durchschnittswerte und alle sonstigen Felder bleiben nach ihrem bisherigen Parservertrag unveraendert.

Browser- und CommonJS-Normalisierung muessen dieselben Zahlen/Evidenzen liefern. Beide bestehenden Reducer erhalten alle erkannten optionalen Extremspalten am Ende ihrer bisherigen Ausgabe; sie beseitigen keine Duplikate oder Konflikte. Ohne Extremspalten bleibt das bisherige Schema identisch. Erste/zweite Distance-/Distanz-Bedeutung und ID-Position bleiben erhalten.

## 3. TrainingPeaks-Lesebelege

Im TP-eigenen Importpfad wird eine interne Lesefunktion `readTrainingPeaksFitWithHeartRateEvidence(entry, dependencies)` vorgesehen. Rueckgabe: `{ fitData, heartRateReadEvidence }`. Sie verwendet die bestehenden Lese-/Dekompressions-/Parseroptionen fuer `fitData`, ohne Rueckgabe oder Verhalten anderer Aufrufer von `readAndParseFitData` zu veraendern. Bereits entpackte Bytes werden nur fuer die optionale HR-Qualifizierung zugaenglich gemacht; keine zweite Archivextraktion.

Eine kandidatenspezifische strikte Pruefung mit derselben festgelegten Parserfassung muss gueltige FIT-Laenge, Integritaet und vollstaendige Parsernachrichtenverarbeitung belegen. Die tolerante Altberechnung wird nicht durch diese Ausgabe ersetzt. Ein positiver Beleg erfordert:

- keine Trunkierung, keine Limit-/Downsamplingbehandlung und gueltige Laengen-/Integritaetspruefungen;
- tatsaechlich abgeschlossenen strikten Parser-Callback ohne Fehler;
- vollstaendige unverkuerzte Recorduebernahme und uebereinstimmende Recordanzahl der relevanten erfolgreichen Parserwege;
- keine verheimlichten Parser-/Recordverluste und bekannte bpm-Einheit.

Da der festgelegte Decoder uint8-Invalidkennungen aus Summaryobjekten entfernt, wird fehlende Feldpraesenz gesondert belegt. Ein eng begrenzter importlokaler Strukturcursor prueft nur Standard-HR-Summaryfelder 64/17, uint8-Groesse und ihre Praesenz/Invalidkennung. Andere Trainingswerte liefert weiterhin ausschliesslich der Decoder. Der Beleg enthaelt je Originalsession nur `missing`/`valid`/`invalid`; nicht unterstuetzte Strukturen einschliesslich komprimierter Nachrichten oder widerspruechlicher Sessionanzahl sperren den Fallback, statt Invalidfelder als fehlend zu behandeln.

Fuer `fit-file-parser@1.10.0` muss mit echten synthetischen Bytes nachgewiesen werden, wann der synchrone Abschluss erfolgt. Rueckkehr ohne Callback, einschliesslich CRC-Verweigerung, ergibt `unknown`/`incomplete`; niemals ein endlos ausstehendes Promise oder einen positiven Beleg. Kein selbstgeschriebener allgemeiner FIT-Decoder oder unsicherer CRC-Bypass. Kann der Beleg nicht erbracht werden, bleibt der HR-Fallback gesperrt; direkte Werte und bisherige Importvertraege bleiben massgeblich.

## 4. Originalsession-Eigentuemer

`qualifyFitHeartRateSessions(rawSessions, records, readEvidence)` gehoert in `src/zip-importer.js`; Zuordnungsergebnis je Originalsessionindex. Originale gueltige `start_time`/`timestamp` mit `start < end` sind erforderlich. Verlaessliche vom Parser gelieferte Zeitpunkte verwenden, keine beliebige String-/Zahlen-Coercion.

Alle originalen Sessions derselben Datei nehmen an der Eigentuemerklaerung teil, auch nicht unterstuetzte Sportarten. Grenzen sind inklusive. Records muessen genau einen eindeutigen Eigentuemer haben; ein mehrdeutiger HR-Grenzrecord sperrt die betroffenen Sessions, statt durch blosses Weglassen einen scheinbar vollstaendigen Rest zu erzeugen. Zeitlich ueberlappende Sessions werden fuer diesen Fallback gesperrt. Ungueltige/fehlende Originalgrenzen oder HR-Records ohne zuordenbaren gueltigen Zeitpunkt verhindern den Aufzeichnungsfallback.

Gueltiges HR-Recordfeld ist numerisches ganzzahliges `heart_rate` in `1..254` bpm. 255 ist eine FIT-Invalidkennung; Null, negative/nicht endliche oder einheitsunklare Werte sind keine Messungen. Eindeutig ausserhalb der Originalsession liegende Samples liefern keine Werte. Keine Zeitgrenzen aus Bewegungs-/Timerdauer, naechstem Start, GPX-Toleranz, Dateinamen oder Naehezuordnung ableiten. Vor Trackvereinfachung und Leistungsnormalisierung auswerten.

## 5. Vorrang, Provenienz und Abwesenheit

Direkt valide Summaryfelder bleiben erhalten. Nur `missing` kann aus qualifizierten Records ergaenzt werden; die andere Extremart bleibt unabhaengig. Direkte `invalid`-/`conflict`-Angaben und direkt umgekehrte Paare werden nicht durch Samples repariert. Eine beobachtete Ergaenzung, die dem direkten Gegenwert widerspricht, wird verworfen; der direkte Wert bleibt unveraendert.

Beobachtete Werte werden als "aus aufgezeichneten Messungen" kenntlich. Vollstaendig eingelesene Dateien koennen dennoch reale Messluecken enthalten; daraus folgen keine Interpolation, medizinische Vollstaendigkeitsgarantie oder neue Mindestanzahl-/Zeitabdeckungsheuristik.

Feste Gruende fuer Provenienz/Abdeckung: `missing`, `invalid_value`, `conflict`, `no_samples`, `unknown_unit`, `read_incomplete`, `read_unknown`, `resource_limit`, `invalid_boundary`, `overlapping_sessions`, `ambiguous_boundary_record`, `invalid_timestamp`, `inconsistent_with_summary`. Quelle ist `summary`, `records` oder `null`. Lokale summarische Abdeckung unterscheidet Durchschnittspuls und beide Extremarten; keine Dateinamen, Rohwerte oder Remote-Diagnoseanfragen.

Bestehende Strava-/Apple-Direktwerte bleiben unterstuetzt. Neue Recordableitung wird ausschliesslich fuer TrainingPeaks eingefuehrt. Reimport derselben Datei behaelt alte IDs, Aktivitaetszahlen, First-wins-Duplikatentscheidungen, Durchschnittswerte und Power-/GPS-Ergebnisse. Keine nachtraegliche Zusammenfuehrung komplementaerer Duplikate.