// =============================================================================
// registerForm.js
// -----------------------------------------------------------------------------
// Validación del lado del CLIENTE para el formulario de registro (US#3).
//
// ¿Qué hace este archivo?
// Cuando la persona hace click en "Registrarse", este script revisa los datos
// ANTES de que el navegador llegue a mandar la petición al servidor. Si algo
// está mal, cancela el envío (event.preventDefault()) y muestra los errores
// debajo de cada campo. Si todo está bien, no hace nada y deja que el
// formulario se envíe de forma normal (con su method="POST" y action="/register").
//
// Importante: esta validación es solo para dar feedback inmediato en pantalla.
// Cualquiera podría desactivar JavaScript o mandar la petición salteándose esta
// página (por ejemplo con Postman), así que el servidor SIEMPRE tiene que
// repetir estas mismas validaciones antes de crear la cuenta. Este archivo no
// reemplaza esa validación del lado del servidor, la complementa.
// =============================================================================

// "DOMContentLoaded" se dispara cuando el navegador ya armó todo el HTML de la
// página (aunque todavía no haya terminado de cargar imágenes, por ejemplo).
// Esperamos a ese momento para buscar el formulario, porque si este script se
// ejecutara antes de que el HTML exista, document.querySelector no encontraría nada.
document.addEventListener('DOMContentLoaded', function () {

  // -------------------------------------------------------------------------
  // Constantes de configuración de las reglas (US#3 - sección "Validación")
  // -------------------------------------------------------------------------

  // Nombre del sitio: la contraseña no puede contener esta palabra.
  // Se compara en minúsculas para que dé lo mismo "Zeus", "ZEUS" o "zeus".
  const NOMBRE_DEL_SITIO = 'zeus';

  // Cadenas de texto que la contraseña nunca puede contener, por ser
  // demasiado obvias/fáciles de adivinar.
  const CONTRASENAS_PROHIBIDAS = ['password', '1234', 'qwerty', 'admin', 'usuario', 'contraseña', 'contrasena', 'contrasenia'];

  // Expresión regular (regex) que detecta si un texto tiene AL MENOS una letra.
  // "i" al final = ignora mayúsculas/minúsculas (no es indispensable acá,
  // porque a-z ya cubre ambos casos gracias a cómo la escribimos, pero se dej
  // igual por claridad).
  const TIENE_LETRA = /[a-zA-Z]/;

  // Detecta si el texto tiene al menos un número (0 al 9).
  const TIENE_NUMERO = /[0-9]/;

  // Detecta si el texto tiene al menos uno de los caracteres especiales
  // pedidos por la consigna. Dentro de [ ] casi ningún caracter necesita
  // "escaparse" con \, pero igual hay que tener cuidado con algunos como
  // el guión o la barra invertida (acá no los usamos, así que no hace falta).
  const TIENE_CARACTER_ESPECIAL = /[!@#$%^&*(),.?":{}|<>]/;

  // Regex simple para validar que un email tenga la forma "algo@algo.algo".
  // No es 100% perfecta (validar emails al 100% con regex es casi imposible),
  // pero es más que suficiente para descartar los errores de tipeo comunes.
  const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // -------------------------------------------------------------------------
  // Enganchamos el formulario
  // -------------------------------------------------------------------------

  // Buscamos el formulario de registro por su clase (ver register.ejs, la
  // clase se llama "auth-form"). Si por algún motivo esta página no tiene
  // ningún formulario con esa clase, "formulario" va a ser null.
  const formulario = document.querySelector('.auth-form');

  // Si no hay formulario en la página, no tiene sentido seguir ejecutando el
  // resto del archivo (evita errores en la consola en otras páginas que
  // llegaran a cargar este mismo script por error).
  if (!formulario) {
    return;
  }

  // "submit" es el evento que se dispara cuando la persona aprieta el botón
  // de tipo "submit" (o presiona Enter dentro de un input del formulario).
  formulario.addEventListener('submit', function (evento) {
    // Antes de mostrar los errores nuevos, borramos los que hayan quedado
    // de un intento anterior (si la persona ya se había equivocado antes).
    limpiarErroresPrevios();

    const errores = validarFormulario();

    // Object.keys(errores).length cuenta cuántas propiedades tiene el
    // objeto "errores". Si hay al menos una, quiere decir que algo falló.
    if (Object.keys(errores).length > 0) {
      // preventDefault() es lo que efectivamente "evita el envío de la
      // petición" pedido por la consigna: sin esto, el navegador mandaría
      // igual el formulario al servidor apenas termine esta función.
      evento.preventDefault();
      mostrarErrores(errores);
    }
    // Si no entramos al "if", no hacemos nada más: dejamos que el
    // formulario se envíe solo, como si este script no existiera.
  });

  // -------------------------------------------------------------------------
  // Funciones de ayuda para leer valores del formulario
  // -------------------------------------------------------------------------

  // Busca un <input> por su atributo "name" (por ejemplo name="email") y
  // devuelve el texto que la persona escribió ahí.
  // Devuelve null si ese campo no existe en el HTML de esta página, para que
  // el resto del código pueda decidir qué hacer sin romperse (ver más abajo
  // el comentario sobre el campo "apellido").
  function obtenerValor(nombreDelCampo) {
    const campo = formulario.querySelector('[name="' + nombreDelCampo + '"]');
    return campo ? campo.value : null;
  }

  // -------------------------------------------------------------------------
  // Función principal de validación
  // -------------------------------------------------------------------------

  // Revisa todos los campos y devuelve un objeto con los errores encontrados.
  // La clave de cada propiedad es el "name" del campo (así sabemos debajo de
  // cuál input mostrar el mensaje) y el valor es el texto del error.
  // Si el objeto queda vacío ({}), quiere decir que no se encontró ningún error.
  function validarFormulario() {
    const errores = {};

    // NOTA IMPORTANTE: el formulario actual (register.ejs) todavía no tiene
    // un campo "apellido", aunque la consigna de la US#3 lo pide. Usamos
    // obtenerValor('apellido'), que va a devolver null en ese caso. Todas las
    // validaciones de apellido están escritas para saltearse solas cuando el
    // campo no existe (con "apellido !== null"), así que en cuanto agreguen
    // el campo al HTML, estas reglas van a empezar a aplicarse sin tocar
    // nada más acá.
    const nombre = obtenerValor('nombre');
    const apellido = obtenerValor('apellido');
    const email = obtenerValor('email');
    const password = obtenerValor('password');
    const password2 = obtenerValor('password2');

    // --- Regla: "los campos no están en blanco" ---
    // .trim() saca los espacios del principio y del final antes de comparar,
    // así un campo con solo espacios ("   ") también cuenta como vacío.
    if (nombre !== null && nombre.trim() === '') {
      errores.nombre = 'El nombre no puede estar vacío.';
    }
    if (apellido !== null && apellido.trim() === '') {
      errores.apellido = 'El apellido no puede estar vacío.';
    }
    if (email !== null && email.trim() === '') {
      errores.email = 'El email no puede estar vacío.';
    }
    if (password !== null && password.trim() === '') {
      errores.password = 'La contraseña no puede estar vacía.';
    }

    // --- Regla: "los campos no tienen espacios en blanco al principio o al final" ---
    // Esta regla es DISTINTA a la de "no vacío": acá el campo SÍ tiene texto,
    // pero ese texto arranca o termina con un espacio (por ejemplo " Juan").
    // Comparamos el valor original contra el valor recortado con trim(): si
    // son distintos, es porque había espacios de sobra.
    // Solo la chequeamos si el campo no está vacío, para no pisar el mensaje
    // de "no puede estar vacío" que ya pusimos arriba.
    if (nombre && nombre.trim() !== '' && nombre !== nombre.trim()) {
      errores.nombre = 'El nombre no debe tener espacios al principio o al final.';
    }
    if (apellido && apellido.trim() !== '' && apellido !== apellido.trim()) {
      errores.apellido = 'El apellido no debe tener espacios al principio o al final.';
    }
    if (email && email.trim() !== '' && email !== email.trim()) {
      errores.email = 'El email no debe tener espacios al principio o al final.';
    }
    if (password && password.trim() !== '' && password !== password.trim()) {
      errores.password = 'La contraseña no debe tener espacios al principio o al final.';
    }

    // --- Regla: "el email es válido" ---
    // Solo probamos el formato si todavía no hay un error de "vacío" o de
    // "espacios" para el email (no tendría sentido decir "formato inválido"
    // sobre un campo que ni siquiera se completó).
    if (email && !errores.email && !EMAIL_VALIDO.test(email.trim())) {
      errores.email = 'El email no tiene un formato válido (ejemplo: nombre@dominio.com).';
    }

    // --- Reglas de la contraseña ---
    // Solo las evaluamos si la contraseña tiene contenido y todavía no tiene
    // un error previo (así no acumulamos varios mensajes pisándose entre sí:
    // mostramos el primer problema que encontremos, de arriba hacia abajo).
    if (password && !errores.password) {
      if (password.length < 8) {
        errores.password = 'La contraseña debe tener al menos 8 caracteres.';
      } else if (!TIENE_LETRA.test(password)) {
        errores.password = 'La contraseña debe incluir al menos una letra.';
      } else if (!TIENE_NUMERO.test(password)) {
        errores.password = 'La contraseña debe incluir al menos un número.';
      } else if (!TIENE_CARACTER_ESPECIAL.test(password)) {
        errores.password = 'La contraseña debe incluir al menos un carácter especial (! @ # $ % ^ & * ( ) , . ? " : { } | < >).';
      } else if (contieneCadenaProhibida(password, nombre, apellido, email)) {
        errores.password = 'La contraseña es demasiado fácil de adivinar (no puede contener "password", "1234", "qwerty", el nombre del sitio, ni tu propio nombre/apellido).';
      } else if (email && password.toLowerCase() === email.toLowerCase()) {
        errores.password = 'La contraseña no puede ser igual al email.';
      }
    }

    // --- Extra (no pedido explícitamente por la consigna, pero tiene sentido
    // porque el formulario le pide a la persona repetir la contraseña):
    // si "password" y "password2" no coinciden, hay un error de tipeo. ---
    if (password2 !== null && password && password2 && password !== password2) {
      errores.password2 = 'Las contraseñas no coinciden.';
    }

    return errores;
  }

  // Revisa si "password" contiene, en cualquier parte y sin importar
  // mayúsculas/minúsculas, alguna de las cadenas prohibidas: las fijas
  // (CONTRASENAS_PROHIBIDAS), el nombre del sitio, o el nombre/apellido que
  // la persona escribió en este mismo formulario.
  function contieneCadenaProhibida(password, nombre, apellido, email) {
    const passwordEnMinusculas = password.toLowerCase();

    // Armamos una lista con todo lo que está prohibido. Filtramos los
    // valores vacíos o inexistentes (por ejemplo "apellido" cuando ese
    // campo todavía no existe en el HTML) para no comparar contra "".
    const prohibidas = CONTRASENAS_PROHIBIDAS
      .concat([NOMBRE_DEL_SITIO])
      .concat([nombre, apellido])
      .filter(function (texto) {
        return texto && texto.trim() !== '';
      })
      .map(function (texto) {
        return texto.trim().toLowerCase();
      });

    // .some(...) devuelve true apenas encuentra UNA cadena prohibida
    // contenida dentro de la contraseña (indexOf !== -1 significa "la
    // encontró en algún lugar del texto").
    return prohibidas.some(function (cadena) {
      return passwordEnMinusculas.indexOf(cadena) !== -1;
    });
  }

  // -------------------------------------------------------------------------
  // Funciones para mostrar/ocultar los mensajes de error en pantalla
  // -------------------------------------------------------------------------

  // Muestra, debajo de cada campo con error, un mensaje con la clase
  // "form-group__error" (la misma clase que ya usa formGroup.ejs cuando el
  // servidor manda un error, así el mensaje se ve exactamente igual sin
  // necesidad de escribir estilos nuevos).
  function mostrarErrores(errores) {
    // Object.keys(errores) da un arreglo con los nombres de campo que
    // tuvieron error, por ejemplo: ['email', 'password'].
    Object.keys(errores).forEach(function (nombreDelCampo) {
      const campo = formulario.querySelector('[name="' + nombreDelCampo + '"]');
      if (!campo) return; // por las dudas, si el campo no existe no hacemos nada

      // ".form-group" es el <div> que envuelve a cada label+input (ver
      // formGroup.ejs). closest() sube por los "padres" del elemento hasta
      // encontrar el primero que tenga esa clase.
      const contenedor = campo.closest('.form-group');
      if (!contenedor) return;

      const mensaje = document.createElement('small');
      mensaje.className = 'form-group__error';
      mensaje.textContent = errores[nombreDelCampo];
      contenedor.appendChild(mensaje);

      // Además le agregamos una clase al input para que se pueda resaltar
      // visualmente con un borde rojo, por ejemplo (esa clase todavía no
      // tiene estilos definidos en tailwind.css; se puede agregar si se
      // quiere ese efecto).
      campo.classList.add('input--error');
    });
  }

  // Saca del HTML todos los mensajes de error que haya dejado un intento de
  // envío anterior, y le quita la clase "input--error" a los campos. Así,
  // si la persona corrige un dato y vuelve a enviar el formulario, no se le
  // van acumulando mensajes viejos encima de los nuevos.
  function limpiarErroresPrevios() {
    formulario.querySelectorAll('.form-group__error').forEach(function (mensaje) {
      mensaje.remove();
    });
    formulario.querySelectorAll('.input--error').forEach(function (campo) {
      campo.classList.remove('input--error');
    });
  }
});
