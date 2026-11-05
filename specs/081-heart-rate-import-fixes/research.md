# Research: Heart-rate and Import Fixes

**Date**: 2026-11-05
**Status**: Phase 0 abgeschlossen; ausschliesslich Planung. Keine Anwendungsaenderung und keine neuen Verhaltenstests in diesem Workflow.

## 1. Strava-Header statt behaupteter Datenabwesenheit

- **Decision**: `getCsvHeartRateKind` in `src/heart-rate-utils.js` um den exakt normalisierten Alias `max. herzfrequenz` ergaenzen. Bestehende `parseCsvHeartRateExtrema`-Signatur und strikte Zahlengrammatik erhalten. Alle passenden Spalten auswerten: leere ignorieren, identische valide Angaben akzeptieren, nicht aufloesbare Konflikte nur fuer die betroffene Extremart sperren.
- **Rationale**: Die vorherige lokale Referenzpruefung bestaetigt doppelte `Max. Herzfrequenz`-Spalten, deren gemeinsam befuellte Werte uebereinstimmen. Der Alias fehlt im aktuellen Code. Browser-/CommonJS-Normalisierung und beide CSV-Reducer verwenden bereits dieselbe Erkennung; eine Aliasergaenzung erreicht damit alle vier Wege.
- **Alternatives considered**: Unscharfe Teilstringerkennung (verwechselt Metriken); erste/letzte Spalte oder numerisches Maximum als Konfliktloesung (ohne allgemeine Quellbegruendung unzulaessig); neue CSV-Sonderpipeline (unnoetig).
- **Evidence**: `src/heart-rate-utils.js` (`getCsvHeartRateKind`, `parseCsvHeartRateExtrema`), `src/dashboard-utils.js`, `src/dashboard-import.js`, `src/zip-importer.js` (`extractRelevantColumns`), `scripts/relevant-export-extractor.js` (`reduceActivitiesRows`). Keine erneute Privatdateninspektion durch die Rechercheagenten.

## 2. Direkte Felder und beobachtete Messungen getrennt behandeln

- **Decision**: Bestehende numerische `minHeartRate`-/`maxHeartRate`-Felder erhalten und optionale feldweise Provenienz ergaenzen. Verlaessliche direkte Angaben gewinnen; nur fehlende direkte TrainingPeaks-Felder duerfen aus qualifizierten Records ergaenzt werden. Ungueltige oder widerspruechliche explizite Angaben werden diagnostiziert, nicht als verdeckter Reparaturauftrag behandelt.
- **Rationale**: Die dokumentierte Stichprobe enthaelt fehlende Sessionminima bei vorhandenen zeitgestempelten HR-Records. Das erlaubt keinen Durchschnittsersatz und beweist noch keine eindeutige oder vollstaendige Recordzuordnung.
- **Alternatives considered**: Direkte Werte durch andere Sampleextrema ersetzen (Quellsemantik geht verloren); fehlendes Minimum aus Durchschnitt oder Maximum errechnen (erfunden); jedes rohe Record ohne Qualifizierung nutzen (mehrdeutig).
- **Evidence**: `normalizeTrainingPeaksSession` uebernimmt bisher nur direkte Sessionfelder; `getValidExtrema` schliesst umgekehrte Paare aus. Diese Regeln und Identitaeten bleiben bestehen.

## 3. Fallback nur mit nachgewiesener Einlesevollstaendigkeit und Eigentuemern

