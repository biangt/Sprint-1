//explicar con mas detalle

const productModel = require('../models/productModel');

// Valida el formato del id recibido por URL y confirma que exista en SQLite.
// Distingue un id mal formado (400) de un id válido sin producto (404),
// para que todas las rutas respondan de forma coherente.
function normalizeId(rawId) {
  if (typeof rawId !== 'string') return { id: null, status: 400 };

  const limpio = rawId.trim();
  if (!/^\d+$/.test(limpio)) return { id: null, status: 400 };

  const id = Number(limpio);
  if (!Number.isSafeInteger(id)) return { id: null, status: 400 };
  if (!productModel.getById(id)) return { id, status: 404 };

  return { id, status: null };
}

module.exports = normalizeId;
