# Fotoprompts voor de nieuwe secties

Voor Pieter. Elke foto hieronder hoort bij één plek in het [fundamentele plan](fundament-plan.md). Per foto staat: waar hij komt, welk formaat, welke bestaande foto's je als referentie uploadt, wie of wat erop staat, en de prompt die je letterlijk in ChatGPT plakt. De prompts zijn in het Engels omdat beeldmodellen daar preciezer op reageren; de uitleg eromheen is Nederlands.

Werkwijze per foto:

1. Open ChatGPT (beeldgeneratie), upload de referentiefoto's die bij de foto genoemd staan.
2. Plak de prompt, en daaronder altijd de vaste stijlalinea uit hoofdstuk 1.
3. Vraag om twee of drie varianten, kies de beste, en laat eventueel één ding corrigeren ("maak de kamer lichter", "verwijder het logo op de muur").
4. Controleer met de checklist uit hoofdstuk 7 en exporteer volgens hoofdstuk 6.
5. Zet het bestand in `assets/` met de genoemde bestandsnaam en meld mij welk ID klaar is.

---

## 1. Vaste stijlalinea (onder elke prompt plakken)

```
Style for every image: documentary photography, natural daylight, warm but muted colour grading (warm off-white walls, deep navy and charcoal clothing, oak and brick tones). No bright green anywhere, no saturated colours. 35 mm lens look, gentle depth of field, eye level. Setting: an ordinary, tidy, lived-in Dutch brick terraced house from the 1930s to 1980s, Dutch windows, Dutch meter cupboard. Realistic hands and faces, no text, no signage, no brand logos; the only allowed marking is a small embroidered "SalderingsDienst" on a navy polo shirt. Not glossy stock photography, not a render, not an illustration. Leave calm negative space on the side mentioned in the prompt so a headline can be placed there.
```

Referentiefoto's die al in `assets/` staan en die je kunt uploaden:

| Bestand | Waarvoor |
|---|---|
| `hero-advies.jpg` | De toon van de site: adviseur en bewoner aan tafel, warm licht |
| `werkwijze-4.jpg` | Monteur in SalderingsDienst-shirt bij een thuisbatterij en omvormer |
| `product-batterij-otgu.jpg` | Hoe de batterijen eruitzien (stockbeeld; liever een echte foto van de partnerbatterij als je die hebt) |
| `product-warmtepomp.webp` | Buitenunit langs een gevel |
| `product-zonnepanelen.jpg` | Twee monteurs leggen panelen |
| `adviseur-pieter.jpg`, `adviseur-mats.jpg`, `adviseur-silvester.jpg`, enz. | Gelijkenis van de persoon op de foto |

Over personen: upload de echte foto van de adviseur en schrijf erbij "keep this person's likeness exactly as in the uploaded photo". Weigert ChatGPT dat, maak dan een eenvoudige echte foto met een collega op de juiste plek (telefoon volstaat) en laat ChatGPT alleen licht, achtergrond en uitsnede verbeteren. Verzin nooit gezichten voor klantervaringen.

---

## 2. Fase 1: productpagina's

### B1 · Thuisbatterij, hero

- Plek: bovenaan `/thuisbatterij`, paginabreed achter de kop.
- Formaat: 16:9, minimaal 2000 × 1125 px. Bestandsnaam `assets/thuisbatterij-hero.jpg`. Tekst komt links, dus rechts het onderwerp.
- Upload: `werkwijze-4.jpg`, `hero-advies.jpg`, de foto van de adviseur die erop mag.
- Wie of wat: een monteur of adviseur in navy polo (SalderingsDienst) die een wandgemonteerde thuisbatterij in een bijkeuken of garage heeft aangesloten; de bewoner (man of vrouw, 45 tot 65 jaar) staat erbij en kijkt mee. Geen stapel van drie batterijen; één echte, aan de muur, met omvormer en nette kabelgoot.

```
A technician in a navy polo shirt stands next to a single wall-mounted home battery with an inverter above it in a tidy Dutch utility room or garage; he is explaining the display to a homeowner in her fifties who stands beside him, both relaxed, soft daylight from a side window. The battery and the two people are on the right half of the frame; the left half is a calm plain wall with space for a headline. Horizontal 16:9. Keep the technician's likeness exactly as in the uploaded photo.
```

### B2 · Thuisbatterij, bewoner met app

- Plek: `/thuisbatterij`, blok "Wat u krijgt" (foto links, uitklaplijst rechts).
- Formaat: 4:3, 1600 × 1200 px. Bestandsnaam `assets/thuisbatterij-app.jpg`.
- Upload: `hero-advies.jpg` voor de toon.
- Wie of wat: een bewoner (50 tot 65) in de woonkamer of keuken, kijkt op de telefoon naar een eenvoudig scherm met een laadniveau; de telefoon van opzij zodat er geen tekst leesbaar is. Op de achtergrond, onscherp, de meterkastdeur of een raam met avondlicht.

