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
const productos = require('./data/productos.json'); //lee un archivo del disco

// US#7: mock del carrito de una persona usuaria. En un proyecto real esto
// viviria en una base de datos asociado a su sesion/usuario; por ahora es
// una lista fija de { productoId, cantidad } para poder armar la vista.
const carritoData = require('./data/carrito.json');

// app.locals queda disponible en TODAS las vistas sin tener que pasarlo
// a mano en cada res.render(...). Así footer.ejs puede usar "categorias"
// sin importar qué ruta lo esté renderizando (antes solo se pasaba en
// la ruta "/", por eso el resto de las páginas rompía con
// "categorias is not defined").
app.locals.categorias = categorias;
//no se está leyendo ningún archivo, lo que hace esta línea es tomar esa variable y guardarla en app.locals, que es un objeto especial de Express: todo lo que pongas ahí queda automáticamente disponible en cualquier vista .ejs que se renderice, sin que vos tengas que pasarlo a mano en cada res.render(...).


// ---------------------------------------------------------------
// User Story #2 — Definir Rutas
// Cada vista queda accesible desde una dirección "amigable":
// ---------------------------------------------------------------

// GET /  -> Página de Inicio (index.ejs)
app.get('/', (req, res) => {
  res.render('pages/index', { productos });
});

// GET /products -> Listado de productos
app.get('/products', (req, res) => {
  res.render('pages/index', { productos });
});

// GET /products/:id -> Página de un producto en particular (product.ejs)
app.get('/products/:id', (req, res) => {
  const producto = productos.find(p => p.id === Number(req.params.id));
  res.render('pages/product', { producto });
});

// GET /cart -> Página del carrito (cart.ejs)
app.get('/cart', (req, res) => {
  // Cruzamos el mock del carrito (solo tiene id + cantidad) con el catalogo
  // de productos para tener, por cada item, toda la info que necesita la
  // vista (imagen, nombre, precio) mas la cantidad y el subtotal.
  const items = carritoData
    .map((entry) => {
      const producto = productos.find((p) => p.id === entry.productoId);
      if (!producto) return null; // por si el id del mock no existe en productos.json
      return {
        ...producto,
        cantidad: entry.cantidad,
        subtotal: producto.precioEnPuntos * entry.cantidad,
      };
    })
    .filter(Boolean);

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);

  res.render('pages/cart', { items, total });
});

// GET /checkout -> Página de pago (checkout.ejs)
app.get('/checkout', (req, res) => {
  res.render('pages/checkout');
});

// GET /register -> Página de registro para nuevos usuarios (register.ejs)
app.get('/register', (req, res) => {
  res.render('pages/register');
});

// POST /register -> procesa el formulario de registro
// US#8: al completar el registro, el esquema de navegacion pide ir a Inicio
// (no a Login como se podria pensar en un principio).
app.post('/register', (req, res) => {
  // acá iría la lógica para crear el usuario
  res.redirect('/');
});

// GET /login -> Página de inicio de sesión (login.ejs)
app.get('/login', (req, res) => {
  res.render('pages/login');
});

// POST /login -> procesa el formulario de login.
// US #4: al enviar el form, la persona usuaria es redirigida a la página de inicio.
app.post('/login', (req, res) => {
  // acá iría la validación real de usuario/contraseña contra una base de datos
  res.redirect('/');
});

// Compatibilidad con rutas anteriores en español
app.get('/productos', (req, res) => {
  res.redirect('/products');
});

app.get('/productos/:id', (req, res) => {
  res.redirect(`/products/${req.params.id}`);
});

app.get('/carro', (req, res) => {
  res.redirect('/cart');
});

app.get('/verificar', (req, res) => {
  res.redirect('/checkout');
});

app.get('/registro', (req, res) => {
  res.redirect('/register');
});

app.post('/registro', (req, res) => {
  res.redirect('/login');
});

app.get('/acceso', (req, res) => {
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`ZEUS corriendo en http://localhost:${PORT}`);
});
