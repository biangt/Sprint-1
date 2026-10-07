// Responde con una vista común para errores de ID, conservando la diferencia
// entre una solicitud mal formada (400) y un producto inexistente (404).
function renderIdError(res, status) {
  const idInvalido = status === 400;

  return res.status(status).render('layouts/main', {
    page: 'notFound',
    titulo: idInvalido ? 'ZEUS - Solicitud inválida' : 'ZEUS - Página no encontrada',
    ...(idInvalido ? { mensaje: '400 - El id del producto no es válido.' } : {}),
  });
}

module.exports = renderIdError;