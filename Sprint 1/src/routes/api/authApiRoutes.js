const express = require('express');
const authApiController = require('../../controllers/api/authApiController');

const router = express.Router();

// Montado en /api/auth (ver apiRoutes.js)
router.post('/register', authApiController.register);
router.post('/login', authApiController.login);

module.exports = router;
