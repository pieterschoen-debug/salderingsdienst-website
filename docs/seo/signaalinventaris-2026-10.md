# Signaalinventaris on-page SEO, oktober 2026

Stand: 2026-10-06, branch `seo/fundament-deploy`, HTML zoals vastgelegd in commit `9232a18` (entiteit, footers, titels en metabeschrijvingen). Tijdens het opstellen heeft een andere agent titels, metabeschrijvingen, footers en twee alt-teksten aangepast en gecommit; een eerste meting vóór die commit is vervangen. Alleen gelezen, niets gewijzigd. Alle getallen komen uit een scriptmatige telling (Python 3.14, `html.parser`, Pillow 12.3.0), niet uit schatting. Bij verdere HTML-wijzigingen moet de telling opnieuw.

Buiten bereik: `public/`, `portal.html`, `widget.html`, `archive/`, `uploads/`. Negen pagina's: acht indexeerbaar, `404.html` is `noindex`.

## Meetmethode

- **Woorden in de hoofdtekst:** alle tekstknopen binnen `<main>`, zonder `<header>`, `<footer>`, `<nav>`, `<script>`, `<style>`, `<noscript>`, `<svg>` en `<template>`. Een woord is een door witruimte gescheiden token met minstens één letter of cijfer. Gecontroleerd met een tweede, onafhankelijke methode (regex-strip van tags): identieke uitkomst voor Home, beide artikelen, hub, adviesgesprek en privacybeleid. Verborgen maar aanwezige tekst (dichtgeklapte FAQ-antwoorden, `<details>`) telt mee. Tekst die pas door JavaScript ontstaat (boekingsmodule op `/adviesgesprek`, rekenmodule-uitkomsten, sliders) telt niet mee.
- **Koppen:** alle `h1` tot en met `h3` in het hele document.
- **Afbeeldingen:** alle `<img>`-elementen in de statische HTML. Eén extra `<img>` wordt door `js/booking.js` ingevoegd op `/adviesgesprek` (bevestigingsscherm) en staat apart vermeld. `<source>`-elementen in de heldenfoto, `og:image`, favicon en logo in JSON-LD tellen niet als `<img>`, maar staan wel in sectie C.
- **Interne links:** alle `<a href>` naar een relatief pad of naar salderingsdienst.nl. Genormaliseerd: query, `#anker` en `.html` weggelaten, slash aan het eind weggelaten. Links naar de eigen pagina en kale `#`-ankers tellen niet als doelpagina. Header- en footerlinks tellen mee tenzij 'hoofdtekst' staat vermeld (binnen `<main>`, buiten header, footer en nav).
- **Externe links:** `<a href>` met een ander domein. `www.` is weggelaten bij het tellen van unieke domeinen.
- **Bronvermeldingen:** links naar rijksoverheid.nl, acm.nl, rvo.nl, belastingdienst.nl, cbs.nl, milieucentraal.nl of eerstekamer.nl.
- **FAQ-items:** Home: elementen met klasse `faq-item` (gelijk aan het aantal `Question` in de FAQPage-JSON-LD). Artikelen: `h3` onder de kop 'Veelgestelde vragen'.
- **Tekens:** lengte van `<title>` en `meta description` is `len()` op de waarde met ontsleutelde entiteiten.


## Kernbevindingen

- Gemiddeld 1.770 woorden per artikelpagina (gids 2.060, thuisbatterij 1.479); beide artikelen hebben 3 pagina's die ernaar linken (5 en 4 links) en 3 interne doelpagina's in de hoofdtekst; beide hebben 0 afbeeldingen buiten het wapen in de header.
- 35 `<img>` in de HTML (plus 1 via JavaScript): 0 zonder `alt`, 11 leeg en decoratief, 0 leeg maar inhoudelijk. Van de 25 inhoudelijke afbeeldingen hebben 15 een alt die moet worden aangepast, waarvan 2 onjuist.
- Bronnen: gids 4, thuisbatterij 3, allemaal onderaan; Home en overige pagina's 0.
- Beeldgewicht: 29 beeldbestanden, 2,51 MB; 1 bestand is WebP. Home laadt desktop 2.059,7 KB aan beelden, waarvan 121,5 KB meteen.
- Titels (42 tot 55 tekens) en metabeschrijvingen (142 tot 155) zijn sinds commit `9232a18` binnen de vuistregels.
- Het grootste gat is niet technisch maar inhoudelijk: twee artikelen en geen figuren of diagrammen in de artikelen.

