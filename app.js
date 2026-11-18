/* =========================================================
   siera | Comunicação e Marketing · app.js
   ========================================================= */
(function () {
  'use strict';

  /* ---------- CONFIGURAÇÃO: troque aqui ---------- */
  var CONFIG = {
    // Só números, com 55 + DDD + número. Ex.: '5575999999999'
    whatsapp: '5573981091204'
  };

  var doc = document.documentElement;
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  var temGSAP = !!(gsap && ST) && !reduz;
  if (gsap && ST) gsap.registerPlugin(ST);

  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }

  /* =========================================================
     WHATSAPP
     ========================================================= */
  function linkWhats(msg) {
    var num = String(CONFIG.whatsapp).replace(/\D/g, '');
    var base = 'https://wa.me/' + num;
    return msg ? base + '?text=' + encodeURIComponent(msg) : base;
  }
  function abrirWhats(msg) {
    var url = linkWhats(msg);
    var w = window.open(url, '_blank');
    if (w) { try { w.opener = null; } catch (e) {} } else { window.location.href = url; }
  }
  $$('[data-wa]').forEach(function (a) {
    a.href = linkWhats(a.getAttribute('data-wa'));
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* =========================================================
     CABEÇALHO + MENU
     ========================================================= */
  var topo = $('#topo');
  function aoRolar() { topo.classList.toggle('topo--rolado', window.scrollY > 24); }
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  var menuBotao = $('#menuBotao');
  var menuMovel = $('#menuMovel');
  function menu(abrir) {
    menuBotao.setAttribute('aria-expanded', String(abrir));
    menuBotao.querySelector('.sr').textContent = abrir ? 'Fechar menu' : 'Abrir menu';
    menuMovel.hidden = !abrir;
    topo.classList.toggle('topo--aberto', abrir);
    if (abrir) { var p = menuMovel.querySelector('a'); if (p) p.focus(); }
  }
  menuBotao.addEventListener('click', function () { menu(menuBotao.getAttribute('aria-expanded') !== 'true'); });
  menuMovel.addEventListener('click', function (e) { if (e.target.closest('a')) menu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menuMovel.hidden) { menu(false); menuBotao.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1024 && !menuMovel.hidden) menu(false); });

  // Link ativo no menu
  var linksMenu = $$('.menu a');
  if ('IntersectionObserver' in window) {
    var obsMenu = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        linksMenu.forEach(function (a) {
          if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { obsMenu.observe(s); });
  }

  /* =========================================================
     ABERTURA: digitação na logo
     ========================================================= */
  // fronteiras de cada letra (s-i-e-r-a) em % da largura da logo
  var LETRAS = [24.25, 32.24, 58.23, 73.92, 100];
  var CORTE_BASE = 24.08; // esconde o slogan na camada da palavra

  function abertura(depois) {
    var ativa = doc.classList.contains('intro');
    try { sessionStorage.setItem('siera-intro', '1'); } catch (e) {}
    if (!ativa) { depois(false); return; }
    if (!gsap) { doc.classList.remove('intro'); depois(false); return; }

    var el = $('#abertura'), palco = $('#aberturaPalco'), marca = $('#aberturaMarca');
    var slogan = $('#aberturaSlogan'), cursor = $('#aberturaCursor'), pular = $('#aberturaPular');
    var terminou = false, saindo = false;

    function fim() {
      if (terminou) return;
      terminou = true;
      doc.classList.remove('intro');
      el.parentNode && el.parentNode.removeChild(el);
      if (ST) ST.refresh();
    }

    function sair() {
      if (saindo) return;
      saindo = true;
      tl.kill();
      marca.style.clipPath = 'inset(0 0 ' + CORTE_BASE + '% 0)';
      var alvo = $('#marcaTopo').getBoundingClientRect();
      var orig = palco.getBoundingClientRect();
      var escala = alvo.width / orig.width;
      depois(true);
      gsap.to([cursor, pular], { opacity: 0, duration: 0.2 });
      gsap.to(slogan, { opacity: 0, duration: 0.3 });
      gsap.to(palco, {
        x: alvo.left - orig.left, y: alvo.top - orig.top, scale: escala,
        duration: 0.95, ease: 'expo.inOut'
      });
      gsap.to(el, {
        backgroundColor: 'rgba(244,237,232,0)', duration: 0.6, delay: 0.3, ease: 'power1.out',
        onComplete: function () { gsap.delayedCall(0.08, fim); }
      });
    }

    var tl = gsap.timeline();
    tl.to({}, { duration: 0.3 });
    LETRAS.forEach(function (p) {
      tl.call(function () {
        marca.style.clipPath = 'inset(0 ' + (100 - p) + '% ' + CORTE_BASE + '% 0)';
        cursor.style.left = p + '%';
      });
      tl.to({}, { duration: 0.19 });
    });
    tl.fromTo(slogan, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '+=0.1');
    tl.to({}, { duration: 0.35 });
    tl.call(sair);

    pular.addEventListener('click', function () {
      if (saindo) return;
      saindo = true;
      tl.kill();
      depois(true);
      gsap.to(el, { opacity: 0, duration: 0.35, onComplete: fim });
    });
    // tecla Esc também pula
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape' && !saindo) { pular.click(); document.removeEventListener('keydown', esc); }
    });
  }

  /* =========================================================
     ENTRADA DA HERO
     ========================================================= */
  var heroIniciada = false, heroPronta = false;
  function entradaHero(comAbertura) {
    if (heroIniciada) return;
    heroIniciada = true;
    doc.classList.remove('pre');

    if (temGSAP) {
      var atraso = comAbertura ? 0.35 : 0.05;
      gsap.from('[data-hero]', { y: 34, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out', delay: atraso });
      gsap.from('[data-hero-monitor]', { y: 70, opacity: 0, rotateX: 14, duration: 1.4, ease: 'expo.out', delay: atraso + 0.2 });
      gsap.from('.hero .marca-texto', { backgroundSize: '0% 0.42em', duration: 1, ease: 'power3.inOut', delay: atraso + 0.75 });
      desenharFitaHero(atraso + 0.4);
    }
    setTimeout(function () { heroPronta = true; talvezIniciarChat(); }, temGSAP ? (comAbertura ? 1300 : 800) : 150);
  }

  /* =========================================================
     FITA EM "S": comprimento real na tela
     ========================================================= */
  function comprimentoTela(path) {
    var svg = path.ownerSVGElement;
    var m = svg.getScreenCTM();
    if (!m) return path.getTotalLength();
    var total = path.getTotalLength(), n = 160, soma = 0, ant = null;
    for (var i = 0; i <= n; i++) {
      var pt = path.getPointAtLength(total * i / n);
      var x = pt.x * m.a, y = pt.y * m.d;
      if (ant) soma += Math.hypot(x - ant[0], y - ant[1]);
      ant = [x, y];
    }
    return Math.ceil(soma) + 40;
  }
  function prepararFita(path) {
    var L = comprimentoTela(path);
    path.style.strokeDasharray = L + ' ' + L;
    path.dataset.len = L;
    return L;
  }

  function desenharFitaHero(atraso) {
    var path = $('.fita--hero path');
    if (!path || getComputedStyle(path.ownerSVGElement).display === 'none') return;
    var L = prepararFita(path);
    gsap.fromTo(path, { strokeDashoffset: L }, {
      strokeDashoffset: L * 0.55, duration: 1.6, delay: atraso, ease: 'power3.out',
      onComplete: function () {
        gsap.fromTo(path, { strokeDashoffset: function () { return path.dataset.len * 0.55; } }, {
          strokeDashoffset: 0, ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 20%', scrub: 0.6, invalidateOnRefresh: true }
        });
      }
    });
  }

  /* =========================================================
     CHAT: Atendimento Online (demonstração)
     ========================================================= */
  var ROTEIRO = {
    abertura: {
      pergunta: 'Oi! Vocês fazem atendimento automático no WhatsApp?',
      resposta: 'Oi! Fazemos sim. Aqui é o atendimento automático da siera: respondo em segundos, a qualquer hora, e entendo até áudio. Quer saber algo específico? Toque numa pergunta aqui embaixo.'
    },
    preco: {
      pergunta: 'Quanto custa um site?',
      resposta: 'Cada site da siera é feito sob medida, então o valor depende das páginas, das animações e das integrações. Me conta o objetivo do seu site que a Mariana te envia uma proposta, sem compromisso.'
    },
    ia: {
      pergunta: 'Como funciona o atendimento automático no WhatsApp?',
      resposta: 'A automação fica conectada ao WhatsApp da sua empresa e responde na hora, até mensagens de áudio. Ela tira dúvidas, qualifica o cliente, agenda horários e manda lembretes. Quando o assunto pede uma pessoa, passa a conversa para a sua equipe.'
    },
    mariana: {
      pergunta: 'Quero falar com a Mariana',
      resposta: 'Claro! Abri o WhatsApp da Mariana numa nova aba. É só enviar a mensagem que ela te responde.',
      link: 'Olá, Mariana! Vim pelo site da siera e quero conversar.'
    }
  };

  var chatLista = $('#chatMensagens');
  var chatStatus = $('#chatStatus');
  var chatEntrada = $('.chat__entrada span');
  var chatOcupado = false, chatIniciado = false, chatVisivel = !('IntersectionObserver' in window);

  function esperar(ms) { return new Promise(function (r) { setTimeout(r, reduz ? 0 : ms); }); }
  function rolarChat() {
    chatLista.scrollTo({ top: chatLista.scrollHeight, behavior: reduz ? 'auto' : 'smooth' });
  }
  function bolha(quem, texto, linkMsg) {
    var b = document.createElement('div');
    b.className = 'msg msg--' + quem;
    if (quem === 'agente') {
      var s = document.createElement('small'); s.textContent = 'Atendimento siera'; b.appendChild(s);
    } else {
      var s2 = document.createElement('span'); s2.className = 'sr'; s2.textContent = 'Cliente: '; b.appendChild(s2);
    }
    b.appendChild(document.createTextNode(texto));
    if (linkMsg) {
      var a = document.createElement('a');
      a.className = 'msg__wa'; a.href = linkWhats(linkMsg); a.target = '_blank'; a.rel = 'noopener';
      a.textContent = 'Abrir WhatsApp';
      b.appendChild(document.createElement('br'));
      b.appendChild(a);
    }
    chatLista.appendChild(b);
    if (temGSAP) gsap.from(b, { y: 12, opacity: 0, scale: 0.96, transformOrigin: quem === 'cliente' ? '100% 100%' : '0 100%', duration: 0.45, ease: 'back.out(1.6)' });
    rolarChat();
    return b;
  }
  function digitando() {
    var d = document.createElement('div');
    d.className = 'msg msg--agente msg--digitando';
    d.setAttribute('aria-label', 'Atendimento digitando');
    d.innerHTML = '<i></i><i></i><i></i>';
    chatLista.appendChild(d);
    chatStatus.textContent = 'digitando…';
    rolarChat();
    return d;
  }
  function digitarNaEntrada(texto) {
    if (reduz) return Promise.resolve();
    return new Promise(function (r) {
      var i = 0;
      chatEntrada.style.color = 'var(--tinta)';
      (function passo() {
        chatEntrada.textContent = texto.slice(0, ++i);
        if (i < texto.length) setTimeout(passo, 28 + Math.random() * 30);
        else setTimeout(function () {
          chatEntrada.textContent = 'Escolha uma pergunta acima…';
          chatEntrada.style.color = '';
          r();
        }, 260);
      })();
    });
  }
  function responder(chave, digitarAntes) {
    var r = ROTEIRO[chave];
    chatOcupado = true;
    $$('#chatRapidas button').forEach(function (b) { b.disabled = true; });
    var inicio = digitarAntes ? digitarNaEntrada(r.pergunta) : Promise.resolve();
    return inicio.then(function () {
      bolha('cliente', r.pergunta);
      return esperar(450);
    }).then(function () {
      var d = digitando();
      return esperar(900 + Math.min(r.resposta.length * 8, 900)).then(function () { d.remove(); });
    }).then(function () {
      chatStatus.textContent = 'online agora';
      bolha('agente', r.resposta, r.link);
      chatOcupado = false;
      $$('#chatRapidas button').forEach(function (b) { b.disabled = false; });
    });
  }
  function talvezIniciarChat() {
    if (heroPronta && chatVisivel) iniciarChat();
  }
  function iniciarChat() {
    if (chatIniciado) return;
    chatIniciado = true;
    responder('abertura', true);
  }
  $$('#chatRapidas [data-pergunta]').forEach(function (bt) {
    bt.addEventListener('click', function () {
      var chave = bt.getAttribute('data-pergunta');
      if (chatOcupado) return; // o link da Mariana continua abrindo o WhatsApp normalmente
      responder(chave, false);
    });
  });

  /* =========================================================
     BENTO: demos interativas
     ========================================================= */
  // conversas de exemplo (c = cliente, a = atendimento automático, true = mensagem de voz)
  var SEGMENTOS = {
    clinicas: { hora: 'Domingo, 03:12', msgs: [
      ['c', 'Áudio: “Tem horário pra quinta de manhã?”', true],
      ['a', 'Tenho sim! Quinta às 9h ou às 10h30. Qual prefere?'],
      ['c', '10h30, por favor.'],
      ['a', 'Prontinho, agendado para quinta às 10h30. Te mando um lembrete na véspera.']
    ] },
    mobilidade: { hora: 'Sábado, 23:47', msgs: [
      ['c', 'Áudio: “Preciso de um carro pra rodoviária agora.”', true],
      ['a', 'Certo! Me envia a sua localização que eu já aciono o motorista mais próximo.'],
      ['c', 'Localização enviada.'],
      ['a', 'Recebido! Te aviso por aqui assim que o motorista estiver chegando.']
    ] },
    locais: { hora: 'Feriado, 07:05', msgs: [
      ['c', 'Áudio: “Vocês entregam no centro hoje?”', true],
      ['a', 'Entregamos sim! Pedidos feitos até as 18h chegam hoje. Quer ver o catálogo?'],
      ['c', 'Quero!'],
      ['a', 'Aqui está o catálogo com os preços. Se quiser, já anoto o seu pedido por aqui.']
    ] }
  };
  function montarConversa(seg) {
    var box = $('#iaConversa');
    box.innerHTML = '';
    $('#iaHora').textContent = seg.hora;
    seg.msgs.forEach(function (m) {
      var b = document.createElement('div');
      b.className = 'balao balao--' + (m[0] === 'c' ? 'cliente' : 'agente');
      if (m[2]) {
        var onda = document.createElement('span');
        onda.className = 'balao__audio'; onda.setAttribute('aria-hidden', 'true');
        onda.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i><i></i>';
        b.appendChild(onda);
      }
      var t = document.createElement('span'); t.textContent = m[1]; b.appendChild(t);
      box.appendChild(b);
    });
  }
  var abas = $$('.abas [role="tab"]');
  var painel = $('#painel-ia');
  function selecionarAba(aba, foco) {
    abas.forEach(function (a) {
      var sel = a === aba;
      a.setAttribute('aria-selected', String(sel));
      a.tabIndex = sel ? 0 : -1;
    });
    painel.setAttribute('aria-labelledby', aba.id);
    montarConversa(SEGMENTOS[aba.getAttribute('data-segmento')]);
    if (temGSAP) gsap.fromTo('#iaConversa .balao', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.22, ease: 'expo.out' });
    if (foco) aba.focus();
  }
  abas.forEach(function (aba, i) {
    aba.addEventListener('click', function () { selecionarAba(aba); });
    aba.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight') n = abas[(i + 1) % abas.length];
      if (e.key === 'ArrowLeft') n = abas[(i - 1 + abas.length) % abas.length];
      if (e.key === 'Home') n = abas[0];
      if (e.key === 'End') n = abas[abas.length - 1];
      if (n) { e.preventDefault(); selecionarAba(n, true); }
    });
  });

  var miniSite = $('#miniSite');
  $$('.alternar button').forEach(function (b, _, todos) {
    b.addEventListener('click', function () {
      todos.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      miniSite.classList.toggle('celular', b.getAttribute('data-tela') === 'celular');
    });
  });

  var motionDemo = $('#motionDemo');
  function pausarMotion(p) {
    motionDemo.setAttribute('aria-pressed', String(p));
    $('#motionRotulo').textContent = p ? 'Retomar animação de exemplo' : 'Pausar animação de exemplo';
  }
  motionDemo.addEventListener('click', function () { pausarMotion(motionDemo.getAttribute('aria-pressed') !== 'true'); });
  if (reduz) pausarMotion(true);

  /* =========================================================
     MÍDIA: foto e vídeos com placeholder fácil de trocar
     ========================================================= */
  $$('[data-img]').forEach(function (box) {
    var img = new Image();
    img.onload = function () {
      img.alt = box.getAttribute('data-img-alt') || '';
      img.loading = 'lazy';
      box.innerHTML = '';
      box.appendChild(img);
    };
    img.src = box.getAttribute('data-img');
  });

  var slots = $$('[data-video]');
  function carregarVideo(slot) {
    if (slot.dataset.carregado) return;
    slot.dataset.carregado = '1';
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.preload = 'metadata';
    v.setAttribute('aria-label', slot.getAttribute('data-video-label') || 'Vídeo do portfólio');
    if (reduz) v.controls = true;
    var poster = slot.getAttribute('data-poster');
    if (poster) {
      var p = new Image();
      p.onload = function () { v.poster = poster; };
      p.src = poster;
    }
    v.addEventListener('loadeddata', function () {
      var ph = slot.querySelector('.placeholder');
      if (ph) ph.remove();
      slot.appendChild(v);
      if (!reduz && slot.dataset.visivel === '1') v.play().catch(function () {});
    }, { once: true });
    // se o arquivo ainda não existir, o [PLACEHOLDER] continua aparecendo
    v.addEventListener('error', function () {}, { once: true });
    v.src = slot.getAttribute('data-video');
    slot._video = v;
  }
  if ('IntersectionObserver' in window) {
    var obsVideo = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        var slot = en.target;
        slot.dataset.visivel = en.isIntersecting ? '1' : '0';
        if (en.isIntersecting) carregarVideo(slot);
        var v = slot._video;
        if (v && v.parentNode && !reduz) { if (en.isIntersecting) v.play().catch(function () {}); else v.pause(); }
      });
    }, { rootMargin: '250px 0px' });
    slots.forEach(function (s) { obsVideo.observe(s); });
  } else {
    slots.forEach(carregarVideo);
  }

  /* =========================================================
     FORMULÁRIO → WhatsApp
     ========================================================= */
  var form = $('#formulario');
  var campoWhats = $('#f-whats');
  campoWhats.addEventListener('input', function () {
    var d = campoWhats.value.replace(/\D/g, '').slice(0, 11);
    var f = d;
    if (d.length > 2) f = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length > 7) f = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
    campoWhats.value = f;
  });
  function erro(campo, msg) {
    var span = $('#' + campo.id + '-erro');
    campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) campo.setAttribute('aria-describedby', span.id); else campo.removeAttribute('aria-describedby');
    span.textContent = msg || '';
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var nome = form.nome.value.trim();
    var empresa = form.empresa.value.trim();
    var whats = form.whatsapp.value.trim();
    var interesse = (form.querySelector('input[name="interesse"]:checked') || {}).value || 'Ainda não sei';
    var ok = true;
    erro(form.nome, nome ? '' : 'Conta pra gente o seu nome.');
    if (!nome) ok = false;
    var digitos = whats.replace(/\D/g, '').length;
    erro(form.whatsapp, digitos >= 10 ? '' : 'Informe um WhatsApp com DDD.');
    if (digitos < 10) ok = false;
    if (!ok) { (nome ? form.whatsapp : form.nome).focus(); return; }

    var msg = 'Olá, siera! Meu nome é ' + nome +
      (empresa ? ', da empresa ' + empresa : '') + '.\n' +
      'Meu WhatsApp: ' + whats + '\n' +
      'Tenho interesse em: ' + interesse + '.';
    abrirWhats(msg);
  });

  /* =========================================================
     WHATSAPP FLUTUANTE: nunca cobre o chat da Hero
     ========================================================= */
  var waFlut = $('#waFlutuante');
  var chatEl = $('#chat');
  function atualizarFlutuante() { waFlut.classList.toggle('oculto', chatVisivel || doc.classList.contains('intro')); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      chatVisivel = en[0].isIntersecting;
      atualizarFlutuante();
      talvezIniciarChat();
    }, { rootMargin: '0px 0px 40px 0px' }).observe(chatEl);
  }
  atualizarFlutuante();

  /* =========================================================
     ANIMAÇÕES NA ROLAGEM
     ========================================================= */
  function animacoesRolagem() {
    if (!temGSAP) return;

    // revelações suaves
    var revela = $$('[data-revela]');
    gsap.set(revela, { y: 36, opacity: 0 });
    ST.batch(revela, {
      start: 'top 88%', once: true,
      onEnter: function (lote) { gsap.to(lote, { y: 0, opacity: 1, duration: 1, stagger: 0.09, ease: 'expo.out', overwrite: true }); }
    });

    // marca-texto lilás se pinta ao entrar
    $$('.marca-texto').forEach(function (m) {
      if (m.closest('.hero')) return;
      gsap.from(m, {
        backgroundSize: '0% 0.42em', duration: 1.1, ease: 'power3.inOut', delay: 0.35,
        scrollTrigger: { trigger: m, start: 'top 85%', once: true }
      });
    });

    // fitas em "S" se desenham com a rolagem
    $$('.fita:not(.fita--hero) path').forEach(function (path) {
      var svg = path.ownerSVGElement;
      if (getComputedStyle(svg).display === 'none') return;
      prepararFita(path);
      gsap.fromTo(path, { strokeDashoffset: function () { return prepararFita(path); } }, {
        strokeDashoffset: 0, ease: 'none',
        scrollTrigger: {
          trigger: svg.parentElement, start: 'top 85%', end: 'bottom 45%',
          scrub: 0.8, invalidateOnRefresh: true
        }
      });
    });

    // números dos passos
    gsap.from('.passo__num', {
      scale: 0.4, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'back.out(2)',
      scrollTrigger: { trigger: '.passos__lista', start: 'top 80%', once: true }
    });

    var mm = gsap.matchMedia();
    mm.add('(min-width: 960px)', function () {
      // o monitor reage à rolagem
      gsap.to('#monitor', {
        rotateX: 9, scale: 0.94, y: 50, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
      // foto da fundadora
      gsap.fromTo('.foto-moldura', { y: 30 }, {
        y: -20, ease: 'none',
        scrollTrigger: { trigger: '.quem', start: 'top bottom', end: 'bottom top', scrub: 0.8 }
      });
    });

    window.addEventListener('load', function () { ST.refresh(); });
  }

  /* =========================================================
     INÍCIO
     ========================================================= */
  animacoesRolagem();
  abertura(function (comAbertura) {
    entradaHero(comAbertura);
    atualizarFlutuante();
    setTimeout(atualizarFlutuante, 1300);
  });
})();
