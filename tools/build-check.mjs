/* ============================================================
   SalderingsDienst — tools/build-check.mjs  (npm run build)
   Er is bewust geen bundelstap (statische site + /api-functions).
   Deze check vervangt de klassieke build:
   1. syntaxcontrole (node --check) op alle eigen JS-bestanden
   2. aanwezigheid van de kernbestanden
   3. verplichte markers in index.html / widget.html
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
  'js/motion.js', 'js/booking.js', 'js/scrolly.js', 'js/embed.js',
  'api/bookings.js', 'api/portal-login.js', 'api/chat.js',
  'api/_lib/store.js', 'api/_lib/auth.js', 'api/_lib/ratelimit.js'
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

/* 2. Kernbestanden */
console.log('Kernbestanden:');
for (const f of ['index.html', 'widget.html', 'portal.html', 'css/tokens.css', 'css/main.css', 'vercel.json', 'assets/hero-woning.jpg']) {
  if (existsSync(join(root, f))) ok(f); else fail(f + ' ontbreekt');
}

/* 3. Markers */
console.log('Markers:');
const idx = readFileSync(join(root, 'index.html'), 'utf8');
const widget = readFileSync(join(root, 'widget.html'), 'utf8');
const markers = [
  [idx, 'data-booking', 'index.html: boekingsmount (data-booking)'],
  [idx, "whatsapp: '31639369781'", 'index.html: WhatsApp-nummer in SD_CONFIG'],
  [idx, 'bookingEndpoint', 'index.html: bookingEndpoint'],
  [idx, 'chatEndpoint', 'index.html: chatEndpoint'],
  [idx, 'application/ld+json', 'index.html: JSON-LD aanwezig'],
  [idx, 'data-scrolly-scene', 'index.html: scene5-scrollytelling (5 stappen)'],
  [widget, 'data-booking', 'widget.html: boekingsmount'],
];
for (const [haystack, needle, label] of markers) {
  if (haystack.includes(needle)) ok(label); else fail(label + ' — marker "' + needle + '" niet gevonden');
}

/* 4. Geen keys in de code */
console.log('Veiligheid:');
const keyPattern = /sk-[a-f0-9]{24,}/i;
let leaks = 0;
for (const f of [...jsFiles, 'index.html', 'widget.html', 'portal.html', 'vercel.json', 'package.json']) {
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
  'index.html', 'widget.html', 'portal.html', 'kennisbank.html', 'privacybeleid.html',
  'kennisbank', 'css', 'js', 'assets', 'robots.txt', 'sitemap.xml'
];
for (const item of PUBLIC_ITEMS) {
  const src = join(root, item);
  if (!existsSync(src)) { fail(item + ' ontbreekt voor public/'); continue; }
  cpSync(src, join(pub, item), { recursive: true });
}
if (failures) { console.error('\nBuild MISLUKT bij kopiëren.'); process.exit(1); }
ok('public/ opgebouwd (' + PUBLIC_ITEMS.length + ' items)');

console.log('\nBuild geslaagd.');
