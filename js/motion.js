/* ============================================================
   SalderingsDienst — motion.js
   Navigatie, tellers, adres-check, calculator, FAQ, chat
   en contact-configuratie (cookiebalk: js/analytics.js). Beweging is beperkt tot
   één IntersectionObserver voor fade-in-up van secties.
   Alle onderdelen zijn defensief: op subpagina's ontbreken de
   meeste elementen en gebeurt er dan simpelweg niets.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Gedeelde tracking-laag (ook gebruikt door booking.js) ---------- */
  var utm = {};
  try {
    var params = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref'].forEach(function (k) {
      if (params.get(k)) utm[k] = params.get(k);
    });
  } catch (e) {}

  var fired = {};
  window.SD = {
    utm: utm,
    track: function (name, extra) { if (window.sdTrack) window.sdTrack(name, Object.assign({}, utm, extra || {})); },
    fire: function (name, extra) { if (fired[name]) return; fired[name] = 1; window.SD.track(name, extra); },
    /* Leadkanaal (schema sd.lead.v1) — één route voor alle formulieren:
       wachtrij 'sd_lead_queue' (herplannen vervangt op ref), CustomEvent
       'sd:lead' en optionele POST naar SD_CONFIG.leadEndpoint. */
    lead: function (lead) {
      try {
        var queue = JSON.parse(localStorage.getItem('sd_lead_queue')) || [];
        queue = queue.filter(function (l) { return l.ref !== lead.ref; });
        queue.push(lead);
        localStorage.setItem('sd_lead_queue', JSON.stringify(queue));
      } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('sd:lead', { detail: lead })); } catch (e) {}
      var endpoint = (window.SD_CONFIG || {}).leadEndpoint;
      if (endpoint && window.fetch) {
        fetch(endpoint, {
          method: 'POST', keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead)
        }).catch(function () {}); /* fire-and-forget; de wachtrij blijft de bron */
      }
    }
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (el) window.SD.track(el.getAttribute('data-track'));
  });

  /* ---------- Contactgegevens: eerlijke placeholders ---------- */
  var cfg = window.SD_CONFIG || {};
  var PH = 'TE VERVANGEN';
  var phone = cfg.phone || PH, email = cfg.email || PH, kvk = cfg.kvk || PH;
  var phoneSet = phone !== PH, emailSet = email !== PH, kvkSet = kvk !== PH;
  var telHref = phoneSet ? 'tel:+31' + phone.replace(/\D/g, '').replace(/^0/, '') : '#adviesgesprek';
  var waNumber = (cfg.whatsapp || '').replace(/\D/g, '');
  var waHref = waNumber ? 'https://wa.me/' + waNumber : '#adviesgesprek';

  function all(sel, fn) { document.querySelectorAll(sel).forEach(fn); }
  /* Herbruikbaar: ook componenten die later renderen (booking-widget)
     roepen dit aan op hun eigen subtree. */
  function applyContacts(root) {
    root = root || document;
    var sub = function (sel, fn) { root.querySelectorAll(sel).forEach(fn); };
    sub('[data-sd-tel]', function (a) { a.href = telHref; });
    sub('[data-sd-wa]', function (a) { a.href = waHref; });
    sub('[data-sd-mail]', function (a) { a.href = emailSet ? 'mailto:' + email : '#'; });
    sub('[data-sd-kvk]', function (el) { el.textContent = kvk; if (!kvkSet) el.classList.add('placeholder-mark'); });
    sub('[data-sd-phone-text]', function (el) { el.textContent = phone; if (!phoneSet) el.classList.add('placeholder-mark'); });
    sub('[data-sd-mail-text]', function (el) { el.textContent = email; if (!emailSet) el.classList.add('placeholder-mark'); });
    sub('[data-sd-tel-label]', function (el) { el.textContent = phoneSet ? 'Bel ' + phone : 'Bel ons'; });
  }
  applyContacts(document);
  window.SD.applyContacts = applyContacts;

  /* ---------- Fade-in-up bij in beeld komen (enige scroll-beweging) ---------- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var rvObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('rv-in'); rvObserver.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    all('.rv', function (el) { el.classList.add('rv-js'); rvObserver.observe(el); });
  }

  /* ---------- Teller-hulpfunctie (count-up, ease-out) ---------- */
  function countUp(el, from, to, ms, fmt) {
    fmt = fmt || function (n) { return String(Math.round(n)); };
    if (reduceMotion || ms <= 0 || document.hidden) { el.textContent = fmt(to); return; }
    var t0 = null, done = false;
    function step(t) {
      if (done) return;
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / ms);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(step); else done = true;
    }
    requestAnimationFrame(step);
    /* Vangnet: als rAF niet vuurt (verborgen tab), toch de eindstand tonen. */
    setTimeout(function () { if (!done) { done = true; el.textContent = fmt(to); } }, ms + 150);
  }
  window.SD.countUp = countUp;

  /* ---------- Header: schaduw zodra de pagina scrolt ---------- */
  var siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    var hdrPending = false;
    var setHdr = function () { siteHeader.classList.toggle('is-scrolled', window.scrollY > 8); hdrPending = false; };
    window.addEventListener('scroll', function () {
      if (!hdrPending) { hdrPending = true; requestAnimationFrame(setHdr); }
    }, { passive: true });
    setHdr();
  }

  /* ---------- Navigatie: burger + full-screen overlay ---------- */
  var burger = document.querySelector('[data-nav-toggle]');
  if (burger) {
    var setNav = function (open) {
      document.body.classList.toggle('nav-open', open);
      burger.setAttribute('aria-expanded', String(open));
      var overlay = document.getElementById('nav-overlay');
      if (overlay) overlay.setAttribute('aria-hidden', String(!open));
    };
    burger.addEventListener('click', function () { setNav(!document.body.classList.contains('nav-open')); });
    all('[data-nav-close]', function (a) { a.addEventListener('click', function () { setNav(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
  }

  /* ---------- Urgentiebalk: dagen tot 1 januari 2027 (statisch per pageview) ---------- */
  var TARGET = new Date('2027-01-01T00:00:00').getTime();
  var daysLeft = String(Math.max(0, Math.floor((TARGET - Date.now()) / 86400000)));
  var daysEl = document.querySelector('[data-count-days]');
  if (daysEl) { daysEl.textContent = daysLeft; daysEl.setAttribute('aria-label', daysLeft + ' dagen'); }
  document.querySelectorAll('[data-count-days-2]').forEach(function (el) { el.textContent = daysLeft; });
  /* Voortgangslijn: verstreken deel van 1 jan 2025 → 1 jan 2027 (één keer gezet) */
  var urgencyBar = document.querySelector('[data-urgency-progress]');
  if (urgencyBar) {
    var U_START = new Date('2025-01-01T00:00:00').getTime();
    var pct = Math.min(1, Math.max(0, (Date.now() - U_START) / (TARGET - U_START)));
    urgencyBar.style.setProperty('--urgency-pct', String(pct));
  }

  /* ---------- Sticky mobiele CTA: pas tonen ná de hero ---------- */
  var mobileCta = document.querySelector('.mobile-cta');
  var heroEl = document.querySelector('.hero');
  if (mobileCta && heroEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { mobileCta.classList.toggle('is-visible', !en.isIntersecting && en.boundingClientRect.bottom < 0); });
    }, { threshold: 0 }).observe(heroEl);
  }

  /* De bespaarcheck zelf staat in js/funnel.js; die vult ook
     window.SD.calcState voor het terugbelverzoek hieronder. */

  /* ---------- Terugbelverzoek bij de calculator ----------
     Twee velden: wie belt u en waarover. De uitkomst van de calculator gaat
     mee in de lead, zodat de adviseur het gesprek kan voorbereiden. */
  var cbForm = document.querySelector('[data-callback]');
  if (cbForm) {
    var cbPhone = cbForm.querySelector('[data-cb-phone]');
    var cbEmail = cbForm.querySelector('[data-cb-email]');
    var cbNote = cbForm.querySelector('[data-cb-note]');
    var cbDefaultNote = cbNote.textContent;

    var phoneOk = function (v) { return v.replace(/[^0-9]/g, '').length >= 10; };
    var mailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); };

    var flag = function (el, ok) {
      if (ok) el.removeAttribute('aria-invalid'); else el.setAttribute('aria-invalid', 'true');
      return ok;
    };

    cbForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var phone = cbPhone.value.trim();
      var email = cbEmail.value.trim();
      var okPhone = flag(cbPhone, phoneOk(phone));
      var okMail = flag(cbEmail, mailOk(email));
      if (!okPhone || !okMail) {
        cbNote.setAttribute('data-state', 'error');
        cbNote.textContent = !okPhone
          ? 'Vul een geldig telefoonnummer in, dan bellen wij u.'
          : 'Vul een geldig e-mailadres in.';
        (okPhone ? cbEmail : cbPhone).focus();
        return;
      }
      cbNote.removeAttribute('data-state');
      cbNote.textContent = cbDefaultNote;

      var calc = window.SD.calcState ? window.SD.calcState() : {};
      window.SD.track('lead_capture', { via: 'calculator' });
      window.SD.lead({
        schema: 'sd.lead.v1',
        type: 'callback_request',
        ref: 'SD-BEL-' + Date.now().toString(36).toUpperCase().slice(-6),
        createdAt: new Date().toISOString(),
        contact: { email: email, phone: phone },
        calculator: calc,
        consent: { privacyNotice: true, callback: true },
        source: { page: location.pathname, utm: (window.SD.utm || {}) }
      });

      cbForm.innerHTML = '<p class="callback-done">Bedankt, wij bellen u binnen 1 werkdag op ' +
        phone.replace(/[<>&]/g, '') + ' met de doorrekening voor uw woning.</p>';
    });
  }

  /* ---------- Transparantie-uitklapper: tracken bij openen ---------- */
  var transparency = document.querySelector('[data-transparency]');
  if (transparency) {
    transparency.addEventListener('toggle', function () {
      if (transparency.open) window.SD.track('transparency_open');
    });
  }

  /* ---------- FAQ-accordion (één open tegelijk) ---------- */
  all('[data-faq]', function (faq) {
    var items = faq.querySelectorAll('.faq-item');
    items.forEach(function (item) {
      var btn = item.querySelector('.faq-q');
      btn.addEventListener('click', function () {
        var wasOpen = item.classList.contains('open');
        items.forEach(function (it) {
          it.classList.remove('open');
          it.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  });

  /* ---------- Zwevend contact (mobiele FAB) ---------- */
  var fabToggle = document.querySelector('[data-fab-toggle]');
  if (fabToggle) {
    fabToggle.addEventListener('click', function () {
      var floating = document.querySelector('[data-floating]');
      var open = floating.classList.toggle('open');
      fabToggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------- Digitale adviseur (chat) ---------- */
  var chatPanel = document.querySelector('[data-chat-panel]');
  if (chatPanel) {
    var chatBody = chatPanel.querySelector('[data-chat-body]');
    var chatInput = chatPanel.querySelector('[data-chat-input]');
    var chatCta = chatPanel.querySelector('[data-chat-cta]');
    var chatLoading = false;
    var msgs = [{ role: 'assistant', content: chatBody.querySelector('.chat-msg').textContent }];

    var addMsg = function (role, content) {
      var div = document.createElement('div');
      div.className = 'chat-msg ' + (role === 'user' ? 'chat-msg--user' : 'chat-msg--bot');
      div.textContent = content;
      chatBody.appendChild(div);
      chatBody.scrollTop = chatBody.scrollHeight;
      return div;
    };

    var openChat = function () { window.SD.track('chat_open'); chatPanel.hidden = false; chatInput.focus(); };
    all('[data-chat-open]', function (btn) {
      btn.addEventListener('click', function () {
        var floating = document.querySelector('[data-floating]');
        if (floating) { floating.classList.remove('open'); }
        openChat();
      });
    });
    chatPanel.querySelector('[data-chat-close]').addEventListener('click', function () { chatPanel.hidden = true; });

    /* Backend: /api/chat (Vercel function → Kimi/Moonshot AI). De systemprompt en
       kennis leven server-side; hier gaat alleen de gespreksgeschiedenis heen. */
    var CHAT_FALLBACK = 'De adviseur is hier even niet beschikbaar. Plan gerust een kosteloos adviesgesprek of app ons via WhatsApp, we helpen u graag persoonlijk verder.';
    var runChat = function () {
      var q = chatInput.value.trim();
      if (!q || chatLoading) return;
      msgs.push({ role: 'user', content: q });
      addMsg('user', q);
      chatInput.value = '';
      chatLoading = true;
      window.SD.track('chat_message');
      var typing = addMsg('bot', '');
      typing.classList.add('chat-msg--typing');
      typing.setAttribute('aria-label', 'Adviseur typt');
      typing.innerHTML = '<span class="tdot"></span><span class="tdot"></span><span class="tdot"></span>';
      var done = function (text, showBooking) {
        typing.classList.remove('chat-msg--typing');
        typing.removeAttribute('aria-label');
        typing.textContent = text;
        msgs.push({ role: 'assistant', content: text });
        chatLoading = false;
        if (showBooking) chatCta.hidden = false;
        chatBody.scrollTop = chatBody.scrollHeight;
      };
      var endpoint = (window.SD_CONFIG || {}).chatEndpoint;
      if (!endpoint || !window.fetch) { done(CHAT_FALLBACK, true); return; }
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs.slice(-12) })
      })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          var reply = (j && j.reply) ? String(j.reply).trim() : '';
          if (!reply) { done(CHAT_FALLBACK, true); return; }
          done(reply, !!j.showBooking);
          if (j.showBooking) window.SD.track('chat_booking_intent');
        })
        .catch(function () { done(CHAT_FALLBACK, true); });
    };
    chatPanel.querySelector('[data-chat-send]').addEventListener('click', runChat);
    chatInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); runChat(); } });
  }

  /* De cookiebalk is op 25 september 2026 verwijderd: GA4 meet
     zonder toestemmingsvraag, dus een keuzebalk zou niets meer
     aansturen. Zie js/analytics.js. */
})();