## A. Gemeten waarden per pagina

| Signaal | Home | Advies-gesprek | Kennisbank (hub) | Gids saldering | Thuis-batterij | Privacy | AV consument | AV zakelijk | 404 |
|---|---|---|---|---|---|---|---|---|---|
| Woorden hoofdtekst | 1.031 | 95 | 175 | 2.060 | 1.479 | 340 | 3.419 | 2.856 | 10 |
| Woorden hele body (incl. header, footer, nav) | 1.221 | 205 | 252 | 2.151 | 1.528 | 376 | 3.548 | 2.978 | 58 |
| H1 / H2 / H3 | 1 / 12 / 34 | 1 / 0 / 1 | 1 / 3 / 2 | 1 / 11 / 10 | 1 / 8 / 7 | 1 / 7 / 0 | 1 / 27 / 0 | 1 / 25 / 0 | 1 / 0 / 0 |
| Afbeeldingen (`<img>`, statisch) | 26 | 2 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| Waarvan alt leeg (`alt=""`) | 2 | 2 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| Waarvan alt ontbreekt (attribuut afwezig) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Met `width` en `height` | 26 van 26 | 2 van 2 | 1 van 1 | 1 van 1 | 1 van 1 | 1 van 1 | 1 van 1 | 1 van 1 | 1 van 1 |
| Met `loading="lazy"` | 24 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Interne links uit, totaal | 27 | 26 | 9 | 12 | 12 | 6 | 10 | 9 | 9 |
| Interne links uit, unieke doelpagina's (excl. zichzelf) | 7 | 5 | 7 | 7 | 7 | 3 | 3 | 3 | 6 |
| Idem, alleen vanuit hoofdtekst | 4 | 0 | 2 | 3 | 3 | 0 | 2 | 1 | 3 |
| Interne links in: pagina's die linken (alle posities) | 8 | 5 | 5 | 3 | 3 | 8 | 8 | 8 | 0 |
| Interne links in: aantal links (alle posities) | 34 | 20 | 13 | 5 | 4 | 15 | 12 | 12 | 0 |
| Interne links in: pagina's, alleen vanuit hoofdtekst | 1 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | 0 |
| Interne links in: aantal links, alleen hoofdtekst | 1 | 11 | 3 | 5 | 4 | 2 | 1 | 1 | 0 |
| Externe links uit, totaal | 1 | 1 | 1 | 5 | 4 | 2 | 1 | 1 | 0 |
| Externe links uit, unieke domeinen | 1 | 1 | 1 | 5 | 4 | 2 | 1 | 1 | 0 |
| JSON-LD-types (hoogste niveau) | Organization, WebSite, Service, FAQPage | BreadcrumbList | BreadcrumbList, CollectionPage | BreadcrumbList, Article | BreadcrumbList, Article | BreadcrumbList | BreadcrumbList | BreadcrumbList | geen |
| Title (tekens) | 54 | 50 | 54 | 55 | 46 | 42 | 51 | 48 | 39 |
| Meta description (tekens) | 148 | 142 | 148 | 153 | 152 | 155 | 147 | 151 | ontbreekt |
| FAQ-items | 5 | 0 | 0 | 4 | 4 | 0 | 0 | 0 | 0 |
| Bronvermeldingen (links naar de zeven bron-domeinen) | 0 | 0 | 0 | 4 | 3 | 0 | 0 | 0 | 0 |

Toelichting bij sectie A:

