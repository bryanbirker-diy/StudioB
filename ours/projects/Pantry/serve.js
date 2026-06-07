const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3400;
const ROOT = __dirname;

const TYPES = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'text/javascript',
  '.jsx':  'text/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const file = path.join(ROOT, urlPath);
  const ext  = path.extname(file);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'text/plain' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Pantry running on http://localhost:${PORT}`));
