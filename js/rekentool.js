/* ============================================================
   SalderingsDienst — rekentool.js
   Bediening van /rekentool. Al het rekenwerk zit in
   js/rekenmodel.js (window.SDRekenmodel); dit bestand leest de
   velden, toont drie scenario's en geeft de uitkomst mee naar
   het adviesgesprek.

   - de pagina toont kosten 2026, kosten 2027 en het verlies door
     het einde van saldering, maar geen batterij-uitkomst
     (besparing, terugverdientijd, oordeel), ook niet verborgen in
     de DOM; die staat alleen in de overdracht voor de adviseur;

   - invoer blijft in de browser; de URL bevat alleen getallen
     (voor delen), nooit persoonsgegevens;
   - de overdracht naar /adviesgesprek gebeurt alleen na een klik
     op de knop en met het vinkje aan: sessionStorage 'sd_funnel'
     in dezelfde vorm als js/funnel.js, plus window.SD.funnel en
     het event 'sd:funnel';
   - meetpunten via SD.track: 'rekentool_calc' en 'rekentool_cta',
     zonder verbruikscijfers.
   ============================================================ */
(function () {
  'use strict';

  var M = window.SDRekenmodel;
  var form = document.querySelector('[data-rk-form]');
  if (!M || !form) return;

  var STANDAARD = M.STANDAARD;
  var VOLGORDE = M.SCENARIO_VOLGORDE;

  /* Korte URL-sleutels, alleen getallen. */
  var URLKEYS = {
    v: 'jaarverbruik_kwh', o: 'opwek_kwh', d: 'direct_eigen_verbruik_pct', c: 'contract',
    b: 'batterij_kwh', p: 'stroomprijs_allin_eur_kwh', tv: 'terugleververgoeding_bruto_eur_kwh',
    tk: 'terugleverkosten_eur_kwh', bk: 'batterij_prijs_per_kwh_eur', r: 'rendement_rondgang_pct',
    dg: 'degradatie_pct_per_jaar', l: 'levensduur_jaar', cy: 'max_cycli_per_dag',
    s: 'dynamisch_spread_eur_kwh', ob: 'onbalans_opbrengst_eur_jaar', n0: 'netto_vergoeding_min_nul',
    kp: 'kwh_per_paneel'
  };

  function track(naam, extra) {
    if (window.SD && typeof window.SD.track === 'function') window.SD.track(naam, extra || {});
  }
  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- Getallen lezen en schrijven (nl-NL) ---------- */
  function lees(waarde, soort) {
    var s = String(waarde == null ? '' : waarde).trim().replace(/\s/g, '').replace(/[€%]/g, '');
    if (s === '') return NaN;
    if (soort === 'int') {
      s = s.replace(/[.,](?=\d{3}(\D|$))/g, '');   /* duizendtallen */
      s = s.replace(',', '.');
      return Math.round(parseFloat(s));
    }
    if (s.indexOf(',') > -1 && s.indexOf('.') > -1) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(',', '.');
    return parseFloat(s);
  }
  function minDecimalen(key) { return /_eur_kwh$/.test(key) ? 2 : 0; }
  function toon(key, n, soort) {
    if (soort === 'int') return Math.round(n).toLocaleString('nl-NL');
    return n.toLocaleString('nl-NL', { minimumFractionDigits: minDecimalen(key), maximumFractionDigits: 4 });
  }
  function eur(n) { return '€ ' + Math.round(n).toLocaleString('nl-NL'); }
  function eur10(n) { return eur(Math.round(n / 10) * 10); }
  function kwh(n) { return (Math.round(n / 10) * 10).toLocaleString('nl-NL') + ' kWh'; }
  function getal(n) { return n.toLocaleString('nl-NL', { maximumFractionDigits: 1 }); }

  /* ---------- Toestand ---------- */
  var state = {};
  function zetStandaard() {
    Object.keys(STANDAARD).forEach(function (k) { state[k] = STANDAARD[k]; });
    state.batterij_prijs_eur = null;
  }
  zetStandaard();

  var velden = all('[data-rk]');
  var contractKnoppen = all('[data-rk-contract] .fchoice');

  function schrijfVelden() {
    velden.forEach(function (el) {
      var key = el.getAttribute('data-rk');
      var soort = el.getAttribute('data-soort');
      if (soort === 'bool') el.checked = !!state[key];
      else el.value = toon(key, state[key], soort);
      el.removeAttribute('aria-invalid');
    });
    contractKnoppen.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-val') === state.contract));
    });
  }

  /* ---------- URL (delen) ---------- */
  function leesUrl() {
    var gevonden = false;
    var zoek = location.search.replace(/^\?/, '');
    if (!zoek) return false;
    zoek.split('&').forEach(function (paar) {
      var kv = paar.split('=');
      var key = URLKEYS[kv[0]];
      var v = decodeURIComponent(kv[1] || '');
      if (!key || !/^-?\d+(\.\d+)?$/.test(v)) return;
      var n = parseFloat(v);
      if (key === 'contract') state.contract = n === 1 ? 'dynamisch' : 'vast';
      else if (key === 'netto_vergoeding_min_nul') state.netto_vergoeding_min_nul = n !== 0;
      else state[key] = n;
      gevonden = true;
    });
    /* Door het model laten begrenzen, zodat onzinwaarden niet blijven staan. */
    var norm = M.normaliseer(state);
    Object.keys(norm).forEach(function (k) { state[k] = norm[k]; });
    return gevonden;
  }

  function schrijfUrl() {
    var delen = [];
    Object.keys(URLKEYS).forEach(function (kort) {
      var key = URLKEYS[kort];
      var v = state[key], std = STANDAARD[key];
      if (key === 'contract') { if (v !== std) delen.push(kort + '=' + (v === 'dynamisch' ? 1 : 0)); return; }
      if (key === 'netto_vergoeding_min_nul') { if (v !== std) delen.push(kort + '=' + (v ? 1 : 0)); return; }
      if (typeof v === 'number' && Math.abs(v - std) > 1e-9) delen.push(kort + '=' + String(Math.round(v * 10000) / 10000));
    });
    var url = location.pathname + (delen.length ? '?' + delen.join('&') : '') + location.hash;
    try { history.replaceState(null, '', url); } catch (e) {}
  }

  /* ---------- Weergave ----------
     Besluit eigenaar (6 oktober 2026): de pagina toont het verlies door
     het einde van saldering, maar geen batterij-uitkomst (besparing,
     terugverdientijd, oordeel). Die getallen komen ook niet in de DOM;
     het model rekent ze wel uit en ze gaan via payload() mee naar de
     adviseur. */
  var laatste = null;

  function vulScenario(naam, s) {
    var col = q('[data-scen="' + naam + '"]');
    if (!col) return;
    q('[data-v="k26"]', col).textContent = eur10(s.kosten_2026);
    q('[data-v="k27"]', col).textContent = eur10(s.kosten_2027_zonder_batterij);
    q('[data-v="verlies"]', col).textContent = eur10(s.verlies_per_jaar);
  }

  /* Alleen het verlies en de knoppen waaraan u zelf draait; nooit een
     batterijbedrag of terugverdientijd. */
  function uitleg(res) {
    var c = res.scenarios.conservatief, r = res.scenarios.realistisch, o = res.scenarios.optimistisch;
    var p = r.parameters;
    var t = [];
    if (r.teruglevering_kwh_2027 < 1 || Math.abs(r.verlies_per_jaar) < 5) {
      t.push('Met deze invoer levert u vrijwel niets terug. Het einde van salderen verandert uw stroomrekening daardoor nauwelijks.');
    } else {
      t.push('In het realistische scenario betaalt u vanaf 2027 ongeveer ' + eur10(r.verlies_per_jaar) + ' per jaar meer voor stroom dan in 2026, omdat de '
        + kwh(r.teruglevering_kwh_2027) + ' die u teruglevert niet meer tegen het volle tarief worden verrekend. Over de drie scenario\'s ligt dat tussen '
        + eur10(o.verlies_per_jaar) + ' en ' + eur10(c.verlies_per_jaar) + '.');
      t.push('Hoeveel u daarvan terughaalt, hangt vooral af van drie dingen: hoeveel van uw opwek u direct zelf gebruikt, wat uw contract betaalt voor teruggeleverde stroom en rekent aan terugleverkosten, en op welke uren u stroom verbruikt.'
        + ' De eerste twee past u hier zelf aan; uw verbruik per uur rekenen wij in het adviesgesprek door met uw meterstanden.');
    }
    if (!(p.batterij_kwh > 0)) {
      t.push('U rekent nu zonder batterij. Dat is een volwaardige uitkomst.');
    }
    return t.join(' ');
  }

  /* Kop van de afgeschermde batterijkaart: alleen de gekozen maat. */
  function gate() {
    var kop = q('[data-rk-gate-kop]');
    if (!kop) return;
    kop.textContent = state.batterij_kwh > 0
      ? 'Wat een thuisbatterij van ' + getal(state.batterij_kwh) + ' kWh in uw situatie doet'
      : 'Wat een thuisbatterij in uw situatie doet';
  }

  function tip(res) {
    var r = res.scenarios.realistisch;
    var huidig = r.parameters.direct_eigen_verbruik_pct;
    if (huidig >= 95 || r.teruglevering_kwh_2027 < 1) return '';
    var meer = Math.min(100, state.direct_eigen_verbruik_pct + 10);
    var invoer = {};
    Object.keys(state).forEach(function (k) { invoer[k] = state[k]; });
    invoer.direct_eigen_verbruik_pct = meer;
    var r10 = M.bereken(invoer).scenarios.realistisch;
    var verschil = r.kosten_2027_zonder_batterij - r10.kosten_2027_zonder_batterij;
    if (verschil < 5) return '';
    return 'Gebruikt u ' + getal(meer - state.direct_eigen_verbruik_pct) + ' procentpunt meer van uw opwek direct zelf, bijvoorbeeld door wasmachine en vaatwasser overdag te laten draaien, dan scheelt dat in het realistische scenario ongeveer '
      + eur10(verschil) + ' per jaar, zonder dat u iets hoeft te kopen.';
  }

  function curve() {
    var tbody = q('[data-rk-curve]');
    if (!tbody) return;
    var groottes = [0, 2.5, 5, 7.5, 10, 15];
    if (state.batterij_kwh > 0 && groottes.indexOf(state.batterij_kwh) === -1) {
      groottes.push(state.batterij_kwh);
      groottes.sort(function (a, b) { return a - b; });
    }
    /* Alleen kWh: geen besparing, prijs of terugverdientijd per maat. */
    var rijen = M.batterijCurve(state, groottes, 'realistisch');
    tbody.innerHTML = '';
    rijen.forEach(function (rij, i) {
      var tr = document.createElement('tr');
      if (rij.batterij_kwh === state.batterij_kwh) tr.className = 'is-gekozen';
      var vorige = i > 0 ? rijen[i - 1] : null;
      var erbij = vorige && rij.batterij_kwh > vorige.batterij_kwh
        ? Math.max(0, Math.round((rij.verplaatst_kwh - vorige.verplaatst_kwh) / (rij.batterij_kwh - vorige.batterij_kwh))).toLocaleString('nl-NL') + ' kWh'
        : '';
      var cellen = [
        ['th', rij.batterij_kwh === 0 ? 'geen' : getal(rij.batterij_kwh) + ' kWh'],
        ['td', kwh(rij.verplaatst_kwh), 'num'],
        ['td', erbij, 'num']
      ];
      cellen.forEach(function (c) {
        var el = document.createElement(c[0]);
        if (c[0] === 'th') el.setAttribute('scope', 'row');
        if (c[2]) el.className = c[2];
        el.textContent = c[1];
        tr.appendChild(el);
      });
      tbody.appendChild(tr);
    });
  }

  function render() {
    var res = M.bereken(state);
    laatste = res;
    VOLGORDE.forEach(function (n) { vulScenario(n, res.scenarios[n]); });
    var u = q('[data-rk-uitleg]'); if (u) u.textContent = uitleg(res);
    var t = q('[data-rk-tip]');
    if (t) { var tekst = tip(res); t.textContent = tekst; t.hidden = !tekst; }
    var bp = q('[data-rk-batterijprijs]');
    if (bp) bp.textContent = state.batterij_kwh > 0 ? eur(res.scenarios.realistisch.batterij_prijs_eur) : eur(0);
    var kp = q('[data-rk-kwhpaneel]'); if (kp) kp.textContent = Math.round(state.kwh_per_paneel).toLocaleString('nl-NL');
    gate();
    curve();
    return res;
  }

  /* ---------- Gebeurtenissen ---------- */
  var tReken = null, tUrl = null, tMeet = null;
  function plan() {
    clearTimeout(tReken); tReken = setTimeout(render, 120);
    clearTimeout(tUrl); tUrl = setTimeout(schrijfUrl, 400);
    clearTimeout(tMeet); tMeet = setTimeout(meet, 2500);
  }
  function meet() {
    if (!laatste) return;
    var r = laatste.scenarios.realistisch;
    track('rekentool_calc', {
      contract: state.contract,
      batterij_kwh: state.batterij_kwh,
      oordeel: r.oordeel || 'geen_batterij',
      model_versie: M.MODEL_VERSIE
    });
  }

  velden.forEach(function (el) {
    var key = el.getAttribute('data-rk');
    var soort = el.getAttribute('data-soort');
    if (soort === 'bool') {
      el.addEventListener('change', function () { state[key] = el.checked; plan(); });
      return;
    }
    el.addEventListener('input', function () {
      var n = lees(el.value, soort);
      if (isNaN(n)) { el.setAttribute('aria-invalid', 'true'); return; }
      el.removeAttribute('aria-invalid');
      state[key] = n;
      plan();
    });
    el.addEventListener('blur', function () {
      var norm = M.normaliseer(state);
      state[key] = norm[key];
      el.value = toon(key, state[key], soort);
      el.removeAttribute('aria-invalid');
      plan();
    });
  });

  contractKnoppen.forEach(function (b) {
    b.addEventListener('click', function () {
      state.contract = b.getAttribute('data-val') === 'dynamisch' ? 'dynamisch' : 'vast';
      contractKnoppen.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      plan();
    });
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); render(); });

  /* Opwek uit het aantal panelen */
  var panelen = q('[data-rk-panelen]');
  var neem = q('[data-rk-panelen-neem]');
  if (panelen && neem) {
    neem.addEventListener('click', function () {
      var n = lees(panelen.value, 'int');
      if (isNaN(n) || n <= 0) { panelen.setAttribute('aria-invalid', 'true'); panelen.focus(); return; }
      panelen.removeAttribute('aria-invalid');
      state.opwek_kwh = M.opwekUitPanelen(Math.min(n, 200), state.kwh_per_paneel);
      var opwekVeld = q('[data-rk="opwek_kwh"]');
      if (opwekVeld) opwekVeld.value = toon('opwek_kwh', state.opwek_kwh, 'int');
      plan();
    });
    panelen.addEventListener('input', function () { panelen.removeAttribute('aria-invalid'); });
  }

  /* Aannames openklappen vanaf een link */
  var details = q('[data-rk-aannames]');
  all('[data-rk-open-aannames]').forEach(function (a) {
    a.addEventListener('click', function () { if (details) details.open = true; });
  });
  if (details && location.hash === '#aannames') details.open = true;

  /* Standaardwaarden */
  var reset = q('[data-rk-reset]');
  if (reset) reset.addEventListener('click', function () {
    zetStandaard();
    schrijfVelden();
    plan();
  });

  /* Link delen */
  var deel = q('[data-rk-deel]'), deelNote = q('[data-rk-deel-note]');
  if (deel) deel.addEventListener('click', function () {
    schrijfUrl();
    var url = location.href;
    function klaar(ok) { if (deelNote) deelNote.textContent = ok ? 'Link gekopieerd.' : url; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { klaar(true); }, function () { klaar(false); });
    } else klaar(false);
  });

  /* ---------- Overdracht naar het adviesgesprek ----------
     Zelfde vorm als js/funnel.js (payload()), zodat de samenvatting op
     /adviesgesprek en het leadpakket (berekening) hem lezen. Wat de
     bespaarcheck niet vraagt blijft null; de rekentool-uitkomst zelf
     staat onder 'rekentool'. */
  function payload() {
    var res = laatste || M.bereken(state);
    var r = res.scenarios.realistisch, c = res.scenarios.conservatief, o = res.scenarios.optimistisch;
    var besparing = r.parameters.batterij_kwh > 0 ? Math.max(0, Math.round(r.besparing_batterij_per_jaar)) : 0;
    var invoer = M.normaliseer(state);
    schrijfUrl();   /* deellink bijwerken, zodat de samenvatting hem kan teruggeven */
    return {
      koopwoning: null,
      woningtype: null,
      energielabel: null,
      kwh: invoer.jaarverbruik_kwh,
      gas: 0,
      opwek: invoer.opwek_kwh,
      slimmeMeter: false,
      zonnepanelen: invoer.opwek_kwh > 0,
      personen: null,
      apparaten: [],
      stroomvoordeel: besparing,
      gasvoordeel: 0,
      besparing: besparing,
      bron: 'rekentool',
      rekentool: {
        versie: M.MODEL_VERSIE,
        peildatum: M.PEILDATUM,
        url: location.pathname + location.search,   /* alleen getallen, voor "Gegevens wijzigen" */
        invoer: invoer,
        realistisch: {
          kosten_2026: Math.round(r.kosten_2026),
          kosten_2027_zonder_batterij: Math.round(r.kosten_2027_zonder_batterij),
          verlies_per_jaar: Math.round(r.verlies_per_jaar),
          batterij_prijs_eur: Math.round(r.batterij_prijs_eur),
          besparing_batterij_per_jaar: Math.round(r.besparing_batterij_per_jaar),
          besparing_batterij_gemiddeld: Math.round(r.besparing_batterij_gemiddeld),
          terugverdientijd_jaar: r.terugverdientijd_jaar === null ? null : Math.round(r.terugverdientijd_jaar * 10) / 10,
          oordeel: r.oordeel
        },
        bandbreedte: {
          verlies_per_jaar: [Math.round(o.verlies_per_jaar), Math.round(c.verlies_per_jaar)],
          oordeel: [c.oordeel, r.oordeel, o.oordeel]
        }
      }
    };
  }

  /* Twee knoppen (bij de afgeschermde batterijkaart en onderaan), elk met
     een eigen vinkje in dezelfde [data-rk-cta-box]. */
  all('[data-rk-cta]').forEach(function (cta) {
    cta.addEventListener('click', function () {
      var box = cta.closest ? cta.closest('[data-rk-cta-box]') : null;
      var meenemen = q('[data-rk-meenemen]', box || document);
      var mee = !meenemen || meenemen.checked;
      var oordeel = laatste ? (laatste.scenarios.realistisch.oordeel || 'geen_batterij') : null;
      if (mee) {
        var f = payload();
        window.SD = window.SD || {};
        window.SD.funnel = f;
        window.SD.calcState = function () { return window.SD.funnel || {}; };
        try { sessionStorage.setItem('sd_funnel', JSON.stringify(f)); } catch (e) {}
        try { window.dispatchEvent(new CustomEvent('sd:funnel', { detail: f })); } catch (e) {}
      }
      track('rekentool_cta', { oordeel: oordeel, batterij_kwh: state.batterij_kwh, meegenomen: mee, plek: cta.getAttribute('data-rk-cta-plek') || '' });
    });
  });

  /* ---------- Start ---------- */
  var uitUrl = leesUrl();
  schrijfVelden();
  render();
  if (uitUrl) { clearTimeout(tMeet); tMeet = setTimeout(meet, 2500); }
})();
