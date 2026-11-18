// Grava um motion em MP4 (H.264, 1080x1920, 60 fps)
// Uso: node gravar.mjs [pasta-do-motion]   (padrão: atendimento-que-nao-dorme)
// Captura quadro a quadro no navegador sem tela e entrega os PNGs ao ffmpeg.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { iniciarServidor } from './servidor.mjs';

const RAIZ = dirname(fileURLToPath(import.meta.url));
const MOTION = process.argv[2] || 'atendimento-que-nao-dorme';
const PORTA = 4174; // separada da prévia, para não brigar com ela
const SAIDA = join(RAIZ, 'saida', `${MOTION}.mp4`);
const LARGURA = 1080, ALTURA = 1920;

await mkdir(join(RAIZ, 'saida'), { recursive: true });
const servidor = await iniciarServidor(PORTA);

// usa o Chrome instalado; se não houver, cai no Chromium do Playwright
let navegador;
try { navegador = await chromium.launch({ channel: 'chrome' }); }
catch { navegador = await chromium.launch(); }

const pagina = await navegador.newPage({ viewport: { width: LARGURA, height: ALTURA }, deviceScaleFactor: 1 });
pagina.on('pageerror', (e) => console.error('Erro na página:', e.message));
await pagina.goto(`http://127.0.0.1:${PORTA}/${MOTION}/?render`, { waitUntil: 'load' });
await pagina.waitForFunction(() => document.body.dataset.pronto === '1', null, { timeout: 30000 });

const { duracao, fps } = await pagina.evaluate(() => ({ duracao: window.__motion.duracao, fps: window.__motion.fps }));
const total = Math.round(duracao * fps);

const ffmpeg = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-profile:v', 'high', '-level', '4.2',
  '-pix_fmt', 'yuv420p', '-r', String(fps),
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
  '-movflags', '+faststart',
  SAIDA
], { stdio: ['pipe', 'inherit', 'inherit'] });
const fimFfmpeg = new Promise((ok, erro) => ffmpeg.on('close', (c) => (c === 0 ? ok() : erro(new Error('ffmpeg saiu com código ' + c)))));

const inicio = Date.now();
for (let q = 0; q < total; q++) {
  await pagina.evaluate((t) => {
    window.__motion.seek(t);
    return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, q / fps);
  const png = await pagina.screenshot({ type: 'png', clip: { x: 0, y: 0, width: LARGURA, height: ALTURA } });
  if (!ffmpeg.stdin.write(png)) await new Promise((r) => ffmpeg.stdin.once('drain', r));
  if (q % 60 === 0 || q === total - 1) {
    const seg = ((Date.now() - inicio) / 1000).toFixed(0);
    process.stdout.write(`\rQuadro ${q + 1}/${total} · ${seg}s`);
  }
}
ffmpeg.stdin.end();
await fimFfmpeg;
await navegador.close();
servidor.close();
console.log(`\nPronto: ${SAIDA}`);
