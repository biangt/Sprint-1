const db = require('../../db/database');

function getAll() {
  return db.prepare('SELECT id, nombre, slug, icono FROM categories ORDER BY id').all();
}

// US#10: busca una categoría por su slug (el texto que va en la URL,
// ej. "calzado" en /categories/calzado). Devuelve undefined si no existe
// ninguna con ese slug.
function getBySlug(slug) {
  return db.prepare('SELECT id, nombre, slug, icono FROM categories WHERE slug = ?').get(slug);
}

module.exports = { getAll, getBySlug };