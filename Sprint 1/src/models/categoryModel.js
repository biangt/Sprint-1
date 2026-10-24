const db = require('../../db/database');

function getAll() {
  return db.prepare('SELECT id, nombre, slug, icono FROM categories ORDER BY id').all();
}

// Sprint 5 US#4: cantidad total de categorías.
function count() {
  return db.prepare('SELECT COUNT(*) AS total FROM categories').get().total;
}

// US#10: busca una categoría por su slug (el texto que va en la URL,
// ej. "calzado" en /categories/calzado). Devuelve undefined si no existe
// ninguna con ese slug.
function getBySlug(slug) {
  return db.prepare('SELECT id, nombre, slug, icono FROM categories WHERE slug = ?').get(slug);
}

// Sprint 5 US#2: se usa para validar que la categoría de un producto exista.
function getById(id) {
  return db.prepare('SELECT id, nombre, slug, icono FROM categories WHERE id = ?').get(Number(id));
}

// Sprint 5 US#3: búsqueda por nombre sin distinguir mayúsculas (la columna
// es UNIQUE, pero SQLite igual aceptaría "Ropa" y "ropa" como distintas).
function getByNombre(nombre) {
  return db
    .prepare('SELECT id, nombre, slug, icono FROM categories WHERE nombre = ? COLLATE NOCASE')
    .get(nombre);
}

// Sprint 5 US#3: escritura. Los datos llegan ya validados por
// categoriesService.
function create({ nombre, slug, icono }) {
  const info = db
    .prepare('INSERT INTO categories (nombre, slug, icono) VALUES (?, ?, ?)')
    .run(nombre, slug, icono ?? null);
  return getById(info.lastInsertRowid);
}

function update(id, { nombre, slug, icono }) {
  db.prepare('UPDATE categories SET nombre = ?, slug = ?, icono = ? WHERE id = ?').run(
    nombre,
    slug,
    icono ?? null,
    Number(id)
  );
  return getById(id);
}

// Devuelve true si borró una fila, false si el id no existía.
function remove(id) {
  return db.prepare('DELETE FROM categories WHERE id = ?').run(Number(id)).changes > 0;
}

module.exports = { getAll, count, getBySlug, getById, getByNombre, create, update, remove };