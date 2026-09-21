const productModel = require('../models/productModel');
const categoryModel = require('../models/categoryModel');

// US#15: acá vive la lógica de "qué productos corresponden" para cada
// pantalla. Los controllers ya no arman esto ellos mismos: le piden al
// service el resultado ya listo y solo deciden cómo responder (renderizar
// o redirigir). Si en el Sprint 3 productModel/categoryModel pasan a leer
// de una base de datos en vez del JSON, este archivo no debería tener que
// cambiar nada: sigue pidiéndoles lo mismo.

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
// "desc" se ignora y se devuelve el catálogo sin ordenar, en vez de
// romper con un valor raro tipo ?sort=banana. Se ordena una COPIA del
// arreglo (.slice()), nunca el original de productModel.
function getProductsList(sortParam) {
  const sort = sortParam === 'asc' || sortParam === 'desc' ? sortParam : null;
  const productos = productModel.getAll().slice();

  if (sort === 'asc') {
    productos.sort((a, b) => a.precioEnPuntos - b.precioEnPuntos);
  } else if (sort === 'desc') {
    productos.sort((a, b) => b.precioEnPuntos - a.precioEnPuntos);
  }

  return { productos, sort };
}

// US#19: filtra el catálogo por coincidencia PARCIAL de nombre (no hace
// falta escribir el nombre completo ni con las mayúsculas exactas: "camis"
// encuentra "Camiseta"). Si no llega texto (o es solo espacios), se
// considera que no hay búsqueda y se devuelve el catálogo entero, igual
// que /products sin filtros.
function searchProducts(query) {
  const term = (query || '').trim().toLowerCase();
  const productos = productModel
    .getAll()
    .filter((producto) => term === '' || producto.nombre.toLowerCase().includes(term));

  return { productos, term };
}

module.exports = { getHomeProducts, getProductDetail, getCategoryProducts, getProductsList, searchProducts };
