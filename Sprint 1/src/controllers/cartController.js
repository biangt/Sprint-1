const cartModel = require('../models/cartModel');

// Muestra el carrito combinando la sesión con los datos reales del
// producto, y calcula el total (Escenario 2 y Escenario 5).
function showCart(req, res) {
  const resumen = cartModel.getSummary(req.session.cart);
  res.render('pages/cart', resumen);
}

// Agrega un producto al carrito (Escenario 1).
function addItem(req, res) {
  cartModel.addItem(req.session.cart, req.params.id);
  res.redirect('/cart');
}

// Aumenta en 1 la cantidad de un producto (Escenario 3).
function increase(req, res) {
  cartModel.updateQuantity(req.session.cart, req.params.id, 1);
  res.redirect('/cart');
}

// Disminuye en 1 la cantidad; si llega a 0, el modelo ya lo elimina solo (Escenario 3).
function decrease(req, res) {
  cartModel.updateQuantity(req.session.cart, req.params.id, -1);
  res.redirect('/cart');
}

// Saca un producto del carrito por completo (botón "Quitar" de /cart).
function removeItem(req, res) {
  req.session.cart = cartModel.removeItem(req.session.cart, req.params.id);
  res.redirect('/cart');
}

// Vacía el carrito entero (Escenario 4).
function clear(req, res) {
  req.session.cart = cartModel.clear();
  res.redirect('/cart');
}

module.exports = { showCart, addItem, increase, decrease, removeItem, clear };
