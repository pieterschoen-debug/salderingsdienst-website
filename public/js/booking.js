/* ============================================================
   SalderingsDienst — booking.js
   Zelf-renderend boekingscomponent. Mount: [data-booking].
   Draait identiek op de eigen pagina (index.html) en in het
   embedbare widget (widget.html via js/embed.js op partnersites).

   Flow: zes korte stappen, één vraag per scherm. De zes
   kwalificatiepunten ("6 van Succes") zijn verweven in stappen
   die de bezoeker toch al doorloopt:
     1. Advies over        → productinteresse
     2. Woning             → koopwoning
     3. Moment (± 1,5 uur) → datum/tijd/duur
     4. Gesprek            → locatie + beide beslissers aanwezig
     5. Over u             → leeftijd (+ eigen middelen bij 75+)
     6. Gegevens           → contact + verwachtingspatroon
   De boeking gaat ALTIJD door; de kwalificatie bepaalt alleen de
   interne status: 'warm_gekwalificeerd' of 'niet_gekwalificeerd'.

   Uitkanalen per bevestigde afspraak:
   1. localStorage 'sd_adviesgesprek' + wachtrij 'sd_lead_queue'
   2. CustomEvent 'sd:lead' (via SD.lead in motion.js)
   3. POST naar SD_CONFIG.bookingEndpoint (default /api/bookings)
   4. optionele POST naar SD_CONFIG.leadEndpoint (webhook/CRM)
   Beschikbaarheid is nog een stub (10 werkdagen vooruit):
   vervang fetchAvailability() door een echte bron bij livegang.
   Let op: nooit toISOString() voor lokale datums (CET-verschuiving).
   ============================================================ */
