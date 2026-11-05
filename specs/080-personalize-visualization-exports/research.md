# Research: Exportdarstellung und Personalisierung

**Date**: 2026-11-04
**Feature**: [spec.md](spec.md)
**Status**: Abgeschlossen; keine offenen technischen Klärungsfragen.

## Vorgehen und Verfassungsgate

Zwei lesende Rechercheaufträge untersuchten den vorhandenen Exportzustand/Workout Time und die PR-Quellen/Achsen. Grundlage sind der aktuelle Code, die vorhandenen Jest-Tests und die Verfassung 1.1.1, nicht Annahmen aus älteren Spezifikationen. Das Gate vor Phase 0 ist bestanden: statische Auslieferung, lokale Verarbeitung, Dual-Target-Hilfsfunktionen, unveränderte Importsemantik und ein eng begrenzter Testumfang sind möglich. Es wird kein neues Framework, Backend oder Analyseanbieter benötigt.

## R1 - Bestehenden strukturierten Export erweitern

**Decision**: Der Pfad `getStructuredExportData` → `initializeStructuredExportTarget` → `captureExportSelection` → `composeStructuredExportImages` bleibt Eigentümer der Exportauswahl und Komposition. Die Familienadapter werden um kompakte, erlaubte Analyse- und Quelleninformationen ergänzt. Ein neues kleines Dual-Target-Modul `src/export-punchline-utils.js` bündelt ausschließlich Vorschlagsverträge und Textvalidierung; die Workout-Time-Zählung bleibt in der vorhandenen Workout-Time-Utility.

**Rationale**: Der strukturierte Export erzeugt bereits eigene Bilder statt Dashboard-Screenshots und friert die Auswahl vor asynchroner Arbeit ein. Familienübergreifende Vorschlags-/Validierungsregeln sind unabhängig vom DOM testbar; ein einzelnes Modul trennt sie von Bildgeometrie und der großen DOM-Orchestrierung.

**Alternatives considered**: Screenshot-Nachbearbeitung übernimmt technische Dashboardbeschriftungen und ungeeignete Achsen. Analysen aus Pixeln oder Canvas-Daten wären unzuverlässig. Ein Modul pro Visualisierung oder ein neuer Exportdienst schaffen unnötige Grenzen.

