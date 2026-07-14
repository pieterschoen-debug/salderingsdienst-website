/* ============================================================
   SalderingsDienst — booking.js
   Zelf-renderend boekingscomponent. Mount: [data-booking].
   Draait identiek op de eigen pagina (index.html) en in het
   embedbare widget (widget.html via js/embed.js op partnersites).

   Flow: DRIE stappen. De zes kwalificatiepunten ("6 van Succes")
   worden uit de antwoorden afgeleid en server-side beoordeeld:
     1. Onderwerp & afspraak → productinteresse, woningtype,
                               datum/tijd/duur (1,5 uur)
     2. Uw gegevens          → contact, adres, beide beslissers,
                               leeftijd (+ eigen middelen bij 75+),
                               verwachtingspatroon
     3. Bevestiging          → samenvatting, agenda, verzenden
   De boeking gaat ALTIJD door; een afwijkend antwoord is een FLAG
   voor de planner (partner_afwezig, leeftijd_75_plus_onzeker,
   huur_of_anders), nooit een blokkade of afwijzing in de UI.
   De bevestiging is voor iedereen identiek.

   Uitkanalen per bevestigde afspraak:
   1. localStorage 'sd_adviesgesprek' + wachtrij 'sd_lead_queue'
   2. CustomEvent 'sd:lead' (via SD.lead in motion.js)
   3. POST naar SD_CONFIG.bookingEndpoint (default /api/bookings);
      het antwoord bepaalt de succes-/foutmelding op stap 3.
   Concept-invoer staat in localStorage 'sd_booking_draft' en wordt
   tot 24 uur hersteld (met melding, nooit auto-submit).
   Let op: nooit toISOString() voor lokale datums (CET-verschuiving).
   ============================================================ */
