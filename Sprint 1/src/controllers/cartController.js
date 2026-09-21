const cartService = require('../services/cartService');
const normalizeId = require('../utils/normalizeId');

// Muestra el carrito combinando la sesión con los datos reales del
// producto, y calcula el total (Escenario 2 y Escenario 5).
function showCart(req, res) {
  const resumen = cartService.getSummary(req.session);
  res.render('layouts/main', { page: 'cart', titulo: 'ZEUS - Carrito', ...resumen });
}

// Agrega un producto al carrito (Escenario 1). Si no hay stock suficiente,
// no lo agrega y se lo avisa a la persona usuaria en la misma vista.
function addItem(req, res) {
  // US#17: si el id de la URL no es un número válido (alguien lo tocó a
  // mano, o un link roto), cortamos acá con 400 antes de llegar al
  // servicio, en vez de dejar que se use un id raro silenciosamente.
  const id = normalizeId(req.params.id);
  if (id === null) {
    return res.status(400).render('layouts/main', {
      page: 'notFound',
      titulo: 'ZEUS - Solicitud inválida',
      mensaje: 'El id del producto no es válido.',
    });
  }

  const resultado = cartService.addItem(req.session, id);

  if (!resultado.ok) {
    const resumen = cartService.getSummary(req.session);
    return res.render('layouts/main', { page: 'cart', titulo: 'ZEUS - Carrito', ...resumen, mensaje: cartService.mensajeDeError(resultado.motivo) });
  }

  res.redirect('/cart');
}

// Aumenta en 1 la cantidad de un producto (Escenario 3), sin superar el
// stock disponible.
function increase(req, res) {
  const id = normalizeId(req.params.id);
  if (id === null) {
    return res.status(400).render('layouts/main', {
      page: 'notFound',
      titulo: 'ZEUS - Solicitud inválida',
      mensaje: 'El id del producto no es válido.',
    });
  }

  const resultado = cartService.updateQuantity(req.session, id, 1);

  if (!resultado.ok) {
    const resumen = cartService.getSummary(req.session);
    return res.render('layouts/main', { page: 'cart', titulo: 'ZEUS - Carrito', ...resumen, mensaje: cartService.mensajeDeError(resultado.motivo) });
  }

  res.redirect('/cart');
}

// Disminuye en 1 la cantidad; si llega a 0, el servicio ya lo elimina solo
// (Escenario 3).
function decrease(req, res) {
  const id = normalizeId(req.params.id);
  if (id === null) {
    return res.status(400).render('layouts/main', {
      page: 'notFound',
      titulo: 'ZEUS - Solicitud inválida',
      mensaje: 'El id del producto no es válido.',
    });
  }

  cartService.updateQuantity(req.session, id, -1);
  res.redirect('/cart');
}

// Saca un producto del carrito por completo (botón "Quitar" de /cart).
function removeItem(req, res) {
  const id = normalizeId(req.params.id);
  if (id === null) {
    return res.status(400).render('layouts/main', {
      page: 'notFound',
      titulo: 'ZEUS - Solicitud inválida',
      mensaje: 'El id del producto no es válido.',
    });
  }

  cartService.removeItem(req.session, id);
  res.redirect('/cart');
}

// Vacía el carrito entero (Escenario 4).
function clear(req, res) {
  cartService.clear(req.session);
  res.redirect('/cart');
}

module.exports = { showCart, addItem, increase, decrease, removeItem, clear };
