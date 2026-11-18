// Render do showreel da Agente Automática (30 fps)
//   node render.mjs --previa          → 1 quadro por cena em previa/ + folha de contato
//   node render.mjs                   → showreel-siera.mp4 (1080x1920)
//   node render.mjs --wide            → showreel-siera-16x9.mp4 (1920x1080)
//   node render.mjs --de 20 --ate 30  → só um trecho (testes), em trecho.mp4
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { iniciarServidor } from '../servidor.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? Number(args[i + 1]) : null; };
const PREVIA = args.includes('--previa');
const WIDE = args.includes('--wide');
const PORTA = 4177;
const L = WIDE ? 1920 : 1080, A = WIDE ? 1080 : 1920;
const MUSICA = join(AQUI, 'musica.mp3');
const temMusica = await access(MUSICA).then(() => true, () => false);

const servidor = await iniciarServidor(PORTA);
let nav;
try { nav = await chromium.launch({ channel: 'chrome' }); } catch { nav = await chromium.launch(); }
const pag = await nav.newPage({ viewport: { width: L, height: A }, deviceScaleFactor: 1 });
pag.on('pageerror', (e) => console.error('Erro na página:', e.message));
pag.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) console.error('console:', m.text()); });
await pag.goto(`http://127.0.0.1:${PORTA}/showreel-siera/?render${WIDE ? '&wide' : ''}`, { waitUntil: 'load' });
await pag.evaluate(() => document.fonts.ready);
await pag.waitForFunction(() => document.body.dataset.pronto === '1', null, { timeout: 30000 });
const { duracao, fps, fade, previas, provisorio, musicaInicio } = await pag.evaluate(() => ({ ...window.__motion, seek: null, provisorio: window.__batidasProvisorias }));
if (provisorio) console.warn('Aviso: sem batidas.json, usando grade provisória de 120 BPM.');

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
  const dir = join(AQUI, WIDE ? 'previa-16x9' : 'previa');
  await mkdir(dir, { recursive: true });
  const nomes = [];
  for (const [i, [nome, t]] of previas.entries()) {
    const arq = join(dir, `${String(i + 1).padStart(2, '0')}-${nome}.png`);
    await writeFile(arq, await quadro(t));
    nomes.push(arq); console.log(`${nome} (${t}s) → ${arq}`);
  }
  // folha de contato: 2 fileiras
  const porLinha = Math.ceil(nomes.length / 2), lw = WIDE ? 480 : 270, la = WIDE ? 270 : 480;
  const esc = nomes.map((_, i) => `[${i}]scale=${lw}:${la}[s${i}]`).join(';');
  const pad = nomes.length % 2 ? `;color=c=0x1b1418:s=${lw}x${la}:d=1[vz]` : '';
  const ent = nomes.map((_, i) => `[s${i}]`);
  if (pad) ent.push('[vz]');
  const l1 = ent.slice(0, porLinha).join(''), l2 = ent.slice(porLinha).join('');
  const ff = ffmpeg(['-y', '-loglevel', 'error', ...nomes.flatMap((n) => ['-i', n]), '-filter_complex',
    `${esc}${pad};${l1}hstack=inputs=${porLinha}[a];${l2}hstack=inputs=${porLinha}[b];[a][b]vstack=inputs=2`,
    '-frames:v', '1', join(dir, 'folha.png')]);
  ff.stdin.end(); await ff.fim;
  console.log('Folha:', join(dir, 'folha.png'));
} else {
  const de = opt('--de') ?? 0, ate = opt('--ate') ?? duracao;
  const trecho = de > 0 || ate < duracao;
  const saida = join(AQUI, trecho ? 'trecho.mp4' : WIDE ? 'showreel-siera-16x9.mp4' : 'showreel-siera.mp4');
  const q0 = Math.round(de * fps), q1 = Math.round(ate * fps);
  const audio = temMusica
    ? ['-ss', String(de + (musicaInicio || 0)), '-t', String(ate - de), '-i', MUSICA, '-map', '0:v', '-map', '1:a',
       '-af', `afade=t=out:st=${Math.max(0, duracao - fade - de).toFixed(3)}:d=${fade}`, '-c:a', 'aac', '-b:a', '192k']
    : [];
  if (!temMusica) console.warn('Aviso: musica.mp3 não encontrada, o vídeo sai sem som.');
  const ff = ffmpeg(['-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    ...audio,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(fps),
    '-shortest', '-movflags', '+faststart', saida]);
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