(function () {
  'use strict';

  var mount = document.querySelector('[data-booking]');
  if (!mount) return;

  var SD = window.SD || { track: function () {}, fire: function () {}, utm: {} };
  var CFG = window.SD_CONFIG || {};
  var DURATION_MIN = 90; /* het gesprek duurt ± 1,5 uur */
  var DRAFT_KEY = 'sd_booking_draft';
  var DRAFT_MAX_AGE = 24 * 60 * 60 * 1000;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Context: eigen pagina of embed ---------- */
  var inIframe = false;
  try { inIframe = window.self !== window.top; } catch (e) { inIframe = true; }
  var srcParam = null;
  try { srcParam = new URLSearchParams(location.search).get('source'); } catch (e) {}
  var sourceTag = srcParam || mount.getAttribute('data-source') || 'site';

  /* ---------- State ---------- */
  var state = {
    step: 1,
    products: [],            /* criterium 1: productinteresse */
    woning: null,            /* criterium 6: woningtype */
    dateIso: null, time: null, /* criterium 5: moment (duur vast 1,5 uur) */
    naam: '', email: '', tel: '', postcode: '', huisnummer: '',
    partner: null,           /* criterium 2: 'alleen' | 'samen' | 'partner_afwezig' */
    leeftijd: null,          /* criterium 3: '<75' | '75+' */
    invest: null,            /* criterium 3: 'ja' | 'nee' (alleen bij 75+) */
    verwachting: false,      /* criterium 4: verwachtingspatroon bevestigd */
    sendInfo: false,
    view: 'form', bookingRef: '', softLeadSaved: false
  };
  var STEPS = 3;
  var STEP_LABELS = ['Onderwerp en afspraak', 'Uw gegevens', 'Bevestiging'];

  /* ---------- Hulpfuncties ---------- */
  function pad2(n) { return String(n).padStart(2, '0'); }
  function localIso(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function fmtFull(iso) {
    var wd = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
    var mo = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
    var d = new Date(iso + 'T00:00:00');
    return wd[d.getDay()] + ' ' + d.getDate() + ' ' + mo[d.getMonth()];
  }
  function cap(s) { return s.replace(/^\w/, function (c) { return c.toUpperCase(); }); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- Opties ---------- */
  var PRODUCTS = [
    { id: 'zonnepanelen', t: 'Zonnepanelen na 2027' },
    { id: 'thuisbatterij', t: 'Thuisbatterij' },
    { id: 'warmtepomp', t: 'Warmtepomp' },
    { id: 'ems', t: 'Slim energiemanagement (EMS)' },
    { id: 'weet_niet', t: 'Weet ik nog niet' }
  ];
  var WONING = [
    { id: 'koopwoning', t: 'Koopwoning' },
    { id: 'huurwoning', t: 'Huurwoning' },
    { id: 'appartement_eigendom', t: 'Appartement (eigendom)' },
    { id: 'anders', t: 'Anders' }
  ];
  var PARTNER = [
    { id: 'alleen', t: 'Ik woon alleen' },
    { id: 'samen', t: 'Ik woon samen, partner is aanwezig' },
    { id: 'partner_afwezig', t: 'Ik woon samen, partner is niet aanwezig' }
  ];
  var LEEFTIJD = [
    { id: '<75', t: 'Jonger dan 75 jaar', track: 'jonger75' },
    { id: '75+', t: '75 jaar of ouder', track: '75plus' }
  ];
  var INVEST = [
    { id: 'ja', t: 'Ja', track: 'invest_ja' },
    { id: 'nee', t: 'Nee / Weet ik niet', track: 'invest_nee' }
  ];
  var TIMES = ['09:00', '10:30', '13:00', '14:30', '16:00', '19:00', '20:30'];

  function productLabels() {
    return state.products.map(function (id) {
      var p = PRODUCTS.filter(function (x) { return x.id === id; })[0];
      return p ? p.t : id;
    }).join(', ');
  }
  function optLabel(list, id) {
    var o = list.filter(function (x) { return x.id === id; })[0];
    return o ? o.t : '';
  }

  /* Datumgrenzen: alleen toekomstige dagen, maximaal 60 dagen vooruit. */
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var minDate = new Date(today); minDate.setDate(minDate.getDate() + 1);
  var maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 60);

  function validDate(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
    var d = new Date(iso + 'T00:00:00');
    return !isNaN(d) && d >= minDate && d <= maxDate;
  }
  function validEmail() { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(state.email.trim()); }
  function validTel() { return (state.tel.match(/\d/g) || []).length >= 10; }
  function validPostcode() { return /^\d{4}\s?[a-zA-Z]{2}$/.test(state.postcode.trim()); }
  function hasDT() { return validDate(state.dateIso) && !!state.time; }

  /* ---------- Kwalificatie ("6 van Succes") + flags ---------- */
  function buildFlags() {
    return {
      partner_afwezig: state.partner === 'partner_afwezig',
      leeftijd_75_plus_onzeker: state.leeftijd === '75+' && state.invest !== 'ja',
      huur_of_anders: state.woning === 'huurwoning' || state.woning === 'anders'
    };
  }
  function buildQualification() {
    return {
      productinteresse: state.products.slice(),
      woningtype: state.woning,
      koopwoning: state.woning === 'koopwoning' || state.woning === 'appartement_eigendom',
      afspraakBevestigd: hasDT(),
      beideBeslissersAanwezig: state.partner === 'samen' || state.partner === 'alleen',
      partnerSituatie: state.partner,
      jongerDan75: state.leeftijd === '<75',
      eigenInvestering: state.leeftijd === '75+' ? state.invest === 'ja' : null,
      verwachtingBegrepen: !!state.verwachting,
      durationMin: DURATION_MIN,
      flags: buildFlags()
    };
  }
  /* Indicatief; de server leidt de status opnieuw af en is leidend. */
  function deriveStatus(q) {
    var c1 = q.productinteresse.length > 0;
    var c2 = q.beideBeslissersAanwezig;
    var c3 = q.jongerDan75 || q.eigenInvestering === true;
    var c4 = q.verwachtingBegrepen;
    var c5 = q.afspraakBevestigd;
    var c6 = q.koopwoning;
    if (c1 && c2 && c3 && c4 && c5 && c6) return 'warm_gekwalificeerd';
    if (c1 && c5 && c6 && (c2 || c3 || c4)) return 'te_kwalificeren';
    if (c1 || c5) return 'te_kwalificeren';
    return 'niet_gekwalificeerd';
  }

  /* ---------- Template ---------- */
  function fieldError(msg) {
    return '<p class="bfield-error" role="alert" aria-live="polite" hidden>' + esc(msg) + '</p>';
  }
  mount.innerHTML =
    '<div class="book-view" data-view="form">' +
      '<div class="book-flow">' +
        '<div class="book-restore" data-bk="restore" role="status" hidden>' +
          '<span>Uw eerdere invoer is hersteld. Controleer de gegevens.</span>' +
          '<button type="button" data-bk="restoreclose" aria-label="Melding sluiten">&times;</button>' +
        '</div>' +
        '<div class="bprogress">' +
          '<div class="bprogress-top"><span class="bprogress-label" data-bk="steplabel">Stap 1 van ' + STEPS + '</span><span class="bprogress-name" data-bk="stepname"></span></div>' +
          '<div class="bprogress-seg" aria-hidden="true"><span data-seg="1"></span><span data-seg="2"></span><span data-seg="3"></span></div>' +
        '</div>' +

        /* ===== STAP 1: Onderwerp & afspraak ===== */
        '<div class="bstep" data-bstep="1">' +
          '<div class="bfield" data-field="products">' +
            '<div class="bfield-label" id="bkq-products">Waar wilt u advies over?</div>' +
            '<div class="bfield-sub">Meerdere opties mogelijk</div>' +
            '<div class="chips" role="group" aria-labelledby="bkq-products" data-bk="products"></div>' +
            fieldError('Selecteer minimaal een onderwerp.') +
          '</div>' +
          '<fieldset class="bfield" data-field="woning">' +
            '<legend class="bfield-label">Woont u in een...</legend>' +
            '<div class="bradios bradios--row" data-bk="woning"></div>' +
            '<p class="bfield-flag" data-bk="woningflag" hidden>In sommige gevallen is advies ook mogelijk bij huurwoningen. Onze planner neemt contact met u op om dit te bespreken.</p>' +
            fieldError('Selecteer uw woningtype.') +
          '</fieldset>' +
          '<div class="bfield" data-field="moment">' +
            '<div class="bfield-label" id="bkq-moment">Wanneer schikt het u?</div>' +
            '<div class="bfield-sub">Het gesprek duurt ongeveer 1,5 uur</div>' +
            '<label class="bdate"><span>Datum</span>' +
              '<input type="date" class="field" data-bk="date" min="' + localIso(minDate) + '" max="' + localIso(maxDate) + '" aria-describedby="bkq-moment">' +
            '</label>' +
            '<div class="chips chips--times" role="group" aria-label="Tijd" data-bk="times"></div>' +
            '<p class="bstep-note">Het adviesgesprek werkt het beste wanneer beide beslissers aanwezig zijn. Kiest u een tijd waarbij u beiden aanwezig kunt zijn.</p>' +
            fieldError('Selecteer een datum en tijd.') +
          '</div>' +
          '<div class="bstep-nav"><span></span><button type="button" class="btn btn-primary" data-bnext="2" data-track="booking_step1_continue">Verder</button></div>' +
        '</div>' +

        /* ===== STAP 2: Uw gegevens ===== */
        '<div class="bstep" data-bstep="2" hidden>' +
          '<div class="bfield" data-field="naam">' +
            '<label class="bfield-label" for="bk3-naam">Uw naam</label>' +
            '<input class="field" id="bk3-naam" data-bk="naam" placeholder="Voor- en achternaam" autocomplete="name">' +
            fieldError('Vul uw voor- en achternaam in.') +
          '</div>' +
          '<div class="bfield" data-field="email">' +
            '<label class="bfield-label" for="bk3-email">Uw e-mailadres</label>' +
            '<input class="field" id="bk3-email" data-bk="email" type="email" placeholder="naam@voorbeeld.nl" autocomplete="email">' +
            fieldError('Vul een geldig e-mailadres in.') +
          '</div>' +
          '<div class="bfield" data-field="tel">' +
            '<label class="bfield-label" for="bk3-tel">Uw telefoonnummer</label>' +
            '<input class="field" id="bk3-tel" data-bk="tel" type="tel" placeholder="06-12345678" autocomplete="tel">' +
            fieldError('Vul een geldig telefoonnummer in.') +
          '</div>' +
          '<div class="bfield" data-field="adres">' +
            '<div class="bfield-label" id="bkq-adres">Uw adres</div>' +
            '<div class="badres" role="group" aria-labelledby="bkq-adres">' +
              '<input class="field" data-bk="postcode" placeholder="1234 AB" autocomplete="postal-code" aria-label="Postcode">' +
              '<input class="field" data-bk="huisnummer" placeholder="1" autocomplete="address-line1" aria-label="Huisnummer">' +
            '</div>' +
            fieldError('Vul een geldige postcode en huisnummer in.') +
          '</div>' +
          '<fieldset class="bfield" data-field="partner">' +
            '<legend class="bfield-label">Met wie mogen wij het gesprek aangaan?</legend>' +
            '<div class="bradios" data-bk="partner"></div>' +
            '<p class="bfield-flag" data-bk="partnerflag" hidden>Onze planner zal u telefonisch benaderen om een geschikt moment te vinden waarop u beiden aanwezig kunt zijn.</p>' +
            fieldError('Selecteer een optie.') +
          '</fieldset>' +
          '<fieldset class="bfield" data-field="leeftijd">' +
            '<legend class="bfield-label">In welke leeftijdscategorie valt u?</legend>' +
            '<div class="bradios bradios--row" data-bk="leeftijd"></div>' +
            fieldError('Selecteer uw leeftijdscategorie.') +
          '</fieldset>' +
          '<fieldset class="bfield" data-field="invest" data-bk="investblok" hidden>' +
            '<legend class="bfield-label">Investeringsbereidheid</legend>' +
            '<div class="bfield-sub">Mocht er een passende oplossing uit het adviesgesprek komen, zou u dan bereid zijn om met eigen middelen te investeren in het verduurzamen van uw woning?</div>' +
            '<div class="bradios bradios--row" data-bk="invest"></div>' +
            '<p class="bfield-flag" data-bk="investflag" hidden>Onze planner neemt contact met u op om de mogelijkheden te bespreken.</p>' +
            fieldError('Selecteer een optie.') +
          '</fieldset>' +
          '<div class="bfield" data-field="verwachting">' +
            '<div class="bfield-label">Wat mag u verwachten?</div>' +
            '<div class="binfo">Onze adviseur komt vrijblijvend langs om een persoonlijk advies te geven. Wanneer het advies goed voelt, kan de adviseur u ook helpen bij de uitvoering. U zit nergens aan vast.</div>' +
            '<label class="book-optin"><input type="checkbox" data-bk="verwachting"><span>Ik begrijp dat het gesprek vrijblijvend is en dat de adviseur mij kan helpen bij de uitvoering wanneer het gevoel goed is.</span></label>' +
            fieldError('Bevestig dat u het verwachtingspatroon heeft gelezen.') +
          '</div>' +
          '<label class="book-optin"><input type="checkbox" data-bk="sendinfo" data-track="booking_lead_capture_email"><span>Stuur mij ook alvast de uitleg per e-mail (vrijblijvend)</span></label>' +
          '<div class="bstep-nav"><button type="button" class="btn btn-ghost" data-bback="1">Terug</button>' +
          '<button type="button" class="btn btn-primary" data-bnext="3" data-track="booking_step2_continue">Verder</button></div>' +
        '</div>' +

        /* ===== STAP 3: Bevestiging ===== */
        '<div class="bstep" data-bstep="3" hidden>' +
          '<h3 class="bstep-title" data-bk="s3title" tabindex="-1">Controleer uw gegevens</h3>' +
          '<div class="bsummary" data-bk="summary"></div>' +
          '<div class="bagenda">' +
            '<div class="bfield-label">Voeg de afspraak toe aan uw agenda</div>' +
            '<div class="bagenda-links">' +
              '<a class="btn btn-ghost" data-bk="ics" href="#" download="adviesgesprek-salderingsdienst.ics" data-track="booking_agenda_ics">Download .ics</a>' +
              '<a class="btn btn-ghost" data-bk="gcal" href="#" target="_blank" rel="noopener" data-track="booking_agenda_google">Google Agenda</a>' +
              '<a class="btn btn-ghost" data-bk="outlook" href="#" target="_blank" rel="noopener" data-track="booking_agenda_outlook">Outlook</a>' +
            '</div>' +
          '</div>' +
          '<p class="bsubmit-error" data-bk="submiterror" role="alert" aria-live="polite" hidden>Er is iets misgegaan. Probeer het opnieuw of neem contact met ons op.</p>' +
          '<button type="button" class="btn btn-primary book-submit" data-bk="submit" data-track="booking_step3_submit">Bevestig mijn adviesgesprek</button>' +
          '<p class="book-footnote">Wij gebruiken uw gegevens alleen voor dit adviesgesprek. Zie ons <a href="privacybeleid.html" target="_blank" rel="noopener">privacybeleid</a>.</p>' +
          '<div class="bstep-nav" style="justify-content:flex-start; border-top:none; padding-top:0; margin-top:8px;"><button type="button" class="btn btn-ghost" data-bback="2">Terug</button></div>' +
          '<div class="book-meta"><span>KvK <span class="kvk" data-sd-kvk></span></span><span>Kosteloos &amp; vrijblijvend</span><span>Onafhankelijk advies</span></div>' +
          '<div class="book-alt">Liever telefonisch? <a data-sd-tel data-track="call_click" href="#adviesgesprek">Bel ons</a> of <a data-sd-wa href="#adviesgesprek">app via WhatsApp</a>.</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="book-view" data-view="confirm" hidden>' +
      '<div class="confirm">' +
        '<div class="confirm-head">' +
          '<div class="confirm-glyph" aria-hidden="true">✓</div>' +
          '<h3>Uw aanvraag is verstuurd</h3>' +
          '<p>Bedankt, <span data-bk="cnaam"></span>. Onze planner neemt binnen 1 werkdag contact met u op om het gesprek te bevestigen. U ontvangt daarna een bevestiging per e-mail op <span data-bk="cemail"></span>.</p>' +
        '</div>' +
        '<div class="confirm-cards">' +
          '<div class="confirm-card">' +
            '<div class="photo"><img src="assets/advisor-1.webp" alt="Uw adviseur" width="119" height="168" loading="lazy"></div>' +
            '<div><div class="confirm-kicker">Uw adviseur</div><div class="confirm-strong">Mark van der Velde</div><div class="confirm-sub">Senior energieadviseur</div></div>' +
          '</div>' +
          '<div class="confirm-card" style="gap:20px;">' +
            '<div><div class="confirm-kicker confirm-kicker--muted">Datum</div><div class="confirm-strong" style="font-size:15.5px;" data-bk="cdate"></div></div>' +
            '<div><div class="confirm-kicker confirm-kicker--muted">Tijd</div><div class="confirm-strong" style="font-size:15.5px;"><span data-bk="ctime"></span> uur</div></div>' +
            '<div><div class="confirm-kicker confirm-kicker--muted">Duur</div><div class="confirm-strong" style="font-size:15.5px;">± 1,5 uur</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="confirm-block"><div class="confirm-block-label">Voorbereiding op uw gesprek</div><ul>' +
          '<li>Houd uw laatste jaarafrekening van energie bij de hand.</li>' +
          '<li>Weet ongeveer hoeveel zonnepanelen u heeft en sinds wanneer.</li>' +
          '<li>Beslist u samen? Zorg dat u er allebei bent, dan hoeft niets dubbel.</li></ul></div>' +
        '<div class="confirm-agenda">' +
          '<div class="confirm-block-label">Voeg de afspraak toe aan uw agenda</div>' +
          '<div class="confirm-agenda-links">' +
            '<a class="btn btn-primary" data-bk="ics2" href="#" download="adviesgesprek-salderingsdienst.ics" data-track="booking_agenda_ics"><svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="11" rx="2"/><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3M8 8.5v3.4M6.4 10.3 8 11.9l1.6-1.6"/></svg>Download .ics</a>' +
            '<a class="btn btn-ghost" data-bk="gcal2" href="#" target="_blank" rel="noopener" data-track="booking_agenda_google">Google Agenda</a>' +
            '<a class="btn btn-ghost" data-bk="outlook2" href="#" target="_blank" rel="noopener" data-track="booking_agenda_outlook">Outlook</a>' +
          '</div>' +
          '<p class="confirm-agenda-note">Werkt met Apple Agenda, Google, Outlook en elke andere agenda-app. De afspraak duurt ± 1,5 uur.</p>' +
        '</div>' +
        '<div class="confirm-actions">' +
          '<button class="btn btn-ghost" data-bk="goportal">Volg uw aanvraag</button>' +
          '<button class="btn btn-ghost" data-bk="goform">Herplannen</button>' +
        '</div>' +
        '<p class="confirm-note">Volg uw aanvraag zonder account, via een persoonlijke link. Geen wachtwoord nodig.</p>' +
      '</div>' +
    '</div>' +

    '<div class="book-view" data-view="portal" hidden>' +
      '<div class="portal">' +
        '<div class="portal-head"><h3>Status van uw aanvraag</h3><span class="portal-ref">Referentie: <strong data-bk="pref"></strong></span></div>' +
        '<p class="portal-link">Opgeslagen op dit apparaat en te openen via uw persoonlijke link: <span data-bk="pmagic"></span></p>' +
        '<div class="timeline">' +
          '<div class="timeline-item"><div class="timeline-rail"><div class="timeline-dot timeline-dot--done">✓</div><div class="timeline-line timeline-line--done"></div></div><div class="timeline-body"><strong>Aangevraagd</strong><span>Door u ingediend</span></div></div>' +
          '<div class="timeline-item"><div class="timeline-rail"><div class="timeline-dot timeline-dot--done">✓</div><div class="timeline-line timeline-line--done"></div></div><div class="timeline-body"><strong>Bevestigd</strong><span data-bk="pslot">Gepland</span></div></div>' +
          '<div class="timeline-item"><div class="timeline-rail"><div class="timeline-dot timeline-dot--current">3</div><div class="timeline-line"></div></div><div class="timeline-body"><strong>Adviesgesprek</strong><span>Bij u thuis</span></div></div>' +
          '<div class="timeline-item"><div class="timeline-rail"><div class="timeline-dot timeline-dot--todo">4</div></div><div class="timeline-body"><strong>Advies of offerte</strong><span>Na het gesprek</span></div></div>' +
        '</div>' +
        '<div class="portal-docs">Documenten van uw gesprek verschijnen hier zodra ze beschikbaar zijn.</div>' +
        '<div class="portal-actions">' +
          '<button class="btn btn-primary" data-bk="goform2">Herplannen of wijzigen</button>' +
          '<a class="btn btn-ghost" data-sd-tel data-track="call_click" href="#adviesgesprek">Bel ons</a>' +
          '<a class="btn btn-ghost" data-sd-wa href="#adviesgesprek">WhatsApp</a>' +
        '</div>' +
      '</div>' +
    '</div>';

  /* ---------- Elementen ---------- */
  function bk(name) { return mount.querySelector('[data-bk="' + name + '"]'); }
  var els = {
    views: mount.querySelectorAll('.book-view'),
    restore: bk('restore'), restoreclose: bk('restoreclose'),
    steplabel: bk('steplabel'), stepname: bk('stepname'),
    segs: mount.querySelectorAll('[data-seg]'),
    products: bk('products'), woning: bk('woning'), woningflag: bk('woningflag'),
    date: bk('date'), times: bk('times'),
    naam: bk('naam'), email: bk('email'), tel: bk('tel'),
    postcode: bk('postcode'), huisnummer: bk('huisnummer'),
    partner: bk('partner'), partnerflag: bk('partnerflag'),
    leeftijd: bk('leeftijd'), investblok: bk('investblok'), invest: bk('invest'), investflag: bk('investflag'),
    verwachting: bk('verwachting'), sendinfo: bk('sendinfo'),
    s3title: bk('s3title'), summary: bk('summary'),
    submit: bk('submit'), submiterror: bk('submiterror'),
    ics: bk('ics'), gcal: bk('gcal'), outlook: bk('outlook'),
    ics2: bk('ics2'), gcal2: bk('gcal2'), outlook2: bk('outlook2'),
    cnaam: bk('cnaam'), cemail: bk('cemail'), cdate: bk('cdate'), ctime: bk('ctime'),
    pref: bk('pref'), pmagic: bk('pmagic'), pslot: bk('pslot')
  };

  /* ---------- Validatie per veld ---------- */
  var validators = {
    products: function () { return state.products.length > 0; },
    woning: function () { return !!state.woning; },
    moment: function () { return hasDT(); },
    naam: function () { return state.naam.trim().length >= 2; },
    email: validEmail,
    tel: validTel,
    adres: function () { return validPostcode() && state.huisnummer.trim().length > 0; },
    partner: function () { return !!state.partner; },
    leeftijd: function () { return !!state.leeftijd; },
    invest: function () { return state.leeftijd !== '75+' || state.invest !== null; },
    verwachting: function () { return !!state.verwachting; }
  };
  var STEP_FIELDS = {
    1: ['products', 'woning', 'moment'],
    2: ['naam', 'email', 'tel', 'adres', 'partner', 'leeftijd', 'invest', 'verwachting']
  };
  function fieldBox(key) { return mount.querySelector('[data-field="' + key + '"]'); }
  function setFieldError(key, show) {
    var box = fieldBox(key);
    if (!box) return;
    box.classList.toggle('bfield--invalid', !!show);
    box.classList.toggle('bfield--valid', !show && validators[key]());
    var err = box.querySelector('.bfield-error');
    if (err) err.hidden = !show;
  }
  function revalidate(key) { setFieldError(key, !validators[key]()); }
  function clearIfValid(key) { if (validators[key]()) setFieldError(key, false); }
  function validateStep(n) {
    var firstBad = null;
    (STEP_FIELDS[n] || []).forEach(function (key) {
      var ok = validators[key]();
      setFieldError(key, !ok);
      if (!ok && !firstBad) firstBad = key;
    });
    if (firstBad) {
      var box = fieldBox(firstBad);
      var input = box && box.querySelector('input');
      if (input) input.focus();
      else if (box) box.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    return !firstBad;
  }

  /* ---------- Chips en radio's ---------- */
  function buildChips(holder, items, opts) {
    holder.innerHTML = '';
    items.forEach(function (item) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (opts.cls ? ' ' + opts.cls : '');
      b.innerHTML = (opts.cls === 'chip--q' ? '<span class="chip-tick" aria-hidden="true">✓</span>' : '') + esc(opts.text(item));
      if (opts.track) b.setAttribute('data-track', opts.track(item));
      b.setAttribute('aria-pressed', String(opts.isOn(item)));
      b.addEventListener('click', function () {
        opts.pick(item);
        holder.querySelectorAll('.chip').forEach(function (c, i) {
          c.setAttribute('aria-pressed', String(opts.isOn(items[i])));
        });
        opts.after();
      });
      holder.appendChild(b);
    });
  }
  var radioSeq = 0;
  function buildRadios(holder, name, items, isOn, onPick, trackPrefix) {
    holder.innerHTML = '';
    var group = 'bk-' + name + '-' + (++radioSeq);
    items.forEach(function (item) {
      var label = document.createElement('label');
      label.className = 'bradio';
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = group;
      input.value = item.id;
      input.checked = isOn(item);
      if (trackPrefix) input.setAttribute('data-track', trackPrefix + (item.track || item.id));
      var span = document.createElement('span');
      span.textContent = item.t;
      label.appendChild(input); label.appendChild(span);
      if (input.checked) label.classList.add('bradio--on');
      input.addEventListener('change', function () {
        onPick(item);
        holder.querySelectorAll('.bradio').forEach(function (l, i) {
          l.classList.toggle('bradio--on', isOn(items[i]));
        });
        afterChange();
      });
      holder.appendChild(label);
    });
  }

  function renderAll() {
    buildChips(els.products, PRODUCTS, {
      cls: 'chip--q',
      text: function (o) { return o.t; },
      track: function (o) { return 'booking_product_' + o.id; },
      isOn: function (o) { return state.products.indexOf(o.id) !== -1; },
      pick: function (o) {
        var i = state.products.indexOf(o.id);
        if (i === -1) state.products.push(o.id); else state.products.splice(i, 1);
        SD.fire('qual_interest_selected');
      },
      after: function () { clearIfValid('products'); afterChange(); }
    });
    buildRadios(els.woning, 'woning', WONING,
      function (o) { return state.woning === o.id; },
      function (o) { state.woning = o.id; clearIfValid('woning'); },
      'booking_woning_');
    buildChips(els.times, TIMES.map(function (t) { return { id: t, t: t }; }), {
      text: function (o) { return o.t; },
      isOn: function (o) { return state.time === o.id; },
      pick: function (o) { state.time = o.id; },
      after: function () { clearIfValid('moment'); afterChange(); }
    });
    buildRadios(els.partner, 'partner', PARTNER,
      function (o) { return state.partner === o.id; },
      function (o) { state.partner = o.id; clearIfValid('partner'); },
      'booking_partner_');
    buildRadios(els.leeftijd, 'leeftijd', LEEFTIJD,
      function (o) { return state.leeftijd === o.id; },
      function (o) {
        state.leeftijd = o.id;
        if (o.id === '<75') state.invest = null;
        clearIfValid('leeftijd'); clearIfValid('invest');
      },
      'booking_leeftijd_');
    buildRadios(els.invest, 'invest', INVEST,
      function (o) { return state.invest === o.id; },
      function (o) { state.invest = o.id; clearIfValid('invest'); },
      'booking_leeftijd_');
  }

  /* ---------- Flags en afgeleide UI (neutrale info, geen waarschuwing) ---------- */
  function afterChange() {
    els.woningflag.hidden = !(state.woning === 'huurwoning' || state.woning === 'anders');
    els.partnerflag.hidden = state.partner !== 'partner_afwezig';
    els.investblok.hidden = state.leeftijd !== '75+';
    els.investflag.hidden = state.invest !== 'nee';
    fireProgress();
    saveDraftSoon();
    notifyHeight();
  }
  function fireProgress() {
    if (state.products.length || state.dateIso || state.naam) SD.fire('booking_started', { source: sourceTag });
    if (hasDT()) SD.fire('slot_selected');
    if (state.naam.trim() && validEmail()) SD.fire('contact_filled');
  }
  function maybeSoftLead() {
    if (state.softLeadSaved) return;
    if (state.naam.trim() && (validEmail() || state.tel.trim())) {
      try { localStorage.setItem('sd_soft_lead', JSON.stringify({ naam: state.naam, email: state.email, tel: state.tel, ts: Date.now() })); } catch (e) {}
      SD.track('soft_lead');
      state.softLeadSaved = true;
    }
  }

  /* ---------- Tekstvelden: on-blur validatie, Enter = volgend veld ---------- */
  function bindText(el, key, prop) {
    el.addEventListener('input', function () {
      state[prop] = el.value;
      clearIfValid(key);
      maybeSoftLead();
      saveDraftSoon();
    });
    el.addEventListener('blur', function () { if (state[prop]) revalidate(key); });
  }
  bindText(els.naam, 'naam', 'naam');
  bindText(els.email, 'email', 'email');
  bindText(els.tel, 'tel', 'tel');
  bindText(els.postcode, 'adres', 'postcode');
  bindText(els.huisnummer, 'adres', 'huisnummer');
  els.date.addEventListener('change', function () {
    state.dateIso = validDate(els.date.value) ? els.date.value : null;
    clearIfValid('moment');
    saveDraftSoon();
  });
  els.date.addEventListener('blur', function () { if (els.date.value) revalidate('moment'); });
  els.verwachting.addEventListener('change', function () {
    state.verwachting = els.verwachting.checked;
    clearIfValid('verwachting');
    saveDraftSoon();
  });
  els.sendinfo.addEventListener('change', function () {
    state.sendInfo = els.sendinfo.checked;
    if (state.sendInfo) SD.track('lead_capture', { via: 'booking' });
    saveDraftSoon();
  });
  mount.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var t = e.target;
    if (t.tagName !== 'INPUT' || t.type === 'checkbox' || t.type === 'radio') return;
    e.preventDefault();
    var step = t.closest('.bstep');
    if (!step) return;
    var fields = Array.prototype.slice.call(step.querySelectorAll('input.field'));
    var next = fields[fields.indexOf(t) + 1];
    if (next) next.focus();
  });

  /* ---------- Stappen ---------- */
  function showView(name) {
    state.view = name;
    els.views.forEach(function (v) { v.hidden = v.getAttribute('data-view') !== name; });
    notifyHeight();
  }
  function showStep(n, moveFocus) {
    state.step = n;
    mount.querySelectorAll('.bstep').forEach(function (s) {
      s.hidden = s.getAttribute('data-bstep') !== String(n);
    });
    els.steplabel.textContent = 'Stap ' + n + ' van ' + STEPS;
    els.stepname.textContent = STEP_LABELS[n - 1];
    els.segs.forEach(function (seg, i) { seg.classList.toggle('on', i < n); });
    if (n === 3) renderSummary();
    if (moveFocus) {
      mount.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
      var target = n === 3 ? els.s3title
        : mount.querySelector('.bstep[data-bstep="' + n + '"] input, .bstep[data-bstep="' + n + '"] .chip');
      if (target) target.focus({ preventScroll: true });
    }
    SD.track('booking_step' + n + '_view');
    saveDraftSoon();
    notifyHeight();
  }
  mount.addEventListener('click', function (e) {
    var next = e.target.closest('[data-bnext]');
    if (next) {
      var to = parseInt(next.getAttribute('data-bnext'), 10);
      if (validateStep(to - 1)) showStep(to, true);
      else notifyHeight();
      return;
    }
    var back = e.target.closest('[data-bback]');
    if (back) { showStep(parseInt(back.getAttribute('data-bback'), 10), true); return; }
    var goto = e.target.closest('[data-bgoto]');
    if (goto) { showStep(parseInt(goto.getAttribute('data-bgoto'), 10), true); }
  });

  /* ---------- Stap 3: samenvatting + agenda ---------- */
  function summaryRow(label, value, gotoStep) {
    return '<div class="bsum-row"><dt>' + esc(label) + '</dt><dd>' + value + '</dd>' +
      (gotoStep ? '<button type="button" class="bsum-edit" data-bgoto="' + gotoStep + '">Wijzigen</button>' : '<span class="bsum-edit" aria-hidden="true"></span>') +
      '</div>';
  }
  function renderSummary() {
    var partnerText = state.partner === 'samen' ? 'Aanwezig bij het gesprek'
      : state.partner === 'partner_afwezig' ? 'Niet aanwezig bij het gesprek'
      : 'U woont alleen';
    els.summary.innerHTML = '<dl>' +
      summaryRow('Advies over', esc(productLabels()), 1) +
      summaryRow('Woning', esc(optLabel(WONING, state.woning)) + ', ' + esc(state.postcode.toUpperCase() + ' ' + state.huisnummer), 1) +
      summaryRow('Datum en tijd', esc(cap(fmtFull(state.dateIso)) + ' om ' + state.time + ' uur'), 1) +
      summaryRow('Gespreksduur', '1,5 uur', 0) +
      summaryRow('Met', esc(state.naam), 2) +
      summaryRow('Partner', esc(partnerText), 2) +
      summaryRow('Contact', esc(state.email) + ' / ' + esc(state.tel), 2) +
      '</dl>';
    setAgendaLinks([els.ics, els.gcal, els.outlook]);
    els.submiterror.hidden = true;
  }

  /* ---------- Agenda (.ics + Google + Outlook, lokale tijd) ---------- */
  var EVT_TITLE = 'Adviesgesprek SalderingsDienst';
  function evtTimes() {
    var ds = new Date(state.dateIso + 'T' + state.time + ':00');
    return { start: ds, end: new Date(ds.getTime() + DURATION_MIN * 60000) };
  }
  function evtLocation() {
    var pc = state.postcode.trim().toUpperCase(), nr = state.huisnummer.trim();
    return pc && nr ? pc + ' ' + nr : 'Bij u thuis';
  }
  function evtDescription() {
    return 'Persoonlijk adviesgesprek over ' + productLabels() + '.\n\n'
      + 'Uw adviseur bespreekt: salderingsregeling 2027, thuisbatterij, warmtepomp, EMS-handel.\n\n'
      + 'Duur: 1,5 uur.\n\nSalderingsDienst, onafhankelijk adviesbureau'
      + (state.bookingRef ? '\nReferentie: ' + state.bookingRef : '');
  }
  function fmtCompact(x) { return '' + x.getFullYear() + pad2(x.getMonth() + 1) + pad2(x.getDate()) + 'T' + pad2(x.getHours()) + pad2(x.getMinutes()) + '00'; }
  function icsEscape(s) { return s.replace(/\\/g, '\\\\').replace(/[,;]/g, '\\$&').replace(/\n/g, '\\n'); }
  function icsHref() {
    if (!hasDT()) return '#';
    var t = evtTimes();
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SalderingsDienst//NL', 'BEGIN:VEVENT',
      'UID:' + (state.bookingRef || Date.now()) + '@salderingsdienst.nl',
      'DTSTAMP:' + fmtCompact(new Date()),
      'DTSTART:' + fmtCompact(t.start), 'DTEND:' + fmtCompact(t.end),
      'SUMMARY:' + icsEscape(EVT_TITLE),
      'LOCATION:' + icsEscape(evtLocation()),
      'DESCRIPTION:' + icsEscape(evtDescription()),
      'STATUS:CONFIRMED',
      /* Herinnering 24 uur voor aanvang */
      'BEGIN:VALARM', 'TRIGGER:-PT24H', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape(EVT_TITLE), 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  }
  /* Google krijgt lokale tijd + expliciete tijdzone (ctz) in plaats van
     UTC: dat blijft ook rond zomer-/wintertijd correct. */
  function gcalHref() {
    if (!hasDT()) return '#';
    var t = evtTimes();
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + '&text=' + encodeURIComponent(EVT_TITLE)
      + '&dates=' + fmtCompact(t.start) + '/' + fmtCompact(t.end)
      + '&ctz=Europe/Amsterdam'
      + '&location=' + encodeURIComponent(evtLocation())
      + '&details=' + encodeURIComponent(evtDescription());
  }
  function outlookHref() {
    if (!hasDT()) return '#';
    var t = evtTimes();
    var iso = function (x) { return localIso(x) + 'T' + pad2(x.getHours()) + ':' + pad2(x.getMinutes()) + ':00'; };
    return 'https://outlook.live.com/calendar/0/action/compose?rru=addevent'
      + '&subject=' + encodeURIComponent(EVT_TITLE)
      + '&startdt=' + iso(t.start) + '&enddt=' + iso(t.end)
      + '&location=' + encodeURIComponent(evtLocation())
      + '&body=' + encodeURIComponent(evtDescription());
  }
  function setAgendaLinks(list) {
    if (list[0]) list[0].href = icsHref();
    if (list[1]) list[1].href = gcalHref();
    if (list[2]) list[2].href = outlookHref();
  }

  /* ---------- Leadpakket (schema sd.lead.v1) + backend-POST ---------- */
  function buildLead(ref) {
    var qual = buildQualification();
    return {
      schema: 'sd.lead.v1',
      type: 'adviesgesprek',
      ref: ref,
      createdAt: new Date().toISOString(),
      contact: {
        naam: state.naam.trim(), email: state.email.trim(), tel: state.tel.trim(),
        postcode: state.postcode.trim().toUpperCase(), huisnummer: state.huisnummer.trim()
      },
      appointment: { dateIso: state.dateIso, time: state.time, durationMin: DURATION_MIN, mode: 'thuis', timezone: 'Europe/Amsterdam' },
      qualification: qual,
      status: deriveStatus(qual), /* indicatief; server-side is leidend */
      briefcode: null,
      consent: { privacyNotice: true, infoEmail: state.sendInfo },
      source: { page: location.pathname, utm: SD.utm || {}, channel: inIframe ? 'embed' : 'site', partner: sourceTag }
    };
  }
  function postBooking(lead) {
    var ep = CFG.bookingEndpoint !== undefined ? CFG.bookingEndpoint : '/api/bookings';
    if (!ep || !window.fetch) {
      /* Geen endpoint geconfigureerd: de wachtrij (sd_lead_queue) is de bron. */
      return Promise.resolve({ ok: true, offline: true });
    }
    var timeout = new Promise(function (_, reject) { setTimeout(function () { reject(new Error('timeout')); }, 8000); });
    var req = fetch(ep, {
      method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    });
    return Promise.race([req, timeout]);
  }

  var submitting = false;
  els.submit.addEventListener('click', function () {
    if (submitting) return;
    /* Vangnet: stap 1 en 2 zijn al gevalideerd om hier te komen. */
    if (!validateStep(1)) { showStep(1, true); return; }
    if (!validateStep(2)) { showStep(2, true); return; }

    submitting = true;
    els.submiterror.hidden = true;
    els.submit.disabled = true;
    els.submit.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span>Bezig met verwerken...';

    var ref = state.bookingRef || ('SD-' + Date.now().toString(36).toUpperCase().slice(-6));
    state.bookingRef = ref;
    var lead = buildLead(ref);
    if (SD.lead) SD.lead(lead); /* wachtrij + CustomEvent, ook als de POST faalt */

    function done(ok) {
      submitting = false;
      els.submit.disabled = false;
      els.submit.textContent = 'Bevestig mijn adviesgesprek';
      if (!ok) {
        els.submiterror.hidden = false;
        SD.track('booking_submit_error');
        notifyHeight();
        return;
      }
      try { localStorage.setItem('sd_adviesgesprek', JSON.stringify(persistShape(ref))); } catch (e) {}
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
      SD.fire('booking_completed', { ref: ref, sendInfo: state.sendInfo, status: lead.status, source: sourceTag });
      SD.track('booking_step3_success');
      SD.track('booking_qualification', { status: lead.status });
      fillConfirm();
      showView('confirm');
    }
    postBooking(lead).then(
      function (res) { done(!!(res && res.ok)); },
      function () { done(false); }
    );
  });

  function persistShape(ref) {
    return {
      ref: ref, dateIso: state.dateIso, time: state.time,
      naam: state.naam, email: state.email, tel: state.tel,
      postcode: state.postcode, huisnummer: state.huisnummer,
      products: state.products, woning: state.woning, partner: state.partner,
      leeftijd: state.leeftijd, invest: state.invest,
      verwachting: state.verwachting, sendInfo: state.sendInfo
    };
  }

  /* ---------- Concept (sd_booking_draft): opslaan en herstellen ---------- */
  function hasAnyInput(d) {
    return !!((d.products && d.products.length) || d.woning || d.dateIso || d.time ||
      (d.naam && d.naam.trim()) || (d.email && d.email.trim()) || (d.tel && d.tel.trim()) ||
      (d.postcode && d.postcode.trim()) || d.partner || d.leeftijd || d.verwachting);
  }
  var draftTimer = null;
  function saveDraftSoon() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(function () {
      if (!hasAnyInput(state)) return; /* geen leeg concept bewaren */
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          step: state.step,
          formData: persistShape(''),
          timestamp: new Date().toISOString()
        }));
      } catch (e) {}
    }, 500);
  }
  function applyStored(d) {
    state.products = Array.isArray(d.products) ? d.products : (d.interests || []);
    state.woning = d.woning === 'koop' ? 'koopwoning' : d.woning === 'huur' ? 'huurwoning' : (d.woning || null);
    state.dateIso = validDate(d.dateIso) ? d.dateIso : null;
    state.time = TIMES.indexOf(d.time) !== -1 ? d.time : null;
    state.naam = d.naam || ''; state.email = d.email || ''; state.tel = d.tel || '';
    state.postcode = d.postcode || ''; state.huisnummer = d.huisnummer || '';
    state.partner = d.partner || null;
    state.leeftijd = d.leeftijd || (d.jonger75 === true ? '<75' : d.jonger75 === false ? '75+' : null);
    state.invest = d.invest || (d.eigenMiddelen === true ? 'ja' : d.eigenMiddelen === false ? 'nee' : null);
    state.verwachting = !!d.verwachting;
    state.sendInfo = !!d.sendInfo;
    els.naam.value = state.naam; els.email.value = state.email; els.tel.value = state.tel;
    els.postcode.value = state.postcode; els.huisnummer.value = state.huisnummer;
    els.date.value = state.dateIso || '';
    els.verwachting.checked = state.verwachting;
    els.sendinfo.checked = state.sendInfo;
    renderAll();
    afterChange();
  }
  function restoreDraft() {
    var draft = null;
    try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch (e) {}
    if (!draft || !draft.formData || !hasAnyInput(draft.formData)) return false;
    var age = Date.now() - new Date(draft.timestamp || 0).getTime();
    if (!(age >= 0 && age < DRAFT_MAX_AGE)) {
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
      return false;
    }
    applyStored(draft.formData);
    state.step = [1, 2, 3].indexOf(draft.step) !== -1 ? draft.step : 1;
    /* Nooit verder dan de eerste onvolledige stap herstellen. */
    if (state.step > 1 && !validators.products() ) state.step = 1;
    els.restore.hidden = false;
    SD.track('booking_draft_restored');
    return true;
  }
  els.restoreclose.addEventListener('click', function () { els.restore.hidden = true; notifyHeight(); });

  /* ---------- Bevestiging en portaal ---------- */
  function fillConfirm() {
    els.cnaam.textContent = state.naam;
    els.cemail.textContent = state.email;
    els.cdate.textContent = state.dateIso ? cap(fmtFull(state.dateIso)) : '';
    els.ctime.textContent = state.time || '';
    setAgendaLinks([els.ics2, els.gcal2, els.outlook2]);
  }
  function fillPortal() {
    var ref = state.bookingRef || 'SD-XXXXXX';
    els.pref.textContent = ref;
    els.pmagic.textContent = 'salderingsdienst.nl/aanvraag?volg=' + ref;
    els.pslot.textContent = state.dateIso ? (fmtFull(state.dateIso) + ' om ' + (state.time || '') + ' uur') : 'Gepland';
  }
  bk('goportal').addEventListener('click', function () { SD.fire('portal_view'); fillPortal(); showView('portal'); });
  [bk('goform'), bk('goform2')].forEach(function (btn) {
    btn.addEventListener('click', function () {
      SD.track('reschedule_start');
      renderAll(); afterChange();
      showStep(1, true);
      showView('form');
    });
  });

  /* ---------- Embed: hoogte doorgeven aan host-pagina ---------- */
  var heightPending = false;
  function notifyHeight() {
    if (!inIframe) return;
    if (heightPending) return;
    heightPending = true;
    requestAnimationFrame(function () {
      heightPending = false;
      try {
        window.parent.postMessage({ type: 'sd-widget-height', height: document.documentElement.scrollHeight }, '*');
      } catch (e) {}
    });
  }
  window.addEventListener('load', notifyHeight);
  window.addEventListener('resize', notifyHeight);

  /* ---------- Init: bevestigde boeking, ?volg= of concept ---------- */
  if (SD.applyContacts) SD.applyContacts(mount);
  renderAll();

  var wantPortal = false;
  try { wantPortal = !!new URLSearchParams(location.search).get('volg'); } catch (e) {}

  var stored = null;
  try { stored = JSON.parse(localStorage.getItem('sd_adviesgesprek')); } catch (e) {}
  if (stored) {
    applyStored(stored);
    state.bookingRef = stored.ref || '';
    if (wantPortal) { fillPortal(); showView('portal'); }
    else { fillConfirm(); showView('confirm'); }
  } else if (wantPortal) {
    fillPortal();
    showView('portal');
  } else {
    restoreDraft();
  }

  afterChange();
  showStep(state.step);
  SD.track('booking_page_view', { source: sourceTag, channel: inIframe ? 'embed' : 'site' });
})();
