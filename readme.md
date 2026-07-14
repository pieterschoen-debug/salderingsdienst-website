# SalderingsDienst — Design System

Onafhankelijk energieadvies voor huiseigenaren met zonnepanelen. SalderingsDienst helpt mensen begrijpen wat het einde van de salderingsregeling (per 1 januari 2027) voor hun woning betekent, via een kosteloos, vrijblijvend adviesgesprek. The brand voice is **authoritative, calm, and trustworthy** — closer to a public-service body or a notary than a solar-panel salesman.

## Sources
This system was distilled from two existing brand artifacts in this project:
- `Salderingsdienst Brief.dc.html` — the official advice letter (front + inside), styled after a Dutch government letter (Belastingdienst proportions): centred navy crest bar, monospace address block, KIX barcode, reference column.
- `Salderingsdienst.dc.html` — the advice landing page with a working booking system.

Brand assets: `assets/crest.png` (crest logo), `assets/hero-photo.webp`, `assets/qr.png`.

---

## CONTENT FUNDAMENTALS

**Language:** Dutch, formal register. Always address the reader with **"u" / "uw"** — never "je". Emphasis is often placed on the possessive with an accent ("úw woning", "úw situatie", "úw cijfers") to stress that advice is personalised, not generic.

**Tone:** Reassuring authority. Short, declarative sentences. Leads with the reader's situation and benefit, not with products. The brand explicitly does **not** hard-sell batteries — "Wij verkopen geen panelen en geen batterijen." Independence is the central promise.

**Casing:** Sentence case for headings and body. Section eyebrow labels are **UPPERCASE** with wide letter-spacing ("WAT WIJ DOEN", "WERKWIJZE"). The wordmark is **SalderingsDienst** (camel-cased D).

**Recurring phrases:** "Kosteloos · Onafhankelijk · Geen verplichtingen", "vrijblijvend adviesgesprek", "Plan uw adviesgesprek", "ook na 2027". The date **1 januari 2027** anchors most copy.

**No emoji.** A single check glyph (✓) is used for confirmation/affirmation states only. Numbers are written as digits in dates and lists.

**Example copy:**
- Headline: *"Onafhankelijk advies over uw zonnepanelen na 2027."*
- Lead: *"De salderingsregeling verdwijnt. Wij brengen voor úw woning in kaart wat dat betekent — en hoe u zoveel mogelijk voordeel uit uw zonnestroom blijft halen."*
- Reassurance: *"Eén belang: dat van u."*

---

## VISUAL FOUNDATIONS

**Color.** Deep institutional **navy** is the brand spine (`#1a4571` primary; darker `#14324f`–`#0e2236` for hero/footer fields). A muted **gold** (`#e7c98a` / `#b98a3e`) is the only accent — used sparingly for eyebrow labels, the announcement-pill dot, and card hover borders; never as large fills. Neutrals are a **warm paper** family (`#faf8f4` page, `#f7f5f0` quiet fill, `#ece7dc` hairlines) rather than cool greys — this gives the brand its calm, printed-letter warmth. Text is warm-charcoal ink, not pure black.

**Type.** Two-family pairing: **PT Serif** for all display, headings, the wordmark, and editorial accents (it carries the authority); **Source Sans 3** for body, UI and controls. **Cousine** (monospace) appears only on correspondence — address blocks and reference codes on the letter. Display headings are large with tight negative tracking (`-0.5px`) and line-height ~1.1; eyebrows are 14px uppercase at +1.5px.

**Spacing & layout.** Generous. Sections breathe at ~90px vertical padding; content sits in a 1180px container (820px for reading-width FAQ). Grids use explicit `gap`, never inline-flow spacing.

**Backgrounds.** Mostly flat warm paper and flat/subtle-gradient navy bands. The hero uses a soft top-to-bottom navy gradient with faint concentric outline circles (low-opacity white rings) as the only decorative motif. No textures, no noise, no busy patterns.

**Photography.** Real, warm-toned imagery (advisor / home with solar) in rounded 18px frames with a deep soft shadow. Cool/clinical stock is avoided.

**Corners & cards.** Soft but not pill-round: inputs/buttons 7px, chips/panels 10–14px, feature panels & hero photo 18px. Cards are white on paper with a 1px warm border (`#e6e0d4`); on hover the border shifts to gold. Announcement labels are full pills (100px).

**Shadows.** Restrained and navy-tinted, layered by elevation: button `0 1px 2px rgba(20,50,79,.25)`, selected chip `0 3px 10px rgba(26,69,113,.30)`, floating badge `0 14px 34px rgba(8,22,38,.30)`, booking panel `0 24px 60px rgba(20,50,79,.10)`, hero photo `0 30px 60px rgba(8,22,38,.45)`.

**Borders & dividers.** 1px warm hairlines (`#ece7dc`) separate sections and FAQ rows. Inputs use a slightly stronger `#d9d3c6` field border that turns navy on focus.

