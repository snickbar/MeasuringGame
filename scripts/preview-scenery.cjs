// Local-only preview: serves ES modules and the object list with their correct MIME types.
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const port = Number(process.argv[2]) || 4173;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.css': 'text/css', '.md': 'text/plain; charset=utf-8' };
const server = http.createServer((req, res) => {
  if (req.url === '/_preview/status') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ project: 'MeasuringGame', root })); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); } catch { res.writeHead(400); res.end(); return; }
  if (pathname === '/') pathname = '/output/scenery-concepts-v1/index.html';
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || pathname.split('/').some(p => p.startsWith('.'))) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (error, bytes) => {
    if (error) { res.writeHead(404); res.end('Not found'); return; }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(bytes);
  });
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log('Scenery preview: http://127.0.0.1:' + port + '/anim/test.html'));
