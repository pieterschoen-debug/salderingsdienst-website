/* ============================================================
   SalderingsDienst — api/chat.js
   Serverless proxy naar de Kimi (Moonshot AI) API, OpenAI-
   compatible, internationaal endpoint (api.moonshot.ai — de
   .cn-variant hoort bij een ander account en weigert deze key).
   - Key uit process.env.KIMI_API_KEY (nooit in de code)
   - Model via env KIMI_MODEL, standaard 'moonshot-v1-auto' (kiest zelf
     de juiste contextlengte). Bewust geen kimi-k2.x-serie: dat zijn
     redeneermodellen die tokens verbruiken aan onzichtbare
     'reasoning_content' vóór het echte antwoord — bij een laag
     max_tokens-budget kan 'content' dan leeg blijven.
   - Rate limiting per IP; korte gespreksgeschiedenis; kennis
     gebaseerd op de FAQ/JSON-LD van de site
   - Als de bezoeker een afspraak wil, zet het model de marker
     [AFSPRAAK] in het antwoord; die strippen we hier en geven
     we als showBooking-vlag terug aan het front-end.
   ============================================================ */
'use strict';

var rate = require('./_lib/ratelimit');

var SYSTEM_PROMPT = [
  'Je bent de digitale adviseur van SalderingsDienst, een onafhankelijk Nederlands adviesbureau dat huiseigenaren met zonnepanelen helpt begrijpen wat het einde van de salderingsregeling betekent.',
  '',
  'Feiten die je kent (gebaseerd op Rijksoverheid en MilieuCentraal, juni 2026):',
  '- De salderingsregeling stopt per 1 januari 2027. Teruggeleverde stroom wordt dan niet meer weggestreept tegen het eigen verbruik.',
  '- Na 2027 krijgt men alleen nog een terugleververgoeding (indicatief €0,00 tot €0,05 per kWh); sommige leveranciers rekenen terugleverkosten.',
  '- Daardoor wordt het aantrekkelijker om zonnestroom direct zelf te gebruiken of op te slaan in een thuisbatterij.',
  '- Of een thuisbatterij loont, hangt af van verbruik, panelen en woning; SalderingsDienst rekent dat onafhankelijk door.',
  '- Met een dynamisch contract kan een slimme batterij laden bij lage prijzen en terugleveren bij hoge prijzen.',
  '- Het adviesgesprek is kosteloos en vrijblijvend, duurt ongeveer 1,5 uur en kan bij mensen thuis of online.',
  '- SalderingsDienst verkoopt geen producten, is niet verbonden aan een leverancier en ontvangt geen commissie.',
  '- Het advies richt zich op huiseigenaren (koopwoning) die al zonnepanelen hebben.',
  '',
  'Toon: feitelijk, rustig en geruststellend, zoals de Rijksoverheid en de Belastingdienst communiceren. Geen paniek, geen verkooppraat, geen overdrijving.',
  'Regels:',
  '- Antwoord in het Nederlands, formeel met "u", kort (maximaal 4 zinnen).',
  '- Geef geen bindend financieel, fiscaal of juridisch advies; verwijs bij twijfel vriendelijk naar het kosteloze adviesgesprek.',
  '- Gebruik geen lange streepjes en geen emoji.',
  '- Als de bezoeker een afspraak, adviesgesprek of contact wil, of als een berekening voor de eigen situatie nodig is: bied aan om het gesprek in te plannen en eindig je antwoord met de marker [AFSPRAAK] (exact zo, aan het einde). Noem desgewenst ook dat contact via WhatsApp kan.',
  '- Beantwoord alleen vragen die met zonnepanelen, saldering, energie of SalderingsDienst te maken hebben; leid andere onderwerpen vriendelijk terug naar dat domein.'
].join('\n');

var FALLBACK = 'De digitale adviseur is even niet beschikbaar. Plan gerust een gratis adviesgesprek of stel uw vraag via WhatsApp, dan helpen we u persoonlijk verder.';

function readJson(req, maxBytes) {
  return new Promise(function (resolve, reject) {
    if (req.body !== undefined) {
      resolve(typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}));
      return;
    }
    var chunks = []; var size = 0;
    req.on('data', function (c) {
      size += c.length;
      if (size > maxBytes) { reject(new Error('te groot')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', function () {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function sanitizeMessages(input) {
  if (!Array.isArray(input)) return null;
  var msgs = input.slice(-12).map(function (m) {
    var role = m && m.role === 'assistant' ? 'assistant' : 'user';
    var content = String((m && m.content) || '').slice(0, 1500).trim();
    return { role: role, content: content };
  }).filter(function (m) { return m.content; });
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return null;
  return msgs;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ ok: false, error: 'Methode niet toegestaan.' }));
  }
  if (!rate.allow(req, 'chat-min', 8, 60000) || !rate.allow(req, 'chat-uur', 60, 3600000)) {
    res.statusCode = 429;
    return res.end(JSON.stringify({ ok: false, reply: 'U stelt de vragen sneller dan ik ze kan beantwoorden. Probeer het over een minuut opnieuw, of plan direct een gratis adviesgesprek.', showBooking: true }));
  }

  var apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ ok: false, reply: FALLBACK, showBooking: true, error: 'KIMI_API_KEY ontbreekt.' }));
  }

  var body;
  try { body = await readJson(req, 48 * 1024); }
  catch (e) { res.statusCode = 400; return res.end(JSON.stringify({ ok: false, error: 'Ongeldige aanvraag.' })); }

  var messages = sanitizeMessages(body.messages);
  if (!messages) {
    res.statusCode = 422;
    return res.end(JSON.stringify({ ok: false, error: 'Geen geldige berichten.' }));
  }

  var model = process.env.KIMI_MODEL || 'moonshot-v1-auto';
  var controller = new AbortController();
  var timer = setTimeout(function () { controller.abort(); }, 25000);

  try {
    var kimiRes = await fetch('https://api.moonshot.ai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }].concat(messages),
        temperature: 0.3,
        max_tokens: 500,
        stream: false
      })
    });
    clearTimeout(timer);
    if (!kimiRes.ok) {
      var errText = (await kimiRes.text()).slice(0, 300);
      console.error('Kimi error', kimiRes.status, errText);
      res.statusCode = 502;
      return res.end(JSON.stringify({ ok: false, reply: FALLBACK, showBooking: true }));
    }
    var data = await kimiRes.json();
    var reply = ((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '').trim();
    if (!reply) {
      res.statusCode = 502;
      return res.end(JSON.stringify({ ok: false, reply: FALLBACK, showBooking: true }));
    }
    var showBooking = /\[AFSPRAAK\]/.test(reply);
    reply = reply.replace(/\s*\[AFSPRAAK\]\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
    return res.end(JSON.stringify({ ok: true, reply: reply, showBooking: showBooking, model: model }));
  } catch (e) {
    clearTimeout(timer);
    console.error('chat error:', e && e.message);
    res.statusCode = 502;
    return res.end(JSON.stringify({ ok: false, reply: FALLBACK, showBooking: true }));
  }
};
