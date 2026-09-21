const categorias = require('../../data/categorias.json');

function getAll() {
  return categorias;
}

// US#10: busca una categoría por su slug (el texto que va en la URL,
// ej. "calzado" en /categories/calzado). Devuelve undefined si no existe
// ninguna con ese slug.
function getBySlug(slug) {
  return categorias.find((categoria) => categoria.slug === slug);
}

module.exports = { getAll, getBySlug };