# Experimenten — zoek- en AI-zichtbaarheid salderingsdienst.nl

Per experiment: hypothese, wijziging, meetmethode, startdatum, uitkomst. Geen causale claims op minder dan 4 weken data of tijdens een lopende Google-update.

| Nr | Hypothese | Wijziging | Meetmethode | Start | Uitkomst |
|---|---|---|---|---|---|
| E1 | Zonder landingspagina, referrer en UTM per lead is niet vast te stellen welk kanaal gekwalificeerde adviesgesprekken oplevert | Attributie in `lead.source` (landing, referrer-host, utm first-touch, submit-pagina, serverside `verkeerskanaal`) | Wekelijks: leads en gekwalificeerde leads per `verkeerskanaal` en per `landing` uit `sd_bookings` (leesquery, zie baseline.md) | nog niet live (wacht op "go" voor productie) | — |
| E2 | De vaste set van 20 commerciële zoekvragen laat maandelijks zien of en hoe wij in ChatGPT, Google AI Mode, Copilot en Perplexity genoemd worden | Handmatige nulmeting (zie baseline.md, sectie AI-zichtbaarheid) | Per vraag en per tool: genoemd ja/nee, positie, geciteerde URL, genoemde concurrenten | 2026-10 (nulmeting nog uit te voeren, deels door Pieter: AI Mode en Copilot vereisen een ingelogd account) | — |
