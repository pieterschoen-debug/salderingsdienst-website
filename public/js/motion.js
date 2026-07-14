/* ============================================================
   SalderingsDienst — motion.js
   Scroll-reveal-fallback, tellers, navigatie, adres-check,
   calculator, FAQ, chat, cookiebalk en contact-configuratie.
   De scenes zelf leven in js/scene.js; booking in js/booking.js.
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

  /* ---------- Reveal-fallback (alleen zonder CSS scroll-driven support) ---------- */
  var hasViewTimeline = CSS.supports && CSS.supports('animation-timeline: view()');
  if (!hasViewTimeline && !reduceMotion && 'IntersectionObserver' in window) {
    var rvObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('rv-in'); rvObserver.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
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

  /* ---------- Hero-parallax (desktop, subtiel; GSAP alleen als aanwezig) ---------- */
  if (!reduceMotion && window.matchMedia('(min-width: 900px)').matches) {
    window.addEventListener('load', function () {
      if (!window.gsap || !window.ScrollTrigger) return;
      var heroWrap = document.querySelector('.hero .scene-wrap');
      if (!heroWrap) return;
      window.gsap.registerPlugin(window.ScrollTrigger);
      window.gsap.to(heroWrap, {
        y: 26, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    });
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

  /* ---------- Odometer-ticker (patroon: Number Ticker) ----------
     Elk cijfer een eigen rolkolom (0–9); alleen wijzigende cijfers
     bewegen. `stagger` laat bij binnenkomst het grootste cijfer
     eerst vertrekken (cascade), daarna niet meer. */
  function makeOdo(container, fast) {
    container.classList.add('odo');
    if (fast) container.classList.add('odo--fast');
    var slots = [];
    function build(str) {
      container.innerHTML = '';
      slots = [];
      /* De rolkolommen zijn decoratie; het aria-label op de container spreekt. */
      str.split('').forEach(function (ch) {
        if (/\d/.test(ch)) {
          var d = document.createElement('span'); d.className = 'odo-d';
          d.setAttribute('aria-hidden', 'true');
          var col = document.createElement('span'); col.className = 'odo-col';
          for (var n = 0; n < 10; n++) { var b = document.createElement('b'); b.textContent = n; col.appendChild(b); }
          d.appendChild(col);
          container.appendChild(d);
          slots.push({ digit: true, col: col, val: 0 });
        } else {
          var s = document.createElement('span'); s.className = 'odo-sep'; s.textContent = ch;
          s.setAttribute('aria-hidden', 'true');
          container.appendChild(s);
          slots.push({ digit: false, ch: ch });
        }
      });
    }
    return {
      set: function (str, stagger) {
        var pattern = str.replace(/\d/g, '0');
        var current = slots.map(function (s) { return s.digit ? '0' : s.ch; }).join('');
        if (pattern !== current) build(str);
        var digits = (str.match(/\d/g) || []).length;
        var di = 0;
        str.split('').forEach(function (ch, i) {
          var slot = slots[i];
          if (!slot.digit) return;
          var n = parseInt(ch, 10);
          var pos = di++;
          if (slot.val === n) return;
          slot.val = n;
          var apply = function () { slot.col.style.transform = 'translateY(-' + n + 'em)'; };
          if (stagger && !reduceMotion) setTimeout(apply, (pos / Math.max(1, digits)) * 600);
          else apply();
        });
      }
    };
  }

  /* ---------- Urgentiebalk: aftellen naar 1 januari 2027 ---------- */
  var daysEl = document.querySelector('[data-count-days]');
  var clockEl = document.querySelector('[data-count-clock]');
  if (daysEl) {
    var TARGET = new Date('2027-01-01T00:00:00').getTime();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    daysEl.textContent = '';
    daysEl.setAttribute('role', 'img');
    var daysOdo = makeOdo(daysEl, false);
    var clockOdo = clockEl ? makeOdo(clockEl, true) : null;
    /* Toon vast nullen tot de balk in beeld komt; de cascade rolt ze dan naar de echte stand. */
    daysOdo.set(String(Math.max(0, Math.floor((TARGET - Date.now()) / 86400000))).replace(/\d/g, '0'));
    var tick = function (stagger) {
      var diff = Math.max(0, TARGET - Date.now());
      var days = String(Math.floor(diff / 86400000));
      daysOdo.set(days, stagger);
      daysEl.setAttribute('aria-label', days + ' dagen');
      if (clockOdo) {
        var rest = diff % 86400000;
        clockOdo.set(pad(Math.floor(rest / 3600000)) + ':' + pad(Math.floor(rest % 3600000 / 60000)) + ':' + pad(Math.floor(rest % 60000 / 1000)));
      }
    };
    var started = false;
    var startCountdown = function () {
      if (started) return; started = true;
      tick(true); /* entree: cascade van groot naar klein cijfer */
      setInterval(function () { tick(false); }, 1000);
    };
    if ('IntersectionObserver' in window && !reduceMotion) {
      new IntersectionObserver(function (entries, obs) {
        if (entries.some(function (en) { return en.isIntersecting; })) { startCountdown(); obs.disconnect(); }
      }, { threshold: 0.4 }).observe(daysEl);
    } else { startCountdown(); }
  }

  /* ---------- Adres-check ---------- */
  var pcInput = document.querySelector('[data-addr-pc]');
  if (pcInput) {
    var nrInput = document.querySelector('[data-addr-nr]');
    var checkBtn = document.querySelector('[data-addr-check]');
    var resultBox = document.querySelector('[data-addr-result]');
    var addrEl = document.querySelector('[data-addr-address]');
    var checking = false;
    var pcOk = function () { return /^\s*\d{4}\s*[a-zA-Z]{2}\s*$/.test(pcInput.value) && nrInput.value.trim(); };
    var refresh = function () { checkBtn.disabled = !pcOk() || checking; };
    pcInput.addEventListener('input', refresh);
    nrInput.addEventListener('input', refresh);
    checkBtn.addEventListener('click', function () {
      if (!pcOk() || checking) return;
      checking = true;
      checkBtn.textContent = 'Bezig…'; refresh();
      resultBox.hidden = true;
      window.SD.track('address_check');
      setTimeout(function () {
        checking = false;
        checkBtn.textContent = 'Controleer'; refresh();
        addrEl.textContent = pcInput.value.toUpperCase().replace(/\s+/g, ' ').trim() + ' ' + nrInput.value.trim();
        resultBox.hidden = false;
      }, 700);
    });
  }

  /* ---------- Calculator ---------- */
  var panelsInput = document.getElementById('calc-panels');
  if (panelsInput) {
    var usage = 'gemiddeld';
    var factors = { veel: 0.6, gemiddeld: 1, weinig: 1.3 };
    var panelsEl = document.querySelector('[data-calc-panels]');
    var kwhEl = document.querySelector('[data-calc-kwh]');
    var lossEl = document.querySelector('[data-calc-loss]');
    var recoverEl = document.querySelector('[data-calc-recover]');
    var euro = function (n) { return '€' + Math.round(n).toLocaleString('nl-NL'); };
    var prevLoss = 0, prevRecover = 0;
    var recalc = function (animate) {
      var panels = parseInt(panelsInput.value, 10);
      var kwh = panels * 200;
      var loss = kwh * 0.23 * factors[usage];
      var recover = loss * 0.7;
      panelsEl.textContent = panels;
      kwhEl.textContent = kwh.toLocaleString('nl-NL');
      if (animate) {
        countUp(lossEl, prevLoss, loss, 600, euro);
        countUp(recoverEl, prevRecover, recover, 600, euro);
        lossEl.classList.remove('calc-flash'); void lossEl.offsetWidth; lossEl.classList.add('calc-flash');
      } else {
        lossEl.textContent = euro(loss);
        recoverEl.textContent = euro(recover);
      }
      prevLoss = loss; prevRecover = recover;
    };
    panelsInput.addEventListener('input', function () { recalc(true); });
    all('[data-calc-usage] button', function (btn) {
      btn.addEventListener('click', function () {
        usage = btn.getAttribute('data-usage');
        all('[data-calc-usage] button', function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        recalc(true);
      });
    });
    recalc(false);
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

  /* ---------- Brief thuis / lead capture ---------- */
  var leadEmail = document.querySelector('[data-lead-email]');
  if (leadEmail) {
    var leadSend = document.querySelector('[data-lead-send]');
    var submitLead = function () {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(leadEmail.value.trim())) {
        leadEmail.focus();
        leadEmail.setAttribute('aria-invalid', 'true');
        return;
      }
      leadEmail.removeAttribute('aria-invalid');
      window.SD.track('lead_capture');
      window.SD.lead({
        schema: 'sd.lead.v1',
        type: 'info_request',
        ref: 'SD-INFO-' + Date.now().toString(36).toUpperCase().slice(-6),
        createdAt: new Date().toISOString(),
        contact: { email: leadEmail.value.trim() },
        consent: { privacyNotice: true, infoEmail: true },
        source: { page: location.pathname, utm: window.SD.utm || {} }
      });
      document.querySelector('[data-lead-form]').hidden = true;
      document.querySelector('[data-lead-sent]').hidden = false;
    };
    leadSend.addEventListener('click', submitLead);
    leadEmail.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submitLead(); } });
  }

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
    var CHAT_FALLBACK = 'De digitale adviseur is hier even niet beschikbaar. Plan gerust een gratis adviesgesprek of app ons via WhatsApp, we helpen u graag persoonlijk verder.';
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

  /* ---------- Cookiemelding ---------- */
  var cookieBar = document.querySelector('[data-cookie-bar]');
  if (cookieBar) {
    var hasChoice = false;
    try { hasChoice = !!localStorage.getItem('sd_cookie'); } catch (e) {}
    if (!hasChoice) cookieBar.hidden = false;
    var choose = function (val, evt) {
      try { localStorage.setItem('sd_cookie', val); } catch (e) {}
      if (evt) window.SD.track(evt);
      cookieBar.hidden = true;
    };
    cookieBar.querySelector('[data-cookie-all]').addEventListener('click', function () { choose('all', 'consent_all'); });
    cookieBar.querySelector('[data-cookie-necessary]').addEventListener('click', function () { choose('necessary'); });
  }
})();
