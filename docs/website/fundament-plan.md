# Fundamenteel plan: van adviessite naar productsite

Datum: 16 oktober 2026. Referentie: de nieuwe site van de oude compagnon, groenplan.com (particulier en zakelijk), bekeken op 16 oktober 2026. Dit plan beschrijft wat wij daarvan overnemen, in welke volgorde, en wat wij bewust niet doen. De bijbehorende foto-opdrachten staan in [fotoprompts.md](fotoprompts.md).

Uitgangspunt van Pieter: kleine stappen, nooit iets half-afs live. Elke stap hieronder is een afgeronde eenheid die op zichzelf goed oogt en pas live gaat als de foto's erin zitten.

---

## 1. Wat groenplan.com goed doet, en wat daarvan bij ons past

Ik heb de particuliere homepage, de pagina Thuisbatterijen en de zakelijke pagina sectie voor sectie bekeken. Per sectie: past het bij ons merk (navy, goud, warm papier, PT Serif, u-vorm, "eerst rekenen, dan adviseren") en wat doen wij ermee.

| # | Sectie op groenplan.com | Oordeel | Wat wij ermee doen |
|---|---|---|---|
| 1 | Hero: paginabrede foto (adviseur bij groene bus) met rechts een bespaarcheck-kaart met tabs Thuisbatterij / Isolatie | Sterk. De check staat direct in beeld in plaats van verderop | Fase 2: onze bespaarcheck naast de herofoto zetten, als één kaart, geen tabs (wij hebben één check). Pas als de nieuwe herofoto er is |
| 2 | "Jouw zon. Jouw stroom. Jouw plan.": drie fotokaarten (batterij, isolatie, eerlijk advies) met titel óver de foto | Sterk. Dit is het product-etalage-moment dat wij missen | Fase 2: onze carrousel "Onze oplossingen" (vijf kleine kaarten met stockfoto's, allemaal naar /adviesgesprek) vervangen door vier fotokaarten die elk naar een eigen productpagina gaan |
| 3 | "Zo werkt een thuisbatterij. Een dag bij jou thuis.": geanimeerd dagverloop (zon, batterij, huis, net) met tijdstippen ochtend / middag / avond / nacht | Zeer sterk en past precies bij "eerst begrijpen" | Fase 1 (stap 1): als rustige, stilstaande versie op de productpagina thuisbatterij, in navy en goud. Fase 2: dezelfde tekening krijgt een zachte animatie en komt op de homepage |
| 4 | "Je batterij werkt vanzelf": foto links (bewoner met app bij de meterkast), rechts een uitklaplijst met vier voordelen | Goed. Foto + uitklaplijst is de juiste vorm voor productuitleg | Fase 1: standaardblok op elke productpagina ("Wat u krijgt") |
| 5 | "Geen gedoe. Wij regelen het": foto van twee monteurs, uitklaplijst met eerlijk advies, eigen vakmensen, 10 jaar garantie, subsidiehulp | Goed, maar wij hebben dit al in "Waarom SalderingsDienst" en "Eerlijk verhaal" | Niet dubbel bouwen. Wel: de garantie- en veiligheidspunten die wél waar zijn voor ons op de productpagina's zetten (zie fase 4) |
| 6 | Aftelblok "over 77 dagen stopt salderen" | Wij hebben de urgentiebalk al | Niets |
| 7 | Isolatiesectie | Niet ons product | Niets. Hetzelfde patroon gebruiken wij voor de warmtepomp |
| 8 | "Zo gaat het": vier genummerde stappen | Wij hebben "Zo werkt het" al, mét foto's | Niets |
| 9 | Vier reviews plus "Vijf sterren op Google"-badge | De badge werkt alleen als de sterren echt zijn | Fase 4, alleen met een echt Google-bedrijfsprofiel met echte beoordelingen |
| 10 | "Laatste nieuws uit onze kennisbank": drie kaarten met beeld, datum en leestijd | Goed en goedkoop. Onze kennisbank is sterk maar op de homepage nauwelijks zichtbaar (twee tekstlinks onder de FAQ) | Fase 2: drie kennisbankkaarten met beeld op de homepage |
| 11 | FAQ | Wij hebben er een | Niets |
| 12 | Slot-CTA met foto (monteur loopt naar de voordeur) | Mooi. Onze slot is tekst op navy | Fase 2: foto erbij, zodra die er is |
| 13 | Schakelaar Particulier / Zakelijk rechtsboven; op de zakelijke site een eigen menu, eigen scan, eigen FAQ | Dit is wat Pieter wil hebben | Fase 3. Alleen tonen zodra de zakelijke pagina compleet is; een knop naar een halve pagina schaadt vertrouwen |
| 14 | Productpagina Thuisbatterijen: hero met check, dagverloop, twee producttypen met specificaties (opslag, aansluiting, garantie), veiligheid (LiFePO4, batterijbeheer, app, plek), dynamisch contract, "één vaste prijs"-uitklaplijst, FAQ | Zeer sterk als structuur | Fase 1: dit is het sjabloon voor al onze productpagina's, in onze stijl en met alleen claims die voor ons waar zijn |
| 15 | Zakelijk: donkere hero met film, "snelle scan" per bedrijfstype, netcongestie-uitleg met grafiek (zonder / met batterij), dagverloop zakelijk, sectoren, drie stappen, contactformulier | Inhoudelijk sterk, visueel te donker en te druk voor ons | Fase 3: netcongestie-uitleg en sectorenblok overnemen in rustige vorm; geen film, wel één stilstaande foto |

Wat wij bewust niet overnemen: de felgroene kleur en pilvormige knoppen, de je-vorm, Plus Jakarta Sans, de filmhero, isolatie als product, en claims die wij niet kunnen waarmaken (10 jaar garantie, eigen vakmensen, plug-in batterijen) tenzij Pieter bevestigt dat ze kloppen.

Wat wij al beter doen dan groenplan.com en dus bewaren: de doorrekening vooraf (rekentool en bespaarcheck met aannames), de kennisbank met bronnen, het eerlijke verhaal ("soms is ons advies om te wachten"), de negen echte adviseurs, het aftellen naar 1 januari 2027, en de serieuze, overheidsachtige toon.

---

## 2. Het eindbeeld

Sitestructuur na alle fases:

```
/                         homepage particulier (etalage: vier producten, check, kennisbank)
/thuisbatterij            productpagina
/zonnepanelen             productpagina
/warmtepomp               productpagina
/slimme-energiesturing    productpagina
/adviesgesprek            bestaat
/rekentool                bestaat
/kennisbank               bestaat
/zakelijk                 zakelijke homepage (fase 3), met schakelaar in de kop
```

Navigatie particulier: Oplossingen (uitklap naar de vier pagina's), Werkwijze, Over ons, Rekentool, Kennisbank, Vragen, knop "Plan adviesgesprek". Rechtsboven, naast het menu, de schakelaar Particulier | Zakelijk (pas vanaf fase 3).

Elke productpagina heeft dezelfde opbouw, zodat de bezoeker na één pagina de rest herkent:

1. Hero: foto, één zin wat het is, één zin wat wij doen, knop "Plan kosteloos adviesgesprek" en tweede knop "Bereken uw situatie" naar de rekentool.
2. Zo werkt het: het dagverloop (thuisbatterij) of een vergelijkbare uitleg in vier momenten.
3. Wat u krijgt: foto plus uitklaplijst van vier punten.
4. Wanneer wij het afraden: één eerlijk blok, in de lijn van "Eerlijk verhaal".
5. Wat er in de offerte staat: uitklaplijst (schouw, materiaal, installatie, sturing, subsidie).
6. Vragen over dit product: vijf tot acht vragen.
7. Slot: adviesgesprek, telefoon.

---

## 3. Fases en stappen

Regels voor elke stap: één stap per commit, de stap is op zichzelf compleet, de foto's zijn er vóór het live gaat, `npm run build` slaagt, mobiel (375 px) en desktop (1280 px) gecontroleerd, sitemap en JSON-LD bijgewerkt.

### Fase 1: productfundament (vier pagina's)

| Stap | Wat | Foto's nodig (zie fotoprompts) | Status |
|---|---|---|---|
| 1.1 | Productpagina `/thuisbatterij` met de volledige opbouw hierboven; kaart "Thuisbatterij" op de homepage linkt ernaartoe | B1 hero, B2 app, B3 productstill | Gebouwd op 16 oktober 2026 op branch `seo/fundament-deploy`, met de bestaande foto's als tijdelijke vulling. Gaat live zodra B1 t/m B3 erin zitten |
| 1.2 | Productpagina `/zonnepanelen` (nieuw dak én "meer uit uw bestaande dak" samengevoegd) | Z1 hero, Z2 omvormer | Te doen |
| 1.3 | Productpagina `/warmtepomp` | W1 hero, W2 binnen | Te doen |
| 1.4 | Productpagina `/slimme-energiesturing` | S1 meterkast, S2 app met prijsgrafiek | Te doen |
| 1.5 | Menu-item "Oplossingen" wordt een uitklap naar de vier pagina's (desktop en mobiel) | geen | Te doen na 1.4 |

### Fase 2: homepage als etalage

| Stap | Wat | Foto's nodig | Status |
|---|---|---|---|
| 2.1 | "Onze oplossingen" wordt vier staande fotokaarten met titel over de foto, elk naar de productpagina | K1 t/m K4 (staande uitsnedes) | Te doen |
| 2.2 | Dagverloop-tekening krijgt een zachte animatie (tijdstip loopt door, pauzeerbaar, respecteert "minder beweging") en komt als eigen sectie op de homepage, onder de bespaarcheck | geen | Te doen |
| 2.3 | Sectie "Uit de kennisbank": drie kaarten met beeld, datum en leestijd, knop "Alle artikelen" | A1 t/m A3 | Te doen |
| 2.4 | Hero: bespaarcheck-kaart naast de herofoto (desktop), onder de foto (mobiel). De losse sectie "Bereken" verdwijnt dan | H1 nieuwe hero (breed, met ruimte rechts) | Te doen |
| 2.5 | Slot-CTA met foto | C1 | Te doen |

### Fase 3: zakelijk en de schakelaar

| Stap | Wat | Foto's nodig | Status |
|---|---|---|---|
| 3.1 | Inhoud zakelijk vaststellen met Pieter: welke diensten (batterijopslag, netcongestie, zonne-energie, energiemanagement), voor welke sectoren, hoe het eerste contact gaat (scan, formulier of bellen) | geen | Gesprek nodig |
| 3.2 | Pagina `/zakelijk`: hero, "uw aansluiting is de grens" (drie problemen), netcongestie-uitleg met grafiek zonder / met batterij, oplossingen, sectoren, drie stappen, FAQ, contactformulier naar de bestaande boekingsopslag met kenmerk zakelijk | ZK1 hero, ZK2 sector | Te doen |
| 3.3 | Schakelaar Particulier | Zakelijk rechtsboven op beide sites, plus zakelijke kolom in de voettekst | geen | Pas na 3.2 |

### Fase 4: vertrouwenslaag

| Stap | Wat | Voorwaarde |
|---|---|---|
| 4.1 | Google-beoordelingen: badge in hero en bij de ervaringen | Alleen met een echt Google-bedrijfsprofiel; score en aantal live ophalen of handmatig bijhouden, nooit verzinnen |
| 4.2 | Veiligheid en garantie op de productpagina's (celtype, batterijbeheer, garantietermijn, plek in huis) | Pieter levert de echte garantietermijnen en merken van de partners |
| 4.3 | Certificeringen en partners (installatiepartners, keurmerken) als logorij | Toestemming van de partners |

---

## 4. Wat ik nodig heb van Pieter

1. Foto's volgens [fotoprompts.md](fotoprompts.md), te beginnen met B1 t/m B3 (thuisbatterij), zodat stap 1.1 live kan.
2. Feiten voor de productpagina's die ik niet uit de site kan halen: garantietermijnen, merken of celtype van de batterijen die de partners leveren, of wij plug-in batterijen aanbieden, de gemiddelde doorlooptijd van offerte tot installatie.
3. Voor fase 3: het antwoord op stap 3.1.
4. Voor fase 4: bestaat er een Google-bedrijfsprofiel met beoordelingen?

---

## 5. Logboek

| Datum | Wat |
|---|---|
| 2026-10-16 | Plan en fotoprompts geschreven. Stap 1.1 gebouwd met tijdelijke foto's; niet gecommit, niet live |