```
A Dutch homeowner in his late fifties sits at a kitchen table in early evening light, holding a smartphone at an angle and looking at a simple battery charge-level screen (no readable text, just a bar and a circle). Behind him, slightly out of focus, a kitchen window with the last daylight. Calm, content expression, not smiling at the camera. 4:3 horizontal.
```

### B3 · Thuisbatterij, productstill

- Plek: `/thuisbatterij`, blok "Zo werkt het" en als kaartbeeld in de kennisbank.
- Formaat: 3:2, 1600 × 1067 px. Bestandsnaam `assets/thuisbatterij-still.jpg`.
- Upload: een echte foto van de batterij die de partner levert (het liefst), anders `product-batterij-otgu.jpg`.
- Wie of wat: alleen het product, aan een witte of lichtgrijze muur in een Nederlandse bijkeuken, vloer van tegels, één plant of een bezem erbij zodat het geen catalogus wordt. Geen mensen.

```
Product still of a single wall-mounted home battery with a slim inverter above it, mounted on an off-white wall in a Dutch utility room, grey floor tiles, a mop and bucket in the corner, daylight from the left. Straight-on view, slightly below eye level, no people, no readable text on the device. 3:2 horizontal. Match the shape and finish of the battery in the uploaded photo.
```

### Z1 · Zonnepanelen, hero

- Plek: bovenaan `/zonnepanelen`.
- Formaat: 16:9, 2000 × 1125 px. Bestandsnaam `assets/zonnepanelen-hero.jpg`. Tekst links.
- Upload: `product-zonnepanelen.jpg`, de adviseur die erop mag.
- Wie of wat: adviseur en bewoner in de achtertuin van een rijtjeshuis, beiden kijken omhoog naar het dak met panelen; de adviseur wijst met een map in de hand. Laat de hemel licht bewolkt zijn, niet strakblauw.

```
A SalderingsDienst advisor in a navy polo and a homeowner stand in the small back garden of a Dutch brick terraced house, both looking up at the roof with solar panels; the advisor holds a paper folder and points at the roof. Lightly clouded sky, late morning. The two people and the house are on the right two thirds; the left third is open sky and garden hedge for a headline. 16:9 horizontal. Keep the advisor's likeness exactly as in the uploaded photo.
```

### Z2 · Zonnepanelen, omvormercontrole

- Plek: `/zonnepanelen`, blok "Meer uit uw bestaande dak".
- Formaat: 4:3, 1600 × 1200 px. Bestandsnaam `assets/zonnepanelen-omvormer.jpg`.
- Upload: `werkwijze-4.jpg`.
- Wie of wat: adviseur met tablet voor een omvormer op zolder of in de meterkast; het scherm van de omvormer toont alleen een groen lampje of een grafiekje, geen leesbare tekst.

```
An advisor in a navy polo holds a tablet and checks a wall-mounted solar inverter in a Dutch attic with wooden beams and a small roof window; the inverter shows only a tiny indicator light, no readable text. Side light from the roof window, dust in the air, documentary feel. 4:3 horizontal.
```

### W1 · Warmtepomp, hero

- Plek: bovenaan `/warmtepomp`.
- Formaat: 16:9, 2000 × 1125 px. Bestandsnaam `assets/warmtepomp-hero.jpg`. Tekst links.
- Upload: `product-warmtepomp.webp`, de adviseur die erop mag.
- Wie of wat: buitenunit op een grindstrook naast de zijgevel van een rijtjeshuis; adviseur legt iets uit aan de bewoner, herfstlicht, een paar bladeren op de grond.

```
A heat pump outdoor unit on a gravel strip along the side wall of a Dutch brick terraced house; a SalderingsDienst advisor in a navy polo explains something to a homeowner in her sixties, both standing next to the unit. Autumn, soft overcast light, a few fallen leaves, a wooden fence behind. The unit and people on the right; the left side shows the plain brick wall for a headline. 16:9 horizontal. Keep the advisor's likeness exactly as in the uploaded photo.
```

### W2 · Warmtepomp, binnen

- Plek: `/warmtepomp`, blok "Wat u krijgt".
- Formaat: 4:3, 1600 × 1200 px. Bestandsnaam `assets/warmtepomp-binnen.jpg`.
- Upload: `hero-advies.jpg`.
- Wie of wat: woonkamer met lage-temperatuurradiator of vloerverwarmingsverdeler zichtbaar, bewoner stelt een eenvoudige thermostaat bij; geen merk op de thermostaat.

