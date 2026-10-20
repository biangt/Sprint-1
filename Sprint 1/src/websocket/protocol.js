// US#6: protocolo de mensajes del WebSocket.
// TODO lo que viaja por el socket (servidor -> navegador y navegador ->
// servidor) es un objeto con esta forma, convertido a texto JSON:
//
//   { "type": "cartUpdated", "payload": { "items": 4, "total": 8500, ... } }
//
//   type    -> texto que dice QUÉ pasó (permite identificar el evento).
//   payload -> objeto con los datos de ese evento (puede estar vacío: {}).

// Lista de eventos que existen. Usar estas constantes (y no escribir el
// texto a mano en cada archivo) evita errores de tipeo.
const EVENTOS = Object.freeze({
  CART_UPDATED: 'cartUpdated', // servidor -> navegador: el carrito cambió / estado actual
  CART_EMPTY: 'cartEmpty',     // servidor -> navegador: el carrito acaba de quedar vacío
  PING: 'ping',                // servidor -> navegador: "sigo vivo" (latido, US#8)
  ERROR: 'error',              // servidor -> navegador: mandaste un mensaje inválido
});

// Lanza un Error si el mensaje no cumple el protocolo.
function validarMensaje(mensaje) {
  if (mensaje === null || typeof mensaje !== 'object' || Array.isArray(mensaje)) {
    throw new Error('El mensaje debe ser un objeto { type, payload }');
  }
  if (typeof mensaje.type !== 'string' || mensaje.type.trim() === '') {
    throw new Error('El mensaje necesita un "type" (texto no vacío)');
  }
  if (mensaje.payload === null || typeof mensaje.payload !== 'object' || Array.isArray(mensaje.payload)) {
    throw new Error('El mensaje necesita un "payload" (objeto)');
  }
}

// Única forma de FABRICAR un mensaje: siempre sale con type y payload.
function crearMensaje(type, payload = {}) {
  const mensaje = { type, payload };
  validarMensaje(mensaje);
  return mensaje;
}

// Convierte un mensaje a texto JSON para enviarlo, validándolo antes.
function serializar(mensaje) {
  validarMensaje(mensaje);
  return JSON.stringify(mensaje);
}

// Convierte el texto que llegó del navegador en un mensaje, o explica por
// qué no sirve. Devuelve { ok: true, mensaje } o { ok: false, error }.
function parsearMensaje(texto) {
  let mensaje;
  try {
    mensaje = JSON.parse(texto);
  } catch {
    return { ok: false, error: 'El mensaje no es JSON válido' };
  }
  try {
    validarMensaje(mensaje);
  } catch (err) {
    return { ok: false, error: err.message };
  }
  return { ok: true, mensaje };
}

module.exports = { EVENTOS, crearMensaje, serializar, parsearMensaje };
