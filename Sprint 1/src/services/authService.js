const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

// Sprint 6 US#2: lógica de autenticación (AuthN = "¿quién sos?").
// Igual que userService, es el ÚNICO lugar donde se compara la contraseña y
// se arma el token: la API (/api/auth/login) lo usa ahora, y la sesión de
// las vistas EJS (US#5) y el middleware verifyToken (US#3) lo van a reutilizar.

// Un hash "de mentira" (de una contraseña que nadie conoce). Se usa cuando el
// email no existe, para que bcrypt igual trabaje el mismo tiempo que con un
// usuario real. Así, midiendo cuánto tarda la respuesta, nadie puede
// descubrir qué emails están registrados.
const HASH_FALSO = bcrypt.hashSync('contraseña-que-nadie-conoce', 10);

// La clave secreta NUNCA va escrita en el código: viene del archivo .env.
// Si falta, es mejor frenar con un error claro que firmar tokens con una
// clave vacía (cualquiera podría falsificarlos).
function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Falta JWT_SECRET en el archivo .env');
  return secret;
}

// Arma el token (la "pulsera del festival"). Adentro va lo mínimo para
// identificar a la persona: su id (sub), email y rol. NUNCA la contraseña.
// "expiresIn" es la fecha de vencimiento de la pulsera (por defecto 1 hora).
function generateToken(usuario) {
  return jwt.sign(
    { sub: String(usuario.id), email: usuario.email, role: usuario.role },
    getSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
}

// Revisa que la pulsera sea auténtica y no esté vencida. Si no lo es, jwt
// lanza un error. La va a usar verifyToken en la US#3.
function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

// Devuelve { usuario } si el email y la contraseña son correctos, o
// { invalido: true } si no. El mensaje es el mismo para "no existe" y
// "contraseña incorrecta" a propósito: no le contamos a un atacante cuál de
// las dos cosas falló.
async function validarCredenciales(email, password) {
  const emailLimpio = typeof email === 'string' ? email.trim() : '';
  const passwordTexto = typeof password === 'string' ? password : '';
  if (emailLimpio === '' || passwordTexto === '') return { invalido: true };

  const fila = userModel.getByEmail(emailLimpio);
  const coincide = await bcrypt.compare(passwordTexto, fila ? fila.password_hash : HASH_FALSO);
  if (!fila || !coincide) return { invalido: true };

  // Se devuelve la versión SIN password_hash.
  return { usuario: userModel.getById(fila.id) };
}

// Login para la API: valida y, si está todo bien, entrega el token.
// Devuelve { invalido: true } o { token, usuario }.
async function login(body) {
  const entrada = body && typeof body === 'object' ? body : {};
  const { usuario, invalido } = await validarCredenciales(entrada.email, entrada.password);
  if (invalido) return { invalido: true };

  return { token: generateToken(usuario), usuario };
}

module.exports = { validarCredenciales, login, generateToken, verifyToken };
