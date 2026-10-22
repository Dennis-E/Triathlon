# Feature Specification: Consistent and Scalable Local Processing

**Feature Branch**: `TriAnalytica-dev-2` (existing branch; no branch created)
**Created**: 2026-10-21
**Status**: Draft; ready for planning, load assumptions unverified
**Input**: Nutzer sollen groessere Trainingshistorien korrekt, nachvollziehbar und fluessig lokal analysieren. Gemeinsame Datenregeln, kombinierbare Filter und getrennte Nachweise fuer 10x Aktivitaeten, 10x Detaildaten und 10x Visualisierungsumfang sind erforderlich.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Vertrauenswuerdige Ergebnisse erhalten (Priority: P1)

Nutzer importieren unterstuetzte Trainingshistorien und erhalten konsistente Kennzahlen sowie verstaendliche Angaben zur Datenqualitaet.

**Why this priority**: Schnelle, aber falsche Ergebnisse sind nicht brauchbar.
**Independent Test**: Kleine Referenzexporte mit unabhaengig festgelegten Ergebnissen importieren und die betroffenen Ansichten vergleichen.

**Acceptance Scenarios**:

1. **Given** einzelne und doppelte Distance-/Distanz-Spalten, **When** importiert wird, **Then** werden eindeutig bekannte Einheiten umgerechnet, mehrdeutige Werte mit Grund ausgeschlossen und doppelte Spalten weiterhin zuerst als Kilometer, danach als Meter interpretiert.
2. **Given** echte Nullwerte, fehlende, negative und ungueltige Werte, **When** aggregiert wird, **Then** bleiben diese Zustaende unterscheidbar und ungueltige Werte verfaelschen weder Summen noch abgeleitete Kennzahlen.
3. **Given** bekannte und unbekannte Sportarten, **When** All oder ein Sport gewaehlt wird, **Then** umfasst All genau die Vereinigung der unterstuetzten Sportarten, ohne unbekannte Sportarten umzuklassifizieren.
4. **Given** Duplikate und widerspruechliche Identitaeten, **When** importiert wird, **Then** entstehen keine Doppelzaehlungen und Konflikte werden nachvollziehbar ausgeschlossen.
5. **Given** Aktivitaeten an Tages-, Jahres- und Sommerzeitgrenzen, **When** derselbe Zeitraum ausgewaehlt wird, **Then** liefern alle Ansichten unabhaengig von der Geraetezeitzone dieselbe Aktivitaetsmenge.
6. **Given** defekte Strava-Einzelaufzeichnungen oder fehlende Details, **When** importiert wird, **Then** bleiben gueltige Aktivitaeten erhalten und Detailabdeckungen werden nicht als vollstaendig ausgegeben.
7. **Given** einen aktiven Datensatz und fehlerhafte TrainingPeaks-FIT-/GZIP-Eingaben, **When** ein Mehrarchivimport versucht wird, **Then** wird der gesamte neue Import verworfen und der aktive Datensatz unveraendert erhalten.

### User Story 2 - Ansichten konsistent kombinieren (Priority: P2)

Nutzer kombinieren Filter und wechseln Ansichten, ohne unterschiedliche Datenregeln oder veraltete Ergebnisse zu erhalten.

**Why this priority**: Ansichten sollen vergleichbar und neue Visualisierungen anschliessbar sein.
**Independent Test**: Eine bekannte Historie mit Filterkombinationen in mehreren bestehenden Ansichten untersuchen und danach durch eine disjunkte Historie ersetzen.

**Acceptance Scenarios**:

1. **Given** Zeitraum-, Sport-, Equipment- und Verfuegbarkeitsbedingungen, **When** diese kombiniert werden, **Then** entspricht die Auswahl der vereinbarten Schnittmenge und identische Kennzahlen verwenden dieselben gueltigen Beitraege.
2. **Given** globale und ansichtsspezifische Filter, **When** die Ansicht gewechselt wird, **Then** bleiben globale Bedingungen wirksam und lokale Bedingungen beeinflussen keine andere Ansicht.
3. **Given** einen erfolgreichen Neuimport, **When** zuvor verwendete Ansichten geoeffnet werden, **Then** stammen Ergebnisse, Filterreferenzen und Verfuegbarkeiten ausschliesslich aus dem neuen Datensatz; verspaetete alte Ergebnisse bleiben unsichtbar.
4. **Given** identische wiederholte Abfragen, **When** Ergebnisse angefordert werden, **Then** werden wiederverwendbare Berechnungen nicht erneut vollstaendig ausgefuehrt.

### User Story 3 - Grosse Historien fluessig analysieren (Priority: P3)

Nutzer sehen bei langen Importen Fortschritt und koennen weiterhin Eingaben ausfuehren.

