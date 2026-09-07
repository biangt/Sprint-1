const express = require('express');
const path = require('path');
const categoryModel = require('./src/models/categoryModel');
const productRoutes = require('./src/routes/productRoute');
const pageRoutes = require('./src/routes/pageRoute');

const app = express();
const PORT = 3002;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.urlencoded({ extended: true }));

app.locals.categorias = categoryModel.getAll();
app.use('/', pageRoutes);
app.use('/', productRoutes);

app.listen(PORT, () => {
  console.log(`ZEUS corriendo en http://localhost:${PORT}`);
});
