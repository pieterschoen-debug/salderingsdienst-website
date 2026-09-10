/* ============================================================
   SalderingsDienst — api/bookings.js
   POST  → boeking (schema sd.lead.v1) opslaan met kwalificatie
           en afgeleide status. Publiek, met rate limiting.
   GET   → overzicht voor het /portal (wachtwoordbeveiligd).

   De status wordt hier server-side OPNIEUW afgeleid uit het
   qualification-object; het front-end oordeel wordt niet blind
   vertrouwd. Alleen 'warm_gekwalificeerd' is verkoopbaar aan de
   doorverkoop-route.
   ============================================================ */
'use strict';

var store = require('./_lib/store');
var auth = require('./_lib/auth');
var rate = require('./_lib/ratelimit');
var pipedrive = require('./_lib/pipedrive');

function deriveStatus(q) {
  if (!q || typeof q !== 'object') return 'niet_gekwalificeerd';
  var ok = Array.isArray(q.productinteresse) && q.productinteresse.length > 0 &&
    q.koopwoning === true &&
    q.afspraakBevestigd === true &&
    q.beideBeslissersAanwezig === true &&
    (q.jongerDan75 === true || q.eigenInvestering === true) &&
    q.verwachtingBegrepen === true;
  return ok ? 'warm_gekwalificeerd' : 'niet_gekwalificeerd';
}

function readJson(req, maxBytes) {
  return new Promise(function (resolve, reject) {
    if (req.body !== undefined) {
      /* Vercel parseert JSON-bodies al */
      resolve(typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}));
      return;
    }
    var size = 0; var chunks = [];
    req.on('data', function (c) {
      size += c.length;
      if (size > maxBytes) { reject(new Error('body te groot')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', function () {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'POST') {
    if (!rate.allow(req, 'bookings', 10, 60000)) {
      res.statusCode = 429;
      return res.end(JSON.stringify({ ok: false, error: 'Te veel verzoeken, probeer het zo weer.' }));
    }
    var lead;
    try { lead = await readJson(req, 64 * 1024); }
    catch (e) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ ok: false, error: 'Ongeldige JSON.' }));
    }
    if (!lead || lead.schema !== 'sd.lead.v1' || !lead.ref ||
        !lead.contact || !lead.contact.naam || !lead.contact.email) {
      res.statusCode = 422;
      return res.end(JSON.stringify({ ok: false, error: 'Onvolledige lead (schema sd.lead.v1 vereist).' }));
    }
    if (!/^[A-Z0-9-]{4,40}$/i.test(String(lead.ref))) {
      res.statusCode = 422;
      return res.end(JSON.stringify({ ok: false, error: 'Ongeldige referentie.' }));
    }
    /* Status server-side afleiden; front-end waarde negeren */
    lead.status = deriveStatus(lead.qualification);
    try {
      var saved = await store.saveBooking(lead);
      /* Pipedrive is bewust de tweede stap: de lead staat al vast in de
         opslag hierboven. syncBooking gooit nooit, dus een storing bij
         Pipedrive levert de bezoeker geen foutmelding op. */
      var pd = await pipedrive.syncBooking(lead);
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: true, ref: lead.ref, status: lead.status, backend: saved.backend, crm: !!(pd && pd.ok) }));
    } catch (e) {
      console.error('bookings save error:', e && e.message);
      res.statusCode = 500;
      return res.end(JSON.stringify({ ok: false, error: 'Opslaan mislukt. De lead staat nog in de lokale wachtrij van de bezoeker.' }));
    }
  }

  if (req.method === 'GET') {
    if (!auth.hasPassword()) {
      res.statusCode = 503;
      return res.end(JSON.stringify({ ok: false, error: 'PORTAL_PASSWORD is nog niet ingesteld in de omgeving.' }));
    }
    if (!auth.isAuthed(req)) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ ok: false, error: 'Niet ingelogd.' }));
    }
    try {
      var out = await store.listBookings(req.query && req.query.limit);
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ ok: true, backend: out.backend, bookings: out.rows }));
    } catch (e) {
      console.error('bookings list error:', e && e.message);
      res.statusCode = 500;
      return res.end(JSON.stringify({ ok: false, error: 'Ophalen mislukt: ' + (e && e.message) }));
    }
  }

  res.statusCode = 405;
  res.setHeader('Allow', 'GET, POST');
  res.end(JSON.stringify({ ok: false, error: 'Methode niet toegestaan.' }));
};
