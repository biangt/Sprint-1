// Importa las operaciones de negocio del carrito, que acceden a la sesión y a los productos en SQLite.
const cartService = require('../services/cartService');
// Importa la función que valida el formato y la existencia del ID del producto.
const normalizeId = require('../utils/normalizeId');
// Importa el helper que genera la respuesta HTTP adecuada para errores de ID.
const renderIdError = require('../utils/renderIdError');

// Muestra el carrito combinando la sesión con los datos reales del
// producto, y calcula el total (Escenario 2 y Escenario 5).
function showCart(req, res) {
  // Construye los artículos del carrito con los datos actuales de la base y calcula sus subtotales y total.
  const resumen = cartService.getSummary(req.session);
  // Renderiza la página principal usando la vista del carrito y los datos calculados.
  res.render('layouts/main', { page: 'cart', titulo: 'ZEUS - Carrito', ...resumen });
}

// Agrega un producto al carrito (Escenario 1). Si no hay stock suficiente,
// no lo agrega y se lo avisa a la persona usuaria en la misma vista.
function addItem(req, res) {
  // Comprueba el formato y existencia del producto antes de tocar la sesión.
  // Toma el ID enviado en la URL y obtiene el resultado de la validación.
  const validacion = normalizeId(req.params.id);
  // Si la validación detecta un error, responde con su código (400 o 404) y termina el handler.
  if (validacion.status) return renderIdError(res, validacion.status);

  // Solicita al servicio que agregue el producto validado a la sesión.
  const resultado = cartService.addItem(req.session, validacion.id);

  // Si el servicio no pudo agregarlo, se prepara una respuesta de error.
  if (!resultado.ok) {
    // Devuelve 404 si el producto dejó de existir desde que se validó el ID.
    if (resultado.motivo === 'no-existe') return renderIdError(res, 404);
    // Recupera el estado actual del carrito para volver a mostrarlo junto al error.
    const resumen = cartService.getSummary(req.session);
    // Renderiza el carrito con los datos actuales y un mensaje apropiado para el motivo del fallo.
    return res.render('layouts/main', { page: 'cart', titulo: 'ZEUS - Carrito', ...resumen, mensaje: cartService.mensajeDeError(resultado.motivo) });
  }

  // Redirige al carrito después de agregar correctamente el producto.
  res.redirect('/cart');
}

// Aumenta en 1 la cantidad de un producto (Escenario 3), sin superar el
// stock disponible.
function increase(req, res) {
  // Valida el ID recibido en la ruta para diferenciar formato incorrecto de producto inexistente.
  const validacion = normalizeId(req.params.id);
  // Responde con el error de ID correspondiente sin intentar cambiar la cantidad.
  if (validacion.status) return renderIdError(res, validacion.status);

  // Pide al servicio incrementar en una unidad, sujeto al stock disponible.
  const resultado = cartService.updateQuantity(req.session, validacion.id, 1);

  // Si el incremento falla, se comunica el motivo a la persona usuaria.
  if (!resultado.ok) {
    // Devuelve 404 si el producto ya no existe en la base de datos.
    if (resultado.motivo === 'no-existe') return renderIdError(res, 404);
    // Calcula nuevamente los datos del carrito para conservar su contenido en la respuesta.
    const resumen = cartService.getSummary(req.session);
    // Renderiza el carrito con un mensaje, por ejemplo, cuando no hay stock suficiente.
    return res.render('layouts/main', { page: 'cart', titulo: 'ZEUS - Carrito', ...resumen, mensaje: cartService.mensajeDeError(resultado.motivo) });
  }

  // Redirige al carrito cuando el incremento se completó.
  res.redirect('/cart');
}

// Disminuye en 1 la cantidad; si llega a 0, el servicio ya lo elimina solo
// (Escenario 3).
function decrease(req, res) {
  // Lee y valida el ID del producto que se quiere reducir.
  const validacion = normalizeId(req.params.id);
  // Si el ID no es válido o no corresponde a un producto, responde con el error correspondiente.
  if (validacion.status) return renderIdError(res, validacion.status);

  // Solicita al servicio restar una unidad; el servicio quita el artículo si llega a cero.
  cartService.updateQuantity(req.session, validacion.id, -1);
  // Vuelve a mostrar el carrito actualizado.
  res.redirect('/cart');
}

// Saca un producto del carrito por completo (botón "Quitar" de /cart).
function removeItem(req, res) {
  // Lee y valida el ID del producto que se quiere quitar.
  const validacion = normalizeId(req.params.id);
  // Evita modificar la sesión si el ID es inválido o el producto no existe.
  if (validacion.status) return renderIdError(res, validacion.status);

  // Pide al servicio eliminar por completo el producto validado de la sesión.
  cartService.removeItem(req.session, validacion.id);
  // Redirige al carrito para mostrar el resultado actualizado.
  res.redirect('/cart');
}

// Vacía el carrito entero (Escenario 4).
function clear(req, res) {
  // Pide al servicio vaciar todos los artículos almacenados en el carrito de la sesión.
  cartService.clear(req.session);
  // Regresa a la página del carrito, ahora vacío.
  res.redirect('/cart');
}

// Expone los handlers para que el módulo de rutas pueda asociarlos a sus endpoints.
module.exports = { showCart, addItem, increase, decrease, removeItem, clear };
