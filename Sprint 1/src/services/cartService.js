const productModel = require('../models/productModel');

// US#16: este es el ÚNICO archivo que lee o escribe session.cart en toda
// la app. Ni los controllers ni app.js lo tocan directo: le pasan la
// sesión completa (req.session) y este servicio decide cómo modificarla.
// Eso deja a los controllers simples (solo deciden cómo responder al
// navegador) y, si en el Sprint 3 el carrito se guarda en una base de
// datos en vez de en la sesión, el cambio queda encerrado acá adentro.

// Traduce el "motivo" que devuelve una operación fallida a un mensaje
// legible para mostrar en /cart.
function mensajeDeError(motivo) {
  if (motivo === 'sin-stock') return 'No hay más stock disponible de ese producto.';
  if (motivo === 'no-existe') return 'Ese producto ya no está disponible.';
  return null;
}

// Middleware de arranque (app.js): garantiza que session.cart siempre
// exista como array, aunque esté vacío, antes de que cualquier otra cosa
// intente usarlo.
function ensureCart(session) {
  if (!session.cart) {
    session.cart = [];
  }
}

// Cuántos productos hay en total en el carrito, sumando cantidades (no la
// cantidad de productos distintos). Lo usa app.js para el badge del header.
function getCantidad(session) {
  return session.cart.reduce((total, item) => total + item.quantity, 0);
}

// Agrega un producto (Escenario "Agregar producto"). Si no hay stock
// suficiente, o el producto no existe, no lo agrega y avisa por qué.
function addItem(session, productId) {
  const producto = productModel.getById(productId);
  if (!producto) return { ok: false, motivo: 'no-existe' };

  const itemExistente = session.cart.find((item) => item.productId === producto.id);
  const cantidadActual = itemExistente ? itemExistente.quantity : 0;
  if (cantidadActual + 1 > producto.stock) return { ok: false, motivo: 'sin-stock' };

  if (itemExistente) {
    itemExistente.quantity += 1;
  } else {
    session.cart.push({ productId: producto.id, quantity: 1 });
  }
  return { ok: true };
}

// Modifica en +1/-1 la cantidad de un producto (Escenario "Modificar
// cantidad"). Si llega a 0, se elimina solo del carrito.
function updateQuantity(session, productId, delta) {
  const idNumerico = Number(productId);
  const item = session.cart.find((i) => i.productId === idNumerico);
  if (!item) return { ok: true };

  if (delta > 0) {
    const producto = productModel.getById(idNumerico);
    if (producto && item.quantity + delta > producto.stock) return { ok: false, motivo: 'sin-stock' };
  }

  item.quantity += delta;
  if (item.quantity <= 0) {
    session.cart = session.cart.filter((i) => i.productId !== idNumerico);
  }
  return { ok: true };
}

// Saca un producto del carrito por completo (Escenario "Quitar producto").
function removeItem(session, productId) {
  const idNumerico = Number(productId);
  session.cart = session.cart.filter((item) => item.productId !== idNumerico);
}

// Vacía el carrito entero (Escenario "Vaciar carrito").
function clear(session) {
  session.cart = [];
}

// Combina la sesión con los datos reales de cada producto y calcula el
// total (Escenario "Calcular total").
function getSummary(session) {
  const items = session.cart
    .map((entry) => {
      const producto = productModel.getById(entry.productId);
      if (!producto) return null;
      return { ...producto, cantidad: entry.quantity, subtotal: producto.precioEnPuntos * entry.quantity };
    })
    .filter(Boolean);

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);
  return { items, total };
}

module.exports = {
  mensajeDeError,
  ensureCart,
  getCantidad,
  addItem,
  updateQuantity,
  removeItem,
  clear,
  getSummary,
};
