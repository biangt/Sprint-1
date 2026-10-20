// US#7: avisos visuales temporales ("toasts"). Se muestran un rato en la
// esquina de la pantalla y desaparecen solos, sin recargar la página.
//
// Un aviso puede llegar de dos maneras:
//  1) EN VIVO: el servidor manda el evento "cartEmpty" por el WebSocket
//     (lo reciben las pestañas que NO hicieron la acción).
//  2) DESDE LA PÁGINA: la pestaña que hizo la acción se recarga por el
//     redirect, así que el servidor deja un marcador [data-aviso] en /cart.
(function () {
  const DURACION_MS = 4000; // cuánto tiempo queda visible
  const FUNDIDO_MS = 300;   // duración del desvanecimiento (igual a duration-300 del CSS)

  const TEXTOS_CARRITO_VACIO = {
    cleared: 'El carrito se vació.',
    lastItemRemoved: 'Se quitó el último producto: el carrito quedó vacío.',
  };

  // Contenedor fijo donde se apilan los avisos. Se crea al cargar, antes de
  // que haga falta, para que los lectores de pantalla anuncien lo que se agregue.
  const lista = document.createElement('div');
  lista.id = 'avisos';
  lista.className = 'toast-container';
  lista.setAttribute('role', 'status');
  lista.setAttribute('aria-live', 'polite');
  document.body.appendChild(lista);

  function mostrarAviso(texto) {
    // Si ya hay uno igual en pantalla, no lo repetimos.
    if (Array.from(lista.children).some((aviso) => aviso.textContent === texto)) return;

    const aviso = document.createElement('div');
    aviso.className = 'toast';
    aviso.textContent = texto; // textContent: el texto nunca se interpreta como HTML
    lista.appendChild(aviso);

    // Pasado el tiempo, arranca el desvanecimiento y después se saca del DOM.
    setTimeout(() => {
      aviso.classList.add('toast--saliendo');
      setTimeout(() => aviso.remove(), FUNDIDO_MS);
    }, DURACION_MS);
  }

  function mostrarCarritoVacio(reason) {
    mostrarAviso(TEXTOS_CARRITO_VACIO[reason] || 'El carrito quedó vacío.');
  }

  // 1) En vivo, por el despachador de eventos de wsClient.js.
  if (window.zeusEvents) {
    window.zeusEvents.on('cartEmpty', (payload) => mostrarCarritoVacio(payload.reason));
  }

  // 2) Marcador que dejó el servidor en la página (ver cart.ejs).
  document.querySelectorAll('[data-aviso="cartEmpty"]').forEach((marcador) => {
    mostrarCarritoVacio(marcador.dataset.motivo);
    marcador.remove();
  });
})();
