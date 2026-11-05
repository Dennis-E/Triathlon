# Feature Specification: Herzfrequenz-Min-/Max-Entwicklung

**Feature Branch**: `not-created`

**Created**: 2026-11-04

**Status**: Draft

**Input**: User description: "Im Trainingsdashboard verfuegbare minimale und maximale Herzfrequenzwerte je Training chronologisch als getrennte Reihen darstellen, bestehende Sport- und Zeitfilter beruecksichtigen, datenabhaengige Verfuegbarkeit und lokale Share-/Export-Vorschau mit Download bieten. Importquellen ohne verlaessliche Extremwerte behandeln, messbare Erfolgskriterien festlegen und bestehende Trainingsdaten sowie andere Berechnungen unveraendert lassen. Nur spezifizieren, noch nicht implementieren."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tatsaechliche Extremwerte im Verlauf vergleichen (Priority: P1)

Als trainierende Person sehe ich die verfuegbaren minimalen und maximalen Herzfrequenzen meiner einzelnen Trainings entlang einer Zeitachse. Ich kann erkennen, welcher Wert zu welchem Training gehoert, ohne fehlende Messungen fuer echte Werte zu halten.

**Why this priority**: Der Nutzen beruht auf einer korrekten Zuordnung realer Extremwerte; Durchschnittspulse oder erfundene Ergaenzungen wuerden den Verlauf verfaelschen.

**Independent Test**: Eine synthetische, unsortierte Trainingshistorie mit vollstaendigen und einseitigen Extremwerten anzeigen und jeden dargestellten Punkt mit seinem Ursprungstraining vergleichen.

**Acceptance Scenarios**:

1. **Given** mehrere unsortierte Trainings mit datierten Min-/Max-Werten, **When** die Ansicht geoeffnet wird, **Then** erscheinen zwei getrennt benannte Reihen fuer Minimum und Maximum auf einer chronologischen Datumsachse mit Herzfrequenz in bpm.
2. **Given** ein Training mit beiden Extremwerten, **When** dessen Punkte ausgewaehlt werden, **Then** sind Minimum beziehungsweise Maximum, Wert, Datum und dasselbe Ursprungstraining eindeutig erkennbar.
3. **Given** ein Training mit ausschliesslich Maximum und eines mit ausschliesslich Minimum, **When** die Ansicht erscheint, **Then** wird jeder vorhandene valide Wert in der richtigen Reihe dargestellt und fuer den fehlenden Gegenwert kein Punkt erzeugt.
4. **Given** mehrere Trainings am selben Tag oder zur selben Startzeit, **When** ihre Punkte betrachtet werden, **Then** bleiben die Trainings getrennt und einzeln identifizierbar; es entsteht kein Tagesmittel oder Tagesextremwert.

---

### User Story 2 - Nur nutzbare Daten mit bestehenden Filtern sehen (Priority: P1)

Als trainierende Person bekomme ich diese Ansicht nur angeboten, wenn meine importierte Historie mindestens einen passenden Extremwert enthaelt. Innerhalb der Ansicht begrenzen die gewohnten Sport- und Zeitfilter die sichtbaren Trainings.

**Why this priority**: Ein leerer Tab nach einem Import ohne Extremwerte suggeriert eine Funktion, die die Daten nicht unterstuetzen. Filter duerfen dagegen die Navigation nicht unvorhersehbar veraendern.

**Independent Test**: Historien ohne Extremwerte, mit einem einzigen Extremwert und mit Extremwerten verschiedener Sportarten importieren; danach Sport und Zeitraum wechseln und den Import ersetzen.

**Acceptance Scenarios**:

