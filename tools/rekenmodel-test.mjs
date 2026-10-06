/* ============================================================
   SalderingsDienst — tools/rekenmodel-test.mjs
   Zelftest van js/rekenmodel.js (het model achter /rekentool).
   Draait los (node tools/rekenmodel-test.mjs) en vanuit
   tools/build-check.mjs. Exit 0 = alle beweringen kloppen.
   ============================================================ */
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const M = require(join(root, 'js/rekenmodel.js'));

let fouten = 0, totaal = 0;
function bewering(ok, label) {
  totaal++;
  if (ok) console.log('  ✓ ' + label);
  else { fouten++; console.error('  ✕ ' + label); }
}
const bijna = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;
const S = M.SCENARIO_VOLGORDE;

/* 1. Maandprofiel telt op tot 1 */
bewering(bijna(M.MAANDPROFIEL.reduce((a, b) => a + b, 0), 1), 'maandprofiel telt op tot 1');

/* 2. Standaardwaarden volgen het feitenblad (CBS aug 2026, 50% kaal) */
bewering(M.STANDAARD.stroomprijs_allin_eur_kwh === 0.258 && M.STANDAARD.terugleververgoeding_bruto_eur_kwh === 0.061,
  'standaard all-in prijs 0,258 en vergoeding 0,061 (feitenblad B4a, B2a/B2b)');

/* 3. Geen opwek: geen verlies en geen batterijopbrengst */
{
  const r = M.bereken({ opwek_kwh: 0, batterij_kwh: 10 });
  bewering(S.every((n) => bijna(r.scenarios[n].verlies_per_jaar, 0)), 'zonder opwek is het verlies 0 in alle scenario\'s');
  bewering(S.every((n) => bijna(r.scenarios[n].besparing_batterij_per_jaar, 0) && r.scenarios[n].terugverdientijd_jaar === null),
    'zonder opwek levert een batterij (vast contract) niets op en verdient zich niet terug');
}

/* 4. Alles direct zelf verbruikt en geen overschot: geen verlies */
{
  const r = M.bereken({ opwek_kwh: 2000, jaarverbruik_kwh: 6000, direct_eigen_verbruik_pct: 100, batterij_kwh: 0 });
  bewering(bijna(r.scenarios.realistisch.verlies_per_jaar, 0) && bijna(r.scenarios.realistisch.teruglevering_kwh_2027, 0),
    'bij 100% direct eigen verbruik zonder overschot is het verlies 0');
}

/* 5. Saldering 2026 is nooit duurder dan 2027 zonder batterij */
{
  let ok = true;
  for (const v of [1000, 3500, 8000]) for (const o of [0, 1500, 3500, 9000]) for (const d of [10, 30, 70])
    for (const c of ['vast', 'dynamisch']) {
      const r = M.bereken({ jaarverbruik_kwh: v, opwek_kwh: o, direct_eigen_verbruik_pct: d, contract: c, terugleverkosten_eur_kwh: 0.15 });
      for (const n of S) if (r.scenarios[n].kosten_2026 > r.scenarios[n].kosten_2027_zonder_batterij + 1e-9) ok = false;
    }
  bewering(ok, 'kosten 2026 (saldering) ≤ kosten 2027 zonder batterij, over een raster van invoer');
}

/* 6. Grotere batterij maakt de rekening 2027 nooit hoger */
{
  let ok = true;
  for (const c of ['vast', 'dynamisch']) {
    let vorige = Infinity;
    for (const b of [0, 1, 2.5, 5, 7.5, 10, 15, 20, 30]) {
      const s = M.bereken({ batterij_kwh: b, contract: c }).scenarios.realistisch;
      if (s.kosten_2027_met_batterij_jaar1 > vorige + 1e-9) ok = false;
      vorige = s.kosten_2027_met_batterij_jaar1;
    }
  }
  bewering(ok, 'een grotere batterij verhoogt de kosten 2027 nooit (vast en dynamisch)');
}

/* 7. Het verlies door het einde van saldering hangt niet af van de batterij */
{
  const a = M.bereken({ batterij_kwh: 0 }).scenarios.realistisch.verlies_per_jaar;
  const b = M.bereken({ batterij_kwh: 15 }).scenarios.realistisch.verlies_per_jaar;
  bewering(bijna(a, b), 'verlies per jaar is onafhankelijk van de batterijgrootte');
}

/* 8. Onbetaalbare batterij: geen terugverdientijd, oordeel loont_niet */
{
  const s = M.bereken({ batterij_kwh: 5, batterij_prijs_eur: 1e6 }).scenarios;
  bewering(S.every((n) => s[n].terugverdientijd_jaar === null && s[n].oordeel === 'loont_niet'),
    'terugverdientijd is null bij een extreem hoge batterijprijs');
}

/* 9. Het model kan ook "loont" zeggen (geen ingebakken nee) */
{
  const s = M.bereken({ batterij_kwh: 5, batterij_prijs_per_kwh_eur: 250 }).scenarios.realistisch;
  bewering(s.oordeel === 'loont' && s.terugverdientijd_jaar > 0 && s.terugverdientijd_jaar < 8, 'bij een zeer lage prijs is het oordeel "loont"');
}

