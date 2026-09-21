const productsService = require('../services/productsService');
const normalizeId = require('../utils/normalizeId');

// US#15: el controller ya no arma "sugeridos"/"masPedidos" él mismo, se
// los pide listos al service y solo decide cómo responder.
function showHome(req, res) {
  const { sugeridos, masPedidos } = productsService.getHomeProducts();
  res.render('layouts/main', { page: 'index', titulo: 'ZEUS - Inicio', sugeridos, masPedidos });
}

function showProduct(req, res) {
  // US#17: primero se valida que el id de la URL TENGA FORMATO de id
  // (un número). Si alguien puso /products/abc, ni vale la pena
  // preguntarle al service: es un pedido mal formado, 400. El status
  // sigue siendo 400 (no 404), pero la pantalla reutiliza la misma vista
  // "no encontrado" con un mensaje propio, en vez de un texto plano.
  const id = normalizeId(req.params.id);
  if (id === null) {
    return res.status(400).render('layouts/main', {
      page: 'notFound',
      titulo: 'ZEUS - Solicitud inválida',
      mensaje: '400 - El id del producto no es válido.',
    });
  }

  const resultado = productsService.getProductDetail(id);

  // Acá el id SÍ tiene formato válido, pero ningún producto lo tiene:
  // ahora es un 404 (no lo encontramos), no un 400.
  if (!resultado) {
    return res.status(404).render('layouts/main', { page: 'notFound', titulo: 'ZEUS - Página no encontrada' });
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
