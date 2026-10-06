/* ============================================================
   SalderingsDienst — api/_lib/attributie.js
   Herkomst van een lead: saneren van lead.source en afleiden van
   het verkeerskanaal (organisch zoeken, AI-verwijzing, campagne, ...).

   Pure functies zonder I/O, zodat ze los te testen zijn
   (tools/attributie-test.mjs). De client levert alleen ruwe
   gegevens aan; het verkeerskanaal wordt ALTIJD hier afgeleid en een
   door de client meegestuurd 'verkeerskanaal' of 'ai_bron' wordt
   genegeerd. Geen schemawijziging: alles zit in de bestaande
   jsonb-kolom source. (Let op: de tabelkolom 'kanaal' is van de
   CRM-kant; daarom heet het veld hier bewust 'verkeerskanaal'.)
   ============================================================ */
'use strict';

var MAX_TEKST = 200;
var UTM_SLEUTELS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref'];
/* Toegestane platte tekstvelden in lead.source (verkeerskanaal en ai_bron zijn server-only) */
var TEKST_SLEUTELS = ['page', 'pad', 'landing', 'referrer', 'channel', 'partner', 'ts', 'utm_source', 'utm_medium', 'utm_campaign'];
var PAD_SLEUTELS = { page: 1, pad: 1, landing: 1 };

/* AI-assistenten en AI-zoekmachines. 'pad' = optionele padprefix: bing.com
   telt alleen als AI-verwijzing onder /chat, duckduckgo.com alleen onder
   /aichat. Dat kan alleen als de referrer een pad bevat; de website stuurt
   standaard alleen de hostnaam. */
var AI_BRONNEN = [
  { naam: 'chatgpt.com', host: 'chatgpt.com' },
  { naam: 'openai.com', host: 'openai.com' },
  { naam: 'perplexity.ai', host: 'perplexity.ai' },
  { naam: 'copilot.microsoft.com', host: 'copilot.microsoft.com' },
  { naam: 'bing.com/chat', host: 'bing.com', pad: '/chat' },
  { naam: 'gemini.google.com', host: 'gemini.google.com' },
  { naam: 'claude.ai', host: 'claude.ai' },
  { naam: 'you.com', host: 'you.com' },
  { naam: 'duckduckgo.com/aichat', host: 'duckduckgo.com', pad: '/aichat' }
];

/* Zoekmachines: google.* en yahoo.* per land, de rest vaste domeinen */
var ZOEK_REGEX = /(^|\.)(google\.[a-z]{2,3}(\.[a-z]{2})?|bing\.com|duckduckgo\.com|ecosia\.org|startpage\.com|yahoo\.[a-z]{2,3}(\.[a-z]{2})?)$/;

