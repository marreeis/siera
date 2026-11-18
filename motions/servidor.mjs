// Servidor estático da prévia dos motions · http://localhost:4173
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = dirname(fileURLToPath(import.meta.url));
const PORTA = Number(process.env.PORTA || 4173);
const INICIAL = '/atendimento-que-nao-dorme/';
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.json': 'application/json'
};

export function iniciarServidor(porta = PORTA) {
  const servidor = http.createServer(async (req, res) => {
    let caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (caminho === '/') { res.writeHead(302, { Location: INICIAL }); return res.end(); }
    let arquivo = normalize(join(RAIZ, caminho));
    if (!arquivo.startsWith(RAIZ) || arquivo.includes('node_modules')) { res.writeHead(403); return res.end(); }
    try {
      if ((await stat(arquivo)).isDirectory()) arquivo = join(arquivo, 'index.html');
      const dados = await readFile(arquivo);
      res.writeHead(200, { 'Content-Type': TIPOS[extname(arquivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(dados);
    } catch {
      res.writeHead(404); res.end('Não encontrado');
    }
  });
  return new Promise((ok, erro) => {
    servidor.once('error', (e) => {
      if (e.code === 'EADDRINUSE') console.error(`A porta ${porta} já está em uso. Se for o servidor do site (raiz siera/), a prévia está em http://localhost:${porta}/motions${INICIAL}`);
      erro(e);
    });
    servidor.listen(porta, '127.0.0.1', () => ok(servidor));
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1])) {
  await iniciarServidor();
  console.log(`Prévia: http://localhost:${PORTA}${INICIAL}`);
}
