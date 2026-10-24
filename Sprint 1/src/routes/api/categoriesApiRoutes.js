const express = require('express');
const categoriesApiController = require('../../controllers/api/categoriesApiController');

const router = express.Router();

// Montado en /api/categories (ver apiRoutes.js)
router.get('/', categoriesApiController.getAll);
router.get('/:id', categoriesApiController.getById);
router.post('/', categoriesApiController.create);
router.put('/:id', categoriesApiController.update);
router.delete('/:id', categoriesApiController.remove);

module.exports = router;
