# Redesign-log — 21st.dev componentpas (branch `redesign/21st-components`)

Doelwit (door u gekozen): de **nieuwe statische site**, binnen het **design system**
(navy `#1a4571`, warm papier, goud spaarzaam, PT Serif + Source Sans 3).

## Architectuurkeuze

**Gekozen: (b) patronen vertalen naar de bestaande vanilla HTML/CSS/JS-runtime.**
21st.dev levert React/Tailwind/Framer Motion; de site is bewust een statische site
zonder build-stap (Vercel-eis uit de oorspronkelijke opdracht) met een hard
performance-budget en GSAP uitsluitend voor de energie-scenes. Een React-migratie
zou dat alles breken voor nul functionele winst. Ik neem dus structuur, maat- en
timingwaarden en motion-curves van gekozen componenten over in vanilla CSS/JS.

## Beslissingen per onderdeel

| Onderdeel | Bron / keuze | Waarom | Waar |
|---|---|---|---|
| Countdown-ticker | **Number Ticker** (@dev.yadhakim, id 10068 — volledige code opgehaald) | Mechanische odometer: elk cijfer rolt in een eigen kolom (0–9, translateY per em), cascade van groot naar klein cijfer. Lost het ontbreken van een geanimeerde ticker op zonder onrust: alleen cijfers die wijzigen bewegen. Spring (stiffness 60/damping 20) vertaald naar `cubic-bezier(0.16,1,0.3,1)` ~0,7s; live klok 0,35s. | Urgentiebalk (dagen + hh:mm:ss) op index |
| Hero-entrance | Patroon uit **Hero — Luxury Editorial** (@dzekuza, id 14846): sparse serif, gefaseerde entree | Opdracht noemt expliciet het ontbreken van een hero-entrance. Eén rise+fade-familie (dezelfde als de scroll-reveals), 60–80 ms stagger over eyebrow → H1 → lead → CTA's → trustregel, totaal < 0,5 s. De scene animeert níét mee (die is de LCP; opacity-entrance zou de LCP verschuiven). | Hero op index |
| Wat wij doen | Structuur van **8bit Feature 2 List** (id 14063, genummerde lijst met scheidingslijnen) — styling uiteraard niet | Vijf identieke kaarten in een grid was precies het "generieke kaartgrid"-probleem. Nu een editoriale registerlijst: serif-nummer, titelkolom, tekstkolom, hairlines. Geen dozen. | index `#wat-wij-doen` |
| Adviseurs | **Team Showcase** (@makviesainte, id 10098): magazine-lijst, grayscale→kleur op hover | Drie identieke kaarten → registerrijen met hairlines. Grayscale portretten die op hover kleuren geven een redactionele, menselijke toets én verdoezelen de lage resolutie van de bronfoto's (119×168). | index `#over-ons` |
| Eén belang (navy) | Eigen keuze: hairline-tabel (één omkaderde band, verticale scheidingslijnen op desktop) | Vier gelijke kaarten-met-vulling is een AI-patroon; een briefhoofd-achtige tabel past bij het "officiële brief"-register van het merk. | index `#waarom` |
| FAQ | **Interactive Accordion** (@jatin-yadav05, id 9602): genummerde items, plus→45°-rotatie, progressieve underline op hover | Nummerkolom (01–06) geeft de FAQ het karakter van een artikelregister; plus-rotatie is rustiger dan de chevron. Hoogte-animatie blijft `grid-template-rows` (geen JS-hacks). | index `#vragen`, kennisbank/artikel.html |
| Booking-invoervelden | **Floating Input** (@ruixen.ui, id 6840) + validatiestaten uit **Field** (@coss.com, id 11462) | Zwevende labels i.p.v. placeholders (institutioneel, formulier-als-document) en microinteractie op validatie: amber hint bij ongeldig e-mailadres na blur, gouden ✓ zodra geldig. Logica (`booking.js`-state, tracking, localStorage) onaangeroerd. | index `#adviesgesprek` |
| Cookiemelding | **CookiePanel** (@arunachalam0606, id 5196): compacte zwevende kaart i.p.v. paginabrede balk | Een volle balk over de hele breedte is het generieke patroon én bedekt de mobiele CTA. Kaart linksonder (rechtsonder is bezet door de contactknoppen), slide-fade entree. Mobiel blijft volle breedte (duimzone). LocalStorage-gedrag ongewijzigd. | alle pagina's met cookiebalk (index) |
| Navigatie | Underline-reveal-patroon (@geekles007 Navbar, id 620) | Linkjes krijgen een 1,5px gouden underline die van links intekent (0,25s). Geen structuurwijziging; sticky blur en overlay-menu waren al goed. | header op alle pagina's |
| Verwachtingen-rij (booking) | Eigen keuze: hairline-strook i.p.v. drie witte kaartjes | Zelfde reden als "Eén belang": minder dozen, meer register. | index `#adviesgesprek` |
| Kennisbank-kaarten | Eigen keuze: pijl-microinteractie + titelkleur op hover | Lichte ingreep; de kaartvorm werkt hier functioneel (klikbare artikelen). | kennisbank.html, gids, artikel |
| Knoppen | Eigen keuze | Press-state (1px translate) op alle knoppen, 0,15s. | overal |

