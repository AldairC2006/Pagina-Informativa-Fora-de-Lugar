// Fallback para verificar imágenes faltantes
document.querySelectorAll('.arte img, .foto-zoom img').forEach(function(img) {
  function marcar() { if (img.parentElement) img.parentElement.classList.add('missing'); }
  img.addEventListener('error', marcar);
  if (img.complete && img.naturalWidth === 0) marcar();
});

// Control del Menú Lateral en Móviles
var lado = document.getElementById('lado'), btnMenu = document.querySelector('.boton-menu');
if (btnMenu && lado) {
  btnMenu.addEventListener('click', function() {
    var abierto = lado.classList.toggle('abierto');
    btnMenu.setAttribute('aria-expanded', abierto);
  });
  lado.addEventListener('click', function(e) {
    if (e.target.tagName === 'A') {
      lado.classList.remove('abierto');
      btnMenu.setAttribute('aria-expanded', 'false');
    }
  });
}

// Resaltado dinámico del Menú con IntersectionObserver amplio para respuesta en scroll rápido
var enlacesNav = {};
document.querySelectorAll('.lado nav a').forEach(function(a) {
  var href = a.getAttribute('href');
  if (href && href.startsWith('#')) {
    enlacesNav[href.slice(1)] = a;
  }
});

var observerNav = new IntersectionObserver(function(entradas) {
  entradas.forEach(function(en) {
    if (en.isIntersecting) {
      Object.values(enlacesNav).forEach(function(a) { a.classList.remove('activo'); });
      if (enlacesNav[en.target.id]) enlacesNav[en.target.id].classList.add('activo');
    }
  });
}, { rootMargin: '-10% 0px -60% 0px', threshold: 0.1 });

document.querySelectorAll('section, h3[id], div[id]').forEach(function(s) { observerNav.observe(s); });

/* =====================================================================
   SINTETIZADOR DE SONIDO RETRO 8-BIT (WEB AUDIO API)
   ===================================================================== */
