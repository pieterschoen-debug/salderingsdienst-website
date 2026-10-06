# Modelvergelijking: website-rekentool (A) versus intern rekenrapport (B), 6 oktober 2026

Samenvatting van de vergelijking door de analyse-agent (volledige uitvoer in de sessielog). Intern document, niet voor publicatie. Niets aan het rekenrapport gewijzigd.

## Kernbevinding
Met de prijsaannames van de website komt het rekenrapport uit op of iets onder de website (H1: € 241 tegen € 294 per jaar; H2: € 444 tegen € 568). De uursimulatie van het rekenrapport is dus niet optimistischer. Het verschil van 3 tot 4 keer in jaarbesparing en "2,8 jaar" tegenover "niet binnen 12 jaar" komt uit vijf aannames in het rekenrapport zelf.

## Wat het verschil verklaart (middenscenario rekenrapport, H1 = 3.500/3.500 kWh, H2 = 6.000/5.600 kWh)

| Stap | H1 €/jaar | H2 €/jaar | Oordeel |
|---|---|---|---|
| Rekenrapport standaard | 1.190 | 1.755 | |
| Referentie met wettelijk minimum (50% kale tarief) en € 0,02 kosten in plaats van € 0,15 kosten zonder vergoeding | 694 | 975 | onhoudbaar in B (feitenblad B2a–c) |
| Teruglevering tegen kale EPEX zonder prijsindex ×1,8 | 605 | 839 | onhoudbaar in B: leverancier betaalt EPEX, niet EPEX × 1,8 |
| Prijsniveau CBS (€ 0,258) in plaats van € 0,32 zonder bron | 540 | 728 | geen bron in B |
| Zonder balanceringsopbrengst (€ 300/jaar, bron "Thuisbatterij Nederland", niet geverifieerd; B's eigen EMS-constante staat op 0) | 241 | 444 | aannamekeuze |
| Investering incl. btw, 12 jaar, 2% degradatie (B: excl. btw, 20 jaar, geen degradatie, groeicurve 26,3× jaar 1) | niet binnen 12 jaar | niet binnen 12 jaar | excl. btw en groeicurve onhoudbaar voor een particulier |

## Legitieme verschillen (klantdata)
Opwek via PVGIS op het adres of gemeten jaaropbrengst; echt product (capaciteit, omvormer, rendement); echte productprijs mits incl. btw en compleet; uurprofiel als de schuifjes op klantinformatie staan; aansluitgrens; EPEX 2024 met aftrek voor vooruitkijken.

## Wat de website kan overnemen van het rekenrapport
- Batterijprijs per maat uit de catalogus (incl. btw): ongeveer € 5.900 vast + € 356 per kWh (10,2 kWh € 9.558; 20,4 kWh € 13.188; 30,6 kWh € 16.818), peildatum 6-10-2026, mits bevestigd dat installatie en EMS erin zitten. De huidige € 900/kWh klopt voor de 10 kWh-klasse, is te hoog voor grotere systemen. Er bestaat geen 5 kWh-product: standaardvoorbeeld naar 10 kWh of als hypothetisch markeren.
- Levensduur 15–20 jaar alleen met schriftelijke garantie (12.000 cycli, 20 jaar) en mét degradatie.
- Stroomprijs, vergoeding en terugleverkosten blijven op CBS en wet.

## Wat in het rekenrapport moet veranderen (zelfde modelfamilie)
Versienummer, peildatum, prijsjaar met index, scenario, horizon, btw-basis op elk rapport; regel "uitkomst met de standaardaannames van de rekentool v1.0.0"; referentie op wettelijke vergoeding en echte contracttarieven van de klant; index alleen op afname; groeicurve uit, degradatie aan, investering incl. btw; balancering als aparte benoemde regel, niet in het kerngetal.

## Websitetekst "Waarom een persoonlijk rekenrapport anders uitkomt" (pas plaatsen na de reparaties hierboven)
Deze rekentool rekent met landelijke gemiddelden en een maandmodel. In een persoonlijk rekenrapport rekenen we met hetzelfde model en dezelfde uitgangspunten, maar met uw eigen gegevens: de opbrengst van uw dak op uw adres of de gemeten opbrengst; uw verbruik per uur; de tarieven uit uw eigen energiecontract; de batterij die bij u past, met de prijs uit de offerte inclusief btw en installatie; de grens van uw aansluiting. Valt de uitkomst anders uit, dan staat in het rapport welk van deze punten dat verschil maakt, met dezelfde versie en peildatum als deze tool.

## Open vragen voor Pieter
1. Zijn € 0,32 en € 0,15 in- of exclusief btw en waar komen ze vandaan (VEMS)? Mag de adviseur de echte contracttarieven invullen?
2. Zitten installatie en EMS in de catalogusprijs?
3. Toont het rapport particulieren de investering exclusief btw, of gaat de propositie uit van btw-ondernemerschap zonder KOR (dan vermelden, incl. administratieve last)?
4. Is er een getekend aggregatorcontract voor balancering en wie is de bron "Thuisbatterij Nederland"?
5. P1-/kwartierdata ook voor particulieren inlezen (lezer bestaat zakelijk al)?
6. Met eerlijke aannames haalt vrijwel geen geval de bedrijfsregel van maximaal 7 jaar: kleinere batterij, andere prijs of geen voorstel?
