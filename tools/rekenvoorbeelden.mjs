/* ============================================================
   SalderingsDienst — tools/rekenvoorbeelden.mjs
   Rekent de voorbeelden in twee kennisbankartikelen door met
   hetzelfde model als /rekentool (js/rekenmodel.js), zodat elk
   getal in die artikelen reproduceerbaar is:
   - /kennisbank/vast-of-dynamisch-na-2027  (voorbeelden B1 t/m B5)
   - /kennisbank/welke-batterijgrootte       (voorbeelden C1, C2, maandbeeld)

   node tools/rekenvoorbeelden.mjs          tabellen in de terminal
   node tools/rekenvoorbeelden.mjs --html   HTML-tabellen en SVG voor de artikelen

   Bedragen zijn afgerond op tientallen euro's, net als in de
   rekentool zelf. Elk voorbeeld krijgt de deel-URL waarmee de
   rekentool dezelfde invoer laadt.
   ============================================================ */
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const M = require(join(root, 'js/rekenmodel.js'));
const HTML = process.argv.includes('--html');
const S = M.SCENARIO_VOLGORDE;
const LABEL = { conservatief: 'Conservatief', realistisch: 'Realistisch', optimistisch: 'Optimistisch' };

/* ---------- Opmaak ---------- */
const nl = (n, d = 0) => n.toLocaleString('nl-NL', { minimumFractionDigits: d, maximumFractionDigits: d });
const eur10 = (n) => '€ ' + nl(Math.round(n / 10) * 10);
const eur = (n) => '€ ' + nl(Math.round(n));
const kwhTxt = (n) => (n === 0 ? 'geen' : nl(n, n % 1 ? 1 : 0) + ' kWh');

/* Deel-URL, zelfde sleutels en volgorde als js/rekentool.js (schrijfUrl). */
const URLKEYS = {
  v: 'jaarverbruik_kwh', o: 'opwek_kwh', d: 'direct_eigen_verbruik_pct', c: 'contract',
  b: 'batterij_kwh', p: 'stroomprijs_allin_eur_kwh', tv: 'terugleververgoeding_bruto_eur_kwh',
  tk: 'terugleverkosten_eur_kwh', bk: 'batterij_prijs_per_kwh_eur', r: 'rendement_rondgang_pct',
  dg: 'degradatie_pct_per_jaar', l: 'levensduur_jaar', cy: 'max_cycli_per_dag',
  s: 'dynamisch_spread_eur_kwh', ob: 'onbalans_opbrengst_eur_jaar', n0: 'netto_vergoeding_min_nul',
  kp: 'kwh_per_paneel'
};
function deelUrl(invoer) {
  const st = M.normaliseer(invoer);
  const std = M.STANDAARD;
  const delen = [];
  for (const [kort, key] of Object.entries(URLKEYS)) {
    const v = st[key];
    if (key === 'contract') { if (v !== std.contract) delen.push(kort + '=' + (v === 'dynamisch' ? 1 : 0)); continue; }
    if (key === 'netto_vergoeding_min_nul') { if (v !== std[key]) delen.push(kort + '=' + (v ? 1 : 0)); continue; }
    if (typeof v === 'number' && Math.abs(v - std[key]) > 1e-9) delen.push(kort + '=' + String(Math.round(v * 10000) / 10000));
  }
  return '/rekentool' + (delen.length ? '?' + delen.join('&') : '');
}

function oordeelTekst(s) {
  if (!(s.parameters.batterij_kwh > 0)) return 'geen batterij';
  if (s.oordeel === 'loont_niet') return 'loont niet';
  if (s.oordeel === 'twijfelgeval') return 'twijfelgeval';
  return 'loont';
}
function tvtTekst(s) {
  if (!(s.parameters.batterij_kwh > 0)) return 'n.v.t.';
  if (s.terugverdientijd_jaar === null) return 'niet binnen ' + s.parameters.levensduur_jaar + ' jaar';
  return nl(Math.round(s.terugverdientijd_jaar * 2) / 2, 1) + ' jaar';
}

/* ---------- Pagina B: vast of dynamisch ---------- */
const HUISHOUDENS_B = [
  { id: 'B1', naam: 'Klein dak, klein verbruik', v: 2500, o: 2800 },
  { id: 'B2', naam: 'Gemiddeld huishouden', v: 3500, o: 3500 },
  { id: 'B3', naam: 'Met warmtepomp', v: 5000, o: 4500 },
  { id: 'B4', naam: 'Met elektrische auto', v: 6000, o: 5600 }
];
const COMBIS = [
  { contract: 'vast', b: 5 }, { contract: 'dynamisch', b: 5 },
  { contract: 'vast', b: 10 }, { contract: 'dynamisch', b: 10 }
];

