/* ============================================================
   SalderingsDienst — api/portal-login.js
   POST {password}          → zet beveiligde sessiecookie
   POST {logout: true}      → verwijdert de cookie
   GET                      → { authed: true/false }
   ============================================================ */
'use strict';

var auth = require('./_lib/auth');
var rate = require('./_lib/ratelimit');

function readJson(req) {
  return new Promise(function (resolve, reject) {
    if (req.body !== undefined) {
      resolve(typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}));
      return;
    }
    var chunks = []; var size = 0;
    req.on('data', function (c) {
      size += c.length;
      if (size > 4096) { reject(new Error('te groot')); req.destroy(); return; }
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
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    return res.end(JSON.stringify({ ok: true, authed: auth.isAuthed(req), configured: auth.hasPassword() }));
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, POST');
    return res.end(JSON.stringify({ ok: false, error: 'Methode niet toegestaan.' }));
  }

  var body;
  try { body = await readJson(req); }
  catch (e) { res.statusCode = 400; return res.end(JSON.stringify({ ok: false, error: 'Ongeldige aanvraag.' })); }

  if (body.logout) {
    res.setHeader('Set-Cookie', auth.logoutCookie());
    return res.end(JSON.stringify({ ok: true, authed: false }));
  }

  if (!auth.hasPassword()) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ ok: false, error: 'PORTAL_PASSWORD is nog niet ingesteld in de omgeving.' }));
  }
  if (!rate.allow(req, 'portal-login', 8, 10 * 60000)) {
    res.statusCode = 429;
    return res.end(JSON.stringify({ ok: false, error: 'Te veel pogingen. Probeer het over tien minuten opnieuw.' }));
  }
  if (!auth.checkPassword(body.password)) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ ok: false, error: 'Onjuist wachtwoord.' }));
  }
  res.setHeader('Set-Cookie', auth.loginCookie(req));
  res.end(JSON.stringify({ ok: true, authed: true }));
};
