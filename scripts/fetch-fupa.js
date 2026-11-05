#!/usr/bin/env node
/**
 * FuPa Fetcher für FC ROT Prämienabrechnung
 * -------------------------------------------
 * Ruft die (inoffizielle) FuPa-API ab und schreibt data/fupa.json
 * im Format, das die Web-App importieren kann.
 *
 * Läuft serverseitig (GitHub Actions / Node) → kein CORS-Problem.
 *
 * Nutzung:
 *   node scripts/fetch-fupa.js <team-slug>
 *   node scripts/fetch-fupa.js fc-rot-m1-2026-27
 *
 * Ohne Argument wird TEAM_SLUG aus der Umgebungsvariable gelesen.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const API = 'https://api.fupa.net/v1';
const TEAM_SLUG = process.argv[2] || process.env.TEAM_SLUG || 'fc-rot-m1-2026-27';
const OUT_FILE = path.join(__dirname, '..', 'data', 'fupa.json');

// ─── kleine fetch-Hilfe mit Retry ──────────────────────────
async function getJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'FCRot-Praemien/1.0 (+github-actions)',
          'Accept': 'application/json'
        }
      });
      if (res.status === 404) return { __notFound: true };
      if (!res.ok) throw new Error(`HTTP ${res.status} für ${url}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

function weAreHomeTeam(match, ourTeamId) {
  return match.homeTeam?.teamId === ourTeamId || match.homeTeam?.id === ourTeamId;
}

// Ergebnis aus FC-ROT-Sicht bestimmen.
function resultFor(match, ourTeamId) {
  const h = match.homeGoal;
  const a = match.awayGoal;
  if (h == null || a == null) return null; // noch nicht gespielt
  const weAreHome = weAreHomeTeam(match, ourTeamId);
  const our   = weAreHome ? h : a;
  const their = weAreHome ? a : h;
  if (our > their) return 'win';
  if (our < their) return 'loss';
  return 'draw';
}

async function main() {
  console.log(`▶ FuPa-Abruf für Team-Slug: ${TEAM_SLUG}`);

  // 1) Team-Info (für teamId + Clubname)
  const team = await getJSON(`${API}/teams/${TEAM_SLUG}`);
  if (team.__notFound) {
    throw new Error(`Team "${TEAM_SLUG}" nicht gefunden. Slug prüfen (z.B. fc-rot-m1-2026-27).`);
  }
  const ourTeamId = team.teamId || team.id;
  console.log(`  Team: ${team.name?.full || team.name} (teamId ${ourTeamId})`);

  // 2) Kader abrufen
  const squad = await getJSON(`${API}/teams/${TEAM_SLUG}/squad`);
  const squadPlayers = (squad.players || [])
    .filter(p => !p.isDeactivated)
    .map(p => ({
      slug:      p.slug || '',
      firstName: p.firstName || '',
      lastName:  p.lastName || '',
      position:  p.position || '',
      number:    p.jerseyNumber ?? null
    }));
  console.log(`  Kader: ${squadPlayers.length} aktive Spieler`);

  // 3) Gespielte Spiele der Saison
  const pastMatches = await getJSON(`${API}/teams/${TEAM_SLUG}/matches?flavor=past`);
  const matchList = Array.isArray(pastMatches) ? pastMatches : [];
  console.log(`  Gespielte Spiele gesamt: ${matchList.length}`);

  const out = {
    team: TEAM_SLUG,
    generatedAt: new Date().toISOString(),
    players: squadPlayers,
    matches: []
  };

  let skippedNonLeague = 0;

  // 4) Für jedes Spiel die Aufstellung laden
  for (const m of matchList) {
    // NUR LIGASPIELE – Pokal (cup) und Freundschaftsspiele (testmatch)
    // geben keine Prämie. Auf m.category filtern, NICHT auf round.type
    // (Testspiele haben round.type 'league', aber category 'testmatch').
    if (m.category !== 'league') {
      skippedNonLeague++;
      console.log(`  ⤵ übersprungen (${m.category}): ${m.slug}`);
      continue;
    }

    // Nur abgeschlossene Spiele (section POST) berücksichtigen
    if (m.section && m.section !== 'POST') {
      console.log(`  ⤵ übersprungen (nicht beendet): ${m.slug}`);
      continue;
    }

    const weAreHome = weAreHomeTeam(m, ourTeamId);
    const opponent = weAreHome
      ? (m.awayTeam?.name?.full || m.awayTeam?.name || 'Unbekannt')
      : (m.homeTeam?.name?.full || m.homeTeam?.name || 'Unbekannt');

    const hScore = m.homeGoal;
    const aScore = m.awayGoal;
    const score = (hScore != null && aScore != null)
      ? (weAreHome ? `${hScore}:${aScore}` : `${aScore}:${hScore}`)
      : '';

    // Datum normalisieren → YYYY-MM-DD (kickoff ist ISO mit TZ)
    const date = String(m.kickoff || '').slice(0, 10);

    const entry = {
      id: m.id,
      slug: m.slug,
      date,
      opponent,
      isHome: weAreHome,
      result: resultFor(m, ourTeamId) || 'loss',
      score,
      lineup: []
    };

    // Aufstellung
    const lu = await getJSON(`${API}/matches/${m.slug}/lineup`);
    if (!lu.__notFound) {
      const ours = weAreHome ? lu.homeTeam : lu.awayTeam;
      (ours?.lineup || []).forEach(p => {
        entry.lineup.push({
          slug:          p.player?.slug || '',
          firstName:     p.player?.firstName || '',
          lastName:      p.player?.lastName || '',
          position:      p.position || '',
          starting:      !!p.starting,
          minutesPlayed: p.statistics?.minutes ?? 0,
          goals:         p.statistics?.goals ?? 0,
          yellowCard:    p.statistics?.yellowCard ?? 0,
          redCard:       p.statistics?.redCard ?? 0
        });
      });
    }

    console.log(`  ✓ ${date} vs ${opponent} (${score || '—'}) – ${entry.lineup.length} Spieler`);
    out.matches.push(entry);

    // höflich sein, API nicht hämmern
    await new Promise(r => setTimeout(r, 300));
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), 'utf8');
  console.log(`✅ Geschrieben: ${OUT_FILE}`);
  console.log(`   ${out.players.length} Spieler · ${out.matches.length} Ligaspiele · ${skippedNonLeague} Nicht-Liga-Spiele ignoriert`);
}

main().catch(err => {
  console.error('❌ Fehler:', err.message);
  process.exit(1);
});
