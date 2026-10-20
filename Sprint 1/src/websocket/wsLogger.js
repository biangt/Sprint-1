// Seguimiento de mensajes del WebSocket, pensado para estudiar cómo se
// comunican servidor y navegador. Muestra en la terminal cada mensaje que el
// servidor ENVÍA (>>) y cada mensaje que RECIBE (<<).
//
// INTERRUPTOR: está apagado por defecto. Se enciende con la variable de
// entorno WS_LOG (valores "1" o "true"). En PowerShell:
//     $env:WS_LOG = "1"; npm start        (encendido)
//     Remove-Item Env:WS_LOG              (apagarlo en esa misma terminal)
const ACTIVO = ['1', 'true'].includes(String(process.env.WS_LOG).toLowerCase());

// El id de sesión es largo; con los primeros 6 caracteres alcanza para
// distinguir a una persona de otra.
function abreviarSesion(sessionId) {
  if (sessionId === '*') return 'TODAS'; // US#9: broadcast a todas las conexiones
  return sessionId ? `${String(sessionId).slice(0, 6)}...` : 'sin-sesion';
}

// Recorta un texto largo para que el log siga siendo una línea legible.
function recortar(texto, maximo = 120) {
  return texto.length > maximo ? `${texto.slice(0, maximo)}...` : texto;
}

// Muestra el payload en una línea. Las listas (como "products") se
// resumen como [...N] en vez de imprimir todos sus elementos.
function resumirPayload(payload) {
  const texto = JSON.stringify(payload, (clave, valor) => (
    Array.isArray(valor) ? `[...${valor.length}]` : valor
  ));
  return recortar(texto.replace(/"(\[\.\.\.\d+\])"/g, '$1'));
}

// Un mensaje que el servidor envió. destinatarios (opcional) es la cantidad
// de pestañas que lo recibieron cuando se reparte a toda una sesión.
function registrarEnviado(sessionId, mensaje, destinatarios) {
  if (!ACTIVO) return;
  const alcance = destinatarios === undefined ? '' : `  (a ${destinatarios} pestaña${destinatarios === 1 ? '' : 's'})`;
  console.log(`[WS] >> ENVIADO   ${abreviarSesion(sessionId)}  ${mensaje.type}  ${resumirPayload(mensaje.payload)}${alcance}`);
}

// Un mensaje que llegó del navegador, tal cual llegó (texto crudo).
// motivoDescarte (opcional) explica por qué no cumple el protocolo.
function registrarRecibido(sessionId, textoCrudo, motivoDescarte) {
  if (!ACTIVO) return;
  const descarte = motivoDescarte ? `  (descartado: ${motivoDescarte})` : '';
  console.log(`[WS] << RECIBIDO  ${abreviarSesion(sessionId)}  ${recortar(textoCrudo)}${descarte}`);
}

module.exports = { ACTIVO, registrarEnviado, registrarRecibido };
