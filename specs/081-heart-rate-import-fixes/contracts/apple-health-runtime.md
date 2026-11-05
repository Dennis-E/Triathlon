# Contract: Apple Health Runtime and Safe Diagnostics

## 1. Unterstuetzte Bereitstellung

| Bereitstellung / Kontext | Verhalten |
|-------------------------|-----------|
| HTTPS, tatsaechlich sicherer Kontext, benoetigte Funktionen im Arbeitskontext verfuegbar | Import zulassen. |
| HTTP auf localhost, IPv4- oder IPv6-Loopback, tatsaechlich sicherer Kontext | Import zulassen. |
| `file:` oder anderes nicht unterstuetztes Schema | `UNSUPPORTED_DEPLOYMENT`; lokale HTTP-/HTTPS-Anleitung. |
| Unsicherer Kontext / Remote-HTTP | `INSECURE_CONTEXT`; sichere Bereitstellung nennen, keine Browserveraltung behaupten. |
| Unterstuetzte Bereitstellung, aber konkret benoetigte Funktion fehlt | `MISSING_CAPABILITY` mit begrenzter sicherer Funktionsliste. |

Browsername allein entscheidet nichts. Fenster und tatsaechlicher Worker-Kontext werden getrennt geprueft. In Worker benoetigte Text-/Stream-/Abbruchfunktionen sowie WebCrypto SHA-256 muessen vorhanden und verwendbar sein. Kein unsicherer Hashersatz, kein pauschales Abschalten von Sicherheitspruefungen und kein stiller Main-Thread-Fallback fuer riesige Archive.

## 2. Sicherer Diagnosevertrag

`AppleRuntimeDiagnostic` ist lokal und versioniert:

| Feld | Erlaubte Werte |
|------|----------------|
| `v` | `1`. |
| `code` | Code aus der untenstehenden Taxonomie oder erhaltener vorhandener Archiv-/XML-/Limit-/Abbruchcode. |
| `phase` | `preflight`, `worker-start`, `dependencies`, `capabilities`, `hashing`, `parsing`, `result`, `commit`. |
| `component` | `deployment`, `worker`, `stream`, `text`, `zip`, `sax`, `crypto`, `protocol`, `importer`. |
| `generation` | Vorhandene nichtnegative Importgeneration. |
| `environment` | `{ scheme, hostClass, secureContext, realm }`, ausschliesslich Enums/Booleans. |
| `missingCapabilities` | Begrenztes eindeutiges Array fester Namen tatsaechlich benoetigter Funktionen. |
| `action` | `serve-local`, `use-secure-origin`, `retry`, `use-supported-environment`, `select-valid-export`, `report-safe-diagnostic`, `none`. |

`scheme`: `http`, `https`, `file`, `other`. `hostClass`: `loopback`, `remote`, `none`. `realm`: `window`, `worker`. Keine vollstaendige URL, kein Hostname, User-Agent, lokaler Pfad, Dateiname, Gesundheitswert, Trainingsdatum, Quell-ID, Rohstack oder frei uebernommene Exceptionmeldung. Empfangene Diagnosen im Fenster gegen dieselbe Allowlist validieren und auf feste Hoechstzahlen/Laengen begrenzen. Keine automatischen Diagnoseuploads.

## 3. Fehlerklassen und Abhilfe

| Code | Ursache / Aktion |
|------|------------------|
| `UNSUPPORTED_DEPLOYMENT` | Nicht unterstuetzte Bereitstellung; `serve-local`. |
| `INSECURE_CONTEXT` | Sicherheitsvoraussetzung fehlt; `use-secure-origin`. |
| `MISSING_CAPABILITY` | Konkrete erforderliche Funktion fehlt; `use-supported-environment`. |
| `DEPENDENCY_LOAD_FAILED` | Importbibliothek konnte nicht geladen werden; `retry`, ggf. Verbindung pruefen. |
| `DEPENDENCY_INVALID` | Bibliothek geladen, aber benoetigte Exports fehlen; `retry` oder sicherer Diagnosehinweis. |
| `WORKER_START_FAILED` | Konstruktor/Start vor Initialisierung gescheitert; keine unbelegte CSP-/Netzwerkbehauptung. |
| `WORKER_INIT_TIMEOUT` | Nach 30 Sekunden kein gueltiges `ready`; `retry`. |
| `WORKER_RUNTIME_FAILED` | Worker nach Start unerwartet gescheitert; `retry`/sicherer Diagnosehinweis. |
| `WORKER_PROTOCOL_ERROR` | Aktuelle Nachricht strukturell ungueltig, Clone-/Transport-/`messageerror` oder ungueltiges Ergebnis; kein Archivfehler ohne Inputnachweis. |
| `HASH_FAILED` | Vorhandene sichere SHA-256-Funktion scheitert; keine Ersatzidentitaet erzeugen. |
| `INTERNAL_ERROR` | Unerwarteter Programm-/Initialisierungsfehler; keine pauschale Beschuldigung von Archiv oder Browser. |