```
A Dutch living room in winter light: a homeowner adjusts a plain wall thermostat (no brand, no readable text) next to a modern low-temperature radiator; wool blanket on the sofa, a cup of tea on the table. Warm, quiet, lived-in. 4:3 horizontal.
```

### S1 · Slimme energiesturing, meterkast

- Plek: bovenaan `/slimme-energiesturing`.
- Formaat: 16:9, 2000 × 1125 px. Bestandsnaam `assets/sturing-hero.jpg`. Tekst links.
- Upload: `werkwijze-4.jpg`.
- Wie of wat: open Nederlandse meterkast met slimme meter, groepenkast en een klein kastje (de sturing) met één ledje; een monteur sluit het aan. Alles netjes, geen losse draden, geen leesbare tekst.

```
An open Dutch meter cupboard: smart meter, fuse box and a small energy-management box with one indicator LED, all neatly wired; a technician in a navy polo clips the small box onto the rail. Hallway light from the right. The cupboard is on the right half of the frame; the left half is the plain hallway wall for a headline. 16:9 horizontal.
```

### S2 · Slimme energiesturing, prijsgrafiek

- Plek: `/slimme-energiesturing`, blok "Wat u krijgt".
- Formaat: 4:3, 1600 × 1200 px. Bestandsnaam `assets/sturing-prijzen.jpg`.
- Upload: `stap-2.jpg` (man aan tafel met laptop) voor de sfeer.
- Wie of wat: laptop op de keukentafel met een eenvoudige staafgrafiek van uurprijzen (lage en hoge staven, geen cijfers), een hand op het toetsenbord, koffiekop. De grafiek in navy en goud.

```
Close-up over the shoulder of a person at a kitchen table looking at a laptop that shows a simple bar chart of hourly electricity prices in navy and gold (bars of varying height, no readable numbers or words). A coffee cup and reading glasses beside the laptop, morning light. 4:3 horizontal.
```

---

## 3. Fase 2: homepage als etalage

### K1 t/m K4 · Staande productkaarten

- Plek: homepage, sectie "Onze oplossingen", vier kaarten naast elkaar met de titel over de foto.
- Formaat: 4:5 staand, 1120 × 1400 px. Bestandsnamen `assets/kaart-thuisbatterij.jpg`, `assets/kaart-zonnepanelen.jpg`, `assets/kaart-warmtepomp.jpg`, `assets/kaart-sturing.jpg`.
- Werkwijze: laat ChatGPT van B1, Z1, W1 en S1 een staande variant maken ("same scene, vertical 4:5, subject centred, darker and calmer lower third so white text stays readable"). Dan blijven de vier kaarten één familie.

```
Make a vertical 4:5 version of the same scene as the uploaded image: same people, same room, same light. Subject centred in the upper two thirds; the lower third slightly darker and calmer so a white headline stays readable over it. No text in the image.
```

### A1 t/m A3 · Kennisbankkaarten

- Plek: homepage, sectie "Uit de kennisbank", en bovenaan het artikel zelf.
- Formaat: 16:10, 1600 × 1000 px. Bestandsnamen `assets/kb-salderingsgids.jpg`, `assets/kb-thuisbatterij-2027.jpg`, `assets/kb-vast-of-dynamisch.jpg`.
- Geen mensen nodig; stillevens zijn hier rustiger.

A1, gids einde salderingsregeling:

```
Roof of a Dutch brick terraced house with solar panels in low golden evening light, seen from the street at a slight upward angle, a chimney and a neighbouring roof visible, no people, no text. 16:10 horizontal.
```

A2, verdient een thuisbatterij zich terug:

```
A kitchen table with a printed sheet of handwritten calculations (no legible words or numbers), a pen, a calculator and a small printed photo of a wall-mounted home battery; morning light from a window. Top-down angle, no people. 16:10 horizontal.
```

A3, vast of dynamisch contract:

```
An opened envelope with an energy contract letter on a wooden table (text blurred, not legible), a smartphone beside it showing a simple line graph in navy and gold, and a pair of reading glasses; soft daylight. No people. 16:10 horizontal.
```

### H1 · Nieuwe homepage-hero (breed, met ruimte voor de bespaarcheck)

- Plek: homepage, bovenaan; de bespaarcheck-kaart komt rechts over de foto.
- Formaat: 21:9, 2400 × 1030 px, plus een staande uitsnede 909 × 1136 voor mobiel. Bestandsnamen `assets/hero-home.jpg` en `assets/hero-home-mobile.jpg`.
- Upload: `hero-advies.jpg`, foto van Pieter of een andere adviseur.
- Wie of wat: adviseur loopt bij een rijtjeshuis de voortuin in, bewoner opent de deur; de auto (neutraal, donker, geen belettering) staat half in beeld. De rechterhelft moet rustig zijn: de gevel of een haag.

