# Concept: privacybeleid (oktober 2026)

Status: concept, niet gepubliceerd. Opgesteld 2026-10-06. Vervangt de huidige body van `privacybeleid.html` (werkdocument-banner, drie keer "TE VERVANGEN", leeg e-mailadres, "onafhankelijke adviesorganisatie").
Niets van dit concept gaat live zolang er nog een `[open …]` in de tekst staat. Er is geen functionaris voor gegevensbescherming en geen jurist genoemd, want daar is in de repo niets over te vinden.

## Claimtabel

| # | Bewering | Getal | Bron (URL + datum) of aanname | Juridisch open? | Akkoord (P/R) |
|---|---|---|---|---|---|
| 1 | Juridische naam, adres, KvK en btw | KvK 42165216, NL851987461B01 | `algemene-voorwaarden.html` art. 1.1 (repo, 2026-10-06) | nee | [ ] |
| 2 | Commerciële onderneming die ook levert, geen overheid | n.v.t. | voorwaarden art. 1.2; Organization-JSON-LD `index.html` | nee | [ ] |
| 3 | Telefoon en werktijden | 06 3936 9781, werkdagen 9:00 tot 17:00 | `window.SD_CONFIG` en footer in `index.html` | nee | [ ] |
| 4 | Velden in het boekingsformulier (naam, e-mail, telefoon optioneel, briefcode optioneel, onderwerp, koop/huur, samen beslissen, jonger dan 75, eigen middelen, verwachting, opt-in e-mail) | n.v.t. | `js/booking.js` r. 53, 170, 200–210, `buildLead` r. 626 | nee | [ ] |
| 5 | Invoer van de bespaarcheck gaat mee met de aanvraag | n.v.t. | `js/funnel.js` `payload()` r. 194; `booking.js` `berekening` | nee | [ ] |
| 6 | Herkomst: landingspagina, hostnaam van de verwijzer, UTM, afgeleid verkeerskanaal; e-mail- en telefoonnummers worden server-side weggefilterd; geen querystrings | n.v.t. | `js/motion.js` r. 15–57; `api/_lib/attributie.js` | nee | [ ] |
| 7 | Opslag van aanvragen in Supabase, regio eu-central-1 (Frankfurt) | n.v.t. | Supabase API `get_project gdetoinqwgasouornenx` → `region: eu-central-1` (2026-10-06) | ja, O2: verwerkersovereenkomst met Supabase bevestigen | [ ] |
| 8 | Elke boeking met e-mailadres gaat naar Pipedrive (persoon, deal, activiteit, notitie met antwoorden en herkomst) | n.v.t. | `api/bookings.js` r. 100; `api/_lib/pipedrive.js` | ja, O3: datacentrum (EU of VS) en verwerkersovereenkomst onbekend | [ ] |
| 9 | Serverfuncties van de site draaien in Washington D.C. (VS) | regio `iad1` | Header `X-Vercel-Id: fra1::iad1::…` op `GET /api/bookings` (gemeten 2026-10-06); vercel.json heeft geen `regions`; standaard is iad1: https://vercel.com/docs/functions/configuring-functions/region (bijgewerkt 2026-08-11, gelezen 2026-10-06) | ja, O4: doorgifte naar de VS (DPF/SCC, verwerkersovereenkomst); alternatief: `"regions": ["fra1"]` | [ ] |
| 10 | GA4 G-XN788FNCZS met `anonymize_ip`, Google-signalen en advertentiepersonalisatie uit | n.v.t. | `js/analytics.js` r. 29–33 | nee (code) | [ ] |
| 11 | Cookies `_ga` en `_ga_XN788FNCZS`, maximaal twee jaar | 2 jaar | huidige tekst `privacybeleid.html` §4 (25-09-2026); niet opnieuw bij Google gecontroleerd | ja, O5: bevestigen | [ ] |
| 12 | Meten zonder toestemming mag alleen bij "beperkte analytische cookies, met geen of geringe gevolgen voor de privacy" | n.v.t. | AP, "Cookies en uw organisatie: zorg voor een goed beleid": https://www.autoriteitpersoonsgegevens.nl/themas/internet-slimme-apparaten/cookies/cookies-en-uw-organisatie-zorg-voor-een-goed-beleid (gelezen 2026-10-06). De AP noemt daar als voorbeelden Matomo, Plausible e.d., niet Google Analytics | **ja, O1**: verwerkersovereenkomst met Google en "geen deling met Google" in het GA-account bevestigen; of GA4 binnen deze uitzondering valt, is niet getoetst | [ ] |
| 13 | Het event `booking_completed` stuurt `ref` en `briefcode` naar GA4 | n.v.t. | `js/booking.js` r. 692 | **ja, O6**: dit is een koppelbare identifier naar Google, botst met "beperkte gevolgen". Advies: `ref` en `briefcode` uit het event halen vóór publicatie van deze tekst | [ ] |
| 14 | Chatberichten (laatste 12, max. 1.500 tekens) gaan naar Moonshot AI (Kimi), niet door ons opgeslagen | 12 / 1.500 | `api/chat.js` r. 71–73, 124; geen opslag in de code | **ja, O7**: doorgifte buiten de EER; vestiging en voorwaarden van Moonshot AI niet gecontroleerd (aanname: buiten de EER). Chat geeft live nu 503 (`KIMI_API_KEY` ontbreekt) | [ ] |
| 15 | Lettertypen van Google Fonts | n.v.t. | `<link href="https://fonts.googleapis.com/…">` in alle pagina's | ja, O8: geen afspraken met Google; alternatief is zelf hosten | [ ] |
| 16 | Status "verkoopbaar" en "doorverkoop-route" voor gekwalificeerde aanvragen | n.v.t. | `api/bookings.js` r. 7–9, `store.js` kolom `verkoopbaar` | **ja, O9 (blokkerend)**: worden aanvragen aan derden verstrekt of verkocht? Huidige tekst zegt "Wij verkopen uw gegevens niet"; formulier zegt "alleen gebruikt voor het inplannen"; `adviesgesprek.html` r. 220 zegt "delen deze niet met derden" | [ ] |
| 17 | Brief met briefcode op basis van een adresbestand | n.v.t. | huidige tekst §2 ("gekochte adressenlijst"); briefcodeveld in `booking.js` | **ja, O10**: herkomst adresbestand, grondslag, verwerkersafspraken, informatieplicht art. 14 AVG | [ ] |
| 18 | Vraag naar leeftijd (jonger dan 75) en eigen middelen | n.v.t. | `booking.js` r. 200–206 | ja, O11: grondslag en noodzaak van deze vragen | [ ] |
| 19 | Bewaartermijnen | geen | niet vastgelegd in repo | **ja, O12** (alle termijnen) | [ ] |
| 20 | Gegevens in de browser: `sd_attrib`, `sd_funnel` (sessionStorage), `sd_booking_draft` (max 24 uur), `sd_lead_queue` en `sd_adviesgesprek` (localStorage, geen vervaldatum) | 24 uur | `motion.js` r. 41–56, 66–72; `booking.js` r. 683; memory-notitie leads | ja, O13: geen vervaltermijn voor `sd_lead_queue`/`sd_adviesgesprek` (technisch advies: na 30 dagen wissen) | [ ] |
| 21 | Delen voor uitvoering van de overeenkomst: installatiepartner, leverancier en fabrikant, beheerder EMS, financier (met toestemming) | n.v.t. | voorwaarden art. 25.2 | nee | [ ] |
| 22 | Klachtafhandeling: ontvangst binnen vijf werkdagen, antwoord binnen veertien dagen; geschil naar de rechter | 5 / 14 | voorwaarden art. 24. De huidige privacytekst ("10 werkdagen", "Geschillencommissie") spreekt dit tegen | nee | [ ] |
| 23 | Klacht bij de AP | n.v.t. | https://www.autoriteitpersoonsgegevens.nl/een-tip-of-klacht-indienen-bij-de-ap (200, gelezen 2026-10-06) | nee | [ ] |
| 24 | Rechten en antwoordtermijn van een maand | 1 maand | AVG art. 12 lid 3 en art. 15–22: https://eur-lex.europa.eu/eli/reg/2016/679/oj (bereikbaar 2026-10-06; artikeltekst niet opnieuw gelezen, algemene kennis) | nee | [ ] |
| 25 | Ontvanger e-mail: e-mailprovider van info@salderingsdienst.nl | n.v.t. | niet in repo | ja, O14: naam provider | [ ] |
| 26 | WhatsApp-contact loopt via WhatsApp (Meta) | n.v.t. | `SD_CONFIG.whatsapp`, links `wa.me` | ja, O15: WhatsApp Business-account en wie toegang heeft | [ ] |

