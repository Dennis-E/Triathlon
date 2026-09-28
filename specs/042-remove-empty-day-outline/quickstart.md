# Quickstart: Umrandung trainingsfreier Kalendertage validieren

## Voraussetzungen

- Node.js/npm gemäss Repository-Setup
- Einen lokalen Browser und einen statischen HTTP-Server
- Einen importierten Trainingsdatensatz mit aktiven und trainingsfreien Tagen; falls erforderlich, in einer lokalen Testkopie geeignete Beispieldaten verwenden

## Automatisierte Prüfung

Im Repository ausführen:

- `npm test -- --runInBand __tests__/index-script-syntax.test.js __tests__/training-calendar-utils.test.js`

**Erwartetes Ergebnis**: Beide Jest-Suites bestehen; die Dashboard-Skripte sind syntaktisch gültig und die bestehende Tageszustands- sowie Kalenderaggregation bleibt intakt.

## Browserprüfung

1. Repository mit dem im README dokumentierten statischen Server bereitstellen und die App im Browser öffnen.
2. Trainingsdaten mit mindestens einem trainingsfreien Datum und einem aktiven Datum laden und die Training Calendar-Ansicht öffnen.
3. Prüfen, dass datumsbezogene Felder ohne Aktivität keine sichtbare weisse oder helle Standardumrandung haben.
4. Prüfen, dass aktive Felder ihre Füllfarben, Intensitätsstufen und bisherige Darstellung behalten.
5. Green, Blue und Fire auswählen; die Umrandung der trainingsfreien Felder muss unabhängig von der Palette fehlen.
6. Verfügbare Sportfilter durchgehen, darunter einen Filter, bei dem ein Tag ohne passende Aktivität bleibt; auch dieses Tagesfeld darf keine helle Standardumrandung haben.
7. Mit Tastatursteuerung ein leeres Tagesfeld fokussieren und sicherstellen, dass der Fokusindikator weiterhin sichtbar ist und das Feld bedienbar bleibt.
8. Falls mehrere Kalenderjahre vorhanden sind, die Prüfung in mindestens zwei Jahresblöcken wiederholen. Jahresbeschriftungen, Legende und äussere Jahresblock-Rahmen müssen unverändert bleiben.

**Erwartetes Ergebnis**: Alle Prüfpunkte aus FR-001 bis FR-004 und SC-001 bis SC-004 sind erfüllt; andere Kalenderdarstellungen bleiben unbeeinflusst.
