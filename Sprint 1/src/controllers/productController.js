const productModel = require('../models/productModel');

function showHome(req, res) {
  res.render('pages/index', { productos: productModel.getAll() });
}

function showProduct(req, res) {
  res.render('pages/product', { producto: productModel.getById(req.params.id) });
}

module.exports = { showHome, showProduct };