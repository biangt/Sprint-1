const express = require('express');
const path = require('path');
const app = express();
const PORT = 3002;
const categorias = require('./data/categorias.json');

// Le decimos a Express que use EJS como motor de plantillas
// y que las vistas viven en la carpeta "views" (ahí adentro están "pages" y "partials")
app.set('view engine', 'ejs');
app.set('views', './views');

// Servimos los archivos estáticos (CSS, imágenes, JS del cliente) desde /assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.urlencoded({ extended: true })); // para leer datos de formularios (POST)

// Datos de ejemplo, en un proyecto real vendrían de una base de datos
const productos = require('./data/productos.json');

// app.locals queda disponible en TODAS las vistas sin tener que pasarlo
// a mano en cada res.render(...). Así footer.ejs puede usar "categorias"
// sin importar qué ruta lo esté renderizando (antes solo se pasaba en
// la ruta "/", por eso el resto de las páginas rompía con
// "categorias is not defined").
app.locals.categorias = categorias;

// ---------------------------------------------------------------
// User Story #2 — Definir Rutas
// Cada vista queda accesible desde una dirección "amigable":
// ---------------------------------------------------------------

// GET /  -> Página de Inicio (index.ejs)
app.get('/', (req, res) => {
  res.render('pages/index', { productos });
});

// GET /productos -> Página de un producto en particular (product.ejs)
app.get('/productos/:id', (req, res) => {
  const producto = productos.find(p => p.id === Number(req.params.id));
  res.render('pages/product', { producto });
});

// GET /carro -> Página del carrito (cart.ejs)
app.get('/carro', (req, res) => {
  res.render('pages/cart');
});

// GET /verificar -> Página de pago (checkout.ejs)
app.get('/verificar', (req, res) => {
  res.render('pages/checkout');
});

// GET /registro -> Página de registro para nuevos usuarios (register.ejs)
app.get('/registro', (req, res) => {
  res.render('pages/register');
});

// POST /registro -> procesa el formulario de registro
app.post('/registro', (req, res) => {
  // acá iría la lógica para crear el usuario
  res.redirect('/acceso');
});

// GET /acceso -> Página de inicio de sesión (login.ejs)
app.get('/acceso', (req, res) => {
  res.render('pages/login');
});

app.listen(PORT, () => {
  console.log(`MiEcommerce corriendo en http://localhost:${PORT}`);
});
