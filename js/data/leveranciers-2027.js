/* ============================================================
   SalderingsDienst — js/data/leveranciers-2027.js
   Eén dataset voor de tabel op
   /kennisbank/terugleververgoeding-2027-per-leverancier en voor de
   leverancierskeuze in /rekentool. ES5, geen afhankelijkheden.
   Browser: window.SD_LEVERANCIERS (data) en
   window.SD_LEVERANCIERS_HTML (tabel-HTML). Node: module.exports.

   Regels voor deze dataset
   - Bedragen in cent per kWh, zoals de bron ze publiceert. Nooit een
     geschat getal: niet gevonden is null, met uitleg in *_tekst.
   - Per regel staan vergoeding en terugleverkosten apart voor 2026 en
     2027 (vergoeding_2026_ct_kwh, vergoeding_2027_ct_kwh,
     kosten_2026_ct_kwh, kosten_2027_ct_kwh), met de btw-basis per
     bedrag (vergoeding_btw, kosten_btw: 'excl', 'incl', '0%' of
     'onbekend'). Een bedrag wordt niet omgerekend naar een andere basis.
   - status: 'geverifieerd' alleen voor bedragen die wij op de eigen site
     of in een eigen PDF van de leverancier hebben gezien; 'secundair'
     (alleen via een vergelijkingssite, naam en datum in status_bron),
     'niet_gevonden', of 'wet' (de wettelijke ondergrens). Staat voor
     één leverancier een bedrag bij de leverancier en een ander bij een
     vergelijkingssite, dan zijn dat twee regels.
   - Staffels: leveranciers rekenen over 2026 vaak een vast bedrag per
     dag of per jaar naar de hoeveelheid teruglevering. Zo'n regel heeft
     kosten_staffel: true, een korte omschrijving in kosten_staffel_tekst
     en in kosten_2026_ct_kwh een representatieve waarde bij 2.500 kWh
     teruglevering per jaar (het jaarbedrag gedeeld door 2.500; de
     berekening staat in de opmerking). Die waarde geldt alleen bij die
     hoeveelheid en gaat daarom nooit als kosten 2026 naar de rekentool.
   - netto_2026_ct_kwh en netto_2027_ct_kwh worden hieronder berekend
     (vergoeding min kosten, zelfde jaar) en staan nooit met de hand in de
     data. netto_basis meldt als de btw-basis van beide bedragen niet gelijk
     of niet bekend is.
   - kiesbaar (afgeleid): status 'geverifieerd' of 'secundair' en een
     vergoeding én terugleverkosten per kWh voor 2027. Kosten 2026 gaan
     alleen mee (kosten_2026_bruikbaar) als ze per kWh bekend zijn en geen
     staffel zijn. In de rekentool staan de geverifieerde regels in de
     eerste groep, de vergelijkingssites in de tweede.
   - Na een wijziging: versie ophogen, een regel in wijzigingslog,
     en node tools/leveranciers-tabel.mjs --write.
   ============================================================ */
