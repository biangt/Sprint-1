const db = require('../../db/database');

// Sprint 6 US#1: acceso a la tabla "users". Igual que categoryModel y
// productModel, acá SOLO hay consultas SQL: nada de validar ni de hashear.
// Eso lo hace userService.

// Busca por email sin distinguir mayúsculas (Ana@mail.com = ana@mail.com).
// Devuelve la fila COMPLETA, con password_hash: la usa el login (US#2) para
// comparar contraseñas. Nunca se debe mandar tal cual al cliente.
function getByEmail(email) {
  return db
    .prepare('SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = ? COLLATE NOCASE')
    .get(email);
}

// Esta versión NO trae password_hash: es la que es seguro devolver.
function getById(id) {
  return db
    .prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?')
    .get(Number(id));
}

// El rol no se recibe: todo usuario nuevo nace 'consumer' (lo pide la
// consigna). El hash ya llega calculado desde el service.
function create({ name, email, passwordHash }) {
  const info = db
    .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'consumer')")
    .run(name, email, passwordHash);
  return getById(info.lastInsertRowid);
}

module.exports = { getByEmail, getById, create };
