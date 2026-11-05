# Feature Specification: Herzfrequenz-Import, Zeitfilter und Apple-Import korrigieren

**Feature Branch**: `not-created`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "1) Kein Minimum bei TrainingPeaks. 2) Weekly-, Monthly- und Yearly-Filter. 3) Timeframe veraendert die Visualisierung nicht. 4) Exportbutton hat das falsche Layout. 5) Strava enthaelt vermutlich Herzfrequenzdaten; sorgfaeltig pruefen. 6) Apple Health scheitert in Chrome, Edge und VS Code mit 'Apple Health import requires a modern browser served over HTTP or HTTPS.'"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Vorhandene Herzfrequenzen verlaesslich nutzen (Priority: P1)

Als trainierende Person sehe ich vorhandene Min-/Max-Herzfrequenzen aus Strava und TrainingPeaks, statt sie durch unvollstaendige Felderkennung oder fehlende optionale Zusammenfassungen zu verlieren. Ich kann erkennen, ob ein Wert direkt berichtet oder aus tatsaechlichen Messungen bestimmt wurde und ob lediglich Durchschnittspuls vorhanden ist.

**Why this priority**: Fehlende oder falsch als abwesend bewertete Werte verhindern die zentrale Nutzung der Ansicht. Ein erfundenes Minimum waere ebenso falsch wie ein verlorenes gemessenes Maximum.

**Independent Test**: Synthetische Exporte mit den tatsaechlich beobachteten Quellbezeichnungen sowie TrainingPeaks-Trainings mit und ohne direkte Zusammenfassungen importieren. Ergebnis mit den bekannten Quellfeldern beziehungsweise eindeutig zugeordneten Messungen vergleichen; private Referenzexporte nur lokal pruefen.

**Acceptance Scenarios**:

1. **Given** eine Strava-Datei mit den beobachteten Spalten `Max. Herzfrequenz` und `Durchschnittliche Herzfrequenz`, **When** importiert wird, **Then** werden vorhandene valide Maxima korrekt uebernommen; Durchschnittspuls bleibt unveraendert und wird nicht als Minimum interpretiert.
2. **Given** zwei gleichnamige Strava-Maximumsspalten mit teilweise leeren Zellen, **When** eine Zelle fehlt, **Then** bleibt ein unabhaengig verlaesslicher Wert aus der anderen Spalte nutzbar; unterschiedliche befuellte Werte werden nicht stillschweigend beliebig ausgewaehlt.
3. **Given** ein TrainingPeaks-Training ohne direktes Minimum, aber mit einer vollstaendig eingelesenen und eindeutig diesem Training zugeordneten Herzfrequenzmessreihe, **When** importiert wird, **Then** wird das kleinste valide beobachtete Messergebnis als messreihenbasiertes Minimum verfuegbar; ein bereits vorhandenes direktes Maximum bleibt erhalten.
4. **Given** ein verlaessliches direktes Minimum und eine zusaetzliche Messreihe, **When** importiert wird, **Then** behaelt das direkte Minimum Vorrang; es wird nicht ohne fachlichen Grund ueberschrieben.
5. **Given** nur Durchschnittspuls, eine unvollstaendig eingelesene oder mehrdeutig zugeordnete Messreihe oder unbekannte Einheiten, **When** die Min-/Max-Eignung bestimmt wird, **Then** werden keine Extremwerte erfunden. Die Datenhinweise unterscheiden vorhandenen Durchschnittspuls von fehlenden verwendbaren Extrema.

---

### User Story 2 - Apple Health in unterstuetzten Browsern importieren (Priority: P1)

Als Person mit einem Apple-Health-Export kann ich in aktuellem Chrome, Edge und dem integrierten VS-Code-Browser meine urspruengliche Exportdatei importieren. Wenn eine konkrete Voraussetzung fehlt, erhalte ich eine zutreffende Fehlermeldung mit einem passenden naechsten Schritt, nicht pauschal die Aufforderung, einen modernen Browser zu verwenden.

