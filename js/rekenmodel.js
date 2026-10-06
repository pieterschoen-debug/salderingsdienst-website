/* ============================================================
   SalderingsDienst — rekenmodel.js
   Puur rekenmodel voor /rekentool: wat kost het einde van
   salderen per jaar, wat doet een thuisbatterij, en wanneer is
   hij terugverdiend. Drie scenario's per uitkomst.

   Geen DOM, geen netwerk, geen afhankelijkheden. Werkt in de
   browser (window.SDRekenmodel) en in node (module.exports).
   Bronnen en peildatum: docs/seo/feitenblad-saldering-2027.md
   (bronnummers B1 t/m B5 verwijzen naar docs/seo/bronnen.md).

   Methode in het kort (uitgebreid op de pagina, sectie Methode):
   - maandmodel: opwek volgens een vaste NL-maandverdeling,
     verbruik vlak over het jaar, elke dag van een maand gelijk;
   - per dag: direct eigen verbruik = min(opwek × direct%, verbruik),
     overschot = opwek − direct, restvraag = verbruik − direct;
   - batterij laadt per dag min(overschot, bruikbare capaciteit ×
     cycli, restvraag ÷ rendement) en levert dat × rendement;
   - 2026: jaarsaldering; teruglevering tot het eigen verbruik is
     het all-in tarief waard, daarboven de terugleververgoeding;
     terugleverkosten per teruggeleverde kWh in beide jaren;
   - 2027: afname tegen het all-in tarief, teruglevering tegen
     vergoeding min terugleverkosten, per maand niet onder nul
     (instelbaar);
   - dynamisch: arbitrage met de ongebruikte capaciteit op dagen
     waarop de zon de batterij voor minder dan 30% vult.
   ============================================================ */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SDRekenmodel = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MODEL_VERSIE = '1.0.0';
  var PEILDATUM = '2026-10-06';

  var CHANGELOG = {
    '1.0.0': {
      datum: '2026-10-06',
      wijzigingen: [
        "Eerste publieke versie: maandmodel, drie scenario's, batterij met degradatie en terugverdientijd.",
        'Prijzen CBS augustus 2026; terugleververgoeding op het wettelijke minimum tot 1 januari 2030.',
        'Opbrengst uit onbalanshandel staat standaard op nul.'
      ]
    }
  };

  /* Maandverdeling zonne-opwek in Nederland (aanname, gangbaar profiel).
     Twaalf aandelen die samen 1 zijn. */
  var MAANDPROFIEL = [0.03, 0.05, 0.09, 0.12, 0.13, 0.13, 0.13, 0.12, 0.09, 0.06, 0.03, 0.02];
  var MAANDNAMEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  var DAGEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  /* CBS aug 2026 (B4a): leveringstarief 0,1469 + energiebelasting 0,11085, beide incl. btw. */
  var LEVERING_KAAL_INCL_BTW = 0.1469;
  var ENERGIEBELASTING_INCL_BTW = 0.11085;

  var STANDAARD = {
    jaarverbruik_kwh: 3500,
    opwek_kwh: 3500,
    direct_eigen_verbruik_pct: 30,
    contract: 'vast',
    stroomprijs_allin_eur_kwh: round(LEVERING_KAAL_INCL_BTW + ENERGIEBELASTING_INCL_BTW, 3),
    /* 50% van het kale leveringstarief (zonder btw): 0,1469 / 1,21 × 0,5 */
    terugleververgoeding_bruto_eur_kwh: round(LEVERING_KAAL_INCL_BTW / 1.21 * 0.5, 3),
    terugleverkosten_eur_kwh: 0.02,
    batterij_kwh: 5,
    batterij_prijs_per_kwh_eur: 900,
    batterij_prijs_eur: null,          /* null = prijs per kWh × kWh */
    rendement_rondgang_pct: 90,
    degradatie_pct_per_jaar: 2,
    levensduur_jaar: 12,
    max_cycli_per_dag: 1,
    dynamisch_spread_eur_kwh: 0.10,
    onbalans_opbrengst_eur_jaar: 0,
    netto_vergoeding_min_nul: true,
    kwh_per_paneel: 315
  };

  /* Scenario's: verschuivingen ten opzichte van de (eventueel aangepaste)
     invoer. Conservatief = voor de huiseigenaar ongunstig: hogere kosten
     van het einde van saldering en een langere terugverdientijd. */
  var SCENARIOS = {
    conservatief: {
      label: 'Conservatief',
      terugleververgoeding_bruto_eur_kwh: -0.01,
      terugleverkosten_eur_kwh: +0.01,
      batterij_prijs_per_kwh_eur: +200,
      rendement_rondgang_pct: -5,
      direct_eigen_verbruik_pct: -5
    },
    realistisch: { label: 'Realistisch' },
    optimistisch: {
      label: 'Optimistisch',
      terugleververgoeding_bruto_eur_kwh: +0.02,
      terugleverkosten_eur_kwh: -0.01,
      batterij_prijs_per_kwh_eur: -200,
      rendement_rondgang_pct: +2,
      direct_eigen_verbruik_pct: +5
    }
  };
  var SCENARIO_VOLGORDE = ['conservatief', 'realistisch', 'optimistisch'];

  /* Oordeel: loont als de batterij binnen twee derde van de levensduur is
     terugverdiend, twijfelgeval als dat binnen de levensduur lukt. */
  var OORDEEL_LOONT_FRACTIE = 2 / 3;
  /* Dynamisch: arbitrage alleen op dagen waarop de zon de batterij voor
     minder dan dit deel vult (winterdagen). */
  var ARBITRAGE_DREMPEL = 0.30;

  /* ---------- Hulpfuncties ---------- */
  function round(n, d) { var f = Math.pow(10, d || 0); return Math.round(n * f) / f; }
  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
  function getal(v, val) { var n = Number(v); return (v === null || v === undefined || v === '' || isNaN(n)) ? val : n; }

  function normaliseer(invoer) {
    var i = invoer || {};
    var s = STANDAARD;
    var p = {
      jaarverbruik_kwh: clamp(getal(i.jaarverbruik_kwh, s.jaarverbruik_kwh), 0, 100000),
      opwek_kwh: clamp(getal(i.opwek_kwh, s.opwek_kwh), 0, 100000),
      direct_eigen_verbruik_pct: clamp(getal(i.direct_eigen_verbruik_pct, s.direct_eigen_verbruik_pct), 0, 100),
      contract: i.contract === 'dynamisch' ? 'dynamisch' : 'vast',
      stroomprijs_allin_eur_kwh: clamp(getal(i.stroomprijs_allin_eur_kwh, s.stroomprijs_allin_eur_kwh), 0, 5),
      terugleververgoeding_bruto_eur_kwh: clamp(getal(i.terugleververgoeding_bruto_eur_kwh, s.terugleververgoeding_bruto_eur_kwh), -5, 5),
      terugleverkosten_eur_kwh: clamp(getal(i.terugleverkosten_eur_kwh, s.terugleverkosten_eur_kwh), 0, 5),
      batterij_kwh: clamp(getal(i.batterij_kwh, s.batterij_kwh), 0, 200),
      batterij_prijs_per_kwh_eur: clamp(getal(i.batterij_prijs_per_kwh_eur, s.batterij_prijs_per_kwh_eur), 0, 100000),
      batterij_prijs_eur: (i.batterij_prijs_eur === null || i.batterij_prijs_eur === undefined || i.batterij_prijs_eur === '') ? null : clamp(getal(i.batterij_prijs_eur, 0), 0, 10000000),
      rendement_rondgang_pct: clamp(getal(i.rendement_rondgang_pct, s.rendement_rondgang_pct), 1, 100),
      degradatie_pct_per_jaar: clamp(getal(i.degradatie_pct_per_jaar, s.degradatie_pct_per_jaar), 0, 50),
      levensduur_jaar: Math.round(clamp(getal(i.levensduur_jaar, s.levensduur_jaar), 1, 40)),
      max_cycli_per_dag: clamp(getal(i.max_cycli_per_dag, s.max_cycli_per_dag), 0, 4),
      dynamisch_spread_eur_kwh: clamp(getal(i.dynamisch_spread_eur_kwh, s.dynamisch_spread_eur_kwh), 0, 2),
      onbalans_opbrengst_eur_jaar: clamp(getal(i.onbalans_opbrengst_eur_jaar, s.onbalans_opbrengst_eur_jaar), 0, 100000),
      netto_vergoeding_min_nul: i.netto_vergoeding_min_nul === undefined ? s.netto_vergoeding_min_nul : !!i.netto_vergoeding_min_nul,
      kwh_per_paneel: clamp(getal(i.kwh_per_paneel, s.kwh_per_paneel), 0, 2000)
    };
    return p;
  }

  function batterijPrijs(p) {
    if (p.batterij_kwh <= 0) return 0;
    if (p.batterij_prijs_eur !== null) return p.batterij_prijs_eur;
    return p.batterij_kwh * p.batterij_prijs_per_kwh_eur;
  }

  function opwekUitPanelen(aantal, kwhPerPaneel) {
    var n = Math.max(0, Math.round(getal(aantal, 0)));
    return n * getal(kwhPerPaneel, STANDAARD.kwh_per_paneel);
  }

  /* ---------- Energiestromen per maand ----------
     cap = bruikbare capaciteit in dat jaar (na degradatie). */
  function stromen(p, cap) {
    var eta = p.rendement_rondgang_pct / 100;
    var d = p.direct_eigen_verbruik_pct / 100;
    var verbruikDag = p.jaarverbruik_kwh / 365;
    var maandCap = cap * p.max_cycli_per_dag;
    var maanden = [];
    for (var m = 0; m < 12; m++) {
      var dagen = DAGEN[m];
      var opwekDag = p.opwek_kwh * MAANDPROFIEL[m] / dagen;
      var direct = Math.min(opwekDag * d, verbruikDag);
      var overschot = opwekDag - direct;
      var rest = verbruikDag - direct;
      var geladen = 0, geleverd = 0, arbitrage = 0;
      if (maandCap > 0 && eta > 0) {
        geladen = Math.min(overschot, maandCap, rest / eta);
        geleverd = geladen * eta;
        if (p.contract === 'dynamisch' && geladen < ARBITRAGE_DREMPEL * cap) {
          /* Ongebruikte capaciteit 's nachts goedkoop laden en bij piek
             zelf verbruiken; nooit terugleveren (dubbele energiebelasting, B3f). */
          arbitrage = Math.max(0, Math.min(maandCap - geladen, (rest - geleverd) / eta));
        }
      }
      maanden.push({
        maand: MAANDNAMEN[m],
        dagen: dagen,
        opwek: opwekDag * dagen,
        verbruik: verbruikDag * dagen,
        direct: direct * dagen,
        teruglevering: (overschot - geladen) * dagen,
        afname: (rest - geleverd) * dagen,
        batterij_geladen: geladen * dagen,
        batterij_geleverd: geleverd * dagen,
        arbitrage_geladen: arbitrage * dagen
      });
    }
    return maanden;
  }

  function som(maanden, veld) {
    var t = 0;
    for (var i = 0; i < maanden.length; i++) t += maanden[i][veld];
    return t;
  }

  /* Netto terugleveropbrengst 2027 per maand. */
  function terugOpbrengst(p, kwh) {
    var netto = kwh * (p.terugleververgoeding_bruto_eur_kwh - p.terugleverkosten_eur_kwh);
    return p.netto_vergoeding_min_nul ? Math.max(0, netto) : netto;
  }

  /* Kosten 2026 met jaarsaldering (zonder batterij; onder saldering
     levert een batterij niets op). */
  function kosten2026(p) {
    var mm = stromen(p, 0);
    var afname = som(mm, 'afname');
    var terug = som(mm, 'teruglevering');
    var netto = afname - terug;
    /* Tekort: all-in tarief. Overschot boven het eigen verbruik: alleen de
       terugleververgoeding (negatieve kosten). */
    var k = netto >= 0
      ? netto * p.stroomprijs_allin_eur_kwh
      : netto * p.terugleververgoeding_bruto_eur_kwh;
    /* Terugleverkosten gelden sinds 1-1-2026 al per teruggeleverde kWh (B2d);
       zelfde tarief als in 2027, zodat het verschil alleen saldering is.
       Staat de ondergrens "netto niet onder nul" aan, dan rekenen we in
       beide jaren hoogstens zoveel terugleverkosten als de vergoeding. */
    var tlk = p.netto_vergoeding_min_nul
      ? Math.min(p.terugleverkosten_eur_kwh, Math.max(0, p.terugleververgoeding_bruto_eur_kwh))
      : p.terugleverkosten_eur_kwh;
    k += terug * tlk;
    return { kosten: k, afname: afname, teruglevering: terug, maanden: mm };
  }

  /* Kosten 2027 zonder saldering, met batterij van capaciteit cap. */
  function kosten2027(p, cap) {
    var mm = stromen(p, cap);
    var k = 0, arbitrageWaarde = 0;
    var eta = p.rendement_rondgang_pct / 100;
    var prijs = p.stroomprijs_allin_eur_kwh;
    var spread = p.dynamisch_spread_eur_kwh;
    for (var i = 0; i < mm.length; i++) {
      var maand = mm[i];
      maand.netto_opbrengst = terugOpbrengst(p, maand.teruglevering);
      k += maand.afname * prijs - maand.netto_opbrengst;
      if (maand.arbitrage_geladen > 0) {
        /* Laden tegen prijs − spread/2, ontladen (× rendement) in plaats van
           afname tegen prijs + spread/2. */
        arbitrageWaarde += maand.arbitrage_geladen * (eta * (prijs + spread / 2) - (prijs - spread / 2));
      }
    }
    arbitrageWaarde = Math.max(0, arbitrageWaarde);
    return {
      kosten: k - arbitrageWaarde,
      arbitrage: arbitrageWaarde,
      afname: som(mm, 'afname'),
      teruglevering: som(mm, 'teruglevering'),
      verplaatst: som(mm, 'batterij_geleverd'),
      maanden: mm
    };
  }

  function oordeelVan(terugverdientijd, levensduur, heeftBatterij) {
    if (!heeftBatterij) return null;
    if (terugverdientijd === null) return 'loont_niet';
    if (terugverdientijd <= levensduur * OORDEEL_LOONT_FRACTIE) return 'loont';
    return 'twijfelgeval';
  }

  /* ---------- Eén scenario doorrekenen ---------- */
  function rekenScenario(invoer) {
    var p = normaliseer(invoer);
    var k26 = kosten2026(p);
    var zonder = kosten2027(p, 0);
    var prijs = batterijPrijs(p);
    var heeftBatterij = p.batterij_kwh > 0;

    var jaren = [];
    var cumulatief = 0, terugverdientijd = null, totaal = 0;
    if (heeftBatterij) {
      for (var j = 1; j <= p.levensduur_jaar; j++) {
        var cap = p.batterij_kwh * Math.pow(1 - p.degradatie_pct_per_jaar / 100, j - 1);
        var met = kosten2027(p, cap);
        var besparing = zonder.kosten - met.kosten + p.onbalans_opbrengst_eur_jaar;
        jaren.push({ jaar: j, capaciteit_kwh: cap, besparing: besparing, verplaatst_kwh: met.verplaatst, arbitrage: met.arbitrage });
        if (terugverdientijd === null && besparing > 0 && cumulatief + besparing >= prijs) {
          terugverdientijd = (j - 1) + (prijs - cumulatief) / besparing;
        }
        cumulatief += besparing;
        totaal += besparing;
      }
      if (prijs <= 0) terugverdientijd = 0;
    }
    var jaar1 = jaren.length ? jaren[0] : { besparing: 0, verplaatst_kwh: 0, arbitrage: 0 };

    return {
      parameters: p,
      batterij_prijs_eur: prijs,
      kosten_2026: k26.kosten,
      kosten_2027_zonder_batterij: zonder.kosten,
      kosten_2027_met_batterij_jaar1: heeftBatterij ? zonder.kosten - (jaar1.besparing - p.onbalans_opbrengst_eur_jaar) : zonder.kosten,
      verlies_per_jaar: zonder.kosten - k26.kosten,
      teruglevering_kwh_2027: zonder.teruglevering,
      direct_eigen_verbruik_kwh: som(zonder.maanden, 'direct'),
      besparing_batterij_per_jaar: jaar1.besparing,
      besparing_batterij_gemiddeld: jaren.length ? totaal / jaren.length : 0,
      besparing_batterij_totaal: totaal,
      verplaatst_kwh_jaar1: jaar1.verplaatst_kwh,
      arbitrage_jaar1: jaar1.arbitrage,
      terugverdientijd_jaar: terugverdientijd,
      oordeel: oordeelVan(terugverdientijd, p.levensduur_jaar, heeftBatterij),
      jaren: jaren,
      maanden_zonder_batterij: zonder.maanden
    };
  }

  /* Invoer per scenario: verschuivingen toepassen op de basisinvoer. */
  function scenarioInvoer(invoer, naam) {
    var basis = normaliseer(invoer);
    var delta = SCENARIOS[naam] || {};
    var uit = {};
    for (var k in basis) if (Object.prototype.hasOwnProperty.call(basis, k)) uit[k] = basis[k];
    ['terugleververgoeding_bruto_eur_kwh', 'terugleverkosten_eur_kwh', 'batterij_prijs_per_kwh_eur', 'rendement_rondgang_pct', 'direct_eigen_verbruik_pct'].forEach(function (k) {
      if (typeof delta[k] === 'number') uit[k] = basis[k] + delta[k];
    });
    uit.terugleverkosten_eur_kwh = Math.max(0, uit.terugleverkosten_eur_kwh);
    uit.batterij_prijs_per_kwh_eur = Math.max(0, uit.batterij_prijs_per_kwh_eur);
    uit.rendement_rondgang_pct = clamp(uit.rendement_rondgang_pct, 1, 100);
    uit.direct_eigen_verbruik_pct = clamp(uit.direct_eigen_verbruik_pct, 0, 100);
    /* Een vast ingevulde totaalprijs schuift mee met dezelfde €/kWh-verschuiving. */
    if (basis.batterij_prijs_eur !== null && typeof delta.batterij_prijs_per_kwh_eur === 'number') {
      uit.batterij_prijs_eur = Math.max(0, basis.batterij_prijs_eur + delta.batterij_prijs_per_kwh_eur * basis.batterij_kwh);
    }
    return uit;
  }

  /* ---------- Hoofdfunctie: drie scenario's ---------- */
  function bereken(invoer) {
    var uit = { versie: MODEL_VERSIE, peildatum: PEILDATUM, invoer: normaliseer(invoer), scenarios: {} };
    SCENARIO_VOLGORDE.forEach(function (naam) {
      uit.scenarios[naam] = rekenScenario(scenarioInvoer(invoer, naam));
    });
    return uit;
  }

  /* Opbrengst per batterijgrootte (één scenario), voor de maatkeuze. */
  function batterijCurve(invoer, groottes, scenario) {
    return (groottes || [0, 2.5, 5, 7.5, 10, 15]).map(function (kwh) {
      var i = scenarioInvoer(invoer, scenario || 'realistisch');
      i.batterij_kwh = kwh;
      i.batterij_prijs_eur = null;
      var r = rekenScenario(i);
      return {
        batterij_kwh: kwh,
        prijs_eur: r.batterij_prijs_eur,
        verplaatst_kwh: r.verplaatst_kwh_jaar1,
        besparing_jaar1: r.besparing_batterij_per_jaar,
        terugverdientijd_jaar: r.terugverdientijd_jaar,
        oordeel: r.oordeel
      };
    });
  }

  return {
    MODEL_VERSIE: MODEL_VERSIE,
    PEILDATUM: PEILDATUM,
    CHANGELOG: CHANGELOG,
    MAANDPROFIEL: MAANDPROFIEL.slice(),
    MAANDNAMEN: MAANDNAMEN.slice(),
    STANDAARD: STANDAARD,
    SCENARIOS: SCENARIOS,
    SCENARIO_VOLGORDE: SCENARIO_VOLGORDE.slice(),
    OORDEEL_LOONT_FRACTIE: OORDEEL_LOONT_FRACTIE,
    ARBITRAGE_DREMPEL: ARBITRAGE_DREMPEL,
    normaliseer: normaliseer,
    opwekUitPanelen: opwekUitPanelen,
    rekenScenario: rekenScenario,
    scenarioInvoer: scenarioInvoer,
    bereken: bereken,
    batterijCurve: batterijCurve
  };
});
