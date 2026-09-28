# Research: Umrandung trainingsfreier Kalendertage

## Technischer Ist-Zustand

- Die Kalenderzellen werden in `src/dashboard-training-calendar.js` von `createTrainingCalendarCell(day, palette)` als interaktive Tagesfelder erzeugt.
- Die Zelle erhält aktuell dieselbe helle Umrandungsklasse unabhängig davon, ob `day.activityCount` null/0 oder positiv ist. Trainingsfreie Zellen verwenden eine gemeinsame neutrale Füllfarbe; aktive Zellen verwenden eine der fünf Stufen der gewählten Palette.
- Der Sportfilter kann einen Tag, der insgesamt Aktivitäten enthält, im gefilterten Kalender trainingsfrei machen. Die Zellen werden nach Filter- und Palettenwechsel neu gerendert.
- Jest läuft in Node ohne jsdom. `__tests__/index-script-syntax.test.js` validiert bereits die Dashboard-Skripte; `__tests__/training-calendar-utils.test.js` deckt die Datenaggregation und Intensitätsstufen ab.

## Entscheidungen

### Entscheidung: Zellenrahmen abhängig vom Tageszustand darstellen

- **Entscheidung**: Die sichtbare helle Standardumrandung wird für Tagesfelder ohne Aktivität weggelassen; aktive Tagesfelder behalten ihre bisherige Darstellung. Der Fokusindikator bleibt für Tastaturbedienung verfügbar.
- **Begründung**: Die Regel folgt dem fachlichen Zustand des aktuell gefilterten Tages und gilt damit auch für leere Jahre, alle Kalenderjahre, Paletten und Sportfilter. Die Tastaturfokussierung bleibt erkennbar.
- **Alternativen**:
  - Umrandung aller Kalenderfelder entfernen: verworfen, weil dies den Umfang unnötig auf aktive Felder ausweitet und deren Erscheinungsbild ändert.
  - Füllfarbe, Legende oder Jahresblock-Rahmen ändern: verworfen, da die Spezifikation ausschliesslich die Umrandung trainingsfreier datumsbezogener Zellen betrifft.

### Entscheidung: Bestehende Kalenderdaten unverändert weiterverwenden

- **Entscheidung**: Die visuelle Unterscheidung basiert auf dem bereits vorhandenen Aktivitätszustand jedes Tages. Es werden weder neue gespeicherte Daten noch externe Schnittstellen benötigt.
- **Begründung**: Der Zustand hängt bereits vom aktiven Sportfilter ab und wird bei jedem Rendern neu berechnet.
- **Alternativen**:
  - Neue persistierte Tages- oder Darstellungsfelder einführen: verworfen, weil die Änderung rein präsentational ist.

### Entscheidung: Verifikation mit vorhandenem Testsetup und Browserprüfung

- **Entscheidung**: Die bestehende Jest-Syntaxprüfung und Kalender-Utility-Tests bilden die automatisierte Basis. Zusätzlich wird die reale Kalenderansicht im Browser mit gemischten Tagen, leeren Tagen, Paletten- und Filterwechsel sowie Tastaturfokus visuell geprüft.
- **Begründung**: Das Root-Jest-Setup stellt kein DOM bereit; die Browserprüfung validiert die tatsächlich sichtbare Darstellung, ohne ein neues Framework oder einen Build-Schritt einzuführen.
- **Alternativen**:
  - DOM-Testbibliothek oder Browser-Testframework hinzufügen: verworfen, da dies für eine fokussierte Präsentationsänderung eine neue Abhängigkeit und Infrastruktur erfordern würde.

## Offene Punkte

Keine. Die Spezifikation und der vorhandene Kalenderzustand legen Verhalten und Geltungsbereich ausreichend fest.