**Why this priority**: Der gemeldete Fehler blockiert den gesamten Apple-Import in mehreren aktuellen Browsern und damit jede darauf aufbauende Visualisierung.

**Independent Test**: Denselben synthetischen Originalexport ueber den tatsaechlichen Browser-Importweg in allen drei Browserumgebungen laden; unterstuetzte Bereitstellung, direkt geoeffnete Datei und gezielt fehlende Voraussetzungen getrennt pruefen. Ersetzte Importbausteine allein sind kein Kompatibilitaetsnachweis.

**Acceptance Scenarios**:

1. **Given** ein aktueller Chrome-, Edge- oder VS-Code-Browser mit den benoetigten Funktionen und einer HTTPS- oder lokalen HTTP-Bereitstellung ueber localhost/127.0.0.1, **When** ein gueltiger Apple-Health-Originalexport ausgewaehlt wird, **Then** startet der Import, zeigt Fortschritt und liefert die erwarteten unterstuetzten Trainings ohne die pauschale Browserfehlermeldung.
2. **Given** die App wurde als lokale Datei direkt geoeffnet oder eine Bereitstellung erfuellt die Sicherheitsvoraussetzungen nicht, **When** Apple Health ausgewaehlt wird, **Then** benennt die Meldung diese konkrete Situation und verweist auf eine unterstuetzte lokale HTTP- oder HTTPS-Bereitstellung; sie behauptet nicht, der aktuelle Browser sei veraltet.
3. **Given** eine benoetigte Importbibliothek kann nicht geladen werden oder eine wirklich notwendige Browserfunktion fehlt, **When** der Import startet, **Then** wird die jeweilige Ursache getrennt gemeldet und eine passende Wiederholungs- oder Umgebungsaktion angeboten.
4. **Given** bereits geladene Trainings, **When** ein Apple-Import fehlschlaegt oder abgebrochen wird, **Then** bleibt das vorherige Dashboard einschliesslich seiner Daten und nutzbaren Ansichten erhalten; ein erneuter Versuch ist moeglich.

---

### User Story 3 - Zeitliche Entwicklung sinnvoll gruppieren und eingrenzen (Priority: P1)

Als trainierende Person kann ich die Herzfrequenzentwicklung nach Kalenderwoche, Monat und Jahr vergleichen und das betrachtete Zeitfenster unabhaengig davon eingrenzen. Auswahl und tatsaechliche Darstellung stimmen ueberein; ein Auswahlwechsel ist nicht nur eine Aenderung der angebotenen Zeitoptionen.

**Why this priority**: Die aktuellen Periodenoptionen suggerieren eine Gruppierung, die nicht stattfindet. Eine nur an den verbleibenden Punkten ausgerichtete Achse kann trotz neuem Zeitfenster unveraendert aussehen.

**Independent Test**: Eine synthetische Historie ueber mehrere Wochen, Monats-/Jahreswechsel und Zeitraumgrenzen verwenden. Bekannte Periodenextrema und die angeforderten Zeitgrenzen vor und nach manueller beziehungsweise Tastaturauswahl vergleichen.

**Acceptance Scenarios**:

1. **Given** mehrere Trainings in einer Kalenderwoche, **When** Weekly gewaehlt wird, **Then** zeigt diese Woche je ein Minimum aus den verfuegbaren Trainingsminima und ein Maximum aus den verfuegbaren Trainingsmaxima; zugehoerige Ursprungstrainings bleiben in den Details erkennbar.
2. **Given** Trainings ueber mehrere Monate und Jahre, **When** Monthly beziehungsweise Yearly gewaehlt wird, **Then** erfolgt dieselbe feldweise Extremaggregation pro Kalendermonat beziehungsweise Kalenderjahr, ohne Mittelwertbildung oder Zusammenlegung der Min-/Max-Arten.
3. **Given** Perioden mit nur einem nutzbaren Extremfeld, **When** gruppiert wird, **Then** bleibt diese einzelne Reihe nutzbar; die fehlende Gegenreihe wird nicht aus anderen Groessen ergaenzt.
4. **Given** Trainings beiderseits einer Zeitraumgrenze, **When** das Zeitfenster verkleinert wird, **Then** werden zuerst unpassende Trainings ausgeschlossen und erst danach Periodenwerte berechnet; auch eine teilweise enthaltene Woche verwendet nur Trainings innerhalb des Zeitfensters.
5. **Given** alle passenden Trainings liegen bereits im kuerzeren Zeitfenster, **When** ein laengeres begrenztes Zeitfenster gewaehlt wird, **Then** duerfen die Messwerte identisch bleiben, aber X-Achse und Zeitraumkontext bilden das laengere angeforderte Fenster ab.
6. **Given** die gewaehlten Filter liefern keine verwendbaren Werte, **When** die Ansicht aktualisiert wird, **Then** bleibt der fuer den Import grundsaetzlich verfuegbare Tab erreichbar, zeigt einen eindeutigen Filter-Leerzustand und sperrt alte Diagramme und Exporte.

