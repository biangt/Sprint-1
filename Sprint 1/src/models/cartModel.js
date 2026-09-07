const carrito = require('../../data/carrito.json');
const productModel = require('./productModel');

function getSummary() {
  const items = carrito
    .map((entry) => {
      const producto = productModel.getById(entry.productoId);
      if (!producto) return null;

      return {
        ...producto,
        cantidad: entry.cantidad,
        subtotal: producto.precioEnPuntos * entry.cantidad,
      };
    })
    .filter(Boolean);

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);
  return { items, total };
}

module.exports = { getSummary };