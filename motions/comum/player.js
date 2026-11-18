/* =========================================================
   siera · motions — player
   Prévia: palco ajustado à janela + controles.
   Render (?render): palco 1080x1920 sem escala; o gravador
   controla o tempo por window.__motion.seek(t).
   ========================================================= */
(function () {
  'use strict';

  var render = /[?&]render\b/.test(location.search);
  document.body.classList.add(render ? 'render' : 'previa');
  var palco = document.getElementById('palco');

  function ajustar() {
    if (render) { palco.style.transform = ''; palco.style.left = '0px'; palco.style.top = '0px'; return; }
    var esc = Math.min((innerWidth - 40) / 1080, (innerHeight - 100) / 1920);
    palco.style.transform = 'scale(' + esc + ')';
    palco.style.left = Math.round((innerWidth - 1080 * esc) / 2) + 'px';
    palco.style.top = Math.max(12, Math.round((innerHeight - 80 - 1920 * esc) / 2)) + 'px';
  }
  ajustar();
  addEventListener('resize', ajustar);

  function imagensProntas() {
    return Promise.all(Array.prototype.map.call(document.images, function (img) {
      return img.decode ? img.decode().catch(function () {}) : Promise.resolve();
    }));
  }
  var fontes = [
    '800 100px "Plus Jakarta Sans"', '700 100px "Plus Jakarta Sans"',
    '400 30px "Inter"', '600 30px "Inter"'
  ].map(function (f) { return document.fonts.load(f, 'Atendimento não dorme férias 03:12 … á ã ç'); });

  Promise.all(fontes.concat([document.fonts.ready, imagensProntas()])).then(function () {
    var m = window.criarMotion();
    var tl = m.tl;

    window.__motion = {
      duracao: m.duracao,
      fps: m.fps,
      seek: function (t) { tl.pause(); tl.seek(t, false); }
    };

    if (render) { tl.pause(0); document.body.dataset.pronto = '1'; return; }

    var btTocar = document.getElementById('btTocar');
    var barra = document.getElementById('barra');
    var tempo = document.getElementById('tempo');
    barra.max = m.duracao;

    function rotulo() { btTocar.textContent = tl.paused() || tl.progress() === 1 ? 'Tocar' : 'Pausar'; }
    function tocar() {
      if (tl.progress() === 1) tl.restart(); else tl.paused(!tl.paused());
      rotulo();
    }
    tl.eventCallback('onComplete', rotulo);

    document.getElementById('btReiniciar').addEventListener('click', function () { tl.restart(); rotulo(); });
    btTocar.addEventListener('click', tocar);
    barra.addEventListener('input', function () { tl.pause(); tl.seek(parseFloat(barra.value), false); rotulo(); });
    addEventListener('keydown', function (e) {
      if (e.code === 'Space') { e.preventDefault(); tocar(); }
      if (e.key === 'r' || e.key === 'R') { tl.restart(); rotulo(); }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        tl.pause(); tl.seek(Math.max(0, Math.min(m.duracao, tl.time() + (e.key === 'ArrowRight' ? 1 : -1) / m.fps)), false); rotulo();
      }
    });
    gsap.ticker.add(function () {
      barra.value = tl.time();
      tempo.textContent = tl.time().toFixed(2) + 's';
    });

    tl.play(0);
    rotulo();
  });
})();
