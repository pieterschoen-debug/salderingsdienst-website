/* ============================================================
   SalderingsDienst — scrolly.js
   Scrollytelling "Wat verandert er voor uw woning?" in 5 stappen.

   Bewust NIET scroll-gescrubd en zonder overgangsanimaties: de
   vijf illustraties zijn als statische composities goedgekeurd.
   Desktop (≥900px) toont één sticky scene (svg.scene5) die per
   stap DISCREET wisselt van laag en uitsnede: dit script zet
   alleen data-step (CSS regelt welke sc-*-groepen zichtbaar
   zijn) en de bijbehorende viewBox. Mobiel heeft per stap een
   eigen inline illustratie in de HTML; daar doet dit script
   niets.

   De enige beweging zit ÓP de illustraties zelf en leeft in de
   markup/CSS: stroom-bolletjes via SMIL <animateMotion>,
   vallende druppels, batterijgloed en de onderlijn van stap 5
   (die start zodra data-step="5" actief wordt). Geen GSAP.
   ============================================================ */
(function () {
  'use strict';

  var section = document.querySelector('[data-scrolly]');
  if (!section) return;
  var svg = section.querySelector('svg.scene5');
  var steps = Array.prototype.slice.call(section.querySelectorAll('.scrolly-step[data-step]'));
  if (!svg || !steps.length) return;

  /* Uitsnede per stap — identiek aan de goedgekeurde mobiele minis.
     Het svg-element houdt een vaste kaderverhouding (CSS aspect-ratio);
     kleinere uitsnedes centreren daarbinnen (xMidYMid meet). */
  var VIEW = {
    1: '60 36 600 304',
    2: '60 36 600 304',
    3: '60 36 600 304',
    4: '160 90 400 230',
    5: '80 140 600 140'
  };

  function setStep(n) {
    svg.setAttribute('data-step', String(n));
    if (VIEW[n]) svg.setAttribute('viewBox', VIEW[n]);
  }
  setStep(1);

  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      setStep(parseInt(entry.target.getAttribute('data-step'), 10));
    });
  }, { rootMargin: '-40% 0px -40% 0px' });
  steps.forEach(function (step) { io.observe(step); });
})();
