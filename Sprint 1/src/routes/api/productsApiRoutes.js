const express = require('express');
const productsApiController = require('../../controllers/api/productsApiController');

const router = express.Router();

// Montado en /api/products (ver apiRoutes.js)
router.get('/', productsApiController.getAll);
router.get('/:id', productsApiController.getById);
router.post('/', productsApiController.create);
router.put('/:id', productsApiController.update);
router.delete('/:id', productsApiController.remove);

module.exports = router;
