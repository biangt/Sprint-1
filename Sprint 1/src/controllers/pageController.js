// US#14: login y registro quedan afuera del layout base a propósito (así
// lo pide la User Story), por eso siguen renderizando su propio .ejs
// completo (con su <html>, header y footer adentro), en vez de pasar por
// layouts/main como el resto de las páginas.
function showCheckout(req, res) {
  res.render('layouts/main', { page: 'checkout', titulo: 'ZEUS - Checkout' });
}

function showRegister(req, res) {
  res.render('pages/register');
}

function register(req, res) {
  res.redirect('/');
}

function showLogin(req, res) {
  res.render('pages/login');
}

function login(req, res) {
  res.redirect('/');
}

module.exports = {
  showCheckout,
  showRegister,
  register,
  showLogin,
  login,
};
