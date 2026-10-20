const { WebSocketServer } = require('ws');
const { EVENTOS, crearMensaje, parsearMensaje } = require('./protocol');
const { ACTIVO: SEGUIMIENTO_ACTIVO, registrarRecibido } = require('./wsLogger');
// US#9: este archivo solo se ocupa del TRANSPORTE (abrir el servidor,
// aceptar conexiones, asociarlas a su sesión). Guardar conexiones y enviar
// mensajes es trabajo del servicio de eventos.
const eventService = require('../services/eventService');

// Significado de los códigos de cierre más habituales (RFC 6455)
const CODIGOS_CIERRE = {
  1000: 'Cierre normal',
  1001: 'El cliente se fue (pestaña cerrada o servidor apagándose)',
  1006: 'Cierre anormal: la conexión se cortó sin handshake de cierre',
};

// Crea el servidor WebSocket sobre el servidor HTTP que ya usa Express.
// alConectar(socket, session) es opcional: se ejecuta cuando un socket ya
// quedó asociado a su sesión (US#5 lo usa para mandarle el estado del carrito).
function initWebSocket(httpServer, sessionMiddleware, alConectar) {
  const wss = new WebSocketServer({ server: httpServer });

  if (SEGUIMIENTO_ACTIVO) {
    console.log('[WS] Seguimiento de mensajes ACTIVADO (WS_LOG): >> enviado, << recibido');
  }

  // US#8: latido (el servicio manda el "ping" cada cierto tiempo).
  const latido = eventService.iniciarLatido();
  wss.on('close', () => clearInterval(latido));

  // "connection" se dispara cada vez que un navegador completa el handshake

  wss.on('connection', (socket, req) => {
    // Corremos el middleware de sesión sobre el request del handshake
    // para leer la cookie y saber de qué sesión es este socket.
    sessionMiddleware(req, {}, () => {
      socket.sessionId = req.session ? req.session.id : null;
      eventService.registrar(socket); // US#9: queda en la lista de conexiones activas
      console.log(`[WS] Cliente conectado (sesión ${socket.sessionId}). Activos: ${eventService.contar()}`);

      if (alConectar && req.session) {
        try {
          alConectar(socket, req.session);
        } catch (err) {
          console.error('[WS] Error en alConectar:', err.message);
        }
      }
    });
    
    socket.on('close', (code, reason) => {
        eventService.eliminar(socket); // US#9: sale de la lista de conexiones activas
        const significado = CODIGOS_CIERRE[code] || 'Código no catalogado';
        const motivo = reason.toString() || 'sin motivo';
        console.log(`[WS] Cliente desconectado. Código: ${code} (${significado}). Motivo: ${motivo}. Activos: ${eventService.contar()}`);
    });

    // US#6: lo que manda el navegador también tiene que respetar { type, payload }.
    // Si no lo cumple, lo descartamos y le avisamos con un evento "error".
    socket.on('message', (data) => {
      const texto = data.toString();
      const resultado = parsearMensaje(texto);
      registrarRecibido(socket.sessionId, texto, resultado.ok ? null : resultado.error);
      if (!resultado.ok) {
        console.warn(`[WS] Mensaje inválido descartado: ${resultado.error}`);
        eventService.emitirA(socket, crearMensaje(EVENTOS.ERROR, { message: resultado.error }));
        return;
      }
      // Todavía no hay eventos que el navegador mande al servidor; cuando
      // los haya, se atienden acá según resultado.mensaje.type.
      console.log(`[WS] Evento recibido: ${resultado.mensaje.type}`);
    });

    socket.on('error', (err) => {
      console.error('[WS] Error en la conexión:', err.message);
    });
  });

  return wss;
}

module.exports = { initWebSocket };
