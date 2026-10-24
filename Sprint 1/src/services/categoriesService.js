const categoryModel = require('../models/categoryModel');
const productModel = require('../models/productModel');

// Sprint 5 US#3: lógica de negocio de las categorías para la API. Mismo
// patrón que productsService: los controllers no validan ni tocan la base,
// le piden el resultado al service.

// "Ropa de Hombre" -> "ropa-de-hombre". Es el texto que va en la URL
// (/categories/ropa-de-hombre), por eso sin acentos, espacios ni símbolos.
function slugify(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const SLUG_VALIDO = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function getAllCategories() {
  return categoryModel.getAll();
}

function getCategoryById(id) {
  return categoryModel.getById(id);
}

// Valida y normaliza una categoría. "idActual" es el id de la categoría que
// se está editando (null si es nueva), para que no choque consigo misma al
// revisar nombre/slug repetidos.
// Devuelve { errores } (datos mal: 400), { conflicto } (nombre o slug ya
// usados: 409) o { datos } listos para guardar.
function validarCategoria(entrada, idActual = null) {
  const errores = [];

  const nombre = typeof entrada.nombre === 'string' ? entrada.nombre.trim() : '';
  if (nombre === '') errores.push('nombre es obligatorio y debe ser texto');

  let slug = null;
  if (nombre !== '') {
    if (entrada.slug === undefined || entrada.slug === null) {
      slug = slugify(nombre);
      if (slug === '') errores.push('nombre debe contener al menos una letra o un número');
    } else if (typeof entrada.slug !== 'string' || !SLUG_VALIDO.test(entrada.slug)) {
      errores.push('slug solo puede tener minúsculas, números y guiones (ej: ropa-de-hombre)');
    } else {
      slug = entrada.slug;
    }
  }

  if (errores.length > 0) return { errores };

  const mismoNombre = categoryModel.getByNombre(nombre);
  if (mismoNombre && mismoNombre.id !== idActual) {
    return { conflicto: 'Ya existe una categoría con ese nombre' };
  }
  const mismoSlug = categoryModel.getBySlug(slug);
  if (mismoSlug && mismoSlug.id !== idActual) {
    return { conflicto: 'Ya existe una categoría con ese slug' };
  }

  return { datos: { nombre, slug } };
}

// El body puede llegar vacío (undefined) o con algo que no es un objeto.
function comoObjeto(body) {
  return body && typeof body === 'object' && !Array.isArray(body) ? body : {};
}

// Devuelve { errores }, { conflicto } o { categoria } (la ya creada).
// SEGURIDAD: "icono" NO se acepta desde la API. categoryStrip.ejs imprime
// ese campo sin escapar (<%- %>), así que un SVG con <script> escrito desde
// afuera sería inyección de código (XSS). Las categorías nuevas quedan con
// icono null y la vista usa el ícono por defecto.
function createCategory(body) {
  const { errores, conflicto, datos } = validarCategoria(comoObjeto(body));
  if (errores) return { errores };
  if (conflicto) return { conflicto };
  return { categoria: categoryModel.create({ ...datos, icono: null }) };
}

// Devuelve null si el id no existe; si no, { errores }, { conflicto } o
// { categoria }. Lo que no venga en el body conserva su valor actual, y el
// icono siempre se conserva (ver nota de seguridad en createCategory).
// Al renombrar sin mandar slug, el slug NO cambia (no se rompen los links).
function updateCategory(id, body) {
  const actual = categoryModel.getById(id);
  if (!actual) return null;

  const entrada = { ...actual, ...comoObjeto(body) };
  const { errores, conflicto, datos } = validarCategoria(entrada, actual.id);
  if (errores) return { errores };
  if (conflicto) return { conflicto };
  return { categoria: categoryModel.update(id, { ...datos, icono: actual.icono }) };
}

// Mismo estilo de respuesta que cartService: { ok: true } o
// { ok: false, motivo }. No se borra una categoría que todavía tiene
// productos (la base lo impediría de todos modos por la foreign key).
function deleteCategory(id) {
  if (!categoryModel.getById(id)) return { ok: false, motivo: 'no-existe' };
  if (productModel.getByCategoria(Number(id)).length > 0) return { ok: false, motivo: 'en-uso' };

  categoryModel.remove(id);
  return { ok: true };
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
