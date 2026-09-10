/* ============================================================
   SalderingsDienst — api/_lib/pipedrive.js
   Zet een binnengekomen boeking (schema sd.lead.v1) in Pipedrive:
   contactpersoon, deal in Verkoop > Adviesgesprek, en de afspraak
   als activiteit op datum en tijd.

   Omgeving:
     PIPEDRIVE_API_TOKEN   verplicht; zonder token doet deze module niets
     PIPEDRIVE_DOMAIN      optioneel, standaard 'salderingsdienst'

   Twee uitgangspunten:

   1. Deze module mag het boekingsformulier NOOIT laten klappen.
      Alles zit in een try/catch en faalt stil met een console-regel.
      De lead staat dan nog steeds in Supabase; hij mist alleen in
      Pipedrive en kan later worden nagelopen.

   2. Twee keer dezelfde lead insturen mag geen dubbele deal geven.
      De referentie van de website gaat in het dealveld
      "Webreferentie"; voor het aanmaken kijken we of die al bestaat.
   ============================================================ */
'use strict';

var TOKEN = process.env.PIPEDRIVE_API_TOKEN || '';
var DOMEIN = process.env.PIPEDRIVE_DOMAIN || 'salderingsdienst';
var BASIS = 'https://' + DOMEIN + '.pipedrive.com/api/v1/';

/* Veldsleutels van de eigen dealvelden. Vast ingebakken omdat Pipedrive
   ze nooit wijzigt zolang het veld bestaat. Klopt er een niet meer, dan
   slaat alleen dat ene veld over: het aanmaken zelf gaat gewoon door. */
var VELD = {
  webreferentie: '433ee6a5ea6e8df939d60bc76c55551204b81aaa',
  kwalificatie: '3fdd824d65b1b5af56552f0f29edc5528d259f3a',
  afspraakvorm: 'ba55a543a5df44b9cad19dab4aceae590178b995'
};

/* Optie-ids horen bij de keuzelijsten hierboven. */
var OPTIE = {
  kwalificatie: { warm_gekwalificeerd: null, niet_gekwalificeerd: null },
  afspraakvorm: {}
};

var cache = null; /* per lambda-instantie; scheelt drie GETs per boeking */

function actief() { return !!TOKEN; }

