/* ============================================================
   SalderingsDienst — tools/leveranciers-tabel.mjs
   Drukt de statische HTML af van de telzin, de leverancierstabel en de
   lijst met rekentool-links, uit dezelfde dataset als de pagina en de
   rekentool (js/data/leveranciers-2027.js). De HTML-functies staan
   in die dataset (SD_LEVERANCIERS_HTML), zodat het inline script op
   de pagina en dit script dezelfde tabel maken.

   Gebruik:
     node tools/leveranciers-tabel.mjs          print de blokken
     node tools/leveranciers-tabel.mjs --write  zet ze in de pagina,
       tussen de markeringen <!-- lv:tabel:begin --> enz.
     node tools/leveranciers-tabel.mjs --check  exit 1 als de pagina
       niet meer gelijk is aan de dataset (draait in npm run build)
   ============================================================ */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { data, html } = require(join(root, 'js/data/leveranciers-2027.js'));
const PAGINA = join(root, 'kennisbank/terugleververgoeding-2027-per-leverancier.html');

const blokken = {
  telling: html.telling(data),
  tabel: html.tabel(data),
  links: html.rekentoolLinks(data)
};

function vervang(src, naam, inhoud) {
  const begin = '<!-- lv:' + naam + ':begin -->';
  const eind = '<!-- lv:' + naam + ':eind -->';
  const i = src.indexOf(begin), j = src.indexOf(eind);
  if (i < 0 || j < i) throw new Error('markering lv:' + naam + ' ontbreekt in de pagina');
  return src.slice(0, i + begin.length) + '\n' + inhoud + '\n' + src.slice(j);
}

const modus = process.argv[2] || '';
if (modus === '--check' || modus === '--write') {
  const src = readFileSync(PAGINA, 'utf8').replace(/\r\n/g, '\n');
  let nieuw = src;
  for (const naam of Object.keys(blokken)) nieuw = vervang(nieuw, naam, blokken[naam]);
  if (modus === '--write') {
    writeFileSync(PAGINA, nieuw);
    console.log('pagina bijgewerkt: ' + data.rijen.length + ' rijen, versie ' + data.versie);
  } else if (nieuw !== src) {
    console.error('De statische tabel wijkt af van js/data/leveranciers-2027.js. Draai: node tools/leveranciers-tabel.mjs --write');
    process.exit(1);
  } else {
    console.log('tabel gelijk aan dataset (' + data.rijen.length + ' rijen, versie ' + data.versie + ')');
  }
} else {
  for (const naam of Object.keys(blokken)) console.log('<!-- lv:' + naam + ' -->\n' + blokken[naam] + '\n');
}
