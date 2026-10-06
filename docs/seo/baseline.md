# Baseline — salderingsdienst.nl

Stand van zaken per URL en per meetsysteem. Eerste meting: 2026-10-06 (operator plus crawl-agent). Elke volgende meting komt als nieuwe gedateerde sectie onder "Vervolgmetingen"; de nulmeting blijft staan.

## A. Meetsystemen (2026-10-06)

| Systeem | Werkt? | Toegang operator | Wat ontbreekt |
|---|---|---|---|
| Google Search Console | Domein geverifieerd via DNS-TXT (`google-site-verification=…` op salderingsdienst.nl) | Nee: geen connector, geen export | Pieter: export van Prestaties (laatste 3 maanden, per pagina en per zoekopdracht) en van het Generative AI-rapport (`…/performance/search-analytics/ai`), of een service-account met alleen leesrechten |
| Bing Webmaster Tools | **Niet geverifieerd** (BingSiteAuth.xml 404, geen msvalidate.01-tag) | Nee | Pieter: account aanmaken, site importeren vanuit Search Console, AI Performance-rapport aanzetten |
| GA4 (G-XN788FNCZS) | Actief sinds 25 sept 2026, zonder cookiebalk, IP-anonimisering aan, advertentiesignalen uit; ruim dertig sdTrack-events komen aan | Nee | Pieter: export of leesrechten op de GA4-property; bevestiging dat de verwerkersovereenkomst en de instelling "geen deling met Google" in het account staan (voorwaarde voor consent-vrij meten) |
| Vercel Web Analytics | **Niet actief** (geen `/_vercel/insights`-script) | Website-project zit niet in het gekoppelde Vercel-account | Pieter: besluit of Vercel Web Analytics erbij komt (cookieloos, voorkeur in de opdracht) |
| Supabase `sd_bookings` | Werkt; 1 echte lead (2026-09-18) plus testlead TEST-ATTR-001 van de operator | Ja, lezen via connector | Attributievelden in `source` zijn per 2026-10-06 in de code (commit 85a0241), nog niet live |
| Pipedrive | Koppeling werkt (deal per boeking); herkomstblok in de notitie was altijd leeg door niet-overeenkomende veldnamen | Nee | Na deploy vult het herkomstblok zich |
| AI-zichtbaarheid (handmatig) | Nulmeting nog niet uitgevoerd | Deels: ChatGPT en Perplexity kan de operator uitgelogd bekijken; Google AI Mode en Copilot vereisen een ingelogd account | Pieter: eerste meting samen uitvoeren volgens de instructie in `zoekmarkt-onderzoek-2026-10.md` §5.2 |

### Leads (nulmeting uit `sd_bookings`, 2026-10-06)

| Meting | Waarde |
|---|---|
| Leads totaal (echt) | 1 (2026-09-18) |
| Waarvan gekwalificeerd (verkoopbaar) | 1 |
| Met UTM / referrer / landingspagina in `source` | 0 / 0 / 0 |
| Leads via organisch of AI-zoeken aantoonbaar | niet vast te stellen (geen attributie) |

Leesquery voor de wekelijkse meting (na deploy van commit 85a0241):

```sql
select date_trunc('week', created_at) as week,
       source->>'verkeerskanaal' as verkeerskanaal,
       source->>'landing' as landing,
       count(*) as leads,
       count(*) filter (where verkoopbaar) as gekwalificeerd
from sd_bookings
where ref not like 'TEST-%'
group by 1,2,3 order by 1 desc, 4 desc;
```

### Zoekvragen en AI-zichtbaarheid
De vaste set van 20 commerciële zoekvragen, de waargenomen top-3 (benadering, Amerikaanse index) en de meetinstructie staan in `zoekmarkt-onderzoek-2026-10.md`. Nulpunt: salderingsdienst.nl komt bij geen van de 20 vragen voor.