---

### User Story 4 - Eine konsistente Exportaktion verwenden (Priority: P2)

Als trainierende Person finde ich den Export an derselben erwarteten Stelle und im selben visuellen Muster wie in den anderen Dashboardansichten. Vorschau und heruntergeladenes Bild zeigen genau die gewaehlte Periodengruppierung, Sportauswahl und Zeitspanne.

**Why this priority**: Die abweichende Aktion erschwert die Bedienung und wirkt unvollstaendig. Ein Export darf die korrigierten Zeit-/Datenregeln nicht wieder verlieren.

**Independent Test**: HeartRate- und benachbarte Dashboard-Kopfzeilen auf schmalen und breiten Bildschirmen vergleichen, den Export ausloesen und Vorschau sowie echte PNG-Datei mit dem sichtbaren Datenstand abgleichen.

**Acceptance Scenarios**:

1. **Given** eine breite Ansicht mit Daten, **When** die Kopfzeile betrachtet wird, **Then** entspricht der Exportbutton dem bestehenden Dashboardmuster in Beschriftung, Symbolen, Hoehe, Abstaenden und Position innerhalb der Bedienleiste; er liegt nicht unverbunden ausserhalb des Layouts.
2. **Given** eine schmale Ansicht, **When** Filter und Exportbutton umbrechen, **Then** bleiben alle Bedienelemente lesbar und erreichbar, ohne horizontalen Seitenueberlauf oder Ueberlagerung des Diagramms.
3. **Given** Weekly, Monthly oder Yearly und ein begrenztes Zeitfenster, **When** exportiert wird, **Then** enthalten Vorschau und PNG die passenden aggregierten Reihen, Einheiten, Periodenkennzeichnung und tatsaechlich angeforderten Zeitgrenzen.
4. **Given** eine laufende oder bereits geoeffnete Vorschau, **When** Filter oder Import wechseln, **Then** bleibt die festgelegte Snapshot-Regel erhalten: laufende veraltete Aufnahmen verwerfen, veroeffentlichte Snapshots bei weiterhin gueltigen Daten unveraendert halten, bei Filter-Leerzustand oder Ersatzimport schliessen.

### Edge Cases

