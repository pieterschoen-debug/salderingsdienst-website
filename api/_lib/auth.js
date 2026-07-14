/* ============================================================
   SalderingsDienst — api/_lib/auth.js
   Simpele wachtwoordbeveiliging voor het /portal-overzicht.
   Zet PORTAL_PASSWORD als env var; het token in de cookie is een
   HMAC van dat wachtwoord (er staat dus nooit een wachtwoord in
   de cookie zelf).
   ============================================================ */
'use strict';

var crypto = require('crypto');

var COOKIE = 'sd_portal';

function portalPassword() {
  return process.env.PORTAL_PASSWORD || '';
}

function expectedToken() {
  var pw = portalPassword();
  if (!pw) return null;
  return crypto.createHmac('sha256', pw).update('sd-portal-v1').digest('hex');
}

function timingSafeEqual(a, b) {
  var ba = Buffer.from(String(a));
  var bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function parseCookies(req) {
  var out = {};
  var raw = req.headers.cookie || '';
  raw.split(';').forEach(function (part) {
    var i = part.indexOf('=');
    if (i === -1) return;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function isAuthed(req) {
  var expect = expectedToken();
  if (!expect) return false;
  var cookies = parseCookies(req);
  if (cookies[COOKIE] && timingSafeEqual(cookies[COOKIE], expect)) return true;
  var auth = req.headers.authorization || '';
  if (auth.indexOf('Bearer ') === 0 && timingSafeEqual(auth.slice(7), portalPassword())) return true;
  return false;
}

function checkPassword(pw) {
  var expect = portalPassword();
  if (!expect) return false;
  return timingSafeEqual(String(pw || ''), expect);
}

function loginCookie(req) {
  var secure = (req.headers['x-forwarded-proto'] || '').indexOf('https') !== -1;
  return COOKIE + '=' + expectedToken() + '; Path=/; Max-Age=604800; HttpOnly; SameSite=Lax' + (secure ? '; Secure' : '');
}

function logoutCookie() {
  return COOKIE + '=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax';
}

module.exports = {
  isAuthed: isAuthed,
  checkPassword: checkPassword,
  loginCookie: loginCookie,
  logoutCookie: logoutCookie,
  hasPassword: function () { return !!portalPassword(); }
};