### Niet gemeten (en waarom)
- Impressies, klikken, AI-impressies: geen toegang tot Search Console en Bing.
- Copilot-citaties: geen Bing-account.
- Core Web Vitals (PageSpeed Insights): sleutelloze API gaf 429; geen lokale Lighthouse gedraaid.
- Vercel-firewall van het website-project: project niet in het gekoppelde account. Via curl laten Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot, ClaudeBot en GPTBot allemaal 200 en identieke HTML zien, dus er is geen aanwijzing voor een blokkade.

## B. Technische baseline (crawl 2026-10-06)

Gemeten met curl en de browser-pane. Live is byte-identiek aan git HEAD `a81cf6a` (= origin/main).

### 1. URL-inventaris

#### 1a. Status, redirects, canonical, robots

| URL | Status | Eindpunt | Canonical (klopt?) | Meta robots | Opmerking |
|---|---|---|---|---|---|
| / | 200 | zelf | `/` (ja) | index,follow | |
| /adviesgesprek | 200 | zelf | ja | index,follow | |
| /kennisbank/salderingsregeling-gids | 200 | zelf | ja | index,follow,max-snippet:-1,max-image-preview:large | |
| /kennisbank/thuisbatterij-na-2027 | 200 | zelf | ja | idem | |
| /kennisbank | 200 | zelf | ja | idem | |
| /algemene-voorwaarden | 200 | zelf | ja | index,follow | |
| /algemene-voorwaarden-zakelijk | 200 | zelf | ja | index,follow | |
| /privacybeleid | 200 | zelf | ja | index,follow | bevat placeholders, zie sectie 2 |
| /portal | 200 | zelf | geen (n.v.t.) | noindex,nofollow | niet in sitemap |
| /widget | 200 | zelf | geen (n.v.t.) | noindex | niet in sitemap, geen H1 |
| /sitemap.xml | 200 | zelf | n.v.t. | n.v.t. | `application/xml`, 8 loc's, geen dubbelen |
| /robots.txt | 200 | zelf | n.v.t. | n.v.t. | `text/plain; charset=utf-8` |
| /sitemap-images.xml | 404 | zelf | n.v.t. | n.v.t. | zie 1d |
| /google-verificatie | 404 | zelf | n.v.t. | n.v.t. | `.html`-variant geeft 308 en dan 404 |

#### 1b. Redirectbronnen uit vercel.json

| Bron | Eerste hop | Eindstatus / eindpunt | Oordeel |
|---|---|---|---|
| /kennisbank/artikel | 308 | 200 /kennisbank/thuisbatterij-na-2027 | werkt |
| /voorwaarden | 307 | 200 /algemene-voorwaarden | werkt (tijdelijk) |
| /algemene-voorwaarden-consumenten | 307 | 200 /algemene-voorwaarden | werkt (tijdelijk) |
| /over-ons | 307 | 200 /#over-ons | werkt (tijdelijk) |
| /aanvraag | 307 | 200 /adviesgesprek | werkt (tijdelijk) |
| /gratis-adviesgesprek | 307 | 200 /adviesgesprek | werkt (tijdelijk) |
| /Salderingsdienst v2.dc.html, v1.dc.html, /Salderingsdienst.dc.html, /Salderingsdienst (standalone).html, /SalderingsDienst Landingspagina.html, /Kennisbank.dc.html, /Privacybeleid.dc.html, /Blog Pillar.dc.html, /Blog Cluster.dc.html | 308 naar dezelfde URL zonder `.html` | 404 | **werkt niet** |

De legacy-redirects werken niet: `cleanUrls` onderschept de `.html`-bronnen eerst. Voorbeeld: `/Salderingsdienst%20v2.dc.html` geeft 308 naar `/Salderingsdienst%20v2.dc` en daar 404.

Overig gedrag: `/adviesgesprek/` 308 naar `/adviesgesprek`; `/index.html` 308 naar `/`; `?utm_source=x` blijft 200; `/Adviesgesprek` (hoofdletter) 404; de 404-pagina is kale tekst (79 bytes, `text/plain`) zonder merk of links.

