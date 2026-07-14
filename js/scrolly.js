/* ============================================================
   SalderingsDienst — scrolly.js
   Scrollytelling "Wat verandert er voor uw woning?" in 5 stappen.

   Conceptueel verhaal zonder eurobedragen (Prompt A+). Op desktop
   (≥900px) wordt de sticky scene (svg.scene5) met GSAP
   ScrollTrigger aan de scroll gekoppeld (trigger: sectie, start
   "top top", end "bottom bottom", scrub 0.5, geen snap): lagen
   kruisvervagen en de viewBox zoomt per stap (geen
   scale-transforms). GSAP doet ENKEL de scroll-koppeling; alle
   loop-beweging (stroom-bolletjes, vallende druppels,
   batterijgloed, pulserende dal/piek-pijlen) is SMIL/CSS en
   leeft in de markup.

   Fallbacks:
   - prefers-reduced-motion of geen GSAP (CDN faalt): discrete
     stap-toggle via IntersectionObserver — de scene toont per
     stap direct de eindtoestand (data-step + viewBox, CSS regelt
     de laagzichtbaarheid), en SMIL wordt stilgezet.
   - zonder JavaScript: html mist de .js-klasse en de vijf
     illustraties tonen als statische secties onder elkaar
     (css/main.css).
   ============================================================ */
