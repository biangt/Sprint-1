const userService = require('../services/userService');

// US#14: login y registro quedan afuera del layout base a propósito (así
// lo pide la User Story), por eso siguen renderizando su propio .ejs
// completo (con su <html>, header y footer adentro), en vez de pasar por
// layouts/main como el resto de las páginas.
function showCheckout(req, res) {
  res.render('layouts/main', { page: 'checkout', titulo: 'ZEUS - Checkout' });
}

function showRegister(req, res) {
  res.render('pages/register', { error: null });
}

// Sprint 6 US#1: el formulario EJS usa el MISMO userService que la API
// (/api/auth/register). Acá solo se traduce el formulario ("nombre") al
// formato del service ("name") y se decide qué mostrar en pantalla.
async function register(req, res) {
  const { nombre, email, password, password2 } = req.body;

  if (password !== password2) {
    return res.status(400).render('pages/register', { error: 'Las contraseñas no coinciden.' });
  }

  const { errores, conflicto } = await userService.registerUser({ name: nombre, email, password });
  if (errores) return res.status(400).render('pages/register', { error: errores.join('. ') + '.' });
  if (conflicto) return res.status(409).render('pages/register', { error: conflicto + '.' });

  // Cuenta creada: la persona ya puede iniciar sesión (el login llega en la US#2).
  res.redirect('/login');
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
