/* ============================================================
   SalderingsDienst — embed.js
   Plaats het boekingswidget op een externe (partner)site met:

     <script src="https://www.salderingsdienst.nl/js/embed.js"
             data-source="partner-x" async></script>

   Het script vervangt zichzelf door een geïsoleerd iframe met
   het widget (widget.html). data-source wordt meegegeven voor
   attributie en komt terug in elke lead (source.partner).
   Het iframe groeit automatisch mee met de inhoud via
   postMessage ('sd-widget-height').
   ============================================================ */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  var source = script.getAttribute('data-source') || 'embed';
  var origin;
  try {
    origin = new URL(script.src).origin;
  } catch (e) {
    return;
  }

  var iframe = document.createElement('iframe');
  iframe.src = origin + '/widget?source=' + encodeURIComponent(source);
  iframe.title = 'Plan een gratis adviesgesprek met SalderingsDienst';
  iframe.loading = 'lazy';
  iframe.style.cssText = 'width:100%;border:0;display:block;min-height:560px;height:640px;';
  iframe.setAttribute('allowtransparency', 'true');

  window.addEventListener('message', function (e) {
    if (e.origin !== origin) return;
    if (!e.data || e.data.type !== 'sd-widget-height') return;
    if (e.source !== iframe.contentWindow) return;
    var h = parseInt(e.data.height, 10);
    if (h > 200 && h < 4000) iframe.style.height = (h + 8) + 'px';
  });

  script.parentNode.insertBefore(iframe, script);
})();
