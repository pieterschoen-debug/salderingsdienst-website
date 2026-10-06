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
   - status: 'geverifieerd' (gezien op het domein van de leverancier),
     'secundair' (alleen via een vergelijkingssite, naam en datum in
     status_bron), 'niet_gevonden', of 'wet' (de wettelijke ondergrens).
   - netto_ct_kwh wordt hieronder berekend (vergoeding min kosten) en
     staat nooit met de hand in de data.
   - Kiesbaar in de rekentool: een rij met status 'geverifieerd' of
     'secundair' en een vergoeding én terugleverkosten per kWh. Een
     secundaire rij staat daar apart, met de vergelijkingssite erbij.
   - Na een wijziging: versie ophogen, een regel in wijzigingslog,
     en node tools/leveranciers-tabel.mjs --write.
   ============================================================ */
(function () {
  'use strict';

  var KEUZE = { naam: 'keuze.nl, terugleverkosten 2027', url: 'https://www.keuze.nl/energie/terugleverkosten', datum: '2026-10-06' };
  var KEUZE_TLV = { naam: 'keuze.nl, terugleververgoeding', url: 'https://www.keuze.nl/energie/terugleververgoeding', datum: '2026-10-06' };
  var KEUZE_2025 = { naam: 'keuze.nl, vergoedingen na 2027', url: 'https://www.keuze.nl/nieuws/salderen-na-2027-van-deze-leveranciers-is-de-vergoeding-bekend', datum: '2025-12-11' };
  var EV_OKT = { naam: 'energievergelijk.nl, 1 oktober 2026', url: 'https://www.energievergelijk.nl/nieuws/terugleververgoedingen-stijgen-in-2027-deze-5-leveranciers-betalen-het-meest', datum: '2026-10-01' };
  var EV_MEI = { naam: 'energievergelijk.nl, hoogste vergoeding 2027', url: 'https://www.energievergelijk.nl/nieuws/hier-ontvang-je-de-hoogste-terugleververgoeding-voor-zonne-energie-vanaf-2027', datum: '2026-05-13' };
  var VAST_KEUZE = '1 jaar vast, tarief 2027';

  function vastKeuze(id, naam, tlv, tlk, extra) {
    var r = {
      id: id, leverancier: naam, contractvorm: VAST_KEUZE,
      vergoeding_ct_kwh: tlv, vergoeding_btw: 'excl',
      terugleverkosten_ct_kwh: tlk, terugleverkosten_btw: 'incl',
      status: 'secundair', status_bron: 'keuze.nl, 6-10-2026',
      geldig: 'vanaf 1 januari 2027',
      aankondiging_2027: null,
      bronnen: [KEUZE]
    };
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) r[k] = extra[k];
    return r;
  }

  var data = {
    versie: '2026.10.1',
    peildatum: '2026-10-06',
    eenheid: 'cent per kWh',
    toelichting: 'Vergoeding zoals de bron hem noemt (bij keuze.nl zonder belasting en btw), terugleverkosten inclusief btw. Netto = vergoeding min terugleverkosten, berekend uit de afgeronde bedragen; dat kan 0,01 cent afwijken van de bron.',

    wettelijk_minimum: {
      regel: 'Tot 1 januari 2030 minimaal 50% van de overeengekomen (kale) leveringsprijs, zonder energiebelasting en btw; per maand gemiddeld niet negatief. Daarna alleen een redelijke vergoeding.',
      voorbeeld_ct_kwh: 6.07,
      voorbeeld_uitleg: '50% van het CBS-gemiddelde variabele leveringstarief van augustus 2026 (€ 0,1469 incl. btw, dus € 0,1214 zonder btw).',
      bronnen: [
        { naam: 'Staatsblad 2025, 17, art. 2.34 Energiewet', url: 'https://zoek.officielebekendmakingen.nl/stb-2025-17.html', datum: '2026-10-06' },
        { naam: 'Rijksoverheid', url: 'https://www.rijksoverheid.nl/onderwerpen/energie-thuis/salderingsregeling', datum: '2026-10-06' },
        { naam: 'ACM ConsuWijzer', url: 'https://consument.acm.nl/elektriciteit-en-gas/duurzame-energie/wat-is-salderen', datum: '2026-10-06' },
        { naam: 'CBS 85592NED', url: 'https://www.cbs.nl/nl-nl/cijfers/detail/85592NED', datum: '2026-10-06' }
      ]
    },

    secundaire_bronnen: [
      { naam: 'keuze.nl, Terugleverkosten vergelijken 2027', url: 'https://www.keuze.nl/energie/terugleverkosten', datum: '2026-10-06', bereik: '2027, 1 jaar vast, 14 leveranciers; terugleverkosten incl. btw. Dynamische leveranciers met terugleverkosten 2026.' },
      { naam: 'keuze.nl, Terugleververgoeding', url: 'https://www.keuze.nl/energie/terugleververgoeding', datum: '2026-10-06', bereik: '2027 bruto en netto voor 12 leveranciers; vergoeding zonder belasting en btw.' },
      { naam: 'energievergelijk.nl, Terugleververgoedingen stijgen in 2027', url: 'https://www.energievergelijk.nl/nieuws/terugleververgoedingen-stijgen-in-2027-deze-5-leveranciers-betalen-het-meest', datum: '2026-10-01', bereik: '2027, vast: netto Eneco 3,85, Vattenfall 3,44, Essent 3,08 ct; dynamisch ongeveer 7,6 tot 7,8 ct bij een marktwaarde van 5,1 ct. Btw-basis niet vermeld.' },
      { naam: 'energievergelijk.nl, Netto terugleververgoeding per 1 januari 2027', url: 'https://www.energievergelijk.nl/nieuws/dit-wordt-de-netto-terugleververgoeding-voor-zonnepanelen-per-1-januari-2027', datum: '2026-02-24', bereik: 'Ouder overzicht met netto bedragen, onder meer Innova en GewoonEnergie op min 7,43 ct en Mega op min 2,12 ct.' },
      { naam: 'gaslicht.com, Terugleververgoeding vergelijken', url: 'https://www.gaslicht.com/energiebesparing/terugleveren', datum: '2026-10-06', bereik: 'Geen tabel voor 2027 per leverancier; noemt "ongeveer een halve cent" netto bij de meeste leveranciers.' },
      { naam: 'Radar (AVROTROS)', url: 'https://radar.avrotros.nl/artikel/bij-deze-energieleveranciers-gaat-het-terugleveren-van-zonnestroom-je-geld-kosten-62049', datum: '2025-10-30', bereik: '2027, meerjarig: Innova en GewoonEnergie netto min 5,58 ct; de meeste anderen rond 0,25 ct.' }
    ],

    rijen: [
      {
        id: 'wettelijk-minimum', leverancier: 'Wettelijk minimum', contractvorm: 'elk contract, tot 1 januari 2030',
        vergoeding_ct_kwh: null, vergoeding_tekst: 'minimaal 50% van de kale leveringsprijs; bij het CBS-gemiddelde ongeveer 6,07 ct excl. btw',
        terugleverkosten_ct_kwh: null, terugleverkosten_tekst: 'geen wettelijk bedrag; alleen werkelijke verwerkingskosten',
        netto_tekst: 'per maand gemiddeld niet negatief (de vergoeding)',
        status: 'wet', status_bron: null, geldig: '1 januari 2027 tot 1 januari 2030', aankondiging_2027: null,
        bronnen: [
          { naam: 'Staatsblad 2025, 17', url: 'https://zoek.officielebekendmakingen.nl/stb-2025-17.html', datum: '2026-10-06' },
          { naam: 'ACM ConsuWijzer', url: 'https://consument.acm.nl/elektriciteit-en-gas/duurzame-energie/wat-is-salderen', datum: '2026-10-06' }
        ]
      },

      /* Vaste contracten, tarief 2027, keuze.nl 6-10-2026 (secundair) */
      vastKeuze('mega-vast', 'Mega', 22.41, 18.31, { opmerking: 'energievergelijk.nl noemde op 24-2-2026 nog min 2,12 ct netto.' }),
      vastKeuze('eneco-vast', 'Eneco', 8.39, 4.53, { opmerking: 'energievergelijk.nl (1-10-2026) noemt 3,85 ct netto.' , bronnen: [KEUZE, EV_OKT] }),
      vastKeuze('vattenfall-vast', 'Vattenfall', 8.40, 4.89, { opmerking: 'energievergelijk.nl (1-10-2026) noemt 3,44 ct netto. Vattenfall rekent volgens zijn productvoorwaarden vanaf 1-1-2027 terugleverkosten per kWh; de bedragen staan in het aanbod, niet in de voorwaarden.', bronnen: [KEUZE, EV_OKT, { naam: 'Vattenfall, productvoorwaarden Groen met ZonBonus (20-2-2026)', url: 'https://www.vattenfall.nl/media/_0vattenfall/voorwaarden/productvoorwaarden/2026_08_01/6176_008-pvw-groen-met-zonbonus.pdf', datum: '2026-10-06' }] }),
      vastKeuze('essent-vast', 'Essent', 8.68, 5.60, { opmerking: 'energievergelijk.nl (1-10-2026) noemt ook 3,08 ct netto.', bronnen: [KEUZE, EV_OKT] }),
      vastKeuze('powerpeers-vast', 'Powerpeers', 9.03, 6.22),
      vastKeuze('budget-vast', 'Budget Energie (Budget Thuis)', 8.00, 5.50, { opmerking: 'keuze.nl noemt het merk Budget Thuis. energievergelijk.nl (13-5-2026) gaf 5,65 ct vergoeding en 3,15 ct kosten, ook 2,50 ct netto.' }),
      vastKeuze('energiedirect-vast', 'Energiedirect', 7.79, 6.79),
      vastKeuze('engie-vast', 'Engie', 16.08, 15.19),
      vastKeuze('unitedconsumers-vast', 'UnitedConsumers', 15.89, 15.39),
      vastKeuze('innova-vast', 'Innova Energie', 8.60, 8.33, { opmerking: 'Ouder: Radar (30-10-2025) min 5,58 ct en energievergelijk.nl (24-2-2026) min 7,43 ct netto.' }),
      vastKeuze('delta-vast', 'Delta Energie', 7.63, 7.37),
      vastKeuze('pure-vast', 'Pure Energie', 9.50, 9.25),
      vastKeuze('vandebron-vast', 'Vandebron', 7.76, 7.56),
      {
        id: 'greenchoice-vast', leverancier: 'Greenchoice', contractvorm: VAST_KEUZE,
        vergoeding_ct_kwh: 7.88, vergoeding_btw: 'excl',
        terugleverkosten_ct_kwh: null, terugleverkosten_tekst: 'niet los vermeld',
        netto_tekst: '0,25 ct volgens keuze.nl',
        status: 'secundair', status_bron: 'keuze.nl, 6-10-2026', geldig: 'vanaf 1 januari 2027', aankondiging_2027: null,
        bronnen: [KEUZE_TLV]
      },
      {
        id: 'oxxio-vast', leverancier: 'Oxxio', contractvorm: 'vast, tarief 2027',
        vergoeding_ct_kwh: 5.99, vergoeding_btw: null,
        terugleverkosten_ct_kwh: 5.18, terugleverkosten_btw: null,
        status: 'secundair', status_bron: 'energievergelijk.nl, peildatum 13-5-2026', geldig: 'vanaf 1 januari 2027', aankondiging_2027: null,
        opmerking: 'Geen recenter bedrag gevonden; keuze.nl noemt Oxxio in oktober 2026 niet voor 2027.',
        bronnen: [EV_MEI]
      },
      {
        id: 'coolblue-vast', leverancier: 'Coolblue Energie', contractvorm: '1 jaar vast, tarief 2027',
        vergoeding_ct_kwh: 7.00, vergoeding_btw: null,
        terugleverkosten_ct_kwh: 6.50, terugleverkosten_btw: null,
        status: 'secundair', status_bron: 'keuze.nl, 11-12-2025', geldig: 'vanaf 1 januari 2027', aankondiging_2027: null,
        opmerking: 'energievergelijk.nl (1-10-2026) noemt Coolblue onder de leveranciers met onveranderd 0,25 tot 0,50 ct netto.',
        bronnen: [KEUZE_2025, EV_OKT]
      },
      {
        id: 'gewoonenergie-vast', leverancier: 'GewoonEnergie', contractvorm: '1 jaar vast, tarief 2027',
        vergoeding_ct_kwh: 5.90, vergoeding_btw: null,
        terugleverkosten_ct_kwh: 11.50, terugleverkosten_btw: null,
        status: 'secundair', status_bron: 'keuze.nl, 11-12-2025', geldig: 'vanaf 1 januari 2027', aankondiging_2027: null,
        opmerking: 'Ouder dan zes maanden; geen recenter bedrag gevonden. energievergelijk.nl (24-2-2026) noemde min 7,43 ct netto.',
        bronnen: [KEUZE_2025]
      },

      /* Dynamische contracten: vergoeding volgt de uurprijs */
      {
        id: 'zonneplan-dynamisch', leverancier: 'Zonneplan Energie', contractvorm: 'dynamisch',
        vergoeding_ct_kwh: null, vergoeding_tekst: 'uurprijs plus 2 ct per kWh, plus 10% (bonus); varieert per uur',
        terugleverkosten_ct_kwh: 0, terugleverkosten_btw: null, terugleverkosten_tekst: 'geen terugleverkosten',
        netto_tekst: 'hangt af van de uurprijs',
        status: 'geverifieerd', status_bron: null, geldig: 'nu en vanaf 1 januari 2027', aankondiging_2027: null,
        opmerking: 'Pagina van Zonneplan, bijgewerkt 18-6-2026.',
        bronnen: [{ naam: 'Zonneplan, terugleververgoeding vanaf 2027', url: 'https://www.zonneplan.nl/salderingsregeling/terugleververgoeding-vanaf-2027/', datum: '2026-10-06' }]
      },
      {
        id: 'frank-dynamisch', leverancier: 'Frank Energie', contractvorm: 'dynamisch',
        vergoeding_ct_kwh: null, vergoeding_tekst: 'uurprijs plus 15% plus 1,82 ct; varieert per uur',
        terugleverkosten_ct_kwh: 1.3, terugleverkosten_btw: null, terugleverkosten_tekst: 'tarief 2026',
        netto_tekst: 'hangt af van de uurprijs',
        status: 'secundair', status_bron: 'energievergelijk.nl 1-10-2026 en keuze.nl 6-10-2026', geldig: 'vergoeding 2027, kosten 2026', aankondiging_2027: null,
        bronnen: [EV_OKT, KEUZE]
      },
      {
        id: 'nextenergy-dynamisch', leverancier: 'NextEnergy', contractvorm: 'dynamisch',
        vergoeding_ct_kwh: null, vergoeding_tekst: 'uurprijs plus 50%, tot 6.000 kWh per jaar; varieert per uur',
        terugleverkosten_ct_kwh: 2.2, terugleverkosten_btw: null, terugleverkosten_tekst: 'tarief 2026',
        netto_tekst: 'hangt af van de uurprijs',
        status: 'secundair', status_bron: 'energievergelijk.nl 1-10-2026 en keuze.nl 6-10-2026', geldig: 'vergoeding 2027, kosten 2026', aankondiging_2027: null,
        bronnen: [EV_OKT, KEUZE]
      },
      {
        id: 'tibber-dynamisch', leverancier: 'Tibber', contractvorm: 'dynamisch',
        vergoeding_ct_kwh: null, vergoeding_tekst: 'niet gevonden',
        terugleverkosten_ct_kwh: 0, terugleverkosten_btw: null, terugleverkosten_tekst: 'geen terugleverkosten (2026)',
        netto_tekst: 'hangt af van de uurprijs',
        status: 'secundair', status_bron: 'keuze.nl, 6-10-2026', geldig: '2026', aankondiging_2027: null,
        bronnen: [KEUZE]
      },
      {
        id: 'anwb-dynamisch', leverancier: 'ANWB Energie', contractvorm: 'dynamisch',
        vergoeding_ct_kwh: null, vergoeding_tekst: 'niet gevonden',
        terugleverkosten_ct_kwh: 0, terugleverkosten_btw: null, terugleverkosten_tekst: 'geen terugleverkosten (2026)',
        netto_tekst: 'hangt af van de uurprijs',
        status: 'secundair', status_bron: 'keuze.nl, 6-10-2026', geldig: '2026', aankondiging_2027: null,
        bronnen: [KEUZE]
      },

      /* Niet gevonden */
      {
        id: 'om-nieuwe-energie', leverancier: 'OM | Nieuwe Energie', contractvorm: 'onbekend',
        vergoeding_ct_kwh: null, vergoeding_tekst: 'niet gevonden', terugleverkosten_ct_kwh: null, terugleverkosten_tekst: 'niet gevonden',
        status: 'niet_gevonden', status_bron: null, geldig: null, aankondiging_2027: null, bronnen: []
      },
      {
        id: 'energie-vanons', leverancier: 'Energie VanOns', contractvorm: 'onbekend',
        vergoeding_ct_kwh: null, vergoeding_tekst: 'niet gevonden', terugleverkosten_ct_kwh: null, terugleverkosten_tekst: 'niet gevonden',
        status: 'niet_gevonden', status_bron: null, geldig: null, aankondiging_2027: null, bronnen: []
      },
      {
        id: 'clean-energy', leverancier: 'Clean Energy', contractvorm: 'onbekend',
        vergoeding_ct_kwh: null, vergoeding_tekst: 'niet gevonden', terugleverkosten_ct_kwh: null, terugleverkosten_tekst: 'niet gevonden',
        status: 'niet_gevonden', status_bron: null, geldig: null, aankondiging_2027: null, bronnen: []
      }
    ],

    wijzigingslog: [
      { versie: '2026.10.1', datum: '2026-10-06', tekst: 'Eerste versie: 25 leveranciers en het wettelijke minimum. Eén rij (Zonneplan) bij de leverancier zelf gecontroleerd; de overige bedragen komen van keuze.nl en energievergelijk.nl, met datum.' }
    ]
  };

  /* ---------- Afgeleide velden ---------- */
  data.rijen.forEach(function (r) {
    r.peildatum = r.peildatum || data.peildatum;
    r.versie = r.versie || data.versie;
    r.netto_ct_kwh = (typeof r.vergoeding_ct_kwh === 'number' && typeof r.terugleverkosten_ct_kwh === 'number')
      ? Math.round((r.vergoeding_ct_kwh - r.terugleverkosten_ct_kwh) * 100) / 100
      : null;
  });

  /* ---------- HTML (pagina en tools/leveranciers-tabel.mjs) ---------- */
  var STATUS = {
    geverifieerd: 'geverifieerd bij leverancier',
    secundair: 'alleen via vergelijkingssite',
    niet_gevonden: 'niet gevonden',
    wet: 'wettelijke regel'
  };
  var MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function ct(n) {
    return (n < 0 ? '&minus;' : '') + Math.abs(n).toFixed(2).replace('.', ',') + '&nbsp;ct';
  }
  function datum(iso) {
    var d = String(iso || '').split('-');
    return d.length === 3 ? parseInt(d[2], 10) + ' ' + MAANDEN[parseInt(d[1], 10) - 1] + ' ' + d[0] : esc(iso);
  }
  function klein(t) { return t ? '<br><small>' + esc(t) + '</small>' : ''; }
  function btw(b) { return b === 'incl' ? ' incl.&nbsp;btw' : b === 'excl' ? ' excl.&nbsp;btw' : ''; }

  function cel(n, b, tekst) {
    if (typeof n === 'number') return '<td class="num">' + ct(n) + btw(b) + klein(tekst) + '</td>';
    return '<td>' + esc(tekst || 'niet gevonden') + '</td>';
  }

  function rij(r) {
    var bron = (r.bronnen || []).map(function (b) {
      return '<a href="' + esc(b.url) + '" rel="nofollow noopener" target="_blank">' + esc(b.naam) + '</a>';
    }).join('; ');
    var status = STATUS[r.status] || esc(r.status);
    if (r.status === 'secundair' && r.status_bron) status += ' (' + esc(r.status_bron) + ')';
    var netto = typeof r.netto_ct_kwh === 'number'
      ? '<td class="num">' + ct(r.netto_ct_kwh) + '</td>'
      : '<td>' + esc(r.netto_tekst || 'niet te berekenen') + '</td>';
    return '<tr data-lv-id="' + esc(r.id) + '">'
      + '<th scope="row">' + esc(r.leverancier) + klein(r.opmerking) + '</th>'
      + '<td>' + esc(r.contractvorm) + '</td>'
      + cel(r.vergoeding_ct_kwh, r.vergoeding_btw, r.vergoeding_tekst)
      + cel(r.terugleverkosten_ct_kwh, r.terugleverkosten_btw, r.terugleverkosten_tekst)
      + netto
      + '<td>' + status + '</td>'
      + '<td>' + (bron || 'geen bron gevonden') + '<br><small>peildatum ' + datum(r.peildatum) + '</small></td>'
      + '</tr>';
  }

  function tabel(d) {
    return '<div class="prose-table-wrap lv-wrap">\n'
      + '<table class="prose-table lv-table">\n'
      + '<caption>Terugleververgoeding en terugleverkosten per leverancier, in cent per kWh. ' + esc(d.toelichting) + ' Dataset versie ' + esc(d.versie) + ', peildatum ' + datum(d.peildatum) + '.</caption>\n'
      + '<thead><tr><th scope="col">Leverancier</th><th scope="col">Contract</th><th scope="col">Vergoeding</th><th scope="col">Terugleverkosten</th><th scope="col">Netto per kWh</th><th scope="col">Status</th><th scope="col">Bron</th></tr></thead>\n'
      + '<tbody>\n' + d.rijen.map(rij).join('\n') + '\n</tbody>\n'
      + '</table>\n'
      + '</div>';
  }

  function kiesbaar(r) {
    return (r.status === 'geverifieerd' || r.status === 'secundair')
      && typeof r.vergoeding_ct_kwh === 'number' && typeof r.terugleverkosten_ct_kwh === 'number';
  }
  function eur(ctKwh) { return String(Math.round(ctKwh * 100) / 10000); }

  function rekentoolLinks(d) {
    var items = d.rijen.filter(kiesbaar).map(function (r) {
      var href = '/rekentool?tv=' + eur(r.vergoeding_ct_kwh) + '&amp;tk=' + eur(r.terugleverkosten_ct_kwh) + '&amp;lv=' + esc(r.id) + '#aannames';
      return '  <li><a href="' + href + '">' + esc(r.leverancier) + '</a>: netto ' + ct(r.netto_ct_kwh) + ' per kWh'
        + (r.status === 'secundair' ? ' (bron: ' + esc(r.status_bron) + ')' : ' (bij de leverancier gecontroleerd)') + '</li>';
    });
    if (!items.length) return '<p>Er is op de peildatum geen leverancier met een vergoeding en terugleverkosten per kWh.</p>';
    return '<ul class="lv-links">\n' + items.join('\n') + '\n</ul>';
  }

  var html = { tabel: tabel, rekentoolLinks: rekentoolLinks, kiesbaar: kiesbaar, STATUS: STATUS };

  if (typeof window !== 'undefined') {
    window.SD_LEVERANCIERS = data;
    window.SD_LEVERANCIERS_HTML = html;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { data: data, html: html };
})();