**Hover / press states.** Buttons darken navy (`#1a4571` → `#163c63`); secondary/ghost get a faint fill; cards gain a gold border; links shift toward navy. Transitions are quick and understated (~.15s, ease). No bounces, no large motion — the brand reads as composed and serious.

**Selected states.** Booking date/time chips invert to solid navy with white text and a soft navy shadow when chosen.

**Transparency & blur.** The sticky nav uses translucent paper (`rgba(250,248,244,.92)`) with `backdrop-filter: blur(10px)`. Navy reason-cards use very low-opacity fills over the gradient.

---

## ICONOGRAPHY

The brand is **near-iconless by design** — authority comes from type, color and whitespace, not from a busy icon set. Where marks are needed:
- **Numbered markers** (serif numerals in bordered squares / navy circles) stand in for step and service icons.
- A small **gold dot** precedes the announcement pill and trust-band items.
- The **✓ check glyph** marks confirmation and affirmation states (booking success, hero "eerstvolgende afspraak" badge).
- The crest (`assets/crest.png`) is the only logo mark; it pairs with the serif wordmark on both light and navy.

No icon font, no emoji, no decorative SVG illustration. If a future surface genuinely needs line icons, use a restrained, thin-stroke set (e.g. Lucide) in navy — and flag the addition, since it's an extension of the current system, not part of it.

---

## INDEX / MANIFEST

**Root**
- `styles.css` — single entry point (imports all tokens + fonts).
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `fonts.css`.
- `assets/` — `crest.png`, `hero-photo.webp`, `qr.png`.
- `SKILL.md` — Agent-Skill manifest.

**Components** (`components/`)
- `core/Button` — navy CTA (primary / secondary / ghost / light; sm/md/lg).
- `core/Badge` — eyebrow label, announcement pill, solid & success chips.
- `core/Card` — numbered service/feature card.
- `forms/Input` — text field & textarea with navy focus ring.
- `feedback/Accordion` — FAQ disclosure row.

**Foundation cards** (`guidelines/`) — Colors (navy, gold, neutrals), Type (serif, sans, mono), Spacing (scale, radii & shadows), Brand (logo, eyebrow).

**UI kit** (`ui_kits/website/`) — full landing-page recreation composing the components (nav, hero, services, werkwijze, waarom, booking, FAQ, footer).

---

## CAVEATS / FONT SUBSTITUTION
- **Fonts are Google Fonts** (PT Serif, Source Sans 3, Cousine) loaded via CDN — these match the look of the existing letter and landing page but were not supplied as licensed files. If you have official brand font files, share them and I'll self-host them via `@font-face`.
- Colors and type were reverse-engineered from the existing artifacts, not from a formal brand book. If an official palette/typeface guide exists, send it and I'll reconcile.

---

## SITE, BACKEND & WIDGET (juli 2026)

De productiesite is statisch (index.html + css/ + js/) met **Vercel serverless functions** in `api/`.

**Scripts** (Node ≥ 18):
- `npm run build` — controleert syntax, kernbestanden, markers en dat er geen API-keys in de code staan.
- `npm run dev` — lokale server (poort 4173) die statica + `/api/*` draait en `.env.local` inleest.

**Environment variables** (Vercel → Project Settings → Environment Variables):
- `KIMI_API_KEY` — verplicht voor de chatbot (Kimi/Moonshot AI, internationaal endpoint api.moonshot.ai; account moet tegoed hebben).
- `KIMI_MODEL` — optioneel, standaard `moonshot-v1-auto`. Vermijd de kimi-k2.x-serie als standaard: dat zijn redeneermodellen die tokens verbruiken aan onzichtbare "reasoning" vóór het echte antwoord, met kans op een leeg antwoord bij een laag max_tokens-budget.
- `PORTAL_PASSWORD` — verplicht voor het /portal-overzicht en `GET /api/bookings`.
- Database (kies één, of geen — dan draait opslag in-memory en is alleen de lokale leadwachtrij persistent):
  - Supabase: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (tabel-SQL staat in `api/_lib/store.js`).
  - Vercel Postgres / Neon: `DATABASE_URL` (tabel wordt automatisch aangemaakt).

**Endpoints**
- `POST /api/bookings` — slaat een boeking (schema `sd.lead.v1`) op; de kwalificatiestatus (`warm_gekwalificeerd` / `niet_gekwalificeerd`) wordt server-side afgeleid uit de "6 van Succes". Alleen warm gekwalificeerde leads zijn verkoopbaar.
- `GET /api/bookings` — overzicht (vereist portal-login).
- `POST /api/portal-login` — login/logout voor `/portal`.
- `POST /api/chat` — Kimi-proxy voor de digitale adviseur (rate-limited).

**Boekingswidget embedden op een partnersite**
```html
<script src="https://www.salderingsdienst.nl/js/embed.js"
        data-source="partner-x" async></script>
```
`data-source` komt als `source.partner` terug in elke lead (attributie). Het widget draait geïsoleerd in een iframe (`/widget`) en groeit automatisch mee.
