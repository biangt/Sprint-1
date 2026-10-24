const categoriesService = require('../../services/categoriesService');

// Sprint 5 US#3: controlador de la API de categorías. No toca la base: todo
// pasa por categoriesService, y acá solo se decide el JSON y el código HTTP.

// Valida el id de la URL: formato (400) y existencia (404). Si hay error ya
// responde y devuelve null; si está bien devuelve el id como número.
// (normalizeId no sirve acá: busca el id entre los PRODUCTOS.)
function obtenerId(req, res) {
  const crudo = req.params.id.trim();
  const id = Number(crudo);
  if (!/^\d+$/.test(crudo) || !Number.isSafeInteger(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return null;
  }
  if (!categoriesService.getCategoryById(id)) {
    res.status(404).json({ error: 'Categoría no encontrada' });
    return null;
  }
  return id;
}

// Traduce el resultado del service a una respuesta. "exito" es el código
// HTTP si salió bien (201 al crear, 200 al modificar).
function responderEscritura(res, resultado, exito) {
  if (!resultado) return res.status(404).json({ error: 'Categoría no encontrada' });
  if (resultado.errores) return res.status(400).json({ error: 'Datos inválidos', detalles: resultado.errores });
  if (resultado.conflicto) return res.status(409).json({ error: resultado.conflicto });

  res.status(exito).json(resultado.categoria);
}

function getAll(req, res) {
  res.json(categoriesService.getAllCategories());
}

function getById(req, res) {
  const id = obtenerId(req, res);
  if (id === null) return;

  res.json(categoriesService.getCategoryById(id));
}

function create(req, res) {
  responderEscritura(res, categoriesService.createCategory(req.body), 201);
}

function update(req, res) {
  const id = obtenerId(req, res);
  if (id === null) return;

  responderEscritura(res, categoriesService.updateCategory(id, req.body), 200);
}

function remove(req, res) {
  const id = obtenerId(req, res);
  if (id === null) return;

  const resultado = categoriesService.deleteCategory(id);
  if (!resultado.ok && resultado.motivo === 'en-uso') {
    return res.status(409).json({ error: 'No se puede eliminar: la categoría tiene productos asociados' });
  }
  if (!resultado.ok) return res.status(404).json({ error: 'Categoría no encontrada' });

  res.json({ mensaje: 'Categoría eliminada', id });
}

module.exports = { getAll, getById, create, update, remove };
