const express = require('express');
const productsApiRoutes = require('./api/productsApiRoutes');
const categoriesApiRoutes = require('./api/categoriesApiRoutes');
const authApiRoutes = require('./api/authApiRoutes');
const statsApiController = require('../controllers/api/statsApiController');

const router = express.Router();

// Sprint 5: punto de entrada de la API REST (todo responde JSON).
router.use('/products', productsApiRoutes);
router.use('/categories', categoriesApiRoutes);
// Sprint 6: registro (y más adelante login) de usuarios.
router.use('/auth', authApiRoutes);
router.get('/stats', statsApiController.getStats);

// Cualquier ruta /api/... que no exista responde JSON (no la página 404 EJS).
// IMPORTANTE: tiene que quedar al FINAL de este archivo.
router.use((req, res) => {
  res.status(404).json({ error: 'Ruta de API no encontrada' });
});

module.exports = router;