#### 1c. Protocol en hostvarianten

| Variant | Resultaat |
|---|---|
| https://www.salderingsdienst.nl/ | 200 |
| https://salderingsdienst.nl/ | 308 naar https://www (1 hop) |
| http://www.salderingsdienst.nl/ | 308 naar https://www (1 hop) |
| http://salderingsdienst.nl/ | 308 naar https://salderingsdienst.nl/, dan 308 naar https://www (2 hops) |

#### 1d. Niet-gedeployde bestanden
`sitemap-images.xml` en `google-verificatie.html` zijn getrackt in git, maar `tools/build-check.mjs` kopieert ze niet naar `public/`; daarom live 404. Geen gedeployd bestand verwijst ernaar. `sitemap-images.xml` verwijst naar assets die niet meer bestaan.

#### 1e. On-page elementen

| Pagina | Titel (tekens) | Meta description (tekens) | H1 | H2 | JSON-LD @types |
|---|---|---|---|---|---|
| / | "SalderingsDienst \| Advies en oplossingen voor uw zonnepanelen na 2027" (69) | 183 | Eerst uw situatie begrijpen. Dan pas adviseren. | 12 | Organization, WebSite, Service, FAQPage |
| /adviesgesprek | "Plan uw kosteloze adviesgesprek \| SalderingsDienst" (50) | 121 | Plan uw kosteloze adviesgesprek. | 0 | BreadcrumbList |
| /kennisbank/salderingsregeling-gids | "Einde salderingsregeling 2027: wat verandert er en wat kost het u?" (66) | 171 | idem als titel | 11 | BreadcrumbList, Article |
| /kennisbank/thuisbatterij-na-2027 | "Verdient een thuisbatterij zich terug na 2027? De eerlijke rekensom" (67) | 172 | idem als titel | 8 | BreadcrumbList, Article |
| /kennisbank | "Kennisbank: het einde van de salderingsregeling \| SalderingsDienst" (66) | 166 | Wat het einde van saldering werkelijk betekent. | 3 | BreadcrumbList, CollectionPage |
| /algemene-voorwaarden | "Algemene voorwaarden consumenten \| SalderingsDienst" (51) | 162 | Algemene voorwaarden consumenten | 27 | BreadcrumbList |
| /algemene-voorwaarden-zakelijk | "Algemene voorwaarden zakelijk \| SalderingsDienst" (48) | 176 | Algemene voorwaarden zakelijk | 25 | BreadcrumbList |
| /privacybeleid | "Privacy- & cookiebeleid \| SalderingsDienst" (42) | 84 | Privacy- & cookiebeleid | 7 | BreadcrumbList |
| /portal | "Portal \| SalderingsDienst" (25) | geen | Boekingen & kwalificatie | 0 | geen |
| /widget | "Plan uw gratis adviesgesprek \| SalderingsDienst" (47) | geen | geen H1 | 0 | geen |

Alle 8 indexeerbare pagina's hebben precies één H1. Drie titels zijn langer dan circa 60 tekens; zes beschrijvingen langer dan 160 tekens. `/adviesgesprek` heeft in de statische HTML geen H2.

| Pagina | Interne links totaal / unieke doelpagina's | #-anchors | Externe links | Img totaal / zonder niet-lege alt | lang / hreflang | og:title / og:image |
|---|---|---|---|---|---|---|
| / | 25 / 6 | 18 | 1 | 26 / 4 | nl / geen | ja / ja |
| /adviesgesprek | 24 / 5 | 5 | 1 | 2 / 2 | nl / geen | ja / ja |
| /kennisbank/salderingsregeling-gids | 9 / 4 | 10 | 5 | 1 / 1 | nl / geen | ja / ja |
| /kennisbank/thuisbatterij-na-2027 | 9 / 4 | 0 | 4 | 1 / 1 | nl / geen | ja / ja |
| /kennisbank | 6 / 4 | 0 | 0 | 1 / 1 | nl / geen | ja / ja |
| /algemene-voorwaarden | 10 / 4 | 28 | 2 | 1 / 1 | nl / geen | ja / ja |
| /algemene-voorwaarden-zakelijk | 9 / 4 | 25 | 1 | 1 / 1 | nl / geen | ja / ja |
| /privacybeleid | 5 / 2 | 0 | 1 | 1 / 1 | nl / geen | ja / ja |
| /portal | 1 / 1 | 0 | 2 | 1 / 1 | nl / geen | nee / nee |
| /widget | 1 / 1 | 0 | 0 | 1 / 1 | nl / geen | nee / nee |

