// US#9: SERVICIO DE EVENTOS. Es el ÚNICO lugar de la aplicación que guarda
// las conexiones WebSocket y que envía mensajes por ellas.
//
//   wsServer.js (transporte)  ->  registrar / eliminar conexiones
//   controladores y app.js    ->  emitirA / emitirASesion / broadcast
//
// Los controladores nunca ven un socket: le piden al servicio "avisale a
// esta sesión" y el servicio se ocupa de buscar los sockets, validar el
// mensaje con el protocolo ({ type, payload }), enviarlo y dejarlo en el
// seguimiento (WS_LOG).
//
// CÓMO AGREGAR UNA NOTIFICACIÓN NUEVA (por ejemplo "stockBajo"):
//   1. protocol.js     -> sumar el tipo en EVENTOS.
//   2. un módulo *Events.js (como cartEvents.js) -> una función que arme
//      el mensaje con crearMensaje(tipo, payload).
//   3. donde ocurra el hecho -> eventService.emitirASesion(id, mensaje)
//      (o broadcast(mensaje) si es para todos).
//   4. navegador -> window.zeusEvents.on('stockBajo', (payload) => { ... }).
// Este archivo no se toca.
const { WebSocket } = require('ws');
const { EVENTOS, crearMensaje, serializar } = require('../websocket/protocol');
const { registrarEnviado } = require('../websocket/wsLogger');

// Cada cuántos milisegundos el servidor manda el "ping" (ver iniciarLatido).
const INTERVALO_LATIDO_MS = 25000;

// Las conexiones activas. Un Set no repite elementos y permite agregar y
// quitar un socket puntual sin recorrer nada.
const conexiones = new Set();

function estaAbierto(socket) {
  return socket.readyState === WebSocket.OPEN;
}

// --- 1) Registrar conexiones activas ---------------------------------

// Lo llama wsServer cuando un navegador se conecta. Si el socket ya se
// cerró (se fue durante el handshake de sesión) no tiene sentido guardarlo.
function registrar(socket) {
  if (!estaAbierto(socket)) return false;
  conexiones.add(socket);
  return true;
}

// --- 2) Eliminar conexiones cerradas ---------------------------------

// Lo llama wsServer cuando un socket se cierra. Devuelve true si estaba.
function eliminar(socket) {
  return conexiones.delete(socket);
}

// Cuántas conexiones hay activas ahora.
function contar() {
  return conexiones.size;
}

// --- 3) Emitir a una conexión específica -----------------------------

// serializar() valida que el mensaje tenga type y payload; si no los tiene,
// NO se envía y queda el error en la terminal. Devuelve true si se envió.
function emitirA(socket, mensaje) {
  if (!estaAbierto(socket)) return false;
  try {
    socket.send(serializar(mensaje));
  } catch (err) {
    console.error('[WS] Mensaje inválido, no se envió:', err.message);
    return false;
  }
  registrarEnviado(socket.sessionId, mensaje);
  return true;
}

// Reparte un mensaje a todas las conexiones que cumplan el filtro.
// El mensaje se valida y serializa UNA sola vez, no una por conexión.
// Devuelve a cuántas se envió (0 si el mensaje es inválido).
function repartir(mensaje, cumple) {
  let texto;
  try {
    texto = serializar(mensaje);
  } catch (err) {
    console.error('[WS] Mensaje inválido, no se envió:', err.message);
    return 0;
  }
  let enviados = 0;
  conexiones.forEach((socket) => {
    if (estaAbierto(socket) && cumple(socket)) {
      socket.send(texto);
      enviados++;
    }
  });
  return enviados;
}

// Emite solo a las conexiones de UNA sesión (las pestañas de una persona).
function emitirASesion(sessionId, mensaje) {
  const enviados = repartir(mensaje, (socket) => socket.sessionId === sessionId);
  registrarEnviado(sessionId, mensaje, enviados);
  return enviados;
}

// --- 4) Broadcast a todas las conexiones activas ---------------------

function broadcast(mensaje) {
  const enviados = repartir(mensaje, () => true);
  registrarEnviado('*', mensaje, enviados); // '*' se muestra como TODAS en el log
  return enviados;
}

// --- Latido ------------------------------------------------------------

// US#8: cada cierto tiempo manda { type: 'ping' } a todos. El navegador lo
// usa para detectar un servidor que dejó de responder. No pasa por
// registrarEnviado: se mandaría cada 25 s y llenaría el seguimiento.
// Devuelve el temporizador para poder detenerlo con clearInterval.
function iniciarLatido(intervaloMs = INTERVALO_LATIDO_MS) {
  const latido = setInterval(() => {
    repartir(crearMensaje(EVENTOS.PING), () => true);
  }, intervaloMs);
  latido.unref(); // que el intervalo no impida que el proceso termine
  return latido;
}

module.exports = { registrar, eliminar, contar, emitirA, emitirASesion, broadcast, iniciarLatido };
