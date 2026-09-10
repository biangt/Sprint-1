const productModel = require('./productModel');

// El carrito ya no vive en data/carrito.json (eso era un archivo compartido
// por todo el mundo, no tenía sentido para un carrito personal). Ahora vive
// en req.session.cart, propio de cada persona usuaria. Por eso ninguna
// función de acá lee un archivo: todas reciben "cart" (el arreglo de
// { productId, quantity }) como parámetro, y el controller es quien se los
// pasa desde req.session.cart.

// Agrega un producto al carrito. Si ya estaba, le suma 1 a la cantidad
// en vez de crear una entrada duplicada (Escenario 1 de la US#4).
// No deja superar el stock disponible: devuelve { cart, ok } para que el
// controller sepa si tiene que avisarle algo a la persona usuaria.
function addItem(cart, productId) {
  const idNumerico = Number(productId);
  const producto = productModel.getById(idNumerico);

  if (!producto) return { cart, ok: false, motivo: 'no-existe' };

  const itemExistente = cart.find((item) => item.productId === idNumerico);
  const cantidadActual = itemExistente ? itemExistente.quantity : 0;

  if (cantidadActual + 1 > producto.stock) {
    return { cart, ok: false, motivo: 'sin-stock' };
  }

  if (itemExistente) {
    itemExistente.quantity += 1;
  } else {
    cart.push({ productId: idNumerico, quantity: 1 });
  }

  return { cart, ok: true };
}

// Suma o resta 1 a la cantidad de un producto (delta = 1 o delta = -1).
// Si la cantidad llega a 0, el producto se saca del carrito directamente
// (Escenario 3). Cuando delta suma (el botón +), no deja pasar del stock
// disponible; el botón - (delta negativo) nunca necesita este chequeo.
function updateQuantity(cart, productId, delta) {
  const idNumerico = Number(productId);
  const item = cart.find((item) => item.productId === idNumerico);

  if (!item) return { cart, ok: true };

  if (delta > 0) {
    const producto = productModel.getById(idNumerico);
    if (producto && item.quantity + delta > producto.stock) {
      return { cart, ok: false, motivo: 'sin-stock' };
    }
  }

  item.quantity += delta;

  if (item.quantity <= 0) {
    return { cart: cart.filter((i) => i.productId !== idNumerico), ok: true };
  }

  return { cart, ok: true };
}

// Saca un producto del carrito por completo, sin importar la cantidad
// (botón "Quitar" en /cart, distinto de bajar de a 1 con el botón −).
function removeItem(cart, productId) {
  const idNumerico = Number(productId);
  return cart.filter((item) => item.productId !== idNumerico);
}

// Vacía el carrito por completo (Escenario 4).
function clear() {
  return [];
}

// Combina lo que hay guardado en la sesión (solo productId + quantity)
// con los datos reales del producto (nombre, imagen, precio) que vienen
// del JSON, y calcula el subtotal de cada item y el total general
// (Escenario 2 y Escenario 5).
function getSummary(cart) {
  const items = cart
    .map((entry) => {
      const producto = productModel.getById(entry.productId);
      if (!producto) return null; // por si el producto fue borrado del catálogo

      return {
        ...producto,
        cantidad: entry.quantity,
        subtotal: producto.precioEnPuntos * entry.quantity,
      };
    })
    .filter(Boolean);

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);

  return { items, total };
}

module.exports = { addItem, updateQuantity, removeItem, clear, getSummary };