**Evidence**: [dashboard-export.js](../../src/dashboard-export.js#L608), [export-utils.js](../../src/export-utils.js#L276).

## R2 - Kontext semantisch statt durch Textlöschung verdichten

**Decision**: `getSocialExportPresentation` bildet die vorhandenen Familienfelder auf semantische Kontextbestandteile ab: Thema, Zeitraum, Sporteinschränkung, Messgröße/Einheit, Vergleich und notwendige Einschränkung. Technische Schlüssel und Präfixe werden nicht ausgegeben. Inhaltsgleiche Bestandteile werden innerhalb derselben Bedeutung zusammengeführt; Achsen/Legenden zählen als bereits vorhandene Information. Ein fehlender Sporthinweis wird nur dann entfernt, wenn die dargestellten Reihen ihn eindeutig vermitteln.

**Rationale**: Eine globale Ersetzung von `Metric:` oder `All sports` könnte Benutzertitel verändern oder wichtige Einschränkungen löschen. Der vorhandene Präsentationsadapter kennt die fachliche Familie und die aktive Messgröße.

**Alternatives considered**: Reguläre Ausdrücke auf dem fertigen Bildtext sind semantisch blind. Das vollständige Entfernen aller Filter würde Interpretation und Belegbarkeit verlieren.

**Evidence**: [dashboard-export.js](../../src/dashboard-export.js#L385).

## R3 - Sitzungszustand und bestätigte Textfassung trennen

**Decision**: `beginExportSession` setzt ausschließlich bei einer neuen Sitzung Story und Punchline an. Der Punchlinezustand besitzt Aktivierung, Herkunft, bestätigten Text, gegebenenfalls Entwurf und Validierungsfehler. Layout- und Seitenwechsel behalten diesen Zustand; Schließen invalidiert ihn. Vorhandene Revisions-/Capture-/Dataset-Prüfungen werden um die Präsentationsrevision erweitert, nicht ersetzt. Ein bestätigter ungültiger Entwurf sperrt den Download der veralteten Fassung. Explizites Zurückkehren oder ein fertig gerenderter Export ohne aktive Punchline heben diese Sperre auf.

**Rationale**: Aktuell sind die globalen Standards Square und Humor aus; der Sitzungsbeginn setzt sie nicht zurück. `updateExportDownloadButton` prüft bisher nur Komposition/Download und vorhandene Bildbytes. Ein altes gültiges Bild allein darf nach einem fehlgeschlagenen Textwechsel nicht als neue Fassung gelten.

**Alternatives considered**: Globale Präferenzspeicherung widerspricht den festgelegten Neustandards. Sofortige Übernahme jedes Tastendrucks vermischt Entwurf und Bestätigung. Neue unabhängige Race-Mechanismen würden den existierenden Revisionsschutz duplizieren.

**Evidence**: [dashboard-export.js](../../src/dashboard-export.js#L1514), [dashboard-export-download.test.js](../../__tests__/dashboard-export-download.test.js#L2325).

## R4 - Eigene Texte unverändert und sicher behandeln

**Decision**: Außen trimmen; anschließend Unicode-Codepoints mit `Array.from(text).length` zählen: 1 bis 120. Inneren Text, Schreibweise und Satzzeichen nicht normalisieren. DOM-Ausgabe ausschließlich als Text, Canvas-Ausgabe als Textzeichnung; kein HTML oder ausführbarer Inhalt. Bestehende Humor-/Zehnwortkürzung nicht auf eigene Texte anwenden. Sichtbare Umbrüche sind Darstellung, keine Änderung des bestätigten Textwerts.

**Rationale**: `createSocialExportMetadata` begrenzt bisher die Light line auf zehn Wörter; `wrapExportText` normalisiert Whitespace. Beide Verhaltensweisen würden FR-009 für eigene Texte verletzen.

**Alternatives considered**: UTF-16-Codeeinheiten benachteiligen Zeichen außerhalb der Basisebene. Automatisches Kürzen, Umschreiben oder generativer Text wären nicht die bestätigte Nutzereingabe. Für die Zählung ist keine neue Bibliothek nötig.

**Layoutentscheidung**: Zeichenlänge und tatsächliche Darstellbarkeit sind getrennte Validierungen. Passt ein lexikalisch gültiger Text nicht in zwei Zeilen bei mindestens 125 Prozent Kontextschrift und den bestehenden Lesbarkeitsgrenzen, wird diese Fassung mit einer verständlichen Bitte zum Kürzen blockiert. Kein stilles Abschneiden, keine Schriftverkleinerung unter die Grenzen, keine dritte Zeile. Der vorherige bestätigte Text bleibt explizit wiederherstellbar. Damit wird kein unmögliches Versprechen gemacht, dass jede Kombination aus 120 sehr breiten Zeichen darstellbar sei.

**Evidence**: [export-utils.js](../../src/export-utils.js#L112), [export-utils.js](../../src/export-utils.js#L505).

## R5 - Gemeinsames Layout, keine zweite Caption

**Decision**: Die bestehende `secondaryLine` wird zur einzigen Punchline, vor dem Detailkontext. `planExportPages` misst sie mit höchstens zwei Zeilen und gibt den Platz bei deaktivierter Punchline frei. Titel-/Kontextschrift und Datenbudget bleiben getrennt. Das Story-Logo erhält eine formatbezogene Box; die tatsächliche sichtbare Höhe des proportional eingepassten Logos muss mindestens das 1,5-Fache der Square-Ausgabe betragen. Nicht nur die Boxgröße messen.

**Rationale**: Story hat bereits eine zentrale sichere Fläche von x=72 bis 960 und y=240 bis 1560. Der Rahmen verwendet derzeit formatunabhängig eine Logo-Box von 88 × 40. Ein größerer Logoabstand allein würde FR-005 nicht erfüllen. Bei 36 Pixeln Kontextschrift beträgt die Punchline mindestens 45 Pixel.

**Alternatives considered**: Eine zusätzliche Kernaussage neben der bisherigen Light line verletzt die Ein-Text-Regel. Ein vergrößertes Bild auf unverändertem Hintergrund oder Verdrängen notwendiger Diagrammteile ist kein vertikales Layout.

**Evidence**: [export-utils.js](../../src/export-utils.js#L276), [dashboard-export.js](../../src/dashboard-export.js#L1384).

## R6 - Workout Time aus belegbaren Startzeiten analysieren

**Decision**: Vor dem Snapshot dieselbe Sport-/Datumsmenge wie die ausgewählte Workout-Time-Ansicht bestimmen, aber die Prüfung gültiger Startzeit erst danach ausführen. Gültige und ausgeschlossene Starts zählen, jeden gültigen Start einmal. Vier Fenster exakt nach FR-015; mindestens zehn gültige Starts und ungerundete Dominanzprüfung `windowCount * 100 >= validCount * 60`. Count-, Dauer- und Distanzanzeige ändern die startbezogene Analyse nicht. Keine Rekonstruktion aus zweistündigen Diagrammbalken, weil deren Grenzen nicht zur 05:00-Grenze passen.

**Rationale**: `matchesFilters` schließt fehlende Startzeiten bereits aus; als alleinige Vorfilterung würde es die Ausschlusszahl verlieren. Die vorhandenen Diagrammgruppen enthalten nicht ausreichend genaue Starts. Der gewählte Datumsbereich bezieht sich auf `activity.date` und bleibt unverändert.

**Zugelassene Ortszeitquellen**: Validiertes Apple-Health-`sourceLocalStart` anhand von `isValidSourceLocalStart`; außerdem zusammengehörige explizite `calendarDate`/`localStartTime` der synthetischen Beispieldaten nach Validierung. Eine zusätzliche Quelle ist nur zulässig, wenn im vorhandenen Aktivitätsobjekt eine explizite und eindeutige lokale Uhrzeit belegt ist. Ein normalisiertes `Date`, Browser-`getHours`, GPS, Dauer oder eine Datumsangabe ohne Zeit sind kein solcher Nachweis.

**Bekannte Abdeckung**: Der bisherige CSV-Pfad kann Datum-ohne-Uhrzeit auf Mitternacht normalisieren und verliert diesen Unterschied; TrainingPeaks bewahrt derzeit keinen entsprechenden Ortszeitnachweis. Solche Einträge werden konservativ ausgeschlossen und erläutert. Importformate und Diagrammberechnungen werden nicht verändert. Eine spätere Verbesserung der Ortszeitprovenienz wäre ein eigener Auftrag.

**Alternatives considered**: Browserzeit würde die Aussage vom betrachtenden Gerät abhängig machen. Ein pauschaler Mitternachtsausschluss würde echte Mitternachtsstarts verlieren; Mitternacht ohne Herkunft pauschal zu akzeptieren würde Daten erfinden. Neue Zeitzonenheuristiken oder Importumbauten sind nicht erforderlich.

**Evidence**: [workout-time-utils.js](../../src/workout-time-utils.js#L88), [workout-time-utils.js](../../src/workout-time-utils.js#L125), [dashboard-workout-time.js](../../src/dashboard-workout-time.js#L212), [apple-health-utils.js](../../src/apple-health-utils.js#L43), [sample-data-utils.js](../../src/sample-data-utils.js#L154).

## R7 - Vorschläge brauchen konkrete Belege je Familie

**Decision**: Ein Vorschlag enthält Text und kompakte Grundlage mit Auswahlbezug, Messgröße, Wert/Anteil und Einschränkungen. Er wird nur angeboten, wenn ein Familienadapter den passenden Befund liefert. Die Exportsteuerung zeigt diese Grundlage beim gewählten Vorschlag. Ein neutraler familienbezogener Standard bleibt immer möglich, ohne Gesundheits-, Charakter-, Trend- oder Rekordbehauptung.

| Familie | Verwendbarer vorhandener Befund | Sichere Grenze / Alternative |
|---------|--------------------------------|-----------------------------|
| Distance | Eindeutig höchster dargestellter Zeitraum nach aktiver Messgröße | Nur innerhalb der Auswahl; Gleichstände gemeinsam; Teilperioden benennen |
| Pace vs metrics | Tatsächlich erfasste Punktzahl oder sichtbare Auswahldefinition | Keine Kausalität oder Trendbehauptung aus Punktanordnung; neutral ohne ausreichende Werte |
| Equipment ranking | Führende Kategorie nach aktiver Messgröße | Gleichstände ausdrücklich gemeinsam; keine Kilometer bei Zeitranking |
| Equipment Timeline | Dargestellte Nutzungsdaten und aktive Equipmentauswahl | Keine ununterbrochene Nutzung aus erstem/letztem Datum ableiten |
| Personal Bests | Tatsächlich ausgewiesener Rekordwert und seine Definition | Ein Punkt ist kein Verbesserungsverlauf; Schätzung kennzeichnen |
| GPS Heatmap | Gewählte Sport-/Zeitraumauswahl | Keine neuen Länder-, Entfernungs- oder Abdeckungsbehauptungen aus Kartenpixeln |
| Distributions | Häufigstes ausgewiesenes Intervall nach vorhandener Verteilung | Bereich/Einheit und Gleichstände erhalten; keine individuelle Diagnose |
| Workout Time | Vier-Fenster-Analyse aus gültigen Starts | Mindestmenge, Anteil und Ausschlüsse offenlegen |
| Training Calendar | Bereits vorhandene ausgewählte Kalenderdaten, falls Export verfügbar | Keine Streak aus fehlenden Tagen ableiten; bestehender Exportdefekt bleibt ausgeschlossen |
| Workout Title Wordcloud | Häufigster ausdrücklich dargestellter Begriff nach vorhandener Gewichtung | Keine zusätzlichen Workout-Titel außerhalb der gewählten Wortwolke |
| Pie Charts | Führende ausgewiesene Kategorie nach aktiver Anteilsgröße | Gruppierung, Einheit und Gleichstände erhalten |
| Lifetime Statistics | Bereits exportierter Summenwert im vorhandenen Umfang | Keine Inhaltsänderung, neue Länder-/Meilensteinberechnung oder Reparatur des Abschneidens |
| Media Gallery | Tatsächlich ausgewählte Medienmenge/Zeitraum | Keine Trainingsleistung oder neue Orts-/Titelinformation aus Medien ableiten |

Die Implementierung dokumentiert je tatsächlich angebotenem Ziel und Variante einen belegten Vorschlag oder den konkreten Grund für eine neutrale Alternative. Die Tabelle ist ein Fähigkeitsentwurf, keine Behauptung über echte Trainingsdaten. Bereits verfügbare, aussagekräftige Fakten dürfen nicht pauschal durch neutrale Texte ersetzt werden.

**Alternatives considered**: Eine feste Zahl witziger Texte pro Familie erzwingt unbelegte Aussagen. Generative Dienste gefährden Datenbelegbarkeit und lokale Verarbeitung. Allgemeiner Humor ohne Kontext erfüllt die datenbezogenen Vorschläge nicht.

## R8 - PR-Quellen im Adapter bewahren, nicht Rekorde neu berechnen

**Decision**: `buildPbExportData` übernimmt die bereits eindeutig zugeordneten Quellinformationen aus den Detailrecords in ein exportbezogenes `source`-Objekt. Titel stammen aus demselben Quellrecord, nicht aus Datum-/Wertmatching. Generische Importnamen bleiben gegebenenfalls neutral; eine verlässliche Unterscheidung echter und generischer Titel wird nicht vorgetäuscht. `captureExportSelection` erlaubt dieses Objekt ausschließlich innerhalb von PB-Records, nicht beliebige verschachtelte Titel oder Rohaktivitäten.

**Rationale**: Distanz- und Leistungsrecords besitzen bereits `activityId`, `name`, `date` und Quellenart; die Detailmodelle verbinden sie mit dem Wert. Der Exportadapter verwirft diese Informationen bisher. `captureExportSelection` entfernt sonst bewusst persönliche Titel. Eine bloße neue Titelspalte ohne gezielte Snapshotregel reicht daher nicht.

**Quellenbegriffe**: `modeled` wird verständlich als aus dem Aktivitätsdurchschnitt geschätzt bezeichnet, `full-activity` als ganze Aktivität, `fit-rolling` als gemessener Abschnitt. Bei abweichender Quell-/Zieldistanz bleibt die relevante Einschränkung erhalten. Keine Umdeutung einer Schätzung in eine Messung.

**Powerprofil**: Jeder Dauerpunkt behält seine eigene Quelle; ein aggregiertes All-time-Profil darf keinen gemeinsamen erfundenen Workout-Titel erhalten. Dauerachsen bleiben Dauerachsen. Fehlende Leistungsdauern werden weder berechnet noch ergänzt.

**Alternatives considered**: Rekorde neu berechnen wäre scopefremd. Titel nach Datum oder Bestwert suchen ist mehrdeutig. Alle Titel im Snapshot freigeben würde die Datenschutzgrenze anderer Familien entfernen.

**Evidence**: [dashboard-power-pb.js](../../src/dashboard-power-pb.js#L51), [dashboard-power-pb.js](../../src/dashboard-power-pb.js#L639), [power-pb-utils.js](../../src/power-pb-utils.js#L182), [dashboard-export.js](../../src/dashboard-export.js#L47).

## R9 - Nur Exportachsen aus tatsächlichen PR-Daten bestimmen

**Decision**: Kalenderachsen nutzen die gültigen Datumswerte sämtlicher dargestellter Rekorde, nicht `processedActivities`. `null` und ungültige Daten werden vor jeder numerischen Konvertierung als fehlend normalisiert. Undatierte Rekorde bleiben als Wert-/Quellenzeilen erhalten, werden aber nicht auf eine erfundene Kalenderposition gesetzt. Ein einzelner gültiger Tag ist eine einzelne Beobachtung ohne Verbindungslinie; mehrere reale Gleichtagspunkte bleiben unverändert. Mehrjährige und jahreswechselnde Daten erhalten eindeutige Jahresbezüge. Höchstens ein sichtbares Tickintervall Rand pro Seite, sofern kein ausdrücklich ausgewählter Vergleichszeitraum vorliegt.

**Rationale**: Der Adapter verwendet derzeit datasetweite Perioden; der Renderer bevorzugt diese und `Number(null)` kann fälschlich das Datum 0 erzeugen. Das Detaildashboard und Übersichtsdashboard haben eigene, teilweise absichtlich globale Achsen und werden nicht verändert.

**Pagination**: Alle Fortsetzungsseiten derselben PB-Gruppe behalten denselben vollständigen Chartbereich. Lange Quellen-/Titelzeilen benötigen gemessene variable Zeilenhöhen statt des bisherigen festen 52-Pixel-Budgets; kein stilles Weglassen.

**Alternatives considered**: Alle PR-Charts auf Kalenderzeit umstellen würde Leistungsprofile verfälschen. Automatisches Entfernen entfernter Punkte, Interpolation oder Datumserfindung verletzt die Datenintegrität.

**Evidence**: [dashboard-power-pb.js](../../src/dashboard-power-pb.js#L710), [dashboard-export.js](../../src/dashboard-export.js#L1217), [export-utils.js](../../src/export-utils.js#L477).

## R10 - Inventar und Verifikation am aktuellen Code ausrichten

**Decision**: Den vorhandenen Fixturegenerator und die bestehenden vier maßgeblichen Testsuiten erweitern; nur für das neue reine Punchline-Modul eine neue Testdatei vorsehen. Das Feature erhält ein aktuelles UI-/Verifikationsverzeichnis aller 13 Familien und PR-/Medienvarianten. Historische Feature-077-Dokumente bleiben historische Quellen, ihre überholten Standards sind nicht normativ für Feature 080.

**Rationale**: Die PB-Übersicht hat inzwischen einen sichtbaren Exportknopf; das ältere Inventar sagt das Gegenteil. Die relevanten Tests enthalten bereits Reihenfolge-/Race-, Datenschutz-, Layout- und Herkunftsfälle. Der Browsergenerator bereitet Detailmodelle teilweise aus reduzierten Records vor und muss Quellenfelder weiterreichen.

**Acceptance**: Jest prüft Regeln und Zustände, tatsächliche PNG-Dateien prüfen Logo-/Schriftverhältnisse und 360-Pixel-Lesbarkeit. Chrome und Edge bleiben verbindlich. Der Test mit mindestens fünf Personen ist ein späteres menschliches Abnahmegate, nicht durch automatische Bildschirmfotos ersetzbar.

**Alternatives considered**: Ein komplett neuer Browserrunner oder pauschale Snapshotaktualisierung ohne Beleg würde Arbeit und falsche Sicherheit erzeugen. Bereits ausgeschlossene Fehler sind separat protokolliert, nicht als verdeckte Reparaturaufträge eingeplant.

**Evidence**: [dashboard-export-download.test.js](../../__tests__/dashboard-export-download.test.js#L910), [export-utils.test.js](../../__tests__/export-utils.test.js#L92), [generate.js](../../__tests__/fixtures/reel-story-exports/generate.js#L401), [index.html](../../index.html#L1352).

## Offene Punkte und Abgrenzung

Keine Entscheidung erfordert eine neue Produktklärung. Die konservative Ortszeitabdeckung und die zusätzliche Darstellbarkeitsprüfung sind bekannte Daten-/Layoutgrenzen mit explizitem Verhalten. Training-Calendar-Reparatur, Lifetime-Statistics-Abschneiden und -Inhaltswünsche sowie Apple-Health-`geoPoint` sind weder Forschungs- noch Implementierungsaufträge dieses Features. Echte Browserbilder, Nutzertest und Laufzeittests sind erst in der Implementierungs-/Abnahmephase zu erbringen und werden hier nicht als bestanden behauptet.