/* ============================================================
   SalderingsDienst — tools/dev-server.mjs  (npm run dev)
   Lokale ontwikkelserver die het Vercel-gedrag nabootst:
   - statische bestanden vanuit de repo-root, met cleanUrls
     (/portal → portal.html, /widget → widget.html)
   - /api/<naam> → de serverless functions in api/ (CommonJS)
   - leest .env.local voor DEEPSEEK_API_KEY, PORTAL_PASSWORD, enz.
   Niet voor productie; Vercel draait de functions zelf.
   ============================================================ */
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, dirname, normalize } from 'node:path';
import { fileURLToPath, parse as parseUrl } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = parseInt(process.env.PORT || '4173', 10);

/* .env.local inladen (KEY=value per regel) */
const envFile = join(root, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  console.log('.env.local geladen');
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml'
};
const BLOCKED = [/^\/\.git/, /^\/\.env/, /^\/uploads\//, /^\/node_modules\//, /^\/tools\//, /^\/\.claude/];

const server = http.createServer(async (req, res) => {
  const url = parseUrl(req.url, true);
  let pathname = decodeURIComponent(url.pathname);

  /* API-routes */
  if (pathname.startsWith('/api/')) {
    const name = pathname.slice(5).replace(/[^a-z0-9-]/gi, '');
    const handlerPath = join(root, 'api', name + '.js');
    if (!existsSync(handlerPath)) { res.statusCode = 404; return res.end('{"ok":false,"error":"API-route niet gevonden"}'); }
    try {
      delete require.cache[require.resolve(handlerPath)];
      const handler = require(handlerPath);
      req.query = url.query;
      await handler(req, res);
    } catch (e) {
      console.error('API-fout', pathname, e);
      if (!res.headersSent) res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: 'Interne fout: ' + e.message }));
    }
    return;
  }

  /* Statische bestanden + cleanUrls */
  if (BLOCKED.some((re) => re.test(pathname))) { res.statusCode = 403; return res.end('Verboden'); }
  if (pathname === '/') pathname = '/index.html';
  let filePath = normalize(join(root, pathname));
  if (!filePath.startsWith(root)) { res.statusCode = 403; return res.end('Verboden'); }
  if (!existsSync(filePath) && !extname(pathname) && existsSync(filePath + '.html')) filePath += '.html';
  if (!existsSync(filePath) || !statSync(filePath).isFile()) { res.statusCode = 404; return res.end('Niet gevonden: ' + pathname); }
  res.setHeader('Content-Type', MIME[extname(filePath).toLowerCase()] || 'application/octet-stream');
  res.end(readFileSync(filePath));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('SalderingsDienst dev-server: http://127.0.0.1:' + PORT);
  console.log('  portal: /portal · widget: /widget · api: /api/bookings, /api/chat, /api/portal-login');
});