/* ------------------------------------------------------------
   Adviseurs-carrousel: de pijlen schuiven precies één kaart op
   en lopen aan het eind door naar het begin.
   ------------------------------------------------------------ */
(function () {
  'use strict';
  var carousel = document.querySelector('[data-team-carousel]');
  if (!carousel) return;
  var track = carousel.querySelector('[data-team-track]');
  var prev = carousel.querySelector('[data-team-prev]');
  var next = carousel.querySelector('[data-team-next]');
  if (!track || !prev || !next) return;

  function step() {
    var slide = track.querySelector('.team-slide');
    return slide ? Math.round(slide.getBoundingClientRect().width) + 11 : track.clientWidth;
  }

  function go(dir) {
    var max = Math.max(0, track.scrollWidth - track.clientWidth);
    var target = track.scrollLeft + dir * step();
    if (dir > 0 && track.scrollLeft >= max - 2) target = 0;
    else if (dir < 0 && track.scrollLeft <= 2) target = max;
    target = Math.max(0, Math.min(max, target));
    if (track.scrollTo) track.scrollTo({ left: target, behavior: 'smooth' });
    else track.scrollLeft = target;
  }

  prev.addEventListener('click', function () { go(-1); });
  next.addEventListener('click', function () { go(1); });
})();

/* ------------------------------------------------------------
   Oplossingen-lade: pijlen schuiven precies een kaart op, de
   voortgangsbalk loopt mee met de scrollpositie en de kaart die
   het dichtst bij het midden staat krijgt zijn navylijn. Alles
   hangt aan de native scrollpositie, dus vegen, pijlen en
   toetsenbord komen op hetzelfde uit.
   ------------------------------------------------------------ */