(function () {
  'use strict';

  var D = '2026-10-06';
  function bron(naam, url, datum) { return { naam: naam, url: url, datum: datum || D }; }
  /* Jaarbedrag (euro) naar cent per kWh bij een gegeven jaarlijkse teruglevering. */
  function staffel(jaarEuro, kwh) { return Math.round(jaarEuro / kwh * 10000) / 100; }

  var KEUZE = bron('keuze.nl, terugleverkosten 2027', 'https://www.keuze.nl/energie/terugleverkosten');
  var KEUZE_TLV = bron('keuze.nl, terugleververgoeding', 'https://www.keuze.nl/energie/terugleververgoeding');
  var KEUZE_2025 = bron('keuze.nl, vergoedingen na 2027', 'https://www.keuze.nl/nieuws/salderen-na-2027-van-deze-leveranciers-is-de-vergoeding-bekend', '2025-12-11');
  var EV_OKT = bron('energievergelijk.nl, 1 oktober 2026', 'https://www.energievergelijk.nl/nieuws/terugleververgoedingen-stijgen-in-2027-deze-5-leveranciers-betalen-het-meest', '2026-10-01');
  var EV_MEI = bron('energievergelijk.nl, hoogste vergoeding 2027', 'https://www.energievergelijk.nl/nieuws/hier-ontvang-je-de-hoogste-terugleververgoeding-voor-zonne-energie-vanaf-2027', '2026-05-13');
  var EV_6OKT = bron('energievergelijk.nl, overzicht per leverancier, 6 oktober 2026', 'https://www.energievergelijk.nl/');
  var GASLICHT = bron('gaslicht.com, terugleververgoeding', 'https://www.gaslicht.com/energiebesparing/terugleveren');
  var OVERSTAPPEN = bron('overstappen.nl, 6 oktober 2026', 'https://www.overstappen.nl/');
  var VAST_KEUZE = '1 jaar vast, tarief 2027';

  /* Rij uit keuze.nl (secundair): vergoeding zonder belasting en btw, terugleverkosten incl. btw. */
  function vastKeuze(id, naam, tlv, tlk, extra) {
    var r = {
      id: id, leverancier: naam, contractvorm: VAST_KEUZE, geldig: 'vanaf 1 januari 2027',
      vergoeding_2027_ct_kwh: tlv, vergoeding_btw: 'excl',
      kosten_2027_ct_kwh: tlk, kosten_btw: 'incl',
      status: 'secundair', status_bron: 'keuze.nl, 6-10-2026',
      bronnen: [KEUZE]
    };
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) r[k] = extra[k];
    return r;
  }

  var data = {
    versie: '2026.10.2',
    peildatum: D,
    eenheid: 'cent per kWh',
    toelichting: 'Bedragen zoals de bron ze noemt, met de btw-basis per bedrag. Bij keuze.nl is de vergoeding zonder belasting en btw en zijn de terugleverkosten inclusief btw. Netto = vergoeding min terugleverkosten van hetzelfde jaar, berekend uit de bedragen zoals gepubliceerd; dat kan 0,01 cent afwijken van de bron.',

    wettelijk_minimum: {
      regel: 'Tot 1 januari 2030 minimaal 50% van de overeengekomen (kale) leveringsprijs, zonder energiebelasting en btw; per maand gemiddeld niet negatief. Daarna alleen een redelijke vergoeding.',
      voorbeeld_ct_kwh: 6.07,
      voorbeeld_uitleg: '50% van het CBS-gemiddelde variabele leveringstarief van augustus 2026 (€ 0,1469 incl. btw, dus € 0,1214 zonder btw).',
      bronnen: [
        bron('Staatsblad 2025, 17, art. 2.34 Energiewet', 'https://zoek.officielebekendmakingen.nl/stb-2025-17.html'),
        bron('Rijksoverheid', 'https://www.rijksoverheid.nl/onderwerpen/energie-thuis/salderingsregeling'),
        bron('ACM ConsuWijzer', 'https://consument.acm.nl/elektriciteit-en-gas/duurzame-energie/wat-is-salderen'),
        bron('CBS 85592NED', 'https://www.cbs.nl/nl-nl/cijfers/detail/85592NED')
      ]
    },

    secundaire_bronnen: [
      { naam: 'keuze.nl, Terugleverkosten vergelijken 2027', url: 'https://www.keuze.nl/energie/terugleverkosten', datum: D, bereik: '2027, 1 jaar vast, 14 leveranciers; terugleverkosten incl. btw. Dynamische leveranciers met terugleverkosten 2026.' },
      { naam: 'keuze.nl, Terugleververgoeding', url: 'https://www.keuze.nl/energie/terugleververgoeding', datum: D, bereik: '2026 en 2027, bruto en netto voor 12 leveranciers; vergoeding zonder belasting en btw.' },
      { naam: 'energievergelijk.nl, Terugleververgoedingen stijgen in 2027', url: 'https://www.energievergelijk.nl/nieuws/terugleververgoedingen-stijgen-in-2027-deze-5-leveranciers-betalen-het-meest', datum: '2026-10-01', bereik: '2027, vast: netto Eneco 3,85, Vattenfall 3,44, Essent 3,08 ct; dynamisch ongeveer 7,6 tot 7,8 ct bij een marktwaarde van 5,1 ct. Btw-basis niet vermeld.' },
      { naam: 'energievergelijk.nl, overzicht per leverancier', url: 'https://www.energievergelijk.nl/', datum: D, bereik: '2027, vast 1 jaar, onder meer Coolblue, Energiedirect en UnitedConsumers. Btw-basis niet vermeld.' },
      { naam: 'energievergelijk.nl, Netto terugleververgoeding per 1 januari 2027', url: 'https://www.energievergelijk.nl/nieuws/dit-wordt-de-netto-terugleververgoeding-voor-zonnepanelen-per-1-januari-2027', datum: '2026-02-24', bereik: 'Ouder overzicht met netto bedragen, onder meer Innova en GewoonEnergie op min 7,43 ct en Mega op min 2,12 ct.' },
      { naam: 'gaslicht.com, Terugleververgoeding vergelijken', url: 'https://www.gaslicht.com/energiebesparing/terugleveren', datum: D, bereik: 'Vergoeding bij Vandebron, verkoopvergoeding bij dynamische contracten (Vandebron, Pure Energie); geen tabel voor 2027 per leverancier.' },
      { naam: 'overstappen.nl', url: 'https://www.overstappen.nl/', datum: D, bereik: 'Vergoeding vast 1 jaar bij Powerpeers.' },
      { naam: 'Radar (AVROTROS)', url: 'https://radar.avrotros.nl/artikel/bij-deze-energieleveranciers-gaat-het-terugleveren-van-zonnestroom-je-geld-kosten-62049', datum: '2025-10-30', bereik: '2027, meerjarig: Innova en GewoonEnergie netto min 5,58 ct; de meeste anderen rond 0,25 ct.' }
    ],

    rijen: [
      {
        id: 'wettelijk-minimum', leverancier: 'Wettelijk minimum', contractvorm: 'elk contract, tot 1 januari 2030',
        vergoeding_tekst: 'minimaal 50% van de kale leveringsprijs; bij het CBS-gemiddelde ongeveer 6,07 ct excl. btw', vergoeding_btw: 'excl',
        kosten_tekst: 'geen wettelijk bedrag; alleen werkelijke verwerkingskosten',
        netto_tekst: 'per maand gemiddeld niet negatief (de vergoeding)',
        status: 'wet', status_bron: null, geldig: '1 januari 2027 tot 1 januari 2030',
        bronnen: [
          bron('Staatsblad 2025, 17', 'https://zoek.officielebekendmakingen.nl/stb-2025-17.html'),
          bron('ACM ConsuWijzer', 'https://consument.acm.nl/elektriciteit-en-gas/duurzame-energie/wat-is-salderen')
        ]
      },

      /* ----- ANWB Energie ----- */
      {
        id: 'anwb-dynamisch', leverancier: 'ANWB Energie', contractvorm: 'dynamisch', geldig: 'nu, eigen pagina',
        vergoeding_tekst: 'kale uurprijs; de inkoopkosten van 1,8 ct incl. btw worden niet op de teruglevering ingehouden',
        kosten_2026_ct_kwh: 0, kosten_tekst: 'geen terugleverkosten',
        status: 'geverifieerd', status_bron: null,
        bronnen: [bron('ANWB Energie, terugleverkosten met zonnepanelen', 'https://www.anwb.nl/energie/terugleverkosten-met-zonnepanelen')]
      },

      /* ----- Budget Thuis (voorheen Budget Energie) ----- */
      {
        id: 'budget-2026-staffel', leverancier: 'Budget Thuis (Budget Energie)', contractvorm: 'vast en variabel, staffel 2026', geldig: 'staffel vanaf 16 december 2025',
        vergoeding_tekst: 'zie het modelcontract hieronder',
        kosten_2026_ct_kwh: staffel(215, 2500), kosten_btw: 'incl',
        kosten_staffel: true, kosten_staffel_tekst: 'staffel per dag naar jaarlijkse teruglevering; 2.000 tot 2.500 kWh: € 0,59 per dag',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Representatieve waarde: € 0,59 per dag is ongeveer € 215 per jaar; gedeeld door 2.500 kWh is dat 8,60 ct per kWh.',
        bronnen: [bron('Budget Thuis, terugleverkosten', 'https://budgetthuis.nl/energie/terugleverkosten')]
      },
      {
        id: 'budget-modelcontract-vast', leverancier: 'Budget Thuis (Budget Energie)', contractvorm: 'modelcontract 1 jaar vast', geldig: 'modelcontract, periode niet vermeld',
        vergoeding_2026_ct_kwh: 10.0, vergoeding_btw: 'excl',
        kosten_2026_ct_kwh: 8.058, kosten_btw: 'onbekend',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'De btw bij de terugleverkosten is vermoedelijk inclusief; het modelcontract noemt dat niet. Een bedrag voor 2027 staat er niet bij.',
        bronnen: [bron('Budget Thuis, modelcontract', 'https://budgetthuis.nl/energie/modelcontract')]
      },
      {
        id: 'budget-modelcontract-variabel', leverancier: 'Budget Thuis (Budget Energie)', contractvorm: 'modelcontract variabel', geldig: 'modelcontract, periode niet vermeld',
        vergoeding_2026_ct_kwh: 9.0, vergoeding_btw: 'excl',
        kosten_2026_ct_kwh: 8.75, kosten_btw: 'onbekend',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'De btw bij de terugleverkosten is vermoedelijk inclusief; het modelcontract noemt dat niet. Een bedrag voor 2027 staat er niet bij.',
        bronnen: [bron('Budget Thuis, modelcontract', 'https://budgetthuis.nl/energie/modelcontract')]
      },
      vastKeuze('budget-vast', 'Budget Thuis (Budget Energie)', 8.00, 5.50, { opmerking: 'keuze.nl noemt het merk Budget Thuis. energievergelijk.nl (13-5-2026) gaf 5,65 ct vergoeding en 3,15 ct kosten, ook 2,50 ct netto.' }),

      /* ----- Clean Energy ----- */
      {
        id: 'clean-energy', leverancier: 'Clean Energy', contractvorm: 'onbekend',
        vergoeding_tekst: 'niet gevonden', kosten_tekst: 'niet gevonden',
        status: 'niet_gevonden', status_bron: null, geldig: null,
        opmerking: 'Geen bedrag bij de leverancier gevonden. energievergelijk.nl noemt 20,3 ct vergoeding en 16,8 ct kosten, datum onbekend; daarom niet als bedrag overgenomen.',
        bronnen: []
      },

      /* ----- Coolblue Energie ----- */
      {
        id: 'coolblue-vast', leverancier: 'Coolblue Energie', contractvorm: '1 jaar vast', geldig: 'vermoedelijk vanaf 1 januari 2027',
        vergoeding_2027_ct_kwh: 8.8, vergoeding_btw: 'onbekend',
        kosten_2027_ct_kwh: 8.2, kosten_btw: 'onbekend',
        status: 'secundair', status_bron: 'energievergelijk.nl, 6-10-2026',
        opmerking: 'De eigen site van Coolblue gaf op 6-10-2026 geen toegang (403). Een zoekfragment van het modelcontract noemt voor 2027 10,9 ct vergoeding en 10,4 ct kosten; dat hebben wij niet kunnen controleren en daarom niet overgenomen. keuze.nl (11-12-2025) noemde 7,00 en 6,50 ct.',
        bronnen: [EV_6OKT, KEUZE_2025]
      },

      /* ----- Delta Energie ----- */
      {
        id: 'delta-dynamisch', leverancier: 'Delta Energie', contractvorm: 'dynamisch', geldig: 'nu, eigen pagina',
        vergoeding_tekst: 'afhankelijk van de marktprijs; geen bedrag per kWh genoemd',
        kosten_2026_ct_kwh: 0, kosten_tekst: 'geen terugleverkosten',
        status: 'geverifieerd', status_bron: null,
        bronnen: [bron('Delta Energie, dynamisch energiecontract met zonnepanelen', 'https://deltaenergie.nl/stroom-gas/dynamisch-energiecontract/zonnepanelen/')]
      },
      vastKeuze('delta-vast', 'Delta Energie', 7.63, 7.37, {
        opmerking: 'Voor 2026 rekent Delta een staffel per jaar (keuze.nl: 2.000 tot 2.199 kWh € 298,30); het niveau bij 2.500 kWh is niet gevonden. Zoekfragmenten uit een Delta-PDF van 21-7-2026 noemen voor 2027 6,663 ct vergoeding en 6,413 ct kosten (1 jaar) en 6,281 en 6,031 ct (3 jaar); die hebben wij niet kunnen controleren en daarom niet overgenomen.'
      }),

      /* ----- Eneco ----- */
      {
        id: 'eneco-vast', leverancier: 'Eneco', contractvorm: '1 jaar vast', geldig: '2026; tarief 2027 vanaf 1 januari 2027',
        vergoeding_2026_ct_kwh: 14.3249, vergoeding_2027_ct_kwh: 8.394, vergoeding_btw: 'excl',
        kosten_2027_ct_kwh: 4.528, kosten_btw: 'incl',
        status: 'secundair', status_bron: 'keuze.nl, 6-10-2026',
        opmerking: 'Eneco noemt op de eigen site geen tarief. Het rekenvoorbeeld op eneco.nl (peildatum 25-2-2026) is alleen illustratief: 3,865 ct kosten incl. btw en 5,058 ct vergoeding excl. btw; dat is geen tarief en staat niet in de kolommen. energievergelijk.nl (1-10-2026) noemt 3,85 ct netto.',
        bronnen: [KEUZE, EV_OKT, bron('Eneco, rekenvoorbeelden einde salderen (illustratief)', 'https://eneco.nl/klantenservice/einde-salderen/rekenvoorbeelden/')]
      },

      /* ----- Energiedirect ----- */
      {
        id: 'energiedirect-2026', leverancier: 'Energiedirect', contractvorm: 'vast en variabel, tarief 2026', geldig: 'vergoeding sinds 1 juli 2025; staffel 2026',
        vergoeding_2026_ct_kwh: 15.0, vergoeding_btw: 'excl',
        kosten_2026_ct_kwh: staffel(0.84574 * 365, 2500), kosten_btw: 'incl',
        kosten_staffel: true, kosten_staffel_tekst: 'staffel per dag naar jaarlijkse teruglevering; 2.251 tot 2.500 kWh: € 0,84574 per dag',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Representatieve waarde: € 0,84574 per dag keer 365 is € 308,70 per jaar; gedeeld door 2.500 kWh is dat 12,35 ct per kWh. Zelfde staffel als bij Essent. Een bedrag per kWh voor 2027 is niet gevonden.',
        bronnen: [bron('Energiedirect, terugleveren en salderen', 'https://energiedirect.nl/klantenservice/contract/terugleveren-en-salderen'), bron('Energiedirect, terugleverkosten', 'https://energiedirect.nl/klantenservice/contract/terugleverkosten')]
      },
      vastKeuze('energiedirect-vast', 'Energiedirect', 7.79, 6.79, { opmerking: 'energievergelijk.nl (6-10-2026) noemt 7,8 ct vergoeding en 6,8 ct kosten.', bronnen: [KEUZE, EV_6OKT] }),

      /* ----- Energie VanOns ----- */
      {
        id: 'energie-vanons', leverancier: 'Energie VanOns', contractvorm: 'onbekend',
        vergoeding_tekst: 'niet gevonden', kosten_tekst: 'niet gevonden',
        status: 'niet_gevonden', status_bron: null, geldig: null,
        opmerking: 'Geen bedrag bij de leverancier of bij een vergelijkingssite gevonden.',
        bronnen: []
      },

      /* ----- Engie ----- */
      {
        id: 'engie-dynamisch', leverancier: 'Engie', contractvorm: 'dynamisch', geldig: 'nu, eigen pagina',
        vergoeding_tekst: 'uurprijs; verkoopvergoeding van 1,9 ct per kWh op de netto teruglevering',
        kosten_2026_ct_kwh: 0, kosten_tekst: 'geen terugleverkosten',
        status: 'geverifieerd', status_bron: null,
        bronnen: [bron('Engie, dynamisch energiecontract', 'https://engie.nl/energie/dynamisch-energiecontract')]
      },
      vastKeuze('engie-vast', 'Engie', 16.08, 15.19, {
        opmerking: 'Engie noemt voor vast en variabel geen bedragen; de pagina over het einde van salderen geeft alleen een indicatie van 12 ct vergoeding en 11 ct kosten incl. btw. Dat is geen tarief en staat niet in de kolommen.',
        bronnen: [KEUZE, bron('Engie, afschaffing salderingsregeling (indicatief)', 'https://engie.nl/afschaffing-salderingsregeling')]
      }),

      /* ----- Essent ----- */
      {
        id: 'essent-2026', leverancier: 'Essent', contractvorm: 'vast en variabel, tarief 2026', geldig: 'vergoeding 1 juli 2025 tot 31 december 2026; staffel per 1 januari 2025',
        vergoeding_2026_ct_kwh: 15.0, vergoeding_btw: 'excl',
        kosten_2026_ct_kwh: staffel(0.84574 * 365, 2500), kosten_btw: 'incl',
        kosten_staffel: true, kosten_staffel_tekst: 'staffel per dag naar jaarlijkse teruglevering; 2.251 tot 2.500 kWh: € 0,84574 per dag',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Representatieve waarde: € 0,84574 per dag keer 365 is € 308,70 per jaar; gedeeld door 2.500 kWh is dat 12,35 ct per kWh. Voor 2027 rekent Essent per kWh; die bedragen zijn niet gevonden. Het nieuwsbericht van 23-5-2025 meldt de vergoeding van 15,0 ct.',
        bronnen: [bron('Essent, terugleveren en salderen', 'https://essent.nl/klantenservice/contract/terugleveren-en-salderen'), bron('Essent, terugleverkosten', 'https://essent.nl/zonnepanelen/kosten/terugleverkosten')]
      },
      vastKeuze('essent-vast', 'Essent', 8.68, 5.60, { opmerking: 'energievergelijk.nl (1-10-2026) noemt ook 3,08 ct netto.', bronnen: [KEUZE, EV_OKT] }),

      /* ----- Frank Energie ----- */
      {
        id: 'frank-dynamisch', leverancier: 'Frank Energie', contractvorm: 'dynamisch', geldig: 'kennisbankpagina van 17 juni 2026',
        vergoeding_tekst: 'marktprijs plus inkoopvergoeding van 1,82 ct (btw onbekend); ongeveer 15% terugleverbonus overdag, alleen met sturing', vergoeding_btw: 'onbekend',
        kosten_2026_ct_kwh: 0, kosten_tekst: 'geen terugleverkosten',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Vergelijkingssites noemden eerder 1,3 ct terugleverkosten voor 2026; de eigen pagina van Frank noemt geen kosten.',
        bronnen: [bron('Frank Energie, kennisbank terugleververgoeding', 'https://frankenergie.nl/nl/kennisbank/zonnepanelen/terugleververgoeding', '2026-06-17')]
      },

      /* ----- GewoonEnergie (zelfde bedrijf als Innova Energie) ----- */
      {
        id: 'gewoonenergie-variabel', leverancier: 'GewoonEnergie', contractvorm: 'variabel, tariefblad per 1 november 2026', geldig: 'vanaf 1 november 2026',
        vergoeding_2026_ct_kwh: 5.0, vergoeding_btw: 'excl',
        kosten_2026_ct_kwh: 11.0, kosten_btw: 'excl',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Zelfde tariefblad als Innova Energie (zelfde KvK-nummer 27374930). Incl. btw: vergoeding 6,05 ct, kosten 13,31 ct, op alle invoeding. Voor 2027 noemt het blad 50% van het normaaltarief, zonder bedrag.',
        bronnen: [bron('GewoonEnergie, tariefblad variabel 1-11-2026', 'https://gewoonenergie.nl/wp-content/uploads/2026/09/Tariefblad-Var-Var-01-11-2026-Gewoon-Energie.pdf')]
      },
      {
        id: 'gewoonenergie-vast', leverancier: 'GewoonEnergie', contractvorm: '1 jaar vast, tarief 2027', geldig: 'vanaf 1 januari 2027',
        vergoeding_2027_ct_kwh: 5.90, vergoeding_btw: 'onbekend',
        kosten_2027_ct_kwh: 11.50, kosten_btw: 'onbekend',
        status: 'secundair', status_bron: 'keuze.nl, 11-12-2025',
        opmerking: 'Ouder dan zes maanden; geen recenter bedrag gevonden. energievergelijk.nl (24-2-2026) noemde min 7,43 ct netto.',
        bronnen: [KEUZE_2025]
      },

      /* ----- Greenchoice ----- */
      {
        id: 'greenchoice-modelcontract-vast', leverancier: 'Greenchoice', contractvorm: 'modelcontract 1 jaar vast', geldig: 'modelcontract per 1 april 2026; bedragen tot en vanaf 1 januari 2027',
        vergoeding_2026_ct_kwh: 12.514, vergoeding_2027_ct_kwh: 10.007, vergoeding_btw: 'excl',
        kosten_2026_ct_kwh: 12.264, kosten_2027_ct_kwh: 9.982, kosten_btw: 'excl',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Het modelcontract noemt beide basissen; hier staan de bedragen excl. btw zodat vergoeding en kosten op dezelfde basis staan. Incl. btw: tot 1-1-2027 vergoeding 15,142 en kosten 14,839 ct, daarna vergoeding 12,108 en kosten 12,078 ct.',
        bronnen: [bron('Greenchoice, modelcontract vast per 1-4-2026', 'https://media.greenchoice.nl/media/sdjbeycx/tarief-modelcontact-vast-april-2026.pdf')]
      },
      {
        id: 'greenchoice-modelcontract-variabel', leverancier: 'Greenchoice', contractvorm: 'modelcontract variabel', geldig: 'modelcontract per 1 april 2026',
        vergoeding_2026_ct_kwh: 11.436, vergoeding_btw: 'excl',
        kosten_2026_ct_kwh: 11.186, kosten_btw: 'excl',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Incl. btw: vergoeding 13,838 ct, kosten 13,535 ct. Een bedrag voor 2027 staat er niet bij.',
        bronnen: [bron('Greenchoice, modelcontract variabel per 1-4-2026', 'https://media.greenchoice.nl/media/sdjbeycx/tarief-modelcontact-vast-april-2026.pdf')]
      },
      {
        id: 'greenchoice-vast', leverancier: 'Greenchoice', contractvorm: 'regulier 1 jaar vast', geldig: 'vanaf 1 januari 2027',
        vergoeding_2027_ct_kwh: 7.877, vergoeding_btw: 'excl',
        kosten_tekst: 'niet los vermeld', netto_tekst: '0,25 ct volgens keuze.nl',
        status: 'secundair', status_bron: 'keuze.nl, 6-10-2026',
        opmerking: 'Het reguliere aanbod staat niet bij Greenchoice zelf; alleen het modelcontract is gevonden (zie hierboven).',
        bronnen: [KEUZE_TLV]
      },

      /* ----- Innova Energie ----- */
      {
        id: 'innova-variabel', leverancier: 'Innova Energie', contractvorm: 'variabel, tariefblad per 1 november 2026', geldig: 'vanaf 1 november 2026',
        vergoeding_2026_ct_kwh: 5.0, vergoeding_btw: 'excl',
        kosten_2026_ct_kwh: 11.0, kosten_btw: 'excl',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Incl. btw: vergoeding 6,05 ct, kosten 13,31 ct, op alle invoeding. Voor 2027 noemt het blad 50% van het normaaltarief, zonder bedrag; dat staat daarom niet als getal in de tabel.',
        bronnen: [bron('Innova Energie, tariefblad variabel 1-11-2026', 'https://innovaenergie.nl/wp-content/uploads/2026/09/Tariefblad-Var-Var-01-11-2026-Innova-Energie.pdf')]
      },
      {
        id: 'innova-modelcontract-vast', leverancier: 'Innova Energie', contractvorm: 'modelcontract vast', geldig: 'modelcontract per 6 oktober 2026; kosten tot en vanaf 1 januari 2027',
        vergoeding_2026_ct_kwh: 10.1, vergoeding_2027_ct_kwh: 10.1, vergoeding_btw: 'excl',
        kosten_2026_ct_kwh: 11.0, kosten_2027_ct_kwh: 8.124, kosten_btw: 'excl',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Het modelcontract noemt één vergoeding van 10,1 ct, zonder onderscheid per jaar; wij nemen die voor beide jaren. Kosten vanaf 2027 incl. btw: 9,83 ct. keuze.nl (6-10-2026) noemt voor Innova 8,60 ct vergoeding en 8,33 ct kosten; de eigen bedragen gaan voor.',
        bronnen: [bron('Innova Energie, modelcontract vast per 6-10-2026', 'https://innovaenergie.nl/')]
      },

      /* ----- Mega ----- */
      {
        id: 'mega', leverancier: 'Mega', contractvorm: 'onbekend',
        vergoeding_tekst: 'niet gevonden', kosten_tekst: 'niet gevonden',
        status: 'niet_gevonden', status_bron: null, geldig: null,
        opmerking: 'Geen bedrag bij de leverancier gevonden. De vergelijkingssites spreken elkaar tegen: keuze.nl (27-9-2026) noemt 15,971 ct vergoeding, keuze.nl (6-10-2026) 22,41 ct vergoeding en 18,31 ct kosten voor 2027, en energievergelijk.nl (24-2-2026) min 2,12 ct netto. Daarom geen bedrag overgenomen.',
        bronnen: [KEUZE_TLV]
      },

      /* ----- NextEnergy ----- */
      {
        id: 'nextenergy-dynamisch', leverancier: 'NextEnergy', contractvorm: 'dynamisch', geldig: 'nu, eigen pagina',
        vergoeding_tekst: 'beursprijs minus inkoopvergoeding van 2,1 ct incl. btw; plus 50% zonnebonus tussen 06 en 22 uur, tot 6.000 kWh per jaar', vergoeding_btw: 'incl',
        kosten_tekst: 'geen vaste kosten voor teruglevering; wel € 5,99 per maand vast',
        status: 'geverifieerd', status_bron: null,
        bronnen: [bron('NextEnergy, dynamische energie', 'https://nextenergy.nl/dynamische-energie'), bron('NextEnergy, zonnebonus', 'https://nextenergy.nl/zonnebonus')]
      },
      {
        id: 'nextenergy-modelcontract-vast', leverancier: 'NextEnergy', contractvorm: 'modelcontract 1 jaar vast', geldig: 'per 1 januari 2027',
        vergoeding_2027_ct_kwh: 13.04, vergoeding_btw: 'onbekend',
        kosten_2027_ct_kwh: 12.54, kosten_btw: 'onbekend',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Het modelcontract noemt de btw-basis niet bij deze bedragen.',
        bronnen: [bron('NextEnergy, modelcontract', 'https://nextenergy.nl/meer-info/modelcontract')]
      },

      /* ----- OM | Nieuwe Energie (bedragen incl. btw, tarievenbladen oktober en november 2026) ----- */
      {
        id: 'om-flex', leverancier: 'OM | Nieuwe Energie', contractvorm: 'Flex (variabel)', geldig: 'tarievenblad november 2026',
        vergoeding_2026_ct_kwh: 6.4861, vergoeding_btw: 'incl',
        kosten_tekst: 'staffel; bedrag niet gevonden', kosten_btw: 'incl',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Een bedrag voor 2027 staat niet op het blad.',
        bronnen: [bron('OM | Nieuwe Energie, tarievenblad Flex (PDF, november 2026)', 'https://samenom.nl/')]
      },
      {
        id: 'om-vast-1', leverancier: 'OM | Nieuwe Energie', contractvorm: '1 jaar vast', geldig: 'tarievenblad oktober 2026; kosten september 2026',
        vergoeding_2026_ct_kwh: 9.4093, vergoeding_btw: 'incl',
        kosten_2026_ct_kwh: 7.2832, kosten_btw: 'incl',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Het blad noemt geen aparte bedragen voor 2027.',
        bronnen: [bron('OM | Nieuwe Energie, tarievenblad 1 jaar vast (PDF, oktober 2026)', 'https://samenom.nl/wp-content/uploads/tarieven/202610-consument-vast-1.pdf')]
      },
      {
        id: 'om-vast-3', leverancier: 'OM | Nieuwe Energie', contractvorm: '3 jaar vast', geldig: 'tarievenblad oktober 2026',
        vergoeding_2026_ct_kwh: 7.452, vergoeding_btw: 'incl',
        kosten_2026_ct_kwh: 5.1652, kosten_btw: 'incl',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Het blad noemt geen aparte bedragen voor 2027.',
        bronnen: [bron('OM | Nieuwe Energie, tarievenblad 3 jaar vast (PDF, oktober 2026)', 'https://samenom.nl/')]
      },
      {
        id: 'om-modelcontract-variabel', leverancier: 'OM | Nieuwe Energie', contractvorm: 'modelcontract variabel', geldig: 'modelcontract, periode niet vermeld',
        vergoeding_2026_ct_kwh: 9.68, vergoeding_btw: 'incl',
        kosten_2026_ct_kwh: 14.2, kosten_btw: 'incl',
        status: 'geverifieerd', status_bron: null,
        bronnen: [bron('OM | Nieuwe Energie, modelcontract variabel (PDF)', 'https://samenom.nl/')]
      },

      /* ----- Oxxio ----- */
      {
        id: 'oxxio-vast', leverancier: 'Oxxio', contractvorm: 'vast', geldig: '2026; tarief 2027 vanaf 1 januari 2027',
        vergoeding_2026_ct_kwh: 15.156, vergoeding_2027_ct_kwh: 5.99, vergoeding_btw: 'onbekend',
        kosten_2026_ct_kwh: 14.2, kosten_2027_ct_kwh: 5.18, kosten_btw: 'onbekend',
        status: 'secundair', status_bron: 'keuze.nl, 6-10-2026 (2026) en energievergelijk.nl, 13-5-2026 (2027)',
        opmerking: 'Oxxio noemt op de eigen site geen bedragen. keuze.nl (2-2-2026) noemde voor 2027 5,44 ct vergoeding en 3,87 ct kosten; wij nemen de recentere bron van 13-5-2026.',
        bronnen: [KEUZE, EV_MEI, bron('Oxxio, terugleverkosten', 'https://oxxio.nl/klantenservice/terugleverkosten/')]
      },

      /* ----- Powerpeers ----- */
      {
        id: 'powerpeers-variabel-2026', leverancier: 'Powerpeers', contractvorm: 'variabel (maandelijks wisselend), tarief 2026', geldig: 'staffel versie 24 december 2025',
        vergoeding_2026_ct_kwh: 18.0, vergoeding_btw: '0%',
        kosten_2026_ct_kwh: staffel(295, 2500), kosten_btw: 'incl',
        kosten_staffel: true, kosten_staffel_tekst: 'staffel per jaar naar jaarlijkse teruglevering; 2.250 tot 2.499 kWh: € 295 per jaar',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Representatieve waarde: € 295 per jaar gedeeld door 2.500 kWh is 11,80 ct per kWh (2.500 kWh valt net buiten de staffel van 2.250 tot 2.499 kWh). Een bedrag per kWh voor 2027 is niet gevonden.',
        bronnen: [bron('Powerpeers, tarieven maandelijks wisselend', 'https://powerpeers.nl/energietarieven-maandelijks-wisselend/'), bron('Powerpeers, vaste terugleverkosten (PDF, versie 24-12-2025)', 'https://powerpeers.eu/assets/website/uploads/Powerpeers-vaste-terugleverkosten.pdf')]
      },
      {
        id: 'powerpeers-dynamisch', leverancier: 'Powerpeers', contractvorm: 'dynamisch', geldig: 'nu, eigen pagina',
        vergoeding_tekst: 'kwartierprijs minus 1,0 ct',
        kosten_tekst: 'niet genoemd',
        status: 'geverifieerd', status_bron: null,
        bronnen: [bron('Powerpeers, energieprijzen dynamisch energiecontract', 'https://powerpeers.nl/dynamische-energie/energieprijzen-dynamisch-energiecontract/')]
      },
      vastKeuze('powerpeers-vast', 'Powerpeers', 9.03, 6.22, { opmerking: 'overstappen.nl (6-10-2026) noemt dezelfde vergoeding van 9,03 ct voor 1 jaar vast.', bronnen: [KEUZE, OVERSTAPPEN] }),

      /* ----- Pure Energie ----- */
      {
        id: 'pure-modelcontract-vast', leverancier: 'Pure Energie', contractvorm: 'modelcontract 1 jaar vast', geldig: 'modelcontract per 24 september 2026; kosten tot en vanaf 1 januari 2027',
        vergoeding_2026_ct_kwh: 9.5, vergoeding_2027_ct_kwh: 9.5, vergoeding_btw: '0%',
        kosten_2026_ct_kwh: 14.9, kosten_2027_ct_kwh: 9.25, kosten_btw: 'incl',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Vergoeding van 9,5 ct zonder btw, geldig tot en vanaf 1-1-2027; kosten 14,9 ct tot 1-1-2027 en 9,25 ct daarna, incl. btw. keuze.nl (6-10-2026) noemt voor 2027 dezelfde 9,50 en 9,25 ct.',
        bronnen: [bron('Pure Energie, modelcontract consument 24-9-2026', 'https://pure-energie.nl/assets/Modelcontract-consument-24-9-2026.pdf')]
      },
      {
        id: 'pure-modelcontract-variabel', leverancier: 'Pure Energie', contractvorm: 'modelcontract variabel', geldig: 'modelcontract per 21 september 2026',
        vergoeding_2026_ct_kwh: 11.0, vergoeding_btw: '0%',
        kosten_2026_ct_kwh: 17.5, kosten_btw: 'incl',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Een bedrag voor 2027 staat er niet bij.',
        bronnen: [bron('Pure Energie, modelcontract variabel per 21-9-2026', 'https://pure-energie.nl/')]
      },
      {
        id: 'pure-dynamisch', leverancier: 'Pure Energie', contractvorm: 'dynamisch', geldig: 'volgens gaslicht.com, 29-9-2026',
        vergoeding_tekst: 'beursprijs excl. btw minus verkoopvergoeding; gaslicht.com noemt 1,80 ct', vergoeding_btw: 'excl',
        kosten_tekst: 'geen terugleverbijdrage',
        status: 'secundair', status_bron: 'gaslicht.com, 29-9-2026',
        opmerking: 'Het bedrag van de verkoopvergoeding is niet bij Pure Energie zelf gevonden.',
        bronnen: [GASLICHT]
      },

      /* ----- Tibber ----- */
      {
        id: 'tibber-dynamisch', leverancier: 'Tibber', contractvorm: 'dynamisch', geldig: 'per 1 september 2026',
        vergoeding_tekst: 'beursprijs per kwartier minus verkoopvergoeding van 1,80 ct incl. btw', vergoeding_btw: 'incl',
        kosten_2026_ct_kwh: 0, kosten_tekst: 'geen terugleverkosten',
        status: 'geverifieerd', status_bron: null,
        bronnen: [bron('Tibber, energiecontract', 'https://tibber.com/nl/energiecontract')]
      },
      {
        id: 'tibber-modelcontract-vast', leverancier: 'Tibber', contractvorm: 'modelcontract 1 jaar vast', geldig: 'modelcontract per 1 april 2026',
        vergoeding_2026_ct_kwh: 12.0, vergoeding_btw: 'incl',
        kosten_2026_ct_kwh: 10.0, kosten_btw: 'incl',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Het modelcontract noemt in de kop de bedragen inclusief energiebelasting en btw. Een bedrag voor 2027 staat er niet bij.',
        bronnen: [bron('Tibber, modelcontract', 'https://tibber.com/nl/modelcontract')]
      },
      {
        id: 'tibber-modelcontract-variabel', leverancier: 'Tibber', contractvorm: 'modelcontract variabel', geldig: 'modelcontract per 1 april 2026',
        vergoeding_2026_ct_kwh: 1.0, vergoeding_btw: 'incl',
        kosten_tekst: 'niet genoemd',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Het modelcontract noemt in de kop de bedragen inclusief energiebelasting en btw.',
        bronnen: [bron('Tibber, modelcontract', 'https://tibber.com/nl/modelcontract')]
      },

      /* ----- UnitedConsumers ----- */
      vastKeuze('unitedconsumers-vast', 'UnitedConsumers', 16.084, 15.4, { opmerking: 'UnitedConsumers noemt op de eigen site geen bedragen. energievergelijk.nl noemt voor 2027 15,5 ct vergoeding en 15,0 ct kosten.', bronnen: [KEUZE, EV_6OKT] }),

      /* ----- Vandebron ----- */
      {
        id: 'vandebron-2026-staffel', leverancier: 'Vandebron', contractvorm: 'vast 1 jaar, contracten tot en met 2026 (schaal 10)', geldig: 'tariefblad PV250520',
        vergoeding_tekst: 'niet in het eigen tariefblad gevonden',
        kosten_2026_ct_kwh: staffel(356, 2500), kosten_btw: 'incl',
        kosten_staffel: true, kosten_staffel_tekst: 'staffel per dag naar jaarlijkse teruglevering; schaal 10, 2.250 tot 2.500 kWh: € 0,97536 per dag',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Representatieve waarde: € 0,97536 per dag keer 365 is ongeveer € 356 per jaar; gedeeld door 2.500 kWh is dat 14,24 ct per kWh. Voor nieuwe contracten per kWh is geen bedrag gevonden. De leveringsvoorwaarden (PV260722) zeggen dat de vergoeding vanaf 2027 minimaal het wettelijke minimum is en dat de terugleverkosten niet volledig verdwijnen.',
        bronnen: [bron('Vandebron, tariefblad PV250520 (eigen PDF, gevonden via gaslicht.com)', 'https://www.gaslicht.com/energiebesparing/terugleveren')]
      },
      vastKeuze('vandebron-vast', 'Vandebron', 7.76, 7.56, {
        vergoeding_2026_ct_kwh: 16.0,
        status_bron: 'keuze.nl, 6-10-2026 (2027) en gaslicht.com, 6-10-2026 (vergoeding 2026)',
        opmerking: 'De vergoeding van 16,0 ct excl. btw voor 2026 komt van gaslicht.com.',
        bronnen: [KEUZE, GASLICHT]
      }),
      {
        id: 'vandebron-dynamisch', leverancier: 'Vandebron', contractvorm: 'dynamisch', geldig: 'volgens gaslicht.com, 29-9-2026',
        vergoeding_tekst: 'marktprijs minus verkoopvergoeding; gaslicht.com noemt 2,21 ct',
        kosten_tekst: 'niet genoemd',
        status: 'secundair', status_bron: 'gaslicht.com, 29-9-2026',
        opmerking: 'Het bedrag van de verkoopvergoeding is niet bij Vandebron zelf gevonden.',
        bronnen: [GASLICHT]
      },

      /* ----- Vattenfall ----- */
      {
        id: 'vattenfall-2026', leverancier: 'Vattenfall', contractvorm: 'vast en variabel, vaste terugleverkosten 2026', geldig: 'vanaf 1 mei 2026, versie 16 maart 2026',
        vergoeding_tekst: 'niet op vattenfall.nl gevonden; keuze.nl noemt voor 2026 12,4 ct excl. btw (zie de regel hieronder)',
        kosten_2026_ct_kwh: staffel(293, 2500), kosten_btw: 'incl',
        kosten_staffel: true, kosten_staffel_tekst: 'staffel per jaar naar jaarlijkse teruglevering; 2.250 tot 2.500 kWh: € 293 per jaar',
        status: 'geverifieerd', status_bron: null,
        opmerking: 'Representatieve waarde: € 293 per jaar gedeeld door 2.500 kWh is 11,72 ct per kWh. Voor 2027 rekent Vattenfall volgens de productvoorwaarden (6124_010, 20-2-2026) per kWh; de bedragen staan daar niet in.',
        bronnen: [bron('Vattenfall, Vaste terugleverkosten vanaf 1 mei 2026 (PDF)', 'https://vattenfall.nl/media/_0vattenfall/voorwaarden/algemene-tarieven/vaste-terugleverkosten-18145')]
      },
      vastKeuze('vattenfall-vast', 'Vattenfall', 8.40, 4.89, {
        vergoeding_2026_ct_kwh: 12.4,
        status_bron: 'keuze.nl, 6-10-2026',
        opmerking: 'energievergelijk.nl (1-10-2026) noemt 3,44 ct netto, keuze.nl 3,51 ct. Vattenfall rekent volgens zijn productvoorwaarden vanaf 1-1-2027 terugleverkosten per kWh; de bedragen staan in het aanbod, niet in de voorwaarden.',
        bronnen: [KEUZE, EV_OKT, bron('Vattenfall, productvoorwaarden Groen met ZonBonus (20-2-2026)', 'https://www.vattenfall.nl/media/_0vattenfall/voorwaarden/productvoorwaarden/2026_08_01/6176_008-pvw-groen-met-zonbonus.pdf')]
      }),

      /* ----- Zonneplan ----- */
      {
        id: 'zonneplan-dynamisch', leverancier: 'Zonneplan Energie', contractvorm: 'dynamisch', geldig: 'pagina van 22 september 2026; 2027 zelfde structuur',
        vergoeding_tekst: 'kwartierprijs plus 2,0 ct plus 10% zonnebonus, incl. btw; tot 7.500 kWh per jaar, niet op invoeding uit een batterij', vergoeding_btw: 'incl',
        kosten_2026_ct_kwh: 0, kosten_2027_ct_kwh: 0, kosten_tekst: 'geen terugleverkosten',
        status: 'geverifieerd', status_bron: null,
        bronnen: [bron('Zonneplan, terugleververgoeding bij zonnepanelen', 'https://zonneplan.nl/energie/terugleververgoeding-bij-zonnepanelen', '2026-09-22')]
      }
    ],

    wijzigingslog: [
      { versie: '2026.10.2', datum: D, tekst: 'Bedragen bij de leveranciers zelf gecontroleerd. 30 regels bij 18 leveranciers komen van de eigen site, een eigen tariefblad of een modelcontract; de bedragen staan per jaar (2026 en 2027) met de btw-basis per bedrag. Staffels staan als representatieve waarde bij 2.500 kWh. Mega staat nu als niet gevonden, omdat de vergelijkingssites elkaar tegenspreken.' },
      { versie: '2026.10.1', datum: D, tekst: 'Eerste versie: 25 leveranciers en het wettelijke minimum. Eén rij (Zonneplan) bij de leverancier zelf gecontroleerd; de overige bedragen komen van keuze.nl en energievergelijk.nl, met datum.' }
    ]
  };

  /* ---------- Afgeleide velden ---------- */
  function afronden(n) { return Math.round(n * 10000) / 10000; }
  function isGetal(n) { return typeof n === 'number'; }
  /* Meldt als vergoeding en kosten niet op dezelfde btw-basis staan. */
  function nettoBasis(vb, kb) {
    if (!vb || !kb || vb === 'onbekend' || kb === 'onbekend') return 'btw-basis onduidelijk';
    if (vb === kb || vb === '0%' || kb === '0%') return null;
    if (vb === 'excl' && kb === 'incl') return 'vergoeding excl. btw, kosten incl. btw';
    return 'vergoeding incl. btw, kosten excl. btw';
  }

  data.rijen.forEach(function (r) {
    r.peildatum = r.peildatum || data.peildatum;
    r.versie = r.versie || data.versie;
    r.kosten_staffel = !!r.kosten_staffel;
    ['vergoeding_2026_ct_kwh', 'vergoeding_2027_ct_kwh', 'kosten_2026_ct_kwh', 'kosten_2027_ct_kwh'].forEach(function (k) {
      if (!isGetal(r[k])) r[k] = null;
    });
    r.netto_2026_ct_kwh = (isGetal(r.vergoeding_2026_ct_kwh) && isGetal(r.kosten_2026_ct_kwh)) ? afronden(r.vergoeding_2026_ct_kwh - r.kosten_2026_ct_kwh) : null;
    r.netto_2027_ct_kwh = (isGetal(r.vergoeding_2027_ct_kwh) && isGetal(r.kosten_2027_ct_kwh)) ? afronden(r.vergoeding_2027_ct_kwh - r.kosten_2027_ct_kwh) : null;
    r.netto_basis = (r.netto_2026_ct_kwh !== null || r.netto_2027_ct_kwh !== null) ? nettoBasis(r.vergoeding_btw, r.kosten_btw) : null;
    /* Kiesbaar in de rekentool: bedragen per kWh voor 2027, van de leverancier of van een vergelijkingssite. */
    r.kiesbaar = (r.status === 'geverifieerd' || r.status === 'secundair') && r.netto_2027_ct_kwh !== null;
    /* Kosten 2026 gaan alleen mee als ze per kWh bekend zijn; een staffel geldt alleen bij 2.500 kWh. */
    r.kosten_2026_bruikbaar = r.kiesbaar && isGetal(r.kosten_2026_ct_kwh) && !r.kosten_staffel;
  });

  /* Tellingen voor de pagina: per regel en per leverancier (de beste status van de leverancier telt). */
  (function () {
    var rang = { geverifieerd: 3, secundair: 2, niet_gevonden: 1 };
    var regels = { geverifieerd: 0, secundair: 0, niet_gevonden: 0 };
    var perLev = {};
    var kiesGev = 0, kiesSec = 0;
    data.rijen.forEach(function (r) {
      if (r.status === 'wet') return;
      regels[r.status]++;
      if (!perLev[r.leverancier] || rang[r.status] > rang[perLev[r.leverancier]]) perLev[r.leverancier] = r.status;
      if (r.kiesbaar) { if (r.status === 'geverifieerd') kiesGev++; else kiesSec++; }
    });
    var lev = { geverifieerd: 0, secundair: 0, niet_gevonden: 0 };
    Object.keys(perLev).forEach(function (n) { lev[perLev[n]]++; });
    data.telling = {
      leveranciers: Object.keys(perLev).length, regels: regels, leveranciers_per_status: lev,
      kiesbaar_geverifieerd: kiesGev, kiesbaar_secundair: kiesSec
    };
  })();

  /* ---------- HTML (pagina en tools/leveranciers-tabel.mjs) ---------- */
  var STATUS = {
    geverifieerd: 'geverifieerd bij leverancier',
    secundair: 'alleen via vergelijkingssite',
    niet_gevonden: 'niet gevonden',
    wet: 'wettelijke regel'
  };
  var BTW = { excl: 'excl.', incl: 'incl.', '0%': '0% btw', onbekend: 'onbekend' };
  var MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  /* Twee decimalen, meer als de bron meer geeft (12,514 blijft 12,514). */
  function ct(n) {
    return (n < 0 ? '&minus;' : '') + Math.abs(n).toFixed(4).replace(/0{1,2}$/, '').replace('.', ',') + '&nbsp;ct';
  }
  function datum(iso) {
    var d = String(iso || '').split('-');
    return d.length === 3 ? parseInt(d[2], 10) + ' ' + MAANDEN[parseInt(d[1], 10) - 1] + ' ' + d[0] : esc(iso);
  }
  function klein(t) { return t ? '<br><small>' + esc(t) + '</small>' : ''; }

  /* Eén regel per jaar in een cel: "2026 15,00 ct". */
  function jaarRegel(jaar, n, staffel) {
    if (n === 0) return '<span class="lv-jr"><b>' + jaar + '</b> geen</span>';
    if (isGetal(n)) return '<span class="lv-jr"><b>' + jaar + '</b> ' + (staffel ? 'ca. ' : '') + ct(n) + '</span>';
    return '<span class="lv-jr lv-leeg"><b>' + jaar + '</b> niet gevonden</span>';
  }
  function jaarCel(label, n26, n27, tekst, staffelTekst, staffel) {
    var heeft = isGetal(n26) || isGetal(n27);
    var inhoud;
    if (!heeft) inhoud = '<span class="lv-jr lv-leeg">' + esc(tekst || 'niet gevonden') + '</span>';
    else inhoud = jaarRegel('2026', n26, staffel) + jaarRegel('2027', n27, false) + klein(staffelTekst || tekst);
    return '<td data-label="' + label + '"' + (heeft ? ' class="num"' : '') + '>' + inhoud + '</td>';
  }

  function btwCel(r) {
    var delen = [];
    var hv = isGetal(r.vergoeding_2026_ct_kwh) || isGetal(r.vergoeding_2027_ct_kwh) || r.vergoeding_btw;
    var hk = isGetal(r.kosten_2026_ct_kwh) || isGetal(r.kosten_2027_ct_kwh) || r.kosten_btw;
    if (hv && r.vergoeding_btw) delen.push('vergoeding ' + (BTW[r.vergoeding_btw] || esc(r.vergoeding_btw)).replace(/ /g, '&nbsp;'));
    if (hk && r.kosten_btw) delen.push('kosten ' + (BTW[r.kosten_btw] || esc(r.kosten_btw)).replace(/ /g, '&nbsp;'));
    return '<td data-label="Btw">' + (delen.length ? delen.join('<br>') : 'n.v.t.') + '</td>';
  }

  function nettoCel(r) {
    var n27 = r.netto_2027_ct_kwh, n26 = r.netto_2026_ct_kwh;
    if (n27 === null && n26 === null) return '<td data-label="Netto per kWh">' + esc(r.netto_tekst || 'niet te berekenen') + '</td>';
    var h = '<td data-label="Netto per kWh" class="num">';
    h += n27 !== null ? '<span class="lv-jr"><b>2027</b> ' + ct(n27) + '</span>' : '<span class="lv-jr lv-leeg"><b>2027</b> niet te berekenen</span>';
    if (n26 !== null) h += '<span class="lv-jr"><b>2026</b> ' + (r.kosten_staffel ? 'ca. ' : '') + ct(n26) + '</span>';
    if (r.netto_basis) h += '<br><small>' + esc(r.netto_basis) + '</small>';
    return h + '</td>';
  }

  function rij(r) {
    var bronnen = (r.bronnen || []).map(function (b) {
      return '<a href="' + esc(b.url) + '" rel="nofollow noopener" target="_blank">' + esc(b.naam) + '</a>';
    }).join('; ');
    var status = STATUS[r.status] || esc(r.status);
    if (r.status === 'secundair' && r.status_bron) status += ' (' + esc(r.status_bron) + ')';
    var contract = esc(r.contractvorm) + (r.geldig ? '<br><small>' + esc(r.geldig) + '</small>' : '');
    return '<tr data-lv-id="' + esc(r.id) + '" data-status="' + esc(r.status) + '">'
      + '<th scope="row">' + esc(r.leverancier) + klein(r.opmerking) + '</th>'
      + '<td data-label="Contract">' + contract + '</td>'
      + jaarCel('Vergoeding', r.vergoeding_2026_ct_kwh, r.vergoeding_2027_ct_kwh, r.vergoeding_tekst, '', false)
      + jaarCel('Terugleverkosten', r.kosten_2026_ct_kwh, r.kosten_2027_ct_kwh, r.kosten_tekst, r.kosten_staffel ? r.kosten_staffel_tekst : r.kosten_tekst, r.kosten_staffel)
      + btwCel(r)
      + nettoCel(r)
      + '<td data-label="Status">' + status + '</td>'
      + '<td data-label="Bron">' + (bronnen || 'geen bron gevonden') + '<br><small>peildatum ' + datum(r.peildatum) + '</small></td>'
      + '</tr>';
  }

  function tabel(d) {
    return '<div class="prose-table-wrap lv-wrap">\n'
      + '<table class="prose-table lv-table">\n'
      + '<caption>Terugleververgoeding en terugleverkosten per leverancier, in cent per kWh, per jaar (2026 en 2027) en met de btw-basis per bedrag. ' + esc(d.toelichting) + ' Een staffel is omgerekend naar een waarde bij 2.500 kWh teruglevering per jaar (ca.). Dataset versie ' + esc(d.versie) + ', peildatum ' + datum(d.peildatum) + '.</caption>\n'
      + '<thead><tr><th scope="col">Leverancier</th><th scope="col">Contract</th><th scope="col">Vergoeding 2026 en 2027</th><th scope="col">Terugleverkosten 2026 en 2027</th><th scope="col">Btw</th><th scope="col">Netto per kWh</th><th scope="col">Status</th><th scope="col">Bron</th></tr></thead>\n'
      + '<tbody>\n' + d.rijen.map(rij).join('\n') + '\n</tbody>\n'
      + '</table>\n'
      + '</div>';
  }

  function kiesbaar(r) { return !!(r && r.kiesbaar); }
  function eur(ctKwh) { return String(Math.round(ctKwh * 100) / 10000); }

  function rekentoolLinks(d) {
    var items = d.rijen.filter(kiesbaar).map(function (r) {
      var href = '/rekentool?tv=' + eur(r.vergoeding_2027_ct_kwh) + '&amp;tk=' + eur(r.kosten_2027_ct_kwh) + '&amp;lv=' + esc(r.id) + '#aannames';
      return '  <li><a href="' + href + '">' + esc(r.leverancier) + ', ' + esc(r.contractvorm) + '</a>: netto ' + ct(r.netto_2027_ct_kwh) + ' per kWh'
        + (r.status === 'secundair' ? ' (bron: ' + esc(r.status_bron) + ')' : ' (bij de leverancier gecontroleerd)') + '</li>';
    });
    if (!items.length) return '<p>Er is op de peildatum geen leverancier met een vergoeding en terugleverkosten per kWh.</p>';
    return '<ul class="lv-links">\n' + items.join('\n') + '\n</ul>';
  }

  /* Telzin voor de inleiding van de tabel (tools/leveranciers-tabel.mjs zet hem in de pagina). */
  function telling(d) {
    var t = d.telling, l = t.leveranciers_per_status, g = t.regels;
    return '<p><strong>Stand op ' + datum(d.peildatum) + ':</strong> ' + t.leveranciers + ' leveranciers in ' + (g.geverifieerd + g.secundair + g.niet_gevonden) + ' regels, met een regel per contractvorm. '
      + 'Bij ' + l.geverifieerd + ' leveranciers hebben wij minstens één bedrag of formule op de eigen site, in een eigen tariefblad of in een modelcontract gezien (' + g.geverifieerd + ' regels). '
      + 'Bij ' + l.secundair + ' leveranciers komen alle bedragen van een vergelijkingssite, en bij ' + l.niet_gevonden + ' leveranciers vonden wij geen bedrag. '
      + 'In totaal staan ' + g.secundair + ' regels er alleen op gezag van een vergelijkingssite in, ook bij leveranciers waarvan wij andere contracten wel bij hen zelf zagen, en ' + g.niet_gevonden + ' regels zijn niet gevonden. '
      + 'Een vergoeding en terugleverkosten per kWh voor 2027 zagen wij bij de leverancier zelf voor ' + t.kiesbaar_geverifieerd + ' regels; de rekentool zet die bovenaan.</p>';
  }

  var html = { tabel: tabel, rekentoolLinks: rekentoolLinks, telling: telling, kiesbaar: kiesbaar, STATUS: STATUS };

  if (typeof window !== 'undefined') {
    window.SD_LEVERANCIERS = data;
    window.SD_LEVERANCIERS_HTML = html;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { data: data, html: html };
})();