function voorbeeldB(h) {
  const basis = { jaarverbruik_kwh: h.v, opwek_kwh: h.o };
  const zonder = M.bereken({ ...basis, batterij_kwh: 0 });
  const zonderDyn = M.bereken({ ...basis, batterij_kwh: 0, contract: 'dynamisch' });
  /* Zonder batterij rekent het model vast en dynamisch gelijk; controleer dat. */
  for (const n of S) {
    if (Math.abs(zonder.scenarios[n].verlies_per_jaar - zonderDyn.scenarios[n].verlies_per_jaar) > 1e-9) {
      throw new Error(h.id + ': vast en dynamisch wijken zonder batterij af in ' + n);
    }
  }
  const rijen = COMBIS.map((c) => {
    const invoer = { ...basis, contract: c.contract, batterij_kwh: c.b };
    const r = M.bereken(invoer);
    return { ...c, url: deelUrl(invoer), res: r };
  });
  return {
    ...h,
    url: deelUrl({ ...basis, batterij_kwh: 5 }),
    urlZonder: deelUrl({ ...basis, batterij_kwh: 0 }),
    zonder,
    rijen
  };
}

/* B5: hetzelfde gemiddelde huishouden, drie niveaus van netto terugleververgoeding. */
const NIVEAUS_B5 = [
  { label: 'Netto ongeveer 0 cent (terugleverkosten even hoog als de vergoeding)', kort: 'netto 0 ct', extra: { terugleverkosten_eur_kwh: 0.061 } },
  { label: 'Netto ongeveer 4 cent (standaard in de rekentool)', kort: 'netto 4 ct', extra: {} },
  { label: 'Netto ongeveer 7,6 cent (genoemd voor dynamische contracten)', kort: 'netto 7,6 ct', extra: { terugleververgoeding_bruto_eur_kwh: 0.096 } }
];
function voorbeeldB5() {
  const basis = { jaarverbruik_kwh: 3500, opwek_kwh: 3500 };
  return NIVEAUS_B5.map((n) => {
    const zonderInvoer = { ...basis, ...n.extra, batterij_kwh: 0 };
    const metInvoer = { ...basis, ...n.extra, batterij_kwh: 10, contract: 'dynamisch' };
    return {
      ...n,
      zonder: M.bereken(zonderInvoer), urlZonder: deelUrl(zonderInvoer),
      met: M.bereken(metInvoer), urlMet: deelUrl(metInvoer)
    };
  });
}

/* ---------- Pagina C: welke grootte ---------- */
const GROOTTES = [0, 2, 4, 5, 6, 8, 10, 12, 15];
const HUISHOUDENS_C = [
  { id: 'C1', naam: 'Gemiddeld huishouden', v: 3500, o: 3500 },
  { id: 'C2', naam: 'Met warmtepomp', v: 5000, o: 4500 }
];
function voorbeeldC(h) {
  const basis = { jaarverbruik_kwh: h.v, opwek_kwh: h.o };
  const rijen = GROOTTES.map((kwh) => {
    const invoer = { ...basis, batterij_kwh: kwh };
    return { kwh, url: deelUrl(invoer), res: M.bereken(invoer) };
  });
  /* Extra besparing per extra kWh, realistisch, ten opzichte van de vorige grootte. */
  rijen.forEach((r, i) => {
    if (i === 0) { r.marge = null; return; }
    const vorige = rijen[i - 1];
    r.marge = (r.res.scenarios.realistisch.besparing_batterij_per_jaar - vorige.res.scenarios.realistisch.besparing_batterij_per_jaar) / (r.kwh - vorige.kwh);
  });
  return { ...h, rijen, url: deelUrl({ ...basis, batterij_kwh: 6 }) };
}

/* Maandbeeld C1: overschot en overig verbruik per gemiddelde dag, uit het
   model zonder batterij; wat een batterij per dag laadt volgens de regel
   van het model (kleinste van overschot, capaciteit, restvraag / rendement).
   Per capaciteit gecontroleerd tegen de jaaruitkomst van het model. */
