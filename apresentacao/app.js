/* =========================================================
   siera | Apresentação comercial · app.js
   Navegação, progresso, anotações e animações (GSAP)
   ========================================================= */
(function () {
  'use strict';

  /* ---------- AJUSTES ---------- */
  var TEMPO_POR_SLIDE = 30;   // segundos: o tracinho do slide atual enche nesse tempo
  var LARGURA = 1600, ALTURA = 900;

  var doc = document.documentElement;
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap;
  var anima = !!gsap && !reduz;

  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }

  var palco = $('#palco');
  var slides = $$('.slide', palco);
  var total = slides.length;
  var atual = -1;
  var transicao = null;

  /* =========================================================
     MOLDURA DE CADA SLIDE (palavra gigante, assinatura, logo)
     ========================================================= */
  slides.forEach(function (s) {
    var escuro = s.getAttribute('data-tema') === 'escuro';
    var modo = s.getAttribute('data-chrome') || 'completo';
    var palavra = s.getAttribute('data-palavra');

    if (palavra) {
      var p = document.createElement('div');
      p.className = 'palavra'; p.setAttribute('aria-hidden', 'true');
      var sp = document.createElement('span'); sp.textContent = palavra;
      p.appendChild(sp);
      s.insertBefore(p, s.firstChild);
    }
    if (modo !== 'minimo') {
      var topo = document.createElement('div');
      topo.className = 'slide__topo'; topo.setAttribute('aria-hidden', 'true');
      topo.innerHTML = '<span class="slide__fio"></span>' +
        (modo === 'completo' ? '<span class="slide__assina">siera · Comunicação e Marketing</span>' : '');
      s.appendChild(topo);
      s.insertAdjacentHTML('beforeend',
        '<svg class="estrela slide__estrela" aria-hidden="true"><use href="#estrela"/></svg>' +
        '<span class="slide__vertical" aria-hidden="true">siera</span>');
    }
    var logo = new Image();
    logo.className = 'slide__logo';
    logo.alt = '';
    logo.src = escuro ? 'midia/logo-siera-creme.png' : 'midia/logo-siera.png';
    s.appendChild(logo);
  });

  /* Títulos: palavra por palavra */
  function separarPalavras(el) {
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (pedaco) {
          if (!pedaco) return;
          if (/^\s+$/.test(pedaco)) { frag.appendChild(document.createTextNode(pedaco)); return; }
          var w = document.createElement('span'); w.className = 'p'; w.textContent = pedaco;
          frag.appendChild(w);
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') {
        separarPalavras(n);
      }
    });
  }
  $$('[data-palavras]').forEach(separarPalavras);
  $$('[data-letras]').forEach(function (el) {
    var t = el.textContent; el.textContent = '';
    el.setAttribute('aria-label', t);
    t.split('').forEach(function (c) {
      var l = document.createElement('span'); l.className = 'l'; l.textContent = c; l.setAttribute('aria-hidden', 'true');
      el.appendChild(l);
    });
  });

  /* =========================================================
     PALCO 16:9 QUE SE ADAPTA À TELA
     ========================================================= */
  var notas = $('#notas');
  notas.removeAttribute('hidden');
  notas.setAttribute('inert', '');
  var notasAbertas = false;

  function ajustar() {
    var largNotas = (notasAbertas && window.innerWidth >= 900) ? notas.offsetWidth : 0;
    doc.style.setProperty('--notas-l', largNotas + 'px');
    var e = Math.min((window.innerWidth - largNotas) / LARGURA, window.innerHeight / ALTURA);
    doc.style.setProperty('--escala', e);
  }
  window.addEventListener('resize', ajustar);
  document.addEventListener('fullscreenchange', ajustar);
  ajustar();

  /* =========================================================
     PROGRESSO (stories) + RELÓGIO
     ========================================================= */
  var barra = $('#progresso');
  var tracos = slides.map(function () { var t = document.createElement('span'); barra.appendChild(t); return t; });
  var inicioSlide = performance.now();
  var inicioTotal = performance.now();
  var tempoEl = $('#notasTempo');

  function mmss(seg) {
    seg = Math.max(0, Math.floor(seg));
    return String(Math.floor(seg / 60)).padStart(2, '0') + ':' + String(seg % 60).padStart(2, '0');
  }
  function relogio(agora) {
    var dt = (agora - inicioSlide) / 1000;
    var t = tracos[atual];
    if (t) {
      t.style.setProperty('--p', Math.min(1, dt / TEMPO_POR_SLIDE).toFixed(4));
      t.classList.toggle('estourou', dt >= TEMPO_POR_SLIDE);
    }
    var tt = (agora - inicioTotal) / 1000;
    tempoEl.textContent = mmss(tt) + ' / ' + mmss(total * TEMPO_POR_SLIDE);
    tempoEl.classList.toggle('atrasado', tt > (atual + 1) * TEMPO_POR_SLIDE);
    requestAnimationFrame(relogio);
  }
  requestAnimationFrame(relogio);

  function atualizarProgresso() {
    tracos.forEach(function (t, i) {
      t.classList.toggle('feito', i < atual);
      t.classList.toggle('atual', i === atual);
      if (i !== atual) { t.classList.remove('estourou'); t.style.removeProperty('--p'); }
    });
  }

  /* =========================================================
     ANOTAÇÕES (tecla N)
     ========================================================= */
  function nomeSlide(i) { return slides[i] ? slides[i].getAttribute('aria-label') : ''; }
  function atualizarNotas() {
    $('#notasContador').textContent = (atual + 1) + ' / ' + total;
    $('#notasTitulo').textContent = nomeSlide(atual);
    var tpl = $('template.nota', slides[atual]);
    var box = $('#notasTexto');
    box.innerHTML = '';
    if (tpl) box.appendChild(tpl.content.cloneNode(true));
    $('#notasProximo').textContent = atual + 1 < total ? 'Próximo: ' + nomeSlide(atual + 1) : 'Último slide';
  }
  function alternarNotas(forcar) {
    notasAbertas = typeof forcar === 'boolean' ? forcar : !notasAbertas;
    notas.classList.toggle('aberto', notasAbertas);
    if (notasAbertas) notas.removeAttribute('inert'); else notas.setAttribute('inert', '');
    ajustar();
  }

  /* =========================================================
     ANIMAÇÕES DE ENTRADA (tudo em até ~1 s)
     ========================================================= */
  function formatar(n, casas) {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }

  function entrada(s, i) {
    if (!anima) return null;
    var tl = gsap.timeline({ delay: 0.08 });

    // palavra gigante: entra e fica se mexendo devagar
    var pal = $('.palavra span', s);
    if (pal) {
      tl.fromTo(pal, { opacity: 0, x: 140 }, { opacity: 1, x: 40, duration: 0.9, ease: 'expo.out' }, 0);
      s._deriva = gsap.fromTo(pal, { x: 40 }, { x: -70, duration: 14, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1 });
    }

    // títulos: palavra por palavra, subindo com leve desfoque
    var palavras = $$('[data-palavras] .p', s);
    if (palavras.length) {
      tl.fromTo(palavras,
        { yPercent: 70, opacity: 0, filter: 'blur(10px)' },
        { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.55, ease: 'expo.out', stagger: Math.min(0.05, 0.3 / palavras.length) }, 0);
    }
    $$('[data-palavras] .marca-texto', s).forEach(function (m) {
      gsap.set(m, { clearProps: 'backgroundSize' });
      var bs = getComputedStyle(m).backgroundSize;
      var alt = bs.split(' ')[1] || '0.42em';
      tl.fromTo(m, { backgroundSize: '0% ' + alt }, { backgroundSize: bs, duration: 0.6, ease: 'power3.inOut' }, 0.3);
    });

    // letras gigantes (VOLTEI)
    var letras = $$('[data-letras] .l', s);
    if (letras.length) {
      tl.fromTo(letras,
        { yPercent: 90, opacity: 0, filter: 'blur(14px)' },
        { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.7, ease: 'expo.out', stagger: 0.06 }, 0);
    }

    // cartões e blocos em sequência
    var blocos = $$('[data-entra]', s);
    if (blocos.length) {
      tl.fromTo(blocos,
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out', stagger: Math.min(0.06, 0.3 / blocos.length) }, 0.1);
    }

    // números contando do zero
    $$('[data-conta]', s).forEach(function (b) {
      var alvo = parseFloat(b.getAttribute('data-conta'));
      var casas = parseInt(b.getAttribute('data-casas') || '0', 10);
      var o = { v: 0 };
      b.textContent = formatar(0, casas);
      tl.to(o, {
        v: alvo, duration: 0.75, ease: 'power2.out',
        onUpdate: function () { b.textContent = formatar(casas ? o.v : Math.round(o.v), casas); }
      }, 0.1);
    });

    // fita em "S" se desenhando
    $$('.fita path', s).forEach(function (p) {
      tl.fromTo(p, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0);
    });

    // vídeo
    var mold = $('.video__moldura', s);
    if (mold) tl.fromTo(mold, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' }, 0);

    return tl;
  }

  /* =========================================================
     CAPA: logo digitada letra por letra (igual ao site)
     ========================================================= */
  var LETRAS = [24.25, 32.24, 58.23, 73.92, 100]; // s-i-e-r-a em % da largura
  var CORTE_BASE = 24.08;                        // esconde o slogan na camada da palavra
  var capaLogo = $('#capaLogo'), capaSlogan = $('#capaSlogan'), capaCursor = $('#capaCursor');

  function digitarLogo(tl) {
    if (!anima) return;
    capaLogo.style.clipPath = 'inset(0 100% ' + CORTE_BASE + '% 0)';
    capaCursor.style.left = '0%';
    capaCursor.classList.remove('piscando');
    tl.set(capaSlogan, { opacity: 0 }, 0);
    tl.set(capaCursor, { opacity: 1 }, 0.05);
    LETRAS.forEach(function (p, i) {
      tl.call(function () {
        capaLogo.style.clipPath = 'inset(0 ' + (100 - p) + '% ' + CORTE_BASE + '% 0)';
        capaCursor.style.left = p + '%';
      }, null, 0.12 + i * 0.11);
    });
    tl.fromTo(capaSlogan, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0.72);
    tl.call(function () { capaCursor.classList.add('piscando'); }, null, 0.75);
    tl.to(capaCursor, { opacity: 0, duration: 0.3 }, 2.6);
  }

  /* =========================================================
     CHAT AO VIVO (slide da Agente Automática)
     ========================================================= */
  // c = cliente, a = Agente Automática; true = mensagem de voz
  var CONVERSA = {
    hora: 'Domingo, 03:12',
    msgs: [
      ['c', 'Áudio: “Tem horário pra quinta de manhã?”', true],
      ['a', 'Tenho sim! Quinta às 9h ou às 10h30. Qual prefere?'],
      ['c', '10h30, por favor.'],
      ['a', 'Prontinho, agendado para quinta às 10h30. Te mando um lembrete na véspera.']
    ]
  };
  var chatLista = $('#chatMensagens'), chatStatus = $('#chatStatus'), chatEntrada = $('#chatEntrada');
  var chatRodada = 0;

  function bolha(quem, texto, audio) {
    var b = document.createElement('div');
    b.className = 'msg msg--' + (quem === 'c' ? 'cliente' : 'agente');
    if (quem === 'a') { var sm = document.createElement('small'); sm.textContent = 'Agente Automática'; b.appendChild(sm); }
    if (audio) {
      var o = document.createElement('span'); o.className = 'onda'; o.setAttribute('aria-hidden', 'true');
      o.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i><i></i>';
      b.appendChild(o);
    }
    var t = document.createElement('span'); t.textContent = texto; b.appendChild(t);
    chatLista.appendChild(b);
    if (anima) gsap.from(b, { y: 14, opacity: 0, scale: 0.94, transformOrigin: quem === 'c' ? '100% 100%' : '0 100%', duration: 0.45, ease: 'back.out(1.6)' });
    return b;
  }
  function hora() {
    var h = document.createElement('p'); h.className = 'chat__hora'; h.textContent = CONVERSA.hora;
    chatLista.appendChild(h);
    if (anima) gsap.from(h, { opacity: 0, y: 8, duration: 0.4 });
  }
  function limparChat() {
    chatRodada++;
    chatLista.innerHTML = '';
    chatStatus.textContent = 'online agora';
    chatEntrada.textContent = 'Mensagem';
    chatEntrada.parentNode.classList.remove('escrevendo');
  }
  function iniciarChat() {
    limparChat();
    var rodada = chatRodada;
    if (!anima) {
      hora();
      CONVERSA.msgs.forEach(function (m) { bolha(m[0], m[1], m[2]); });
      return;
    }
    function esperar(ms) {
      return new Promise(function (ok, nao) { setTimeout(function () { rodada === chatRodada ? ok() : nao(); }, ms); });
    }
    function digitandoAgente(ms) {
      var d = document.createElement('div');
      d.className = 'msg msg--agente msg--digitando';
      d.innerHTML = '<i></i><i></i><i></i>';
      chatLista.appendChild(d);
      chatStatus.textContent = 'digitando…';
      return esperar(ms).then(function () { d.remove(); chatStatus.textContent = 'online agora'; });
    }
    function digitarNaEntrada(texto) {
      var caixa = chatEntrada.parentNode;
      caixa.classList.add('escrevendo');
      var i = 0;
      return new Promise(function (ok, nao) {
        (function passo() {
          if (rodada !== chatRodada) { nao(); return; }
          chatEntrada.textContent = texto.slice(0, ++i);
          if (i < texto.length) setTimeout(passo, 55 + Math.random() * 40);
          else setTimeout(function () {
            chatEntrada.textContent = 'Mensagem'; caixa.classList.remove('escrevendo'); ok();
          }, 220);
        })();
      });
    }
    var m = CONVERSA.msgs;
    esperar(450)
      .then(function () { hora(); return esperar(450); })
      .then(function () { bolha(m[0][0], m[0][1], m[0][2]); return esperar(500); })
      .then(function () { return digitandoAgente(1300); })
      .then(function () { bolha(m[1][0], m[1][1]); return esperar(900); })
      .then(function () { return digitarNaEntrada(m[2][1]); })
      .then(function () { bolha(m[2][0], m[2][1]); return esperar(500); })
      .then(function () { return digitandoAgente(1500); })
      .then(function () { bolha(m[3][0], m[3][1]); })
      .catch(function () {});
  }

  /* =========================================================
     VÍDEO DE ABERTURA (com som)
     ========================================================= */
  var video = $('#videoAbertura');
  var videoSom = $('#videoSom');
  var slideVideo = video.closest('.slide');

  function tocarVideo() {
    try { video.currentTime = 0; } catch (e) {}
    video.muted = false;
    videoSom.hidden = true;
    var pr = video.play();
    if (pr && pr.catch) pr.catch(function (err) {
      if (slides[atual] !== slideVideo) return;
      if (err && err.name === 'NotAllowedError') {
        // o navegador bloqueou o som antes de qualquer clique: toca mudo e mostra o botão de som
        video.muted = true;
      }
      video.play().catch(function () {});
    });
  }
  // o botão de som só aparece quando o vídeo está mudo
  video.addEventListener('volumechange', function () { videoSom.hidden = !video.muted; });
  videoSom.addEventListener('click', function (e) {
    e.stopPropagation();
    video.muted = false;
    videoSom.hidden = true;
    video.play().catch(function () {});
  });

  // Guarda o vídeo inteiro na memória para funcionar mesmo se a internet cair
  if (window.fetch && /^https?:/.test(location.protocol)) {
    fetch(video.getAttribute('src')).then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) {
      if (!b) return;
      var trocar = function () {
        if (slides[atual] === slideVideo) { setTimeout(trocar, 2000); return; }
        video.src = URL.createObjectURL(b);
      };
      trocar();
    }).catch(function () {});
  }

  /* =========================================================
     NAVEGAÇÃO
     ========================================================= */
  function aoSair(s) {
    if (!s) return;
    if (s._tl) { s._tl.kill(); s._tl = null; }
    if (s._deriva) { s._deriva.kill(); s._deriva = null; }
    if (s === slideVideo) { video.pause(); videoSom.hidden = true; }
    if (s.contains(chatLista)) limparChat();
  }

  function aoEntrar(s, i) {
    s._tl = entrada(s, i);
    if (s.classList.contains('capa') && s._tl) digitarLogo(s._tl);
    if (s === slideVideo) tocarVideo();
    if (s.contains(chatLista)) iniciarChat();
  }

  function irPara(n, origem) {
    n = Math.max(0, Math.min(total - 1, n));
    if (n === atual) return;
    var velho = slides[atual], novo = slides[n];
    var dir = n > atual ? 1 : -1;
    var primeira = atual === -1;

    if (transicao) { transicao.progress(1); transicao = null; }
    aoSair(velho);
    atual = n;

    var escuro = novo.getAttribute('data-tema') === 'escuro';
    document.body.classList.toggle('escuro', escuro);
    palco.classList.toggle('escuro', escuro);
    slides.forEach(function (s) { if (s !== novo && s !== velho) { s.classList.remove('ativo', 'saindo'); } });
    novo.classList.add('ativo'); novo.classList.remove('saindo');
    novo.setAttribute('aria-hidden', 'false');

    if (velho && anima && !primeira) {
      velho.classList.remove('ativo'); velho.classList.add('saindo');
      velho.setAttribute('aria-hidden', 'true');
      transicao = gsap.timeline({
        onComplete: function () {
          velho.classList.remove('saindo');
          gsap.set([velho, novo], { clearProps: 'transform' });
          transicao = null;
        }
      });
      transicao.fromTo(novo, { xPercent: 100 * dir }, { xPercent: 0, duration: 0.55, ease: 'power3.inOut' }, 0);
      transicao.fromTo(velho, { xPercent: 0 }, { xPercent: -100 * dir, duration: 0.55, ease: 'power3.inOut' }, 0);
    } else if (velho) {
      velho.classList.remove('ativo', 'saindo');
      velho.setAttribute('aria-hidden', 'true');
    }

    aoEntrar(novo, n);
    inicioSlide = performance.now();
    atualizarProgresso();
    atualizarNotas();
    try { history.replaceState(null, '', '#' + (n + 1)); } catch (e) {}
  }
  function proximo() { irPara(atual + 1); }
  function anterior() { irPara(atual - 1); }

  /* Teclado */
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Enter') { e.preventDefault(); proximo(); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); anterior(); }
    else if (k === 'Home') { e.preventDefault(); irPara(0); }
    else if (k === 'End') { e.preventDefault(); irPara(total - 1); }
    else if (k === 'f' || k === 'F') { e.preventDefault(); telaCheia(); }
    else if (k === 'n' || k === 'N') { e.preventDefault(); alternarNotas(); }
    else if (k === 'Escape' && notasAbertas) { alternarNotas(false); }
    esconderDica();
  });

  /* Clique: terço esquerdo volta, o resto avança */
  var ignorarCliqueAte = 0;
  palco.addEventListener('click', function (e) {
    if (Date.now() < ignorarCliqueAte) return;
    var botao = e.target.closest('button, a');
    if (botao) {
      if (botao.hasAttribute('data-avancar')) proximo();
      return;
    }
    var r = palco.getBoundingClientRect();
    if (e.clientX < r.left + r.width * 0.3) anterior(); else proximo();
    esconderDica();
  });

  /* Toque: deslizar para os lados (tocar também funciona, pelo clique) */
  var toque = null;
  palco.addEventListener('touchstart', function (e) {
    var t = e.changedTouches[0]; toque = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  palco.addEventListener('touchend', function (e) {
    if (!toque) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - toque.x, dy = t.clientY - toque.y;
    toque = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      ignorarCliqueAte = Date.now() + 500;
      if (dx < 0) proximo(); else anterior();
      esconderDica();
    }
  }, { passive: true });

  /* Tela cheia (tecla F) */
  function telaCheia() {
    var el = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
    }
  }

  /* Mantém a tela acesa enquanto apresenta */
  var trava = null;
  function manterAcesa() {
    if (trava || !navigator.wakeLock) return;
    navigator.wakeLock.request('screen').then(function (t) {
      trava = t; t.addEventListener('release', function () { trava = null; });
    }).catch(function () {});
  }
  document.addEventListener('pointerdown', manterAcesa);
  document.addEventListener('keydown', manterAcesa);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') manterAcesa(); });

  /* Dica de atalhos */
  var dica = $('#dica');
  var dicaTimer = setTimeout(esconderDica, 5000);
  function esconderDica() { clearTimeout(dicaTimer); dica.classList.add('some'); }

  /* =========================================================
     INÍCIO
     ========================================================= */
  slides.forEach(function (s) { s.setAttribute('aria-hidden', 'true'); });
  var inicial = parseInt((location.hash || '').replace('#', ''), 10);
  irPara(isNaN(inicial) ? 0 : inicial - 1);
})();
