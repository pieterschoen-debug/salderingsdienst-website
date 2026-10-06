# Vermeldingen-kit: bedrijfsgegevens voor elk profiel en elke gids

Peildatum: 2026-10-06. Doel: Pieter kopieert uit dit bestand naar elk profiel of formulier, zonder zelf na te denken. Niets is aangemeld, niets is aangemaakt. Bron van de gegevens: `index.html` (JSON-LD en footer) en `content/concepten/footer-entiteit-2026-10.md`.

Labels: **[FEIT]** staat zo op de site of is op de genoemde pagina gecontroleerd. **[invullen door Pieter]** kan ik niet weten. **[niet geverifieerd]** komt uit eigen kennis of een secundaire bron; controleer in het formulier zelf.

---

## 0. Eerst beslissen (blokkeert Google, Bing en Apple)

**Het adres.** Op Jonas Daniël Meijerplein 25 staan volgens Funda woningen te koop (appartementen 25 C1 en 25 D, verkocht in april en mei 2026). Het adres 25 C 2 is dus waarschijnlijk een woonadres of kantoor aan huis. **[niet geverifieerd: ik weet niet hoe 25 C 2 wordt gebruikt; het is alleen een signaal]** Google Bedrijfsprofiel staat dan alleen een **servicegebiedprofiel met verborgen adres** toe. Een zichtbaar adres mag alleen als klanten daar echt kunnen langskomen. Virtuele kantoren en postadressen zijn volgens de Google-hulppagina niet toegestaan.

- Pieter bevestigt in één zin: "Op 25 C 2 ontvangen wij tijdens werkdagen klanten" (ja/nee).
- **Nee of onzeker: kies overal "servicegebiedbedrijf, adres verbergen".** Dit is het advies. Het adres blijft op de eigen site en in het KvK-register staan; dat is geen probleem.
- **Ja:** het adres mag zichtbaar, maar dan moet het ook echt zo zijn (openingstijden, aanspreekpunt; Google kan een videoverificatie op locatie vragen).
- Dezelfde bevestiging is nodig voor outreach-concept 05 (!WOON).

**De handelsnaam.** De site gebruikt "SalderingsDienst" als merk en "De Salderingsdienst B.V." als juridische naam. Het concept `footer-entiteit-2026-10.md` (F3) zegt: KvK-uittreksel niet gezien. **Pieter controleert eenmalig** op kvk.nl of "SalderingsDienst" als handelsnaam is ingeschreven. Zo niet: laat de inschrijving wijzigen. Tot die tijd staat er in profielen "merknaam", niet "handelsnaam".

## 1. NAP-blok (exact zo, overal)

Kopieer letterlijk. Niet inkorten, niet "Salderingsdienst" met kleine d, niet "SD", niet "De SalderingsDienst".

| Veld | Waarde |
|---|---|
| Naam in het profiel (merknaam) | `SalderingsDienst` |
| Juridische naam (waar het formulier erom vraagt) | `De Salderingsdienst B.V.` |
| KvK-nummer | `42165216` |
| Btw-nummer | `NL851987461B01` |
| Adres (alleen tonen als het besluit in §0 "ja" is) | `Jonas Daniël Meijerplein 25 C 2`, `1011 RG Amsterdam`, `Nederland` |
| Telefoon (weergave, zoals in de footer) | `06 3936 9781` |
| Telefoon (formulieren die internationaal willen) | `+31 6 3936 9781`; zonder spaties `+31639369781` (zo staat het in de JSON-LD) |
| WhatsApp | `https://wa.me/31639369781` |
| E-mail | `info@salderingsdienst.nl` |
| Website | `https://www.salderingsdienst.nl/` (met `www`, met slash, https) |
| Openingstijden | Maandag t/m vrijdag 09:00 tot 17:00; zaterdag en zondag gesloten |
| Werkgebied | Landelijk (heel Nederland). Vestiging: Amsterdam. Voor Google zie de regel hieronder. |
| Rechtsvorm | Besloten vennootschap (B.V.) |
| Oprichtingsjaar | [invullen door Pieter] |
| Aantal medewerkers | [invullen door Pieter] |