const MAANDBEELD_CAPS = [5, 10];
function maandbeeld(v, o, caps) {
  const basis = M.bereken({ jaarverbruik_kwh: v, opwek_kwh: o, batterij_kwh: 0 }).scenarios.realistisch;
  const p = basis.parameters;
  const eta = p.rendement_rondgang_pct / 100;
  const rijen = basis.maanden_zonder_batterij.map((m) => ({
    maand: m.maand, dagen: m.dagen, opwek: m.opwek,
    overschot: m.teruglevering / m.dagen, rest: m.afname / m.dagen, laadt: {}
  }));
  const verplaatst = {}, urls = {};
  for (const cap of caps) {
    const r = M.bereken({ jaarverbruik_kwh: v, opwek_kwh: o, batterij_kwh: cap }).scenarios.realistisch;
    let geleverd = 0;
    for (const m of rijen) {
      const l = Math.min(m.overschot, cap * p.max_cycli_per_dag, m.rest / eta);
      m.laadt[cap] = l;
      geleverd += l * eta * m.dagen;
    }
    if (Math.abs(geleverd - r.verplaatst_kwh_jaar1) > 0.5) {
      throw new Error('maandbeeld ' + cap + ' kWh wijkt af van het model: ' + geleverd + ' tegen ' + r.verplaatst_kwh_jaar1);
    }
    verplaatst[cap] = r.verplaatst_kwh_jaar1;
    urls[cap] = deelUrl({ jaarverbruik_kwh: v, opwek_kwh: o, batterij_kwh: cap });
  }
  return { rijen, verplaatst, urls };
}

/* ---------- Uitvoer: terminal ---------- */
function regel(cols, breedtes) { return cols.map((c, i) => String(c).padEnd(breedtes[i])).join(' | '); }

function terminal() {
  console.log('Rekenmodel ' + M.MODEL_VERSIE + ', peildatum ' + M.PEILDATUM + '. Bedragen afgerond op tientallen.\n');
  console.log('=== Pagina B: vast of dynamisch na 2027 ===');
  for (const h of HUISHOUDENS_B.map(voorbeeldB)) {
    console.log('\n' + h.id + ' ' + h.naam + ': verbruik ' + nl(h.v) + ' kWh, opwek ' + nl(h.o) + ' kWh   ' + h.url);
    const br = [34, 26, 26, 26];
    console.log(regel(['', ...S.map((n) => LABEL[n])], br));
    console.log(regel(['Extra kosten/jaar zonder batterij', ...S.map((n) => eur10(h.zonder.scenarios[n].verlies_per_jaar))], br));
    for (const r of h.rijen) {
      console.log(regel([r.contract + ' + ' + r.b + ' kWh (besparing, tvt)', ...S.map((n) => {
        const s = r.res.scenarios[n];
        return eur10(s.besparing_batterij_per_jaar) + ', ' + tvtTekst(s);
      })], br) + '   ' + r.url);
    }
    console.log(regel(['Batterijprijs 5 / 10 kWh', ...S.map((n) => eur(h.rijen[0].res.scenarios[n].batterij_prijs_eur) + ' / ' + eur(h.rijen[2].res.scenarios[n].batterij_prijs_eur))], br));
    console.log(regel(['Na 12 jaar terug, dynamisch 10 kWh', ...S.map((n) => {
      const s = h.rijen[3].res.scenarios[n];
      return eur10(s.besparing_batterij_totaal) + ' van ' + eur(s.batterij_prijs_eur);
    })], br));
  }
  console.log('\nB5 Gemiddeld huishouden (3.500/3.500), drie niveaus van netto terugleververgoeding');
  for (const n of voorbeeldB5()) {
    const br = [14, 30, 30, 30];
    console.log(regel([n.kort + ' 2027', ...S.map((x) => 'kosten ' + eur10(n.zonder.scenarios[x].kosten_2027_zonder_batterij) + ', extra ' + eur10(n.zonder.scenarios[x].verlies_per_jaar))], br) + '   ' + n.urlZonder);
    console.log(regel([n.kort + ' dyn10', ...S.map((x) => eur10(n.met.scenarios[x].besparing_batterij_per_jaar) + ', ' + tvtTekst(n.met.scenarios[x]))], br) + '   ' + n.urlMet);
  }

  console.log('\n=== Pagina C: welke batterijgrootte ===');
  for (const h of HUISHOUDENS_C.map(voorbeeldC)) {
    console.log('\n' + h.id + ' ' + h.naam + ': verbruik ' + nl(h.v) + ' kWh, opwek ' + nl(h.o) + ' kWh, vast contract');
    const br = [8, 8, 8, 8, 12, 12, 22];
    console.log(regel(['kWh', 'cons.', 'real.', 'opt.', '+/extra kWh', 'verplaatst', 'na 12 jr terug (real.)'], br));
    for (const r of h.rijen) {
      const re = r.res.scenarios.realistisch;
      console.log(regel([kwhTxt(r.kwh), ...S.map((n) => eur10(r.res.scenarios[n].besparing_batterij_per_jaar)),
        r.marge === null ? '' : eur(r.marge), nl(Math.round(re.verplaatst_kwh_jaar1 / 10) * 10) + ' kWh',
        r.kwh === 0 ? '' : eur10(re.besparing_batterij_totaal) + ' van ' + eur(re.batterij_prijs_eur) + ' (' + tvtTekst(re) + '; grens ' + eur10(re.besparing_batterij_totaal / r.kwh) + '/kWh)'], br) + '   ' + r.url);
    }
    console.log('Oordelen (c/r/o) per grootte: ' + h.rijen.filter((r) => r.kwh > 0).map((r) => kwhTxt(r.kwh) + ' ' + S.map((n) => oordeelTekst(r.res.scenarios[n])).join('/')).join('; '));
  }
  const mb = maandbeeld(3500, 3500, MAANDBEELD_CAPS);
  console.log('\nMaandbeeld C1 (realistisch): ' + MAANDBEELD_CAPS.map((c) => c + ' kWh verplaatst ' + nl(Math.round(mb.verplaatst[c])) + ' kWh ' + mb.urls[c]).join('; '));
  const bm = [10, 8, 14, 12, ...MAANDBEELD_CAPS.map(() => 16)];
  console.log(regel(['maand', 'opwek', 'overschot/dag', 'overig/dag', ...MAANDBEELD_CAPS.map((c) => c + ' kWh laadt')], bm));
  for (const r of mb.rijen) {
    console.log(regel([r.maand, nl(Math.round(r.opwek)), nl(r.overschot, 1), nl(r.rest, 1),
      ...MAANDBEELD_CAPS.map((c) => nl(r.laadt[c], 1) + ' (' + Math.round(r.laadt[c] / c * 100) + '%)')], bm));
  }
}

