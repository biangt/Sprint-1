const productModel = require('../models/productModel');
const categoryModel = require('../models/categoryModel');

// Sprint 5 US#4: métricas generales para las tarjetas de la pantalla
// principal del Dashboard. Combina datos de productos y de categorías, por
// eso vive en su propio service y no en productsService.
function getStats() {
  return {
    totalProducts: productModel.count(),
    totalCategories: categoryModel.count(),
  };
}

module.exports = { getStats };
