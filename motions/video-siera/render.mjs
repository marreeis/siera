// Render do vídeo-manifesto da siera (1080x1920, 30 fps)
//   node render.mjs --previa   → 6 quadros de prévia em previa/ + folha de contato
//   node render.mjs            → video-siera.mp4 (frames + narracao.mp3, H.264, CRF 20)
//   node render.mjs --de 20 --ate 30   → só um trecho (para testes), em trecho.mp4
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { iniciarServidor } from '../servidor.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? Number(args[i + 1]) : null; };
const PREVIA = args.includes('--previa');
const PORTA = 4176, L = 1080, A = 1920;

const QUADROS_PREVIA = [
  ['abertura', 2.80], ['correria', 13.75], ['desistiu', 20.40],
  ['virada', 23.95], ['audio', 35.95], ['final', 70.10]
];

const servidor = await iniciarServidor(PORTA);
let nav;
try { nav = await chromium.launch({ channel: 'chrome' }); } catch { nav = await chromium.launch(); }
const pag = await nav.newPage({ viewport: { width: L, height: A }, deviceScaleFactor: 1 });
pag.on('pageerror', (e) => console.error('Erro na página:', e.message));
pag.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
await pag.goto(`http://127.0.0.1:${PORTA}/video-siera/?render`, { waitUntil: 'load' });
await pag.evaluate(() => document.fonts.ready);
await pag.waitForFunction(() => document.body.dataset.pronto === '1', null, { timeout: 30000 });
const { duracao, fps } = await pag.evaluate(() => ({ duracao: window.__motion.duracao, fps: window.__motion.fps }));

async function quadro(t) {
  await pag.evaluate((t) => { window.__motion.seek(t); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); }, t);
  return pag.screenshot({ type: 'png', clip: { x: 0, y: 0, width: L, height: A } });
}

function ffmpeg(argsFf) {
  const p = spawn('ffmpeg', argsFf, { stdio: ['pipe', 'inherit', 'inherit'] });
  p.fim = new Promise((ok, erro) => p.on('close', (c) => (c === 0 ? ok() : erro(new Error('ffmpeg saiu com código ' + c)))));
  return p;
}

if (PREVIA) {
  const dir = join(AQUI, 'previa');
  await mkdir(dir, { recursive: true });
  const nomes = [];
  for (const [i, [nome, t]] of QUADROS_PREVIA.entries()) {
    const arq = join(dir, `${String(i + 1).padStart(2, '0')}-${nome}.png`);
    await writeFile(arq, await quadro(t));
    nomes.push(arq); console.log(`${nome} (${t}s) → ${arq}`);
  }
  // folha de contato 6 lado a lado
  const ff = ffmpeg(['-y', '-loglevel', 'error', ...nomes.flatMap((n) => ['-i', n]),
    '-filter_complex', nomes.map((_, i) => `[${i}]scale=360:640[s${i}]`).join(';') + ';' + nomes.map((_, i) => `[s${i}]`).join('') + `hstack=inputs=${nomes.length}`,
    join(dir, 'folha.png')]);
  ff.stdin.end(); await ff.fim;
  console.log('Folha:', join(dir, 'folha.png'));
} else {
  const de = opt('--de') ?? 0, ate = opt('--ate') ?? duracao;
  const trecho = de > 0 || ate < duracao;
  const saida = join(AQUI, trecho ? 'trecho.mp4' : 'video-siera.mp4');
  const q0 = Math.round(de * fps), q1 = Math.round(ate * fps);
  const ff = ffmpeg(['-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-ss', String(de), '-i', join(AQUI, 'narracao.mp3'),
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(fps),
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
    saida]);
  const inicio = Date.now();
  for (let q = q0; q < q1; q++) {
    const png = await quadro(q / fps);
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((q - q0) % 90 === 0 || q === q1 - 1) process.stdout.write(`\rQuadro ${q - q0 + 1}/${q1 - q0} · ${((Date.now() - inicio) / 1000).toFixed(0)}s   `);
  }
  ff.stdin.end(); await ff.fim;
  console.log(`\nPronto: ${saida}`);
}
await nav.close();
servidor.close();