/* ---------- Uitvoer: HTML ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const href = (u) => esc(u);

function htmlB() {
  const out = [];
  for (const h of HUISHOUDENS_B.map(voorbeeldB)) {
    const th = '<tr><th scope="col">Per jaar</th>' + S.map((n) => '<th scope="col">' + LABEL[n] + '</th>').join('') + '</tr>';
    const rij = (kop, cellen) => '          <tr><th scope="row">' + kop + '</th>' + cellen.map((c) => '<td class="num">' + c + '</td>').join('') + '</tr>';
    const body = [rij('Extra stroomkosten vanaf 2027, zonder batterij', S.map((n) => eur10(h.zonder.scenarios[n].verlies_per_jaar)))];
    for (const r of h.rijen) {
      body.push(rij((r.contract === 'vast' ? 'Vast' : 'Dynamisch') + ', ' + r.b + ' kWh: besparing door de batterij', S.map((n) => eur10(r.res.scenarios[n].besparing_batterij_per_jaar))));
    }
    body.push(rij('Prijs batterij 5 kWh / 10 kWh', S.map((n) => eur(h.rijen[0].res.scenarios[n].batterij_prijs_eur) + ' / ' + eur(h.rijen[2].res.scenarios[n].batterij_prijs_eur))));
    body.push(rij('Beste combinatie (dynamisch, 10 kWh): na 12 jaar terugverdiend', S.map((n) => {
      const s = h.rijen[3].res.scenarios[n];
      return eur10(s.besparing_batterij_totaal) + ' van ' + eur(s.batterij_prijs_eur);
    })));
    out.push('<!-- ' + h.id + ' -->\n<div class="prose-table-wrap">\n  <table class="prose-table">\n    <caption>' + esc(h.naam) + ': verbruik ' + nl(h.v) + ' kWh, opwek ' + nl(h.o) + ' kWh per jaar. Rekenmodel ' + M.MODEL_VERSIE + ', bedragen afgerond op tientallen euro\'s. Besparing in het eerste jaar.</caption>\n    <thead>' + th + '</thead>\n    <tbody>\n' + body.join('\n') + '\n    </tbody>\n  </table>\n</div>');
    out.push('<p class="rk-voorbeeld-link"><a href="' + href(h.url) + '">Open dit voorbeeld in de rekentool</a> (vast, 5 kWh). Andere regels: <a href="' + href(h.urlZonder) + '">zonder batterij</a>, ' +
      h.rijen.slice(1).map((r) => '<a href="' + href(r.url) + '">' + r.contract + ' met ' + r.b + ' kWh</a>').join(', ') + '.</p>');
  }
  /* B5 */
  const th = '<tr><th scope="col">Per jaar</th>' + S.map((n) => '<th scope="col">' + LABEL[n] + '</th>').join('') + '</tr>';
  const body = [];
  for (const n of voorbeeldB5()) {
    body.push('          <tr><th scope="row">' + esc(n.label) + ': stroomkosten 2027 zonder batterij</th>' + S.map((x) => '<td class="num">' + eur10(n.zonder.scenarios[x].kosten_2027_zonder_batterij) + '</td>').join('') + '</tr>');
    body.push('          <tr><th scope="row">Idem, besparing door een batterij van 10 kWh (dynamisch)</th>' + S.map((x) => '<td class="num">' + eur10(n.met.scenarios[x].besparing_batterij_per_jaar) + '</td>').join('') + '</tr>');
  }
  out.push('<!-- B5 -->\n<div class="prose-table-wrap">\n  <table class="prose-table">\n    <caption>…</caption>\n    <thead>' + th + '</thead>\n    <tbody>\n' + body.join('\n') + '\n    </tbody>\n  </table>\n</div>');
  out.push('<!-- B5 links -->\n' + voorbeeldB5().map((n) => n.kort + ': <a href="' + href(n.urlZonder) + '">zonder batterij</a>, <a href="' + href(n.urlMet) + '">dynamisch met 10 kWh</a>').join('; '));
  return out.join('\n\n');
}