async function api(methode, pad, body) {
  var scheiding = pad.indexOf('?') === -1 ? '?' : '&';
  var res = await fetch(BASIS + pad + scheiding + 'api_token=' + encodeURIComponent(TOKEN), {
    method: methode,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  var uit = await res.json().catch(function () { return {}; });
  if (!res.ok || uit.success === false) {
    throw new Error('Pipedrive ' + methode + ' ' + pad + ' → ' + res.status + ' ' +
      JSON.stringify(uit && uit.error ? uit.error : uit).slice(0, 200));
  }
  return uit;
}

/* Pipeline- en fase-ids op naam opzoeken in plaats van hardcoden, zodat
   een herbouwde pipeline de koppeling niet stilletjes breekt. */
async function ids() {
  if (cache) return cache;
  var pijplijnen = (await api('GET', 'pipelines')).data || [];
  var verkoop = pijplijnen.find(function (p) { return p.name === 'Verkoop'; });
  if (!verkoop) throw new Error('Pipeline "Verkoop" niet gevonden in Pipedrive');
  var fases = (await api('GET', 'stages?pipeline_id=' + verkoop.id)).data || [];
  var advies = fases.find(function (s) { return s.name === 'Adviesgesprek'; });
  if (!advies) throw new Error('Fase "Adviesgesprek" niet gevonden in pipeline Verkoop');

  /* Optie-ids van de twee keuzelijsten ophalen. */
  var velden = (await api('GET', 'dealFields?limit=500')).data || [];
  velden.forEach(function (f) {
    if (f.key === VELD.kwalificatie) {
      (f.options || []).forEach(function (o) {
        if (o.label === 'Gekwalificeerd') OPTIE.kwalificatie.warm_gekwalificeerd = o.id;
        if (o.label === 'Niet gekwalificeerd') OPTIE.kwalificatie.niet_gekwalificeerd = o.id;
      });
    }
    if (f.key === VELD.afspraakvorm) {
      (f.options || []).forEach(function (o) { OPTIE.afspraakvorm[o.label] = o.id; });
    }
  });

  cache = { pipeline: verkoop.id, fase: advies.id };
  return cache;
}

/* De website kent 'thuis', 'video' en 'telefoon'; Pipedrive kent labels. */
function afspraakvormLabel(mode) {
  var m = String(mode || '').toLowerCase();
  if (m.indexOf('video') !== -1 || m.indexOf('beeld') !== -1) return 'Videogesprek';
  if (m.indexOf('tel') !== -1 || m.indexOf('bel') !== -1) return 'Telefonisch';
  if (m) return 'Bij klant thuis';
  return null;
}

async function zoekPersoon(email) {
  var uit = await api('GET', 'persons/search?exact_match=true&fields=email&term=' + encodeURIComponent(email));
  var items = (uit.data && uit.data.items) || [];
  return items.length ? items[0].item.id : null;
}

async function bestaatAl(ref) {
  var uit = await api('GET', 'deals/search?exact_match=true&fields=custom_fields&term=' + encodeURIComponent(ref));
  var items = (uit.data && uit.data.items) || [];
  return items.length ? items[0].item.id : null;
}

function notitieTekst(lead) {
  var q = lead.qualification || {};
  var s = lead.source || {};
  var r = [];
  r.push('<b>Aanmelding via de website</b>');
  r.push('Referentie: ' + lead.ref);
  if (lead.briefcode) r.push('Briefcode: ' + lead.briefcode);
  r.push('');
  r.push('<b>Kwalificatie (6 van Succes)</b>');
  r.push('Productinteresse: ' + ((q.productinteresse || []).join(', ') || 'niet opgegeven'));
  r.push('Koopwoning: ' + (q.koopwoning === true ? 'ja' : 'nee'));
  r.push('Beide beslissers aanwezig: ' + (q.beideBeslissersAanwezig === true ? 'ja' : 'nee'));
  r.push('Jonger dan 75: ' + (q.jongerDan75 === true ? 'ja' : 'nee'));
  r.push('Bereid zelf te investeren: ' + (q.eigenInvestering === true ? 'ja' : 'nee'));
  r.push('Verwachting gesprek begrepen: ' + (q.verwachtingBegrepen === true ? 'ja' : 'nee'));
  r.push('Afspraak bevestigd: ' + (q.afspraakBevestigd === true ? 'ja' : 'nee'));
  r.push('');
  r.push('Uitkomst: ' + (lead.status === 'warm_gekwalificeerd' ? 'gekwalificeerd' : 'niet gekwalificeerd'));
  if (s.utm_source || s.referrer || s.pad) {
    r.push('');
    r.push('<b>Herkomst</b>');
    if (s.utm_source) r.push('Bron: ' + s.utm_source + (s.utm_campaign ? ' / ' + s.utm_campaign : ''));
    if (s.referrer) r.push('Verwijzer: ' + s.referrer);
    if (s.pad) r.push('Pagina: ' + s.pad);
  }
  if (lead.consent && lead.consent.infoEmail) {
    r.push('');
    r.push('Klant wil informatie per e-mail ontvangen.');
  }
  return r.join('<br>');
}

/**
 * Zet één boeking in Pipedrive. Gooit nooit; geeft terug wat er is gebeurd.
 * @param {object} lead - lead volgens schema sd.lead.v1
 */
async function syncBooking(lead) {
  if (!actief()) return { ok: false, reden: 'geen PIPEDRIVE_API_TOKEN' };
  try {
    var contact = lead.contact || {};
    var afspraak = lead.appointment || {};
    if (!contact.email) return { ok: false, reden: 'lead zonder e-mailadres' };

    var bestaand = await bestaatAl(lead.ref);
    if (bestaand) return { ok: true, overgeslagen: true, dealId: bestaand };

    var conf = await ids();

    var persoonId = await zoekPersoon(contact.email);
    if (!persoonId) {
      var p = await api('POST', 'persons', {
        name: contact.naam,
        email: [{ value: contact.email, primary: true, label: 'work' }],
        phone: contact.tel ? [{ value: contact.tel, primary: true, label: 'mobile' }] : undefined
      });
      persoonId = p.data.id;
    }

    var dealBody = {
      title: 'Adviesgesprek — ' + contact.naam,
      person_id: persoonId,
      pipeline_id: conf.pipeline,
      stage_id: conf.fase
    };
    dealBody[VELD.webreferentie] = lead.ref;
    var kw = OPTIE.kwalificatie[lead.status];
    if (kw) dealBody[VELD.kwalificatie] = kw;
    var vormLabel = afspraakvormLabel(afspraak.mode);
    if (vormLabel && OPTIE.afspraakvorm[vormLabel]) dealBody[VELD.afspraakvorm] = OPTIE.afspraakvorm[vormLabel];

    var deal = await api('POST', 'deals', dealBody);
    var dealId = deal.data.id;

    /* De afspraak zelf. Zonder datum wordt het een taak voor vandaag,
       zodat een halve boeking niet onzichtbaar wordt. */
    var activiteit = {
      subject: 'Adviesgesprek — ' + contact.naam,
      type: 'meeting',
      deal_id: dealId,
      person_id: persoonId,
      done: 0
    };
    if (afspraak.dateIso) {
      activiteit.due_date = afspraak.dateIso;
      if (afspraak.time) { activiteit.due_time = afspraak.time; activiteit.duration = '01:00'; }
    } else {
      activiteit.subject = 'Afspraak inplannen — ' + contact.naam;
      activiteit.type = 'call';
      activiteit.due_date = new Date().toISOString().slice(0, 10);
    }
    await api('POST', 'activities', activiteit);

    await api('POST', 'notes', { deal_id: dealId, content: notitieTekst(lead) });

    return { ok: true, dealId: dealId, persoonId: persoonId };
  } catch (e) {
    console.error('pipedrive sync mislukt voor ref', lead && lead.ref, '→', e && e.message);
    return { ok: false, reden: e && e.message };
  }
}

module.exports = { syncBooking: syncBooking, actief: actief };