- Hreflang: nergens (monolinguaal, in orde).
- Open Graph en Twitter: op alle indexeerbare pagina's aanwezig en kloppend; `og:image` 1200x630 geeft 200.
- Lege alt-teksten: home 2x `crest-146.png` (decoratief) en `eerlijk-verhaal-2.jpg` en `eerlijk-verhaal-3.jpg` (inhoudsfoto's met `alt=""`). Elders alleen het decoratieve logo.
- Externe links: alle 7 bronlinks (rijksoverheid, rvo, belastingdienst, acm, eerstekamer, milieucentraal, Google-opt-out) geven 200.
- Alle interne hrefs eindigen op `.html` (zie sectie 3).

### 2. Entiteit en commerciële herkenbaarheid

De footer vult telefoon, KvK-nummer en WhatsApp via `window.SD_CONFIG` (JavaScript) in. In de statische HTML van de home en `/adviesgesprek` staat dus een leeg "Telefoon:" en "KvK" zonder nummer.

| Pagina | "De Salderingsdienst B.V." | KvK 42165216 zichtbaar | Vestigingsadres | Tel / mail / WhatsApp | Niet-overheid-disclaimer |
|---|---|---|---|---|---|
| / | nee | ja, alleen na JavaScript | ja (footer, statisch) | tel en WhatsApp alleen na JavaScript, mail statisch | **nee** (alleen in JSON-LD) |
| /adviesgesprek | nee | ja, alleen na JavaScript | ja | idem | **nee** |
| /kennisbank/salderingsregeling-gids | nee | ja (footer, statisch) | nee | alleen mail in lopende tekst | ja: "Particuliere onderneming, geen onderdeel van de Rijksoverheid" |
| /kennisbank/thuisbatterij-na-2027 | nee | ja | nee | alleen mail | ja (idem) |
| /kennisbank | nee | ja | nee | geen | ja (idem) |
| /algemene-voorwaarden | ja (5x), art. 1 met adres, KvK en btw NL851987461B01 | ja | ja | mail | ja, art. 1.2: "geen overheidsinstantie" |
| /algemene-voorwaarden-zakelijk | ja (3x) | ja | ja | mail | ja, art. 1.2: "niet namens de overheid" |
| /privacybeleid | nee, alleen "SalderingsDienst" | ja, alleen footer | **nee** | **nee** | nee |

Organization-JSON-LD op de home: aanwezig zijn `name` "SalderingsDienst", `url`, `logo`, `image`, `description`, `telephone`, `email`, `address` (Jonas Daniël Meijerplein 25 C 2, 1011 RG Amsterdam), `identifier` (KvK 42165216), `areaServed` en `disambiguatingDescription` ("particuliere onderneming en maakt geen deel uit van de Rijksoverheid"). **Ontbreken:** `legalName` ("De Salderingsdienst B.V." staat nergens buiten de voorwaarden), `contactPoint`, `sameAs`, `vatID`. FAQPage heeft 5 vragen.

Overheidsschijn: de woorden "aanslag" en "verplicht" in officiële betekenis komen niet voor. Het risico zit in de merknaam zonder "B.V." op de home en `/adviesgesprek` zonder zichtbare disclaimer, en in `/privacybeleid` dat het bedrijf "een onafhankelijke adviesorganisatie" noemt (botst met de voorwaarden en de positionering als leverancier).

**Placeholders live op `/privacybeleid`:** banner "deze privacyverklaring is een werkdocument … door een jurist gecontroleerd"; "Laatst bijgewerkt: juli 2026"; drie keer "TE VERVANGEN" (contactgegevens en KvK, grondslag adreslijst, bewaartermijnen); leeg "e-mailadres" bij klachten; "gegevens onderaan de pagina" die er niet staan.

### 3. Interne links

| Van | Naar (ankertekst) |
|---|---|
| / | /kennisbank; /adviesgesprek (3x); gids (incl. `#rekenen`); thuisbatterij; /privacybeleid (incl. `#klachten`); /algemene-voorwaarden |
| /adviesgesprek | / (logo, Home, nav-ankers); /kennisbank; /algemene-voorwaarden; /privacybeleid |
| gids | /; /adviesgesprek; /kennisbank; thuisbatterij |
| thuisbatterij | /; /adviesgesprek; /kennisbank; gids |
| /kennisbank | /; /adviesgesprek; gids; thuisbatterij |
| /algemene-voorwaarden | /; /algemene-voorwaarden-zakelijk; /privacybeleid |
| /algemene-voorwaarden-zakelijk | /; /algemene-voorwaarden; /privacybeleid |
| /privacybeleid | /; /algemene-voorwaarden |
| /portal, /widget | alleen naar / |

| Doelpagina | Inbound vanaf andere indexeerbare pagina's |
|---|---|
| / | 7 |
| /adviesgesprek | 4 |
| /kennisbank | 4 |
| /kennisbank/salderingsregeling-gids | 3 |
| /kennisbank/thuisbatterij-na-2027 | 3 |
| /algemene-voorwaarden | 4 |
| /privacybeleid | 4 |
| /algemene-voorwaarden-zakelijk | **1** |

- Geen orphans. `/algemene-voorwaarden-zakelijk` heeft maar 1 inbound.
- `/portal` en `/widget` hebben 0 inbound (gewenst).
- Alle interne hrefs eindigen op `.html`; elke interne klik is een 308-hop naar de schone URL. Canonicals en sitemap zijn wel schoon.
- Drie navigatie-/footersjablonen (volledig op / en /adviesgesprek; minimaal op kennisbankpagina's zonder links naar voorwaarden en privacy; juridisch op voorwaarden en privacy). `/kennisbank` mist "Kennisbank" in de eigen nav.

### 4. Bots en indexeerbaarheid

Getest met Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot, ClaudeBot, GPTBot en gewone curl op `/` en de gids: alle 200, body byte-identiek (md5 gelijk), H1 aanwezig, geen `X-Robots-Tag`, geen challenge-pagina, geen cloaking.

Headers: `text/html; charset=utf-8`; `Cache-Control: public, max-age=0, must-revalidate` op HTML, css en js; `/assets/*` 7 dagen; HSTS, nosniff, Referrer-Policy, Permissions-Policy aanwezig.

`/portal`: `noindex,nofollow`; `/widget`: `noindex`; beide niet in de sitemap en bewust niet in robots.txt. robots.txt: 12 User-agent-groepen, allemaal `Allow: /`, één absolute `Sitemap:`-regel die 200 geeft, byte-identiek aan HEAD.

### 5. Core Web Vitals (lab)

PageSpeed Insights: **niet gemeten** (HTTP 429 op de sleutelloze API, 4 van 4 aanroepen).

Browser-pane, home, desktop 1280px, warme cache (indicatief): TTFB 32 ms, DOMContentLoaded 278 ms, Load 454 ms, waargenomen CLS 0, geen long tasks, LCP niet gemeten. Mobiel 375px: geen horizontale scroll, hero laadt de mobiele variant, 14 klikdoelen kleiner dan 24px (niet verder gevalideerd).

Paginagewicht (brotli): home HTML 13,8 KB, main.css 25,9 KB, JS 13,3 KB, afbeeldingen circa 2,1 MB als alles laadt (totaal circa 2,2 MB); gids totaal circa 53 KB. De hero is 115 KB desktop / 104 KB mobiel met `fetchpriority="high"`, alle `img` hebben width/height, onder de vouw `loading="lazy"`. Grootste afbeeldingen: product-zonnepanelen.jpg 241 KB, eerlijk-verhaal-1/2/3.jpg 205–221 KB, werkwijze-4.jpg 139 KB, product-sturing.jpg 129 KB; alleen product-warmtepomp.webp is WebP.

### 6. Repo versus live

Alle publieke bestanden byte-identiek aan HEAD `a81cf6a`.

| Pagina | sitemap lastmod | Laatste commit | Oordeel |
|---|---|---|---|
| / | 2026-09-17 | 2026-09-25 | te oud |
| /adviesgesprek | 2026-09-17 | 2026-09-25 | te oud |
| /kennisbank | 2026-09-17 | 2026-09-25 | te oud |
| gids | 2026-09-17 | 2026-09-25 (grondig herschreven 09-23) | te oud |
| thuisbatterij | 2026-09-17 | eerste commit 2026-09-23 | **onmogelijk** |
| /privacybeleid | 2026-09-17 | 2026-09-25 | te oud |
| /algemene-voorwaarden(-zakelijk) | 2026-09-24 | 2026-09-25 (alleen analytics-tag) | redelijk |

`datePublished`/`dateModified` van beide artikelen (2026-09-17) hebben hetzelfde probleem.

### 7. Prioriteitenlijst (fase 2-werk)

**Kritiek**
1. Placeholders en werkdocument-banner live op `/privacybeleid` (indexeerbaar, in de sitemap, gelinkt vanuit elke footer en vanuit "Klachtenmeldpunt").
2. Home en `/adviesgesprek` tonen geen zichtbare "geen overheid"-disclaimer en nergens de juridische naam De Salderingsdienst B.V.

**Belangrijk**
3. Alle interne links lopen via een 308 (`.html`-hrefs plus `cleanUrls`).
4. KvK, telefoon en WhatsApp alleen zichtbaar na JavaScript op home en `/adviesgesprek`; crawlers zonder JS (veel AI-bots) zien geen entiteitsgegevens.
5. Organization-JSON-LD mist `legalName`, `contactPoint`, `sameAs`, `vatID`.
6. Sitemap-lastmod en artikeldata kloppen niet.
7. Negen legacy-redirects in vercel.json werken niet.
8. Article-JSON-LD verwijst via `@id` naar `#organization` dat op die pagina niet is gedefinieerd; geen auteur.
9. `/privacybeleid` noemt het bedrijf "onafhankelijke adviesorganisatie".
10. `/algemene-voorwaarden-zakelijk` heeft 1 inbound link.
11. Kennisbankpagina's missen footerlinks naar voorwaarden en privacy; `/kennisbank` mist "Kennisbank" in de nav.
12. Performance niet gemeten; home circa 2,1 MB afbeeldingen, bijna alles JPEG.

**Cosmetisch**
13. Meta descriptions boven 160 tekens (home 183, zakelijk 176, thuisbatterij 172, gids 171, kennisbank 166, voorwaarden 162); privacy 84 (kort). Titels 66–69 tekens op home, artikelen en kennisbank.
14. `/adviesgesprek` zonder H2 in de statische HTML.
15. `eerlijk-verhaal-2.jpg` en `-3.jpg` met `alt=""`.
16. Favicon 146x160 (niet vierkant), `/favicon.ico` 404.
17. Tijdelijke 307-redirects kunnen permanent.
18. `http://salderingsdienst.nl` 2 hops.
19. css/js `max-age=0`.
20. 404-pagina kale tekst.
21. Verouderd head-commentaar ("GA4 achter de cookiebalk").
22. FAQPage-markup levert voor de meeste sites geen rich result meer op (algemene kennis, niet gemeten).

## Vervolgmetingen

_(nog geen)_
