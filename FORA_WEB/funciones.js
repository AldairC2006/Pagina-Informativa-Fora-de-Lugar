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
   SCROLLYTELLING · controlador de scroll
   1) Camino de Pepe (progreso de lectura)
   2) Revelado de elementos al entrar en pantalla
   3) Escenario pegajoso que cambia de foto según el scroll
      (Escenas y Minijuegos: cualquier contenedor con data-scrolly)
   Si el usuario pide menos movimiento, no se activa nada.
   ===================================================================== */
(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var raiz = document.documentElement;
  raiz.classList.add('js-scrolly');

  var tareas = [];                       // funciones que se ejecutan en cada cuadro de scroll
  var apilado = window.matchMedia('(max-width:1100px)');

  /* ---------- 1) Camino de Pepe ---------- */
  var camino = document.querySelector('.camino');
  if (camino) {
    var ultimoY = window.pageYOffset, reposo;
    tareas.push(function(){
      var y = window.pageYOffset;
      var max = raiz.scrollHeight - window.innerHeight;
      raiz.style.setProperty('--avance', (max > 0 ? Math.min(1, Math.max(0, y / max)) : 0).toFixed(4));
      if (y !== ultimoY) {
        camino.classList.add('camina');
        camino.classList.toggle('atras', y < ultimoY);
        ultimoY = y;
        clearTimeout(reposo);
        reposo = setTimeout(function(){ camino.classList.remove('camina'); }, 180);
      }
    });
  }

  /* ---------- 2) Revelado ---------- */
  var seleccion = 'main h2.t, main section > p, main section > h3, main .mecanicas div, main .tarjeta, ' +
                  'main .galeria figure, main .cita, main .pendiente, main .demo';
  var porGrupo = '.mecanicas div, .tarjeta, .galeria figure';   // tiles que entran escalonados y "a pasos"
  var vistos = new IntersectionObserver(function(entradas){
    entradas.forEach(function(en){
      if (en.isIntersecting) { en.target.classList.add('visible'); vistos.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  Array.prototype.forEach.call(document.querySelectorAll(seleccion), function(el){
    if (el.closest('[data-scrolly], .scrolly')) return;          // los pasos tienen su propio comportamiento
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return; // lo que ya se ve, se queda
    el.classList.add('revela');
    if (el.matches(porGrupo)) {
      el.classList.add('pixel');
      var i = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--i', i % 6);
    }
    vistos.observe(el);
  });

  /* ---------- 3) Escenario pegajoso ---------- */
  function crear(contenedor){
    var pasos = Array.prototype.slice.call(contenedor.children);
    if (!pasos.length) return;
    var etiqueta = contenedor.getAttribute('data-etiqueta') || 'Paso';

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
      '<div class="puntos"></div>';
    envoltura.appendChild(escenario);
    var num = escenario.querySelector('.escenario-num'),
        foto = escenario.querySelector('.escenario-foto'),
        tit = escenario.querySelector('.escenario-tit'),
        marco = escenario.querySelector('.marco-escena'),
        puntos = escenario.querySelector('.puntos');

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

      var propias = figuras.map(function(f){
        var c = f.cloneNode(true);
        c.classList.add('toma');
        c.setAttribute('aria-hidden', 'true');
        var im = c.querySelector('img');
        if (im) { im.removeAttribute('loading'); im.decoding = 'async'; }
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

    function linea(){
      var alto = window.innerHeight;
      if (apilado.matches) {
        var te = parseFloat(getComputedStyle(escenario).top) || 0;
        var base = te + escenario.offsetHeight;
        return base + (alto - base) * 0.3;
      }
      return alto * 0.45;
    }
    function irA(i){
      var r = zonas[i].getBoundingClientRect();
      window.scrollBy({ top: r.top - linea() + 2, behavior: 'smooth' });
    }

    var previo = { z: -1, t: -1 };
    function actualizar(){
      var l = linea(), z = 0, p = 0, i;
      for (i = 0; i < zonas.length; i++) {
        if (zonas[i].getBoundingClientRect().top <= l) z = i; else break;
      }
      var r = zonas[z].getBoundingClientRect();
      p = Math.min(0.999, Math.max(0, (l - r.top) / r.height));
      var n = tomas[z].length || 1;
      var t = Math.min(n - 1, Math.floor(p * n));
      if (z === previo.z && t === previo.t) return;

      if (z !== previo.z) {
        zonas.forEach(function(el, k){
          el.classList.toggle('activa', k === z);
          botones[k].classList.toggle('activo', k === z);
          botones[k].classList.toggle('hecho', k < z);
          if (k === z) botones[k].setAttribute('aria-current', 'step'); else botones[k].removeAttribute('aria-current');
        });
        num.textContent = etiqueta.toUpperCase() + ' ' + (z + 1) + '/' + zonas.length;
        tit.textContent = titulos[z];
        envoltura.style.setProperty('--alto-esc', escenario.offsetHeight + 'px');
      }
      tomas.forEach(function(grupo, k){
        grupo.forEach(function(f, m){
          var on = (k === z && m === t);
          f.classList.toggle('activa', on);
          f.setAttribute('aria-hidden', on ? 'false' : 'true');
        });
      });
      foto.textContent = n > 1 ? 'FOTO ' + (t + 1) + '/' + n : '';
      previo.z = z; previo.t = t;
    }
    tareas.push(actualizar);
    window.addEventListener('resize', function(){
      envoltura.style.setProperty('--alto-esc', escenario.offsetHeight + 'px');
      previo.z = -1;
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-scrolly]'), crear);

  /* ---------- un solo ciclo por cuadro ---------- */
  var pendiente = false;
  function ciclo(){ pendiente = false; tareas.forEach(function(f){ f(); }); }
  function pedir(){ if (!pendiente) { pendiente = true; requestAnimationFrame(ciclo); } }
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir);
  window.addEventListener('load', pedir);
  ciclo();
})();