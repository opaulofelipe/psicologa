(function () {
  'use strict';

  var CHAVE = 'a11y-marina-v2';
  var TAMANHOS = [100, 115, 130, 150];
  var html = document.documentElement;
  var padrao = { tamanho: 0, contraste: false, espaco: false, fonte: false, links: false, parar: false, libras: true };
  var estado = Object.assign({}, padrao);
  var synth = window.speechSynthesis;
  var lendo = false;

  try {
    var salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (salvo) Object.assign(estado, salvo);
  } catch (e) { /* segue com o padrão */ }

  if (/[?&]libras=off\b/.test(location.search)) estado.libras = false;

  var opcoes = [
    ['contraste', 'Alto contraste', 'a11y-contraste'],
    ['espaco', 'Espaçamento do texto', 'a11y-espaco'],
    ['fonte', 'Fonte simples', 'a11y-fonte'],
    ['links', 'Destacar links', 'a11y-links'],
    ['parar', 'Pausar animações', 'a11y-parar']
  ];

  // Monta o painel
  var gatilho = document.createElement('button');
  gatilho.className = 'a11y-gatilho';
  gatilho.type = 'button';
  gatilho.setAttribute('aria-expanded', 'false');
  gatilho.setAttribute('aria-controls', 'a11y-painel');
  gatilho.setAttribute('aria-label', 'Acessibilidade');
  gatilho.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><circle cx="12" cy="4.5" r="2"/><path d="M4 8.5h16v2h-6v3.5l2.2 6.5h-2.2L12 15.5 10 21H7.8L10 14v-3.5H4z"/></svg>';

  var painel = document.createElement('div');
  painel.className = 'a11y-painel';
  painel.id = 'a11y-painel';
  painel.hidden = true;
  painel.setAttribute('role', 'dialog');
  painel.setAttribute('aria-labelledby', 'a11y-titulo');

  var botoes = opcoes.map(function (o) {
    return '<button type="button" data-op="' + o[0] + '" aria-pressed="false">' + o[1] + '</button>';
  }).join('');

  painel.innerHTML =
    '<h2 id="a11y-titulo">Acessibilidade</h2>' +
    '<p id="a11y-tam-rotulo">Tamanho do texto</p>' +
    '<div class="a11y-tam" role="group" aria-labelledby="a11y-tam-rotulo">' +
      '<button type="button" data-tam="-1" aria-label="Diminuir texto">A&minus;</button>' +
      '<span id="a11y-tam-valor" aria-live="polite">100%</span>' +
      '<button type="button" data-tam="1" aria-label="Aumentar texto">A+</button>' +
    '</div>' +
    '<div class="a11y-lista">' + botoes +
      (synth ? '<button type="button" data-op="ler" aria-pressed="false">Ouvir a página</button>' : '') +
      '<button type="button" data-op="libras" aria-pressed="false">Tradução em Libras (VLibras)</button>' +
    '</div>' +
    '<button type="button" class="a11y-reset" data-op="reset">Redefinir tudo</button>' +
    '<p class="a11y-nota">Ouvir a página lê o texto selecionado ou, sem seleção, todo o conteúdo.<br>Atalho para ligar ou desligar o Libras: Alt+Shift+L.</p>';

  // Contêiner na "camada superior" do navegador (Popover API): fica acima de qualquer
  // elemento da página, inclusive o VLibras. Sem suporte, é reposicionado no fim do body.
  var raiz = document.createElement('div');
  raiz.className = 'a11y-raiz';
  raiz.appendChild(gatilho);
  raiz.appendChild(painel);
  document.body.appendChild(raiz);
  if (typeof raiz.showPopover === 'function') {
    raiz.setAttribute('popover', 'manual');
    raiz.showPopover();
  }
  function trazParaFrente() {
    if (typeof raiz.showPopover !== 'function') document.body.appendChild(raiz);
  }

  // Aplica o estado à página
  function aplicar() {
    html.style.fontSize = estado.tamanho ? TAMANHOS[estado.tamanho] + '%' : '';
    opcoes.forEach(function (o) {
      html.classList.toggle(o[2], !!estado[o[0]]);
      painel.querySelector('[data-op="' + o[0] + '"]').setAttribute('aria-pressed', String(!!estado[o[0]]));
    });
    painel.querySelector('#a11y-tam-valor').textContent = TAMANHOS[estado.tamanho] + '%';
    painel.querySelector('[data-tam="-1"]').disabled = estado.tamanho === 0;
    painel.querySelector('[data-tam="1"]').disabled = estado.tamanho === TAMANHOS.length - 1;
    var bLibras = painel.querySelector('[data-op="libras"]');
    bLibras.setAttribute('aria-pressed', String(!!estado.libras));
    bLibras.textContent = estado.libras ? 'Desativar Libras (VLibras)' : 'Tradução em Libras (VLibras)';
    libras(!!estado.libras);
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { /* ignora */ }
  }

  // Leitura em voz alta (API de voz do navegador)
  function pararLeitura() {
    if (synth) synth.cancel();
    lendo = false;
    var b = painel.querySelector('[data-op="ler"]');
    if (b) { b.setAttribute('aria-pressed', 'false'); b.textContent = 'Ouvir a página'; }
  }

  function lerPagina() {
    if (lendo) { pararLeitura(); return; }
    var sel = String(window.getSelection()).trim();
    var textos = sel ? [sel] : Array.prototype.map.call(
      document.querySelectorAll('#conteudo h1, #conteudo h2, #conteudo h3, #conteudo p, #conteudo li, #conteudo summary'),
      function (el) { return el.textContent.replace(/\s+/g, ' ').trim(); }
    ).filter(Boolean);
    if (!textos.length) return;
    synth.cancel();
    textos.forEach(function (t, i) {
      var fala = new SpeechSynthesisUtterance(t);
      fala.lang = 'pt-BR';
      if (i === textos.length - 1) { fala.onend = pararLeitura; fala.onerror = pararLeitura; }
      synth.speak(fala);
    });
    lendo = true;
    var b = painel.querySelector('[data-op="ler"]');
    b.setAttribute('aria-pressed', 'true');
    b.textContent = 'Parar leitura';
  }

  // VLibras (plugin do governo federal), carregado só quando o usuário pede
  function libras(ativo) {
    var widget = document.querySelector('[vw]');
    if (!ativo) { if (widget) widget.classList.add('a11y-libras-off'); return; }
    if (widget) { widget.classList.remove('a11y-libras-off'); return; }
    widget = document.createElement('div');
    widget.setAttribute('vw', '');
    widget.className = 'enabled';
    widget.innerHTML = '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
    document.body.appendChild(widget);
    trazParaFrente();
    var s = document.createElement('script');
    s.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    s.onload = function () { new window.VLibras.Widget('https://vlibras.gov.br/app'); trazParaFrente(); };
    document.head.appendChild(s);
  }

  // Abrir e fechar
  function alternar(abrir) {
    painel.hidden = !abrir;
    gatilho.setAttribute('aria-expanded', String(abrir));
    if (abrir) painel.querySelector('button:not([disabled])').focus();
  }

  function alternarLibras() {
    estado.libras = !estado.libras;
    if (!estado.libras && document.querySelector('[vw]')) {
      try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { /* ignora */ }
      location.reload(); // recarregar remove todos os ganchos do plugin
      return;
    }
    aplicar();
  }

  function cliqueGatilho() { alternar(painel.hidden); }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !painel.hidden) { alternar(false); gatilho.focus(); }
  });

  document.addEventListener('click', function (e) {
    if (!painel.hidden && !painel.contains(e.target) && !gatilho.contains(e.target)) alternar(false);
  });

  // Ações dos botões
  function acaoPainel(e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.tam) {
      estado.tamanho = Math.min(TAMANHOS.length - 1, Math.max(0, estado.tamanho + Number(b.dataset.tam)));
    } else if (b.dataset.op === 'ler') {
      lerPagina();
      return;
    } else if (b.dataset.op === 'libras') {
      alternarLibras();
      return;
    } else if (b.dataset.op === 'reset') {
      pararLeitura();
      estado = Object.assign({}, padrao);
    } else if (b.dataset.op) {
      estado[b.dataset.op] = !estado[b.dataset.op];
    }
    aplicar();
  }

  // O VLibras captura os cliques da página para traduzir o texto. Aqui o painel trata
  // os próprios cliques antes dele (fase de captura na window) e impede que cheguem ao plugin.
  ['pointerdown', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click'].forEach(function (nome) {
    window.addEventListener(nome, function (e) {
      var alvo = e.target;
      if (!alvo || !alvo.closest || !alvo.closest('.a11y-gatilho, .a11y-painel')) return;
      e.stopImmediatePropagation();
      if (nome !== 'click') return;
      if (gatilho.contains(alvo)) cliqueGatilho(); else acaoPainel(e);
    }, true);
  });

  // Atalho de teclado (não depende de cliques): Alt+Shift+L liga ou desliga o Libras
  window.addEventListener('keydown', function (e) {
    if (e.altKey && e.shiftKey && e.code === 'KeyL') { e.preventDefault(); alternarLibras(); }
  }, true);

  window.addEventListener('pagehide', pararLeitura);
  aplicar();
})();
