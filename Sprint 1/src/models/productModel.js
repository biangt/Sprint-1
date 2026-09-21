const productos = require('../../data/productos.json');

function getAll() {
  return productos;
}

function getById(id) {
  return productos.find((producto) => producto.id === Number(id));
}

// Baraja una COPIA del arreglo recibido (Fisher-Yates), sin tocar el
// original. La reutilizan tanto getSugeridos como getMasPedidos.
function barajar(arreglo) {
  const copia = [...arreglo];

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia;
}

// US#6: hasta "cantidad" productos elegidos al azar para "Te puede interesar".
function getSugeridos(cantidad = 5) {
  return barajar(productos).slice(0, Math.min(cantidad, productos.length));
}

// US#7: hasta "cantidad" productos para "Los más pedidos". Primero toma los
// que están marcados con "destacado: true" en productos.json; si no
// alcanzan para completar el cupo, rellena al azar con el resto del
// catálogo. "excluirIds" sirve para no repetir productos que ya se
// muestran en otra sección de la Home (por ejemplo, los sugeridos).
function getMasPedidos(cantidad = 10, excluirIds = []) {
  const disponibles = productos.filter((producto) => !excluirIds.includes(producto.id));
  const destacados = disponibles.filter((producto) => producto.destacado);
  const resto = disponibles.filter((producto) => !producto.destacado);

  const seleccion = destacados.slice(0, cantidad);
  const faltantes = cantidad - seleccion.length;

  if (faltantes > 0) {
    seleccion.push(...barajar(resto).slice(0, faltantes));
  }

  return seleccion;
}

// US#8: hasta "cantidad" productos de la MISMA categoría que "producto"
// (sin incluirlo a él mismo), para la sección "Productos relacionados" de
// /products/:id. Si el producto no tiene categoría, o no hay otros
// productos en esa categoría, devuelve un array vacío — la vista se
// encarga de mostrar el mensaje de "no hay relacionados" en ese caso.
function getRelacionados(producto, cantidad = 4) {
  if (!producto || !producto.categoriaId) return [];

  const mismaCategoria = productos.filter(
    (p) => p.categoriaId === producto.categoriaId && p.id !== producto.id
  );

  return barajar(mismaCategoria).slice(0, Math.min(cantidad, mismaCategoria.length));
}

// US#10: todos los productos de una categoría puntual (para
// /categories/:category). A diferencia de getRelacionados, acá no se
// recorta ni se mezcla nada: la US pide mostrar TODOS los coincidentes.
function getByCategoria(categoriaId) {
  return productos.filter((producto) => producto.categoriaId === categoriaId);
}

module.exports = { getAll, getById, getSugeridos, getMasPedidos, getRelacionados, getByCategoria };
