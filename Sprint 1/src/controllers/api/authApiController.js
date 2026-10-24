const userService = require('../../services/userService');
const authService = require('../../services/authService');

// Sprint 6 US#1: controlador de autenticación de la API. No valida ni toca
// la base: le pide todo a userService y solo decide el JSON y el código HTTP.

// POST /api/auth/register
// 201 Created: se creó el usuario. 400: datos inválidos. 409: email repetido.
async function register(req, res) {
  const { errores, conflicto, usuario } = await userService.registerUser(req.body);
  if (errores) return res.status(400).json({ error: 'Datos inválidos', detalles: errores });
  if (conflicto) return res.status(409).json({ error: conflicto });

  res.status(201).json(usuario);
}

// POST /api/auth/login
// 200: credenciales correctas, devuelve el JWT. 401 Unauthorized: el usuario
// no existe o la contraseña es incorrecta (mismo mensaje para ambos casos).
async function login(req, res) {
  const { token, usuario, invalido } = await authService.login(req.body);
  if (invalido) return res.status(401).json({ error: 'Credenciales inválidas' });

  res.json({ token, usuario });
}

module.exports = { register, login };