## Iteratie 2 (feedbackronde 7 juli 2026)

| Onderdeel | Keuze | Waarom |
|---|---|---|
| Countdown | Urgentiebalk herbouwd: hoofdregel + zijregel; alle odometer-cellen (cijfers én dubbele punten) in hetzelfde 1em-raster met line-height 1 | De scheidingstekens erfden de body-line-height en stonden daardoor verticaal verkeerd t.o.v. de rolcijfers |
| Calculator | Mobiel compacter (kleinere kop, strakkere paddings); "terug te winnen"-blok vervangen door vergrendeld inzicht: echte waarden achter blur met slot-glyph en uitnodiging naar het gesprek | Gevraagde psychologische trigger; de blur bevat de échte berekening (eerlijk), het gesprek ontsluit de exacte cijfers |
| Scrolly mobiel | Vier verschillende varianten van dezelfde scene: stap 1 volledig zonder batterij, stap 2 uitsnede kalender/mast/stippellijn, stap 3 uitsnede woning+batterij, stap 4 uitsnede batterij↔net met € (avond). Zelfde lijnstijl, andere viewBox + elementfilters | Vier keer hetzelfde beeld oogde saai; uitsneden vertellen per stap het verhaal zonder nieuwe tekenstijl |
| Wat wij doen | Registerlijst → compacte accordeon (zelfde soepele grid-rows-animatie als FAQ, grote serif-nummers), eerste item open | Gevraagde compactheid; hergebruikt bestaand gedrag i.p.v. nieuwe machinerie |
| Waarom-sectie | Sterk ingekort: één regel propositie + drie hairline-punten (ontzorgd / onafhankelijk / u beslist), sectie-padding verlaagd | Herhaling verwijderd; ontzorgingsmodel centraal, geen salespitch |
| Reviews | Google-stijl placeholder: samenvattingsbalk (4,9 ★ — gemarkeerd TE VERVANGEN) + skeletkaarten met sterren/balken/avatar; de functionele TE VERVANGEN-tekst staat in de middelste kaart | Oogt als een echte feed zonder verzonnen reviews |
| Booking | Drie-staps flow met voortgangsindicator: 1 datum+tijd (Verder pas actief na keuze), 2 locatie, 3 gegevens+bevestigen. Secundaire checkbox "stuur mij ook alvast de uitleg per e-mail (vrijblijvend)" — géén of-of; hoofdroute blijft het gesprek. Alle bestaande logica/tracking intact; sendInfo opgeslagen en als lead_capture (via: booking) getrackt | Formulier was intimiderend in één scherm; checkbox kwalificeert leads zonder de CTA te ondermijnen |
| Slot-CTA | Foto vervangen door assets/advisor-closing.jpg (hires adviseursportret, navy achtergrond, 720px JPEG 67 kB). NB: de keukentafelfoto uit de briefing staat niet als bestand in de repo — zodra die in assets/ staat wissel ik hem om | Enige adviseursfoto op bruikbare resolutie; navy achtergrond versmelt met de sectie |
| Footer | Twee slanke regels: merk + inline links, daaronder mono-referentieregel met KvK/adres/contact/© | Footer was drie kolommen diep; nu ± een derde van de hoogte |
| Niet aangeraakt | Werkwijze (3 stappen), Echte mensen, FAQ-inhoud | Expliciet "niet aanraken" in de briefing |

## Iteratie 3 (boekings- en leadronde, 6 juli 2026)

