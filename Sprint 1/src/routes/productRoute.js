const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

router.get('/', productController.showHome);
router.get('/products', productController.showHome);
router.get('/products/:id', productController.showProduct);

router.get('/productos', (req, res) => res.redirect('/products'));
router.get('/productos/:id', (req, res) => res.redirect(`/products/${req.params.id}`));

module.exports = router;