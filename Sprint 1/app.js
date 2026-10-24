const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { initWebSocket } = require('./src/websocket/wsServer');
// US#9: todo lo que se envía por WebSocket pasa por este servicio.
const eventService = require('./src/services/eventService');
const { eventoCarritoActualizado } = require('./src/websocket/cartEvents');
const categoryModel = require('./src/models/categoryModel');
const cartService = require('./src/services/cartService');
const productRoutes = require('./src/routes/productRoute');
const pageRoutes = require('./src/routes/pageRoute');
const cartRoutes = require('./src/routes/cartRoute');
const categoryRoutes = require('./src/routes/categoryRoute');
// Sprint 5 US#1: todas las rutas JSON de la API viven bajo /api
const apiRoutes = require('./src/routes/apiRoutes');
require('./db/database');

const app = express();
const PORT = 3002;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.urlencoded({ extended: true }));

// Sprint 5 US#1: middlewares para la API.
// cors(): agrega los headers que le dicen al navegador "este servidor acepta
// pedidos de otros orígenes" (por ejemplo, un dashboard React en otro puerto).
// Sin esto el navegador bloquea la respuesta aunque el servidor la envíe.
app.use(cors());
// express.json(): lee el body de pedidos con Content-Type application/json
// y lo deja ya convertido en objeto en req.body (para POST y PUT).
app.use(express.json());

const sessionMiddleware = session({
  secret: 'zeus-carrito-sprint2',// cualquier texto, sirve para firmar la cookie de sesión
  resave: false,// no reescribe la sesión en el servidor si no cambió nada
  saveUninitialized: true // crea una sesión (y su cookie) aunque todavía no se haya guardado nada en ella
});
app.use(sessionMiddleware);

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

// La API va ANTES de las rutas de vistas (EJS) y antes del 404 de más abajo.
app.use('/api', apiRoutes);

// Sprint 5 US#3: antes las categorías se leían UNA vez al arrancar el
// servidor (app.locals). Como ahora la API puede crear, renombrar o borrar
// categorías, se leen en cada pedido de una página para que la franja de
// categorías siempre muestre lo que hay en la base. Va después de /api para
// no hacer esta consulta en los pedidos JSON.
app.use((req, res, next) => {
  res.locals.categorias = categoryModel.getAll();
  next();
});

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
  // Sprint 5: si el error ocurrió en la API (/api/...) se responde JSON, no
  // una página. Un JSON mal escrito en el body hace que express.json()
  // falle con err.status = 400; cualquier otro error es un 500.
  if (req.originalUrl.startsWith('/api')) {
    const esJsonInvalido = err.status === 400;
    return res
      .status(esJsonInvalido ? 400 : 500)
      .json({ error: esJsonInvalido ? 'JSON inválido en el body' : 'Error interno del servidor' });
  }
  res.status(500).render('layouts/main', { page: '500', titulo: 'ZEUS - Error del servidor' });
});

//app.listen() crea un servidor HTTP internamente y no te lo devuelve de forma cómoda para engancharle algo más. Con http.createServer(app) pasamos a tener el servidor en una variable, server, y ese mismo server lo usan los dos: Express (rutas, vistas, carrito) y ws (WebSockets). Los dos comparten el puerto 3002.
const server = http.createServer(app);
// US#5: apenas una pestaña se conecta, le mandamos el estado ACTUAL del
// carrito. US#6: es el evento "cartUpdated" con source: 'connection', que le
// avisa al navegador que no es un cambio sino que se está poniendo al día.
initWebSocket(server, sessionMiddleware, (socket, session) => {
  eventService.emitirA(socket, eventoCarritoActualizado(session, 'connection'));
});

server.listen(PORT, () => {
  console.log(`ZEUS corriendo en http://localhost:${PORT}`);
});
