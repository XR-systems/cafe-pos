const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/cafe.db');

// Crear directorio si no existe
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// WAL = más rápido para lecturas concurrentes
db.pragma('journal_mode = WAL');
// Activar claves foráneas (SQLite las desactiva por defecto)
db.pragma('foreign_keys = ON');

// Inicializar schema en cada arranque (CREATE IF NOT EXISTS es idempotente)
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

console.log(`📦 Base de datos: ${DB_PATH}`);

module.exports = db;
