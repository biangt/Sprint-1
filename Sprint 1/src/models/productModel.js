const productos = require('../../data/productos.json');

function getAll() {
  return productos;
}

function getById(id) {
  return productos.find((producto) => producto.id === Number(id));
}

module.exports = { getAll, getById };