- Mehrere gleichnamige Herzfrequenzspalten koennen leer, identisch oder widerspruechlich sein. Ein leerer Eintrag entwertet keinen gueltigen Gegenwert; ein Konflikt braucht belegte Quellsemantik statt einer geratenen Auswahl.
- Direkte Trainingszusammenfassung und beobachtete Messreihenextrema koennen sich unterscheiden. Direkte verlaessliche Angaben haben Vorrang; beobachtete Werte werden als solche kenntlich gemacht und nicht als medizinisch garantierte Extremwerte ausgegeben.
- Messungen ausserhalb des Trainings, auf mehrdeutigen gemeinsamen Grenzen, aus fremden Aufzeichnungen oder mit unbekannter Einheit duerfen keine Extremwerte liefern. Technisch abgeschnittene Messreihen sind kein vollstaendiger Ersatz fuer eine Trainingszusammenfassung.
- Fehlende, nicht endliche, nichtnumerische, negative und Nullwerte sowie Quell-Invalidkennungen sind keine validen Herzfrequenzen. Ein Minimum groesser als das zugehoerige Maximum wird nicht vertauscht oder korrigiert.
- Eine Woche reicht von Montag bis Sonntag; Wochen ueber Jahreswechsel duerfen nicht irrtuemlich in zwei Gruppen zerfallen. Monate und Jahre sind Kalenderperioden, keine rollierenden 30-/365-Tage-Summen.
- Trainingstage behalten die bestehende lokale beziehungsweise Quell-Kalenderzuordnung. Sommerzeit, Zeitzonen und Training ueber Mitternacht duerfen keine neue Tagesverschiebung erzeugen.
- Gleich hohe Periodenextrema koennen von mehreren Trainings stammen; die Details behalten diese Trainings getrennt und nennen die Herkunft je Extremart.
- Leere Zeitabschnitte im angeforderten Fenster sind keine Nullpulswerte. Ein fehlendes Periodenminimum wird nicht durch eine Verbindungslinie als bekannte Messung suggeriert.
- Alle begrenzten Zeitfenster koennen dieselben Trainings enthalten; trotzdem muss der angeforderte Achsenbereich erkennbar sein. All nutzt die gesamte passende Historie; eine Einzelperiode bleibt sinnvoll darstellbar.
- Ein Bibliotheksladefehler, eine ungueltige Datei und eine fehlende Sicherheitsvoraussetzung sind unterschiedliche Importfehler. Ein gemeinsamer pauschaler Browsertext darf sie nicht verdecken.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Der Import MUSS vorhandene Herzfrequenzdaten in den unterstuetzten Quellen anhand ihrer tatsaechlichen Feldbedeutung erkennen. Er DARF aus einem nicht erkannten Header NICHT auf fehlende Quelldaten schliessen. Die beobachtete deutsche Strava-Bezeichnung `Max. Herzfrequenz` sowie die bereits unterstuetzten deutschen/englischen Extrembezeichnungen MUESSEN beruecksichtigt werden.
- **FR-002**: Mehrere Spalten fuer dieselbe Herzfrequenzmetrik MUESSEN unabhaengig auf valide Angaben geprueft werden. Leere Spalten DUERFEN gueltige Angaben NICHT verwerfen. Fuer widerspruechliche befuellte Spalten MUSS eine durch Quellsemantik belegte Vorrangregel gelten; ohne solche Aufloesung bleibt nur die betroffene Metrik unverfuegbar. Beliebige Erst-/Letzt-/Kleinst-/Groesstwertauswahl zur Konfliktbeseitigung ist unzulaessig.
- **FR-003**: Verlaessliche direkte Trainingsminima und -maxima MUESSEN erhalten bleiben und Vorrang vor abgeleiteten Messreihenwerten haben. Fehlt bei TrainingPeaks ein direktes Extremfeld, MUSS es aus tatsaechlich aufgezeichneten validen Herzfrequenzmessungen bestimmbar sein, sofern deren Einheit und Zuordnung zum konkreten Training eindeutig sind und die relevante Aufzeichnung vollstaendig eingelesen wurde. Die beiden Extremfelder bleiben unabhaengig nutzbar.
- **FR-004**: Messreihenbasierte Extrema MUESSEN auf die eindeutig zugehoerige Aufzeichnung und den gueltigen Trainingszeitraum begrenzt bleiben. Fremde, mehrdeutige, technisch abgeschnittene oder einheitsunklare Messungen DUERFEN NICHT als Fallback verwendet werden. Bereits vorhandene Zuordnungs-/Deduplizierungsregeln DUERFEN NICHT durch eine willkuerliche Naehezuordnung umgangen werden.
- **FR-005**: Herkunft und Nichtverfuegbarkeit MUESSEN nachvollziehbar sein: direkte Zusammenfassung, beobachtete Messreihe, fehlendes Extremfeld, ungueltige Angabe oder ungeklaerte Zuordnung. Vorhandener Durchschnittspuls DARF NICHT als vollstaendige Abwesenheit von Herzfrequenzdaten bezeichnet oder als Min-/Max-Ersatz verwendet werden. Diese Hinweise MUESSEN in bestehende Import-/Datenhinweise beziehungsweise Wertdetails passen, ohne einen neuen Diagnosetab zu erfordern.
- **FR-006**: Weekly, Monthly und Yearly MUESSEN die HeartRate-Daten tatsaechlich nach Kalenderwoche, Kalendermonat und Kalenderjahr gruppieren. Pro Gruppe MUSS Minimum das kleinste verfuegbare Trainingsminimum und Maximum das groesste verfuegbare Trainingsmaximum sein; keine Durchschnittsbildung und keine Pflicht zu vollstaendigen Paaren. Eine vorhandene Daily-Auswahl MUSS entsprechend pro Trainingstag funktionieren.
- **FR-007**: Der Zeitraum- und Sportfilter MUSS vor der Periodenaggregation angewendet werden. Vorhandene Einzelauswahl, inklusive Zeitgrenzen und Verankerung am letzten Training der geladenen Historie bleiben massgeblich. Eine teilweise eingeschlossene Periode DARF keine ausserhalb des Zeitfensters liegenden Trainings einbeziehen.
- **FR-008**: Die HeartRate-X-Achse und der sichtbare Zeitraumkontext MUESSEN bei begrenzten Zeitfenstern den angeforderten Zeitraum darstellen, nicht nur den Abstand zwischen verbleibenden Datenpunkten. Leere Abschnitte DUERFEN NICHT durch erfundene Null- oder Zwischenwerte gefuellt werden. All MUSS die gesamte passende Historie abbilden. Die bestehenden Datumsberechnungen anderer Ansichten bleiben unveraendert.
- **FR-009**: Manuelle Filterwahl, Tastaturwechsel, Tabwechsel und Ersatzimport MUESSEN denselben aktuellen Auswahlzustand fuer Controls, Periodenmodell, Details, Achse und neue Exporte verwenden. Ein Filter-Leerzustand MUSS alte Inhalte entfernen und Export sperren, ohne die importweite Verfuegbarkeit des Tabs zu verlieren. Periodendetails MUESSEN die beitragenden Ursprungstrainings und Herkunft der jeweiligen Extremart erhalten.
- **FR-010**: Apple Health MUSS in den zum Abnahmezeitpunkt aktuellen Chrome-, Edge- und integrierten VS-Code-Browsern ueber HTTPS und lokal ueber HTTP auf localhost/127.0.0.1 funktionieren, soweit die konkret benoetigten Funktionen verfuegbar sind. Ein gueltiger Originalexport MUSS den echten Browser-Importpfad mit Fortschritt, Abschluss und korrekten Trainingsdaten durchlaufen; ein Test nur mit ersetzten Importbausteinen reicht nicht.
- **FR-011**: Apple-Importfehler MUESSEN fehlende Browserfunktion, nicht unterstuetzte Bereitstellung/Sicherheitsvoraussetzung, nicht geladene Importbibliothek und ungueltiges Archiv unterscheidbar benennen. Die gemeldete pauschale Modern-Browser-Meldung DARF in einer unterstuetzten Umgebung NICHT fehlende oder falsch verfuegbare Importbausteine verdecken. Wiederholung, geeignete Bereitstellung oder eine andere konkrete Abhilfe MUSS zur jeweiligen Ursache passen.
- **FR-012**: Ein fehlgeschlagener oder abgebrochener Apple-Import MUSS den bisherigen Dashboardstand erhalten und einen erneuten Versuch ermoeglichen. Fortschritt und die bestehenden Grenzen fuer grosse Exporte MUESSEN erhalten bleiben; ein Kompatibilitaetsfix DARF weder einen pauschalen unsicheren Ersatz fuer Trainingsidentitaeten noch ein unkontrolliertes Einlesen aller Gesundheitsdaten einfuehren.
- **FR-013**: Der HeartRate-Exportbutton MUSS dem bestehenden Dashboard-Exportmuster in Beschriftung, Symbolfolge, Groesse, Abstaenden und Anordnung entsprechen. Auf breiten Ansichten steht er in der gemeinsamen Kopf-/Bedienleiste an der fuer Export vorgesehenen Stelle; auf schmalen Ansichten folgt er deren bestehendem Umbruchverhalten, ohne Clipping, horizontalen Seitenueberlauf oder Diagrammueberlagerung. Bestehende Tab-IDs und ihre relative Reihenfolge bleiben unveraendert.
- **FR-014**: Die bestehende lokale Bildvorschau und der PNG-Download MUESSEN fuer die korrigierte HeartRate-Ansicht in allen vorhandenen Bildformaten funktionieren. Jeder neue Share-Aufruf MUSS die gewaehlte Gruppierung, Sportauswahl, angeforderten Zeitgrenzen, beiden Reihen und bpm-Einheit abbilden. Veroeffentlichte Snapshots behalten ihren angeforderten Stand bei Formatwechsel/Download; laufende veraltete Aufnahmen werden verworfen, und Filter-Leerzustand beziehungsweise Ersatzimport schliesst alte Vorschauen und Downloadziele.
- **FR-015**: Importweite Min-/Max-Verfuegbarkeit MUSS auf tatsaechlich nutzbaren direkten oder qualifiziert messreihenbasierten Angaben beruhen, nicht auf Quellenname oder Durchschnittspuls. Nur wenn alle geeigneten Trainings keine verwendbaren Extremwerte liefern, bleibt der Tab verborgen; andere mit Durchschnittspuls oder sonstigen Daten unterstuetzte Ansichten bleiben erhalten.
- **FR-016**: Bestehende Trainingsfelder, Durchschnittswerte, Identitaeten, Zaehlungen und Berechnungen anderer Visualisierungen MUESSEN unveraendert bleiben. Quelldateien und individuelle Gesundheitsdaten MUESSEN lokal bleiben. Die Pruefung privater Referenzexporte DARF keine Rohdateien, Einzelmessungen oder personenbezogenen Angaben in die Versionsverwaltung oder entfernte Diagnoseanfragen uebernehmen; lokale Verarbeitung ist keine Zusicherung einer insgesamt netzwerkfreien App.

