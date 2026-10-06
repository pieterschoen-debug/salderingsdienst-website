/* ============================================================
   SalderingsDienst — tools/build-check.mjs  (npm run build)
   Er is bewust geen bundelstap (statische site + /api-functions).
   Deze check vervangt de klassieke build:
   1. syntaxcontrole (node --check) op alle eigen JS-bestanden
   2. aanwezigheid van de kernbestanden
   3. verplichte markers in index.html / adviesgesprek.html / widget.html
   4. veiligheidscheck: geen API-keys per ongeluk in de code
   Exit 0 = build geslaagd.
   ============================================================ */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, rmSync, mkdirSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
const fail = (msg) => { failures++; console.error('  ✕ ' + msg); };
const ok = (msg) => console.log('  ✓ ' + msg);

/* 1. Syntax */
console.log('Syntaxcontrole:');
const jsFiles = [
  'js/motion.js', 'js/funnel.js', 'js/booking.js', 'js/embed.js', 'js/analytics.js',
  'api/bookings.js', 'api/portal-login.js', 'api/chat.js',
  'api/_lib/store.js', 'api/_lib/auth.js', 'api/_lib/ratelimit.js',
  'api/_lib/attributie.js', 'api/_lib/pipedrive.js', 'tools/attributie-test.mjs',
  'js/rekenmodel.js', 'js/rekentool.js', 'tools/rekenmodel-test.mjs', 'tools/rekenvoorbeelden.mjs'
];
for (const f of jsFiles) {
  const p = join(root, f);
  if (!existsSync(p)) { fail(f + ' ontbreekt'); continue; }
  try {
    execFileSync(process.execPath, ['--check', p], { stdio: 'pipe' });
    ok(f);
  } catch (e) {
    fail(f + ' — syntaxfout:\n' + String(e.stderr || e.message).slice(0, 500));
  }
}

/* 1b. Zelftest herkomst-classificatie (api/_lib/attributie.js) */
console.log('Attributie:');
try {
  const uit = execFileSync(process.execPath, [join(root, 'tools/attributie-test.mjs')], { stdio: 'pipe' }).toString();
  const regels = uit.trim().split('\n');
  ok('attributie-test: ' + regels[regels.length - 1]);
} catch (e) {
  fail('attributie-test mislukt:\n' + String((e.stderr || '') + (e.stdout || '') || e.message).slice(0, 1500));
}

/* 1c. Zelftest rekenmodel (js/rekenmodel.js, /rekentool) */
console.log('Rekenmodel:');
try {
  const uit = execFileSync(process.execPath, [join(root, 'tools/rekenmodel-test.mjs')], { stdio: 'pipe' }).toString();
  const regels = uit.trim().split('\n');
  ok('rekenmodel-test: ' + regels[regels.length - 1]);
} catch (e) {
  fail('rekenmodel-test mislukt:\n' + String((e.stderr || '') + (e.stdout || '') || e.message).slice(0, 1500));
}

/* 2. Kernbestanden */
console.log('Kernbestanden:');
for (const f of ['index.html', 'adviesgesprek.html', 'widget.html', 'portal.html', 'rekentool.html', 'css/tokens.css', 'css/main.css', 'vercel.json', 'assets/hero-advies.jpg', 'assets/hero-advies-mobile.jpg']) {
  if (existsSync(join(root, f))) ok(f); else fail(f + ' ontbreekt');
}

/* 3. Markers */
console.log('Markers:');
const idx = readFileSync(join(root, 'index.html'), 'utf8');
const widget = readFileSync(join(root, 'widget.html'), 'utf8');
const boeking = readFileSync(join(root, 'adviesgesprek.html'), 'utf8');
const analytics = readFileSync(join(root, 'js/analytics.js'), 'utf8');
const rekentool = readFileSync(join(root, 'rekentool.html'), 'utf8');
const markers = [
  [boeking, 'data-booking', 'adviesgesprek.html: boekingsmount (data-booking)'],
  [idx, 'href="/adviesgesprek"', 'index.html: link naar de boekingspagina (schone URL)'],
  [idx, 'data-funnel', 'index.html: bespaarcheck (data-funnel)'],
  [idx, "whatsapp: '31639369781'", 'index.html: WhatsApp-nummer in SD_CONFIG'],
  [idx, 'bookingEndpoint', 'index.html: bookingEndpoint'],
  [idx, 'chatEndpoint', 'index.html: chatEndpoint'],
  [idx, 'application/ld+json', 'index.html: JSON-LD aanwezig'],
  [widget, 'data-booking', 'widget.html: boekingsmount'],
  [idx, 'js/analytics.js', 'index.html: GA4-laag (js/analytics.js)'],
  [analytics, 'G-XN788FNCZS', 'analytics.js: GA4-meet-id'],
  [analytics, 'anonymize_ip', 'analytics.js: IP-anonimisering aan'],
  [rekentool, 'js/rekenmodel.js', 'rekentool.html: rekenmodel geladen'],
  [rekentool, 'href="/adviesgesprek"', 'rekentool.html: overdracht naar het adviesgesprek'],
  [rekentool, 'geen onderdeel van de Rijksoverheid', 'rekentool.html: Rijksoverheid-disclaimer'],
  [idx, 'href="/rekentool"', 'index.html: link naar de rekentool'],
];
for (const [haystack, needle, label] of markers) {
  if (haystack.includes(needle)) ok(label); else fail(label + ' — marker "' + needle + '" niet gevonden');
}

/* 4. Geen keys in de code */
console.log('Veiligheid:');
const keyPattern = /sk-[a-f0-9]{24,}/i;
let leaks = 0;
for (const f of [...jsFiles, 'index.html', 'widget.html', 'portal.html', 'rekentool.html', 'vercel.json', 'package.json']) {
  const p = join(root, f);
  if (!existsSync(p)) continue;
  if (keyPattern.test(readFileSync(p, 'utf8'))) { fail(f + ' bevat iets dat op een API-key lijkt'); leaks++; }
}
if (!leaks) ok('geen API-keys in de code');

if (failures) {
  console.error('\nBuild MISLUKT: ' + failures + ' probleem(en).');
  process.exit(1);
}

/* 5. Statische output naar public/ (Vercel outputDirectory) */
console.log('Output:');
const pub = join(root, 'public');
rmSync(pub, { recursive: true, force: true });
mkdirSync(pub, { recursive: true });
const PUBLIC_ITEMS = [
  'index.html', 'adviesgesprek.html', 'widget.html', 'portal.html', 'kennisbank.html', 'rekentool.html', 'privacybeleid.html',
  'algemene-voorwaarden.html', 'algemene-voorwaarden-zakelijk.html', '404.html',
  'kennisbank', 'css', 'js', 'assets', 'robots.txt', 'sitemap.xml',
  /* IndexNow-sleutelbestand: eigendomsbewijs voor Bing e.a.; de sleutel is geen geheim */
  'dd25f0443c785e86156a53255caeb1c6.txt'
];
for (const item of PUBLIC_ITEMS) {
  const src = join(root, item);
  if (!existsSync(src)) { fail(item + ' ontbreekt voor public/'); continue; }
  cpSync(src, join(pub, item), { recursive: true });
}
if (failures) { console.error('\nBuild MISLUKT bij kopiëren.'); process.exit(1); }
ok('public/ opgebouwd (' + PUBLIC_ITEMS.length + ' items)');

console.log('\nBuild geslaagd.');
