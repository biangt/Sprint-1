const productModel = require('../models/productModel');

function showHome(req, res) {
  res.render('pages/index', { productos: productModel.getAll() });
}

function showProduct(req, res) {
  const producto = productModel.getById(req.params.id);

  if (!producto) {
    return res.redirect('/notFound');
  }

  res.render('pages/product', { producto });
}

module.exports = { showHome, showProduct };