- Hoofdtekst-woorden van `/adviesgesprek` (95) zijn alleen de statische tekst. De boekingsmodule bouwt de rest met JavaScript op; die tekst is niet meegeteld en niet door een crawler zonder JavaScript te zien.
- Alle 11 lege `alt`-attributen zitten op het wapen naast de merknaam (header op elke pagina, footer op Home en Adviesgesprek) en zijn daar juist. Beoordeling per afbeelding: zie `content/concepten/alt-teksten-2026-10.md`.
- De FAQ op Home is gemarkeerd als `FAQPage` (5 vragen). De 4+4 vragen in de artikelen staan niet in structured data.
- Alle zeven bronlinks in de artikelen staan in het blok 'Bronnen' onderaan; er zijn geen bronlinks in de lopende tekst. Alle zeven hebben `rel="nofollow noopener"`.
- Het `citation`-veld in de Article-JSON-LD noemt 3 bronnen (gids) en 2 (thuisbatterij); op de pagina staan er 4 en 3. De ACM-bron (gids) en de Rijksoverheid-bron (thuisbatterij) ontbreken in de structured data.
- Alle externe links op de pagina's zonder bronnen (`wa.me`) zijn de WhatsApp-link in de footer (nieuw sinds commit `9232a18`); die telt als extern domein maar is geen bron.
- Article-JSON-LD: `author` is de organisatie (`@id` .../#organization), geen persoon. Gids: `datePublished` 2026-09-17, `dateModified` 2026-09-23. Thuisbatterij: beide 2026-09-23. De zichtbare tekst zegt op beide pagina's 'laatst gecontroleerd 17 september 2026'; wat 2026-09-23 inhoudelijk was, staat niet op de pagina.
- Geen van de Organization-blokken (Home, hub, artikelen) heeft `sameAs`.

### Externe domeinen per pagina

| Pagina | Domeinen |
|---|---|
| Home | wa.me |
| Advies-gesprek | wa.me |
| Kennisbank (hub) | wa.me |
| Gids saldering | acm.nl, eerstekamer.nl, milieucentraal.nl, rijksoverheid.nl, wa.me |
| Thuis-batterij | belastingdienst.nl, rijksoverheid.nl, rvo.nl, wa.me |
| Privacy | tools.google.com, wa.me |
| AV consument | wa.me |
| AV zakelijk | wa.me |
| 404 | geen |

`tools.google.com` op de privacypagina is de link naar de opt-out-extensie voor Google Analytics, geen bron. `wa.me` is WhatsApp, een contactlink in de footer.

### Wie linkt naar de twee artikelen

| Doel | Vanaf | Links | Waarvan in hoofdtekst |
|---|---|---|---|
| Gids saldering | Home | 2 | 2 |
| Gids saldering | Kennisbank (hub) | 1 | 1 |
| Gids saldering | Thuisbatterij | 2 | 2 |
| Thuisbatterij | Home | 1 | 1 |
| Thuisbatterij | Kennisbank (hub) | 1 | 1 |
| Thuisbatterij | Gids saldering | 2 | 2 |

Alle inkomende links komen van Home, de hub en het andere artikel. De algemene voorwaarden, het privacybeleid, de adviespagina en de 404 linken niet naar de artikelen. Op Home staan de links naar de gids op twee plekken (onder de rekenmodule en in het kennisbanksblok), naar het batterij-artikel op één plek.

## B. Richtwaarden

Alle benchmarks in deze sectie zijn **[vuistregel]**: een redactionele inschatting voor een commerciële Nederlandse adviessite van ongeveer acht pagina's. Het zijn geen eisen van Google en er is voor de meeste drempels geen bewijs dat het overschrijden ervan rankings verandert. De kolom 'Evidentie' zegt per regel waar de regel op steunt. Waar ik geen bron kan aanwijzen, staat dat er.

| Signaal | Nu, hele site | Benchmark [vuistregel] | Gap | Evidentie |
|---|---|---|---|---|
| Woorden per artikelpagina | 2.060 (gids) en 1.479 (thuisbatterij); gemiddeld 1.770 | 1.200 tot 2.500 voor een uitleggids | Geen: beide binnen de band | Geen bewijs dat woordaantal rankt. Google geeft geen minimum. De band is een inschatting om dunne pagina's te signaleren. |
| Woorden kennisbank-hub | 175 | 300 of meer, met eigen introductie boven de kaartjes | Circa 125 woorden | Zelfde als hierboven. De hub is vooral een lijst; de lengte is niet het probleem maar het ontbreken van uitleg per kaartje. |
| Aantal artikelpagina's | 2 (plus hub) | 6 tot 10 rond één thema, voordat topicale dekking beoordeeld kan worden | 4 tot 8 artikelen | Geen harde evidentie voor een aantal. Zie `docs/seo/zoekmarkt-onderzoek-2026-10.md` voor de zoekvragen waar nu geen pagina voor is. |
| Primaire bronnen per artikel | 4 (gids: 3 primair plus Milieu Centraal als secundaire bron), 3 primair (thuisbatterij); allemaal onderaan | 3 of meer primaire, waarvan de kernclaims in de lopende tekst een directe bronlink hebben | Aantal: geen. Plaatsing: 0 inline | Redactionele norm (bronvermelding is voor deze site een eigen voorwaarde in `content/concepten/README.md`). Geen rankingbewijs. |
| Inkomende interne links per artikel (vanaf andere pagina's) | 3 pagina's, 5 links (gids); 3 pagina's, 4 links (thuisbatterij) | 3 of meer relevante pagina's, minstens één vanuit lopende tekst | Formeel geen. Praktisch: er zijn maar 3 relevante bronpagina's (Home, hub, het andere artikel), dus de norm is verzadigd | Interne links helpen crawlers en lezers; een aantal is niet bewezen. Dit gaat pas schuiven met meer content. |
| Uitgaande interne links per artikel, hoofdtekst | 3 doelpagina's (gids), 3 (thuisbatterij) | 3 tot 8 contextuele links naar relevante pagina's | Geen; beperkt door het kleine aantal pagina's | Vuistregel zonder bewijs. |
| Title tot en met 60 tekens | 8 van 8 indexeerbare pagina's; allemaal 42 tot 55 tekens | 60 of minder | Geen | Google noemt geen limiet; langere titels worden vaak afgekapt (pixelbreedte, niet tekens). Alleen weergave-effect. |
| Meta description 120 tot 155 tekens | 8 van 8 binnen band | 120 tot 155 | Geen | Google herschrijft snippets regelmatig en gebruikt de description niet voor ranking. Alleen weergave-effect. |
| Precies één H1 per pagina | 9 van 9 | 1 | Geen | HTML-norm en gangbare praktijk; geen rankingbewijs voor meer of minder. |
| Koppenstructuur artikelen | gids 11 H2 en 10 H3; thuisbatterij 8 H2 en 7 H3 | H2 per 150 tot 300 woorden | Geen (gids circa 187 woorden per H2, thuisbatterij circa 185) | Leesbaarheid. Geen bewijs. |
| Alt-tekst: elke inhoudelijke afbeelding een beschrijvende en juiste alt | 0 ontbrekend, 0 leeg-maar-inhoudelijk; 11 leeg-decoratief (juist). Van 25 inhoudelijke afbeeldingen: 10 goed, 13 zwak, 2 onjuist (alt beschrijft iets wat niet in beeld is) | 100% beschrijvend en juist | 15 wijzigingen (zie `content/concepten/alt-teksten-2026-10.md`) | WCAG 1.1.1; Google adviseert beschrijvende alt voor Afbeeldingen. Rankingeffect niet bewezen. |
| Inhoudelijke afbeeldingen op artikelpagina's | 0 foto's of figuren. Tabellen: 3 (gids), 1 (thuisbatterij). `og:image` is de enige afbeelding | Minstens één eigen figuur of diagram per artikel boven 1.200 woorden | 1 per artikel | Vuistregel. Voorwaarde: de figuur moet iets uitleggen (bijvoorbeeld het rekenvoorbeeld), geen stockfoto. |
| `width` en `height` op elke afbeelding | 35 van 35 | 100% | Geen | Voorkomt layoutverschuiving (CLS). Let op: bij 4 afbeeldingen op Home wijkt de verhouding van de attributen af van het bestand (zie sectie C). |
| Lazy loading onder de vouw, niet op de hoofdafbeelding | Home: heldenfoto zonder lazy en met `fetchpriority="high"`; 24 van 26 lazy; adviesgesprek 1 lazy (footerwapen) | Hero eager, rest lazy | Geen | Gangbare praktijk voor LCP. Niet gemeten met een echte browser. |
| Moderne beeldformaten (WebP of AVIF) | 1 van 29 gerefereerde beeldbestanden is WebP; 0 AVIF | Alle foto's in WebP of AVIF met JPEG als terugval | 28 bestanden | Bestandsgrootte (zie sectie C, indicatie). Rechtstreeks effect op Core Web Vitals is niet gemeten. |
| Beeldgewicht Home (alle `<img>`, desktop) | 2.059,7 KB voor 25 unieke bestanden (waarvan 121,5 KB eager). Detail: sectie C | Onder 1 MB totaal voor beelden op een landingspagina | Circa 1.036 KB boven de norm als alles geladen wordt; eager slechts 121,5 KB | Vuistregel; geen eis. Bij lazy loading is het geladen gewicht lager dan het totaal. |
| Structured data | 8 van 9 pagina's hebben JSON-LD (404 niet, terecht). Home: Organization, WebSite, Service, FAQPage. Artikelen: Article en BreadcrumbList. Hub: CollectionPage en BreadcrumbList. Overige: BreadcrumbList | Organization met `sameAs`; Article met genoemde auteur (persoon) | Auteur is de organisatie; `sameAs` ontbreekt in alle Organization-blokken | Structured data maakt een pagina in aanmerking komend voor weergave, het verhoogt geen ranking. Voor zover bekend beperkte Google FAQ-rijke resultaten sinds augustus 2023 tot overheids- en gezondheidssites; dat is niet in deze sessie nagelopen, verifieer bij Google Search Central voordat u waarde hecht aan de FAQPage op Home. |
| FAQ-items | Home 5 (met FAQPage); gids 4 en thuisbatterij 4 (zonder markup) | 3 tot 6 echte vragen per pagina waar dat past | Geen | Vragen moeten uit echte zoekvragen komen; zie zoekmarktonderzoek. Geen bewijs voor een aantal. |
| Uitgaande externe links | Bronnen: gids 4 domeinen, thuisbatterij 3 domeinen. Overal elders alleen de WhatsApp-link in de footer en één opt-out-link (privacy) | 3 of meer gezaghebbende bronnen per artikel | Geen | Bronnen zijn er; of ze de lezer of zoekmachine vertrouwen geven is niet gemeten. |
| `rel="nofollow"` op bronlinks | Alle 7 bronlinks hebben `nofollow noopener` | Redactionele bronverwijzingen hoeven doorgaans geen `nofollow` (dat is bedoeld voor betaalde of onbetrouwbare links) | Beslissing nodig | Vuistregel op basis van de uitleg van Google over `rel`-waarden; nofollow op bronnen schaadt niet aantoonbaar, het levert ook niets aantoonbaars op. |

Titels en metabeschrijvingen liggen sinds commit `9232a18` allemaal binnen de vuistregels. Vóór die commit waren 4 titels langer dan 60 tekens (69, 66, 66 en 67) en 7 beschrijvingen buiten de band (183, 166, 171, 172, 162 en 176 te lang, 84 te kort).

Eerlijke kanttekening: wat nu nog afwijkt (afbeeldingsformaten, alt-teksten, ontbrekende figuren) beïnvloedt weergave, toegankelijkheid en laadsnelheid, niet aantoonbaar de positie. Het grootste gat voor vindbaarheid is niet dit soort details maar het aantal pagina's: twee artikelen kunnen maar een paar van de twintig vaste zoekvragen uit het zoekmarktonderzoek dekken.

## C. Afbeeldingen

Gemeten met Pillow 12.3.0 op het bestand zoals het in de werkmap staat. 'Indicatie WebP/AVIF' is een in het geheugen berekende schatting (WebP kwaliteit 80, AVIF kwaliteit 60), niets is opgeslagen of omgezet. Werkelijke winst hangt af van de gekozen instellingen; weergavegrootte op het scherm is niet gemeten, dus overmaat (bestand groter dan weergave) is niet vastgesteld.

| Pad | KB | Afmetingen | Formaat | Gebruikt op | WebP/AVIF aanwezig | Indicatie WebP / AVIF (KB) |
|---|---|---|---|---|---|---|
| `assets/salderingsdienst-logo-navy-960x396.png` | 284,3 | 960x396 | PNG | 4 pagina's: json-ld | nee | 20,3 / 14,8 |
| `assets/product-zonnepanelen.jpg` | 235,7 | 1280x720 | JPEG | Home (img) | nee | 183,2 / 127,9 |
| `assets/eerlijk-verhaal-1.jpg` | 215,6 | 1536x1024 | JPEG | Home (img) | nee | 125,2 / 109,2 |
| `assets/eerlijk-verhaal-2.jpg` | 209,4 | 1536x1024 | JPEG | Home (img) | nee | 120,2 / 105,3 |
| `assets/eerlijk-verhaal-3.jpg` | 200,1 | 1536x1024 | JPEG | Home (img) | nee | 110,4 / 96,6 |
| `assets/werkwijze-4.jpg` | 135,6 | 900x1107 | JPEG | Home (img) | nee | 74,6 / 63,7 |
| `assets/product-sturing.jpg` | 126,2 | 1024x563 | JPEG | Home (img) | nee | 97,0 / 77,9 |
| `assets/hero-advies.jpg` | 112,4 | 1385x779 | JPEG | Home (img) | nee | 56,3 / 48,9 |
| `assets/werkwijze-3.jpg` | 108,6 | 900x848 | JPEG | Home (img) | nee | 59,2 / 47,5 |
| `assets/hero-advies-mobile.jpg` | 101,5 | 909x1136 | JPEG | Home (hero-source) | nee | 62,8 / 55,0 |
| `assets/stap-2.jpg` | 91,0 | 1120x747 | JPEG | Home (img) | nee | 46,9 / 43,8 |
| `assets/stap-1.jpg` | 84,9 | 1120x746 | JPEG | Home (img) | nee | 39,5 / 35,4 |
| `assets/adviseur-reener.jpg` | 65,7 | 560x841 | JPEG | Home (img) | nee | 38,1 / 32,1 |
| `assets/hero-advies-960.jpg` | 63,1 | 960x540 | JPEG | Home (hero-source) | nee | 35,5 / 30,1 |
| `assets/og-salderingsdienst.jpg` | 59,7 | 1200x630 | JPEG | 8 pagina's: json-ld, og:image | nee | 42,8 / 38,4 |
| `assets/adviseur-kim.jpg` | 53,3 | 560x747 | JPEG | Home (img) | nee | 30,0 / 26,1 |
| `assets/product-batterij-otgu.jpg` | 52,6 | 1280x720 | JPEG | Home (img) | nee | 15,3 / 14,5 |
| `assets/adviseur-xavier.jpg` | 49,6 | 560x832 | JPEG | Home (img); Adviesgesprek (img via JS) | nee | 25,6 / 23,0 |
| `assets/product-zon.jpg` | 45,4 | 640x426 | JPEG | Home (img) | nee | 27,7 / 23,1 |
| `assets/adviseur-marco.jpg` | 44,9 | 560x747 | JPEG | Home (img) | nee | 23,7 / 20,3 |
| `assets/adviseur-silvester.jpg` | 42,2 | 560x747 | JPEG | Home (img) | nee | 20,9 / 18,9 |
| `assets/adviseur-naomi.jpg` | 39,7 | 560x747 | JPEG | Home (img) | nee | 17,6 / 16,9 |
| `assets/adviseur-pieter.jpg` | 39,5 | 560x747 | JPEG | Home (img) | nee | 17,5 / 16,7 |
| `assets/adviseur-mats.jpg` | 32,1 | 560x747 | JPEG | Home (img) | nee | 21,1 / 19,8 |
| `assets/product-warmtepomp.webp` | 29,9 | 496x310 | WEBP | Home (img) | nee | al WebP / 15,5 |
| `assets/klant-3.jpg` | 14,0 | 256x256 | JPEG | Home (img) | nee | 9,2 / 7,4 |
| `assets/klant-2.jpg` | 12,5 | 256x256 | JPEG | Home (img) | nee | 8,1 / 7,0 |
| `assets/klant-1.jpg` | 9,7 | 256x256 | JPEG | Home (img) | nee | 5,4 / 5,3 |
| `assets/crest-146.png` | 9,1 | 146x160 | PNG | 9 pagina's: favicon, img | WebP-versie bestaat (`crest-146.webp`, niet in gebruik) | 4,2 / 3,1 |

Totaal gerefereerde beeldbestanden: 29 bestanden, 2.568,3 KB (2,51 MB). Hiervan is 1 bestand WebP, 0 AVIF.

### Beeldgewicht per pagina (desktop)

Som van de unieke bestanden achter alle `<img>`-elementen op de pagina (heldenfoto op Home: het desktopbestand). Eager = zonder `loading="lazy"`. Favicon, `og:image` en logo in JSON-LD staan in de laatste kolom; die laden bezoekers niet als beeld op de pagina.

| Pagina | Beeldbestanden (uniek) | Totaal KB | Waarvan eager KB | Alleen voor crawlers en deelkaarten KB |
|---|---|---|---|---|
| Home | 25 | 2.059,7 | 121,5 | 59,7 |
| Adviesgesprek | 1 | 9,1 (plus 49,6 KB `adviseur-xavier.jpg` in het bevestigingsscherm, via JS) | 9,1 | 59,7 |
| Kennisbank (hub) | 1 | 9,1 | 9,1 | 59,7 |
| Gids saldering | 1 | 9,1 | 9,1 | 59,7 |
| Thuisbatterij | 1 | 9,1 | 9,1 | 59,7 |
| Privacy | 1 | 9,1 | 9,1 | 59,7 |
| AV consument | 1 | 9,1 | 9,1 | 59,7 |
| AV zakelijk | 1 | 9,1 | 9,1 | 59,7 |
| 404 | 1 | 9,1 | 9,1 | 0,0 |

Home op een telefoon (kleiner dan 700 px) laadt `hero-advies-mobile.jpg` (101,5 KB) in plaats van `hero-advies.jpg` (112,4 KB); tussen 700 en 900 px `hero-advies-960.jpg` (63,1 KB). De gegevens in de `<source>`-elementen kloppen met de bestandsafmetingen (909x1136, 960x540).

### Verhouding `width`/`height` wijkt af van het bestand

| Bestand | Attribuut | Bestand | Opmerking |
|---|---|---|---|
| `assets/product-sturing.jpg` | 640x400 | 1024x563 | verhouding 1.60 tegen 1.82; effect op layout hangt af van de CSS (niet gemeten) |
| `assets/product-zon.jpg` | 640x400 | 640x426 | verhouding 1.60 tegen 1.50; effect op layout hangt af van de CSS (niet gemeten) |
| `assets/stap-1.jpg` | 560x360 | 1120x746 | verhouding 1.56 tegen 1.50; effect op layout hangt af van de CSS (niet gemeten) |
| `assets/stap-2.jpg` | 560x360 | 1120x747 | verhouding 1.56 tegen 1.50; effect op layout hangt af van de CSS (niet gemeten) |

### Aanbevolen conversies (alleen een lijst, niets omgezet)

Volgorde naar verwachte winst in KB (indicatie, zie tabel):

1. `assets/salderingsdienst-logo-navy-960x396.png`: 284,3 KB naar circa 20,3 KB (WebP). Winst circa 264 KB. Wordt alleen als logo in JSON-LD gebruikt en is niet zichtbaar op de pagina. 284 KB is voor een logo van 960 px opvallend hoog; opnieuw exporteren als geoptimaliseerde PNG of als WebP.
2. `assets/eerlijk-verhaal-1.jpg`: 215,6 KB naar circa 125,2 KB (WebP). Winst circa 90 KB.
3. `assets/eerlijk-verhaal-3.jpg`: 200,1 KB naar circa 110,4 KB (WebP). Winst circa 90 KB.
4. `assets/eerlijk-verhaal-2.jpg`: 209,4 KB naar circa 120,2 KB (WebP). Winst circa 89 KB.
5. `assets/werkwijze-4.jpg`: 135,6 KB naar circa 74,6 KB (WebP). Winst circa 61 KB.
6. `assets/hero-advies.jpg`: 112,4 KB naar circa 56,3 KB (WebP). Winst circa 56 KB.
7. `assets/product-zonnepanelen.jpg`: 235,7 KB naar circa 183,2 KB (WebP). Winst circa 52 KB.
8. `assets/werkwijze-3.jpg`: 108,6 KB naar circa 59,2 KB (WebP). Winst circa 49 KB.
9. `assets/stap-1.jpg`: 84,9 KB naar circa 39,5 KB (WebP). Winst circa 45 KB.
10. `assets/stap-2.jpg`: 91,0 KB naar circa 46,9 KB (WebP). Winst circa 44 KB.

Alle 28 niet-WebP-bestanden samen: circa 1.200 KB winst van 2.538 KB bij WebP kwaliteit 80 (indicatie). Dat omvat ook `og-salderingsdienst.jpg` en de favicon, die u volgens de lijst hieronder beter kunt laten staan.

Overige punten:

- Lever foto's met `<picture>` en JPEG als terugval; de heldenfoto gebruikt al `<picture>` met drie varianten, daar zijn alleen `type`-bronnen voor WebP of AVIF nodig.
- `assets/crest-146.webp` (5,2 KB) bestaat al naast `crest-146.png` (9,1 KB) maar de pagina's verwijzen naar de PNG, ook als favicon (`<link rel="icon" href="assets/crest-146.png">`). Een favicon blijft doorgaans beter PNG of ICO; voor de zichtbare merkafbeelding in de header kan WebP.
- `og:image` (`og-salderingsdienst.jpg`, 1200x630) blijft JPEG: sociale platforms en sommige crawlers gaan niet altijd goed om met WebP of AVIF. (Vuistregel, niet gecontroleerd per platform.)
- Beeldmaten: `eerlijk-verhaal-1/2/3.jpg` (1536x1024) en `product-zonnepanelen.jpg` (1280x720) zijn de zwaarste afzonderlijke bestanden (circa 200 tot 236 KB elk). Of ze groter zijn dan de weergavegrootte is niet gemeten; controleer in de browser voordat u verkleint.

### Bestanden in `assets/` zonder verwijzing

Deze bestanden worden door geen van de negen pagina's of `js/booking.js` aangeroepen. Op Vercel zijn ze wel publiek bereikbaar via `/assets/...` zodra ze in de repository staan. Nieuw (ongetrackt in git): de vier eerste regels hieronder.

| Bestand | KB | Afmetingen | Opmerking |
|---|---|---|---|
| `assets/Adviseur Mats.webp` | 86,0 | 1086x1448 | ongetrackt in git; spatie in bestandsnaam, geef een URL-vriendelijke naam voor gebruik |
| `assets/crest-146.webp` | 5,2 | 146x160 |  |
| `assets/crest.png` | 175,2 | 427x467 |  |
| `assets/foto adviseur 7 silvester.png` | 1.711,3 | 1086x1448 | ongetrackt in git; spatie in bestandsnaam, geef een URL-vriendelijke naam voor gebruik; 1,7 MB, vóór gebruik omzetten |
| `assets/logo-optie2-crest-wit-960x396.png` | 80,7 | 960x396 |  |
| `assets/logo-wordmark.png` | 175,2 | 427x467 |  |
| `assets/product-batterij.jpg` | 106,0 | 1280x853 |  |
| `assets/qr.png` | 109,7 | 492x453 |  |
| `assets/stap-3.jpg` | 110,3 | 1120x840 |  |
| `assets/stap-4.jpg` | 44,7 | 1024x1024 |  |
| `assets/warmtepomp.png` | 517,4 | 521x570 | ongetrackt in git |
| `assets/warmtepomp1.png` | 507,6 | 623x429 | ongetrackt in git |
| `assets/werk-1.jpg` | 106,7 | 1280x853 |  |
| `assets/werk-2.jpg` | 139,9 | 1280x1050 |  |
| `assets/werk-3.jpg` | 102,3 | 1280x960 |  |
| `assets/werk-4.webp` | 30,4 | 504x340 |  |

Daarnaast staan er de lege mappen `assets/New folder` en `assets/laatste godutch`.