- **Decision**: Fuer den optionalen HR-Fallback originale FIT-Sessiongrenzen `start_time` und `timestamp` aus derselben Aufzeichnung verwenden, auch nicht unterstuetzte Sessions als moegliche Eigentuemer beruecksichtigen. Keine Grenze aus Timer-/Bewegungsdauer, naechstem Start, GPX-Toleranz oder Dateinamensnaehe ableiten. Fehlende/ungueltige Grenzen sperren den Aufzeichnungsfallback; ueberlappende Sessions sowie nicht eindeutig zuordenbare gemeinsame Endpunkte sperren die betroffenen Sessions.
- **Rationale**: Das vorhandene `getSessionRecords` kann an abgeleitetem Timerende und Folgestart beschneiden. Eine daraus erzeugte HR-Extremreihe waere kein belastbarer Trainingsnachweis. Die vorhandene Segmentierung ist ein Eigentuemermuster, aber das blosse Entfernen mehrdeutiger Records macht deren verbleibende Teilreihe nicht vollstaendig.
- **Decision**: Bestehende tolerante Parserausgabe fuer bisherige Auswertungen nicht ersetzen. Eine kandidatenspezifische, begrenzte Qualifizierung derselben entpackten Bytes mit dem bereits festgelegten FIT-Parser in striktem Modus liefert eigene Lesebelege. Gueltige Laengen/Integritaet, abgeschlossener Parser-Callback und keine Parser-/Limit-/Trunkierungsfehler sind erforderlich. Der Parser kann bei CRC-Fehler ohne Callback zurueckkehren: fehlender Abschluss ist deshalb ausdruecklich ein nicht qualifizierter Befund, kein Erfolg. Keine eigene neue allgemeine FIT-Engine bauen.
- **Decision**: Keine Samples nach Trackvereinfachung, Leistungsnormalisierung oder Downsampling verwenden. Gueltige HR-Records benoetigen endliche Zeitstempel und ganzzahlige bpm `1..254`; 255 ist eine FIT-Invalidkennung. HR-Records ohne verlaessliche Zeitzuordnung sperren den Fallback der Aufzeichnung. Eindeutig ausserhalb liegende Records werden ausgeschlossen. Parsevollstaendigkeit bedeutet nicht medizinisch lueckenlose Messung; keine erfundene Mindestanzahl oder Abdeckungsquote.
- **Alternatives considered**: Toleranten `force:true`-Callback als Vollstaendigkeitsbeweis akzeptieren (unzureichend); bestehenden Power-/GPS-Pfad strenger machen (Regressionen); allgemeines binaeres Neuschreiben des Importers (ueberdimensioniert). Ohne positiven Beleg bleiben nur direkte Werte nutzbar.
- **Evidence**: `src/zip-importer.js` (`getSessionRecords`, `segmentFitRecordsByActivity`, `readAndParseFitData`, `parseFitData`, `importTrainingPeaksZips`); installierter `fit-file-parser@1.10.0` und seine CRC-/Abschlussbehandlung. Ein synthetischer Decoder-/Trunkierungs-/CRC-Nachweis ist eine Implementierungsfreigabe fuer den Fallback.

## 4. Kalenderperioden erst nach bestehenden Filtern bilden

- **Decision**: Neue reine `buildHeartRatePeriodModel(filteredActivities, options)`-Funktion in der vorhandenen Utility; bestehenden `buildHeartRateTimeline`-Vertrag erhalten und dessen Validierung/Trainingsdetails wiederverwenden. Der Renderer uebergibt bereits global gefilterte Trainings und den bestehenden Aggregationsmodus. Minimum bleibt min(Minima), Maximum max(Maxima); alle beitragenden Trainings und alle Extremgleichstaende bleiben getrennt erhalten.
- **Rationale**: Gemeinsame Filtersemantik und Altwerte bleiben unangetastet. Vorherige Einzeltrainingsdarstellung bleibt als kompatibler Helfer testbar; die Ansicht nutzt nun ausdruecklich die neue Kalenderaggregation.
- **Decision**: Schluessel sind lokaler Trainingstag, Montagdatum einer Woche, Kalendermonat und Kalenderjahr. Kalenderfortschaltung mit Date-Kalenderoperationen, nicht festen 24-Stunden-Schritten. Wochenbeschriftungen mit ISO-Wochenjahr oder eindeutiger Montag-bis-Sonntag-Datumsangabe. Keine UTC-Neuzuordnung aus `startTime`.
- **Alternatives considered**: Gemeinsame Distanzaggregate verwenden (falsche Messgroesse); min/max der Durchschnittspulse (falsch); vor Zeitfilterung gruppieren (falsche Randperioden).
- **Evidence**: `src/dashboard-core.js` (`getDashboardFilteredActivities`), `src/heart-rate-utils.js` (`buildHeartRateTimeline`), `src/apple-health-utils.js` (`calendarDates`).

## 5. Angeforderte Achse lokal vom geklemmten Filterbereich unterscheiden