### Key Entities *(include if feature involves data)*

- **Trainings-Extremwert**: Minimum oder Maximum eines bestehenden Trainings in bpm, optional und unabhaengig von der Gegenart, mit direkt berichteter oder beobachteter Herkunft.
- **Qualifizierte Herzfrequenzmessreihe**: Tatsaechliche valide Messungen einer vollstaendig eingelesenen Aufzeichnung, die eindeutig genau einem unterstuetzten Training und seinem Zeitraum zugeordnet sind.
- **Quellabdeckung**: Verfuegbarkeit der Felder und nutzbaren Werte je Metrik, getrennt von Quellenname und Durchschnittspuls; darf ohne individuelle Messwerte zusammengefasst werden.
- **Kalenderperiode**: Trainingstag, Montag-bis-Sonntag-Woche, Kalendermonat oder Kalenderjahr mit getrennten Extremwerten und ihren beitragenden Trainings.
- **Angefordertes Zeitfenster**: Durch die bestehende Auswahl bestimmte untere und obere inklusive Grenze; steuert Trainingsauswahl, angezeigte Achse und Exportkontext.
- **Importumgebung und Fehlergrund**: Konkrete Browser-/Bereitstellungsvoraussetzungen und ihre unterscheidbaren Fehler, nicht allein der Browsername.
- **Exportstand**: Lokale unveraenderliche Darstellung der ausgewaehlten Perioden, Messwerte, Zeitgrenzen und Filter zum Zeitpunkt des Share-Aufrufs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Referenzfaelle mit den lokal bestaetigten deutschen Strava-Headern, den bestehenden englischen Varianten sowie leeren/identischen/widerspruechlichen Duplikaten uebernehmen 100 % der nachweislich verwendbaren Quellwerte korrekt. Es entstehen null erfundene Extremwerte und null faelschliche Aussagen, vorhandener Durchschnittspuls sei fehlende Herzfrequenz. Originalexport, Importweg und Ergebnis werden lokal verglichen, ohne Einzelmesswerte zu veroeffentlichen.
- **SC-002**: TrainingPeaks-Referenzfaelle mit direktem Minimum/Maximum, fehlendem Minimum bei qualifizierter Messreihe, nur einer Extremart, fehlenden oder mehrdeutigen Messungen und Invalidkennungen liefern zu 100 % die erwarteten Werte und Herkunft. Direkte Angaben behalten in allen Konfliktfaellen den festgelegten Vorrang; nicht qualifizierte Daten erzeugen null Punkte.
- **SC-003**: Eine synthetische Historie mit mindestens zwoelf Trainings aus allen drei Sportarten ueber mehrere Kalenderwochen, mindestens drei Monate und zwei Kalenderjahre liefert in Weekly, Monthly und Yearly exakt die erwartete Periodenzahl und 100 % korrekte feldweise Extrema. Wochen-/Monats-/Jahresgrenzen und teilweise gefilterte Perioden sind explizite Prueffaelle; Durchschnittsbildung oder falsch zugeordnete Ursprungstrainings treten nullmal auf.
- **SC-004**: Fuer jede angebotene Sport-/Zeitfensterkombination stimmen gefilterte Trainings, Periodenwerte, angeforderte Achsengrenzen und Exportkontext zu 100 % ueberein. Mindestens ein Fall entfernt Trainings beim Verkuerzen, ein weiterer behaelt dieselben Trainings bei laengerem angeforderten Achsenfenster; beide Effekte sind im Ergebnis nachweisbar.
- **SC-005**: Derselbe gueltige synthetische Apple-Originalexport wird in drei dokumentierten aktuellen Browserumgebungen (Chrome, Edge, VS Code) jeweils ueber lokale HTTP- und unterstuetzte HTTPS-Bereitstellung erfolgreich importiert: sechs positive Durchlaeufe ohne pauschale Browserfehlermeldung. Getrennte negative Faelle fuer direkte Dateioeffnung, fehlende notwendige Funktion, blockierte Importbibliothek und ungueltiges Archiv liefern jeweils den richtigen Grund und erhalten in 100 % der Faelle den bisherigen Dashboardstand.
- **SC-006**: Bei 320, 375, 768 und 1440 CSS-Pixel Breite entsprechen Exportbeschriftung und Symbolfolge dem bestehenden Dashboardstandard. Kopfzeile, Filter und genau eine funktionsfaehige Exportaktion sind ohne horizontalen Seitenueberlauf, abgeschnittene Texte oder gegenseitige Ueberlagerung bedienbar; schmale und breite Ergebnisse werden visuell geprueft, nicht nur auf vorhandene Elemente getestet.
- **SC-007**: Fuer Weekly, Monthly und Yearly werden alle drei vorhandenen PNG-Bildformate mit einem echten lokalen Vorschau-/Downloaddurchlauf geprueft. In allen neun Kombinationen stimmen Punkt-/Periodenwerte, Gruppierung, bpm-Einheit und angeforderter Sport-/Zeitkontext mit dem angeforderten Stand ueberein. Laufende veraltete Aufnahmen, Filter-Leerzustand und Ersatzimport erzeugen null veraltete neue Bilder oder erreichbare alte Downloadziele.
- **SC-008**: Derselbe Eingabevergleich vor und nach dieser Korrektur zeigt null Aenderungen an bisherigen Trainingsfeldern, Durchschnittswerten, Identitaeten, Aktivitaetszahlen und Ergebnissen anderer Visualisierungen; nur die vorgesehenen HeartRate-Extremwerte, ihre Herkunft und die korrigierte Ansicht duerfen sich aendern. Es werden null individuelle Gesundheitswerte durch neue Diagnose-, Import- oder Exportpfade an entfernte Dienste uebertragen.

