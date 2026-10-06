# Concept: Organization-JSON-LD op de home (oktober 2026)

Status: concept, niet gepubliceerd. Opgesteld 2026-10-06. Lost baseline §2 en §7 punt 5 op: `legalName`, `vatID`, `contactPoint` en `sameAs` ontbreken.

## Claimtabel

| # | Bewering | Getal | Bron (URL + datum) of aanname | Juridisch open? | Akkoord (P/R) |
|---|---|---|---|---|---|
| 1 | `legalName` De Salderingsdienst B.V. | n.v.t. | `algemene-voorwaarden.html` art. 1.1 (repo, 2026-10-06) | nee | [ ] |
| 2 | `vatID` | NL851987461B01 | voorwaarden art. 1.1 | nee | [ ] |
| 3 | KvK in `identifier` (bestaat al) | 42165216 | voorwaarden art. 1.1 | nee | [ ] |
| 4 | `contactPoint`: telefoon, e-mail, klantenservice, Nederlands, werkdagen 9:00 tot 17:00 | +31639369781 | `SD_CONFIG` en footer `index.html` | nee | [ ] |
| 5 | `sameAs` | geen | Repo doorzocht op linkedin.com, facebook.com, instagram.com, Google Maps/Business en kvk.nl (buiten `.claude/`, `public/`, `archive/`): niets gevonden (2026-10-06) | nee | [ ] |
| 6 | "via gecertificeerde partners" (staat nu in Organization en Service) | n.v.t. | aanname: in de repo staat niet welke certificering het betreft | ja, S1: certificering benoemen en onderbouwen, of in JSON-LD "installatiepartners" schrijven (voorstel hieronder) | [ ] |
| 7 | "subsidie" als onderdeel van de levering (Service.description) | n.v.t. | feitenblad: geen ISDE en geen landelijke subsidie voor een thuisbatterij; subsidie voor zonnepanelen of warmtepomp niet in het feitenblad | ja, S2: weghalen (voorstel) of per product onderbouwen | [ ] |
| 8 | Assortiment: zonnepanelen, thuisbatterij, warmtepomp, slimme energiesturing | n.v.t. | productkaarten `index.html` sectie `#oplossingen` (h3's); commit 8b8dca9 "Warmtepomp toegevoegd" | nee | [ ] |
| 9 | `disambiguatingDescription` met de juridische naam en de niet-overheidsregel | n.v.t. | voorwaarden art. 1.2; zie `footer-entiteit-2026-10.md` F1 | ja, F1 (RVO toegevoegd) | [ ] |

## Voorgestelde Organization-node

Vervangt het eerste object in `@graph` (`"@type":"Organization"`).

```json
{
  "@type":"Organization",
  "@id":"https://www.salderingsdienst.nl/#organization",
  "name":"SalderingsDienst",
  "legalName":"De Salderingsdienst B.V.",
  "url":"https://www.salderingsdienst.nl/",
  "logo":{
    "@type":"ImageObject",
    "url":"https://www.salderingsdienst.nl/assets/salderingsdienst-logo-navy-960x396.png",
    "width":960,
    "height":396
  },
  "image":"https://www.salderingsdienst.nl/assets/og-salderingsdienst.jpg",
  "description":"SalderingsDienst adviseert huiseigenaren met zonnepanelen over het einde van de salderingsregeling en levert desgewenst zonnepanelen, een thuisbatterij, een warmtepomp en slimme energiesturing, inclusief installatie via installatiepartners.",
  "telephone":"+31639369781",
  "email":"info@salderingsdienst.nl",
  "address":{
    "@type":"PostalAddress",
    "streetAddress":"Jonas Daniël Meijerplein 25 C 2",
    "postalCode":"1011 RG",
    "addressLocality":"Amsterdam",
    "addressCountry":"NL"
  },
  "vatID":"NL851987461B01",
  "identifier":[
    {"@type":"PropertyValue","propertyID":"KvK","value":"42165216"}
  ],
  "contactPoint":{
    "@type":"ContactPoint",
    "contactType":"customer service",
    "telephone":"+31639369781",
    "email":"info@salderingsdienst.nl",
    "availableLanguage":"nl",
    "areaServed":"NL",
    "hoursAvailable":{
      "@type":"OpeningHoursSpecification",
      "dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],
      "opens":"09:00",
      "closes":"17:00"
    }
  },
  "areaServed":{"@type":"Country","name":"Nederland"},
  "knowsLanguage":"nl-NL",
  "disambiguatingDescription":"SalderingsDienst (De Salderingsdienst B.V.) is een particuliere onderneming, geen onderdeel van de overheid, en handelt niet namens de Rijksoverheid, RVO, het Nationaal Warmtefonds, SVn of een gemeente."
}
```

`sameAs` is weggelaten: er is in de repo geen LinkedIn-, Google Bedrijfsprofiel- of ander profiel gevonden. Komt er een echt profiel bij, voeg dan `"sameAs":["<url>"]` toe. Geen KvK-zoekpagina als `sameAs` gebruiken; het KvK-nummer staat al in `identifier`.

## WebSite- en Service-node

- **WebSite** (`#website`): consistent, geen wijziging nodig.
- **Service** (`#adviesdienst`), twee aanpassingen:
  - `serviceType`: warmtepomp en zonnepanelen ontbreken. Voorstel: `"Energieadvies en levering van zonnepanelen, thuisbatterijen, warmtepompen en slimme energiesturing"`.
  - `description`: "levering, subsidie en installatie via gecertificeerde partners" wordt `"levering en installatie via installatiepartners"` (S1, S2). Volledige voorgestelde tekst: `"Kosteloos en vrijblijvend adviesgesprek voor huiseigenaren met zonnepanelen over het einde van de salderingsregeling per 1 januari 2027. Wie dat wil, kan de geadviseerde oplossing direct via SalderingsDienst afnemen: levering en installatie via installatiepartners."`
- Buiten deze node, ter info: dezelfde woorden "subsidie" en "gecertificeerde partners" staan ook in de zichtbare tekst van de home (r. 204, 379, 676). Die tekst valt onder S1 en S2 en moet meebewegen, anders zegt de JSON-LD iets anders dan de pagina.
- Ook buiten deze node: de Article-JSON-LD van beide artikelen verwijst met `author`/`publisher` naar `#organization`, dat op die pagina's niet bestaat (baseline §7 punt 8). Voorstel voor fase 2: op die pagina's een korte node `{"@type":"Organization","@id":"https://www.salderingsdienst.nl/#organization","name":"SalderingsDienst","legalName":"De Salderingsdienst B.V.","url":"https://www.salderingsdienst.nl/"}` in hun `@graph`.

## Waar het komt

- `index.html`, eerste `<script type="application/ld+json">` (r. 30–84, stand 2026-10-06): het Organization-object (r. 34–62) vervangen door de node hierboven; in het Service-object (r. 71–82) `serviceType` en `description` aanpassen.
- Controle na plaatsen: Rich Results Test of Schema Markup Validator, en het JSON-blok mag geen komma achter het laatste element hebben.