**Werkgebied bij Google.** Google staat servicegebieden alleen toe binnen ongeveer twee uur reistijd van het bedrijf. "Heel Nederland" kan daar dus niet. Vul in: Amsterdam, Haarlem, Utrecht, Almere, Hilversum, Den Haag en de provincies Noord-Holland en Flevoland **[alleen plaatsen en regio's waar het bedrijf echt aan huis komt; Pieter past aan]**. In de beschrijving en op de eigen site blijft "heel Nederland" staan. **[niet geverifieerd: de reistijdregel komt uit een samenvatting van de Google-hulppagina; controleer in het formulier]**

### Website-URL met UTM per platform

Formaat, alleen een platformnaam en geen persoonsgegevens:

`https://www.salderingsdienst.nl/?utm_source=<platform>&utm_medium=vermelding`

| Platform | `<platform>` | Volledige URL om te plakken |
|---|---|---|
| Google Bedrijfsprofiel | `google-bedrijfsprofiel` | `https://www.salderingsdienst.nl/?utm_source=google-bedrijfsprofiel&utm_medium=vermelding` |
| Bing Places | `bing-places` | `https://www.salderingsdienst.nl/?utm_source=bing-places&utm_medium=vermelding` |
| Apple Business Connect | `apple-maps` | `https://www.salderingsdienst.nl/?utm_source=apple-maps&utm_medium=vermelding` |
| Places.nl | `places-nl` | `https://www.salderingsdienst.nl/?utm_source=places-nl&utm_medium=vermelding` |
| LinkedIn-bedrijfspagina | `linkedin` | `https://www.salderingsdienst.nl/?utm_source=linkedin&utm_medium=vermelding` |
| Regionaal Energieloket | `regionaal-energieloket` | `https://www.salderingsdienst.nl/?utm_source=regionaal-energieloket&utm_medium=vermelding` |
| thuisbatterijinstallateurs.nl | `thuisbatterijinstallateurs` | `https://www.salderingsdienst.nl/?utm_source=thuisbatterijinstallateurs&utm_medium=vermelding` |
| Overig (nieuw platform) | kleine letters, koppeltekens | zelfde patroon |

Regels:
- Gebruik de UTM-URL alleen in het websiteveld van een profiel dat u zelf beheert. Waar een ander de link plaatst (redactie, coöperatie, gemeente) geeft u de schone URL zonder parameters.
- De homepage heeft een canonical zonder parameters (`index.html` r. 9), dus de UTM-variant maakt geen duplicaat in Google.
- **Meetdetail [FEIT, `api/_lib/attributie.js` r. 74 tot 87]:** een bezoek met `utm_medium=vermelding` krijgt server-side `verkeerskanaal = campagne`, niet `verwijzing`. Filter dus op `source.utm_medium = vermelding` om listings terug te vinden. `utm_source` en `utm_medium` worden in `lead.source` bewaard (r. 19).

## 2. Categorieën per platform

**Wat ik wel en niet kon verifiëren.** De Google-categorielijst staat niet op één officiële publieke pagina. Op 2026-10-06 bevestigden twee onafhankelijke lijsten (daltonluka.com "Complete List 2026" en thestacc.com, die zelf de picker op 11 juli 2026 controleerde) deze Engelse categorienamen: **Energy advisory service**, **Solar energy company**, **Solar energy system service**, **Solar energy equipment supplier**, **Consultant**, **Heating contractor**, **Battery store**. Een zoekresultaat meldt dat "Energy advisory service" in december 2024 is toegevoegd. "Solar energy contractor" is hernoemd naar "Solar energy system service".

**Niet bevestigd en daarom niet voorgesteld:** de Nederlandse tekst van deze categorieën in de picker (die volgt de taal van uw Google-account), "Adviesbureau voor duurzame energie" en "Installateur van zonnepanelen" als exacte categorienamen, "Energy conservation consultant" en "Renewable energy company" (stonden niet in de lijsten die ik kon lezen) en een aparte categorie voor warmtepompen. **Pieter typt de Engelse naam in de picker. Verschijnt hij niet, kies dan de dichtstbijzijnde uit de tabel.**

| Platform | Primair | Secundair | Niet kiezen |
|---|---|---|---|
| Google Bedrijfsprofiel | Energy advisory service | Solar energy company; Solar energy equipment supplier (alleen omdat de site levering van producten noemt) | Battery store (suggereert een winkel), Heating contractor en Solar energy system service (suggereren eigen installateurs), Consultant (te algemeen) |
| Bing Places | Importeer uit Google. Handmatig: de dichtstbijzijnde categorie voor energieadvies. **[niet geverifieerd, de Bing-lijst kon ik niet laden]** | Zonne-energiebedrijf (of de vertaling in de picker) | idem |
| Apple Business Connect | Kies in de picker een categorie voor energie of zonne-energie. Kies de route "bedrijf zonder openbare locatie" als het adres verborgen blijft. **[niet geverifieerd]** | – | – |
| Places.nl, Telefoonboek.nl, Openingstijden.com | Rubriek voor energieadvies of zonnepanelen. **[niet geverifieerd]** | Duurzame energie | Rubrieken met "installateur" |
| LinkedIn | Kies in de brancheselectie de dichtstbijzijnde optie voor hernieuwbare energie of energieadvies. **[niet geverifieerd]** Bedrijfsgrootte: [invullen door Pieter] | – | – |
| Regionaal Energieloket (vakspecialist) | Zonnepanelen | geen: thuisbatterij en energieadvies staan niet in hun categorielijst (isolatie, zonnepanelen, warmtepompen) | – |
| thuisbatterijinstallateurs.nl | De site toont alleen installateurs (547). Eerst vragen, zie `links.md` A6. | – | – |

## 3. Beschrijvingen (feitelijk, zonder superlatieven)

Alle drie noemen: commercieel bedrijf, advies én levering via installatiepartners, werkgebied. De 750-versie zegt uitdrukkelijk dat er geen landelijke subsidie op een thuisbatterij is (feitenblad: geen ISDE, geen 0% btw op een thuisbatterij). Geen "onafhankelijk", ook al staat dat woord nu op de homepage (zie §7).

**100 tekens** (93 tekens)

```
SalderingsDienst adviseert huiseigenaren over het einde van saldering en levert via partners.
```

**250 tekens** (249 tekens)

```
SalderingsDienst is de merknaam van De Salderingsdienst B.V., een commercieel bedrijf in Amsterdam. Wij adviseren huiseigenaren met zonnepanelen over het einde van de salderingsregeling (1 januari 2027) en leveren desgewenst via installatiepartners.
```

**750 tekens** (698 tekens; de limiet van Google is 750)

```
SalderingsDienst is de merknaam van De Salderingsdienst B.V., een commercieel bedrijf met vestiging in Amsterdam en werkgebied in heel Nederland. De salderingsregeling stopt op 1 januari 2027. Wij adviseren huiseigenaren met zonnepanelen wat dat voor hun situatie betekent, in een kosteloos en vrijblijvend adviesgesprek. Wie dat wil, kan de geadviseerde oplossing via ons afnemen: zonnepanelen, een thuisbatterij, een warmtepomp of slimme energiesturing, geleverd en geïnstalleerd door installatiepartners. Voor producten en installatie geldt een aparte offerte. Er is geen landelijke subsidie op een thuisbatterij. Wij zijn geen onderdeel van de overheid en handelen niet namens de Rijksoverheid.
```

Bronnen voor de beweringen: homepage (`index.html`, Service-schema: "kosteloos en vrijblijvend", "aparte offerte", "installatiepartners"); feitenblad §"Thuisbatterij: subsidie en belasting" ([geverifieerd], bron B3a); disclaimerregel uit `footer-entiteit-2026-10.md`. Past de 750-tekst ergens niet, laat dan de laatste zin vallen, niet de zin over subsidie.

**Voorwaarde:** de disclaimerregel is volgens de projectnotities op 17 september 2026 uit de footer gehaald en in het concept teruggezet; het besluit staat open. De zin in de beschrijving is een uitspraak over het bedrijf, geen reclame, en valt buiten dat besluit, maar Pieter keurt hem goed.

## 4. Vijf veelgestelde vragen (voor profielen met een Q&A- of FAQ-veld)

De antwoorden komen uit het feitenblad (`docs/seo/feitenblad-saldering-2027.md`). Verandert wet of tarief: eerst het feitenblad bijwerken.

1. **Wanneer stopt de salderingsregeling?**
   Op 1 januari 2027. Daarna krijgt u voor teruggeleverde stroom een vergoeding van uw leverancier in plaats van verrekening met uw verbruik.
2. **Hoeveel krijg ik daarna terug voor zonnestroom?**
   De wet vraagt een redelijke vergoeding. Tot 1 januari 2030 is die minimaal 50% van het kale leveringstarief (zonder energiebelasting en btw). Leveranciers mogen daarnaast terugleverkosten rekenen. Wat u netto overhoudt, verschilt per contract.
3. **Verdient een thuisbatterij zich terug?**
   Dat hangt af van uw verbruik, uw contract en het aantal panelen. Milieu Centraal schrijft dat een thuisbatterij zich nu hoogstwaarschijnlijk niet terugverdient. Wij rekenen daarom eerst uw situatie door.
4. **Is er subsidie op een thuisbatterij?**
   Niet landelijk. De batterij staat niet op de ISDE-maatregelenlijst en er geldt geen btw-nultarief voor een batterij. Sommige gemeenten of provincies hebben eigen regelingen.
5. **Wat kost een adviesgesprek, en wie bent u?**
   Het gesprek is kosteloos en vrijblijvend. SalderingsDienst is een commercieel bedrijf (De Salderingsdienst B.V., KvK 42165216) en geen onderdeel van de overheid. Wie dat wil, kan de geadviseerde oplossing via ons laten leveren en installeren door installatiepartners. Daarvoor ontvangt u een aparte offerte.

Antwoord 3 belooft niets over de uitkomst; zodra de rekentool live is mag eraan worden toegevoegd dat "geen batterij" een mogelijke uitkomst is.

## 5. Logo's en foto's om te uploaden

Afmetingen gemeten op 2026-10-06.

| Bestand | Afmeting | Gebruik |
|---|---|---|
| `assets/logo-vierkant-1024.png` (**nieuw gemaakt**: `crest.png` bijgesneden tot vierkant en opgeschaald, marineblauw, 0,9 MB) | 1024 x 1024 | **Profielfoto of logo overal waar vierkant gevraagd wordt** (Google, Bing, Apple, LinkedIn, Places). Opgeschaald van 427 px; scherp genoeg voor 720 px. Voor drukwerk een vectorversie laten maken. |
| `assets/salderingsdienst-logo-navy-960x396.png` | 960 x 396 | Brede variant met naam, voor partnerpagina's en persmappen. Staat al in de JSON-LD als `logo`. |
| `assets/og-salderingsdienst.jpg` | 1200 x 630 | Omslag waar de verhouding 1,9:1 mag. Staat als `image` in de JSON-LD. |
| `assets/crest.png` | 427 x 467 | Alleen als bron. Niet uploaden (niet vierkant, lage resolutie). |

**Vereiste afmetingen per platform [niet geverifieerd, richtlijnen uit eigen kennis; de uploaddialoog meldt de actuele eisen]:**

| Platform | Logo | Omslag en foto's |
|---|---|---|
| Google Bedrijfsprofiel | vierkant, minimaal 250 x 250, aanbevolen 720 x 720, JPG of PNG, 10 KB tot 5 MB | omslagfoto 16:9 (aanbevolen 1080 x 608); foto's minimaal 250 x 250, aanbevolen 720 x 720 |
| Bing Places | vierkant, ca. 300 x 300 of groter | foto's liggend, ca. 720 x 540 of groter |
| Apple Business Connect | vierkant, hoge resolutie (1024 x 1024 volstaat) | breed formaat, hoge resolutie |
| LinkedIn-bedrijfspagina | vierkant, 300 x 300 | omslag 1128 x 191 (zeer breed): bijsnijden of nieuw maken |

**Foto's van mensen en werk.** In `assets/` staan `adviseur-*.jpg`, `klant-*.jpg`, `werk-*.jpg` en `product-*.jpg`. Volgens de projectnotities zijn er foto-placeholders in de site. **Upload bij Google, Bing en Apple alleen foto's die echt van het bedrijf, de adviseurs of eigen werk zijn.** Stockfoto's of gegenereerde beelden als "ons team" of "ons werk" zijn misleidend en schenden de richtlijnen van Google. [invullen door Pieter: welke foto's zijn echt, en hebben de afgebeelde personen toestemming gegeven?] Tot dat besloten is: alleen het vierkante logo uploaden en eventueel `og-salderingsdienst.jpg` als omslag.

