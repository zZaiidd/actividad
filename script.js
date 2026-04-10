/**
 * prototipo-delivery/script.js
 * Restaurantes → platos → resumen → confirmación. Sin módulos ES6.
 */

(function () {
  'use strict';

  var RESTAURANTES = [
    { id: 'r1', nombre: 'Pizzería Napoli', categoria: 'pizza', img: './assets/rest-r1.svg', rating: 4.7, timeDelivery: 25, avgPrice: 9.70 },
    { id: 'r2', nombre: 'Sushi Roll', categoria: 'asiatica', img: './assets/rest-r2.svg', rating: 4.5, timeDelivery: 35, avgPrice: 11.75 },
    { id: 'r3', nombre: 'Burger Norte', categoria: 'hamburguesas', img: './assets/rest-r3.svg', rating: 4.8, timeDelivery: 20, avgPrice: 10.75 },
    { id: 'r4', nombre: 'Mamma Mia Express', categoria: 'pizza', img: './assets/rest-r4.svg', rating: 4.6, timeDelivery: 30, avgPrice: 10.25 }
  ];

  /** Platos por restaurante (cada uno con imagen en ./assets/) */
  var MENU = {
    r1: [
      { id: 'm1', nombre: 'Margarita', precio: 8.5, img: './assets/dish-m1.svg' },
      { id: 'm2', nombre: 'Cuatro quesos', precio: 10.9, img: './assets/dish-m2.svg' }
    ],
    r2: [
      { id: 'm3', nombre: 'Menú maki (12 pzs)', precio: 14.0, img: './assets/dish-m3.svg' },
      { id: 'm4', nombre: 'Yakisoba', precio: 9.5, img: './assets/dish-m4.svg' }
    ],
    r3: [
      { id: 'm5', nombre: 'Clásica + patatas', precio: 11.0, img: './assets/dish-m5.svg' },
      { id: 'm6', nombre: 'Veggie', precio: 10.5, img: './assets/dish-m6.svg' }
    ],
    r4: [
      { id: 'm7', nombre: 'Calzone', precio: 9.0, img: './assets/dish-m7.svg' },
      { id: 'm8', nombre: 'Prosciutto', precio: 11.5, img: './assets/dish-m8.svg' }
    ]
  };

  var restauranteActual = null;
  /** pedido: { idPlato, nombre, precioUnit, cantidad } */
  var pedido = [];

  var elFiltro = document.getElementById('filtro-cat');
  var elListaRest = document.getElementById('lista-restaurantes');
  var elStepRest = document.getElementById('step-restaurante');
  var elStepProd = document.getElementById('step-productos');
  var elStepRes = document.getElementById('step-resumen');
  var elStepConf = document.getElementById('step-confirmacion');
  var elTituloRest = document.getElementById('titulo-restaurante');
  var elListaPlatos = document.getElementById('lista-platos');
  var elListaResumen = document.getElementById('lista-resumen');
  var elResumenVacio = document.getElementById('resumen-vacio');
  var elTotal = document.getElementById('total-delivery');
  var elMsgConfirm = document.getElementById('msg-confirm');

  function mostrarSoloPanel(panel) {
    var panels = [elStepRest, elStepProd, elStepRes, elStepConf];
    for (var i = 0; i < panels.length; i++) {
      var p = panels[i];
      var on = p === panel;
      p.classList.toggle('active', on);
      p.hidden = !on;
    }
    document.body.classList.toggle('flow-confirm', panel === elStepConf);
    actualizarIndicadoresPasos(panel);
  }

  function actualizarIndicadoresPasos(panel) {
    var n = '0';
    if (panel === elStepRest) n = '1';
    if (panel === elStepProd) n = '2';
    if (panel === elStepRes) n = '3';
    if (panel === elStepConf) n = '3';

    var elStepsWrap = document.querySelector('.steps-wrap');
    if (elStepsWrap) elStepsWrap.setAttribute('data-progress', n);

    var currentNum = parseInt(n, 10);
    var indicadores = document.querySelectorAll('[data-step-indicator]');
    for (var i = 0; i < indicadores.length; i++) {
      var el = indicadores[i];
      var step = el.getAttribute('data-step-indicator');
      var sn = parseInt(step, 10);
      var isConfirm = panel === elStepConf;
      var isActive = isConfirm ? sn === 3 : sn === currentNum;
      var isDone = isConfirm ? sn < 3 : sn < currentNum;

      el.classList.toggle('active', isActive);
      el.classList.toggle('done', isDone);
      if (isActive) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
    }
  }

  function filtrarRestaurantes() {
    var cat = elFiltro.value;
    elListaRest.innerHTML = '';
    for (var i = 0; i < RESTAURANTES.length; i++) {
      var r = RESTAURANTES[i];
      if (cat !== 'todas' && r.categoria !== cat) continue;
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'card-rest';
      btn.setAttribute('data-rest', r.id);
      btn.innerHTML =
        '<span class="card-rest__media"><img src="' +
        r.img +
        '" width="72" height="72" alt="" loading="lazy"></span>' +
        '<span class="card-rest__body"><strong>' +
        escapeHtml(r.nombre) +
        '</strong><span class="tag">' +
        escapeHtml(r.categoria) +
        '</span>' +
        '<span class="card-rest__info-footer">' +
        '<span class="info-item"><span class="info-icon">⭐</span>' +
        r.rating +
        '</span>' +
        '<span class="info-item"><span class="info-icon">⏱</span>' +
        r.timeDelivery +
        ' min</span>' +
        '<span class="info-item"><span class="info-icon">€</span>~' +
        formatEuros(r.avgPrice).replace(' €', '') +
        '</span>' +
        '</span></span>';
      li.appendChild(btn);
      elListaRest.appendChild(li);
    }
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function abrirMenu(restId) {
    restauranteActual = restId;
    var r = null;
    for (var i = 0; i < RESTAURANTES.length; i++) {
      if (RESTAURANTES[i].id === restId) {
        r = RESTAURANTES[i];
        break;
      }
    }
    elTituloRest.textContent = r ? r.nombre : 'Menú';
    var platos = MENU[restId] || [];
    elListaPlatos.innerHTML = '';
    for (var j = 0; j < platos.length; j++) {
      var pl = platos[j];
      var li = document.createElement('li');
      li.className = 'plato-row';
      li.innerHTML =
        '<img class="plato-thumb" src="' +
        pl.img +
        '" width="52" height="52" alt="">' +
        '<div class="plato-info"><span class="plato-nombre">' +
        escapeHtml(pl.nombre) +
        '</span></div>' +
        '<span class="plato-precio">' +
        formatEuros(pl.precio) +
        '</span>' +
        '<span class="plato-add-col">' +
        '<span class="plato-cantidad" data-cant-plato="' +
        pl.id +
        '" hidden aria-live="polite">0</span>' +
        '<button type="button" class="btn-mini" data-add-plato="' +
        pl.id +
        '" data-nombre="' +
        escapeAttr(pl.nombre) +
        '" data-precio="' +
        pl.precio +
        '" data-img="' +
        escapeAttr(pl.img) +
        '">+</button>' +
        '</span>';
      elListaPlatos.appendChild(li);
    }
    sincronizarCantidadesMenuVisible();
    mostrarSoloPanel(elStepProd);
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;');
  }

  function lineaPedido(idPlato) {
    for (var i = 0; i < pedido.length; i++) {
      if (pedido[i].idPlato === idPlato) return pedido[i];
    }
    return null;
  }

  function agregarPlato(idPlato, nombre, precio, img) {
    var linea = lineaPedido(idPlato);
    if (linea) {
      linea.cantidad += 1;
    } else {
      pedido.push({
        idPlato: idPlato,
        nombre: nombre,
        precioUnit: precio,
        cantidad: 1,
        img: img
      });
    }
  }

  function quitarPlato(idPlato) {
    var linea = lineaPedido(idPlato);
    if (linea && linea.cantidad > 1) {
      linea.cantidad -= 1;
    } else if (linea) {
      eliminarPlato(idPlato);
    }
  }

  function eliminarPlato(idPlato) {
    for (var i = 0; i < pedido.length; i++) {
      if (pedido[i].idPlato === idPlato) {
        pedido.splice(i, 1);
        break;
      }
    }
  }

  function cantidadEnPedido(idPlato) {
    var linea = lineaPedido(idPlato);
    return linea ? linea.cantidad : 0;
  }

  function totalUnidadesEnPedido() {
    var u = 0;
    for (var i = 0; i < pedido.length; i++) {
      u += pedido[i].cantidad;
    }
    return u;
  }

  function actualizarBadgeCantidadPlato(idPlato) {
    var el = document.querySelector('[data-cant-plato="' + idPlato + '"]');
    if (!el) return;
    var n = cantidadEnPedido(idPlato);
    el.textContent = String(n);
    el.hidden = n === 0;
    el.setAttribute('aria-label', n + ' en el pedido');
  }

  function actualizarTextoBotonCarrito() {
    var sub = document.querySelector('.btn-cart-sub');
    if (!sub) return;
    var u = totalUnidadesEnPedido();
    if (u === 0) {
      sub.textContent = 'Revisa platos y total';
    } else if (u === 1) {
      sub.textContent = '1 artículo en el carrito';
    } else {
      sub.textContent = u + ' artículos en el carrito';
    }
  }

  function sincronizarCantidadesMenuVisible() {
    var badges = document.querySelectorAll('[data-cant-plato]');
    for (var i = 0; i < badges.length; i++) {
      var id = badges[i].getAttribute('data-cant-plato');
      if (id) actualizarBadgeCantidadPlato(id);
    }
    actualizarTextoBotonCarrito();
  }

  function totalPedido() {
    var t = 0;
    for (var i = 0; i < pedido.length; i++) {
      t += pedido[i].precioUnit * pedido[i].cantidad;
    }
    return t;
  }

  function formatEuros(n) {
    return Number(n).toFixed(2).replace('.', ',') + ' €';
  }

  function pintarResumen() {
    elListaResumen.innerHTML = '';
    if (pedido.length === 0) {
      elResumenVacio.hidden = false;
    } else {
      elResumenVacio.hidden = true;
    }
    for (var i = 0; i < pedido.length; i++) {
      var l = pedido[i];
      var li = document.createElement('li');
      li.className = 'resumen-line';
      li.setAttribute('data-linea-id', l.idPlato);
      li.innerHTML =
        '<img class="resumen-thumb" src="' +
        l.img +
        '" width="40" height="40" alt="">' +
        '<span class="resumen-nombre">' +
        escapeHtml(l.nombre) +
        '</span>' +
        '<span class="resumen-controles">' +
        '<button type="button" class="btn-resumen-ctrl btn-resumen-minus" data-accion="remove" data-plato="' +
        l.idPlato +
        '" aria-label="Quitar ' +
        escapeAttr(l.nombre) +
        '">−</button>' +
        '<span class="resumen-cantidad" aria-live="polite">' +
        l.cantidad +
        '</span>' +
        '<button type="button" class="btn-resumen-ctrl btn-resumen-plus" data-accion="add" data-plato="' +
        l.idPlato +
        '" aria-label="Agregar ' +
        escapeAttr(l.nombre) +
        '">+</button>' +
        '</span>' +
        '<span class="resumen-precio">' +
        formatEuros(l.precioUnit * l.cantidad) +
        '</span>' +
        '<button type="button" class="btn-resumen-delete" data-accion="delete" data-plato="' +
        l.idPlato +
        '" aria-label="Eliminar ' +
        escapeAttr(l.nombre) +
        '">×</button>';
      elListaResumen.appendChild(li);
    }
    elTotal.textContent = formatEuros(totalPedido());
  }

  elListaRest.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-rest]');
    if (!btn) return;
    abrirMenu(btn.getAttribute('data-rest'));
  });

  elFiltro.addEventListener('change', filtrarRestaurantes);

  document.getElementById('btn-inicio').addEventListener('click', function () {
    mostrarSoloPanel(elStepRest);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  elListaPlatos.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add-plato]');
    if (!b) return;
    var id = b.getAttribute('data-add-plato');
    var nombre = b.getAttribute('data-nombre');
    var precio = parseFloat(b.getAttribute('data-precio'), 10);
    var imgPlato = b.getAttribute('data-img') || '';
    agregarPlato(id, nombre, precio, imgPlato);
    actualizarBadgeCantidadPlato(id);
    actualizarTextoBotonCarrito();
  });

  document.getElementById('btn-volver-rest').addEventListener('click', function () {
    mostrarSoloPanel(elStepRest);
  });

  document.getElementById('btn-carrito').addEventListener('click', function () {
    pintarResumen();
    mostrarSoloPanel(elStepRes);
  });

  elListaResumen.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-accion]');
    if (!btn) return;
    var accion = btn.getAttribute('data-accion');
    var idPlato = btn.getAttribute('data-plato');
    if (accion === 'add') {
      agregarPlato(idPlato, '', 0, '');
    } else if (accion === 'remove') {
      quitarPlato(idPlato);
    } else if (accion === 'delete') {
      eliminarPlato(idPlato);
    }
    pintarResumen();
  });

  document.getElementById('btn-seguir-comprando').addEventListener('click', function () {
    if (restauranteActual) abrirMenu(restauranteActual);
    else mostrarSoloPanel(elStepRest);
  });

  document.getElementById('btn-comprar').addEventListener('click', function () {
    if (pedido.length === 0) {
      alert('Añade al menos un plato al pedido antes de confirmar.');
      return;
    }
    var nombreRest = '';
    for (var i = 0; i < RESTAURANTES.length; i++) {
      if (RESTAURANTES[i].id === restauranteActual) {
        nombreRest = RESTAURANTES[i].nombre;
        break;
      }
    }
    elMsgConfirm.textContent =
      'Su pedido en ' +
      nombreRest +
      ' por ' +
      formatEuros(totalPedido()) +
      ' está en preparación. Tiempo aproximado: 35 minutos.';
    pedido = [];
    pintarResumen();
    actualizarTextoBotonCarrito();
    mostrarSoloPanel(elStepConf);
  });

  document.getElementById('btn-nuevo').addEventListener('click', function () {
    restauranteActual = null;
    mostrarSoloPanel(elStepRest);
  });

  filtrarRestaurantes();
})();