1. **Given** ein Import mit ausschliesslich Durchschnittspuls oder ohne verlaessliche Extremwerte, **When** das Dashboard erscheint, **Then** gibt es fuer diese Ansicht weder Navigationseintrag noch leeres Diagramm oder aktives Exportziel.
2. **Given** mindestens ein unterstuetztes, datiertes Training mit einem verlaesslichen Minimum oder Maximum, **When** die Importverfuegbarkeit bestimmt wird, **Then** ist die Ansicht unabhaengig vom Namen der Importquelle verfuegbar und kann auch einen einzelnen Punkt sinnvoll zeigen.
3. **Given** Trainings fuer Laufen, Radfahren und Schwimmen ueber mehrere Zeitraeume, **When** Sport- oder Zeitfilter geaendert werden, **Then** zeigt die Ansicht ausschliesslich passende Trainings gemaess denselben Filtergrenzen wie das bestehende Dashboard.
4. **Given** eine grundsaetzlich verfuegbare Ansicht, **When** die aktuellen Filter keinen passenden Extremwert uebrig lassen, **Then** bleibt der Tab erreichbar, zeigt einen eindeutigen Filter-Leerzustand ohne alte Punkte und bietet keinen Export eines leeren oder veralteten Diagramms an.
5. **Given** die neue Ansicht ist aktiv, **When** ein erfolgreicher Ersatzimport keine passenden Extremwerte enthaelt, **Then** verschwindet sie aus der Navigation, eine verfuegbare Ansicht oder der bestehende Dashboard-Leerzustand wird aktiv und alte Exportziele werden unzugaenglich.

---

### User Story 3 - Verlauf auf verschiedenen Bildschirmen lesen und lokal teilen (Priority: P2)

Als trainierende Person kann ich den Verlauf auf schmalen und breiten Bildschirmen lesen und die gefilterte Ansicht ueber die vorhandene lokale Bildvorschau herunterladen.

**Why this priority**: Die neue Ansicht soll dieselben Betrachtungs- und Exportmoeglichkeiten bieten wie die bestehenden Visualisierungen.

**Independent Test**: Eine gefilterte Ansicht in schmaler und breiter Darstellung oeffnen, Werte per Zeiger beziehungsweise Beruehrung pruefen, die Share-/Export-Aktion ausloesen und Vorschau sowie heruntergeladenes Bild mit der Ansicht vergleichen.

**Acceptance Scenarios**:

1. **Given** eine schmale oder breite Bildschirmflaeche, **When** die Ansicht angezeigt oder die Flaeche veraendert wird, **Then** passen Diagramm, Legende, Filter und Exportaktion in den verfuegbaren Platz; Werte und Trainingszuordnung sind ohne Hover-Pflicht erreichbar.
2. **Given** sichtbare gefilterte Extremwerte, **When** die vorhandene Share-/Export-Aktion ausgeloest wird, **Then** zeigt die lokale Vorschau den aktuellen Zeitraum und Sportkontext sowie die beiden eindeutig bezeichneten Reihen mit Datum und bpm; der Download enthaelt denselben Stand ohne abgeschnittene Beschriftungen.
3. **Given** eine geoeffnete Vorschau, **When** sie geschlossen wird, **Then** bleiben Ansicht und Filter unveraendert; ein spaeterer Export nach einem Filterwechsel verwendet den neuen Stand.

### Edge Cases