| Onderdeel | Wijziging | Waarom |
|---|---|---|
| Datumbug | `fetchAvailability()` gebruikte `toISOString()` op lokale middernacht; in CET/CEST schoof de gekozen datum daardoor één dag terug (di 7 jul werd opgeslagen als 2026-07-06). Nu lokale datumopbouw (`localIso`) | Kernbug: elke boeking, .ics en leadrecord had de verkeerde dag |
| Agenda-integratie | Bevestigingsscherm heeft nu een agendablok met drie routes: .ics-download (Apple/overig, nu mét DTSTAMP, LOCATION, STATUS:CONFIRMED en tekst-escaping), Google Agenda-link (`ctz=Europe/Amsterdam`) en Outlook-composelink. Alle drie beschrijven dezelfde 45-minutenafspraak in lokale tijd | Bezoeker zet de afspraak in zijn éigen agenda; geen koppeling met een persoonlijke agenda nodig |
| Leadkanaal | Eén canoniek payload-schema `sd.lead.v1` voor bevestigde afspraken én info-aanvragen: wachtrij `sd_lead_queue` in localStorage (herplannen vervangt op ref), CustomEvent `sd:lead` op window, en optionele JSON-POST naar `SD_CONFIG.leadEndpoint`. `SD.lead()` leeft in motion.js | Backend-agnostisch: webhook/CRM/koper aankoppelen zonder de sitecode te wijzigen |
| Validatie | Strakker e-mailpatroon (`naam@domein.tld`, geen spaties) op booking én briefsectie; onvolledige submit markeert nu ook de velden zelf (`ffield--invalid`); briefsectie kreeg `aria-invalid` + Enter-to-submit; naam/briefcode worden getrimd (briefcode geüppercased) in het leadrecord | Validatie op de systeemgrens; formulieren kunnen niet met kapotte data door |
| Focus | Stapwissel in de bookingflow verplaatst focus naar het label van de nieuwe stap | Toetsenbord/screenreader landde voorheen nergens na "Verder" |
| Contrast | Placeholders en rustende zwevende labels van `--ink-300` (±2,6:1) naar `--ink-400` (≥4,5:1 op wit) | WCAG-contrast op invoervelden |

## Bewust niet gedaan
- Geen Framer Motion/GSAP voor deze micro-animaties (CSS volstaat, budgetregel).
- Geen wijziging aan copy, meta, JSON-LD, sitemap, tracking of bookinglogica.
- De energie-scene en scrollytelling blijven zoals goedgekeurd; de nieuwe motion
  gebruikt dezelfde easing-familie zodat er één bewegingstaal blijft.

## Verificatie (uitgevoerd 7 juli 2026, verse subagent + eigen sessie)
12 van 13 checklist-items PASS met concreet DOM-bewijs: geen overflow op 375px
en 1280px, postcodecheck, rekentool (€552/€386 bij 20 panelen + veel),
boekingsflow end-to-end (bevestiging, .ics, localStorage, portal, herplannen),
validatie-microinteractie, cookie-consent incl. onthouden na reload, 8/8
afbeeldingen geladen, alle tracking-events, nieuwe structuren aanwezig,
FAQ-gedrag, subpagina's 200, console schoon. Item 13b (countdown-startanimatie)
was in de verborgen previewtab van de subagent niet runtime-testbaar
(IntersectionObserver vuurt daar niet); eerder in de sessie wel geverifieerd
met zichtbare tab (aria-label "178 dagen", kolommen gerold naar 1/7/8).
Tijdens verificatie gevonden en gefixt: count-up-animaties kregen een vangnet
voor verborgen tabs (rAF vuurt daar niet), en de odometer-kolommen zijn met
aria-hidden uit de accessibility-tree gehaald (het label spreekt).

## Iteratie 4 (hero-scene → foto, 6 juli 2026)