(function() {
  'use strict';
  var audioCtx = null;
  var sonidoActivo = false;
  var btnAudio = document.getElementById('btn-audio');

  function initAudio() {
    if (!audioCtx) {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
  }

  function playTone(freq, type, duration, vol) {
    if (!sonidoActivo || !audioCtx) return;
    try {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol || 0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  if (btnAudio) {
    btnAudio.addEventListener('click', function() {
      initAudio();
      sonidoActivo = !sonidoActivo;
      btnAudio.classList.toggle('activo', sonidoActivo);
      var lbl = btnAudio.querySelector('.audio-lbl');
      if (lbl) lbl.textContent = sonidoActivo ? 'SONIDO: ON' : 'SONIDO: OFF';
      if (sonidoActivo) playTone(523.25, 'square', 0.15, 0.08); // Nota Do (C5)
    });
  }

  // Sonidos sfx en clics de interfaz
  document.addEventListener('click', function(e) {
    if (!sonidoActivo) return;
    if (e.target.closest('a, button, .chip-acto, .tab-mj, .foto-zoom')) {
      playTone(440, 'triangle', 0.08, 0.04);
    }
  });
})();

/* =====================================================================
   CONTROLADOR DE LA SECCIÓN DE ESCENAS (DESPLAZAMIENTO RÁPIDO & STICKY CHIPS)
   ===================================================================== */
(function() {
  'use strict';
  var chips = document.querySelectorAll('.chip-acto');
  var tarjetas = document.querySelectorAll('.tarjeta-escena');

  chips.forEach(function(chip) {
    chip.addEventListener('click', function() {
      var index = chip.getAttribute('data-acto');
      chips.forEach(function(c) { c.classList.remove('activo'); });
      chip.classList.add('activo');

      var tarjetaObj = document.getElementById('acto-' + (parseInt(index) + 1));
      if (tarjetaObj) {
        tarjetaObj.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Resaltar chip del acto visible mediante IntersectionObserver sin lag
  var obsEscenas = new IntersectionObserver(function(entradas) {
    entradas.forEach(function(en) {
      if (en.isIntersecting) {
        var idx = en.target.getAttribute('data-index');
        chips.forEach(function(c) {
          c.classList.toggle('activo', c.getAttribute('data-acto') === idx);
        });
      }
    });
  }, { rootMargin: '-20% 0px -50% 0px', threshold: 0.2 });

  tarjetas.forEach(function(t) { obsEscenas.observe(t); });
})();

/* =====================================================================
   PESTAÑAS INTERACTIVAS PARA PROCESO DE DESARROLLO (MINIJUEGOS)
   ===================================================================== */
(function() {
  'use strict';
  var tabs = document.querySelectorAll('.tab-mj');
  var paneles = document.querySelectorAll('.panel-minijuego');

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var targetId = tab.getAttribute('data-mj');

      tabs.forEach(function(t) {
        t.classList.remove('activo');
        t.setAttribute('aria-selected', 'false');
      });
      paneles.forEach(function(p) { p.classList.remove('activo'); });

      tab.classList.add('activo');
      tab.setAttribute('aria-selected', 'true');

      var targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('activo');
    });
  });
})();

/* =====================================================================
   ANIMACIÓN PEPE CAMINANDO EN SCROLL (OPTIMIZADO CON REQUESTANIMATIONFRAME)
   ===================================================================== */
(function() {
  'use strict';
  var camino = document.querySelector('.camino');
  if (!camino) return;
  var guia = camino.querySelector('.guia'), barra = camino.querySelector('.camino-avance');
  var ancho = 0, max = 1, x = -28, ultimoY = window.pageYOffset;
  var caminando = false, atras = false, reposo, ticking = false;

  function acotar(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function actualizarCamino() {
    var y = window.pageYOffset;
    max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    ancho = camino.clientWidth;

    if (y !== ultimoY) {
      var va = y < ultimoY;
      if (va !== atras) { atras = va; }
      if (!caminando) { camino.classList.add('camina'); caminando = true; }
      clearTimeout(reposo);
      reposo = setTimeout(function() { camino.classList.remove('camina'); caminando = false; }, 160);
      ultimoY = y;
    }

    var a = acotar(y / max, 0, 1);
    barra.style.transform = 'scaleX(' + a.toFixed(4) + ')';
    x = Math.round(15 + a * (ancho - 30) - 43);
    guia.style.transform = 'translate3d(' + x + 'px,0,0) scale(' + (atras ? -0.34 : 0.34) + ',0.34)';
    ticking = false;
  }

  function solicitarActualización() {
    if (!ticking) {
      requestAnimationFrame(actualizarCamino);
      ticking = true;
    }
  }

  window.addEventListener('scroll', solicitarActualización, { passive: true });
  window.addEventListener('resize', solicitarActualización, { passive: true });
  actualizarCamino();
})();

/* =====================================================================
   VISOR LIGHTBOX AMPLIADO DE IMÁGENES
   ===================================================================== */
(function() {
  'use strict';
  var lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  var lbImg = document.getElementById('lightbox-img');
  var lbCap = document.getElementById('lightbox-caption');
  var lbCnt = document.getElementById('lightbox-contador');
  var lbClose = lightbox.querySelector('.lightbox-cerrar');
  var lbOverlay = lightbox.querySelector('.lightbox-overlay');
  var lbPrev = lightbox.querySelector('.lightbox-prev');
  var lbNext = lightbox.querySelector('.lightbox-next');

  var imagenesColeccion = [];
  var indiceActual = 0;

  function recopilarImagenes() {
    imagenesColeccion = [];
    document.querySelectorAll('.foto-zoom, .galeria figure, .hero img, .retrato img').forEach(function(fig) {
      var img = fig.tagName === 'IMG' ? fig : fig.querySelector('img');
      var cap = fig.querySelector('figcaption');
      if (img) {
        imagenesColeccion.push({
          src: img.getAttribute('src'),
          alt: img.getAttribute('alt') || '',
          caption: cap ? cap.textContent : (img.getAttribute('alt') || '')
        });
      }
    });
  }

  function abrirLightbox(index) {
    recopilarImagenes();
    if (!imagenesColeccion.length) return;
    indiceActual = (index + imagenesColeccion.length) % imagenesColeccion.length;
    actualizarModal();
    lightbox.classList.add('activo');
    lightbox.setAttribute('aria-hidden', 'false');
  }

  function cerrarLightbox() {
    lightbox.classList.remove('activo');
    lightbox.setAttribute('aria-hidden', 'true');
  }

  function actualizarModal() {
    var item = imagenesColeccion[indiceActual];
    if (!item) return;
    lbImg.src = item.src;
    lbImg.alt = item.alt;
    lbCap.textContent = item.caption;
    lbCnt.textContent = (indiceActual + 1) + ' / ' + imagenesColeccion.length;
  }

  document.addEventListener('click', function(e) {
    var fig = e.target.closest('.foto-zoom, .galeria figure, .hero img, .retrato img');
    if (fig) {
      recopilarImagenes();
      var targetSrc = (fig.tagName === 'IMG' ? fig : fig.querySelector('img')).getAttribute('src');
      var idx = imagenesColeccion.findIndex(function(item) { return item.src === targetSrc; });
      if (idx !== -1) abrirLightbox(idx);
    }
  });

  if (lbClose) lbClose.addEventListener('click', cerrarLightbox);
  if (lbOverlay) lbOverlay.addEventListener('click', cerrarLightbox);
  if (lbPrev) lbPrev.addEventListener('click', function() { abrirLightbox(indiceActual - 1); });
  if (lbNext) lbNext.addEventListener('click', function() { abrirLightbox(indiceActual + 1); });

  document.addEventListener('keydown', function(e) {
    if (!lightbox.classList.contains('activo')) return;
    if (e.key === 'Escape') cerrarLightbox();
    if (e.key === 'ArrowLeft') abrirLightbox(indiceActual - 1);
    if (e.key === 'ArrowRight') abrirLightbox(indiceActual + 1);
  });
})();