**Why this priority**: Wachsende Historien duerfen die Anwendung nicht praktisch unbedienbar machen.
**Independent Test**: Vollstaendige Browserablaeufe mit den definierten Lastprofilen auf beiden Referenzgeraeten messen.

**Acceptance Scenarios**:

1. **Given** einen 10x-Import, **When** Entpacken und Auswertung laufen, **Then** bleiben Fortschritt und Eingabereaktionen innerhalb der Abnahmegrenzen sichtbar.
2. **Given** wiederholte Filter-, Tabwechsel und Neuimporte, **When** Ergebnisse erneut angefordert werden, **Then** bleiben Speicher und Latenzen innerhalb der festgelegten Grenzen.
3. **Given** ungeoeffnete Ansichten, **When** deren Verfuegbarkeit geprueft wird, **Then** entstehen keine vollstaendigen Ansichtsmodelle oder Charts.
4. **Given** Referenzrouten, **When** die Verarbeitung skaliert wird, **Then** bleiben Routenunterbrechungen, Sportzuordnung, Besuchshaeufigkeiten und raeumliche Aussagen nachvollziehbar erhalten.

### Edge Cases

- Leere oder ausschliesslich nicht unterstuetzte Historien; Filter ohne Treffer.
- Unbekannte Einheiten, widerspruechliche doppelte Distanzwerte, Nullzeit bei positiver Distanz.
- Fehlende Datumsangaben, fehlende Zeitzonen und mehrdeutige lokale Sommerzeitangaben.
- Ueberlappende Exportzeitraeume, widerspruechliche Duplikate und mehrdeutige Aufzeichnungszuordnung.
- Defekte Archive, teilweise lesbare Strava-Details, vollstaendig abgelehnter TrainingPeaks-Import.
- GPS ohne Zeitstempel, Einzelpunkte, Luecken und gemeinsam verwendete FIT-Aufzeichnungen.
- Verspaetete Arbeitsergebnisse eines vorherigen Imports und unzureichender Geraetespeicher.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Alle unterstuetzten Importquellen MUESSEN denselben versionierten fachlichen Datenvertrag fuer Feldbedeutungen, Einheiten, Wertzustaende, Herkunft, Zeitbezug, Identitaet und Detailabdeckung erfuellen. Nicht unterstuetzte Vertragsversionen duerfen nicht stillschweigend verarbeitet werden.
- **FR-002**: Produktiver Import und Tests MUESSEN dieselbe verbindliche Normalisierung verwenden. Unabhaengige Sollwerte duerfen nicht durch die zu pruefende Normalisierung erzeugt werden.
- **FR-003**: Einzelne Distance-/Distanz-Spalten MUESSEN anhand des erkannten, dokumentierten Quellformats interpretiert werden, niemals allein anhand des Namens oder der Groessenordnung. Unklare Einheiten machen den Wert unverwendbar. Bei doppelten Spalten gilt unveraendert: erste Kilometer, zweite Meter. Abweichungen ueber die dokumentierte Quellrundung hinaus werden als Konflikt ausgewiesen und nicht stillschweigend aufgeloest.
- **FR-004**: Gueltige Nullwerte, fehlende und ungueltige Werte MUESSEN getrennt bleiben. Negative oder nicht endliche Distanzen und Dauern sind ungueltig. Fehlende Werte werden nicht zu null; Division durch null erzeugt keine Kennzahl. Summen, Mittelwerte und Quotienten MUESSEN ihre gueltigen Beitraege und Bezugsgroessen festlegen; Bewegungs- und Gesamtdauer bleiben unterschiedliche Groessen.
- **FR-005**: Nur eindeutig unterstuetzte Sportarten werden Run, Bike oder Swim zugeordnet. All umfasst genau deren Vereinigung einschliesslich teilweise fehlender Messwerte. Unbekannte Sportarten bleiben ausgeschlossen und werden berichtet. Kennzahlbezogene Ausschluesse veraendern nicht stillschweigend die Gesamtaktivitaetszahl.
- **FR-006**: Zeitraumfilter beziehen sich auf das lokale Startdatum der Aktivitaet und schliessen beide gewaehlten Kalendertage ein. Explizite Quellzeitzonen gelten vorrangig; dokumentierte Quellkonventionen duerfen verwendet werden. Andernfalls ist eine ausdruecklich bestaetigte Importzeitzone erforderlich. Geraetezeitzonen duerfen Ergebnisse nicht veraendern; unaufloesbare Datumsangaben werden begruendet ausgeschlossen.
- **FR-007**: Quellkennung und stabile Aktivitaetskennung bestimmen die Identitaet. Ohne Kennung duerfen nur vollstaendig uebereinstimmende normalisierte Zusammenfassungen derselben Quelle automatisch zusammengefuehrt werden. Ergaenzende widerspruchsfreie Details werden einmal zugeordnet; widerspruechliche Datensaetze derselben Identitaet werden aus Auswertungen ausgeschlossen und berichtet. Quellenuebergreifende Aehnlichkeit allein begruendet keine Zusammenfuehrung.
- **FR-008**: Der Qualitaetsbericht MUSS eingelesene, uebernommene, uebersprungene und doppelte Datensaetze rechnerisch nachvollziehbar ausweisen. Teilweise verfuegbare uebernommene Aktivitaeten sind eine zusaetzliche Kennzeichnung. Gruende, betroffene Felder sowie Zuordnung und Abdeckung von GPS-, FIT- und Leistungsdaten MUESSEN erkennbar sein. Unbekannte Abdeckung darf nicht als vollstaendig erscheinen.
- **FR-009**: Strava MUSS gueltige Aufzeichnungen trotz defekter Einzelaufzeichnungen erhalten. TrainingPeaks MUSS bei FIT-/GZIP-Parsefehlern weiterhin den gesamten Mehrarchivimport verwerfen und den aktiven Datensatz unveraendert lassen. Nicht eindeutig zuordenbare Details duerfen keiner beliebigen Aktivitaet zugeschlagen werden.
- **FR-010**: Alle Ansichten MUESSEN dieselbe fachliche Datenbasis und Filterdefinitionen verwenden. Unterschiedliche Filterdimensionen werden durch UND, mehrere gewaehlte Werte innerhalb einer Dimension durch ODER verbunden. Fehlendes Equipment oder fehlende Details erfuellen keine positive Auswahl dafuer.
- **FR-011**: Zeitraum und Sportart MUESSEN kombinierbar sein; dieselben Auswahlregeln MUESSEN um Equipment und Datenverfuegbarkeit erweiterbar sein. Der globale oder lokale Geltungsbereich vorhandener Filter MUSS erkennbar sein. Unabhaengige UI-Erweiterungen sind nicht erforderlich.
- **FR-012**: Ein erfolgreicher Neuimport MUSS Daten, Filterreferenzen, Verfuegbarkeiten und Zwischenergebnisse gemeinsam ersetzen. Datensatzabhaengige Filter werden zurueckgesetzt; verspaetete Ergebnisse alter Importe duerfen nicht sichtbar werden. Ein fehlgeschlagener Import veraendert den aktiven Zustand nicht.
- **FR-013**: Identische Auswahl- und Berechnungsanfragen innerhalb desselben Datensatzes MUESSEN wiederverwendbare Ergebnisse nutzen. Zusaetzliche Ansichten duerfen weder eigene Normalisierungen noch zusaetzliche vollstaendige Historienkopien benoetigen. Verfuegbarkeitspruefungen und ungeoeffnete Ansichten duerfen keine vollstaendigen Ansichtsberechnungen ausloesen.
- **FR-014**: Wiederverwendbare Historien- und Routenauswertungen MUESSEN geteilt werden. Detaildaten und Zwischenergebnisse unterliegen nachweisbaren Speichergrenzen. Vorgaenge ueber einer Sekunde zeigen Phase und messbaren Fortschritt, bei unbekannter Gesamtmenge einen ausdruecklich unbestimmten Status; Aktualisierung mindestens einmal pro Sekunde.
- **FR-015**: Bestehende fachliche Routengenauigkeit MUSS erhalten bleiben. Zusaetzliche Vereinfachungen duerfen Sportzuordnung, Unterbrechungen, Besuchshaeufigkeiten oder raeumliche Aussagen nicht unbemerkt veraendern. Abweichungen sind an unabhaengig festgelegten Referenzrouten nachzuweisen.
- **FR-016**: Bestehende Importformate, Visualisierungen und lokale Share-/Export-Ablaeufe MUESSEN erhalten bleiben. Persoenliche Trainingsdaten bleiben lokal und werden weder hochgeladen noch persistent gespeichert. Die getrennte Analyse-Zaehler-API und ihre Schutzregeln bleiben unveraendert. Lokale Verarbeitung bedeutet keine allgemeine Netzwerkfreiheit.

