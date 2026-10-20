// US#4: sincroniza la página del carrito en tiempo real. Escucha el evento
// "cartUpdated" que emite el servidor (los mensajes llegan por el despachador
// de wsClient.js) y vuelve a dibujar la lista, los subtotales y el total.
// En cualquier otra página no hace nada: no existe #cart-contenido.
(function () {
  const contenedor = document.getElementById('cart-contenido');
  const eventos = window.zeusEvents;
  if (!contenedor || !eventos) return;

  const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  // Escapa texto antes de meterlo en HTML, así un nombre de producto con
  // "<" o comillas no puede romper la página (ni inyectar código).
  function escapar(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
  }

  // Mismo formato de número que usa cart.ejs en el servidor.
  function formato(numero) {
    return Number(numero).toLocaleString('es-AR');
  }

  // Una fila del carrito. TIENE QUE parecerse a la de cart.ejs: si cambiás
  // el HTML de un <li> allá, cambialo también acá.
  function htmlItem(item) {
    const id = Number(item.id);
    const nombre = escapar(item.nombre);
    const imagen = item.imagen && item.imagen.trim() ? item.imagen : '/assets/img/placeholder-producto.png';
    return `
      <li class="cart-item">
        <div class="cart-item__product">
          <img
            class="cart-item__image"
            src="${escapar(imagen)}"
            alt="${nombre}"
            onerror="this.onerror=null; this.src='/assets/img/placeholder-producto.png';"
          />
          <span>${nombre}</span>
        </div>
        <div class="cart-item__controls">
          <form action="/cart/remove/${id}" method="POST">
            <button type="submit" class="cart-item__remove">Quitar</button>
          </form>
          <div class="cart-item__qty" role="group" aria-label="Cantidad de ${nombre}">
            <form action="/cart/decrease/${id}" method="POST">
              <button type="submit" aria-label="Quitar una unidad de ${nombre}">&minus;</button>
            </form>
            <span>${Number(item.cantidad)}</span>
            <form action="/cart/increase/${id}" method="POST">
              <button type="submit" aria-label="Agregar una unidad de ${nombre}" ${item.cantidad >= item.stock ? 'disabled' : ''}>&plus;</button>
            </form>
          </div>
          <span class="cart-item__price">${formato(item.subtotal)} pts</span>
        </div>
      </li>`;
  }

  // Reemplaza TODO el contenido del carrito con los datos nuevos.
  // conservarAviso: true cuando el resumen llega porque ESTA pestaña recién
  // se conectó (no porque el carrito cambió): el aviso de "sin stock" que
  // trae la página sigue siendo válido y no hay que sacarlo.
  function renderCarrito({ products, total }, conservarAviso) {
    if (!conservarAviso) {
      // El aviso viejo de "sin stock" ya no corresponde a lo que se ve.
      const aviso = document.querySelector('.cart-mensaje');
      if (aviso) aviso.remove();
    }

    if (products.length === 0) {
      contenedor.innerHTML = `
        <div class="cart-empty">
          <p>Tu carrito está vacío.</p>
          <a href="/" class="btn btn--primary">Volver al inicio</a>
        </div>`;
      return;
    }

    contenedor.innerHTML = `
      <ul class="cart-card">${products.map(htmlItem).join('')}</ul>
      <div class="cart-summary">
        <form action="/cart/clear" method="POST">
          <button type="submit" class="btn btn--secondary">Vaciar carrito</button>
        </form>
        <div class="cart-summary__total">
          <span>Total de Puntos</span>
          <strong>${formato(total)}</strong>
        </div>
        <a href="/checkout" class="btn btn--primary">Ir a Pagar</a>
      </div>`;
  }

  // payload.source vale 'connection' cuando el estado llega porque esta
  // pestaña recién se conectó (ver conservarAviso arriba).
  eventos.on('cartUpdated', (payload) => {
    renderCarrito(payload, payload.source === 'connection');
  });
})();
