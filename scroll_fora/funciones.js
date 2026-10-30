// Arte que aún no existe: muestra el nombre del archivo esperado
document.querySelectorAll('.arte img').forEach(function(img){
  function marcar(){ img.parentElement.classList.add('missing'); }
  img.addEventListener('error', marcar);
  if (img.complete && img.naturalWidth === 0) marcar();
});
// Menú en celular
var lado = document.getElementById('lado'), btn = document.querySelector('.boton-menu');
btn.addEventListener('click', function(){
  var abierto = lado.classList.toggle('abierto');
  btn.setAttribute('aria-expanded', abierto);
});
lado.addEventListener('click', function(e){ if (e.target.tagName === 'A') { lado.classList.remove('abierto'); btn.setAttribute('aria-expanded', false); } });
// Resalta la sección visible en el menú
var enlaces = {};
document.querySelectorAll('.lado nav a').forEach(function(a){ enlaces[a.getAttribute('href').slice(1)] = a; });
var obs = new IntersectionObserver(function(entradas){
  entradas.forEach(function(en){
    if (en.isIntersecting) {
      Object.values(enlaces).forEach(function(a){ a.classList.remove('activo'); });
      if (enlaces[en.target.id]) enlaces[en.target.id].classList.add('activo');
    }
  });
}, { rootMargin: '-20% 0px -70% 0px' });
document.querySelectorAll('section, h3[id]').forEach(function(s){ obs.observe(s); });

/* =====================================================================
   SCROLLYTELLING v2 · controlador de scroll
   Pensado para no trabarse:
   - la geometría se mide una vez (carga / resize) y se guarda; en cada
     cuadro de scroll solo se hace aritmética, sin leer el layout
   - lo que se mueve usa solo transform y opacity (compositor)
   - nada se escribe en :root, así no se recalcula el estilo de toda la página
   - las imágenes del escenario se cargan solo cuando la escena está cerca
   Si el visitante pide menos movimiento, no se activa nada y la página
   queda como el original.
   ===================================================================== */
