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