## Voorgestelde HTML

Vervangt in `privacybeleid.html` alles tussen `<main …>` en `</main>` (r. 47–93). Header, `<head>` en CSS-klassen blijven. De oranje banner (`--warn-bg`) verdwijnt. De `id="klachten"` blijft, want de footer van home en `/adviesgesprek` linkt naar `/privacybeleid#klachten`. De placeholders staan als `[open Ox: …]`; die moeten allemaal weg vóór publicatie.

```html
<main class="container container--narrow" style="padding-top:32px; padding-bottom:96px;">
  <nav aria-label="Kruimelpad" class="breadcrumb breadcrumb--light">
    <a href="/">Home</a> &nbsp;/&nbsp; <span>Privacy &amp; cookies</span>
  </nav>

  <p class="eyebrow">Juridisch</p>
  <h1 style="font-size:clamp(32px,4vw,46px); line-height:1.08; letter-spacing:-.4px; margin:0 0 16px;">Privacy- &amp; cookiebeleid</h1>
  <p class="lead" style="margin-bottom:12px;">Welke persoonsgegevens De Salderingsdienst B.V. verwerkt, waarom, hoe lang, met wie wij ze delen en welke rechten u heeft.</p>
  <p style="font-size:14px; color:var(--ink-500); margin:0 0 40px;">Laatst bijgewerkt: [datum na akkoord]</p>

  <div class="prose">
    <section style="margin-bottom:36px;">
      <h2>1. Wie wij zijn</h2>
      <p>Deze website is van De Salderingsdienst B.V. (hierna: SalderingsDienst). Wij adviseren huiseigenaren over het einde van de salderingsregeling en leveren desgewenst een thuisbatterij, slimme energiesturing en de installatie, via installatiepartners. SalderingsDienst is een particuliere onderneming, geen onderdeel van de overheid, en handelt niet namens de Rijksoverheid, RVO, het Nationaal Warmtefonds, SVn of een gemeente.</p>
      <p>SalderingsDienst is verantwoordelijk voor de verwerking van uw persoonsgegevens zoals in deze verklaring beschreven.</p>
      <ul>
        <li>De Salderingsdienst B.V., Jonas Dani&euml;l Meijerplein 25 C 2, 1011 RG Amsterdam</li>
        <li>KvK-nummer 42165216, btw-identificatienummer NL851987461B01</li>
        <li>E-mail: <a href="mailto:info@salderingsdienst.nl">info@salderingsdienst.nl</a></li>
        <li>Telefoon: <a href="tel:+31639369781">06 3936 9781</a>, op werkdagen van 9:00 tot 17:00</li>
      </ul>
    </section>

    <section style="margin-bottom:36px;">
      <h2>2. Welke gegevens wij verwerken en waarom</h2>
      <h3>Als u een adviesgesprek plant</h3>
      <p>Wij vragen uw naam en e-mailadres, en als u dat wilt uw telefoonnummer en de briefcode uit onze brief. Daarnaast de datum, de tijd en of het gesprek bij u thuis of online plaatsvindt, en een paar vragen ter voorbereiding: waarover u advies wilt, of u in een koop- of huurwoning woont, of u samen met iemand beslist, of u jonger bent dan 75 en, zo niet, of u een investering uit eigen middelen zou doen. Wij gebruiken deze gegevens om het gesprek in te plannen en te bevestigen, contact met u op te nemen, de adviseur te laten voorbereiden en u een offerte te kunnen doen. Op basis van uw antwoorden geven wij uw aanvraag intern een status, die bepaalt hoe wij de afspraak opvolgen. [open O9: worden aanvragen aan derden verstrekt of verkocht? Zo ja: aan wie, op welke grondslag, en vermelding in het formulier. Zo nee: hier opnemen "Wij verkopen uw gegevens niet en verstrekken ze niet aan derden voor hun eigen doeleinden."]</p>
      <p>Vinkt u aan dat u de uitleg over het einde van de saldering per e-mail wilt ontvangen, dan sturen wij u die toe.</p>

      <h3>De bespaarcheck</h3>
      <p>Wat u in de bespaarcheck invult (woningtype, energielabel, stroom- en gasverbruik, opwek, slimme meter, zonnepanelen, aantal personen, apparaten en de berekende besparing) blijft in uw browser zolang het tabblad openstaat. Plant u daarna een gesprek, dan sturen wij deze gegevens mee met uw aanvraag, zodat de adviseur ze kan gebruiken. Plant u geen gesprek, dan ontvangen wij via Google Analytics alleen de uitkomst (verbruik, opwek en besparing) als meting, zonder uw naam of contactgegevens.</p>

      <h3>Hoe u bij ons terechtkwam</h3>
      <p>Bij uw eerste bezoek onthoudt uw browser voor de duur van het tabblad op welke pagina u binnenkwam, de naam van de website die naar ons verwees (bijvoorbeeld google.nl, zonder de rest van het webadres) en eventuele campagnegegevens in de link (utm-parameters). Plant u een gesprek, dan slaan wij deze gegevens op bij uw aanvraag, samen met een kanaal dat wij daaruit afleiden, zoals zoekmachine, verwijzing door een AI-assistent, campagne of direct bezoek. E-mailadressen en telefoonnummers die per ongeluk in deze gegevens staan, halen wij er automatisch uit. Zoekopdrachten en volledige webadressen bewaren wij niet, en wij zetten nooit persoonsgegevens in een webadres. Plant u via de website van een partner, dan leggen wij vast via welke partner. Zo zien wij via welke kanalen aanvragen binnenkomen.</p>

      <h3>Contact per e-mail, telefoon of WhatsApp</h3>
      <p>Neemt u contact met ons op, dan verwerken wij uw contactgegevens en de inhoud van uw bericht om u te antwoorden. Berichten via WhatsApp lopen via de dienst van WhatsApp; voor wat WhatsApp zelf met uw gegevens doet, geldt het privacybeleid van WhatsApp. [open O15: WhatsApp Business-account, wie toegang heeft.]</p>

      <h3>De chat</h3>
      <p>Stelt u een vraag in de chat, dan sturen wij uw laatste berichten (ten hoogste twaalf, elk ten hoogste 1.500 tekens) door naar het taalmodel Kimi van Moonshot AI, dat het antwoord opstelt. Wij slaan chatgesprekken zelf niet op. Zet geen persoonsgegevens zoals uw naam, adres of telefoonnummer in de chat. [open O7: vestiging Moonshot AI, doorgifte buiten de EER, bewaartermijn bij Moonshot AI; of chat uitschakelen tot dit is geregeld.]</p>

      <h3>Onze brief met briefcode</h3>
      <p>Sommige huiseigenaren ontvangen van ons een brief met een persoonlijke briefcode. [open O10: herkomst van de adresgegevens, grondslag, verwerkersafspraken en hoe u bezwaar maakt tegen verdere brieven.] Vult u de briefcode in bij uw aanvraag, dan koppelen wij uw aanvraag aan die brief.</p>
    </section>

    <section style="margin-bottom:36px;">
      <h2>3. Grondslagen</h2>
      <ul>
        <li>Plannen en voeren van het adviesgesprek, de offerte en de uitvoering van een overeenkomst: dit is nodig om op uw verzoek een overeenkomst voor te bereiden of uit te voeren (artikel 6 lid 1 onder b AVG).</li>
        <li>De vragen over leeftijd en eigen middelen: [open O11: grondslag en noodzaak].</li>
        <li>De uitleg per e-mail: uw toestemming (artikel 6 lid 1 onder a AVG). U kunt die altijd intrekken.</li>
        <li>Herkomstgegevens, websitemeting en beveiliging tegen misbruik van formulieren: ons gerechtvaardigd belang om de website en onze werving te verbeteren en te beschermen (artikel 6 lid 1 onder f AVG).</li>
        <li>Brieven op basis van adresgegevens: [open O10].</li>
        <li>Administratie na een overeenkomst: wettelijke bewaarplicht (artikel 6 lid 1 onder c AVG).</li>
      </ul>
    </section>

    <section style="margin-bottom:36px;">
      <h2>4. Hoe lang wij uw gegevens bewaren</h2>
      <ul>
        <li>Aanvragen die niet tot een overeenkomst leiden: [open O12: termijn] na het gesprek of de laatste contactmoment. Herkomstgegevens en de invoer van de bespaarcheck bewaren wij zolang de aanvraag zelf.</li>
        <li>Klanten met een overeenkomst: zolang nodig voor de uitvoering en de garantie, en daarna zolang de fiscale bewaarplicht geldt: [open O12: termijn bevestigen].</li>
        <li>De uitleg per e-mail: tot u uw toestemming intrekt.</li>
        <li>Websitemeting: de cookies van Google Analytics blijven ten hoogste twee jaar op uw apparaat; de meetgegevens bewaart Google [open O12: bewaarinstelling in GA4].</li>
        <li>Chatberichten: wij bewaren ze niet; [open O7: termijn bij Moonshot AI].</li>
      </ul>
    </section>

    <section style="margin-bottom:36px;">
      <h2>5. Met wie wij gegevens delen</h2>
      <p>Wij schakelen dienstverleners in die gegevens alleen in onze opdracht verwerken:</p>
      <ul>
        <li>Vercel: hosting van de website en verwerking van het boekingsformulier. De serverfuncties draaien op dit moment in de Verenigde Staten. [open O4: doorgifte naar de VS en verwerkersovereenkomst; of serverregio naar de EU verplaatsen.]</li>
        <li>Supabase: opslag van aanvragen, in een datacentrum in Frankfurt, Duitsland. [open O2: verwerkersovereenkomst.]</li>
        <li>Pipedrive: ons klantbeheersysteem, waarin wij uw naam, contactgegevens, afspraak, antwoorden en herkomst vastleggen. [open O3: locatie datacentrum en verwerkersovereenkomst.]</li>
        <li>Google: websitemeting met Google Analytics en het laden van lettertypen via Google Fonts. Bij het laden van de lettertypen wordt uw IP-adres aan Google bekend. [open O1, O8.]</li>
        <li>Moonshot AI: het taalmodel achter de chat. [open O7.]</li>
        <li>[open O14: e-mailprovider van info@salderingsdienst.nl.]</li>
      </ul>
      <p>Komt er een overeenkomst tot stand, dan delen wij gegevens die nodig zijn voor de uitvoering met de installatiepartner, de leverancier en de fabrikant van de producten, de beheerder van het energiemanagementsysteem en, alleen met uw toestemming, de financier. Zie ook artikel 25 van onze <a href="/algemene-voorwaarden">algemene voorwaarden</a>.</p>
    </section>

    <section style="margin-bottom:36px;">
      <h2>6. Cookies, meting en opslag in uw browser</h2>
      <p>Wij gebruiken Google Analytics 4 (meet-id G-XN788FNCZS) om te zien welke pagina&rsquo;s worden bezocht en welke stappen bezoekers zetten, zoals het openen van de bespaarcheck of het versturen van een aanvraag. Google plaatst daarvoor de cookies <code>_ga</code> en <code>_ga_XN788FNCZS</code>, die ten hoogste twee jaar bewaard blijven.</p>
      <p>Wij vragen hiervoor geen toestemming, omdat wij de meting zo hebben ingericht dat de gevolgen voor uw privacy beperkt blijven: uw IP-adres wordt ingekort, Google-signalen en advertentiepersonalisatie staan uit, en wij gebruiken de gegevens alleen zelf en niet voor advertenties. [open O1: bevestigen dat de verwerkersovereenkomst met Google is gesloten en dat gegevensdeling met Google voor eigen doeleinden in het account uit staat. Pas daarna deze alinea publiceren.] [open O6: booking-event zonder referentie en briefcode.]</p>
      <p>Wilt u niet gemeten worden? Blokkeer of wis dan cookies voor deze site in uw browser, of installeer de <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener nofollow" target="_blank">opt-outbrowserextensie van Google Analytics</a>.</p>
      <p>Daarnaast bewaart de website enkele gegevens alleen in uw eigen browser, zodat formulieren blijven werken: de herkomst van uw bezoek en de invoer van de bespaarcheck tot u het tabblad sluit, een onaf boekingsformulier ten hoogste 24 uur, en een kopie van een verstuurde aanvraag zodat u die kunt wijzigen [open O13: tot u die wist; voorstel vervaltermijn]. Deze gegevens worden niet naar ons verstuurd, behalve wanneer u een aanvraag verstuurt.</p>
    </section>

    <section style="margin-bottom:36px;">
      <h2>7. Uw rechten</h2>
      <p>U heeft het recht om uw gegevens in te zien, te laten corrigeren of te laten verwijderen, de verwerking te laten beperken, uw gegevens over te laten dragen en bezwaar te maken tegen verwerking op grond van ons gerechtvaardigd belang. Heeft u toestemming gegeven, dan kunt u die altijd intrekken. Stuur uw verzoek naar <a href="mailto:info@salderingsdienst.nl">info@salderingsdienst.nl</a>. Wij reageren binnen een maand. Om te voorkomen dat wij gegevens aan de verkeerde persoon geven, kunnen wij u vragen uw verzoek te bevestigen vanaf het e-mailadres dat bij ons bekend is.</p>
    </section>

    <section id="klachten" style="margin-bottom:36px; scroll-margin-top:96px;">
      <h2>8. Klachten</h2>
      <p>Heeft u een klacht over hoe wij met uw gegevens omgaan, mail dan naar <a href="mailto:info@salderingsdienst.nl">info@salderingsdienst.nl</a>. Komen wij er samen niet uit, dan kunt u een klacht indienen bij de <a href="https://www.autoriteitpersoonsgegevens.nl/een-tip-of-klacht-indienen-bij-de-ap" rel="noopener nofollow" target="_blank">Autoriteit Persoonsgegevens</a>.</p>
      <p>Heeft u een klacht over onze dienstverlening, mail die dan ook naar <a href="mailto:info@salderingsdienst.nl">info@salderingsdienst.nl</a>. Wij bevestigen de ontvangst binnen vijf werkdagen en antwoorden binnen veertien dagen, zoals beschreven in artikel 24 van onze <a href="/algemene-voorwaarden">algemene voorwaarden</a>.</p>
    </section>

    <section style="margin-bottom:36px;">
      <h2>9. Wijzigingen</h2>
      <p>Wij passen deze verklaring aan als onze werkwijze of de diensten die wij gebruiken veranderen. De datum bovenaan laat zien wanneer de tekst voor het laatst is gewijzigd.</p>
    </section>
  </div>
</main>
```

## Waar het komt

- `privacybeleid.html` r. 47–93: vervang het hele `<main>`-blok door de HTML hierboven (banner r. 57–59 vervalt).
- `privacybeleid.html` r. 95–106 (stand 2026-10-06, na de href-ronde): footer vervangen door het juridische footerblok uit `footer-entiteit-2026-10.md`.
- `privacybeleid.html` r. 7 en r. 11: meta description en og:description uit `titels-metas-2026-10.md`.
- `sitemap.xml`: `lastmod` van `/privacybeleid` op de publicatiedatum zetten.
- Mee te nemen in dezelfde ronde, anders spreekt de site zichzelf tegen: `js/booking.js` r. 165 ("alleen gebruikt voor het inplannen") en `adviesgesprek.html` r. 220 ("delen deze niet met derden"). Die zinnen hangen af van O9 en de verwerkerslijst.
- Technische voorwaarden vóór publicatie (geen tekstwerk): O6 (`ref`/`briefcode` uit het GA-event, `booking.js` r. 692), eventueel O4 (`"regions": ["fra1"]` in `vercel.json`), O13 (vervaltermijn localStorage).