function svgCurve(h) {
  const rijen = h.rijen;
  const W = 640, H = 280, L = 56, R = 16, T = 16, B = 40;
  const pw = W - L - R, ph = H - T - B;
  const waarden = rijen.map((r) => S.map((n) => r.res.scenarios[n].besparing_batterij_per_jaar));
  const max = Math.max(...waarden.flat());
  const stap = 100;
  const top = Math.ceil(max / stap) * stap;
  const y = (v) => T + ph - (v / top) * ph;
  const bw = pw / rijen.length;
  const parts = [];
  parts.push('<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-labelledby="' + h.id.toLowerCase() + '-svg-titel" style="max-width:' + W + 'px; height:auto; display:block;">');
  parts.push('  <title id="' + h.id.toLowerCase() + '-svg-titel">Besparing per jaar per batterijgrootte, ' + esc(h.naam.toLowerCase()) + ', realistisch scenario met de bandbreedte van conservatief tot optimistisch</title>');
  for (let v = 0; v <= top; v += stap) {
    parts.push('  <line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '" style="stroke:var(--line);stroke-width:1"/>');
    parts.push('  <text x="' + (L - 8) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end" style="fill:var(--ink-400);font-size:12px;font-family:var(--font-sans)">€ ' + nl(v) + '</text>');
  }
  rijen.forEach((r, i) => {
    const [c, re, o] = waarden[i];
    const cx = L + bw * i + bw / 2;
    const w = bw * 0.56;
    if (re > 0) parts.push('  <rect x="' + (cx - w / 2).toFixed(1) + '" y="' + y(re).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + (y(0) - y(re)).toFixed(1) + '" rx="3" style="fill:var(--navy-400)"/>');
    const lo = Math.min(c, o), hi = Math.max(c, o);
    if (hi > 0) {
      parts.push('  <line x1="' + cx.toFixed(1) + '" x2="' + cx.toFixed(1) + '" y1="' + y(lo).toFixed(1) + '" y2="' + y(hi).toFixed(1) + '" style="stroke:var(--gold-500);stroke-width:2"/>');
      parts.push('  <line x1="' + (cx - 6).toFixed(1) + '" x2="' + (cx + 6).toFixed(1) + '" y1="' + y(lo).toFixed(1) + '" y2="' + y(lo).toFixed(1) + '" style="stroke:var(--gold-500);stroke-width:2"/>');
      parts.push('  <line x1="' + (cx - 6).toFixed(1) + '" x2="' + (cx + 6).toFixed(1) + '" y1="' + y(hi).toFixed(1) + '" y2="' + y(hi).toFixed(1) + '" style="stroke:var(--gold-500);stroke-width:2"/>');
    }
    parts.push('  <text x="' + cx.toFixed(1) + '" y="' + (H - B + 18) + '" text-anchor="middle" style="fill:var(--ink-400);font-size:12px;font-family:var(--font-sans)">' + nl(r.kwh) + '</text>');
  });
  parts.push('  <line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(0) + '" y2="' + y(0) + '" style="stroke:var(--ink-300);stroke-width:1"/>');
  parts.push('  <text x="' + (L + pw / 2) + '" y="' + (H - 4) + '" text-anchor="middle" style="fill:var(--ink-400);font-size:12px;font-family:var(--font-sans)">batterij in kWh</text>');
  parts.push('</svg>');
  return parts.join('\n');
}

function htmlC() {
  const out = [];
  for (const h of HUISHOUDENS_C.map(voorbeeldC)) {
    const th = '<tr><th scope="col">Batterij</th>' + S.map((n) => '<th scope="col">' + LABEL[n] + '</th>').join('') + '<th scope="col">Erbij per extra kWh</th><th scope="col">Terugverdiend in 12 jaar bij een prijs tot</th></tr>';
    const body = h.rijen.map((r) => '          <tr><th scope="row"><a href="' + href(r.url) + '">' + kwhTxt(r.kwh) + '</a></th>' +
      S.map((n) => '<td class="num">' + eur10(r.res.scenarios[n].besparing_batterij_per_jaar) + '</td>').join('') +
      '<td class="num">' + (r.marge === null ? '' : eur(r.marge)) + '</td>' +
      '<td class="num">' + (r.kwh === 0 ? '' : eur10(r.res.scenarios.realistisch.besparing_batterij_totaal) + ' (' + eur10(r.res.scenarios.realistisch.besparing_batterij_totaal / r.kwh) + ' per kWh)') + '</td></tr>');
    out.push('<!-- ' + h.id + ' -->\n<div class="prose-table-wrap">\n  <table class="prose-table">\n    <caption>' + esc(h.naam) + ': verbruik ' + nl(h.v) + ' kWh, opwek ' + nl(h.o) + ' kWh, vast contract. Besparing door de batterij in het eerste jaar, afgerond op tientallen euro\'s. Rekenmodel ' + M.MODEL_VERSIE + '.</caption>\n    <thead>' + th + '</thead>\n    <tbody>\n' + body.join('\n') + '\n    </tbody>\n  </table>\n</div>');
    out.push('<!-- ' + h.id + ' na 12 jaar (realistisch) -->\n' + h.rijen.filter((r) => r.kwh > 0).map((r) => {
      const re = r.res.scenarios.realistisch;
      return kwhTxt(r.kwh) + ': ' + eur10(re.besparing_batterij_totaal) + ' van ' + eur(re.batterij_prijs_eur) + ' (' + S.map((n) => oordeelTekst(r.res.scenarios[n])).join('/') + ')';
    }).join('; '));
    out.push('<!-- ' + h.id + ' SVG -->\n' + svgCurve(h));
  }
  const mb = maandbeeld(3500, 3500, MAANDBEELD_CAPS);
  const body = mb.rijen.map((r) => '          <tr><th scope="row">' + r.maand + '</th><td class="num">' + nl(r.overschot, 1) + ' kWh</td><td class="num">' + nl(r.rest, 1) + ' kWh</td>' +
    MAANDBEELD_CAPS.map((c) => '<td class="num">' + nl(r.laadt[c], 1) + ' kWh (' + Math.round(r.laadt[c] / c * 100) + '%)</td>').join('') + '</tr>');
  out.push('<!-- maandbeeld C1: ' + MAANDBEELD_CAPS.map((c) => c + ' kWh ' + mb.urls[c] + ' verplaatst ' + nl(Math.round(mb.verplaatst[c])) + ' kWh').join('; ') + ' -->\n<div class="prose-table-wrap">\n  <table class="prose-table">\n    <caption>…</caption>\n    <thead><tr><th scope="col">Maand</th><th scope="col">Zonne-overschot per dag</th><th scope="col">Overig verbruik per dag</th>' +
    MAANDBEELD_CAPS.map((c) => '<th scope="col">' + c + ' kWh laadt per dag</th>').join('') + '</tr></thead>\n    <tbody>\n' + body.join('\n') + '\n    </tbody>\n  </table>\n</div>');
  return out.join('\n\n');
}

if (HTML) {
  console.log('<!-- ===== Pagina B ===== -->\n' + htmlB());
  console.log('\n<!-- ===== Pagina C ===== -->\n' + htmlC());
} else {
  terminal();
}
