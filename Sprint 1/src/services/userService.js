const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

// Sprint 6 US#1: lógica de negocio de los usuarios. Es el ÚNICO lugar donde
// se valida y se hashea: la API (/api/auth/register) y el formulario EJS
// (/register) llaman a la misma función, así no se duplica nada (DRY).

// Cuántas "vueltas" de mezcla hace bcrypt. Más vueltas = más difícil de
// adivinar por fuerza bruta, pero también más lento. 10 es el valor estándar.
const SALT_ROUNDS = 10;
const LARGO_MINIMO_PASSWORD = 8;
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// El body puede llegar vacío o con algo que no es un objeto.
function comoObjeto(body) {
  return body && typeof body === 'object' && !Array.isArray(body) ? body : {};
}

// Devuelve { errores } (datos mal: 400), { conflicto } (email ya usado:
// 409) o { usuario } (el recién creado, SIN password_hash).
async function registerUser(body) {
  const entrada = comoObjeto(body);
  const errores = [];

  const name = typeof entrada.name === 'string' ? entrada.name.trim() : '';
  const email = typeof entrada.email === 'string' ? entrada.email.trim() : '';
  const password = typeof entrada.password === 'string' ? entrada.password : '';

  if (name === '') errores.push('name es obligatorio y debe ser texto');
  if (email === '') errores.push('email es obligatorio');
  else if (!EMAIL_VALIDO.test(email)) errores.push('email no tiene un formato válido');
  if (password === '') errores.push('password es obligatorio');
  else if (password.length < LARGO_MINIMO_PASSWORD) {
    errores.push(`password debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres`);
  }

  if (errores.length > 0) return { errores };

  if (userModel.getByEmail(email)) {
    return { conflicto: 'Ya existe un usuario registrado con ese email' };
  }

  // La contraseña real NUNCA se guarda: se guarda solo su hash.
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return { usuario: userModel.create({ name, email, passwordHash }) };
}

module.exports = { registerUser };
