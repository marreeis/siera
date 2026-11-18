# siera | Comunicação e Marketing

Site institucional estático (HTML, CSS e JS puro + GSAP via CDN), pronto para o GitHub Pages.

## Estrutura

```
index.html          página principal
estilo.css          identidade visual (creme, bordô, lilás)
app.js              abertura, chat demo, animações, formulário → WhatsApp
404.html            página de erro autossuficiente
CNAME               domínio próprio do GitHub Pages
assets/img/         logo (transparente), logo creme, imagem de compartilhamento (OG)
assets/icons/       favicons gerados a partir da logo
assets/portfolio/   vídeos do portfólio (.mp4) e capas (.jpg)
assets/fonte/       logos originais (fundo branco), só para referência
comprimir-videos.ps1  comprime os vídeos para menos de 10 MB
```

## Placeholders para trocar

| O quê | Onde |
|---|---|
| WhatsApp (já configurado: `5573981091204`) | para trocar: `app.js` (CONFIG, no topo), que gera todos os links, e `index.html` (bloco Contato e JSON-LD `telephone`) |
| Instagram (já configurado: `@sieraoficial`) | para trocar: `index.html` (Contato, rodapé e JSON-LD `sameAs`) |
| `[SEU E-MAIL]` | `index.html`: Contato, rodapé e JSON-LD |
| `[meudominio.com.br]` | `CNAME`, `robots.txt`, `sitemap.xml` e `index.html` (canonical, og:url, og:image, twitter:image, JSON-LD) |
| `[endereço do site da Oxe]` | `index.html`: barra do navegador do projeto Oxe |
| `[depoimento]`, `[nome]`, `[empresa]`, `[N]` (iniciais) | `index.html`: seção Depoimentos (3 cartões) |
| Foto da Mariana | salve como `assets/img/mariana-reis.jpg` (retrato 4:5) |
| Vídeos | `assets/portfolio/leds-bahia.mp4` (site), `leds-bahia-motion.mp4` (vertical do painel), `painel-led.mp4` |
| Oxe | `assets/portfolio/oxe.jpg` (imagem) **ou** `assets/portfolio/oxe.mp4` (vídeo) |

Foto e vídeos aparecem sozinhos quando o arquivo existe com o nome certo. Enquanto não existem, o site mostra o `[PLACEHOLDER]`.

## Vídeos (menos de 10 MB cada)

1. Coloque os brutos em `assets/portfolio/originais/` com os nomes `leds-bahia`, `leds-bahia-motion`, `painel-led` e `oxe` (qualquer extensão).
2. Rode `powershell -ExecutionPolicy Bypass -File .\comprimir-videos.ps1`.
3. Saem `assets/portfolio/<nome>.mp4` (sem áudio, com faststart) e `<nome>.jpg` (capa). A pasta `originais/` não vai para o GitHub.

## Testar localmente

```
python -m http.server 4173
```
Abra http://localhost:4173. A abertura com a logo aparece uma vez por sessão; para revê-la, abra uma aba anônima.

## Publicar no GitHub Pages

```
git init
git add .
git commit -m "Site da siera"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/siera.git
git push -u origin main
```

Depois, no GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**.
Em **Custom domain**, informe o seu domínio e marque **Enforce HTTPS** quando liberar.

DNS do domínio (no registro.br ou onde estiver):
- 4 registros `A` para `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- 1 registro `CNAME` para `www` apontando para `SEU-USUARIO.github.io`
