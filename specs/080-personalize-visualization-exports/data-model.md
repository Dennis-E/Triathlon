# Data Model: Exportpersonalisierung

**Feature**: [spec.md](spec.md)
**Designbasis**: [research.md](research.md)

Alle neuen Strukturen sind lokale, flüchtige Werte. Kein Datenbankmodell, keine Migration und keine Speicherung persönlicher Texte. Bestehende Exportmodelle bleiben erhalten; die folgenden Felder sind additive Ergänzungen und explizite Verträge für die Implementierung.

## 1. ExportSelectionSnapshot

Der bestehende eingefrorene Snapshot bleibt die alleinige Datenbasis einer Sitzung.

| Feld | Inhalt / Regel |
|------|----------------|
| `selectionId`, `datasetIdentity` | Vorhandene stabile Auswahl-/Datasetidentität; neue Sitzung erfasst neu |
| `targetKey`, `targetKind`, `variantKey` | Bestehende Familie und tatsächlich ausgewählte Variante |
| `filters`, `period`, `metric`, `units` | Unveränderte Bedeutung der erfassten Auswahl |
| `familyData` | Bereits erlaubte Familienfelder; zusätzliche kompakte `punchlineEvidence` und bei Workout Time `startTimeAnalysis` |
| `provenance`, `attribution`, `disclosure` | Herkunft, erforderliche Quellen und bestehende Privatsphärenauswahl |

**Invarianten**: Rekursiv eingefrorene, endliche, azyklische Daten; keine Rohaktivitäten, DOM-Knoten oder Chartobjekte. Datum nur als gültige Epoch-Millisekunden oder `null`. Ein Rohdatum darf nicht über `Number(null)` zu 1970 werden. PB-Quellen sind nur in den unten definierten Recordpfaden erlaubt. Ein laufender Text-/Layoutwechsel liest keine neuen globalen Trainingsdaten.

## 2. PunchlineEvidence und PunchlineSuggestion

Familienadapter dürfen kompakte Fakten liefern; der Vorschlagsbuilder verknüpft sie nach dem Capture mit der Snapshotidentität. Bereits vorhandene eindeutige Exportwerte müssen dafür nicht redundant kopiert werden.

| Evidenzfeld | Bedeutung |
|-------------|-----------|
| `factKey`, `kind` | Stabile lokale Kennung und belegter Typ, beispielsweise `leading-category`, `selected-total`, `record-value` oder `start-window` |
| `metric`, `unit` | Tatsächlich verwendetes Messkriterium; nicht aus einem anderen Visualisierungsmodus übernehmen |
| `value`, `denominator` | Vorhandener endlicher Wert; Nenner nur bei sinnvoller Anteilsbildung, niemals null/zero als fehlend kaschieren |
| `labels` | Nur für diese Familie bereits zur Veröffentlichung bestimmte Kategorien; keine zusätzlichen Aktivitätsnamen oder Orte |
| `isTie`, `qualifiers` | Gemeinsamer Spitzenplatz, Teilzeitraum, Schätzung und andere notwendige Einschränkungen |

Ein **PunchlineSuggestion** enthält `id`, `text`, `kind: 'data' | 'neutral'` sowie für Datenvorschläge `basis` mit `selectionId`, fachlichem Auswahlbezug, Messkriterium und belegtem Wert/Anteil. Die Identität wird deterministisch aus Fakt/Variante abgeleitet, nicht bei jedem Render zufällig gewählt. Neutraltexte haben keinen vorgetäuschten Befund. Alle Vorschlagstexte durchlaufen dieselbe Längen-/Layoutprüfung wie eigene Texte; sie dürfen nicht heimlich abgeschnitten werden.

**Beziehungen**: Ein Snapshot → null bis mehrere belegte Vorschläge plus ein neutraler Fallback. Ein Vorschlag → genau ein Snapshot. Die Erklärung eines Vorschlags erscheint in der Exportsteuerung; nur interpretativ nötige Einschränkungen müssen zusätzlich im Bild bleiben. Nutzertexte werden nie als Suggestion-Evidenz wiederverwendet.

## 3. WorkoutStartTimeAnalysis

Berechnung aus der vor der Startzeitvalidierung sport-/datumsgefilterten Aktivitätsmenge. Keine Änderung der bestehenden Diagrammgruppierung.

