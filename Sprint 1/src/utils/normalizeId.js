// US#17: valida el FORMATO de un id que viene de la URL (req.params.id),
// que siempre llega como string, antes de usarlo en cualquier lado. No se
// fija si el producto existe (eso lo decide después el service/model);
// solo confirma que "parece un id posible": un número entero, sin
// decimales, sin signo, sin letras ni espacios raros mezclados.
//
// Devuelve el número ya convertido si es válido, o null si no lo es.
// Quien llama decide qué hacer con null (normalmente, responder 400).
function normalizeId(rawId) {
  if (typeof rawId !== 'string') return null;

  const limpio = rawId.trim();
  if (!/^\d+$/.test(limpio)) return null; // vacío, letras, decimales, negativos, etc.

  return Number(limpio);
}

module.exports = normalizeId;