Bestehende `INVALID_ARCHIVE`, Export-/XML-/Encoding-/Ressourcen-/No-workout-Codes und `CANCELLED` bleiben fachlich erhalten. Echte Decoder-/CRC-/XML-Ablehnungen bleiben Eingabefehler; unerwartete Typ-/Programmierfehler nicht beliebig dorthin normalisieren. Die bisherige `failure`-Signatur bleibt kompatibel; spezifische aktive Fehlerpfade werden am Besitzer aufgeloest statt durch einen riskanten globalen Defaultwechsel. Der alte Sammelcode kann fuer Kompatibilitaet weiter existieren, darf aber neue erkannte Ursachen nicht verdecken.

Kein Code darf behaupten, ob eine konkrete Sicherheitsrichtlinie, ein Netzwerkdienst oder eine Browserversion schuld ist, wenn nur ein unspezifisches Fehlerereignis vorliegt. Abhilfe muss zur belegten Klasse passen. Das bestehende Dashboard bleibt bei jedem Fehler vor Commit erhalten.

## 4. Versionierter Worker-Handshake

Geplante Nachrichten, jeweils mit `v: 1` und der bestehenden `generation`:

1. Fenster erstellt Worker nach Preflight und sendet `init` ohne Gesundheitsdatei.
2. Worker laedt bestehende Abhaengigkeiten, prueft alle tatsaechlich verwendeten ZIP-/SAX-Exports, Text-/Streamfunktionen und sichere SHA-256-Verfuegbarkeit. Eine lokale konstante Hashprobe darf die Benutzbarkeit bestaetigen, ohne Nutzerdaten zu verarbeiten.
3. Worker sendet `ready` oder `error` mit sicherer Diagnose. Erst nach gueltigem `ready` sendet das Fenster `start` mit der ausgewaehlten Datei.
4. Verarbeitung liefert die bestehenden `progress`, `complete` oder sicheren `error`-Nachrichten mit unveraenderter Ergebnis-/Transfersemantik. Eine veraltete Generation darf nicht committen.
5. Initialisierungswatchdog endet bei `ready`; es gibt kein neues pauschales Zeitlimit fuer den laufenden grossen Export. Bestehende Fortschritts-/Abbruch-/Ressourcenregeln bleiben bestehen.

Worker-Konstruktor und jeder `postMessage`-Aufruf werden abgefangen. Ein gemeinsamer idempotenter Abschluss beendet Worker, Heartbeat und Watchdog genau einmal und entfernt Handler. Abbruch, Workerfehler, ungueltige Nachrichten und Clonefehler gelangen ueber diesen Pfad. Fremde/veraltete Generationen werden nicht als aktuelles Ergebnis akzeptiert. Eine bewusste Wiederholung beginnt mit neuem Worker und neuer Generation; kein automatischer Grossimport-Retry.

Der existierende atomare `applyImportedDataset`-Commit wird nicht vorgezogen. Failure/Cancel vor einem gueltigen vorbereiteten Ergebnis erhalten alte Daten, Filter, Charts und Exporte. Ein laufender neuerer Import darf nicht durch alte Ergebnisse oder alte Fehler ersetzt werden.

## 5. Erforderliche Nachweise

Die bisherigen Node-/VM-/Fake-Worker-Tests pruefen einzelne Vertraege, ersetzen aber keinen echten Original-ZIP-Import. Erforderlich sind Chrome, Edge und VS Code jeweils ueber lokales HTTP sowie sichere HTTPS-Bereitstellung mit demselben Kandidatenstand, realer Dateiauswahl, echtem Worker-/Library-/SHA-256-Pfad und erwarteten Trainingsdaten.

Negative Faelle injizieren gezielt nur die jeweilige fehlende Voraussetzung: Deployment, Worker-/Stream-/Text-/Crypto-Funktion, blockierte Library, fehlender Export, kein Ready, Transportfehler, defektes Archiv und spaetes Ergebnis nach Abbruch. Richtiger Code, passende Abhilfe, Cleanup, unveraenderter Altstand und erfolgreicher nachfolgender Retry werden einzeln geprueft. Eine nicht verfuegbare Browser-/HTTPS-Umgebung ist unverifiziert, nicht durch einen anderen Chromium-Lauf ersetzt.