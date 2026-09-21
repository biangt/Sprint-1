const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

router.get('/', productController.showHome);
// US#18: /products deja de ser un alias de la Home; ahora es el listado
// completo del catálogo, con soporte de orden por precio (?sort=asc|desc).
router.get('/products', productController.showProducts);
router.get('/products/:id', productController.showProduct);

// US#19: buscador por nombre, desde el header o escribiendo la URL a mano.
router.get('/search', productController.search);

router.get('/productos', (req, res) => res.redirect('/products'));
router.get('/productos/:id', (req, res) => res.redirect(`/products/${req.params.id}`));

module.exports = router;