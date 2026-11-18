/* =========================================================
   Atendimento que não dorme · timeline única (GSAP)
   15 s · 60 fps · 1080x1920
   Ritmo: 120 BPM → 1 batida = 0,5 s. Os cortes caem na grade
   de colcheias (0,25 s), então qualquer música de 120 BPM encaixa.
   ========================================================= */
(function () {
  'use strict';

  var DURACAO = 15;
  var FPS = 60;

  // fronteiras de cada letra (s-i-e-r-a) em % da largura da logo, iguais ao app.js
  var LETRAS = [24.25, 32.24, 58.23, 73.92, 100];
  var CORTE_BASE = 24.08;

  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

  /* Ajusta tamanhos de texto para caberem na largura útil (margem de 90 px) */
  function caber(alvos, medir, larguraMax) {
    var w = medir();
    if (w <= larguraMax) return;
    var fator = larguraMax / w;
    alvos.forEach(function (el) {
      var fs = parseFloat(getComputedStyle(el).fontSize);
      el.style.fontSize = (fs * fator) + 'px';
    });
  }

  function prepararLayout() {
    // título da cena 2
    caber([$('.titulo')], function () {
      return Math.max.apply(null, $$('.titulo .linha').map(function (l) { return l.offsetWidth; }));
    }, 900);

    // frase da cena 4 (SVG)
    var textosFrase = $$('.frase text');
    caber(textosFrase, function () {
      return Math.max.apply(null, $$('.frase:not(.frase--creme) text').map(function (t) { return t.getBBox().width; }));
    }, 940);

    // marca-texto lilás atrás de "A qualquer hora." (mesma geometria do .marca-texto)
    var l3 = $('.frase:not(.frase--creme) .l3');
    var bb = l3.getBBox();
    var fs = parseFloat(getComputedStyle(l3).fontSize);
    var marca = $('#fraseMarca');
    var base = parseFloat(l3.getAttribute('y'));
    marca.setAttribute('x', bb.x - fs * 0.06);
    marca.setAttribute('y', base - fs * 0.27);
    marca.setAttribute('height', fs * 0.42);
    marca.setAttribute('width', 0);
    marca.dataset.largura = bb.width + fs * 0.12;

    // slogan final
    caber([$('.final__slogan')], function () {
      return Math.max.apply(null, $$('.final__slogan .linha').map(function (l) { return l.offsetWidth; }));
    }, 920);
  }

  function comprimento(path) { return Math.ceil(path.getTotalLength()) + 40; }

  window.criarMotion = function () {
    prepararLayout();

    var tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });

    /* ---------------- Fundo: brilho lilás respira devagar ---------------- */
    tl.fromTo('#brilho', { x: 0, y: 0 }, { x: -140, y: 90, duration: 14, ease: 'sine.inOut' }, 0);

    /* ---------------- 0–2s · Logo digitada letra por letra ---------------- */
    // cursor pisca no vazio, depois cada letra entra a cada 0,2 s (igual à abertura do site)
    tl.set('#cursor', { opacity: 0 }, 0.1);
    tl.set('#cursor', { opacity: 1 }, 0.18);
    LETRAS.forEach(function (p, i) {
      var t = 0.2 + i * 0.2;
      tl.set('#logoMarca', { clipPath: 'inset(0% ' + (100 - p) + '% ' + CORTE_BASE + '% 0%)' }, t);
      tl.set('#cursor', { left: p + '%' }, t);
    });
    tl.fromTo('#logoSlogan', { opacity: 0, y: 11 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, 1.05);
    tl.set('#cursor', { opacity: 0 }, 1.2);
    tl.set('#cursor', { opacity: 1 }, 1.35);

    // a logo sobe e vira a marca do topo (como na saída da abertura do site)
    tl.to('#cursor', { opacity: 0, duration: 0.15, ease: 'power2.out' }, 1.5);
    tl.to('#logoSlogan', { opacity: 0, duration: 0.3, ease: 'power2.out' }, 1.5);
    var escalaTopo = 230 / 760;
    tl.to('#logoPalco', { x: (1080 - 230) / 2 - 160, y: 150 - 831, scale: escalaTopo, duration: 0.8, ease: 'expo.inOut' }, 1.5);

    /* ---------------- 2–5s · "Atendimento que não dorme." ---------------- */
    tl.fromTo('#rotulo', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 1.9);
    tl.fromTo('#rotulo .estrela', { scale: 0, rotate: -120 }, { scale: 1, rotate: 0, duration: 1 }, 1.95);

    var palavras = $$('.titulo .palavra');
    [2.0, 2.25, 2.75, 3.0].forEach(function (t, i) {
      tl.fromTo(palavras[i],
        { y: 150, opacity: 0, filter: 'blur(18px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.1, ease: 'expo.out' }, t);
    });
    tl.fromTo('#marcaTexto', { backgroundSize: '0% 0.42em' }, { backgroundSize: '100% 0.42em', duration: 1, ease: 'power3.inOut' }, 3.25);
    tl.fromTo('#tituloBloco', { scale: 1 }, { scale: 1.035, duration: 2.6, ease: 'power1.inOut', transformOrigin: '0% 50%' }, 2.0);

    // saída para cima, com desfoque, no tempo do corte
    tl.to(['#rotulo'].concat($$('.titulo .linha')), {
      y: -140, opacity: 0, filter: 'blur(16px)', duration: 0.4, ease: 'power3.in', stagger: 0.03
    }, 4.55);

    /* ---------------- 5–10s · Celular e conversa às 03:12 ---------------- */
    tl.fromTo('#cel', { y: 1800, rotateX: 24 }, { y: 0, rotateX: 0, duration: 1.4, ease: 'expo.out' }, 4.8);
    tl.fromTo('#cel', { scale: 1 }, { scale: 1.035, duration: 4, ease: 'power1.inOut' }, 5.6);

    tl.fromTo('#hora',
      { opacity: 0, y: 18, scale: 1.7, filter: 'blur(8px)' },
      { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.8, ease: 'expo.out' }, 5.5);
    tl.fromTo('#dia', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 5.6);

    // o cliente digita na caixa de mensagem (como o digitarNaEntrada do site)
    var pergunta = 'Ainda dá para agendar?';
    var campo = $('#entradaDigitada');
    var digitar = { n: 0 };
    campo.textContent = '';
    tl.set('#entradaVazia', { opacity: 0 }, 5.85);
    tl.to(digitar, {
      n: pergunta.length, duration: 0.6, ease: 'power1.inOut',
      onUpdate: function () { campo.textContent = pergunta.slice(0, Math.round(digitar.n)); }
    }, 5.85);
    tl.fromTo('#enviar', { scale: 1 }, { scale: 0.84, duration: 0.1, ease: 'power2.out', yoyo: true, repeat: 1 }, 6.4);
    tl.set('#entradaDigitada', { opacity: 0 }, 6.5);
    tl.set('#entradaVazia', { opacity: 1 }, 6.5);

    // bolha do cliente (mesma animação das bolhas do chat do site)
    tl.fromTo('#msgCliente',
      { y: 26, opacity: 0, scale: 0.94, transformOrigin: '100% 100%' },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }, 6.5);

    // três pontinhos de "digitando"
    tl.fromTo('#digitando',
      { y: 22, opacity: 0, scale: 0.94, transformOrigin: '0% 100%' },
      { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)' }, 7.0);
    tl.set('#statusOnline', { opacity: 0 }, 7.0);
    tl.set('#statusDigitando', { opacity: 1 }, 7.0);
    $$('#digitando i').forEach(function (d, i) {
      tl.fromTo(d, { y: 0, opacity: 0.4 }, { y: -7, opacity: 1, duration: 0.2, ease: 'power2.out', yoyo: true, repeat: 3 }, 7.1 + i * 0.1);
    });

    // resposta da Agente
    tl.to('#digitando', { opacity: 0, duration: 0.12, ease: 'power2.out' }, 8.0);
    tl.set('#statusOnline', { opacity: 1 }, 8.0);
    tl.set('#statusDigitando', { opacity: 0 }, 8.0);
    tl.fromTo('#msgAgente',
      { y: 26, opacity: 0, scale: 0.94, transformOrigin: '0% 100%' },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }, 8.0);

    // respostas rápidas: o cliente toca em 10h30
    tl.fromTo('.rapidas .chip', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 }, 8.6);
    tl.to('#chipEscolhido', { backgroundColor: '#4A0E25', color: '#F4EDE8', borderColor: '#4A0E25', duration: 0.3, ease: 'power2.out' }, 9.25);
    tl.fromTo('#chipEscolhido', { scale: 1 }, { scale: 0.92, duration: 0.1, ease: 'power2.out', yoyo: true, repeat: 1 }, 9.25);

    // celular sai por baixo
    tl.to('#cel', { y: 1800, rotateX: -14, duration: 0.5, ease: 'power3.in' }, 9.6);
    // a marca do topo sai antes de a fita passar por ela
    tl.to('#logoPalco', { opacity: 0, y: 150 - 831 - 40, duration: 0.4, ease: 'power3.in' }, 9.6);

    /* ---------------- 10–13s · Fita em "S" + "Sem folga. Sem férias. A qualquer hora." ---------------- */
    var fitas = $$('.fita-s');
    var Ls = comprimento(fitas[0]);
    gsap.set(fitas, { strokeDasharray: Ls + ' ' + Ls });
    tl.fromTo(fitas, { strokeDashoffset: Ls }, { strokeDashoffset: 0, duration: 1.3, ease: 'power3.inOut' }, 9.85);

    tl.fromTo('.l1', { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 10.5);
    tl.fromTo('.l2', { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 11.0);
    tl.fromTo('.l3', { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 11.5);
    var marcaFrase = $('#fraseMarca');
    tl.fromTo(marcaFrase, { attr: { width: 0 } }, { attr: { width: parseFloat(marcaFrase.dataset.largura) }, duration: 0.9, ease: 'power3.inOut' }, 11.85);

    // a fita engrossa e vira o fundo bordô
    tl.to(fitas, { strokeWidth: 3200, duration: 0.6, ease: 'expo.inOut' }, 12.7);
    tl.to('.frase--creme text', { y: -50, opacity: 0, duration: 0.3, ease: 'power3.in' }, 13.0);

    /* ---------------- 13–15s · Fechamento bordô (parado a partir de 14 s) ---------------- */
    tl.set('#c5Fundo', { opacity: 1 }, 13.25);
    var fitaFinal = $('#fitaFinal');
    var Lf = comprimento(fitaFinal);
    gsap.set(fitaFinal, { strokeDasharray: Lf + ' ' + Lf });
    tl.fromTo(fitaFinal, { strokeDashoffset: Lf }, { strokeDashoffset: 0, duration: 0.85, ease: 'power3.out' }, 13.15);

    tl.fromTo('#finalEstrela', { scale: 0, rotate: -120 }, { scale: 1, rotate: 0, duration: 0.75 }, 13.25);
    tl.fromTo('#finalLogo', { y: 50, opacity: 0, filter: 'blur(14px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.75 }, 13.25);
    tl.fromTo('.slogan-l',
      { y: 90, opacity: 0, filter: 'blur(14px)' },
      { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.6, stagger: 0.06 }, 13.28);
    tl.fromTo('#sloganMarca', { backgroundSize: '0% 0.08em' }, { backgroundSize: '100% 0.08em', duration: 0.4, ease: 'power3.inOut' }, 13.6);

    // tudo termina em 14,0 s; o último segundo fica parado
    tl.set({}, {}, DURACAO);

    return { tl: tl, duracao: DURACAO, fps: FPS };
  };
})();
