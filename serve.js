const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 3400;
const ROOT = __dirname;   // C:\Users\bryan\.claude  — serves the whole suite

const TYPES = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'text/javascript',
  '.jsx':  'text/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
};

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];

  // directory → index.html
  if (urlPath === '/' || urlPath.endsWith('/')) {
    urlPath = urlPath + 'index.html';
  }

  const file = path.join(ROOT, urlPath);

  // safety: don't escape root
  if (!file.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  const ext = path.extname(file);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found: ' + urlPath); return; }
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'text/plain',
      // Prevent service-worker caching during local development
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`ours running on http://localhost:${PORT}`);
  console.log(`  Hub:    http://localhost:${PORT}/`);
  console.log(`  Pantry: http://localhost:${PORT}/projects/Pantry/`);
});
