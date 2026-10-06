# Instructies voor Pieter: meetsystemen koppelen (fase 1)

Volgorde is de volgorde waarin ik ze nodig heb. Alleen leesrechten waar lezen volstaat.

## 1. Google Search Console (domein is al geverifieerd via DNS)
Doel: impressies, klikken, indexeringsstatus en het Generative AI-rapport als baseline.
- Open https://search.google.com/search-console en kies de property `salderingsdienst.nl` (domeinproperty).
- Prestaties, zoekresultaten: periode laatste 3 maanden, tab Pagina's en tab Zoekopdrachten, rechtsboven Exporteren, Google Sheets of CSV. Beide exports delen (bestand of Sheets-link met alleen-lezen).
- Generative AI-rapport: https://search.google.com/search-console/performance/search-analytics/ai (zelfde property). Exporteren als hierboven. Alleen vertoningen, geen klikken; dat is normaal.
- Indexering, pagina's: screenshot of export van "Niet geïndexeerd" met redenen.
- Alternatief voor doorlopend lezen: Instellingen, Gebruikers en rechten, voeg een service-account of e-mailadres toe met rol "Beperkt" (alleen lezen). Geen eigenaarsrechten nodig.

## 2. Bing Webmaster Tools (nog niet geverifieerd)
Doel: Bing-index en het AI Performance-rapport (Copilot-citaties, grounding queries, citation share).
- Ga naar https://www.bing.com/webmasters en log in met een Microsoft-account van het bedrijf.
- Kies "Importeren vanuit Google Search Console" en geef toestemming; de verificatie wordt dan overgenomen en de sitemap meegenomen.
- Lukt importeren niet: voeg de site handmatig toe met de DNS-methode (CNAME) of plaats `BingSiteAuth.xml` in de siteroot. Zeg welke methode en ik zet het bestand of de DNS-instructie klaar.
- Daarna: Rapporten, AI Performance. Geef mij een export of lezersrol.

## 3. GA4 (G-XN788FNCZS)
Doel: bezoeken per kanaal en per landingspagina naast de leadmeting.
- Beheer, Property, Toegangsbeheer: voeg een e-mailadres toe met rol "Lezer".
- Controleer onder Beheer, Gegevensverzameling en wijziging, Gegevensverzameling: Google-signalen uit, en onder Beheer, Accountinstellingen: de verwerkersovereenkomst (Google Ads Data Processing Terms / Google Analytics-verwerkersvoorwaarden) geaccepteerd. Dit zijn de voorwaarden waaronder meten zonder cookiebalk verdedigbaar is; de code-instellingen (IP-anonimisering, geen advertentiesignalen) staan al goed.

## 4. Vercel (website-project)
Het website-project zit niet in het Vercel-account dat hier is gekoppeld. Twee opties: (a) het project overzetten naar dat account of mij als lid met rol "Viewer" toevoegen op het account waar het staat; (b) zelf controleren: Project, Settings, Firewall: geen regels die bots blokkeren (geen "Bot Protection" op crawl-paden); Project, Analytics: Web Analytics aanzetten als u dat wilt (cookieloos). Zeg welke keuze.

## 5. Bedrijfsvermelding (uit de nulmeting)
ChatGPT toont bij "welke partij kan ik inschakelen" bedrijfsprofielen met sterrenscore (lokale vermeldingen). Zonder een Google Bedrijfsprofiel met echte reviews verschijnen we daar niet. Dit is een vermeldingsplatform uit fase 4; ik bereid de exacte tekst en gegevens voor, u maakt het profiel aan. Reviews alleen van echte klanten na een echt gesprek.
