const express = require('express');
const session = require('express-session');
const path = require('path');
const categoryModel = require('./src/models/categoryModel');
const productRoutes = require('./src/routes/productRoute');
const pageRoutes = require('./src/routes/pageRoute');
const cartRoutes = require('./src/routes/cartRoute');

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
app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  next();
});

app.locals.categorias = categoryModel.getAll();
app.use('/', pageRoutes);
app.use('/', productRoutes);
app.use('/', cartRoutes);

// 404 - ninguna ruta anterior coincidio
app.use((req, res) => {
  res.status(404).render('pages/notFound');
});

// 500 - error no manejado en alguna ruta anterior
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Error del servidor');
});

app.listen(PORT, () => {
  console.log(`ZEUS corriendo en http://localhost:${PORT}`);
});
