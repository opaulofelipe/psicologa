(function () {
  'use strict';

  var topo = document.getElementById('topo');
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('menu');
  var links = menu.querySelectorAll('a[href^="#"]:not(.btn)');

  // Menu mobile
  function alternarMenu(abrir) {
    menu.classList.toggle('aberto', abrir);
    btn.setAttribute('aria-expanded', String(abrir));
    btn.setAttribute('aria-label', abrir ? 'Fechar menu' : 'Abrir menu');
  }

  btn.addEventListener('click', function () {
    alternarMenu(btn.getAttribute('aria-expanded') !== 'true');
  });

  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) alternarMenu(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('aberto')) {
      alternarMenu(false);
      btn.focus();
    }
  });

  // Sombra no topo ao rolar
  function aoRolar() {
    topo.classList.toggle('rolou', window.scrollY > 8);
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  // Destaca no menu a seção visível
  if ('IntersectionObserver' in window) {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.toggle('ativo', link.getAttribute('href') === '#' + entrada.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    links.forEach(function (link) {
      var alvo = document.querySelector(link.getAttribute('href'));
      if (alvo) observador.observe(alvo);
    });
  }

  // Ano atual no rodapé
  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();
})();