(function(){
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var raiz = document.documentElement;
  raiz.classList.add('js-scrolly');

  var apilado = window.matchMedia('(max-width:1100px)');
  var modulos = [];                       // cada módulo: { medir(), actualizar(y) }
  function acotar(v, a, b){ return v < a ? a : (v > b ? b : v); }

  /* ---------- 1) Camino de Pepe: progreso de lectura ---------- */
  (function(){
    var camino = document.querySelector('.camino');
    if (!camino) return;
    var guia = camino.querySelector('.guia'), barra = camino.querySelector('.camino-avance');
    var ancho = 0, max = 1, x = -28, avance = -1, ultimoY = window.pageYOffset;
    var caminando = false, atras = false, reposo;

    function poner(){
      guia.style.transform = 'translate3d(' + x + 'px,0,0) scale(' + (atras ? -0.34 : 0.34) + ',0.34)';
    }
    modulos.push({
      medir: function(){
        ancho = camino.clientWidth;
        max = Math.max(1, raiz.scrollHeight - window.innerHeight);
        avance = -1;
      },
      actualizar: function(y){
        var cambioDir = false;
        if (y !== ultimoY) {
          var va = y < ultimoY;
          if (va !== atras) { atras = va; cambioDir = true; }
          if (!caminando) { camino.classList.add('camina'); caminando = true; }
          clearTimeout(reposo);
          reposo = setTimeout(function(){ camino.classList.remove('camina'); caminando = false; }, 160);
          ultimoY = y;
        }
        var a = acotar(y / max, 0, 1);
        if (a === avance && !cambioDir) return;
        if (a !== avance) {
          avance = a;
          barra.style.transform = 'scaleX(' + a.toFixed(4) + ')';
          x = Math.round(15 + a * (ancho - 30) - 43);
        }
        poner();
      }
    });
  })();

  /* Pepe de la portada: solo camina mientras se ve */
  (function(){
    var p = document.querySelector('.hero .pepe');
    if (!p || !window.IntersectionObserver) return;
    new IntersectionObserver(function(es){
      p.classList.toggle('pausa', !es[0].isIntersecting);
    }).observe(p);
  })();

  /* ---------- 2) Revelado al entrar en pantalla ---------- */
  (function(){
    var seleccion = 'main h2.t, main section > p, main section > h3, main .mecanicas div, main .tarjeta, ' +
                    'main .galeria figure, main .cita, main .pendiente, main .demo';
    var enGrupo = '.mecanicas div, .tarjeta, .galeria figure';   // entran escalonados y "a pasos"
    var vistos = new IntersectionObserver(function(entradas){
      entradas.forEach(function(en){
        if (en.isIntersecting) { en.target.classList.add('visible'); vistos.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    var lista = document.querySelectorAll(seleccion), alto = window.innerHeight * 0.9, i, el;
    for (i = 0; i < lista.length; i++) {
      el = lista[i];
      if (el.closest('[data-scrolly], .scrolly')) continue;        // los pasos tienen su propio comportamiento
      if (el.getBoundingClientRect().top < alto) continue;          // lo que ya se ve, se queda
      el.classList.add('revela');
      if (el.matches(enGrupo)) {
        el.classList.add('pixel');
        el.style.setProperty('--i', Array.prototype.indexOf.call(el.parentNode.children, el) % 6);
      }
      vistos.observe(el);
    }
  })();

  /* ---------- 3) Escenario pegajoso (Escenas y Minijuegos) ---------- */
  var STATS = [
    ['energia',    'Energía'],
    ['estres',     'Estrés'],
    ['felicidad',  'Felicidad'],
    ['dinero',     'Dinero'],
    ['relaciones', 'Relaciones']
  ];

  function crear(contenedor){
    var pasos = Array.prototype.slice.call(contenedor.children);
    if (!pasos.length) return;
    var etiqueta = contenedor.getAttribute('data-etiqueta') || 'Paso';
    var conHud = pasos[0].hasAttribute('data-energia');

    var envoltura = document.createElement('div');
    envoltura.className = 'scrolly';
    contenedor.parentNode.insertBefore(envoltura, contenedor);
    envoltura.appendChild(contenedor);
    contenedor.classList.add('pasos');

    var escenario = document.createElement('div');
    escenario.className = 'escenario';
    escenario.innerHTML =
      '<div class="escenario-cab"><span class="escenario-num"></span><span class="escenario-foto"></span><span class="escenario-tit"></span></div>' +
      '<div class="marco-escena"></div>' +
      (conHud ? '<div class="hud" role="group" aria-label="Estado de Pepe (ilustrativo)"><span class="hud-tit">ESTADO DE PEPE</span></div>' : '') +
      '<div class="puntos"></div>';
    envoltura.appendChild(escenario);
    var num = escenario.querySelector('.escenario-num'),
        foto = escenario.querySelector('.escenario-foto'),
        tit = escenario.querySelector('.escenario-tit'),
        marco = escenario.querySelector('.marco-escena'),
        puntos = escenario.querySelector('.puntos'),
        hud = escenario.querySelector('.hud');

    var stats = [];
    if (hud) {
      STATS.forEach(function(s){
        var d = document.createElement('div');
        d.className = 'stat'; d.setAttribute('data-k', s[0]); d.setAttribute('role', 'img');
        d.innerHTML = '<span class="stat-n">' + s[1] + '</span><span class="barra"><i></i></span>';
        hud.appendChild(d); stats.push(d);
      });
      var nota = document.createElement('p');
      nota.className = 'hud-nota';
      nota.textContent = 'Lectura de la historia, no son cifras del juego.';
      hud.appendChild(nota);
    }

    var zonas = [], tomas = [], botones = [], titulos = [];
    pasos.forEach(function(paso, i){
      var figuras = Array.prototype.slice.call(paso.querySelectorAll('figure'));
      var h = paso.querySelector('h3');
      var titulo = paso.getAttribute('data-titulo') || (h ? h.textContent : etiqueta + ' ' + (i + 1));

      // el contenido original pasa a una tarjeta que se queda pegada mientras cambian las fotos
      var carta = document.createElement('div');
      carta.className = 'carta';
      while (paso.firstChild) carta.appendChild(paso.firstChild);
      paso.appendChild(carta);
      paso.classList.add('zona');
      paso.style.setProperty('--n', Math.max(1, figuras.length));

      // la cita se "escribe" como el diálogo de un juego (el texto real queda para lectores de pantalla)
      var cita = carta.querySelector('.cita');
      if (cita) {
        var texto = cita.textContent, tipo = document.createElement('span'), sr = document.createElement('span'), k;
        sr.className = 'sr'; sr.textContent = texto;
        tipo.setAttribute('aria-hidden', 'true');
        for (k = 0; k < texto.length; k++) {
          if (texto.charAt(k) === ' ') { tipo.appendChild(document.createTextNode(' ')); continue; }
          var c = document.createElement('span');
          c.className = 'c'; c.style.setProperty('--c', k); c.textContent = texto.charAt(k);
          tipo.appendChild(c);
        }
        cita.textContent = '';
        cita.appendChild(sr); cita.appendChild(tipo);
      }

      var propias = figuras.map(function(f){
        // Se arma desde cero (sin cloneNode): clonar un <img> con src lo descarga al instante.
        // La imagen recibe su src solo cuando la escena está cerca (ver cargarCerca).
        var c = document.createElement('figure');
        c.className = 'toma';
        c.setAttribute('aria-hidden', 'true');
        var origen = f.querySelector('img'), pie = f.querySelector('figcaption');
        if (origen) {
          var lienzo = document.createElement('div'), im = document.createElement('img');
          lienzo.className = 'lienzo';
          im.alt = origen.getAttribute('alt') || '';
          if (origen.getAttribute('width')) { im.setAttribute('width', origen.getAttribute('width')); im.setAttribute('height', origen.getAttribute('height')); }
          im.decoding = 'async';
          im.setAttribute('data-src', origen.getAttribute('src'));
          lienzo.appendChild(im); c.appendChild(lienzo);
        }
        if (pie) c.appendChild(pie.cloneNode(true));
        marco.appendChild(c);
        return c;
      });

      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'punto';
      b.setAttribute('aria-label', 'Ir a ' + etiqueta.toLowerCase() + ' ' + (i + 1) + ': ' + titulo);
      b.addEventListener('click', function(){ irA(i); });
      puntos.appendChild(b);

      zonas.push(paso); tomas.push(propias); botones.push(b); titulos.push(titulo);
    });

    /* geometría en caché */
    var tops = [], altos = [], linea = 0;
    var previo = { z: -1, t: -1 }, zoomPrevio = -1;

    function medir(){
      var sy = window.pageYOffset, i, r;
      for (i = 0; i < zonas.length; i++) {
        r = zonas[i].getBoundingClientRect();
        tops[i] = r.top + sy; altos[i] = r.height;
      }
      var altoEsc = escenario.offsetHeight;
      if (apilado.matches) {
        var te = parseFloat(getComputedStyle(escenario).top) || 0, base = te + altoEsc;
        linea = base + (window.innerHeight - base) * 0.3;
      } else {
        linea = window.innerHeight * 0.45;
      }
      envoltura.style.setProperty('--alto-esc', altoEsc + 'px');
      previo.z = -1; zoomPrevio = -1;
    }

    function irA(i){
      window.scrollTo({ top: tops[i] - linea + 2, behavior: 'smooth' });
    }

    /* carga las fotos de la escena actual y las siguientes */
    function cargarCerca(z){
      for (var k = Math.max(0, z - 1); k <= Math.min(zonas.length - 1, z + 2); k++) {
        tomas[k].forEach(function(f){
          var im = f.querySelector('img');
          if (im && im.hasAttribute('data-src')) { im.src = im.getAttribute('data-src'); im.removeAttribute('data-src'); }
        });
      }
    }
    /* este escenario solo trabaja (y carga fotos) cuando está cerca de la pantalla */
    var cerca = !window.IntersectionObserver;
    if (window.IntersectionObserver) {
      new IntersectionObserver(function(es){
        cerca = es[es.length - 1].isIntersecting;
        if (cerca) pedir();
      }, { rootMargin: '1400px 0px' }).observe(envoltura);
    }

    modulos.push({
      medir: medir,
      actualizar: function(y){
        if (!cerca || !tops.length) return;
        var L = y + linea, z = 0, i;
        for (i = 0; i < tops.length; i++) { if (tops[i] <= L) z = i; else break; }
        var p = acotar((L - tops[z]) / altos[z], 0, 0.999);
        var n = tomas[z].length || 1;
        var t = Math.min(n - 1, Math.floor(p * n));

        if (z !== previo.z || t !== previo.t) {
          if (z !== previo.z) {
            zonas.forEach(function(el, k){
              el.classList.toggle('activa', k === z);
              if (k < z) el.classList.add('leida');        // lo ya pasado queda escrito
              botones[k].classList.toggle('activo', k === z);
              botones[k].classList.toggle('hecho', k < z);
              if (k === z) botones[k].setAttribute('aria-current', 'step'); else botones[k].removeAttribute('aria-current');
            });
            num.textContent = etiqueta.toUpperCase() + ' ' + (z + 1) + '/' + zonas.length;
            tit.textContent = titulos[z];
            cargarCerca(z);
            if (stats.length) {
              stats.forEach(function(d){
                var v = parseFloat(zonas[z].getAttribute('data-' + d.getAttribute('data-k'))) || 0;
                d.style.setProperty('--v', v);
                d.setAttribute('aria-label', d.firstChild.textContent + ': ' + v + ' de 10');
              });
            }
          }
          tomas.forEach(function(grupo, k){
            grupo.forEach(function(f, m){
              var on = (k === z && m === t);
              f.classList.toggle('activa', on);
              f.setAttribute('aria-hidden', on ? 'false' : 'true');
            });
          });
          foto.textContent = n > 1 ? 'FOTO ' + (t + 1) + '/' + n : '';
          previo.z = z; previo.t = t; zoomPrevio = -1;
        }

        /* zoom lento de la foto activa, ligado al scroll (solo transform) */
        var s = p * n - t, zoom = 1 + 0.05 * acotar(s, 0, 1);
        if (Math.abs(zoom - zoomPrevio) > 0.0015) {
          var im = tomas[z][t] && tomas[z][t].querySelector('img');
          if (im) im.style.transform = 'scale(' + zoom.toFixed(4) + ')';
          zoomPrevio = zoom;
        }
      }
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-scrolly]'), crear);

  /* ---------- un solo ciclo por cuadro ---------- */
  var pendiente = false, midiendo = false;
  function ciclo(){
    pendiente = false;
    var y = window.pageYOffset;
    for (var i = 0; i < modulos.length; i++) modulos[i].actualizar(y);
  }
  function pedir(){ if (!pendiente) { pendiente = true; requestAnimationFrame(ciclo); } }
  function pedirMedida(){
    if (midiendo) return;
    midiendo = true;
    requestAnimationFrame(function(){
      midiendo = false;
      for (var i = 0; i < modulos.length; i++) modulos[i].medir();
      ciclo();
    });
  }
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedirMedida);
  window.addEventListener('load', pedirMedida);
  if (window.ResizeObserver) new ResizeObserver(pedirMedida).observe(document.body);   // por si cambia la altura (fuentes, imágenes)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(pedirMedida);
  pedirMedida();
})();