- Ein Training besitzt nur Minimum, nur Maximum oder nur Durchschnittspuls. Die beiden Extremfelder werden unabhaengig bewertet; Durchschnittspuls qualifiziert keinen Punkt.
- Leere Angaben, nichtnumerische Werte, nicht endliche Zahlen, Null, negative Werte und unbekannte Einheiten gelten nicht als verfuegbare Extremwerte. Ein ungueltiger Gegenwert entwertet einen unabhaengig gueltigen Wert nicht.
- Ein explizites Minimum groesser als das explizite Maximum ist ein widerspruechliches Paar: Beide Werte sind fuer diese Ansicht unverlaesslich und bleiben ausgeschlossen, statt vertauscht oder korrigiert zu werden. Die Quelldaten bleiben erhalten.
- Gleiche Min-/Max-Werte sind erlaubt. Beide Reihen muessen auch bei ueberlagerten Punkten identifizierbar bleiben.
- Ein einzelner Punkt oder eine nur einseitig befuellte Historie macht die Ansicht verfuegbar. Fehlende Gegenreihen sind als ohne Werte erkennbar, nicht als Null-Linie.
- Ohne gueltiges Trainingsdatum oder bei einer nicht unterstuetzten Sportart qualifiziert ein Extremwert nicht fuer diese Ansicht; andere Ansichten und deren Datenauswahl bleiben unberuehrt.
- Mehrere Trainings am selben Tag, identische Startzeiten, Zeitzonen und Trainings ueber Mitternacht duerfen die bestehende Zuordnung zum Trainingstag nicht veraendern.
- Lange Zeitraeume und dichte Punktfolgen duerfen die Zuordnung einzelner Trainings nicht durch Tagesaggregation, Glaettung oder rein optische erfundene Zwischenwerte ersetzen.
- Nach einem Import- oder Filterwechsel duerfen weder alte Punkte noch ein altes exportierbares Bild als aktuelles Ergebnis erscheinen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Das Dashboard MUSS eine gesonderte Visualisierungsansicht ausschliesslich fuer die zeitliche Entwicklung der minimalen und maximalen Herzfrequenz je Training anbieten.
- **FR-002**: Die Ansicht MUSS Minimum und Maximum als getrennte, eindeutig benannte und nicht allein durch Farbe unterscheidbare Reihen mit Trainingsdatum auf der Zeitachse und Herzfrequenz in bpm darstellen. Einzelne Werte MUESSEN auch ohne Verbindungslinie sichtbar sein.
- **FR-003**: Jeder Punkt MUSS genau einem Ursprungstraining, dessen bestehendem Trainingsdatum und der korrekten Extremwertart zugeordnet sein. Die Punktdetails MUESSEN Wert, Minimum/Maximum, Datum, Sport und eine eindeutige Trainingszuordnung anzeigen. Vorhandener Name und Startzeit sollen genutzt werden; bei fehlenden Angaben MUSS eine eindeutige Ersatzkennung ohne Aenderung des Trainingsdatensatzes die Unterscheidung erlauben.
- **FR-004**: Trainings MUESSEN aufsteigend nach ihrem bestehenden Datum und, soweit vorhanden, ihrer Startzeit geordnet werden. Gleichzeitige Trainings MUESSEN deterministisch getrennt bleiben. Tages-, Wochen- oder Monatsaggregation ist ausgeschlossen.
- **FR-005**: Minimum und Maximum MUESSEN unabhaengig auf Verfuegbarkeit und Validitaet geprueft werden. Ein fehlender oder einzeln ungueltiger Wert DARF einen vorhandenen verlaesslichen Gegenwert NICHT verwerfen. Ein widerspruechliches Paar gemaess Edge Cases DARF NICHT als verlaesslich dargestellt werden.
- **FR-006**: Die Ansicht DARF fehlende Extremwerte NICHT aus Durchschnittspuls, Nullwerten, anderen Trainings, Altersformeln, Interpolation oder sonstigen Schaetzungen ergaenzen. Sie DARF fehlende Werte NICHT durch eine durchgehende Verbindung ueber betroffene Trainings hinweg als bekannt suggerieren.
- **FR-007**: Als passender Wert MUSS eine endliche, positive Herzfrequenz mit bekannter bpm-Semantik gelten, die verlaesslich als Minimum oder Maximum genau eines unterstuetzten, gueltig datierten Trainings ueberliefert ist. Unklare Bedeutung, Einheit oder Trainingszuordnung MUSS zur Nichtverwendung fuehren, ohne das Training selbst aus anderen Auswertungen zu entfernen.
- **FR-008**: Die Ansicht MUSS genau dann fuer einen abgeschlossenen Import verfuegbar sein, wenn dessen gesamte aktuell geladene Historie mindestens einen passenden Min- oder Max-Wert enthaelt. Spaltennamen, Durchschnittswerte und Quellenbezeichnungen allein reichen NICHT. Ohne passenden Wert DARF weder ein Tab noch ein aktives Anzeige- oder Exportziel bestehen.
- **FR-009**: Verfuegbarkeit MUSS nach jedem erfolgreichen Ersatzimport neu bestimmt werden. Ausgeblendete Ansichten MUESSEN auch aus Tastatur- und Pfeilnavigation ausgeschlossen sein. Bestehende Tab-Identitaeten und deren relative Reihenfolge MUESSEN erhalten bleiben; ein aktiver ungueltig gewordener Tab MUSS auf einen verfuegbaren Zustand wechseln.
- **FR-010**: Die Ansicht MUSS die bestehenden globalen Sport- und Zeitfilter einschliesslich deren Datumsgrenzen und bestehender Auswahlsemantik verwenden. Der Sportfilter MUSS unveraendert eine Einzelauswahl bleiben. Sie DARF keine unabhaengigen, widersprechenden Filter einfuehren. Ein Filter-Leerzustand MUSS von fehlender Importverfuegbarkeit unterschieden werden und DARF keine alten Daten oder leeren Exporte anbieten.
- **FR-011**: Die Ansicht MUSS den verfuegbaren Platz auf schmalen und breiten Bildschirmen nutzen, ohne horizontalen Seitenueberlauf, ueberlappende Bedienelemente oder abgeschnittene wesentliche Beschriftungen. Legende, Trainingsdetails und Exportaktion MUESSEN per Zeiger und auf Touch-Geraeten nutzbar bleiben.
- **FR-012**: Die Ansicht MUSS die vorhandene lokale Share-/Export-Aktion mit Bildvorschau, Schliessen und Download bereitstellen. Jeder neue Share-Aufruf MUSS die aktuelle Visualisierung, Reihenkennzeichnung, Einheiten und den gueltigen Sport-/Zeitkontext aufnehmen. Vorschau und Download MUESSEN denselben angeforderten Datenstand abbilden. Eine bereits geoeffnete Vorschau DARF nach einem Filterwechsel ihren eindeutig zugeordneten angeforderten Datenstand behalten; Formatwechsel und Download MUESSEN dann denselben eingefrorenen Snapshot verwenden, nicht die inzwischen geaenderte Ansicht. Noch laufende Aufnahmen MUESSEN bei Filter- oder Importwechsel vor Veroeffentlichung einer veralteten Vorschau verworfen werden. Bei Filter-Leerzustand oder erfolgreichem Ersatzimport MUESSEN eine vorhandene Vorschau und ihr Downloadziel geschlossen beziehungsweise ungueltig gemacht werden.
- **FR-013**: Das Feature DARF bestehende Trainingswerte, Identitaeten, Datums-/Sportzuordnungen, Importzaehlungen, Filterberechnungen und Berechnungen anderer Visualisierungen NICHT veraendern. Eine spaetere zusaetzliche Uebernahme expliziter Quell-Extremwerte ist nur als optionale Ergaenzung erlaubt; bestehende Felder duerfen weder ersetzt noch umgedeutet werden.
- **FR-014**: Die unten festgelegten Importregeln MUESSEN fuer alle unterstuetzten Quellen gelten. Fehlende Extremwerte DUERFEN weder einen ansonsten erfolgreichen Import scheitern lassen noch andere datenmaessig unterstuetzte Ansichten ausblenden.
- **FR-015**: Importierte Gesundheitsdaten sowie die Bildvorschau und der Download MUESSEN fuer diese Funktion lokal verarbeitet werden. Keine zusaetzliche Uebertragung individueller Herzfrequenzwerte ist erlaubt; dies ist keine Aussage, dass die gesamte Anwendung netzwerkfrei arbeitet.