- **Decision**: Eine HeartRate-lokale Bereichsfunktion verwendet die vorhandenen `getCurrentTimeframeOption`, `shiftDateByUnit` und den Gesamtimport-Maximaltermin. Bei begrenzten Fenstern wird das vorgeschlagene Minimum nicht am ersten Training geklemmt; die bereits vorhandene Trainingsauswahl bleibt unveraendert. Bei All stammen die Grenzen aus der gesamten sportpassenden Historie, einschliesslich Trainings ohne Extrema. Leeres Ergebnis bleibt ein Filter-Leerzustand.
- **Rationale**: Die gemeinsame `getTimeframeRange`-Semantik ist in anderen Ansichten etabliert. Fuer HeartRate soll ein groesseres angefordertes Fenster auch bei gleichen Punkten sichtbar werden.
- **Decision**: Periodenpunkte liegen in der Mitte der Schnittmenge aus Kalenderperiode und angefordertem Fenster. Teilperioden verwenden nur bereits gefilterte Trainings. Einzelpunkt-All darf rein optisch aufgeweitet werden; angeforderte Grenzen bleiben separat erhalten. Keine neuen Null-/Zwischenwerte und weiterhin `showLine:false`.
- **Alternatives considered**: Gemeinsame Zeitraumsemantik global aendern (unnoetiger Blast Radius); Achse weiterhin nur aus Punkten berechnen (Nutzerproblem bleibt); Periodenanfang ausserhalb des Fensters zeichnen (Randwert unsichtbar).
- **Evidence**: `getTimeframeRange` klemmt an der Historie; der aktuelle HeartRate-Renderer berechnet Grenzen aus verbleibenden Punkten. Beide Codepfade erklaeren den sichtbaren Effekt, ohne jeden Nutzerfall als reproduziert auszugeben.

## 6. Apple-Fehler nach Ursache statt nach Browsername trennen

- **Decision**: Zentrale, sichere Fehlercodes fuer Bereitstellung, Sicherheitskontext, fehlende Funktion, Bibliotheksladen/-export, Workerstart/-initialisierung/-laufzeit/-protokoll, Hashing und unerwarteten internen Fehler einfuehren; bestehende Archiv-/XML-/Limit-/Abbruchcodes erhalten. Keine Rohmeldungen oder Stacks aus Worker/Bibliotheken in UI oder Diagnoseexporte uebernehmen.
- **Rationale**: `UNSUPPORTED_CAPABILITY` vermischt heute Protokoll/Worker/Streams mit fehlenden SAX-/ZIP-Bibliotheken. Ungeprueftes WebCrypto sowie andere unbekannte Fehler koennen als `INVALID_ARCHIVE` enden. Der zuvor erfolgreiche echte Edge-/Loopback-Import ist kein Nachweis fuer die Ursache in den drei gemeldeten Nutzerumgebungen.
- **Decision**: HTTP(S)-Protokoll, lokale Hostklasse und `isSecureContext` getrennt bewerten; HTTPS sowie HTTP auf localhost, IPv4- und IPv6-Loopback sind vorgesehen. Remote-HTTP und `file:` erhalten konkrete Bereitstellungshinweise. Funktionen im tatsaechlichen Arbeitskontext pruefen, nicht allein im Fenster; SHA-256 bleibt zwingend und wird nicht durch einen unsicheren Identitaetsfallback ersetzt.
- **Alternatives considered**: Nur Fehlermeldung umbenennen (keine Diagnose); anhand des Browsernamens freischalten (falsche Ursache); Sicherheitspruefungen abschalten oder alle Archive in den Main Thread verlagern (Risiko fuer Identitaet, Datenschutz und Ressourcen).
- **Evidence**: `src/dashboard-import.js` (`importAppleHealthInWorker`, `executeAppleHealthZipImport`), `src/apple-health-importer.js` (`xmlConsumer`, `importAppleHealthZip`), `src/apple-health-utils.js` (`failure`, `digest`), `src/apple-health-worker.js`.

## 7. Apple-Initialisierung und Cleanup explizit machen

