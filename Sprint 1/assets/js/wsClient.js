// US#2: cliente WebSocket del navegador. Abre UNA sola conexión por
// pestaña y refleja su estado en el indicador del header.
(function () {
  const indicador = document.getElementById('estado-conexion');
  if (!indicador) return;
  const texto = indicador.querySelector('[data-estado-texto]');

  // Cambia el texto y el data-estado; el color lo resuelve el CSS.
  function mostrarEstado(conectado) {
    indicador.dataset.estado = conectado ? 'conectado' : 'desconectado';
    texto.textContent = conectado ? 'Conectado' : 'Desconectado';
  }

  // ws:// en http y wss:// en https. location.host incluye el puerto.
  const protocolo = location.protocol === 'https:' ? 'wss://' : 'ws://';
  const socket = new WebSocket(`${protocolo}${location.host}`);

  socket.addEventListener('open', () => mostrarEstado(true));
  socket.addEventListener('close', () => mostrarEstado(false));
  socket.addEventListener('error', () => mostrarEstado(false));

  // Se expone para que las próximas US usen LA MISMA conexión en vez
  // de abrir una nueva por cada script.
  window.zeusSocket = socket;
})();
