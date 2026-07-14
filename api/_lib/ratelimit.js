/* ============================================================
   SalderingsDienst — api/_lib/ratelimit.js
   Eenvoudige in-memory rate limiting per IP (sliding window).
   Per serverless-instance; voldoende als misbruikrem voor een
   lead-site. Voor zwaardere garanties: vervang door Upstash o.i.d.
   ============================================================ */
'use strict';

var BUCKETS = global.__sdRate = global.__sdRate || new Map();

function clientIp(req) {
  var fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'onbekend';
}

/* allow(req, naam, maxAantal, vensterMs) → true als toegestaan */
function allow(req, name, max, windowMs) {
  var key = name + ':' + clientIp(req);
  var now = Date.now();
  var hits = BUCKETS.get(key) || [];
  hits = hits.filter(function (t) { return now - t < windowMs; });
  if (hits.length >= max) { BUCKETS.set(key, hits); return false; }
  hits.push(now);
  BUCKETS.set(key, hits);
  if (BUCKETS.size > 5000) BUCKETS.clear(); /* geheugenrem */
  return true;
}

module.exports = { allow: allow, clientIp: clientIp };
