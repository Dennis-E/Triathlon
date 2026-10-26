# Research: Fire-Farben für Equipment-Pace

## Entscheidung: vorhandenen Fire-Verlauf wiederverwenden

- **Decision**: Verwende `window.distributionUtils.getFireGradientColor(position)` aus `src/distribution-utils.js` für Pace-Balken, wenn der Filter genau „Shoes“ oder „Bikes“ auswählt.
- **Rationale**: Das Utility definiert bereits die projektweit verwendete Fire-Palette: Gelb `#FDE047` bei 0, Orange `#F97316` bei 0,5 und Rot `#DC2626` bei 1. Es begrenzt Positionen auf den Bereich 0 bis 1. `index.html` lädt `distribution-utils.js` vor `dashboard-equipment.js`.
- **Alternatives considered**: Eine zweite lokale RGB-Interpolation würde Palette und Zwischenfarben duplizieren und könnte mit Distributions/Pie Charts auseinanderlaufen. Ein neues Utility wäre für eine einzelne Darstellung unnötig.

## Entscheidung: vorhandene relative Geschwindigkeit als Farbrichtung nutzen

- **Decision**: Verwende `barValue` aus `buildEquipmentPaceDisplay` als Position im Fire-Verlauf.
- **Rationale**: `barValue` ist die relative Geschwindigkeit gegenüber dem schnellsten Equipment desselben Typs. Ein höherer Wert steht sowohl bei Schuhen (niedrigere Zeit pro Strecke) als auch bei Rädern (höhere Geschwindigkeit) für schneller. Die Pace-Aggregation und Zahlenwerte müssen nicht verändert werden.
- **Alternatives considered**: Farbgebung aus den angezeigten Pace-Texten abzuleiten wäre fehleranfällig und könnte die unterschiedliche Richtungssemantik von Schuhen und Rädern vermischen.

## Entscheidung: Fire nur in den einzeln gefilterten Pace-Ansichten

- **Decision**: Verwende die Fire-Farben nur für `Pace` mit Filter `Shoes` oder `Bikes`. Bewahre in `All` die bisherigen Lila-/Türkisfarben und bei anderen Kennzahlen die bisherigen Equipment-Typfarben.
- **Rationale**: Die geklärte Spec priorisiert die Unterscheidbarkeit von Schuhen und Rädern in der gemischten Ansicht. Der bestehende Erklärungstext weist bereits darauf hin, dass beide Typen nicht direkt vergleichbar sind.
- **Alternatives considered**: Fire in `All` würde das vorhandene Typfarbsignal ersetzen; unterschiedliche Fire-Varianten pro Typ würden eine neue, nicht angefragte Farblogik einführen.

## Testansatz

- **Decision**: Erweitere `__tests__/dashboard-equipment.test.js`, indem der bestehende Chart-Harness die Fire-Funktion bereitstellt und `backgroundColor` geprüft wird.
- **Rationale**: Der Test kann Chart-Daten und Optionen ohne Browser oder jsdom inspizieren. Er prüft langsamer/schneller, Schuhe/Räder separat, `All`-Farben und unveränderte Nicht-Pace-Kennzahlen.
- **Alternatives considered**: Ein neuer Testlaufzeit- oder Browser-Test-Stack wäre für diese reine Chart-Konfiguration außerhalb des Projektmusters.