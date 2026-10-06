// db/migrate.js
//
// Script de migración de un solo uso: traslada los datos de
// data/categorias.json y data/productos.json hacia SQLite.
//
// Se corre a mano desde la terminal, NUNCA se importa desde app.js:
//   node db/migrate.js
//
// Es seguro correrlo más de una vez: usa INSERT OR IGNORE junto con los
// mismos "id" que ya traen los JSON, así que si una fila ya existe
// (mismo id = misma primary key), SQLite la ignora en vez de duplicarla.

const fs = require('fs');
const path = require('path');
const db = require('./database');

// 1. Migramos primero las categorías.
//    Es un prerrequisito técnico: como database.js activa
//    "PRAGMA foreign_keys = ON", products.categoria_id no puede apuntar
//    a una categoría que no exista todavía en la tabla categories.
function migrarCategorias() {
  const categoriasPath = path.join(__dirname, '..', 'data', 'categorias.json');
  const categorias = JSON.parse(fs.readFileSync(categoriasPath, 'utf8'));

  const insertCategoria = db.prepare(`
    INSERT OR IGNORE INTO categories (id, nombre, slug, icono)
    VALUES (@id, @nombre, @slug, @icono)
  `);

  let insertadas = 0;
  for (const categoria of categorias) {
    const resultado = insertCategoria.run(categoria);
    if (resultado.changes > 0) insertadas++;
  }

  console.log(`Categorías: ${insertadas} insertadas, ${categorias.length - insertadas} ya existían.`);
}

// 2. Migramos los productos, ahora que sus categorías ya están cargadas.
function migrarProductos() {
  const productosPath = path.join(__dirname, '..', 'data', 'productos.json');
  const productos = JSON.parse(fs.readFileSync(productosPath, 'utf8'));

  const insertProducto = db.prepare(`
    INSERT OR IGNORE INTO products (id, nombre, descripcion, precio_puntos, stock, categoria_id, imagen, destacado)
    VALUES (@id, @nombre, @descripcion, @precio_puntos, @stock, @categoria_id, @imagen, @destacado)
  `);

  let insertados = 0;
  for (const producto of productos) {
    // Mapeamos los campos del JSON (algunos con nombres distintos) a las
    // columnas de la tabla, y normalizamos "destacado" a 0/1 porque
    // SQLite no tiene un tipo booleano nativo.
    const fila = {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? null,
      precio_puntos: producto.precioEnPuntos,
      stock: producto.stock ?? 0,
      categoria_id: producto.categoriaId ?? null,
      imagen: producto.imagen ?? null,
      destacado: producto.destacado ? 1 : 0,
    };

    const resultado = insertProducto.run(fila);
    if (resultado.changes > 0) insertados++;
  }

  console.log(`Productos: ${insertados} insertados, ${productos.length - insertados} ya existían.`);
}

migrarCategorias();
migrarProductos();

console.log('Migración completada.');