(function () {
  'use strict';
  var track = document.querySelector('[data-sol-track]');
  if (!track) return;
  var kaarten = Array.prototype.slice.call(track.querySelectorAll('.sol-card'));
  if (!kaarten.length) return;
  var prev = document.querySelector('[data-sol-prev]');
  var next = document.querySelector('[data-sol-next]');
  var thumb = document.querySelector('[data-sol-thumb]');
  var rail = document.querySelector('[data-sol-progress]');
  var wacht = false;

  function stap() {
    var eerste = kaarten[0];
    var gap = parseFloat(getComputedStyle(track).columnGap) || 16;
    return Math.round(eerste.getBoundingClientRect().width) + gap;
  }

  function max() { return Math.max(0, track.scrollWidth - track.clientWidth); }

  function teken() {
    wacht = false;
    var m = max();
    var x = track.scrollLeft;

    /* Voortgangsbalk: breedte = zichtbaar deel, positie = scrollpositie. */
    if (thumb && rail) {
      var deel = track.clientWidth / track.scrollWidth;
      var railW = rail.clientWidth;
      var duimW = Math.max(28, railW * deel);
      thumb.style.width = duimW + 'px';
      thumb.style.transform = 'translateX(' + (m > 0 ? (x / m) * (railW - duimW) : 0) + 'px)';
    }

    /* Actieve kaart: die met zijn midden het dichtst bij het midden
       van de lade staat. */
    var midden = track.getBoundingClientRect().left + track.clientWidth / 2;
    var beste = 0, best = Infinity;
    kaarten.forEach(function (kaart, i) {
      var r = kaart.getBoundingClientRect();
      var d = Math.abs(r.left + r.width / 2 - midden);
      if (d < best) { best = d; beste = i; }
    });
    kaarten.forEach(function (kaart, i) { kaart.classList.toggle('is-current', i === beste); });

    if (prev) prev.setAttribute('aria-disabled', String(x <= 2));
    if (next) next.setAttribute('aria-disabled', String(x >= m - 2));
  }

  function plan() { if (!wacht) { wacht = true; requestAnimationFrame(teken); } }

  function ga(richting) {
    var doel = Math.max(0, Math.min(max(), track.scrollLeft + richting * stap()));
    if (track.scrollTo) track.scrollTo({ left: doel, behavior: 'smooth' });
    else track.scrollLeft = doel;
  }

  if (prev) prev.addEventListener('click', function () { ga(-1); });
  if (next) next.addEventListener('click', function () { ga(1); });
  track.addEventListener('scroll', plan, { passive: true });
  window.addEventListener('resize', plan);
  teken();
})();

