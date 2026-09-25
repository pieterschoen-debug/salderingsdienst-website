/* ============================================================
   SalderingsDienst — analytics.js
   Google Analytics 4, meet-id G-XN788FNCZS.

   Meet zonder cookiebalk, op verzoek (25 september 2026). Om
   binnen de voorwaarden voor consent-vrije analytics te blijven
   staat IP-anonimisering aan en zijn de advertentiesignalen uit;
   de overige voorwaarden (verwerkersovereenkomst, geen deling
   met Google voor eigen doeleinden) zijn accountinstellingen in
   GA, niet iets wat hier in de code staat.

   Dit bestand is ook de sink voor window.sdTrack. De ruim dertig
   data-track-events die de site al afvuurt kwamen tot nu toe
   nergens aan: sdTrack duwde alleen naar dataLayer en GA4 leest
   daar niet uit.

   Laden vóór motion.js, zodat sdTrack bestaat als SD.track voor
   het eerst vuurt.
   ============================================================ */
(function () {
  'use strict';

  var MEETID = 'G-XN788FNCZS';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag('js', new Date());
  gtag('config', MEETID, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEETID);
  document.head.appendChild(s);

  /* ---------- Sink voor de bestaande data-track-events ---------- */
  window.sdTrack = function (event, params) {
    try {
      window.gtag('event', event, params || {});
    } catch (e) {}
  };
})();