**Het embleem.** Het logo toont een wapenschild. Dat kan op een overheidsembleem lijken. Een disclaimerregel in de beschrijving (zie §3) helpt. Dit is een observatie, geen juridisch oordeel.

## 6. Eerste handelingen per platform (korte versie; de lange staat in `links.md`)

1. Google Bedrijfsprofiel: business.google.com/create. Naam, categorie §2, "Nee" op "locatie die klanten kunnen bezoeken" (bij besluit §0 = nee), servicegebied, telefoon, website (UTM), beschrijving 750, openingstijden, logo. Verificatie volgt via Google (telefoon, e-mail of video); duur: dagen.
2. Bing Places: bing.com/forbusiness; importeer uit Google zodra dat profiel is geverifieerd.
3. Apple Business Connect: business.apple.com. Gratis. Apple heeft aparte routes voor bedrijven met en zonder openbare locatie **[secundaire bron, niet geverifieerd]**.

## 7. Niet doen

- **Geen nepreviews.** Niet zelf schrijven, niet laten schrijven door familie of partners, niet kopen, niet ruilen, geen "review-gating" (alleen tevreden klanten uitnodigen). Vraag een echte klant na afloop om een eerlijke review via de reviewlink van Google.
- **Geen zoekwoorden in de bedrijfsnaam.** De naam is `SalderingsDienst`, niet "SalderingsDienst Amsterdam | Thuisbatterij Zonnepanelen Advies". Ook geen "B.V." of slogan in het Google-naamveld.
- **Geen postbus, virtueel kantoor, coworking-adres of adres van iemand anders** als vestiging. Het adres op 25 C 2 mag alleen zichtbaar zijn als het besluit in §0 "ja" is.
- **Geen tweede profiel** voor hetzelfde bedrijf ("SalderingsDienst Utrecht", "SalderingsDienst Den Haag"). Eén profiel, één servicegebied.
- **Geen gegenereerde of stockfoto's** als team of werk (zie §5).
- **Geen claims die niet bewezen zijn:** geen aantal klanten, geen partnernamen, geen keurmerken (InstallQ, Techniek Nederland), geen "gecertificeerd", geen "beste" of "goedkoopste".
- **Geen "onafhankelijk" in profielen.** De homepage zegt nu: "Wij rekenen eerst uw situatie onafhankelijk door". Een bedrijf dat ook levert is niet onafhankelijk in de zin die media en toezichthouders bedoelen. Dat woord moet apart op de homepage worden beoordeeld; dat valt buiten deze opdracht en is daarom niet aangepast.
- **Geen subsidiebelofte** voor een thuisbatterij en niet "subsidie" als zoekwoord in profielen.
- **Geen betaalde upsells** van gidsen (Telefoongids, Trustoo, Slimster, Werkspot, Homedeal, Solar Magazine-register) en geen "premium vermelding" voor een link.
- **Beheer niet vanaf één persoonlijk account.** Maak elk profiel aan met een bedrijfsaccount waar Pieter en Reener beiden bij kunnen, zodat het profiel niet aan één persoon hangt.
