const productsService = require('../services/productsService');
const normalizeId = require('../utils/normalizeId');
const renderIdError = require('../utils/renderIdError');

// US#15: el controller ya no arma "sugeridos"/"masPedidos" él mismo, se
// los pide listos al service y solo decide cómo responder.
function showHome(req, res) {
  const { sugeridos, masPedidos } = productsService.getHomeProducts();
  res.render('layouts/main', { page: 'index', titulo: 'ZEUS - Inicio', sugeridos, masPedidos });
}

function showProduct(req, res) {
  // Valida tanto el formato del ID como la existencia del producto en SQLite.
  const validacion = normalizeId(req.params.id);
  if (validacion.status) return renderIdError(res, validacion.status);

  const resultado = productsService.getProductDetail(validacion.id);

  // Acá el id SÍ tiene formato válido, pero ningún producto lo tiene:
  // ahora es un 404 (no lo encontramos), no un 400.
  if (!resultado) {
    return renderIdError(res, 404);
  }

  res.render('layouts/main', {
    page: 'product',
    titulo: `MiEcommerce - ${resultado.producto.nombre}`,
    producto: resultado.producto,
    relacionados: resultado.relacionados,
  });
}

// US#18: /products, listado completo del catálogo, ordenable por precio.
// req.query.sort llega como string (o undefined) desde CUALQUIERA de los
// dos caminos: alguien escribe "?sort=asc" a mano en la URL, o hace click
// en el botón de sortFilter.ejs (que en el fondo es un link a esa misma
// URL) — para Express no hay diferencia, así que no hace falta código
// separado para cada caso.
function showProducts(req, res) {
  const { productos, sort } = productsService.getProductsList(req.query.sort);
  res.render('layouts/main', {
    page: 'products',
    titulo: 'ZEUS - Productos',
    productos,
    sortActual: sort,
  });
}

// US#19: /search?query=camisa, desde el formulario del header (o
// escribiendo la URL a mano, funciona igual).
function search(req, res) {
  const { productos, term } = productsService.searchProducts(req.query.query);

  res.render('layouts/main', {
    page: 'search',
    titulo: term ? `ZEUS - Resultados para "${term}"` : 'ZEUS - Productos',
    productos,
    term,
  });
}

module.exports = { showHome, showProduct, showProducts, search };