(function () {
  'use strict';

  var section = document.querySelector('[data-scrolly]');
  if (!section) return;
  var svg = section.querySelector('svg.scene5');
  var steps = Array.prototype.slice.call(section.querySelectorAll('.scrolly-step[data-step]'));
  if (!svg || !steps.length) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Uitsnede per stap (spec Prompt A+): stap 4 zoomt op de batterij. */
  var VIEW = {
    1: '0 0 720 400',
    2: '0 0 720 400',
    3: '0 0 720 400',
    4: '200 50 320 300',
    5: '0 0 720 400'
  };
  var ARIA = {
    1: 'Stap 1: Saldering tot 31 december 2026. Teruggeleverde stroom wordt 1-op-1 weggestreept.',
    2: 'Stap 2: Na 2027 vervalt de salderingsregeling. Teruggeleverde stroom heeft vrijwel geen waarde.',
    3: 'Stap 3: Een thuisbatterij slaat overtollige stroom op voor eigen gebruik. De waarde van uw opgewekte energie blijft behouden.',
    4: 'Stap 4: Energiemanagement via uw thuisbatterij. Stroom wordt ingekocht bij een laag tarief en teruggeleverd bij een hoog tarief. Dit levert extra inkomen op.',
    5: 'Stap 5: Samenvatting. Wij rekenen uit wat het einde van de salderingsregeling voor uw situatie betekent. Plan een gratis adviesgesprek.'
  };

  var current = 1;
  var scrubbing = false; /* true zodra GSAP de lagen en viewBox bestuurt */

  function activate(n) {
    current = n;
    svg.setAttribute('aria-label', ARIA[n]);
    if (!scrubbing) {
      svg.setAttribute('data-step', String(n));
      svg.setAttribute('viewBox', VIEW[n]);
    }
  }
  activate(1);

  /* Reduced motion: ook de SMIL-loops (bolletjes, pulsen) stilzetten;
     CSS zet de keyframe-animaties (druppels, gloed) al stil. */
  if (reduceMotion) {
    Array.prototype.forEach.call(section.querySelectorAll('svg'), function (s) {
      if (s.pauseAnimations) s.pauseAnimations();
    });
  }

  /* ---------- Toetsenbord: sectie is focusbaar (tabindex=0);
     pijl-omlaag/spatie = volgende stap, pijl-omhoog = vorige. ---------- */
  section.addEventListener('keydown', function (e) {
    if (e.target !== section) return; /* CTA en links behouden hun eigen gedrag */
    var next = null;
    if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Spacebar') next = Math.min(steps.length, current + 1);
    else if (e.key === 'ArrowUp') next = Math.max(1, current - 1);
    if (next === null) return;
    e.preventDefault();
    if (next === current) return;
    steps[next - 1].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  });

  /* ---------- Stapdetectie (aria + fallback-toggle) ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        activate(parseInt(entry.target.getAttribute('data-step'), 10));
      });
    }, { rootMargin: '-40% 0px -40% 0px' });
    steps.forEach(function (step) { io.observe(step); });
  }

  /* ---------- GSAP-scrub (alleen desktop, met beweging, met GSAP) ---------- */
  if (reduceMotion) return;
  if (!window.matchMedia('(min-width: 900px)').matches) return;
  if (!window.gsap || !window.ScrollTrigger) return;
  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);

  /* De site scrolt met CSS scroll-behavior:smooth; dat verstoort de
     positiemetingen van ScrollTrigger.refresh() (start/end komen dan
     precies scrollY te laag uit). Daarom volgt op elke refresh
     (load, resize, restore) één gecorrigeerde her-refresh met
     scroll-behavior tijdelijk op 'auto'; die meet wél goed. De
     vlag voorkomt dat de correctie zichzelf blijft aanroepen. */
  var fixingRefresh = false;
  window.ScrollTrigger.addEventListener('refresh', function () {
    if (fixingRefresh) return;
    fixingRefresh = true;
    setTimeout(function () {
      var el = document.documentElement;
      el.style.scrollBehavior = 'auto';
      window.ScrollTrigger.refresh();
      el.style.scrollBehavior = '';
      fixingRefresh = false;
    }, 80);
  });

  var q = function (sel) { return svg.querySelector(sel); };
  var base = q('.sc-base'), green = q('.sc-green'), blue = q('.sc-blue'), gold = q('.sc-gold'),
      ground = q('.sc-ground'), leak = q('.sc-leak'), batt = q('.sc-batt'), circ = q('.sc-circ'),
      big = q('.sc-big'), dal = q('.sc-big-dal'), piek = q('.sc-big-piek'), marge = q('.sc-big-marge'),
      tlijn = q('.sc-tl');
  if (!base || !big || !tlijn) return;

  scrubbing = true;
  svg.setAttribute('data-step', '1');
  svg.setAttribute('viewBox', VIEW[1]);

  /* Inline beginstanden zodat de CSS-fallbackregels nooit meevechten. */
  gsap.set([base, green, blue, gold], { opacity: 1 });
  gsap.set([ground, leak, circ, big, dal, piek, marge, tlijn], { opacity: 0 });
  gsap.set(batt, { opacity: 0, scale: 0.8, svgOrigin: '511 276' }); /* entree: 0.8 -> 1.0 */

  /* Tijdas: 1 eenheid per stap (5 totaal); overgangen rond de
     stapgrenzen. Getriggerd op de stappenkolom t.o.v. het
     viewport-midden, zodat scene en tekststap synchroon lopen
     (de sectiekop boven de kolom telt dan niet mee). */
  var tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section.querySelector('[data-scrolly-steps]') || section,
      start: 'top center',
      end: 'bottom center',
      scrub: 0.5,
      snap: false,
      onUpdate: function (self) {
        var n = Math.max(1, Math.min(steps.length, Math.floor(self.progress * steps.length) + 1));
        if (n !== current) { current = n; svg.setAttribute('aria-label', ARIA[n]); }
      }
    }
  });

  /* 1 -> 2: saldering (goud) verdwijnt, teruglevering wordt lek. */
  tl.to(gold,  { opacity: 0, duration: 0.15 }, 0.85)
    .to(blue,  { opacity: 0, duration: 0.15 }, 0.90)
    .to([ground, leak], { opacity: 1, duration: 0.20 }, 1.00)

    /* 2 -> 3: lek stopt, batterij verschijnt (power2.out), circuit gaat lopen. */
    .to([leak, ground], { opacity: 0, duration: 0.15 }, 1.85)
    .to(batt,  { opacity: 1, scale: 1, duration: 0.20, ease: 'power2.out' }, 2.00)
    .to(circ,  { opacity: 1, duration: 0.15 }, 2.10)

    /* 3 -> 4: zoom op de batterij; huis/zon naar de achtergrond. */
    .to([circ, green], { opacity: 0, duration: 0.12 }, 2.85)
    .to(batt,  { opacity: 0, duration: 0.12 }, 2.88)
    .to(base,  { opacity: 0.3, duration: 0.20 }, 2.90)
    .to(svg,   { attr: { viewBox: VIEW[4] }, duration: 0.35 }, 2.90)
    .to(big,   { opacity: 1, duration: 0.18 }, 3.05)
    /* sub-fasen: eerst dal, dan piek, dan de marge-indicator */
    .to(dal,   { opacity: 1, duration: 0.12 }, 3.25)
    .to(piek,  { opacity: 1, duration: 0.12 }, 3.45)
    .to(marge, { opacity: 1, duration: 0.12 }, 3.65)

    /* 4 -> 5: uitzoomen naar de tijdlijn (overlappend, geen leeg beeld). */
    .to([big, base], { opacity: 0, duration: 0.15 }, 3.85)
    .to(svg,   { attr: { viewBox: VIEW[5] }, duration: 0.35 }, 3.90)
    .to(tlijn, { opacity: 1, duration: 0.30 }, 3.95)
    .to({},    { duration: 0.75 }, 4.25);

  /* Tellers: fade-in van 0,6s bij binnenkomst (los van de scrub). */
  Array.prototype.forEach.call(section.querySelectorAll('.scrolly-teller'), function (t) {
    gsap.from(t, {
      opacity: 0, duration: 0.6, ease: 'power1.out',
      scrollTrigger: { trigger: t, start: 'top 80%' }
    });
  });
})();