/* ------------------------------------------------------------
   Eerlijk verhaal: de drie punten schuiven vanzelf door.
   Zonder JS of met prefers-reduced-motion blijven ze gewoon
   onder elkaar staan; pas hier zetten we de slidermodus aan.
   De balkjes eronder lopen mee als voortgang en zijn klikbaar.
   Loopt alleen wanneer de sectie in beeld is en pauzeert bij
   muis, toetsenbordfocus of een verborgen tab.
   ------------------------------------------------------------ */
(function () {
  'use strict';
  var slider = document.querySelector('[data-verhaal-slider]');
  if (!slider) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-verhaal-slides] > li'));
  var tabs = Array.prototype.slice.call(slider.querySelectorAll('.verhaal-tab'));
  if (slides.length < 2 || tabs.length !== slides.length) return;

  /* Bij elk punt hoort een foto. Zijn het er niet evenveel (of ontbreekt
     het blok), dan blijft het beeld gewoon staan en wisselt alleen de tekst. */
  var fotos = Array.prototype.slice.call(
    document.querySelectorAll('[data-verhaal-fotos] > .verhaal-foto')
  );
  if (fotos.length !== slides.length) fotos = [];

  var DUUR = 6000;
  var index = 0, elapsed = 0, vorige = null, raf = null, gepauzeerd = false;

  function vul(deel) {
    tabs.forEach(function (tab, i) {
      var fill = tab.querySelector('.verhaal-tab-fill');
      if (fill) fill.style.transform = 'scaleX(' + (i < index ? 1 : i === index ? deel : 0) + ')';
    });
  }

  function toon(i) {
    index = (i + slides.length) % slides.length;
    elapsed = 0;
    slides.forEach(function (li, n) { li.classList.toggle('is-active', n === index); });
    fotos.forEach(function (img, n) { img.classList.toggle('is-active', n === index); });
    tabs.forEach(function (tab, n) {
      if (n === index) tab.setAttribute('aria-current', 'true');
      else tab.removeAttribute('aria-current');
    });
    vul(0);
  }

  function stap(ts) {
    if (vorige === null) vorige = ts;
    var dt = ts - vorige;
    vorige = ts;
    if (!gepauzeerd && !document.hidden) {
      elapsed += dt;
      if (elapsed >= DUUR) toon(index + 1);
      else vul(elapsed / DUUR);
    }
    raf = requestAnimationFrame(stap);
  }

  function start() { if (raf === null) { vorige = null; raf = requestAnimationFrame(stap); } }
  function stop() { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } }

  slider.classList.add('is-slider');
  toon(0);

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { toon(i); vorige = null; });
  });
  slider.addEventListener('mouseenter', function () { gepauzeerd = true; });
  slider.addEventListener('mouseleave', function () { gepauzeerd = false; vorige = null; });
  slider.addEventListener('focusin', function () { gepauzeerd = true; });
  slider.addEventListener('focusout', function () { gepauzeerd = false; vorige = null; });
  /* Na een verborgen tab niet in één klap een slide doorspringen. */
  document.addEventListener('visibilitychange', function () { vorige = null; });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) start(); else stop();
      });
    }, { threshold: 0.25 }).observe(slider);
  } else {
    start();
  }
})();