```
A SalderingsDienst advisor in a navy polo with a paper folder walks up the short front path of a Dutch brick terraced house while the homeowner opens the front door and greets him; a dark, unmarked car is partly visible on the left. Overcast soft daylight. The people and the door are on the left half; the right half is a calm brick facade and hedge for a card to be placed over it. Very wide 21:9 horizontal. Keep the advisor's likeness exactly as in the uploaded photo.
```

### C1 · Slot-CTA

- Plek: homepage en productpagina's, onderaan naast "Weet waar u aan toe bent na 2027".
- Formaat: 3:2, 1600 × 1067 px. Bestandsnaam `assets/slot-advies.jpg`.
- Wie of wat: adviseur en bewoner geven elkaar een hand bij de voordeur, van opzij, avondlicht.

```
At the front door of a Dutch terraced house, an advisor in a navy polo and a homeowner shake hands and smile naturally, seen from the side; warm evening light, the hallway lamp on behind them. 3:2 horizontal. Keep the advisor's likeness exactly as in the uploaded photo.
```

---

## 4. Fase 3: zakelijk

### ZK1 · Zakelijk, hero

- Plek: bovenaan `/zakelijk`.
- Formaat: 16:9, 2000 × 1125 px. Bestandsnaam `assets/zakelijk-hero.jpg`. Tekst links.
- Wie of wat: ondernemer en adviseur op het terrein van een middelgroot bedrijfspand (loods met zonnepanelen op het dak), een batterijkast ter grootte van een kledingkast naast de gevel; geen vrachtwagens met merknaam.

```
An advisor in a navy polo and a business owner stand on the yard of a mid-sized Dutch industrial building with solar panels on its flat roof; next to the wall is a wardrobe-sized commercial battery cabinet, unbranded. Overcast daylight, wide view. People and cabinet on the right; the left half shows the plain facade for a headline. 16:9 horizontal.
```

### ZK2 · Zakelijk, sectoren

- Plek: `/zakelijk`, blok "Voor welke bedrijven".
- Formaat: 4:3, 1600 × 1200 px. Bestandsnaam `assets/zakelijk-sector.jpg`.

```
A small Dutch logistics yard at dawn: two electric delivery vans charging at wall chargers against a brick warehouse, no logos or lettering on the vans, a worker walking past with a coffee. Cool morning light with a warm sky. 4:3 horizontal.
```

---

## 5. Wat er niet gegenereerd hoeft te worden

- Portretten van de adviseurs: die staan er al (negen). Van Silvester ligt een nieuwe bronfoto in `assets/` (`foto adviseur 7 silvester.png`); zeg het als die de huidige moet vervangen.
- Klantgezichten: nooit genereren. Echte klant met toestemming, of geen foto.
- OG-afbeeldingen (het plaatje bij delen op WhatsApp en LinkedIn): dat zijn uitsnedes van de hero's op 1200 × 630; die maak ik zelf uit B1, Z1, W1 en S1.

---

## 6. Exporteren en aanleveren

| Gebruik | Maat | Bestanden |
|---|---|---|
| Hero (16:9) | 2000 × 1125, plus 960 × 540 en mobiel 909 × 1136 | `naam.jpg`, `naam-960.jpg`, `naam-mobile.jpg` |
| Blokfoto (4:3 of 3:2) | 1600 breed | `naam.jpg` |
| Staande kaart (4:5) | 1120 × 1400 | `naam.jpg` |
| Kennisbankkaart (16:10) | 1600 × 1000 | `naam.jpg` |

JPG op kwaliteit 80 tot 85. De WebP-versies en de kleinere maten maak ik zelf; de mobiele uitsnede ook, tenzij ChatGPT een betere staande versie geeft. Zet de bestanden in `assets/` en stuur een regel per foto: ID, bestandsnaam, en of er een echte adviseur op staat (naam).

---

## 7. Checklist voor je een foto goedkeurt

- Handen en gezichten kloppen (vingers tellen, geen dubbele oren).
- Nergens leesbare tekst of een vreemd logo; alleen "SalderingsDienst" op het shirt mag.
- Geen felgroen (dat is de kleur van groenplan.com), geen knalblauwe lucht.
- Het huis oogt Nederlands: baksteen, Nederlandse kozijnen, Nederlandse meterkast, geen Amerikaanse garage.
- Het product klopt: één wandbatterij, geen science-fiction; buitenunit op pootjes op grind; panelen op een schuin pannendak.
- De lege ruimte voor de kop zit aan de goede kant (staat per foto vermeld).
- Het beeld past naast `hero-advies.jpg`: zelfde warmte, zelfde rust.
