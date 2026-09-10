const express = require('express');
const cartController = require('../controllers/cartController');

const router = express.Router();

router.get('/cart', cartController.showCart);
router.post('/cart/add/:id', cartController.addItem);
router.post('/cart/increase/:id', cartController.increase);
router.post('/cart/decrease/:id', cartController.decrease);
router.post('/cart/remove/:id', cartController.removeItem);
router.post('/cart/clear', cartController.clear);

module.exports = router;