### Importquellen und Verlaesslichkeit

Der derzeitige Import uebernimmt fuer Strava, TrainingPeaks und Apple Health insbesondere Durchschnittspuls. Das Vorhandensein dieses Felds belegt weder Minimum noch Maximum. Die folgende Tabelle beschreibt die geforderte fachliche Eignung, nicht eine Zusicherung, dass die vorhandenen Importer Extremwerte bereits uebernehmen.

| Quelle | Fuer diese Ansicht nutzbar | Umgang ohne verlaessliche Extremwerte |
|--------|---------------------------|--------------------------------------|
| Strava | Explizite minimale beziehungsweise maximale Herzfrequenz einer Aktivitaet mit eindeutigem Feldinhalt und Einheit; deutsche und englische Bezeichnungen sind gleichwertig. Ein exportiertes Maximum darf allein verwendet werden. | Nur Durchschnittspuls oder nicht vorhandene Extremspalten liefern keine Punkte. Aus einem Maximum wird kein Minimum abgeleitet. |
| TrainingPeaks | Explizite Min-/Max-Zusammenfassungen der konkreten Trainingseinheit, soweit der tatsaechliche Export sie verlaesslich enthaelt. | Ein Durchschnittsfeld, eine Leistungskennzahl oder der Quellenname allein qualifiziert nicht. Ohne Extremwerte bleibt die Ansicht verborgen, sofern keine anderen Trainings sie tragen. |
| Apple Health | Explizite workoutbezogene Min-/Max-Herzfrequenzstatistiken mit eindeutiger Einheit und Zuordnung. | Ein Workout-Durchschnitt, Tagesextreme, Ruhepuls oder zeitlich ueberlappende Alltagsmessungen sind kein Ersatz. Ohne verlaessliche Workout-Extremwerte entstehen keine Punkte. |

