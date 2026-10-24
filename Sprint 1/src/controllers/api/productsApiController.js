const productsService = require('../../services/productsService');
const normalizeId = require('../../utils/normalizeId');

// Sprint 5 US#2: controlador de la API de productos. Igual que el de las
// vistas, no toca la base: le pide todo a productsService. La diferencia es
// que acá se responde con res.json() y códigos de estado HTTP.

// Reutiliza normalizeId (el mismo que usan las vistas): distingue un id mal
// formado (400) de uno válido que no existe (404). Si hay error ya responde
// y devuelve null; si está todo bien devuelve el id como número.
function obtenerId(req, res) {
  const { id, status } = normalizeId(req.params.id);
  if (status === 400) {
    res.status(400).json({ error: 'ID inválido' });
    return null;
  }
  if (status === 404) {
    res.status(404).json({ error: 'Producto no encontrado' });
    return null;
  }
  return id;
}

function getAll(req, res) {
  res.json(productsService.getAllProducts());
}

function getById(req, res) {
  const id = obtenerId(req, res);
  if (id === null) return;

  res.json(productsService.getProductById(id));
}

function create(req, res) {
  const { errores, producto } = productsService.createProduct(req.body);
  if (errores) return res.status(400).json({ error: 'Datos inválidos', detalles: errores });

  res.status(201).json(producto);
}

function update(req, res) {
  const id = obtenerId(req, res);
  if (id === null) return;

  const resultado = productsService.updateProduct(id, req.body);
  if (!resultado) return res.status(404).json({ error: 'Producto no encontrado' });
  if (resultado.errores) return res.status(400).json({ error: 'Datos inválidos', detalles: resultado.errores });

  res.json(resultado.producto);
}

function remove(req, res) {
  const id = obtenerId(req, res);
  if (id === null) return;

  productsService.deleteProduct(id);
  res.json({ mensaje: 'Producto eliminado', id });
}

module.exports = { getAll, getById, create, update, remove };
