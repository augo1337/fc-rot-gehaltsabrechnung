# Setup: Gemeinsamer Zugriff für 3 Personen (Supabase + GitHub Pages)

Diese Anleitung macht aus der lokalen App eine **gemeinsam genutzte Web-App**:
feste URL, Login per gemeinsamem Passwort, alle sehen dieselben Daten in Echtzeit.

Du machst die Schritte **1–4** einmalig. Den Rest (Code) ist schon vorbereitet.

---

## 1. Supabase-Projekt anlegen

1. Auf <https://supabase.com> mit GitHub o. E-Mail registrieren (kostenlos).
2. **New Project** → Name z. B. `fc-rot-praemien`, Region **Frankfurt (eu-central-1)**.
3. Ein Datenbank-Passwort vergeben (brauchst du später nicht in der App – nur fürs Projekt).
4. Warten bis das Projekt bereit ist (~1 Min).

## 2. Datenbank-Schema einspielen

1. Links im Menü **SQL Editor** öffnen.
2. Inhalt der Datei [`supabase-schema.sql`](supabase-schema.sql) komplett hineinkopieren.
3. **Run** klicken. Es sollte „Success" erscheinen.

## 3. Gemeinsamen Login-User anlegen (= euer Passwort)

1. Links **Authentication** → **Users** → **Add user** → **Create new user**.
2. **Email:** `team@fcrot.app`  (genau so – dieselbe Adresse nutzt die App intern)
3. **Password:** euer **gemeinsames Passwort** (das geben alle 3 später ein).
4. **Auto Confirm User:** ✅ **aktivieren** (wichtig, sonst kein Login möglich).
5. **Create user**.

> Optional (empfohlen): **Authentication → Sign In / Providers → Email** →
> „Allow new users to sign up" **ausschalten**. Dann kann sich niemand selbst
> registrieren; nur der angelegte Team-User existiert.

## 4. Schlüssel kopieren

1. Links **Project Settings** (Zahnrad) → **API**.
2. Kopiere:
   - **Project URL** (z. B. `https://abcd1234.supabase.co`)
   - **anon public** Key (langer Schlüssel unter „Project API keys")

Diese zwei Werte **mir geben** – ich trage sie in die App ein (`index.html`,
Abschnitt „SUPABASE-KONFIGURATION" oben im Script). Danach schaltet die App
automatisch vom lokalen in den Cloud-Modus.

> Die Werte sind nicht geheim – der „anon"-Key ist für den Browser gedacht und
> durch die Zugriffsregeln (RLS) + Login abgesichert.

---

## 5. Veröffentlichen (GitHub Pages)

Sobald die Keys eingetragen sind:

1. Repo auf **public** stellen: GitHub → Repo → **Settings → General → Danger Zone →
   Change visibility → Public**.
2. **Settings → Pages → Source: „Deploy from a branch" → Branch `main` / `/root` → Save.**
3. Nach ~1 Min ist die App unter
   `https://augo1337.github.io/fc-rot-gehaltsabrechnung/` erreichbar.
4. Diese URL + das gemeinsame Passwort an die 3 Personen geben. Fertig.

---

## Wie es dann läuft

- Jeder öffnet die URL → gibt das gemeinsame Passwort ein → sieht dieselben Daten.
- Ändert einer etwas (Prämie, Spieltag, FuPa-Sync), erscheint es bei den anderen
  automatisch (Echtzeit).
- Der FuPa-Abruf (GitHub Actions, `data/fupa.json`) funktioniert wie gehabt;
  „FuPa-Daten laden" in der App spielt die Spieltage ein.

## Hinweis zu gleichzeitigem Bearbeiten

Die Daten werden als Ganzes gespeichert (ein JSON-Stand). Wenn zwei Personen
**exakt gleichzeitig** speichern, gewinnt der letzte Speichervorgang. Bei 3
Trainern, die selten zur selben Sekunde tippen, ist das unkritisch. Falls es
später doch stört, stellen wir auf feldweises Speichern um.