(function () {
  'use strict';

  var mount = document.querySelector('[data-booking]');
  if (!mount) return;

  var SD = window.SD || { track: function () {}, fire: function () {}, utm: {} };
  var CFG = window.SD_CONFIG || {};
  var DURATION_MIN = 90; /* het gesprek duurt ± 1,5 uur */

  /* ---------- Context: eigen pagina of embed ---------- */
  var inIframe = false;
  try { inIframe = window.self !== window.top; } catch (e) { inIframe = true; }
  var srcParam = null;
  try { srcParam = new URLSearchParams(location.search).get('source'); } catch (e) {}
  var sourceTag = srcParam || mount.getAttribute('data-source') || 'site';

  /* ---------- State ---------- */
  var state = {
    step: 1,
    interests: [],            /* 1. productinteresse */
    woning: null,             /* 2. 'koop' | 'huur' */
    dateIso: null, time: null,/* 3. moment */
    mode: 'thuis',            /* 4. locatie */
    partner: null,            /* 4. 'samen' | 'partner_afwezig' | 'alleen' */
    jonger75: null,           /* 5. true | false */
    eigenMiddelen: null,      /* 5. true | false | null (alleen relevant bij 75+) */
    verwachting: false,       /* 6. verwachtingspatroon begrepen */
    naam: '', email: '', tel: '', briefcode: '', sendInfo: false,
    view: 'form', bookingRef: '', softLeadSaved: false
  };
  var STEPS = 6;
  var STEP_LABELS = ['Advies', 'Woning', 'Moment', 'Gesprek', 'Over u', 'Gegevens'];

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

  /* Beschikbaarheid: stub, 10 werkdagen vooruit. */
  function fetchAvailability() {
    var wk = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
    var mo = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    var out = []; var d = new Date(); d.setHours(0, 0, 0, 0); var g = 0;
    while (out.length < 10 && g < 40) {
      d.setDate(d.getDate() + 1); g++;
      var dow = d.getDay(); if (dow === 0 || dow === 6) continue;
      out.push({ iso: localIso(d), wk: wk[dow], day: d.getDate(), mon: mo[d.getMonth()] });
    }
    return out;
  }
  var TIMES = ['09:00', '10:30', '13:00', '15:00', '16:30'];
  var slots = fetchAvailability();

  var INTERESTS = [
    { id: 'zonnepanelen', t: 'Zonnepanelen na 2027' },
    { id: 'thuisbatterij', t: 'Thuisbatterij' },
    { id: 'warmtepomp', t: 'Warmtepomp' }
  ];
  var WONING = [{ id: 'koop', t: 'Koopwoning' }, { id: 'huur', t: 'Huurwoning' }];
  var MODES = [{ id: 'thuis', t: 'Bij mij thuis' }, { id: 'online', t: 'Online' }];
  var PARTNER = [
    { id: 'samen', t: 'Ja, en die is bij het gesprek' },
    { id: 'partner_afwezig', t: 'Ja, maar die kan er niet bij zijn' },
    { id: 'alleen', t: 'Nee, ik beslis alleen' }
  ];
  var JA_NEE = [{ id: 'ja', t: 'Ja' }, { id: 'nee', t: 'Nee' }];
  var MIDDELEN = [{ id: 'ja', t: 'Ja' }, { id: 'nee', t: 'Nee / weet ik nog niet' }];

  function validEmail() { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(state.email.trim()); }
  function hasDT() { return !!(state.dateIso && state.time); }

  /* ---------- Kwalificatie ("6 van Succes") ---------- */
  function buildQualification() {
    return {
      productinteresse: state.interests.slice(),
      koopwoning: state.woning === 'koop',
      afspraakBevestigd: hasDT() && state.verwachting !== null,
      beideBeslissersAanwezig: state.partner === 'samen' || state.partner === 'alleen',
      partnerSituatie: state.partner,
      jongerDan75: state.jonger75 === true,
      eigenInvestering: state.jonger75 === false ? state.eigenMiddelen === true : null,
      verwachtingBegrepen: !!state.verwachting,
      durationMin: DURATION_MIN
    };
  }
  function deriveStatus(q) {
    var ok = q.productinteresse.length > 0 &&
      q.koopwoning &&
      q.afspraakBevestigd &&
      q.beideBeslissersAanwezig &&
      (q.jongerDan75 || q.eigenInvestering === true) &&
      q.verwachtingBegrepen;
    return ok ? 'warm_gekwalificeerd' : 'niet_gekwalificeerd';
  }

  /* ---------- Template ---------- */
  function chipsHtml(name, extraClass) {
    return '<div class="chips' + (extraClass ? ' ' + extraClass : '') + '" data-bk="' + name + '"></div>';
  }
  mount.innerHTML =
    '<div class="book-view" data-view="form">' +
      '<div class="book-flow">' +
        '<div class="bprogress" aria-hidden="false">' +
          '<div class="bprogress-top"><span class="bprogress-label" data-bk="steplabel">Stap 1 van ' + STEPS + '</span><span class="bprogress-name" data-bk="stepname"></span></div>' +
          '<div class="bprogress-track"><div class="bprogress-fill" data-bk="fill"></div></div>' +
        '</div>' +

        '<div class="bstep" data-bstep="1">' +
          '<div class="book-step-label">Waar wilt u advies over?</div>' +
          '<p class="bstep-note" style="margin-top:0;">Kies wat voor u speelt. Meerdere keuzes mogelijk.</p>' +
          chipsHtml('interests') +
          '<div class="bstep-nav"><span class="bstep-hint" data-bk="hint1">Kies minimaal één onderwerp.</span>' +
          '<button class="btn btn-primary" data-bnext="2" disabled>Verder →</button></div>' +
        '</div>' +

        '<div class="bstep" data-bstep="2" hidden>' +
          '<div class="book-step-label">Woont u in een koop- of huurwoning?</div>' +
          chipsHtml('woning') +
          '<p class="bstep-note" data-bk="woningnote">Zo stemmen we het advies af op uw woonsituatie.</p>' +
          '<div class="bstep-nav"><button class="btn btn-ghost" data-bback="1">← Terug</button>' +
          '<button class="btn btn-primary" data-bnext="3" disabled>Verder →</button></div>' +
        '</div>' +

        '<div class="bstep" data-bstep="3" hidden>' +
          '<div class="book-step-label">Kies een datum</div>' +
          '<div class="book-noslots" data-bk="noslots" hidden>Er is op dit moment geen beschikbaarheid. Laat uw gegevens achter, dan plannen wij met u in.</div>' +
          chipsHtml('dates') +
          '<div class="book-step-label" style="margin-top:26px;">Kies een tijd</div>' +
          chipsHtml('times') +
          '<p class="bstep-note">Reserveer ruim: het gesprek duurt ongeveer <strong>1,5 uur</strong>.</p>' +
          '<div class="bstep-nav"><button class="btn btn-ghost" data-bback="2">← Terug</button>' +
          '<button class="btn btn-primary" data-bnext="4" disabled>Verder →</button></div>' +
        '</div>' +

        '<div class="bstep" data-bstep="4" hidden>' +
          '<div class="book-step-label">Waar wilt u het gesprek?</div>' +
          chipsHtml('modes') +
          '<div class="book-step-label" style="margin-top:26px;">Beslist u samen met iemand?</div>' +
          chipsHtml('partner', 'chips--column') +
          '<p class="bstep-note">Beslist u samen? Plan het moment dan zo dat u er allebei bij kunt zijn; dat voorkomt een tweede gesprek.</p>' +
          '<div class="bstep-nav"><button class="btn btn-ghost" data-bback="3">← Terug</button>' +
          '<button class="btn btn-primary" data-bnext="5" disabled>Verder →</button></div>' +
        '</div>' +

        '<div class="bstep" data-bstep="5" hidden>' +
          '<div class="book-step-label">Bent u jonger dan 75?</div>' +
          chipsHtml('jonger75') +
          '<div data-bk="middelenblok" hidden>' +
            '<div class="book-step-label" style="margin-top:26px;">Zou u een eventuele investering uit eigen middelen doen?</div>' +
            chipsHtml('middelen') +
          '</div>' +
          '<p class="bstep-note">Waarom we dit vragen: sommige regelingen en financieringen zijn leeftijdsgebonden. Zo weet de adviseur wat er voor u geldt.</p>' +
          '<div class="bstep-nav"><button class="btn btn-ghost" data-bback="4">← Terug</button>' +
          '<button class="btn btn-primary" data-bnext="6" disabled>Verder →</button></div>' +
        '</div>' +

        '<div class="bstep" data-bstep="6" hidden>' +
          '<div class="book-step-label">Uw gegevens</div>' +
          '<div class="book-privacy"><span>Uw gegevens worden uitsluitend gebruikt voor dit adviesgesprek en niet gedeeld met derden. Zie ons <a href="privacybeleid.html" target="_blank" rel="noopener">privacybeleid</a>.</span></div>' +
          '<div class="book-fields">' +
            '<div class="ffield"><input class="field" data-bk="naam" id="bk-naam" placeholder=" " autocomplete="name"><label for="bk-naam">Naam</label></div>' +
            '<div class="ffield"><input class="field" data-bk="email" id="bk-email" type="email" placeholder=" " autocomplete="email"><label for="bk-email">E-mailadres</label><small class="ffield-hint">Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl.</small></div>' +
            '<div class="ffield"><input class="field" data-bk="tel" id="bk-tel" type="tel" placeholder=" " autocomplete="tel"><label for="bk-tel">Telefoon (optioneel)</label></div>' +
            '<div class="ffield"><input class="field" data-bk="briefcode" id="bk-briefcode" placeholder=" "><label for="bk-briefcode">Briefcode van uw brief (optioneel)</label></div>' +
          '</div>' +
          '<label class="book-optin"><input type="checkbox" data-bk="verwachting"><span>Ik weet dat de adviseur kosteloos en vrijblijvend langskomt, en dat SalderingsDienst het ook echt voor mij kan regelen als het advies past.</span></label>' +
          '<label class="book-optin"><input type="checkbox" data-bk="sendinfo"><span>Stuur mij ook alvast de heldere uitleg over het einde van de saldering per e-mail (vrijblijvend).</span></label>' +
          '<div class="book-summary" data-bk="summary"></div>' +
          '<div class="book-missing" role="status" data-bk="missing" hidden><span aria-hidden="true" style="flex-shrink:0; font-weight:700;">!</span><span data-bk="missingtext"></span></div>' +
          '<button class="btn btn-primary book-submit" data-bk="submit">Bevestig gratis adviesgesprek</button>' +
          '<p class="book-footnote">U ontvangt direct een bevestiging. Wij nemen binnen 24 uur contact op. Kosteloos en vrijblijvend, geen account nodig.</p>' +
          '<div class="bstep-nav" style="justify-content:flex-start; border-top:none; padding-top:0; margin-top:10px;"><button class="btn btn-ghost" data-bback="5">← Terug</button></div>' +
          '<div class="book-meta"><span>KvK <span class="kvk" data-sd-kvk></span></span><span>Kosteloos &amp; vrijblijvend</span><span>Onafhankelijk advies</span></div>' +
          '<div class="book-alt">Liever telefonisch? <a data-sd-tel data-track="call_click" href="#adviesgesprek">Bel ons</a> of <a data-sd-wa href="#adviesgesprek">app via WhatsApp</a>.</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="book-view" data-view="confirm" hidden>' +
      '<div class="confirm">' +
        '<div class="confirm-head">' +
          '<div class="confirm-glyph" aria-hidden="true">✓</div>' +
          '<h3>Uw afspraak staat genoteerd</h3>' +
          '<p>Bedankt, <span data-bk="cnaam"></span>. U ontvangt een bevestiging op <span data-bk="cemail"></span>. Wij nemen binnen 24 uur contact met u op.</p>' +
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
        '<div class="confirm-block"><div class="confirm-block-label">Wat kunt u verwachten</div><ul>' +
          '<li>Een eerlijke analyse van uw situatie, zonder verkoopdruk.</li>' +
          '<li>Helder advies over eigen verbruik, opslag en regelingen.</li>' +
          '<li>U beslist daarna in alle rust, nergens aan gebonden.</li></ul></div>' +
        '<div class="confirm-block"><div class="confirm-block-label">Voorbereiding op uw gesprek</div><ul>' +
          '<li>Houd uw laatste jaarafrekening van energie bij de hand.</li>' +
          '<li>Weet ongeveer hoeveel zonnepanelen u heeft en sinds wanneer.</li>' +
          '<li>Beslist u samen? Zorg dat u er allebei bent, dan hoeft niets dubbel.</li></ul></div>' +
        '<div class="confirm-agenda">' +
          '<div class="confirm-block-label">Zet de afspraak in uw agenda</div>' +
          '<div class="confirm-agenda-links">' +
            '<a class="btn btn-primary" data-bk="ics" href="#" download="adviesgesprek-salderingsdienst.ics"><svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="11" rx="2"/><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3M8 8.5v3.4M6.4 10.3 8 11.9l1.6-1.6"/></svg>Agenda (.ics)</a>' +
            '<a class="btn btn-ghost" data-bk="gcal" href="#" target="_blank" rel="noopener">Google Agenda</a>' +
            '<a class="btn btn-ghost" data-bk="outlook" href="#" target="_blank" rel="noopener">Outlook</a>' +
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
          '<div class="timeline-item"><div class="timeline-rail"><div class="timeline-dot timeline-dot--current">3</div><div class="timeline-line"></div></div><div class="timeline-body"><strong>Adviesgesprek</strong><span data-bk="pmode">Bij u thuis</span></div></div>' +
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
  function q(sel) { return mount.querySelector(sel); }
  function bk(name) { return mount.querySelector('[data-bk="' + name + '"]'); }
  var els = {
    views: mount.querySelectorAll('.book-view'),
    interests: bk('interests'), woning: bk('woning'), woningnote: bk('woningnote'),
    dates: bk('dates'), times: bk('times'), noslots: bk('noslots'),
    modes: bk('modes'), partner: bk('partner'),
    jonger75: bk('jonger75'), middelen: bk('middelen'), middelenblok: bk('middelenblok'),
    naam: bk('naam'), email: bk('email'), tel: bk('tel'), briefcode: bk('briefcode'),
    verwachting: bk('verwachting'), sendinfo: bk('sendinfo'),
    summary: bk('summary'), missing: bk('missing'), missingtext: bk('missingtext'),
    submit: bk('submit'),
    steplabel: bk('steplabel'), stepname: bk('stepname'), fill: bk('fill'),
    cnaam: bk('cnaam'), cemail: bk('cemail'), cdate: bk('cdate'), ctime: bk('ctime'),
    ics: bk('ics'), gcal: bk('gcal'), outlook: bk('outlook'),
    pref: bk('pref'), pmagic: bk('pmagic'), pslot: bk('pslot'), pmode: bk('pmode')
  };

  /* ---------- Chips (selectie in-place, focus blijft staan) ---------- */
  function buildChips(holder, items, opts) {
    holder.innerHTML = '';
    items.forEach(function (item) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (opts.cls ? ' ' + opts.cls : '');
      b.innerHTML = opts.html(item);
      b.setAttribute('aria-pressed', String(opts.isOn(item)));
      b.addEventListener('click', function () {
        opts.pick(item);
        holder.querySelectorAll('.chip').forEach(function (c, i) {
          c.setAttribute('aria-pressed', String(opts.isOn(items[i])));
        });
        update();
      });
      holder.appendChild(b);
    });
  }
  function renderAll() {
    buildChips(els.interests, INTERESTS, {
      html: function (o) { return esc(o.t); },
      isOn: function (o) { return state.interests.indexOf(o.id) !== -1; },
      pick: function (o) {
        var i = state.interests.indexOf(o.id);
        if (i === -1) state.interests.push(o.id); else state.interests.splice(i, 1);
        SD.fire('qual_interest_selected');
      }
    });
    buildChips(els.woning, WONING, {
      html: function (o) { return esc(o.t); },
      isOn: function (o) { return state.woning === o.id; },
      pick: function (o) { state.woning = o.id; }
    });
    if (!slots.length) { els.noslots.hidden = false; els.dates.hidden = true; }
    buildChips(els.dates, slots, {
      cls: 'chip--date',
      html: function (o) { return '<span class="wk">' + o.wk + '</span><span class="day">' + o.day + '</span><span class="mon">' + o.mon + '</span>'; },
      isOn: function (o) { return state.dateIso === o.iso; },
      pick: function (o) { state.dateIso = o.iso; }
    });
    buildChips(els.times, TIMES, {
      html: function (t) { return t; },
      isOn: function (t) { return state.time === t; },
      pick: function (t) { state.time = t; }
    });
    buildChips(els.modes, MODES, {
      html: function (m) { return esc(m.t); },
      isOn: function (m) { return state.mode === m.id; },
      pick: function (m) { state.mode = m.id; }
    });
    buildChips(els.partner, PARTNER, {
      html: function (m) { return esc(m.t); },
      isOn: function (m) { return state.partner === m.id; },
      pick: function (m) { state.partner = m.id; }
    });
    buildChips(els.jonger75, JA_NEE, {
      html: function (m) { return esc(m.t); },
      isOn: function (m) { return state.jonger75 === (m.id === 'ja'); },
      pick: function (m) { state.jonger75 = (m.id === 'ja'); if (state.jonger75) state.eigenMiddelen = null; }
    });
    buildChips(els.middelen, MIDDELEN, {
      html: function (m) { return esc(m.t); },
      isOn: function (m) { return state.eigenMiddelen === (m.id === 'ja'); },
      pick: function (m) { state.eigenMiddelen = (m.id === 'ja'); }
    });
  }

  /* ---------- Weergave ---------- */
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
    els.fill.style.transform = 'scaleX(' + (n / STEPS) + ')';
    if (moveFocus) {
      var label = mount.querySelector('.bstep[data-bstep="' + n + '"] .book-step-label');
      if (label) { label.setAttribute('tabindex', '-1'); label.focus({ preventScroll: false }); }
    }
    SD.track('booking_step_view', { step: n });
    notifyHeight();
  }
  mount.addEventListener('click', function (e) {
    var next = e.target.closest('[data-bnext]');
    if (next && !next.disabled) { showStep(parseInt(next.getAttribute('data-bnext'), 10), true); return; }
    var back = e.target.closest('[data-bback]');
    if (back) { showStep(parseInt(back.getAttribute('data-bback'), 10), true); }
  });

  /* ---------- Validatie per stap + samenvatting ---------- */
  function stepReady(n) {
    switch (n) {
      case 1: return state.interests.length > 0;
      case 2: return !!state.woning;
      case 3: return hasDT();
      case 4: return !!state.partner;
      case 5: return state.jonger75 === true || (state.jonger75 === false && state.eigenMiddelen !== null);
      default: return true;
    }
  }
  function missingList() {
    var missing = [];
    if (!state.dateIso) missing.push('een datum');
    if (!state.time) missing.push('een tijd');
    if (!state.naam.trim()) missing.push('uw naam');
    if (!validEmail()) missing.push('een geldig e-mailadres');
    if (!state.verwachting) missing.push('het vinkje bij wat u van het gesprek mag verwachten');
    return missing;
  }
  function update() {
    for (var n = 1; n <= 5; n++) {
      var btn = mount.querySelector('[data-bnext="' + (n + 1) + '"]');
      if (btn) btn.disabled = !stepReady(n);
    }
    var hint1 = bk('hint1');
    if (hint1) hint1.hidden = state.interests.length > 0;
    els.middelenblok.hidden = state.jonger75 !== false;
    els.woningnote.textContent = state.woning === 'huur'
      ? 'Ook voor huurders zetten we de mogelijkheden op een rij; het gesprek gaat gewoon door.'
      : 'Zo stemmen we het advies af op uw woonsituatie.';
    els.summary.innerHTML = hasDT()
      ? 'U bevestigt: <strong>' + esc(cap(fmtFull(state.dateIso))) + ' om ' + esc(state.time) + ' uur</strong>, duur ± 1,5 uur, '
        + (state.mode === 'thuis' ? 'bij u thuis' : 'online') + '. <a href="#" data-bk="editslot">Moment wijzigen</a>'
      : 'Ga terug naar stap 3 om een datum en tijd te kiezen.';
    var edit = bk('editslot');
    if (edit) edit.addEventListener('click', function (e) { e.preventDefault(); showStep(3, true); });
    if (!missingList().length) els.missing.hidden = true;
    fireProgress();
    notifyHeight();
  }
  function fireProgress() {
    if (state.interests.length || state.dateIso || state.naam) SD.fire('booking_started', { briefcode: state.briefcode || null, source: sourceTag });
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
  function setFF(input, valid, invalid) {
    var ff = input.closest('.ffield');
    if (!ff) return;
    ff.classList.toggle('ffield--valid', !!valid);
    ff.classList.toggle('ffield--invalid', !!invalid);
  }
  els.naam.addEventListener('input', function () { state.naam = this.value; setFF(this, state.naam.trim(), false); maybeSoftLead(); update(); });
  els.email.addEventListener('input', function () { state.email = this.value; setFF(this, validEmail(), false); maybeSoftLead(); update(); });
  els.email.addEventListener('blur', function () { setFF(this, validEmail(), state.email.trim() && !validEmail()); });
  els.tel.addEventListener('input', function () { state.tel = this.value; maybeSoftLead(); update(); });
  els.briefcode.addEventListener('input', function () { state.briefcode = this.value; });
  els.verwachting.addEventListener('change', function () { state.verwachting = this.checked; update(); });
  els.sendinfo.addEventListener('change', function () { state.sendInfo = this.checked; });

  /* ---------- Agenda-integratie (.ics + Google + Outlook, lokale tijd) ---------- */
  var EVT_TITLE = 'Gratis adviesgesprek SalderingsDienst';
  function evtTimes() {
    var ds = new Date(state.dateIso + 'T' + state.time + ':00');
    return { start: ds, end: new Date(ds.getTime() + DURATION_MIN * 60000) };
  }
  function evtLocation() { return state.mode === 'thuis' ? 'Bij u thuis' : 'Online (wij bellen u)'; }
  function evtDescription() {
    return 'Uw kosteloze adviesgesprek van ongeveer 1,5 uur (' + (state.mode === 'thuis' ? 'bij u thuis' : 'online') + ').'
      + (state.bookingRef ? ' Referentie: ' + state.bookingRef + '.' : '');
  }
  function fmtCompact(x) { return '' + x.getFullYear() + pad2(x.getMonth() + 1) + pad2(x.getDate()) + 'T' + pad2(x.getHours()) + pad2(x.getMinutes()) + '00'; }
  function icsEscape(s) { return s.replace(/\\/g, '\\\\').replace(/[,;]/g, '\\$&'); }
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
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  }
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

  function fillConfirm() {
    els.cnaam.textContent = state.naam;
    els.cemail.textContent = state.email;
    els.cdate.textContent = state.dateIso ? cap(fmtFull(state.dateIso)) : '';
    els.ctime.textContent = state.time || '';
    els.ics.href = icsHref();
    els.gcal.href = gcalHref();
    els.outlook.href = outlookHref();
  }
  function fillPortal() {
    var ref = state.bookingRef || 'SD-XXXXXX';
    els.pref.textContent = ref;
    els.pmagic.textContent = 'salderingsdienst.nl/aanvraag?volg=' + ref;
    els.pslot.textContent = state.dateIso ? (fmtFull(state.dateIso) + ' om ' + (state.time || '') + ' uur') : 'Gepland';
    els.pmode.textContent = state.mode === 'thuis' ? 'Bij u thuis' : 'Online';
  }

  /* ---------- Leadpakket (schema sd.lead.v1) + backend-POST ---------- */
  function buildLead(ref) {
    var qual = buildQualification();
    return {
      schema: 'sd.lead.v1',
      type: 'adviesgesprek',
      ref: ref,
      createdAt: new Date().toISOString(),
      contact: { naam: state.naam.trim(), email: state.email.trim(), tel: state.tel.trim() },
      appointment: { dateIso: state.dateIso, time: state.time, durationMin: DURATION_MIN, mode: state.mode, timezone: 'Europe/Amsterdam' },
      qualification: qual,
      status: deriveStatus(qual),
      briefcode: state.briefcode.trim().toUpperCase() || null,
      consent: { privacyNotice: true, infoEmail: state.sendInfo },
      source: { page: location.pathname, utm: SD.utm || {}, channel: inIframe ? 'embed' : 'site', partner: sourceTag }
    };
  }
  function postBooking(lead) {
    var ep = CFG.bookingEndpoint !== undefined ? CFG.bookingEndpoint : '/api/bookings';
    if (!ep || !window.fetch) return;
    try {
      fetch(ep, {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      }).catch(function () {}); /* fire-and-forget; wachtrij blijft de bron */
    } catch (e) {}
  }

  els.submit.addEventListener('click', function () {
    var missing = missingList();
    if (missing.length) {
      els.missingtext.textContent = 'Nog even nodig: ' + missing.join(', ') + '.';
      els.missing.hidden = false;
      setFF(els.naam, false, !state.naam.trim());
      setFF(els.email, false, !validEmail());
      SD.track('booking_submit_incomplete', { missing: missing });
      notifyHeight();
      return;
    }
    var ref = state.bookingRef || ('SD-' + Date.now().toString(36).toUpperCase().slice(-6));
    state.bookingRef = ref;
    try { localStorage.setItem('sd_adviesgesprek', JSON.stringify(persistShape(ref))); } catch (e) {}
    var lead = buildLead(ref);
    if (SD.lead) SD.lead(lead);
    postBooking(lead);
    SD.fire('booking_completed', { mode: state.mode, ref: ref, briefcode: state.briefcode || null, sendInfo: state.sendInfo, status: lead.status, source: sourceTag });
    SD.track('booking_qualification', { status: lead.status });
    if (state.sendInfo) SD.track('lead_capture', { via: 'booking' });
    els.missing.hidden = true;
    fillConfirm();
    showView('confirm');
  });

  function persistShape(ref) {
    return {
      dateIso: state.dateIso, time: state.time, mode: state.mode,
      naam: state.naam, email: state.email, tel: state.tel,
      briefcode: state.briefcode, sendInfo: state.sendInfo, ref: ref,
      interests: state.interests, woning: state.woning, partner: state.partner,
      jonger75: state.jonger75, eigenMiddelen: state.eigenMiddelen, verwachting: state.verwachting
    };
  }

  bk('goportal').addEventListener('click', function () { SD.fire('portal_view'); fillPortal(); showView('portal'); });
  [bk('goform'), bk('goform2')].forEach(function (btn) {
    btn.addEventListener('click', function () {
      SD.track('reschedule_start');
      renderAll(); update();
      showStep(3);
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

  /* ---------- Init: herstel opgeslagen boeking + ?volg= ---------- */
  if (SD.applyContacts) SD.applyContacts(mount); /* tel/WhatsApp/KvK in het zojuist gerenderde widget */
  renderAll();

  var wantPortal = false;
  try { wantPortal = !!new URLSearchParams(location.search).get('volg'); } catch (e) {}

  var stored = null;
  try { stored = JSON.parse(localStorage.getItem('sd_adviesgesprek')); } catch (e) {}
  if (stored) {
    state.dateIso = stored.dateIso || null;
    state.time = stored.time || null;
    state.mode = stored.mode || 'thuis';
    state.naam = stored.naam || '';
    state.email = stored.email || '';
    state.tel = stored.tel || '';
    state.briefcode = stored.briefcode || '';
    state.sendInfo = !!stored.sendInfo;
    state.bookingRef = stored.ref || '';
    state.interests = stored.interests || [];
    state.woning = stored.woning || null;
    state.partner = stored.partner || null;
    state.jonger75 = (typeof stored.jonger75 === 'boolean') ? stored.jonger75 : null;
    state.eigenMiddelen = (typeof stored.eigenMiddelen === 'boolean') ? stored.eigenMiddelen : null;
    state.verwachting = !!stored.verwachting;
    els.naam.value = state.naam; els.email.value = state.email;
    els.tel.value = state.tel; els.briefcode.value = state.briefcode;
    els.verwachting.checked = state.verwachting;
    els.sendinfo.checked = state.sendInfo;
    renderAll();
    if (wantPortal) { fillPortal(); showView('portal'); }
    else { fillConfirm(); showView('confirm'); }
  } else if (wantPortal) {
    fillPortal();
    showView('portal');
  }

  showStep(state.step);
  update();
  SD.track('booking_page_view', { source: sourceTag, channel: inIframe ? 'embed' : 'site' });
})();
