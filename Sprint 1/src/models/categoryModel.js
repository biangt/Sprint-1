const categorias = require('../../data/categorias.json');

function getAll() {
  return categorias;
}

module.exports = { getAll };