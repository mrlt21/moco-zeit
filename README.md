# Moco Zeiterfassung (Web)

Statische Single-Page-App, die Zeiterfassungs-CSV-Exporte in zwei Moco-Instanzen bucht.
Läuft komplett im Browser und ruft die Moco-API direkt auf (CORS ist erlaubt) – kein Server, kein Backend.

- **Moco-Tokens** liegen nur im Browser (localStorage) und gehen ausschließlich direkt an Moco.
- **Projekt-/Task-Zuordnung** wird über einen Lesezeichen-Link (`#cfg=…`, base64) geladen und im Browser gemerkt.
  Sie steht bewusst **nicht** in diesem öffentlichen Repo.

## Nutzung
1. Seite öffnen (am besten über das synchronisierte Lesezeichen, das die Zuordnung mitbringt).
2. Unter *Einstellungen* die beiden Moco-Tokens eintragen.
3. CSV ins Fenster ziehen, Plan prüfen, *Ausgewählte buchen*.

## Sicherheit & Robustheit
- **Idempotentes Buchen**: vor jedem POST werden die eigenen Einträge des Zeitraums frisch geprüft; exakte Treffer (Projekt+Task+Datum+Stunden) werden übersprungen – kein Doppelbuchen bei Doppelklick oder verlorener Antwort.
- **Rückgängig**: die zuletzt gebuchten Einträge lassen sich per Klick wieder löschen (`DELETE`), solange die Seite offen ist.
- **Plan-Persistenz**: Bearbeitungen überleben einen Reload (localStorage), *Andere CSV laden* verwirft sie.
- **Dublettencheck nur gegen eigene Einträge** (per `user_id`), nicht das ganze Team.
- **Robuste Reads**: Timeout + Retry (nur GET) bei 429/5xx, Projektlisten paginiert, Reads parallelisiert.
- **CSP** schränkt Verbindungen auf die beiden Moco-Domains ein (Defense-in-Depth für das Token).

## Tests
Die reine Plan-Logik (CSV-Parsing, Gruppierung, Aufschlag, Task-Matching) wird direkt aus `index.html`
extrahiert und getestet – Single Source of Truth, kein Build-Schritt:

```bash
node tests/logic.test.mjs
```

Läuft zusätzlich bei jedem Push via GitHub Actions (`.github/workflows/test.yml`).