| Feld | Typ / Invariante |
|------|-----------------|
| `basis` | Literal `activity-start-count`, unabhängig von Count-/Dauer-/Distanzanzeige |
| `selectedCount` | Anzahl der Aktivitäten in der sport-/datumsbezogenen Grundmenge |
| `validStartCount` | Zahl eindeutig belegter lokaler Starts |
| `excludedStartCount` | `selectedCount - validStartCount` |
| `exclusions` | Aggregierte Gründe mit Anzahl: fehlender lokaler Nachweis, ungültige Ortszeit oder widersprüchlicher Nachweis; keine Rohdatensätze |
| `windows` | Genau vier Einträge `{key, count}`: `morning`, `afternoon`, `evening`, `night`; Summe entspricht `validStartCount` |
| `dominantWindow` | Fensterkennung oder `null`; nur bei mindestens zehn gültigen Starts und mindestens 60 Prozent Anteil |
| `status` | `supported`, `insufficient-data`, `no-dominance` oder `no-valid-starts` |
| `scope` | Sport-/Datumsbezug der Grundmenge, keine ersatzweise All-time-Auswahl |

Die Fenster sind Morgen [05:00, 12:00), Nachmittag [12:00, 18:00), Abend [18:00, 22:00), Nacht [22:00, 05:00). Grenzprüfung auf den ungerundeten Zählern; gerundete Prozentanzeige entscheidet nicht über Zulässigkeit. Genau ein Fenster je gültigem Start; keine Gewichtung durch Dauer oder Distanz.

**Zeitprovenienz**: Validiertes `sourceLocalStart` gegen `startTime`, oder eindeutig vorhandenes und gültiges synthetisches Paar `calendarDate`/`localStartTime`. Keine Browserzeitzone, kein Datum-ohne-Uhrzeit und keine aus anderen Messgrößen abgeleitete Zeit. Bei weniger als zehn gültigen Starts dürfen tatsächliche Anzahlen erklärt werden, aber kein Gewohnheitsetikett angeboten werden.

## 4. PunchlineSelection

| Feld | Bedeutung |
|------|-----------|
| `enabled` | Neuer Sitzungsdefault `true`; unabhängig von Textquelle |
| `source` | `default`, `suggestion` oder `custom` |
| `suggestionId` | Nur bei gewähltem Vorschlag; muss zum selben Snapshot gehören |
| `confirmedText` | Letzter bestätigter, äußerlich getrimmter Text; innere Zeichen unverändert |
| `draftText` | Optionaler eigener Eingabeentwurf, nicht automatisch ein Analyseergebnis |
| `validationStatus` | `valid`, `empty`, `too-long` oder `does-not-fit`; Fehler ist benutzersichtbar |
| `hasUnconfirmedDraft` | Entwurf weicht vom bestätigten Text ab; ein bloßer Entwurf ersetzt noch kein Bild |
| `blockedAfterApply` | Bestätigung einer ungültigen aktiven Textfassung verhindert Download des alten Bilds als neue Fassung |

**Textvalidierung**: 1–120 Unicode-Codepoints nach äußerem Trimmen. Innere Leerzeichen/Satzzeichen bleiben erhalten. Umbruch ist Darstellung, kein gespeichertes Umschreiben. Keine HTML-Auswertung. Im gewählten Format höchstens zwei lesbare Zeilen, Schriftgröße mindestens das 1,25-Fache des unterstützenden Kontexts und mindestens die bestehende essentielle Mindestgröße. Zeichengrenze allein ist keine Passgarantie für das Layout.

**Erneute Formatprüfung**: Zeichenvalidität und Darstellbarkeit sind getrennte Bedingungen. Ein Formatwechsel erhält den gewählten Text und prüft die Darstellbarkeit erneut. Ein `does-not-fit`-Fehler sperrt die aktive Fassung; Rückkehr zum passenden Format beseitigt diesen Formatfehler nach erneuter erfolgreicher Prüfung, ohne den Text ändern oder erneut eingeben zu müssen. Download erst nach erfolgreicher Vorbereitung der gewählten Revision; unabhängige Zeichen-/Entwurfsfehler bleiben bestehen.

**Deaktiviert**: `enabled=false` unterdrückt Text und reservierten Platz, erhält aber Auswahl und Entwurf. Nach erfolgreicher captionloser Komposition ist dieser Export herunterladbar, auch wenn ein aufbewahrter Entwurf noch ungültig ist. Beim erneuten Aktivieren bleibt eine ungültige angewendete Fassung blockiert, bis sie korrigiert, ausdrücklich verworfen oder nach Rückkehr zu einem passenden Format wieder darstellbar ist; reine Formatkorrektur hebt keine Zeichenfehler auf.

## 5. ExportPresentationRevision

Die bereits vorhandenen Sitzungs-, Capture-, Dataset- und Kompositionsrevisionen bleiben maßgeblich; die Präsentationsrevision erweitert sie um die bestätigte Textentscheidung.

| Feld | Bedeutung |
|------|-----------|
| `sessionId`, `selectionId` | Sitzung und Snapshot, auf denen die Komposition basiert |
| `presentationRevision` | Monoton bei bestätigter Textwahl, Aktivierung und Layoutwechsel; schließt Seitenplanfassung ein |
| `format` | `story`, `square`, `portrait`; neue Sitzung `story` |
| `punchline` | Bestätigter Zustand für genau diese Komposition |
| `status` | `pending`, `ready`, `invalid`, `failed` oder `closed` |
| `pages`, `currentPageIndex` | Vorbereitete vorhandene Exportbilder derselben abgeschlossenen Revision |

