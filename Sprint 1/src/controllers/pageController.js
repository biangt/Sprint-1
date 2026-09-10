function showCheckout(req, res) {
  res.render('pages/checkout');
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
