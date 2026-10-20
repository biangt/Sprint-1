//ver despues si declaraciones de constantes se pueden dejar mas prolijas

// US#2: cliente WebSocket del navegador. Abre UNA sola conexión por
// pestaña y refleja su estado en el indicador del header.
(function () {
  const indicador = document.getElementById('estado-conexion');
  if (!indicador) return;
  const texto = indicador.querySelector('[data-estado-texto]');

  // Cambia el texto y el data-estado; el color lo resuelve el CSS.
  // US#8: ahora hay tres estados (antes eran solo conectado / desconectado).
  const TEXTOS_ESTADO = {
    conectado: 'Conectado',
    reconectando: 'Reconectando…',
    desconectado: 'Desconectado',
  };
  function mostrarEstado(estado) {
    indicador.dataset.estado = estado;
    texto.textContent = TEXTOS_ESTADO[estado];
  }

  // ws:// en http y wss:// en https. location.host incluye el puerto.
  const protocolo = location.protocol === 'https:' ? 'wss://' : 'ws://';
  const URL_SOCKET = `${protocolo}${location.host}`;

  const badge = document.querySelector('.cart-button__badge');
  const enlaceCarrito = document.querySelector('.cart-button');

  // Cambia el numerito del carrito sin recargar la página
  function actualizarContador(cantidad) {
    if (!badge) return;
    badge.textContent = cantidad;
    if (enlaceCarrito) {
      enlaceCarrito.setAttribute('aria-label', `Ver carrito (${cantidad} productos)`);
    }
  }

  // US#6: despachador de eventos. Este es el ÚNICO lugar que recibe los
  // mensajes crudos del socket: los convierte de texto a objeto, comprueba
  // que sean { type, payload } y se los entrega a quien dijo "me interesa
  // este type" mediante zeusEvents.on(type, manejador).
  const manejadores = {};

  window.zeusEvents = {
    on(type, manejador) {
      if (!manejadores[type]) manejadores[type] = [];
      manejadores[type].push(manejador);
    },
  };

  // US#8: esta función es el cuerpo del antiguo listener de 'message'. Ahora
  // es una función suelta porque cada socket nuevo (uno por reconexión) la
  // reutiliza en vez de repetir el código.
  function despachar(event) {
    let mensaje;
    try {
      mensaje = JSON.parse(event.data);
    } catch {
      console.warn('[WS] Llegó un mensaje que no es JSON, se ignora:', event.data);
      return;
    }
    if (!mensaje || typeof mensaje.type !== 'string' || !mensaje.payload || typeof mensaje.payload !== 'object') {
      console.warn('[WS] Llegó un mensaje sin type o sin payload, se ignora:', mensaje);
      return;
    }
    const lista = manejadores[mensaje.type];
    if (!lista) {
      console.warn(`[WS] Evento desconocido: "${mensaje.type}"`);
      return;
    }
    lista.forEach((manejador) => manejador(mensaje.payload));
  }

  // Evento "cartUpdated": actualiza el numerito del carrito del header.
  window.zeusEvents.on('cartUpdated', (payload) => actualizarContador(payload.items));

  // US#8: el latido del servidor no hace nada visible; solo prueba que el
  // servidor sigue ahí (ver el vigilante más abajo). Se registra para que
  // el despachador no avise "evento desconocido".
  window.zeusEvents.on('ping', () => {});

  // ---------------------------------------------------------------
  // US#8: reconexión automática
  // ---------------------------------------------------------------
  const ESPERA_INICIAL_MS = 1000;   // primera espera antes de reintentar
  const ESPERA_MAXIMA_MS = 15000;   // la espera nunca pasa de esto
  const SILENCIO_MAXIMO_MS = 60000; // sin NADA del servidor por tanto tiempo = se cayó

  let socket = null;                  // la conexión vigente (o null si no hay)
  let intentos = 0;                   // reintentos seguidos que fallaron
  let temporizadorReconexion = null;  // el reintento que está agendado (si hay)
  let vigilante = null;               // el reloj que detecta un servidor mudo
  let paginaCerrandose = false;       // true si el navegador está saliendo de esta página

  // Vigilante: se reinicia con cada mensaje recibido (el servidor manda un
  // ping cada 25 s, así que en una conexión sana nunca llega a 60 s). Si
  // vence, el servidor dejó de responder aunque el socket diga "abierto".
  function reiniciarVigilante() {
    clearTimeout(vigilante);
    vigilante = setTimeout(() => perderConexion(socket), SILENCIO_MAXIMO_MS);
  }

  // Abre una conexión nueva y le engancha los listeners.
  function conectar() {
    const actual = new WebSocket(URL_SOCKET);
    socket = actual;
    window.zeusSocket = actual; // los demás scripts usan siempre la vigente

    actual.addEventListener('open', () => {
      if (actual !== socket) return;
      intentos = 0;              // conectó: se empieza de cero la próxima vez
      mostrarEstado('conectado');
      reiniciarVigilante();
    });
    actual.addEventListener('close', () => perderConexion(actual));
    // Tras un 'error' el navegador siempre dispara 'close', y ahí se reintenta.
    actual.addEventListener('error', () => {});
    actual.addEventListener('message', (event) => {
      if (actual !== socket) return; // mensaje de un socket ya descartado
      reiniciarVigilante();
      despachar(event);
    });
  }

  // La conexión se cayó (close), el servidor dejó de responder (vigilante)
  // o se cortó la red (offline): se muestra "Reconectando…" y se agenda un reintento.
  function perderConexion(origen) {
    // Ignora: sin socket, eventos de un socket viejo, o la página yéndose.
    if (!origen || origen !== socket || paginaCerrandose) return;
    clearTimeout(vigilante);
    socket = null;
    try { origen.close(); } catch { /* ya estaba cerrado */ }
    mostrarEstado('reconectando');
    programarReconexion();
  }

  // Espera 1 s, 2 s, 4 s, 8 s, 15 s, 15 s... (backoff exponencial) más un
  // poco al azar, para que si muchas pestañas se caen a la vez no vuelvan
  // todas en el mismo instante.
  function programarReconexion() {
    if (temporizadorReconexion) return; // ya hay un reintento agendado
    const base = Math.min(ESPERA_INICIAL_MS * 2 ** intentos, ESPERA_MAXIMA_MS);
    intentos++;
    temporizadorReconexion = setTimeout(() => {
      temporizadorReconexion = null;
      conectar();
    }, base + Math.random() * 500);
  }

  // Si el navegador avisa que volvió la red, no hace falta esperar el turno.
  window.addEventListener('online', () => {
    if (!temporizadorReconexion) return;
    clearTimeout(temporizadorReconexion);
    temporizadorReconexion = null;
    conectar();
  });
  // Si avisa que se fue la red, lo mostramos enseguida.
  window.addEventListener('offline', () => perderConexion(socket));

  // Al navegar a otra página el navegador cierra el socket (código 1001).
  // Eso NO es una caída: no hay que reintentar ni mostrar "Reconectando…".
  window.addEventListener('pagehide', () => { paginaCerrandose = true; });
  // Excepción: si la página vuelve del caché "atrás/adelante" del navegador,
  // su socket está muerto y hay que reconectar.
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    paginaCerrandose = false;
    perderConexion(socket);
  });

  conectar();
})();
