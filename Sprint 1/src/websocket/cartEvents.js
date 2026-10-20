// US#5/US#6: ÚNICO lugar que arma el mensaje con el estado del carrito.
// Lo usan dos cosas:
//  - cartController: lo manda a TODAS las pestañas cuando el carrito cambia.
//  - app.js (vía wsServer): lo manda a UNA pestaña apenas se conecta, para
//    que arranque mostrando el estado real y no el de cuando se armó la página.
const cartService = require('../services/cartService');
const { EVENTOS, crearMensaje } = require('./protocol');

// source dice por qué se manda: 'change' (el carrito cambió) o
// 'connection' (la pestaña recién se conectó y está poniéndose al día).
function eventoCarritoActualizado(session, source = 'change') {
  // Una sesión nueva (por ejemplo, una cookie vieja después de reiniciar el
  // servidor) puede no tener carrito todavía; sin esto getSummary fallaría.
  cartService.ensureCart(session);
  const { items, total } = cartService.getSummary(session);

  return crearMensaje(EVENTOS.CART_UPDATED, {
    items: cartService.getCantidad(session), // cuántas unidades hay en total (el numerito del header)
    total,                                   // total de puntos
    products: items.map(({ id, nombre, imagen, cantidad, stock, subtotal }) => (
      { id, nombre, imagen, cantidad, stock, subtotal }
    )),                                      // el detalle, para redibujar /cart
    source,
  });
}

// US#7: el carrito acaba de quedar vacío. reason dice cómo ocurrió:
//  'cleared'         -> se usó el botón "Vaciar carrito".
//  'lastItemRemoved' -> se quitó (o se restó hasta cero) el último producto.
function eventoCarritoVacio(reason) {
  return crearMensaje(EVENTOS.CART_EMPTY, { reason });
}

module.exports = { eventoCarritoActualizado, eventoCarritoVacio };