**Downloadbedingung**: Aktuelle Sitzung, Snapshot, Dataset-/Capturegeneration und Präsentationsrevision stimmen überein; Status `ready`; Bild vorhanden; kein aktiver angewendeter Textfehler und kein laufender Kompositions-/Downloadkonflikt. Ein vorhandener Blob alleine reicht nicht. Eine schon begonnene Speicherung behält ihre freigegebenen Bytes und übernimmt keine nachträgliche Textwahl.

### Zustandsübergänge

| Ereignis | Ergebnis |
|----------|----------|
| Export bewusst beginnen | Neuer Snapshot/Sitzung, Story, Punchline an, erster belegbarer Standard sonst neutral; `pending` |
| Vorschlag wählen oder gültigen eigenen Text bestätigen | Bestätigten Text/Quelle wechseln, neue Revision; `pending` |
| Ungültigen Text bestätigen | Textfehler und `blockedAfterApply`; keine alte Fassung als aktuelle herunterladen |
| Zum vorherigen Text zurückkehren | Fehler/Entwurf explizit verwerfen; aktuelle gewählte Fassung erneut bereitstellen |
| Layout wechseln | Snapshot/Text erhalten, neue Revision messen/komponieren; gegebenenfalls `does-not-fit`; Rückkehr zum passenden Format hebt nach erneuter Prüfung nur den Formatfehler auf |
| Punchline ausschalten | Auswahl erhalten, neue captionlose Revision; nach Fertigstellung `ready` |
| Punchline einschalten | Gewählte Fassung erneut validieren und komponieren; kein stiller Ersatztext |
| Bildseite wählen | Nur Seite derselben fertigen Serienrevision wechseln; Textquelle bleibt erhalten |
| Aktuelle Komposition fertig | Nur bei sämtlichen aktuellen Identitäten `ready`; alte Ergebnisse verwerfen |
| Komposition scheitert | `failed`, kein veralteter Download; Retry mit derselben Auswahl und Textentscheidung |
| Dataset invalidiert / Sitzung schließen | Kein laufendes Ergebnis darf mehr aktiviert werden; neuer Export ist ausdrücklicher Neustart |

## 6. PersonalBestSource und Exportdatum

`buildPbExportData` ergänzt bei jedem bereits zugeordneten Record ein kompaktes `source`-Objekt. Rekordwert, Reihenfolge, Messdefinition und Auswahlberechnung bleiben unverändert.

| Feld | Regel |
|------|-------|
| `workoutTitle` | Vorhandener Titel derselben Quelle oder `null`; nie datumsgestütztes Matching |
| `activityDate` | Gültiges Recorddatum, sonst gültiges Datum derselben Quelle, sonst `null` |
| `kind` | Intern `modeled`, `full-activity`, `fit-rolling` oder `unknown`; im Bild nur verständliche Formulierung |
| `estimated` | Kennzeichnet Schätzung unabhängig vom Vorhandensein eines Titels |
| `sourceDistanceKm` | Nur wenn zur Einordnung abweichender Quell-/Zieldistanz erforderlich und vorhanden |

**Datenschutzpfade**: Nur `personalBests.familyData.records[*].source` und `personalBests.familyData.groups[*].records[*].source` sowie entsprechende bereits zugeordnete `best`-/`firstRecord`-/`currentRecord`-/`milestones`-Recordspiegel. Zulässig sind ausschließlich die oben genannten Quellfelder und nur an schema-validierten Recordpositionen. Kein genereller Freibrief für Schlüssel namens `source`, `title`, `name` oder `workoutTitle` in anderen Familien/Objektpfaden.

**Profile**: Ein Dauerpunkt → eigene Quelle; mehrere Dauerpunkte dürfen verschiedene Workouts verwenden. Kein profilweiter Einzelworkout-Titel. Fehlende Datierung bleibt eine zugeordnete Quellenzeile, kein Punkt bei 1970 oder heute.

**Kalenderdomain**: Aus gültigen Daten sämtlicher dargestellter Records, identisch auf Fortsetzungsseiten. Mehr als ein unterschiedlicher Tag: chronologisch und höchstens ein Tickintervall Rand je Seite. Genau ein Tag: klar beschriftete Einzelbeobachtung ohne suggerierten zeitlichen Verlauf. Keine gültigen Tage: Werte/Quellen ohne erfundene Kalenderentwicklung. Dauerprofil: unveränderte Dauerachse. Titelzeilen werden gemessen und paginiert, nicht auf eine feste Recordhöhe gezwungen.