Op verzoek is **alleen** de zichtbare hero-scene (de geanimeerde
bouwtekening-SVG bovenaan de pagina) vervangen door een statische foto
(`assets/hero-scene-photo.jpg`, lokaal gehost, gedownload van een door de
gebruiker aangeleverde URL). De scrollytelling-animatie eronder ("Wat
verandert er voor uw woning?", 4 aktes) is expliciet **niet** aangepast —
die bleef eerder per ongeluk ook vervangen worden en is teruggezet.

Om de scrollytelling te laten werken staat de originele hero-SVG nog wél
in `index.html`, nu visueel verborgen (`.visually-hidden`,
`data-scene-hero`) — `js/scene.js` gebruikt hem uitsluitend als kloonbron;
zelf draait er geen zichtbare hero-loop meer. De volledige oorspronkelijke
hero-animatie (inclusief bedieningselementen: pauzeknop, captions, dots)
staat gearchiveerd in `archive/scene-animation-2027/` met een README voor
terugzetten.

Gevonden en gefixt tijdens deze wijziging: de verborgen kloonbron kreeg
eerst de klasse `scene-wrap visually-hidden`, maar de latere
`.scene-wrap { position: relative }`-regel in main.css overschreef
`.visually-hidden`'s `position: absolute` — `clip` werkt alleen op
absoluut gepositioneerde elementen, dus de "verborgen" SVG werd alsnog
zichtbaar getoond. Fix: de verborgen template gebruikt nu alleen
`.visually-hidden`, losgekoppeld van `.scene-wrap`.

## Iteratie 5 (de-slop-ronde op basis van taste-skill, 6 juli 2026)

Op verzoek: volledige anti-AI-slop-pas. Werkwijze: taste-skill volledig
gelezen, daarna twee parallelle analyse-agents (aanklager: alle AI-tells;
verdediger: merk-, conversie- en techniekgrenzen), daarna vonnis en
uitvoering. De verdediger-grenzen (data-attributen, tracking-labels,
anker-id's, a11y, urgentiebalk, vergrendeld calculatorinzicht, KvK/privacy)
zijn volledig gerespecteerd; geen JS-wijziging nodig.

| Ingreep | Detail |
|---|---|
| Eyebrows | Alle 10 gouden uppercase-kickers met ::before-streepje van index verwijderd; secties dragen nu op de serif-kop. `.eyebrow` bestaat nog voor de subpagina-hero's, maar als stille variant (klein, sans, geen goud/streep/kapitalen) |
| Em-dashes | Nul zichtbare em/en-dashes meer, site-breed (index + 4 subpagina's + titels); zinnen herschreven met komma/punt, bereik `€0,00-0,05` met koppelteken |
| CTA-intent | Eén label voor de plan-intentie: "Plan gratis adviesgesprek" (nav, overlay, hero, scrolly, closing, mobiel, chat) |
| Trust-triplet | "Kosteloos · Onafhankelijk · Geen verplichtingen" (3× met dubbele middle-dots) → uit de hero verwijderd; bij scrolly-CTA en menuoverlay vervangen door één gewone zin |
| Staplabels | "Stap 1 — nu" enz. → inhoudslabels ("Vandaag", "Vanaf 1 januari 2027", "De oplossing die wij adviseren", "Daarna: slim handelen op het net") |
| FAQ-nummering | 01–06 verwijderd; de grote serif-nummers bij "Wat wij doen" blijven als de éne bewuste nummering |
| Microlabels | Gouden/uppercase getrackte labels (addr, booking-stappen, confirm-blokken, adviseursrollen, kb-label, zwevende veldlabels) → normale-case sans-labels in inkt/navy |
| Decoratie | Gouden dots (privacyregel, KvK-regel), gouden reason-ticks en de hero-ringen-SVG verwijderd |
| Waarom-sectie | Drie gelijke kolommen → verticale registerlijst met hairlines (term + toelichting naast elkaar op desktop) |
| Reviews | Twee skeleton-nepkaarten met sterren/balkjes/avatars verwijderd; samenvattingsbalk + één eerlijke TE VERVANGEN-notitiekaart blijft |
| Footer | Middle-dot-kettingen → komma's (referentieregel) en flex-gaps (contactregel) |

Bewust behouden (verdediger-pleidooi gehonoreerd): urgentiebalk (feitelijke
deadline), vergrendeld calculatorinzicht, KvK/privacy-microcopy, serif+navy+
papier-register, hairlines, ✓-bevestigingen, één motion-familie.

---

## Iteratie 3 — 13 juli 2026: functioneel afmaken + gouden stroomlijn

**Signatuurelement "de gouden stroomlijn"** (uit de scene-SVG doorgetrokken
naar het hele merk): intekenende gouden hairline boven elke sectiekop,
lopende puls op de werkwijze-rail, gouden onderlijn-sweep op primaire
knoppen, gouden voortgangsbalk in het boekingswidget, gouden baseline
onder de countdown.

**Beeld/tekst-fixes:** hero-collage (gloeilamp+munten) vervangen door de
woninguitsnede (`assets/hero-woning.jpg`, rechterhelft van de oude collage);
bijschrift klopt nu met wat er te zien is (geen thuisbatterij-claim meer);
"sinds 2009" bij Mark verwijderd (portret is begin twintig). Hero-foto met
binnenliggend wit passe-partout, entree met clip/scale, subtiele
GSAP-parallax op desktop. Scrollytelling ONaangeraakt.

**Boekingssysteem herbouwd** (js/booking.js, zelf-renderend op
`[data-booking]`): zes stappen, één vraag per scherm, "6 van Succes"
verweven (productinteresse, koopwoning, datum/tijd/duur ±1,5u, beide
beslissers, leeftijd/eigen middelen, verwachting). Nooit afwijzen; status
`warm_gekwalificeerd`/`niet_gekwalificeerd` wordt óók server-side afgeleid.
Gespreksduur overal 45→90 min (ook agenda-links). Embed: `js/embed.js` +
`/widget` (iframe, data-source-attributie, auto-hoogte).

**Backend:** `api/bookings.js` (+ store-adapter Supabase/Postgres/memory),
`api/portal-login.js`, wachtwoordbeveiligd `/portal`-overzicht met
kwalificatiestatus en verkoopbaar-markering. **Chat:** `api/chat.js` →
DeepSeek (`deepseek-v4-flash`, key via env), rate limiting, [AFSPRAAK]-
marker → boekings-CTA. **WhatsApp:** 31639369781 in SD_CONFIG; wiring
herbruikbaar gemaakt (SD.applyContacts) zodat ook het widget de juiste
links krijgt. **Tooling:** package.json, tools/build-check.mjs (npm run
build), tools/dev-server.mjs (npm run dev), .env.local (gitignored).

---

## 13 juli 2026 — Scrollytelling herbouwd: 5 stappen, correcte 2027-visualisatie

**Waarom.** De oude scene (4 aktes, gekloond uit een verborgen bron-SVG in
de hero) bevatte een inhoudelijke fout: in akte 2 bleef stroom van de
woning naar het net lopen alsof dat na 2027 normaal doorgaat — precies
wat wordt afgeschaft. Bovendien ontbrak het EMS-handel-verdienmodel.

**Nieuw (`js/scrolly.js` + inline `svg.scene5` in index.html):**
1. **Nu (t/m 31-12-2026):** zon→woning (groen), woning→net (blauw) én
   net→woning (goud) — de gouden lijn ís de saldering, teller ±€0,23/kWh.
2. **Vanaf 1-1-2027:** gouden lijn verdwijnt, de teruglevering kleurt
   rood en druppelt weg in de grond (geen mast die ontvangt; mast dimt),
   teller telt af naar €0,02 in rood. Het pijnmoment.
3. **Thuisbatterij:** batterij verschijnt, gouden dag/nacht-circulatie
   woning↔batterij, rode lek dooft; teller "€0,23/kWh behouden".
4. **EMS-handel (nieuw):** viewBox zoomt in op de batterij;
   prijsgrafiek met dal (groen) en piek (rood), laden bij dal /
   terugleveren bij piek, teller "+€0,10–€0,20/kWh extra" + badge
   "Extra inkomen, niet alleen besparing".
5. **Advies:** uitzoomen naar vier miniaturen (3+4 goud uitgelicht),
   teller "tot €1.000/jaar", CTA in de stap zelf.

**Techniek.** GSAP ScrollTrigger, één timeline met `scrub: 0.5`
(overgangen power2.inOut), sticky scene (top 20vh), viewBox-tween voor
de zoom. Tellers zijn losse triggers met count-up/-down (niet gescrubd).
Mobiel: statische kloon per stap met eigen uitsnede via
`.scene5--static[data-step]`-CSS. Fallback zonder GSAP of met reduced
motion: IntersectionObserver wisselt dezelfde statische standen.
Oude versie gearchiveerd in `archive/scrolly-4akte-2026/`; verborgen
bron-SVG uit de hero verwijderd, `js/scene.js` vervangen door
`js/scrolly.js` (ook in build-check).

**Micro-animaties op de 5 illustraties (na akkoord op de statische SVG's).**
Bewust niet scroll-gestuurd en geen overgangen tussen stappen; alleen
subtiele loops óp de tekening zelf (2-3s, kalm): (1) gouden bolletje over
de salderingspijl net→woning, 3s; (2) druppels vallen één voor één, 0,8s
ease-in, om de 2s, pijl weg; (3) twee bolletjes circuleren woning↔batterij
2,5s + gouden batterijgloed (fill-opacity 0→0,3→0, 3s); (4) groen bolletje
dal→batterij en rood bolletje batterij→piek, 2s, zelfde gloed; (5) statisch
met eenmalig intekenende gouden onderlijn (2s) zodra de stap actief wordt.
Techniek: SMIL animateMotion voor bolletjes, CSS keyframes voor druppels/
gloed/onderlijn, geen JS/GSAP. Reduced motion: bolletjes verborgen,
druppels statisch, onderlijn vol. js/scrolly.js versimpeld tot discrete
stapwissel (data-step + viewBox via IntersectionObserver, geen scrub);
sticky scene houdt vaste aspect-ratio zodat de uitsnede-wissel de layout
niet laat springen. Dode s5-*-CSS en scrolly-counter-CSS verwijderd.