- **Decision**: Versioniertes `init -> ready -> start` vor Dateiverarbeitung; Libraries und benoetigte Exports/Funktionen vor `ready` pruefen. Initialisierung nach 30 Sekunden ohne `ready` abbrechen und Retry anbieten; kein neues Zeitlimit fuer den laufenden grossen Import. Worker-Konstruktor, Nachrichtentransport, `messageerror`, unerwartetes Workerende und unbekannte Nachrichten werden durch denselben idempotenten Cleanup abgewickelt. Importgeneration und vorhandene atomare Commitgrenze bleiben erhalten.
- **Rationale**: Bisher ersetzt erstes Progress-Ereignis einen echten Handshake; ein haengender Start kann endlos Statusmeldungen erzeugen. Konstruktor-/Clonefehler sind nicht vollstaendig in den Cleanup eingebunden. Bibliotheksfehler und Worker-Laufzeitfehler werden vermischt.
- **Decision**: Diagnosen enthalten nur allowlistbasierte Enums/Booleans fuer Phase, Komponente, sichere Kontextklasse, fehlende Funktionen und passende Aktion. Keine persoenlichen Dateinamen, absoluten URLs, Rohdaten, Messwerte, Quell-IDs oder automatischen Remote-Diagnoseanfragen. Neue Wiederholung ist eine bewusste Nutzeraktion mit neuer Generation, kein automatisches Wiederholen grosser Archive.
- **Alternatives considered**: Unbegrenzte Initialisierung (kein Abschluss); pauschales Gesamtlaufzeitlimit (bricht grosse valide Exporte ab); Bibliotheksfehler zu Archivfehlern normalisieren (falsche Abhilfe).
- **Evidence**: Vorhandener Heartbeat/Worker-Cleanup im Dashboard, `importScripts`- und Worker-Catchpfade, bisherige VM-Tests mit injizierten Abhaengigkeiten.

## 8. Exportstandard und eingefrorenen Renderkontext erhalten

- **Decision**: Bestehendes `heartRateShareBtn`/Tab-/Capture-ID beibehalten, Button jedoch wie benachbarte Ansichten mit Strava-Logo, `Export for Insta / Strava`, Instagram-Logo und bestehenden Klassen in dieselbe responsive Kopf-/Bedienleiste aufnehmen. Kein neues allgemeines Designsystem.
- **Decision**: Beim Rendern einen kopierten Kontext fuer Sport, Aggregation, angeforderte Grenzen und Achse festhalten. Exportsnapshot liest diesen Stand statt erneut Live-Filter zu interpretieren. Die vorhandene strukturierte Scatterfamilie und alle drei PNG-Formate wiederverwenden. Quellenprovenienz lokal erklaeren, keine Rohsamples oder Trainingsobjekte in Bildsnapshots kopieren.
- **Rationale**: Periodenauswahl, angeforderte Achse und Bildinhalt muessen zusammenpassen. Die bestehenden Revisions-/Published-Regeln schuetzen laufende Aufnahmen und erlauben absichtlich eingefrorene bereits sichtbare Vorschauen.
- **Alternatives considered**: Zweiter Exportweg oder andere Buttonbeschriftung (Nutzerproblem bleibt); Snapshot nach Formatwechsel aus Live-Daten neu bauen (falscher angeforderter Stand); Video-/Formatumfang erweitern (nicht beauftragt).
- **Evidence**: `index.html` benachbarte Exportkopfzeilen, `src/dashboard-heart-rate.js` (`getExportData`), `src/dashboard-export.js` (`captureExportSelection`, `createStructuredExportResources`, Revisionsguards), `src/export-utils.js` (`planExportPages`).

## Planungsabschluss und noch auszufuehrende Nachweise

Alle fachlichen und architektonischen Entscheidungen sind getroffen. Der genaue historische Nutzerfehler beim Apple-Import ist nicht als reproduziert behauptet; dessen Eingrenzung erfolgt durch den konkreten Umgebungs-/Fehlervertrag. Strikter FIT-Abschluss, sechs reale Apple-Browser-/Bereitstellungsfaelle, Referenzdatenparitaet, responsive Screenshots und neun Perioden-/PNG-Kombinationen sind verpflichtende spaetere Nachweise, keine in dieser Planungsphase bestandenen Verhaltenstests.