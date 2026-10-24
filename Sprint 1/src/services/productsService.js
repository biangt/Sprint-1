const productModel = require('../models/productModel');
const categoryModel = require('../models/categoryModel');

// US#15: acá vive la lógica de "qué productos corresponden" para cada
// pantalla. Los controllers no arman esto ellos mismos: le piden al
// service el resultado ya listo y solo deciden cómo responder (renderizar
// o redirigir).
//
// US#main-s3-us3: productModel ahora lee de SQLite en vez del JSON, pero
// este archivo no tuvo que cambiar su forma de pedirle los datos —
// getAll/getById/etc. siguen llamándose igual y devolviendo los mismos
// objetos. Lo único que cambió acá es "ordenar" y "buscar", que antes se
// resolvían con .sort()/.filter() en JS después de traer TODO el
// catálogo, y ahora se lo delegamos directamente a SQL (getAllOrdenado /
// buscarPorNombre), que es quien mejor sabe hacerlo.

// Datos que necesita la Home: "Te puede interesar" (aleatorios) y
// "Los más pedidos" (destacados, sin repetir los que ya salieron arriba).
function getHomeProducts() {
  const sugeridos = productModel.getSugeridos(5);
  const idsSugeridos = sugeridos.map((producto) => producto.id);
  const masPedidos = productModel.getMasPedidos(10, idsSugeridos);
  return { sugeridos, masPedidos };
}

// Datos del detalle de un producto: el producto en sí más sus
// relacionados. Devuelve null si el id no corresponde a ningún producto,
// para que el controller decida qué hacer (redirigir a /notFound).
function getProductDetail(id) {
  const producto = productModel.getById(id);
  if (!producto) return null;

  const relacionados = productModel.getRelacionados(producto, 4);
  return { producto, relacionados };
}

// Datos de la página de categoría: la categoría (por su slug de la URL) y
// todos sus productos. Devuelve null si el slug no existe.
function getCategoryProducts(slug) {
  const categoria = categoryModel.getBySlug(slug);
  if (!categoria) return null;

  const productos = productModel.getByCategoria(categoria.id);
  return { categoria, productos };
}

// US#18: TODOS los productos del catálogo, opcionalmente ordenados por
// precio. "sortParam" es lo que venga en req.query.sort (un string
// cualquiera, o undefined) — acá se valida: si no es exactamente "asc" o
// "desc" se ignora, en vez de romper con un valor raro tipo ?sort=banana.
function getProductsList(sortParam) {
  const sort = sortParam === 'asc' || sortParam === 'desc' ? sortParam : null;
  const productos = productModel.getAllOrdenado(sort);
  return { productos, sort };
}

// US#19: filtra el catálogo por coincidencia PARCIAL de nombre (no hace
// falta escribir el nombre completo). Si no llega texto (o es solo
// espacios), se considera que no hay búsqueda y se devuelve el catálogo
// entero, igual que /products sin filtros.
function searchProducts(query) {
  const term = (query || '').trim();
  const productos = term === '' ? productModel.getAll() : productModel.buscarPorNombre(term);
  return { productos, term };
}

// ---------------------------------------------------------------------------
// Sprint 5 US#2: operaciones que usa la API REST (lectura y escritura).
// ---------------------------------------------------------------------------

function getAllProducts() {
  return productModel.getAll();
}

function getProductById(id) {
  return productModel.getById(id);
}

// Valida y normaliza los datos de un producto (reglas de negocio).
// Devuelve { errores } si algo está mal, o { datos } listos para guardar.
function validarProducto(entrada) {
  const errores = [];

  const nombre = typeof entrada.nombre === 'string' ? entrada.nombre.trim() : '';
  if (nombre === '') errores.push('nombre es obligatorio y debe ser texto');

  const precio = entrada.precioEnPuntos;
  if (typeof precio !== 'number' || !Number.isFinite(precio) || precio < 0) {
    errores.push('precioEnPuntos es obligatorio y debe ser un número mayor o igual a 0');
  }

  const stock = entrada.stock ?? 0;
  if (!Number.isInteger(stock) || stock < 0) {
    errores.push('stock debe ser un entero mayor o igual a 0');
  }

  const categoriaId = entrada.categoriaId ?? null;
  if (categoriaId !== null && (!Number.isInteger(categoriaId) || !categoryModel.getById(categoriaId))) {
    errores.push('categoriaId debe ser el id de una categoría existente');
  }

  // destacado se guarda como 0/1 en SQLite; se acepta true/false o 0/1.
  const destacadoRaw = entrada.destacado ?? 0;
  if (![true, false, 0, 1].includes(destacadoRaw)) {
    errores.push('destacado debe ser true/false (o 1/0)');
  }

  for (const campo of ['descripcion', 'imagen']) {
    const valor = entrada[campo];
    if (valor !== undefined && valor !== null && typeof valor !== 'string') {
      errores.push(`${campo} debe ser texto`);
    }
  }

  if (errores.length > 0) return { errores };

  return {
    datos: {
      nombre,
      descripcion: entrada.descripcion ?? null,
      precioEnPuntos: precio,
      stock,
      categoriaId,
      imagen: entrada.imagen ?? null,
      destacado: destacadoRaw ? 1 : 0,
    },
  };
}

// El body puede llegar vacío (undefined) o con algo que no es un objeto.
function comoObjeto(body) {
  return body && typeof body === 'object' && !Array.isArray(body) ? body : {};
}

// Devuelve { errores } o { producto } (el producto ya creado, con su id).
function createProduct(body) {
  const { errores, datos } = validarProducto(comoObjeto(body));
  if (errores) return { errores };
  return { producto: productModel.create(datos) };
}

// Devuelve null si el id no existe; si no, { errores } o { producto }.
// Los campos que no vengan en el body conservan su valor actual.
function updateProduct(id, body) {
  const actual = productModel.getById(id);
  if (!actual) return null;

  const { errores, datos } = validarProducto({ ...actual, ...comoObjeto(body) });
  if (errores) return { errores };
  return { producto: productModel.update(id, datos) };
}

// Devuelve true si se eliminó, false si el id no existía.
function deleteProduct(id) {
  return productModel.remove(id);
}

module.exports = {
  getHomeProducts,
  getProductDetail,
  getCategoryProducts,
  getProductsList,
  searchProducts,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
