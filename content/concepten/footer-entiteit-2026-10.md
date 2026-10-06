# Concept: entiteitsgegevens en niet-overheidsregel in de footer (oktober 2026)

Status: concept, niet gepubliceerd. Opgesteld 2026-10-06. Lost baseline §2 en §7 punt 2 en 4 op: home en `/adviesgesprek` tonen geen zichtbare niet-overheidsregel, "De Salderingsdienst B.V." staat nergens buiten de voorwaarden, en telefoon, KvK en WhatsApp staan pas na JavaScript in de footer.

**Let op, besluit nodig:** volgens de memory-notitie *salderingsdienst-positionering* heeft de eigenaar de regel "geen onderdeel van de Rijksoverheid" op 17 september 2026 uitdrukkelijk uit de footer van home en `/adviesgesprek` laten halen. Het index-bestand van memory noemt de disclaimer juist verplicht. Dit concept zet hem terug; dat vraagt een expliciet akkoord van Pieter of Reener.

## Claimtabel

| # | Bewering | Getal | Bron (URL + datum) of aanname | Juridisch open? | Akkoord (P/R) |
|---|---|---|---|---|---|
| 1 | Juridische naam De Salderingsdienst B.V. | n.v.t. | `algemene-voorwaarden.html` art. 1.1 (repo, 2026-10-06) | nee | [ ] |
| 2 | KvK-nummer | 42165216 | voorwaarden art. 1.1; `SD_CONFIG.kvk` | nee | [ ] |
| 3 | Btw-identificatienummer | NL851987461B01 | voorwaarden art. 1.1 | nee | [ ] |
| 4 | Vestigingsadres | Jonas Daniël Meijerplein 25 C 2, 1011 RG Amsterdam | voorwaarden art. 1.1; huidige footer | nee | [ ] |
| 5 | Telefoon en WhatsApp | 06 3936 9781 / wa.me/31639369781 | `window.SD_CONFIG` in `index.html` r. 104–106 en `adviesgesprek.html` r. 42–44 | nee | [ ] |
| 6 | E-mail en werktijden | info@salderingsdienst.nl, werkdagen 9:00 tot 17:00 | huidige footer | nee | [ ] |
| 7 | "Particuliere onderneming, geen onderdeel van de overheid, handelt niet namens Rijksoverheid, RVO, Nationaal Warmtefonds, SVn of een gemeente" | n.v.t. | voorwaarden art. 1.2 ("geen overheidsinstantie en handelt niet namens de overheid, het Nationaal Warmtefonds, SVn, een gemeente…"); RVO is toegevoegd als uitvoeringsorganisatie van de overheid | ja, F1: RVO staat niet letterlijk in art. 1.2; akkoord op toevoeging | [ ] |
| 8 | Variant "niet verbonden aan" | n.v.t. | niet te onderbouwen: voorwaarden art. 11 beschrijft financieringsbegeleiding, dus een relatie met een financier zoals het Warmtefonds is niet uitgesloten | ja, F2: daarom NIET gebruikt; alleen "handelt niet namens" | [ ] |
| 9 | "SalderingsDienst" is een handelsnaam van de B.V. | n.v.t. | aanname, KvK-uittreksel niet gezien | ja, F3: daarom niet als "handelsnaam" geformuleerd, alleen naast elkaar gezet | [ ] |

## Disclaimerregel (één zin, overal gelijk)

> De Salderingsdienst B.V. is een particuliere onderneming, geen onderdeel van de overheid, en handelt niet namens de Rijksoverheid, RVO, het Nationaal Warmtefonds, SVn of een gemeente.

183 tekens. Geen logo's, kleuren of woorden van de overheid; de regel staat in dezelfde footerstijl als de rest.

## A. Home en /adviesgesprek (footer-slim)

Bestaande klassen in `css/main.css` r. 1595–1620: `.site-footer`, `.footer-slim`, `.footer-row0` (grid, vanaf 900px drie kolommen), `.footer-col`, `.footer-col-title`, `.footer-col p`, `.footer-col small`, `.footer-row1`, `.footer-links`, `.footer-row2`, `.site-footer .placeholder-mark`. Er is geen nieuwe CSS nodig.

De waarden staan nu statisch in de HTML. De `data-sd-*`-attributen blijven staan als vangnet: `motion.js` (`applyContacts`, r. 106–115) schrijft dezelfde waarden uit `SD_CONFIG` er opnieuw in, dus er verandert niets zichtbaars.

Vervangt alleen `div.footer-row0` en `div.footer-row2`; `div.footer-row1` (logo en `footer-links`) blijft zoals de href-ronde hem achterlaat.

