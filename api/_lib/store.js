/* ============================================================
   SalderingsDienst — api/_lib/store.js
   Opslag-adapter voor boekingen. Kies de backend via env vars:

   1. Supabase (in gebruik):
        SUPABASE_URL=https://xxxx.supabase.co
        SUPABASE_ANON_KEY=sb_publishable_...   (schrijven; RLS laat alleen
                                                insert toe, niet lezen)
        SD_READ_SECRET=...                     (lezen via rpc sd_list_bookings)
      Of, als alternatief voor die laatste twee:
        SUPABASE_SERVICE_ROLE_KEY=eyJ...       (lezen en schrijven ineens)
      Tabel aanmaken (SQL editor in Supabase):
        create table if not exists sd_bookings (
          ref text primary key,
          created_at timestamptz not null default now(),
          naam text, email text, tel text,
          date_iso text, time text, mode text,
          briefcode text, sendinfo boolean default false,
          status text, verkoopbaar boolean default false,
          qualification jsonb, source jsonb, raw jsonb
        );

   2. Postgres (Vercel Postgres / Neon):
        DATABASE_URL=postgres://...
      De tabel wordt automatisch aangemaakt bij de eerste insert.

   3. Geen van beide gezet → in-memory fallback (niet persistent;
      alleen voor lokaal testen). De POST slaagt dan wel, zodat de
      bezoeker nooit een kapot formulier ziet.
   ============================================================ */
'use strict';

var MEM = global.__sdBookings = global.__sdBookings || [];

function rowFromLead(lead) {
  return {
    ref: lead.ref,
    naam: (lead.contact && lead.contact.naam) || null,
    email: (lead.contact && lead.contact.email) || null,
    tel: (lead.contact && lead.contact.tel) || null,
    date_iso: (lead.appointment && lead.appointment.dateIso) || null,
    time: (lead.appointment && lead.appointment.time) || null,
    mode: (lead.appointment && lead.appointment.mode) || null,
    briefcode: lead.briefcode || null,
    sendinfo: !!(lead.consent && lead.consent.infoEmail),
    status: lead.status || 'niet_gekwalificeerd',
    verkoopbaar: lead.status === 'warm_gekwalificeerd',
    qualification: lead.qualification || {},
    source: lead.source || {},
    raw: lead
  };
}

/* ---------- Supabase (REST, geen dependencies) ---------- */
function supabaseCfg() {
  var url = process.env.SUPABASE_URL;
  var service = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
  var key = service || process.env.SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ''), key: key, service: !!service };
}
async function supabaseSave(row) {
  var cfg = supabaseCfg();
  /* Bewust een gewone insert, geen upsert: een upsert vraagt in Supabase ook
     leesrechten, en de publieke sleutel mag alleen schrijven. Komt dezelfde
     referentie twee keer binnen (bezoeker die opnieuw verstuurt), dan geeft
     Postgres 23505 en beschouwen we de lead als al opgeslagen. */
  var res = await fetch(cfg.url + '/rest/v1/sd_bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: cfg.key,
      Authorization: 'Bearer ' + cfg.key,
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(row)
  });
  if (res.ok) return;
  var tekst = await res.text();
  if (res.status === 409 || tekst.indexOf('23505') !== -1) return;
  throw new Error('Supabase insert mislukt: ' + res.status + ' ' + tekst.slice(0, 300));
}
async function supabaseList(limit) {
  var cfg = supabaseCfg();
  /* Met de service role key mag er rechtstreeks worden gelezen. Draaien we
     op de anon key, dan blokkeert RLS het lezen bewust: de lijst komt dan
     via de RPC sd_list_bookings, die eerst SD_READ_SECRET controleert. */
  if (!cfg.service) {
    var geheim = process.env.SD_READ_SECRET || '';
    if (!geheim) throw new Error('SD_READ_SECRET ontbreekt (nodig om te lezen zonder service role key).');
    var rpc = await fetch(cfg.url + '/rest/v1/rpc/sd_list_bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: cfg.key,
        Authorization: 'Bearer ' + cfg.key
      },
      body: JSON.stringify({ p_secret: geheim, p_limit: limit })
    });
    if (!rpc.ok) throw new Error('Supabase rpc mislukt: ' + rpc.status + ' ' + (await rpc.text()).slice(0, 200));
    return rpc.json();
  }
  var res = await fetch(cfg.url + '/rest/v1/sd_bookings?select=*&order=created_at.desc&limit=' + limit, {
    headers: { apikey: cfg.key, Authorization: 'Bearer ' + cfg.key }
  });
  if (!res.ok) throw new Error('Supabase select mislukt: ' + res.status);
  return res.json();
}