/* "https://www.Google.nl/search?q=x" -> { host: 'google.nl', pad: '/search' } */
function splitsReferrer(ruw) {
  var t = String(ruw || '').trim().toLowerCase();
  if (!t) return { host: '', pad: '' };
  t = t.replace(/^[a-z][a-z0-9+.-]*:\/\//, '').replace(/[?#].*$/, '');
  var i = t.indexOf('/');
  var host = (i === -1 ? t : t.slice(0, i)).replace(/^www\./, '').replace(/:\d+$/, '');
  return { host: host, pad: i === -1 ? '' : t.slice(i) };
}

function hostHoort(host, domein) {
  return host === domein || host.slice(-(domein.length + 1)) === '.' + domein;
}

function aiBron(host, pad) {
  for (var i = 0; i < AI_BRONNEN.length; i++) {
    var b = AI_BRONNEN[i];
    if (!hostHoort(host, b.host)) continue;
    if (b.pad && pad.indexOf(b.pad) !== 0) continue;
    return b.naam;
  }
  return null;
}

/**
 * Leidt het verkeerskanaal af uit referrer en UTM-parameters.
 * @param {string|null|undefined} referrer - hostnaam (of volledige URL) van de eerste verwijzer
 * @param {object} utm - { utm_source, utm_medium, ... }
 * @returns {{verkeerskanaal: string, ai_bron: (string|undefined)}}
 *   verkeerskanaal: betaald | ai_verwijzing | campagne | organisch_zoeken | direct | verwijzing | onbekend
 */
function classificeer(referrer, utm) {
  utm = utm || {};
  var medium = String(utm.utm_medium || '').toLowerCase();
  var bron = String(utm.utm_source || '').toLowerCase();
  var r = splitsReferrer(referrer);

  /* 1. Betaald verkeer wint altijd */
  if (/cpc|paid|ppc/.test(medium)) return { verkeerskanaal: 'betaald' };

  /* 2. ChatGPT en vergelijkbare assistenten plakken zelf utm_source=<domein>
        achter de link; dat is geen eigen campagne maar een AI-verwijzing. */
  var viaUtm = bron ? aiBron(splitsReferrer(bron).host, '') : null;
  if (viaUtm) return { verkeerskanaal: 'ai_verwijzing', ai_bron: viaUtm };

  /* 3. Eigen campagne (nieuwsbrief, partner, ...) */
  if (bron || medium) return { verkeerskanaal: 'campagne' };

  /* 4. AI-verwijzing via de referrer (vóór zoekmachines: gemini.google.com
        en bing.com/chat zijn geen gewoon zoekverkeer) */
  var viaRef = r.host ? aiBron(r.host, r.pad) : null;
  if (viaRef) return { verkeerskanaal: 'ai_verwijzing', ai_bron: viaRef };

  /* 5. Gewone zoekmachines */
  if (r.host && ZOEK_REGEX.test(r.host)) return { verkeerskanaal: 'organisch_zoeken' };

  /* 6. Geen referrer en geen UTM: direct. Een oudere client die helemaal
        geen referrer-veld meestuurt, kan niet als 'direct' gelden. */
  if (!r.host) return { verkeerskanaal: (referrer === undefined || referrer === null) ? 'onbekend' : 'direct' };

  return { verkeerskanaal: 'verwijzing' };
}

/* Verwijdert e-mailadressen en telefoonnummers uit een waarde. Een cijferreeks
   telt pas als telefoonnummer vanaf 9 cijfers, zodat '2027-2028' blijft staan. */
function wasPersoonsgegevens(tekst) {
  var t = String(tekst);
  t = t.replace(/[^\s@%\/?&=]+(?:@|%40)[^\s@%\/?&=]+\.[^\s@%\/?&=]+/gi, '');
  t = t.replace(/\+?\d[\d\s().\-]{6,}\d/g, function (m) {
    return m.replace(/\D/g, '').length >= 9 ? '' : m;
  });
  return t;
}

function schoon(waarde, sleutel) {
  if (typeof waarde !== 'string') return '';
  var t = waarde;
  if (PAD_SLEUTELS[sleutel]) t = t.replace(/[?#].*$/, '');           /* alleen pad, geen query */
  if (sleutel === 'referrer') t = splitsReferrer(t).host;             /* alleen hostnaam */
  t = wasPersoonsgegevens(t).replace(/[\u0000-\u001f<>]/g, '').trim();
  return t.slice(0, MAX_TEKST);
}

function schoneUtm(utm) {
  var uit = {};
  if (!utm || typeof utm !== 'object') return uit;
  UTM_SLEUTELS.forEach(function (k) {
    var v = schoon(utm[k], k);
    if (v) uit[k] = v;
  });
  return uit;
}

/**
 * Saneert lead.source: alleen bekende sleutels, korte strings, geen
 * persoonsgegevens, en voegt het server-side afgeleide verkeerskanaal toe.
 * @param {*} bron - ruwe lead.source van de client
 * @returns {object} schoon source-object (nooit null)
 */
function saneerSource(bron) {
  var inn = (bron && typeof bron === 'object' && !Array.isArray(bron)) ? bron : {};
  var uit = {};
  TEKST_SLEUTELS.forEach(function (k) {
    var v = schoon(inn[k], k);
    /* een lege referrer blijft bewaard: dat betekent bewust 'direct' */
    if (v || (k === 'referrer' && typeof inn[k] === 'string')) uit[k] = v;
  });
  var utm = schoneUtm(inn.utm);
  /* Het utm-object (first touch) is leidend voor de platte utm_*-velden */
  ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) {
    if (utm[k]) uit[k] = utm[k];
    else if (uit[k] && !Object.keys(utm).length) utm[k] = uit[k];
  });
  if (Object.keys(utm).length) uit.utm = utm;

  var k = classificeer(typeof inn.referrer === 'string' ? inn.referrer : undefined, utm);
  uit.verkeerskanaal = k.verkeerskanaal;
  if (k.ai_bron) uit.ai_bron = k.ai_bron;
  return uit;
}

module.exports = { classificeer: classificeer, saneerSource: saneerSource, wasPersoonsgegevens: wasPersoonsgegevens };