```html
    <div class="footer-row0">
      <div class="footer-col">
        <div class="footer-col-title">Contact</div>
        <p>Telefoon: <a data-sd-tel data-sd-phone-text data-track="call_click" href="tel:+31639369781">06 3936 9781</a><br>
        WhatsApp: <a data-sd-wa href="https://wa.me/31639369781" rel="noopener">06 3936 9781</a><br>
        E-mail: <a href="mailto:info@salderingsdienst.nl" data-track="email_click">info@salderingsdienst.nl</a><br>
        Op werkdagen van 9:00 tot 17:00</p>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">Gegevens</div>
        <p>De Salderingsdienst B.V.<br>
        KvK <span data-sd-kvk>42165216</span> · btw NL851987461B01<br>
        Vestigingsadres: Jonas Dani&euml;l Meijerplein 25 C 2, 1011 RG Amsterdam</p>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">Goed om te weten</div>
        <p>De Salderingsdienst B.V. is een particuliere onderneming, geen onderdeel van de overheid, en handelt niet namens de Rijksoverheid, RVO, het Nationaal Warmtefonds, SVn of een gemeente.</p>
      </div>
    </div>
```

```html
    <div class="footer-row2">
      <span>&copy; 2026 De Salderingsdienst B.V.</span>
    </div>
```

Toelichting:
- De linkregel die nu onder het adres in de kolom "Gegevens" staat (adviesgesprek, voorwaarden, privacy) vervalt, want dezelfde links staan al in `footer-links` in `footer-row1`. Wil de andere agent die regel houden, zet hem dan als derde regel terug; het blok werkt in beide gevallen.
- De derde kolom vult de grid die in de CSS al op drie kolommen staat (r. 1608) en nu maar twee kolommen gebruikt.
- Het zwevende WhatsApp- en belknopje (`.floating`, `data-sd-wa`/`data-sd-tel` met `href="#adviesgesprek"`) kan in dezelfde ronde ook een statische `href` krijgen: `https://wa.me/31639369781` en `tel:+31639369781`.

## B. Kennisbank, artikelen en juridische pagina's (compacte footer)

Geldt voor `kennisbank.html`, `kennisbank/salderingsregeling-gids.html`, `kennisbank/thuisbatterij-na-2027.html`, `algemene-voorwaarden.html`, `algemene-voorwaarden-zakelijk.html` en `privacybeleid.html`. Vervangt alleen de **eerste** `<span>` in de footer (de regel met "© 2026 …"); de tweede `<span>` met links blijft van de href-ronde. Gebruikt de bestaande inline stijl van die footers.

```html
    <span>&copy; 2026 De Salderingsdienst B.V., KvK 42165216, btw NL851987461B01, Jonas Dani&euml;l Meijerplein 25 C 2, 1011 RG Amsterdam, <a href="mailto:info@salderingsdienst.nl" style="color:var(--gold-300);">info@salderingsdienst.nl</a>, <a href="tel:+31639369781" style="color:var(--gold-300);">06 3936 9781</a>.<br>De Salderingsdienst B.V. is een particuliere onderneming, geen onderdeel van de overheid, en handelt niet namens de Rijksoverheid, RVO, het Nationaal Warmtefonds, SVn of een gemeente.</span>
```

**Hier bewust geen `data-sd-*`-attributen.** De twee artikelen laden `motion.js`, maar hebben geen `window.SD_CONFIG`. `applyContacts` zou dan "TE VERVANGEN" in de tekst zetten en de `href` op `#adviesgesprek` zetten. Alternatief: in `motion.js` r. 109–115 alleen overschrijven als de waarde in `SD_CONFIG` staat. Dat is een codewijziging en valt buiten dit concept.

## Waar het komt

| Bestand | Plek (stand 2026-10-06, na de href-ronde) | Wat |
|---|---|---|
| `index.html` | `<footer class="site-footer">` r. 790–825: `div.footer-row0` en `div.footer-row2` | blok A |
| `adviesgesprek.html` | footer r. 139–174: `div.footer-row0` en `div.footer-row2` | blok A |
| `kennisbank.html` | footer r. 100–113, eerste `<span>` | blok B |
| `kennisbank/salderingsregeling-gids.html` | footer r. 255–268, eerste `<span>` | blok B |
| `kennisbank/thuisbatterij-na-2027.html` | footer r. 189–202, eerste `<span>` | blok B |
| `algemene-voorwaarden.html` | footer r. 423–434, eerste `<span>` | blok B |
| `algemene-voorwaarden-zakelijk.html` | footer r. 378–389, eerste `<span>` | blok B |
| `privacybeleid.html` | footer r. 95–106, eerste `<span>` | blok B (en de privacypagina zelf noemt de regel in §1) |

`portal.html` en `widget.html` (noindex) vallen buiten dit concept.
