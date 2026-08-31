/* ============================================================
   SalderingsDienst — funnel.js
   Bespaarcheck in drie stappen: woning, verbruik, resultaat.
   Mount: [data-funnel]. Zonder dat element gebeurt er niets.

   Rekenmodel (indicatief, staffels op jaarverbruik):
     netto stroom  = stroomverbruik − eigen opwek
     stroomvoordeel  ≥5500 → 1272 | ≥4500 → 1083 | ≥3500 → 1026
                     ≥2500 →  889 | ≥1500 →  552 | ≥0    →  360
     gasvoordeel     ≥1600 → 1595 | ≥1400 → 1231 | ≥1200 → 1090
                     ≥1000 →  904 | ≥800  →  722 | >0    →  540
     totaal = stroomvoordeel + gasvoordeel  (max € 2.867)
   Schatters:
     stroom = 1500 + (personen × 500) + som van de apparaten
     gas    = 800 / 1000 / 1200 / 1400 / 1600 / 2000 m³ naar huishouden
     opwek  = aantal panelen × 315 kWh

   De uitkomst gaat mee naar het adviesgesprek: sessionStorage
   'sd_funnel', window.SD.funnel, event 'sd:funnel' en het
   samenvattingspaneel naast het boekingsformulier.
   ============================================================ */