/* 10. Netto terugleveropbrengst per maand nooit negatief (wettelijke ondergrens aan) */
{
  const s = M.bereken({ terugleverkosten_eur_kwh: 0.20, batterij_kwh: 0 }).scenarios.realistisch;
  const uit = M.bereken({ terugleverkosten_eur_kwh: 0.20, batterij_kwh: 0, netto_vergoeding_min_nul: false }).scenarios.realistisch;
  bewering(s.maanden_zonder_batterij.every((m) => m.netto_opbrengst >= 0)
    && uit.maanden_zonder_batterij.some((m) => m.netto_opbrengst < 0),
    'maandelijkse netto opbrengst ≥ 0 met ondergrens, en kan negatief zonder ondergrens');
}

/* 11. Energiebalans per maand sluit */
{
  const s = M.bereken({ batterij_kwh: 5 }).scenarios.realistisch;
  const mm = s.maanden_zonder_batterij;
  bewering(mm.every((m) => bijna(m.direct + m.teruglevering + m.batterij_geladen, m.opwek, 1e-6)
    && bijna(m.direct + m.afname + m.batterij_geleverd, m.verbruik, 1e-6)), 'energiebalans opwek en verbruik sluit per maand');
}

/* 12. Scenario's liggen in de goede volgorde */
{
  const s = M.bereken({ batterij_kwh: 5 }).scenarios;
  bewering(s.conservatief.verlies_per_jaar >= s.realistisch.verlies_per_jaar && s.realistisch.verlies_per_jaar >= s.optimistisch.verlies_per_jaar,
    'verlies: conservatief ≥ realistisch ≥ optimistisch');
  bewering(s.conservatief.batterij_prijs_eur === 5500 && s.realistisch.batterij_prijs_eur === 4500 && s.optimistisch.batterij_prijs_eur === 3500,
    'batterijprijs 5 kWh: 1.100 / 900 / 700 euro per kWh');
}

/* 13. Degradatie: opbrengst in het laatste jaar niet hoger dan in jaar 1 */
{
  const s = M.bereken({ batterij_kwh: 10 }).scenarios.realistisch;
  bewering(s.jaren.length === 12 && s.jaren[11].besparing <= s.jaren[0].besparing + 1e-9, 'degradatie: jaar 12 levert niet meer op dan jaar 1');
}

/* 14. Dynamisch levert nooit minder op dan vast */
{
  const v = M.bereken({ batterij_kwh: 10, contract: 'vast' }).scenarios;
  const d = M.bereken({ batterij_kwh: 10, contract: 'dynamisch' }).scenarios;
  bewering(S.every((n) => d[n].besparing_batterij_per_jaar >= v[n].besparing_batterij_per_jaar - 1e-9), 'dynamisch levert de batterij niet minder op dan vast');
}

/* 15. Geen batterij: geen oordeel, geen besparing */
{
  const s = M.bereken({ batterij_kwh: 0 }).scenarios.realistisch;
  bewering(s.oordeel === null && s.besparing_batterij_per_jaar === 0 && s.batterij_prijs_eur === 0, 'zonder batterij: oordeel null en besparing 0');
}

/* Rekenvoorbeeld voor het rapport */
const eur = (n) => '€ ' + Math.round(n).toLocaleString('nl-NL');
console.log('\nRekenvoorbeeld 3.500 kWh verbruik, 3.500 kWh opwek, 30% direct, vast contract:');
for (const b of [0, 5]) {
  const r = M.bereken({ jaarverbruik_kwh: 3500, opwek_kwh: 3500, direct_eigen_verbruik_pct: 30, contract: 'vast', batterij_kwh: b });
  console.log('  batterij ' + b + ' kWh');
  for (const n of S) {
    const s = r.scenarios[n];
    console.log('    ' + n.padEnd(13) + ' kosten 2026 ' + eur(s.kosten_2026).padStart(7) + ' | 2027 ' + eur(s.kosten_2027_zonder_batterij).padStart(7)
      + ' | verlies ' + eur(s.verlies_per_jaar).padStart(6)
      + (b ? ' | batterij ' + eur(s.batterij_prijs_eur) + ', jaar 1 ' + eur(s.besparing_batterij_per_jaar) + ', gem. ' + eur(s.besparing_batterij_gemiddeld)
        + ', ' + Math.round(s.verplaatst_kwh_jaar1) + ' kWh verplaatst, terugverdientijd ' + (s.terugverdientijd_jaar === null ? 'niet binnen ' + s.parameters.levensduur_jaar + ' jaar' : s.terugverdientijd_jaar.toFixed(1) + ' jaar')
        + ', oordeel ' + s.oordeel : ''));
  }
}

console.log('\n' + (totaal - fouten) + '/' + totaal + ' beweringen geslaagd (model ' + M.MODEL_VERSIE + ')');
if (fouten) process.exit(1);