## Assumptions

- Dies ist eine neue Folgespezifikation zu Feature 080. Dieser Auftrag prueft den Iststand und spezifiziert Korrekturen; er implementiert sie nicht und schreibt weder Anwendungscode noch die veraenderte Aufgabenliste des Vorgaengers um.
- Die Punkte "weekly monthly and yearly" und "timeframe doesn't change the visual" werden als Anforderung an echte Kalenderperiodenaggregation und sichtbare angeforderte Zeitfenster verstanden, nicht bloss als Umbenennung der bisherigen Periodenoptionen. Die Sportauswahl bleibt eine Einzelauswahl.
- Diese Folgeanforderung ersetzt gezielt die bisherigen Feature-080-Grenzen fuer eine ausschliessliche Einzeltrainingsdarstellung sowie das generelle Verbot neuer Messreihenableitungen: Kalenderaggregation und qualifizierte TrainingPeaks-Messreihenextrema sind nun im Umfang. Erfindungen aus Durchschnittspuls, medizinische Schaetzungen, Glaettung, Herzfrequenzzonen und neue Gesundheitsansichten bleiben ausgeschlossen.
- Die lokale Quellenpruefung hat doppelte Strava-Spalten `Max. Herzfrequenz` und eine Durchschnittsspalte bestaetigt. Wo beide Maximumsspalten befuellt sind, stimmen sie in der untersuchten Referenz ueberein. Der bisherige Headervertrag erkennt die abgekuerzte Maximumsbezeichnung nicht. Ein Minimumsheader wurde in dieser Referenz nicht beobachtet; daraus folgt keine Aussage ueber jeden Strava-Export.
- Die lokale TrainingPeaks-Stichprobe bestaetigt Aufzeichnungen ohne direktes Sessionminimum trotz vorhandener zeitgestempelter Herzfrequenzmessungen. Das ist keine Garantie fuer alle Exporte und noch kein Beleg fuer die vollstaendige fachliche Eignung jeder Messreihe. Zusammenfassungsabdeckung, Einlesevollstaendigkeit und eindeutige Trainingszuordnung sind vor einem konkreten Fallback getrennt nachzuweisen.
- Die aktuelle HeartRate-Achse orientiert sich an verbleibenden Punkten; Periodenoptionen gruppieren die Punkte bislang nicht. Beides erklaert moegliche unveraenderte Ansichten, beweist aber nicht fuer jeden konkreten Nutzerfall denselben Fehler.
- Der genaue Ausloeser der gemeldeten Apple-Fehlermeldung in den drei Nutzerumgebungen ist noch nicht reproduziert. Ein unabhaengiger realer Edge-Lauf ueber `http://127.0.0.1:8000` hat einen synthetischen Originalexport erfolgreich mit einem erwarteten Training importiert. Das ersetzt keine Pruefung der gemeldeten Umgebungen oder realer Problemdateien. Mehrere verschiedene Voraussetzungen verwenden derzeit denselben Fehlertext. Browsername, tatsaechliche Bereitstellungsadresse und konkreter Fehlergrund muessen vor der Korrektur getrennt nachgewiesen werden; ein moderner Browser allein beweist weder Kompatibilitaet noch Inkompatibilitaet.
- Direktes Oeffnen ueber eine lokale Datei und unsichere Bereitstellungen ausserhalb der unterstuetzten lokalen HTTP-Umgebung erhalten eine konkrete Anleitung statt einer Erfolgsgarantie. Sicherheitsanforderungen werden fuer den Import nicht pauschal abgeschaltet.
- Vorhandene Referenzexporte duerfen nur lokal auf Struktur, Abdeckung und Ergebnis geprueft werden. Versionierte Beispiele bleiben synthetisch; reale Rohdaten, Trainingswerte, Identifikatoren und Dateinamen werden nicht in diese Spezifikation uebernommen.
- Das Exportlayout folgt dem aktuell etablierten Dashboardstandard. Es ist kein allgemeines Redesign, keine neue Share-Schnittstelle und keine Erweiterung um Video- oder andere Dateiformate vorgesehen.