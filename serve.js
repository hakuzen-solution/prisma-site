// Servidor local simples para ver a demo no navegador: node bigbel-demo/serve.js
// Abre em http://localhost:3800
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 3800;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".md": "text/plain; charset=utf-8" };

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  const file = path.normalize(path.join(ROOT, urlPath === "/" ? "index.html" : urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Não encontrado"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Site tech em http://localhost:${PORT}`));