/* ---------- Postgres (Vercel Postgres / Neon via HTTP-driver) ---------- */
function pgUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || null;
}
var pgReady = false;
async function pgSql() {
  var mod = require('@neondatabase/serverless');
  var sql = mod.neon(pgUrl());
  if (!pgReady) {
    await sql`create table if not exists sd_bookings (
      ref text primary key,
      created_at timestamptz not null default now(),
      naam text, email text, tel text,
      date_iso text, "time" text, mode text,
      briefcode text, sendinfo boolean default false,
      status text, verkoopbaar boolean default false,
      qualification jsonb, source jsonb, raw jsonb
    )`;
    pgReady = true;
  }
  return sql;
}
async function pgSave(row) {
  var sql = await pgSql();
  await sql`insert into sd_bookings
    (ref, naam, email, tel, date_iso, "time", mode, briefcode, sendinfo, status, verkoopbaar, qualification, source, raw)
    values (${row.ref}, ${row.naam}, ${row.email}, ${row.tel}, ${row.date_iso}, ${row.time}, ${row.mode},
            ${row.briefcode}, ${row.sendinfo}, ${row.status}, ${row.verkoopbaar},
            ${JSON.stringify(row.qualification)}, ${JSON.stringify(row.source)}, ${JSON.stringify(row.raw)})
    on conflict (ref) do update set
      naam = excluded.naam, email = excluded.email, tel = excluded.tel,
      date_iso = excluded.date_iso, "time" = excluded."time", mode = excluded.mode,
      briefcode = excluded.briefcode, sendinfo = excluded.sendinfo,
      status = excluded.status, verkoopbaar = excluded.verkoopbaar,
      qualification = excluded.qualification, source = excluded.source, raw = excluded.raw`;
}
async function pgList(limit) {
  var sql = await pgSql();
  return sql`select * from sd_bookings order by created_at desc limit ${limit}`;
}

/* ---------- Publieke API ---------- */
function backendName() {
  if (supabaseCfg()) return 'supabase';
  if (pgUrl()) return 'postgres';
  return 'memory';
}

async function saveBooking(lead) {
  var row = rowFromLead(lead);
  var backend = backendName();
  if (backend === 'supabase') { await supabaseSave(row); return { backend: backend }; }
  if (backend === 'postgres') { await pgSave(row); return { backend: backend }; }
  var i = MEM.findIndex(function (r) { return r.ref === row.ref; });
  row.created_at = new Date().toISOString();
  if (i !== -1) MEM[i] = row; else MEM.unshift(row);
  if (MEM.length > 500) MEM.length = 500;
  return { backend: backend };
}

async function listBookings(limit) {
  limit = Math.min(Math.max(parseInt(limit, 10) || 200, 1), 500);
  var backend = backendName();
  if (backend === 'supabase') return { backend: backend, rows: await supabaseList(limit) };
  if (backend === 'postgres') return { backend: backend, rows: await pgList(limit) };
  return { backend: backend, rows: MEM.slice(0, limit) };
}

module.exports = { saveBooking: saveBooking, listBookings: listBookings, backendName: backendName };
