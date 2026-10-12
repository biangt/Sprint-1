const { WebSocketServer } = require('ws');

// Significado de los códigos de cierre más habituales (RFC 6455)
const CODIGOS_CIERRE = {
  1000: 'Cierre normal',
  1001: 'El cliente se fue (pestaña cerrada o servidor apagándose)',
  1006: 'Cierre anormal: la conexión se cortó sin handshake de cierre',
};

// Guardamos acá el servidor WebSocket para poder consultarlo después
let wss = null;

// Crea el servidor WebSocket sobre el servidor HTTP que ya usa Express.
function initWebSocket(httpServer) {
  wss = new WebSocketServer({ server: httpServer });

  // "connection" se dispara cada vez que un navegador completa el handshake
  wss.on('connection', (socket) => {
    console.log(`[WS] Cliente conectado. Activos: ${wss.clients.size}`);

    socket.on('close', (code, reason) => {
        const significado = CODIGOS_CIERRE[code] || 'Código no catalogado';
        const motivo = reason.toString() || 'sin motivo';
        console.log(`[WS] Cliente desconectado. Código: ${code} (${significado}). Motivo: ${motivo}. Activos: ${wss.clients.size}`);
    });

    socket.on('error', (err) => {
      console.error('[WS] Error en la conexión:', err.message);
    });
  });

  return wss;
}

// Devuelve la colección de conexiones activas
function getClients() {
  return wss ? wss.clients : new Set();
}

module.exports = { initWebSocket, getClients };