# Quickstart: Validierung der Inline-Script-Aufteilung

Diese Anleitung beschreibt, wie nach der Umsetzung geprüft wird, dass die Aufteilung des
Inline-Scripts keine sichtbaren Verhaltensänderungen verursacht hat und die Testsuite grün bleibt.

## Voraussetzungen

- Node.js + npm installiert (für `npm test`)
- Python 3 installiert (für den statischen Dev-Server)
- Eine synthetische oder lokal vorhandene Strava-CSV/ZIP-Testdatei zum manuellen Import
  (siehe [docs/TESTING.md](../../docs/TESTING.md); **keine echten privaten Exportdaten committen**)

## 1. Automatisierte Tests

```powershell
# Root-Testsuite (Jest, node-Environment)
npm test

# API-Testsuite (unverändert von diesem Feature betroffen, aber zur Sicherheit)
cd services/api
npm test
cd ../..
```

**Erwartetes Ergebnis**: Alle Tests grün, insbesondere
[__tests__/index-script-syntax.test.js](../../__tests__/index-script-syntax.test.js), das jetzt
zusätzlich alle `src/dashboard-*.js`-Dateien auf Syntaxfehler prüft.

## 2. Regressionstest für den Syntax-Check (SC-005)

```powershell
# Absichtlich einen Syntaxfehler in eine neue Datei einfügen, z. B.:
# echo "function broken( {" >> src/dashboard-equipment.js
npm test -- index-script-syntax
# Erwartung: Test schlägt fehl und benennt die betroffene Datei/den betroffenen Codeblock.
# Änderung danach wieder rückgängig machen (git checkout -- src/dashboard-equipment.js).
```

## 3. Manueller Durchlauf der Kernabläufe

1. Statischen Server starten:
   ```powershell
   python -m http.server
   ```
2. `http://localhost:8000` im Browser öffnen, Entwicklerkonsole offen halten.
3. **Konsole prüfen**: Keine `ReferenceError`/`is not defined`-Meldungen beim Laden
   (bestätigt die Ladereihenfolge aus [contracts/script-load-order.md](./contracts/script-load-order.md)).
4. **Import-Flow**: Eine Test-CSV/ZIP importieren → Import-Fortschritts-Modal erscheint und
   schließt sich korrekt, Dashboard und alle Tabs füllen sich mit Daten.
5. **Tab-Wechsel**: Nacheinander zu Equipment, Distributions, Scatter, Heatmap und Power PBs
   wechseln → jeweiliges Diagramm rendert wie vor der Umstrukturierung (Vergleich mit
   vorherigem Verhalten, z. B. via Screenshot oder Erinnerung an bekannten Zustand).
6. **Power-PB-Detail**: Ein PB-Detail-Overlay öffnen und mit Escape schließen (prüft die
   Kopplung zum bestehenden Imprint/Privacy-Modal-Block, siehe research.md Entscheidung 8).
7. **Export**: Für mindestens einen Tab die Export-Vorschau öffnen, prüfen, dass Bild-Komposition
   und Download wie gewohnt funktionieren, dann schließen.
8. **Modals**: Preview-Gate-Modal (durch Aufruf ohne vorherigen Import), Imprint-Modal und
   Privacy-Policy-Modal öffnen/schließen → identisches Verhalten wie vor der Umstrukturierung.
9. **Größenkontrolle** (SC-001/SC-007): `index.html` öffnen und bestätigen, dass kein
   mehrere-tausend-Zeilen-Inline-`<script>`-Block mehr vorhanden ist.

## 4. Abnahmekriterien (Zusammenfassung)

- [ ] `npm test` (Root) grün
- [ ] `npm test` (services/api) grün
- [ ] Absichtlicher Syntaxfehler in einer neuen Datei lässt den Syntax-Test fehlschlagen
- [ ] Keine Konsolenfehler beim Laden von `index.html`
- [ ] Import, alle Chart-Tabs, PB-Detail, Export und alle Modals verhalten sich unverändert
- [ ] `index.html` enthält keinen dominanten Inline-Script-Block mehr
