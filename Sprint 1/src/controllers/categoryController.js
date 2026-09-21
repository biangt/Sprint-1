const productsService = require('../services/productsService');

// US#10 + US#15: /categories/:category. El controller ya no habla
// directo con categoryModel/productModel, se lo pide listo al service y
// solo decide si redirige (slug inexistente) o renderiza.
function showCategory(req, res) {
  const resultado = productsService.getCategoryProducts(req.params.category);

  if (!resultado) {
    return res.redirect('/notFound');
  }

  res.render('layouts/main', {
    page: 'category',
    titulo: `ZEUS - ${resultado.categoria.nombre}`,
    categoria: resultado.categoria,
    productos: resultado.productos,
  });
}

module.exports = { showCategory };