(function () {
  'use strict';

  var root = document.querySelector('[data-funnel]');
  var summary = document.querySelector('[data-fsummary]');
  if (!root && !summary) return;

  var SD = window.SD || { track: function () {}, fire: function () {}, utm: {} };

  /* ---------- Rekenmodel ---------- */
  var KWH_BASIS = 1500, KWH_PER_PERSOON = 500, KWH_PER_PANEEL = 315;
  var GAS_PER_PERSONEN = { 1: 800, 2: 1000, 3: 1200, 4: 1400, 5: 1600, 6: 2000 };
  var STROOM_STAFFEL = [[5500, 1272], [4500, 1083], [3500, 1026], [2500, 889], [1500, 552], [0, 360]];
  var GAS_STAFFEL = [[1600, 1595], [1400, 1231], [1200, 1090], [1000, 904], [800, 722]];

  function stroomVoordeel(netto) {
    if (!(netto > 0)) netto = 0;
    for (var i = 0; i < STROOM_STAFFEL.length; i++) {
      if (netto >= STROOM_STAFFEL[i][0]) return STROOM_STAFFEL[i][1];
    }
    return 0;
  }
  function gasVoordeel(gas) {
    if (!(gas > 0)) return 0;
    for (var i = 0; i < GAS_STAFFEL.length; i++) {
      if (gas >= GAS_STAFFEL[i][0]) return GAS_STAFFEL[i][1];
    }
    return 540;
  }

  /* ---------- Hulpfuncties ---------- */
  function num(v) {
    if (v === null || v === undefined) return 0;
    var s = String(v).replace(/\./g, '').replace(',', '.').replace(/[^0-9.\-]/g, '');
    var n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }
  function fmt(n) { return Math.round(n).toLocaleString('nl-NL'); }
  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function all(sel, fn, ctx) { Array.prototype.forEach.call((ctx || document).querySelectorAll(sel), fn); }

  /* ---------- Samenvatting (staat ook op adviesgesprek.html) ---------- */
  function bewaarde() {
    try { return JSON.parse(sessionStorage.getItem('sd_funnel')); } catch (e) { return null; }
  }

  function vulSamenvatting(f) {
    if (!summary || !f) return;
    q('[data-fs-amount]', summary).textContent = fmt(f.besparing);
    q('[data-fs-stroom]', summary).textContent = fmt(f.kwh);
    q('[data-fs-gas]', summary).textContent = fmt(f.gas);
    q('[data-fs-opwek]', summary).textContent = fmt(f.opwek);
    summary.hidden = false;
  }

  var eerder = bewaarde();
  if (eerder && eerder.besparing) {
    window.SD = window.SD || {};
    window.SD.funnel = eerder;
    window.SD.calcState = function () { return window.SD.funnel || {}; };
    vulSamenvatting(eerder);
  }

  if (summary) {
    var editBtn = q('[data-fs-edit]', summary);
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        SD.track('funnel_edit');
        if (root) {
          showStep(2, true);
          root.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        /* Op de boekingspagina staat de check niet; terug naar de homepage. */
        try { sessionStorage.setItem('sd_funnel_stap', '2'); } catch (e) {}
        location.href = 'index.html#bereken';
      });
    }
  }

  if (!root) return;

  /* ---------- Toestand ---------- */
  var state = {
    step: 1,
    koopwoning: null,
    woningtype: '',
    energielabel: 'Onbekend',
    kwh: 0, gas: 0, opwek: 0,
    slimmeMeter: false, zonnepanelen: false,
    personen: 2, apparaten: [],
    stroomvoordeel: 0, gasvoordeel: 0, besparing: 0
  };

  /* ---------- Stappen ---------- */
  var steps = root.querySelectorAll('[data-fsteps] .fstep');
  var pages = root.querySelectorAll('[data-fpage]');

  function showStep(n, track) {
    state.step = n;
    Array.prototype.forEach.call(pages, function (p) {
      p.hidden = p.getAttribute('data-fpage') !== String(n);
    });
    Array.prototype.forEach.call(steps, function (li, i) {
      li.classList.toggle('is-active', i + 1 === n);
      li.classList.toggle('is-done', i + 1 < n);
    });
    if (track) SD.track('funnel_step', { step: n });
  }

  function fout(step, tekst) {
    var el = root.querySelector('[data-ferror="' + step + '"]');
    if (!el) return;
    if (!tekst) { el.hidden = true; el.textContent = ''; return; }
    el.textContent = tekst;
    el.hidden = false;
  }

  /* ---------- Stap 1: woning ---------- */
  var typeSel = q('[data-f-type]', root);
  var labelSel = q('[data-f-label]', root);
  var koopNote = q('[data-f-koopnote]', root);

  all('[data-f-koop] .fchoice', function (btn) {
    btn.addEventListener('click', function () {
      state.koopwoning = btn.getAttribute('data-val') === 'ja';
      all('[data-f-koop] .fchoice', function (b) { b.setAttribute('aria-pressed', String(b === btn)); }, root);
      if (koopNote) koopNote.hidden = state.koopwoning !== false;
      fout(1, '');
    });
  }, root);

  typeSel.addEventListener('change', function () { state.woningtype = typeSel.value; fout(1, ''); });
  labelSel.addEventListener('change', function () { state.energielabel = labelSel.value; });

  /* ---------- Stap 2: verbruik ---------- */
  var kwhInput = q('[data-f-kwh]', root);
  var gasInput = q('[data-f-gas]', root);
  var opwekInput = q('[data-f-opwek]', root);
  var opwekGroup = q('[data-f-opwekgroup]', root);
  var meterBox = q('[data-f-meter]', root);
  var zonBox = q('[data-f-zon]', root);

  meterBox.addEventListener('change', function () { state.slimmeMeter = meterBox.checked; });
  zonBox.addEventListener('change', function () {
    state.zonnepanelen = zonBox.checked;
    opwekGroup.hidden = !zonBox.checked;
    if (!zonBox.checked) { opwekInput.value = ''; state.opwek = 0; }
  });

  function leesStap2() {
    state.kwh = num(kwhInput.value);
    state.gas = num(gasInput.value);
    state.opwek = state.zonnepanelen ? num(opwekInput.value) : 0;
  }

  /* ---------- Stap 3: uitkomst ---------- */
  function bereken() {
    state.stroomvoordeel = stroomVoordeel(state.kwh - state.opwek);
    state.gasvoordeel = gasVoordeel(state.gas);
    state.besparing = state.stroomvoordeel + state.gasvoordeel;
  }

  function toonUitkomst() {
    q('[data-f-amount]', root).textContent = fmt(state.besparing);
    q('[data-f-tile-stroom]', root).textContent = fmt(state.kwh);
    q('[data-f-tile-gas]', root).textContent = fmt(state.gas);
    q('[data-f-tile-opwek]', root).textContent = fmt(state.opwek);
    deel();
  }

  /* ---------- Uitkomst delen met het adviesgesprek ---------- */
  function payload() {
    return {
      koopwoning: state.koopwoning,
      woningtype: state.woningtype || null,
      energielabel: state.energielabel || null,
      kwh: state.kwh, gas: state.gas, opwek: state.opwek,
      slimmeMeter: state.slimmeMeter, zonnepanelen: state.zonnepanelen,
      personen: state.personen, apparaten: state.apparaten.slice(),
      stroomvoordeel: state.stroomvoordeel, gasvoordeel: state.gasvoordeel,
      besparing: state.besparing
    };
  }

  function deel() {
    var f = payload();
    window.SD = window.SD || {};
    window.SD.funnel = f;
    /* De terugbelknop onder de uitkomst stuurt dezelfde cijfers mee. */
    window.SD.calcState = function () { return window.SD.funnel || {}; };
    try { sessionStorage.setItem('sd_funnel', JSON.stringify(f)); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('sd:funnel', { detail: f })); } catch (e) {}
    vulSamenvatting(f);
  }

  /* ---------- Navigatie ---------- */
  all('[data-fnext]', function (btn) {
    btn.addEventListener('click', function () {
      var doel = parseInt(btn.getAttribute('data-fnext'), 10);
      if (doel === 2) {
        if (state.koopwoning === null) { fout(1, 'Geeft u eerst aan of u een koopwoning heeft.'); return; }
        if (!typeSel.value) { fout(1, 'Kiest u het type woning.'); return; }
        fout(1, '');
        SD.fire('funnel_started');
      }
      if (doel === 3) {
        leesStap2();
        if (!(state.kwh > 0)) { fout(2, 'Vul uw stroomverbruik in, of laat het ons inschatten.'); kwhInput.focus(); return; }
        if (!(state.gas > 0)) { fout(2, 'Vul uw gasverbruik in. Heeft u geen gasaansluiting? Vul dan 0 in.'); gasInput.focus(); return; }
        fout(2, '');
        bereken();
        toonUitkomst();
        SD.track('funnel_result', { besparing: state.besparing, kwh: state.kwh, gas: state.gas, opwek: state.opwek });
      }
      showStep(doel, true);
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, root);

  all('[data-fback]', function (btn) {
    btn.addEventListener('click', function () {
      showStep(parseInt(btn.getAttribute('data-fback'), 10), true);
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, root);

  /* Gasloze woning mag ook: 0 is een geldig antwoord op stap 2. */
  gasInput.addEventListener('input', function () { fout(2, ''); });
  kwhInput.addEventListener('input', function () { fout(2, ''); });

  /* ---------- Hulpvensters ---------- */
  var modals = {
    kwh: document.querySelector('[data-fmodal="kwh"]'),
    opwek: document.querySelector('[data-fmodal="opwek"]')
  };
  var laatstGeopend = null;

  function openModal(naam) {
    var m = modals[naam];
    if (!m) return;
    m.hidden = false;
    document.body.style.overflow = 'hidden';
    laatstGeopend = document.activeElement;
    var eerste = m.querySelector('button, input');
    if (eerste) eerste.focus();
    SD.track('funnel_help_open', { veld: naam });
  }
  function sluitModals() {
    Object.keys(modals).forEach(function (k) { if (modals[k]) modals[k].hidden = true; });
    document.body.style.overflow = '';
    if (laatstGeopend && laatstGeopend.focus) laatstGeopend.focus();
  }

  all('[data-fopen]', function (btn) {
    btn.addEventListener('click', function () { openModal(btn.getAttribute('data-fopen')); });
  }, root);
  all('[data-fclose]', function (btn) { btn.addEventListener('click', sluitModals); });
  Object.keys(modals).forEach(function (k) {
    if (!modals[k]) return;
    modals[k].addEventListener('click', function (e) { if (e.target === modals[k]) sluitModals(); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') sluitModals();
  });

  /* Stroomverbruik schatten */
  var estEl = document.querySelector('[data-f-est]');
  function schatKwh() {
    var som = 0;
    all('[data-f-apps] .fapp', function (b) {
      if (b.getAttribute('aria-pressed') === 'true') som += parseInt(b.getAttribute('data-kwh'), 10) || 0;
    });
    return KWH_BASIS + (state.personen * KWH_PER_PERSOON) + som;
  }
  function toonSchatting() { if (estEl) estEl.textContent = fmt(schatKwh()) + ' kWh'; }

  all('[data-f-personen] button', function (btn) {
    btn.addEventListener('click', function () {
      state.personen = parseInt(btn.getAttribute('data-val'), 10) || 2;
      all('[data-f-personen] button', function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      toonSchatting();
    });
  });
  all('[data-f-apps] .fapp', function (btn) {
    btn.addEventListener('click', function () {
      var aan = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(aan));
      toonSchatting();
    });
  });
  toonSchatting();

  /* Opwek schatten */
  var panelenInput = document.querySelector('[data-f-panelen]');
  var opwekEst = document.querySelector('[data-f-opwek-est]');
  function schatOpwek() {
    var n = Math.round(num(panelenInput ? panelenInput.value : 0));
    if (n < 0) n = 0;
    if (n > 50) n = 50;
    return n * KWH_PER_PANEEL;
  }
  if (panelenInput) {
    panelenInput.addEventListener('input', function () {
      if (opwekEst) opwekEst.textContent = fmt(schatOpwek()) + ' kWh';
    });
  }

  all('[data-fapply]', function (btn) {
    btn.addEventListener('click', function () {
      var soort = btn.getAttribute('data-fapply');
      if (soort === 'kwh') {
        state.apparaten = [];
        all('[data-f-apps] .fapp', function (b) {
          if (b.getAttribute('aria-pressed') !== 'true') return;
          var ic = b.querySelector('.fapp-ic');
          state.apparaten.push(b.textContent.replace(ic ? ic.textContent : '', '').trim());
        });
        kwhInput.value = fmt(schatKwh());
        gasInput.value = fmt(GAS_PER_PERSONEN[state.personen] || GAS_PER_PERSONEN[2]);
        SD.track('funnel_help_apply', { veld: 'kwh', personen: state.personen });
      }
      if (soort === 'opwek') {
        opwekInput.value = fmt(schatOpwek());
        SD.track('funnel_help_apply', { veld: 'opwek' });
      }
      fout(2, '');
      sluitModals();
    });
  });

  /* Terugkomen vanaf de boekingspagina: eerdere invoer terugzetten. */
  function herstel(f) {
    if (!f) return;
    if (typeof f.koopwoning === 'boolean') {
      state.koopwoning = f.koopwoning;
      all('[data-f-koop] .fchoice', function (b) {
        b.setAttribute('aria-pressed', String((b.getAttribute('data-val') === 'ja') === f.koopwoning));
      }, root);
      if (koopNote) koopNote.hidden = f.koopwoning !== false;
    }
    if (f.woningtype) { typeSel.value = f.woningtype; state.woningtype = f.woningtype; }
    if (f.energielabel) { labelSel.value = f.energielabel; state.energielabel = f.energielabel; }
    if (f.kwh) kwhInput.value = fmt(f.kwh);
    if (f.gas) gasInput.value = fmt(f.gas);
    state.slimmeMeter = !!f.slimmeMeter;
    meterBox.checked = !!f.slimmeMeter;
    state.zonnepanelen = !!f.zonnepanelen;
    zonBox.checked = !!f.zonnepanelen;
    opwekGroup.hidden = !f.zonnepanelen;
    if (f.opwek) opwekInput.value = fmt(f.opwek);
    if (f.personen) state.personen = f.personen;
  }

  var startStap = 1;
  try {
    if (sessionStorage.getItem('sd_funnel_stap') === '2' && eerder) {
      herstel(eerder);
      startStap = 2;
    }
    sessionStorage.removeItem('sd_funnel_stap');
  } catch (e) {}

  showStep(startStap);
  if (startStap === 2) {
    /* Direct op de check landen. Even zonder smooth-scroll, en een paar
       keer herhalen omdat lazy afbeeldingen de pagina nog verschuiven. */
    var naarCheck = function () {
      var html = document.documentElement;
      var vorig = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      window.scrollTo(0, Math.max(0, root.getBoundingClientRect().top + window.scrollY - 84));
      html.style.scrollBehavior = vorig;
    };
    /* De browser wil de vorige scrollpositie terugzetten; dat moet hier niet. */
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
    naarCheck();
    if (document.readyState !== 'complete') window.addEventListener('load', naarCheck);
    setTimeout(naarCheck, 400);
    setTimeout(naarCheck, 1000);
  }
})();
