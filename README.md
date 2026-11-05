# FC ROT – Prämienabrechnung

Web-App zur automatisierten Berechnung von Spieler-Prämien für den FC Rot (St. Leon-Rot).
Läuft komplett im Browser, Daten werden lokal (`localStorage`) gespeichert. Spieltags- und
Aufstellungsdaten können automatisch von [FuPa](https://www.fupa.net/club/fc-rot) geholt werden.

## Live-App

👉 **https://augo1337.github.io/fc-rot-praemien/** (nach Aktivierung von GitHub Pages)

## Funktionen

- **Einstellungen**: Sieg-, Unentschieden- und Bankprämie je Saison pflegen
- **Spieler**: Kader mit individueller Einsatzprämie verwalten
- **Spieltage**: Ergebnis + Aufstellung erfassen (manuell oder per FuPa-Import)
- **Abrechnung**: Zeitraum (von–bis) wählen → Auszahlung pro Spieler berechnen
- **Druck**: individuelle Monatsübersicht pro Spieler als Druckvorlage mit Unterschriftsfeldern

### Prämienlogik

| Situation | Prämie |
|---|---|
| Sieg (Startelf oder Einwechslung vor Min. 46) | volle Siegprämie + volle Einsatzprämie |
| Unentschieden (dito) | volle Unentschieden-Prämie + volle Einsatzprämie |
| Niederlage | nur Einsatzprämie |
| Einwechslung **ab Minute 46** | **50 %** der Punkt- **und** Einsatzprämie |
| Ganzes Spiel auf der Bank (nicht eingewechselt) | fixe Bankprämie |

## FuPa-Datenabruf (automatisch)

FuPa bietet keine offizielle API, aber die interne REST-Schnittstelle (`api.fupa.net/v1`)
ist serverseitig abrufbar. Ein direkter Aufruf aus dem Browser scheitert an CORS – deshalb
läuft der Abruf über **GitHub Actions**:

```
Button "Run workflow" (oder Montag 06:00 UTC)
   └─> scripts/fetch-fupa.js holt Spiele + Aufstellungen
         └─> schreibt data/fupa.json und committet es
               └─> App liest data/fupa.json per "FuPa-Daten laden"
```

### Workflow manuell starten

1. Tab **Actions** → **FuPa-Daten abrufen** → **Run workflow**
2. Team-Slug eingeben (z. B. `fc-rot-m1-2026-27`) → ausführen
3. In der App auf **„FuPa-Daten laden"** klicken

Der Team-Slug ändert sich jede Saison. Den aktuellen findest du auf der
[FuPa-Vereinsseite](https://www.fupa.net/club/fc-rot) in der Team-URL.

### Lokal testen

```bash
node scripts/fetch-fupa.js fc-rot-m1-2026-27
# erzeugt data/fupa.json
python -m http.server 8900
# App unter http://localhost:8900/index.html
```

## Spielerzuordnung beim Import

FuPa-Spieler werden der App zugeordnet über:
1. **FuPa-Slug** (falls im Spielerprofil hinterlegt) – eindeutig
2. **Name** (Vor- + Nachname, Groß-/Kleinschreibung egal) – Fallback

Nicht zuordenbare Spieler werden nach dem Import aufgelistet. Trage dann den FuPa-Slug
im jeweiligen Spielerprofil nach.

## Datensicherung

Tab **Einstellungen → Daten verwalten**: Export/Import als JSON zur Sicherung oder
Weitergabe zwischen Geräten. Alle Daten liegen sonst nur im Browser (`localStorage`).

## GitHub Pages aktivieren

**Settings → Pages → Source: „Deploy from a branch" → Branch `main` / `/root`.**
Die App ist dann unter `https://<user>.github.io/<repo>/` erreichbar.
