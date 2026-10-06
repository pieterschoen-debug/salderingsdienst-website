/* ============================================================
   SalderingsDienst — tools/attributie-test.mjs
   Zelftest voor api/_lib/attributie.js (node, geen dependencies).
   Draait mee in `npm run build`. Exit 0 = alles groen.
   ============================================================ */
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const a = require(join(root, 'api/_lib/attributie.js'));

let fouten = 0;
function is(label, werkelijk, verwacht) {
  const ok = JSON.stringify(werkelijk) === JSON.stringify(verwacht);
  if (ok) console.log('  ✓ ' + label);
  else { fouten++; console.error('  ✕ ' + label + '\n      verwacht ' + JSON.stringify(verwacht) + '\n      kreeg    ' + JSON.stringify(werkelijk)); }
}
const k = (ref, utm) => a.classificeer(ref, utm).verkeerskanaal;

console.log('Attributie-zelftest:');
is('utm_medium=cpc is betaald', k('google.com', { utm_source: 'google', utm_medium: 'cpc' }), 'betaald');
is('utm_medium=paid-social is betaald', k('', { utm_medium: 'paid-social' }), 'betaald');
is('utm_source zonder paid is campagne', k('', { utm_source: 'nieuwsbrief', utm_medium: 'email' }), 'campagne');
is('chatgpt.com als referrer is ai_verwijzing', a.classificeer('chatgpt.com', {}), { verkeerskanaal: 'ai_verwijzing', ai_bron: 'chatgpt.com' });
is('utm_source=chatgpt.com is ai_verwijzing, geen campagne', a.classificeer('', { utm_source: 'chatgpt.com' }), { verkeerskanaal: 'ai_verwijzing', ai_bron: 'chatgpt.com' });
is('gemini.google.com is AI, geen organisch', k('gemini.google.com', {}), 'ai_verwijzing');
is('perplexity.ai (subdomein www) is ai_verwijzing', k('www.perplexity.ai', {}), 'ai_verwijzing');
is('bing.com/chat is AI, bing.com is organisch', [k('https://www.bing.com/chat?q=x', {}), k('bing.com', {})], ['ai_verwijzing', 'organisch_zoeken']);
is('google.nl en google.co.uk zijn organisch', [k('www.google.nl', {}), k('google.co.uk', {})], ['organisch_zoeken', 'organisch_zoeken']);
is('ecosia en yahoo zijn organisch', [k('ecosia.org', {}), k('search.yahoo.com', {})], ['organisch_zoeken', 'organisch_zoeken']);
is('nepdomein notgoogle.com is verwijzing', k('notgoogle.com', {}), 'verwijzing');
is('lege referrer zonder utm is direct', k('', {}), 'direct');
is('ontbrekende referrer (oude client) is onbekend', k(undefined, {}), 'onbekend');
is('overige site is verwijzing', k('energiegids.nl', {}), 'verwijzing');

const s = a.saneerSource({
  page: '/adviesgesprek?naam=jan', landing: '/kennisbank/salderingsregeling-gids?x=1', referrer: 'https://www.google.nl/search?q=jan@example.nl',
  utm: { utm_source: 'x'.repeat(300), utm_medium: 'organic', onbekend: 'weg', utm_campaign: 'bel 06 12345678 nu' },
  kanaal: 'vals', verkeerskanaal: 'betaald', ai_bron: 'vals', geheim: 'weg', channel: 'site', partner: 'info@bedrijf.nl'
});
is('saneren: query uit paden, referrer alleen hostnaam', [s.page, s.landing, s.referrer], ['/adviesgesprek', '/kennisbank/salderingsregeling-gids', 'google.nl']);
is('saneren: client-kanaal genegeerd, server leidt af', [s.verkeerskanaal, s.ai_bron, s.kanaal], ['campagne', undefined, undefined]);
is('saneren: onbekende sleutels weg', [s.geheim, s.utm.onbekend], [undefined, undefined]);
is('saneren: utm-waarde afgekapt op 200', s.utm.utm_source.length, 200);
is('saneren: telefoonnummer en e-mail weggewassen', [s.utm.utm_campaign.indexOf('12345678'), s.partner], [-1, undefined]); /* veld met alleen een e-mailadres valt volledig weg */
is('saneren: jaartallen met streepje blijven staan', a.wasPersoonsgegevens('gids-2027-2028'), 'gids-2027-2028');
is('saneren: lege/ongeldige source geeft onbekend', [a.saneerSource(null).verkeerskanaal, a.saneerSource('x').verkeerskanaal], ['onbekend', 'onbekend']);

if (fouten) { console.error('\nAttributie-zelftest MISLUKT: ' + fouten + ' fout(en).'); process.exit(1); }
console.log('Attributie-zelftest geslaagd.');
