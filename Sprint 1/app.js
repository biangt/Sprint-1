const express = require('express');
const session = require('express-session');
const path = require('path');
const categoryModel = require('./src/models/categoryModel');
const cartService = require('./src/services/cartService');
const productRoutes = require('./src/routes/productRoute');
const pageRoutes = require('./src/routes/pageRoute');
const cartRoutes = require('./src/routes/cartRoute');
const categoryRoutes = require('./src/routes/categoryRoute');

const app = express();
const PORT = 3002;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'zeus-carrito-sprint2', // cualquier texto, sirve para firmar la cookie de sesión
  resave: false,                  // no reescribe la sesión en el servidor si no cambió nada
  saveUninitialized: true         // crea una sesión (y su cookie) aunque todavía no se haya guardado nada en ella
}));

// Garantiza que req.session.cart siempre exista (un array, aunque esté
// vacío) antes de llegar a cualquier controller, para no tener que andar
// chequeando "undefined" en cada uno de ellos.
// US#16: ya no se toca req.session.cart directo ni siquiera acá; el
// ÚNICO lugar que lee/escribe session.cart es cartService.
app.use((req, res, next) => {
  cartService.ensureCart(req.session);
  next();
});

// US#12: calcula el total de items del carrito UNA vez por pedido, y lo
// deja en res.locals para que TODAS las vistas lo tengan disponible como
// "cantidadCarrito" sin que cada controller tenga que pasarlo a mano al
// hacer render (así el header.ejs, que se incluye en cada página, siempre
// puede mostrarlo). Suma las "quantity" de cada item, no la cantidad de
// items distintos: 2 mochilas + 3 remeras = 5, no 2.
app.use((req, res, next) => {
  res.locals.cantidadCarrito = cartService.getCantidad(req.session);
  next();
});

app.locals.categorias = categoryModel.getAll();
app.use('/', pageRoutes);
app.use('/', productRoutes);
app.use('/', cartRoutes);
app.use('/', categoryRoutes);

// 404 - ninguna ruta anterior coincidio
app.use((req, res) => {
  res.status(404).render('layouts/main', { page: 'notFound', titulo: 'ZEUS - Página no encontrada' });
});

// 500 - error no manejado en alguna ruta anterior (US#13)
// console.error(err) queda SOLO en la terminal del servidor, para que
// quien esté programando pueda ver qué pasó. A quien navega nunca le
// mandamos err.message ni err.stack: eso podría revelar detalles
// internos del código, así que 500.ejs solo muestra un mensaje genérico.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('layouts/main', { page: '500', titulo: 'ZEUS - Error del servidor' });
});

app.listen(PORT, () => {
  console.log(`ZEUS corriendo en http://localhost:${PORT}`);
});
