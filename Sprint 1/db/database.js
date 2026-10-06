// db/database.js

// 1. Importamos las librerías necesarias:
//    - better-sqlite3: el driver que nos permite hablar con SQLite de forma síncrona.
//    - path: módulo nativo de Node para construir rutas de archivos de forma segura,
//      sin importar el sistema operativo (Windows/Linux/Mac usan separadores distintos).
//    - fs: módulo nativo de Node para leer archivos del disco (lo usamos para leer schema.sql).
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 2. Definimos la ruta donde va a vivir el archivo físico de la base de datos.
//    path.join arma la ruta correcta uniendo __dirname (carpeta actual, /db)
//    con el nombre del archivo. Si el archivo no existe, better-sqlite3 lo crea acá.
const dbPath = path.join(__dirname, 'database.sqlite');

// 3. Abrimos la conexión. Esta línea es la que efectivamente crea el archivo .sqlite
//    en disco si todavía no existe (vacío, sin tablas).
const db = new Database(dbPath);

// 4. Leemos el contenido de schema.sql como texto plano.
//    'utf8' le dice a fs que devuelva un string en vez de un Buffer binario.
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// 5. Ejecutamos el schema completo contra la base.
//    .exec() corre múltiples sentencias SQL separadas por ";" de una sola vez.
//    Como cada CREATE TABLE tiene "IF NOT EXISTS", esto es seguro de correr
//    en cada arranque del servidor: la primera vez crea las tablas,
//    las siguientes veces no hace nada porque ya existen.
db.exec(schema);

// 6. (Opcional pero recomendado) Activamos el chequeo de foreign keys.
//    SQLite las trae desactivadas por defecto; sin esta línea, las relaciones
//    definidas en schema.sql (por ejemplo products -> categories) no se
//    hacen cumplir realmente, quedan solo como documentación.
db.pragma('foreign_keys = ON');

// 7. Exportamos la conexión ya lista para usar.
//    Gracias al cache de módulos de Node, este archivo se ejecuta una sola vez
//    sin importar cuántas veces se haga require('../db/database') en el resto
//    del proyecto: todos reciben la misma instancia de conexión.
module.exports = db;
