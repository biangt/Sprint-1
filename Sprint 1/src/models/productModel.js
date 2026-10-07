const db = require('../../db/database');

// US#main-s3-us3: productModel obtiene los productos directamente desde SQLite.
// Todas las consultas piden las columnas con los MISMOS nombres que ya
// devolvía el JSON (camelCase: precioEnPuntos, categoriaId), aunque en la
// tabla estén guardadas distinto (precio_puntos, categoria_id en
// snake_case/español) — así productsService, los controllers y las vistas
// no se enteran de que cambió el origen de los datos.
const CAMPOS = `
  id,
  nombre,
  imagen,
  precio_puntos AS precioEnPuntos,
  categoria_id  AS categoriaId,
  descripcion,
  stock,
  destacado
`;

function getAll() {
  return db.prepare(`SELECT ${CAMPOS} FROM products`).all();
}

function getById(id) {
  return db.prepare(`SELECT ${CAMPOS} FROM products WHERE id = ?`).get(Number(id));
}

// US#18: todo el catálogo, ordenado por precio en la propia base (más
// eficiente que traer todo y ordenar en JS). "sort" ya viene validado por
// productsService (solo puede ser 'asc', 'desc' o null) antes de llegar
// acá, así que es seguro interpolar ASC/DESC directo en el SQL: nunca es
// un valor libre escrito por quien visita la página.
function getAllOrdenado(sort) {
  if (sort !== 'asc' && sort !== 'desc') return getAll();
  const direccion = sort === 'asc' ? 'ASC' : 'DESC';
  return db.prepare(`SELECT ${CAMPOS} FROM products ORDER BY precio_puntos ${direccion}`).all();
}

// US#19: búsqueda por coincidencia PARCIAL de nombre. LIKE en SQLite ya es
// insensible a mayúsculas/minúsculas para caracteres sin acento; con
// palabras acentuadas (ej. "Proteína") puede no matchear todas las
// variantes de mayúscula/minúscula — queda pendiente de probar en el
// catálogo real.
function buscarPorNombre(term) {
  const termino = `%${term}%`;
  return db.prepare(`SELECT ${CAMPOS} FROM products WHERE nombre LIKE ?`).all(termino);
}

// US#6: hasta "cantidad" productos al azar para "Te puede interesar".
// ORDER BY RANDOM() reemplaza el shuffle manual (Fisher-Yates) que hacía
// antes productModel en JS: SQLite ya sabe devolver filas en orden
// aleatorio.
function getSugeridos(cantidad = 5) {
  return db.prepare(`SELECT ${CAMPOS} FROM products ORDER BY RANDOM() LIMIT ?`).all(cantidad);
}

// US#7: hasta "cantidad" productos para "Los más pedidos": primero los
// destacados, y si no alcanzan, se completa al azar con el resto. Se
// resuelve con dos consultas porque son dos criterios distintos
// (destacado = 1 primero, después destacado = 0), igual que hacía la
// versión en JS con dos arrays separados.
//
// "excluirIds" es de tamaño variable, y better-sqlite3 no acepta un array
// como un solo parámetro de IN (...) — hay que generar un "?" por cada id
// a excluir y pasarlos todos como parámetros sueltos.
function getMasPedidos(cantidad = 10, excluirIds = []) {
  const exclusionDestacados = excluirIds.length ? `AND id NOT IN (${excluirIds.map(() => '?').join(',')})` : '';

  const destacados = db
    .prepare(`SELECT ${CAMPOS} FROM products WHERE destacado = 1 ${exclusionDestacados} ORDER BY RANDOM() LIMIT ?`)
    .all(...excluirIds, cantidad);

  const faltantes = cantidad - destacados.length;
  if (faltantes <= 0) return destacados;

  const idsUsados = [...excluirIds, ...destacados.map((producto) => producto.id)];
  const exclusionResto = idsUsados.length ? `AND id NOT IN (${idsUsados.map(() => '?').join(',')})` : '';

  const resto = db
    .prepare(`SELECT ${CAMPOS} FROM products WHERE destacado = 0 ${exclusionResto} ORDER BY RANDOM() LIMIT ?`)
    .all(...idsUsados, faltantes);

  return [...destacados, ...resto];
}

// US#8: hasta "cantidad" productos de la MISMA categoría que "producto"
// (sin incluirlo a él mismo), al azar, para "Productos relacionados".
function getRelacionados(producto, cantidad = 4) {
  if (!producto || !producto.categoriaId) return [];

  return db
    .prepare(`SELECT ${CAMPOS} FROM products WHERE categoria_id = ? AND id != ? ORDER BY RANDOM() LIMIT ?`)
    .all(producto.categoriaId, producto.id, cantidad);
}

// US#10: todos los productos de una categoría puntual, sin recortar ni
// mezclar (a diferencia de getRelacionados).
function getByCategoria(categoriaId) {
  return db.prepare(`SELECT ${CAMPOS} FROM products WHERE categoria_id = ?`).all(categoriaId);
}

module.exports = {
  getAll,
  getById,
  getAllOrdenado,
  buscarPorNombre,
  getSugeridos,
  getMasPedidos,
  getRelacionados,
  getByCategoria,
};