Fuer alle Quellen gilt: Einzelne gueltige Angaben bleiben auch bei ansonsten lueckenhafter Abdeckung verwendbar. Widerspruechliche oder mehrdeutige Angaben werden nicht automatisch repariert. Eine source-spezifische Sperre ist ebenso unzulaessig wie eine Freischaltung allein aufgrund des Quellnamens. Dieselbe fachliche Datenqualitaet MUSS unabhaengig von der Quelle zur selben Entscheidung fuehren.

Neue Rekonstruktionen von Extremwerten aus zeitgestempelten Messreihen, neue Dateiformate und neue Zuordnungs- oder Zusammenfuehrungsregeln sind nicht Teil dieses Features. Fehlende Quellzusammenfassungen bleiben deshalb fehlend, auch wenn Rohmessungen grundsaetzlich vorhanden sein koennten. Die konkrete Zuordnung vorhandener Quellfelder ist vor einer spaeteren Umsetzung anhand synthetischer oder explizit freigegebener Beispiele zu belegen; echte Gesundheitsdaten gehoeren nicht in die Versionsverwaltung.

### Key Entities *(include if feature involves data)*

- **Training**: Bestehende einzelne Aktivitaet mit Identitaet, Datum, optionaler Startzeit, Sport und optionalem Namen; wird durch die Ansicht nicht veraendert.
- **Extremwertangabe**: Optionales verlaessliches Minimum oder Maximum eines bestimmten Trainings, einschliesslich Wert und bekannter Einheit. Beide Angaben haben unabhaengige Verfuegbarkeit.
- **Verlaufspunkt**: Darstellung einer gueltigen Extremwertangabe mit Referenz auf genau ein Training und dessen Datum.
- **Ansichtsverfuegbarkeit**: Eignung der gesamten aktuell importierten Historie, mindestens einen Verlaufspunkt zu liefern; getrennt vom Ergebnis der aktuellen Filter.
- **Exportstand**: Der fuer Vorschau und Download angeforderte sichtbare Verlauf einschliesslich Sport- und Zeitkontext.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In einer synthetischen Referenzhistorie mit mindestens zwoelf Trainings aus allen drei Sportarten, unsortierter Reihenfolge, gleichen Tagen und gleichen Startzeiten stimmen 100 % der erwarteten Punkte hinsichtlich Wert, Reihe, Datum und Ursprungstraining ueberein. Es entstehen null zusaetzliche Punkte und keine Zusammenfassungen mehrerer Trainings.
- **SC-002**: In Faellen mit nur Minimum, nur Maximum, beiden, identischen Extremen, nur Durchschnittspuls, fehlenden, ungueltigen, einheitsunklaren und widerspruechlichen Angaben werden 100 % der unabhaengig verlaesslichen Werte erhalten und null fehlende oder unzuverlaessige Werte als Messungen angezeigt. Jede dieser Datenqualitaeten wird fuer alle drei Importquellen fachlich geprueft, ohne eine nicht vorhandene Quellenfaehigkeit vorauszusetzen.
- **SC-003**: Bei null passenden Werten gibt es null erreichbare Tabs oder Exportziele fuer diese Ansicht; bei genau einem passenden Minimum oder Maximum ist sie verfuegbar. In allen Ersatzimport-Faellen bleiben null veraltete Punkte, aktive Tab-Auswahlen oder Exportziele zurueck.
- **SC-004**: Fuer jede der drei Sportarten, die bestehende Gesamtauswahl, jede bestehende Zeitfilterart und mindestens eine Kombination ohne Treffer stimmt die Punktmenge zu 100 % mit den gueltigen Werten der nach denselben Dashboard-Regeln gefilterten Trainings ueberein. Trainings exakt auf einer Datumsgrenze folgen nachweislich der bestehenden Einschlussregel.
- **SC-005**: Bei Ansichtsbreiten von 320, 375, 768 und 1440 CSS-Pixeln sind die Ansicht, Reihenkennzeichnung und Exportaktion ohne horizontalen Seitenueberlauf oder ueberlappende Bedienelemente bedienbar. Bei 375 und 1440 CSS-Pixeln laesst sich jedes Training des Referenzfalls per Touch beziehungsweise Zeiger eindeutig identifizieren, einschliesslich ueberlagerter Punkte.
- **SC-006**: Fuer beidseitige, nur einseitige und gefilterte Daten in schmaler und breiter Ansicht fuehren 100 % der Share-/Export-Prueffaelle zu einer lokalen Vorschau und einem herunterladbaren Bild mit identischem angefordertem Datenstand, lesbaren Reihen, Einheiten und Filterkontext. Bei Filter-Leerstaenden wird kein leeres oder veraltetes Diagramm exportiert.
- **SC-007**: Ein Vorher-/Nachher-Vergleich derselben Referenzimporte zeigt null Aenderungen an bestehenden Trainingsfeldern, Aktivitaetszahlen sowie Ergebnissen aller bisherigen Visualisierungen und Filter. Vorhandene Durchschnittspulse bleiben identisch; ausschliesslich neue optionale Extremwertangaben duerfen hinzukommen.
- **SC-008**: Bei Import, Betrachtung und Export dieser Funktion werden null individuelle Herzfrequenzangaben durch die neue Funktion an entfernte Dienste uebertragen.

