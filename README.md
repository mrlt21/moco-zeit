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