### Key Entities

- **Importdatensatz**: Abgegrenzte erfolgreiche Datenuebernahme mit Vertragsversion und Herkunft.
- **Aktivitaet**: Identitaet, Sport, Zeitbezug und qualifizierte Messwerte.
- **Detailaufzeichnung**: Zugeordnete Samples oder Route mit Abdeckungsstatus.
- **Filterauswahl**: Bedingungen und globaler beziehungsweise lokaler Geltungsbereich.
- **Qualitaetsbericht**: Mengenbilanz, Einschraenkungen und Gruende.
- **Lastprofil**: Reproduzierbare Eingaben, Skalierungsachse und unabhaengige Sollwerte.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Alle Akzeptanzfaelle bestehen. Aktivitaetsmengen und Zaehlwerte stimmen exakt mit unabhaengigen Sollwerten ueberein. Messwerte stimmen vor Anzeigerundung innerhalb dokumentierter Quellpraezision ueberein; gleiche Kennzahlen gleicher Mengen werden in allen Ansichten gleich dargestellt.
- **SC-002**: Reproduzierbare 1x-/5x-/10x-Profile enthalten 5.000/25.000/50.000 Zusammenfassungen ueber 2016-2025. Separate Detailprofile enthalten 100/500/1.000 zweistuendige FIT-Aktivitaeten mit je 7.200 sekuendlichen Samples und GPS-Punkten, insgesamt 0,72/3,6/7,2 Millionen. Feste Startwerte erzeugen 70 % wiederholte Korridore, 20 % raeumlich getrennte Regionen und 10 % neue Routen. Sport-, Fehler- und Abdeckungsverteilungen sowie Sollwerte werden versioniert.
- **SC-003**: Zusammenfassungs- und Detailwachstum werden isoliert sowie gemeinsam bei 10x geprueft. Erweiterbarkeit auf zehnmal so viele Ansichten wird separat durch eine repraesentative Pruefanordnung nachgewiesen: keine zusaetzlichen vollstaendigen Historienkopien und keine vollstaendigen Berechnungen ungeoeffneter Ansichten. Neue Produktvisualisierungen sind nicht erforderlich.
- **SC-004**: Vorgeschlagene verbindliche Referenzen sind ein Desktop mit Intel Core i5-12400 und 16 GB RAM sowie ein schwaecheres Mobilgeraet Google Pixel 4a mit 6 GB RAM, jeweils mit festgehaltener Betriebssystem- und Browserversion. Fuer alle Profile gelten p95 <= 200 ms fuer Zusammenfassungsfilter, p95 <= 100 ms fuer sichtbare Eingabereaktionen und keine einzelne UI-Blockade > 100 ms. Einfache Tabs liefern Ergebnisse p95 <= 500/1.000 ms, erstmals berechnete Detailansichten <= 5/10 s, jeweils Desktop/Mobilgeraet.
- **SC-005**: Vorgeschlagene Obergrenzen fuer den kombinierten 10x-Import sind 120/300 s und maximal 1,5 GiB/512 MiB zusaetzlicher, dem Tab zurechenbarer Spitzenspeicher, jeweils Desktop/Mobilgeraet. Nach 20 Neuimporten und 200 Filter-/Tabwechseln liegt der beruhigte Speicher hoechstens 10 % beziehungsweise 32 MiB ueber dem aufgewaermten Ausgangswert, massgeblich ist der groessere Betrag.
- **SC-006**: Der Nachweis umfasst den echten Browserablauf vom Auswaehlen vorbereiteter ZIP-Dateien ueber Dekompression und reale Parser bis zum benutzbaren Dashboard einschliesslich Qualitaetsbericht. Mindestens fuenf Importlaeufe und 100 dokumentierte Filter-/Tabaktionen je Geraete-Profil-Kombination; Erst- und Wiederholungsaufrufe getrennt ausweisen. Isolierte Benchmarks, Parser-Mocks oder Desktop-Drosselung allein ersetzen keinen Mobil- oder 10x-Nachweis.
- **SC-007**: Jede ausgeschlossene oder eingeschraenkte Referenzaktivitaet hat einen verstaendlichen Grund; alle Qualitaetsmengen sind abstimmbar. Bestehende Import-, Ansichts-, Share-/Export- und Datenschutz-Akzeptanzfaelle bestehen weiterhin.

## Assumptions

- Lastprofile, Referenzgeraete und Leistungsgrenzen sind ungepruefte Abnahmevorschlaege, keine Aussagen ueber aktuelle Leistungsfaehigkeit oder reale Nutzerverteilungen. Aenderungen benoetigen eine ausdrueckliche Spezifikationsaenderung; Nichterreichen darf nicht durch kleinere Profile verdeckt werden.
- Einheitentabellen, Sportzuordnungen, Quellzeitkonventionen und Kennzahlendefinitionen werden anhand belegter unterstuetzter Formate vervollstaendigt; fehlende Belege berechtigen nicht zum Raten.
- Synthetische Testdaten enthalten keine persoenlichen Trainingsdaten. Fachliche Sollwerte werden unabhaengig von der produktiven Auswertung festgelegt.
- Nicht-Ziele: Workout-Uploads, neue Server-Datenbank, persistente Speicherung persoenlicher Trainingsdaten, Frameworkwechsel, vollstaendiger Neubau, neue Produktvisualisierungen und unabhaengige UI-Erweiterungen.
- Speicherorganisation, Indizes, Caches, Aggregationsverfahren und Ausfuehrungsmodelle bleiben Entscheidungen der Planung.