## Assumptions

- Dieses Dokument beschreibt ausschliesslich zukuenftiges Verhalten. In diesem Auftrag werden weder Anwendungscode noch Importer, Navigation oder Tests implementiert; Implementierungsplan und Aufgabenzerlegung folgen gesondert.
- Ein einzelner qualifizierter Punkt ist fuer diese Ansicht sinnvoll. Es gibt keine Mindestanzahl vollstaendiger Min-/Max-Paare und keine Pflicht, beide Reihen mit Werten zu befuellen.
- Die vorhandenen unterstuetzten Sportarten, Filterregeln, Trainingsdatumssemantik und der lokale Vorschau-/Download-Ablauf sind die verbindliche Ausgangsbasis. Der neue Tab folgt der bestehenden Dashboard-Gestaltung.
- Verlaesslichkeit meint eindeutige Quellsemantik, Einheit, Trainingszuordnung und Widerspruchsfreiheit, keine medizinische Bewertung. Es werden keine willkuerlichen alters- oder sportbezogenen Grenzwerte eingefuehrt.
- Der aktuelle Import ersetzt die geladene Historie gemaess dem vorhandenen Ablauf. Quellenuebergreifende Zusammenfuehrung und neue Deduplizierung sind ausgeschlossen.
- Ausserhalb des Umfangs liegen Durchschnittspuls als zusaetzliche Reihe, Ruhepuls, Herzfrequenzvariabilitaet, Zonen, Erholung, medizinische Aussagen, Trendschaetzungen, Glaettung, Korrelation mit Leistung oder Tempo und neue Messreihenberechnungen.
- Verfuegbare direkte Quell-Extremwerte duerfen in einer spaeteren Umsetzung optional zugaenglich gemacht werden, ohne bestehende Trainingswerte oder andere Auswertungen zu veraendern. Quellen ohne solche Werte bleiben bewusst ohne diese Ansicht.