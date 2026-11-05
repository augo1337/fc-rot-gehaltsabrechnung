-- ════════════════════════════════════════════════════════════
--  FC ROT Prämienabrechnung – Supabase-Datenbankschema
--  Im Supabase-Dashboard unter  SQL Editor  einfügen und ausführen.
-- ════════════════════════════════════════════════════════════

-- Ein einziger Datensatz hält den kompletten App-Zustand als JSON.
create table if not exists app_state (
  id         int primary key default 1,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

-- Startzeile anlegen (leer).
insert into app_state (id, data) values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- Row Level Security aktivieren.
alter table app_state enable row level security;

-- Nur ANGEMELDETE Nutzer dürfen lesen und schreiben.
-- Der öffentliche "anon"-Key allein reicht NICHT – man muss eingeloggt sein
-- (= gemeinsames Passwort des angelegten Users).
drop policy if exists "read for authenticated"   on app_state;
drop policy if exists "update for authenticated" on app_state;
drop policy if exists "insert for authenticated" on app_state;

create policy "read for authenticated"
  on app_state for select to authenticated using (true);

create policy "update for authenticated"
  on app_state for update to authenticated using (true) with check (true);

create policy "insert for authenticated"
  on app_state for insert to authenticated with check (true);

-- Echtzeit-Updates für die Tabelle aktivieren (damit alle 3 live synchron sind).
alter publication supabase_realtime add table app_state;
