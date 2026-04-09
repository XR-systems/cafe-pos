const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/cafe.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Crear tablas
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Migraciones para DBs existentes
try { db.exec('ALTER TABLE products ADD COLUMN variants TEXT'); } catch (_) {}
try { db.exec("ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'pending'"); } catch (_) {}
try { db.exec('ALTER TABLE sale_items ADD COLUMN note TEXT'); } catch (_) {}
try { db.exec("ALTER TABLE sales ADD COLUMN payment_method TEXT DEFAULT 'efectivo'"); } catch (_) {}
// Las tablas expenses, goals y cash_registers se crean via schema.sql

// Seed menú real si la DB está vacía o tiene datos viejos (< 20 productos)
const { n } = db.prepare('SELECT COUNT(*) as n FROM products').get();
if (n < 20) {
  const j = (items) => JSON.stringify(items);
  const menu = [
    // ── CAFÉ ──────────────────────────────────────────────────────
    { id: 1,  name: 'Espresso',                price: 30,  category: 'cafe',     variants: null },
    { id: 2,  name: 'Americano',               price: 60,  category: 'cafe',     variants: j([{label:'Caliente',price:60},{label:'En las rocas',price:65}]) },
    { id: 3,  name: 'Latte',                   price: 75,  category: 'cafe',     variants: j([{label:'Caliente',price:75},{label:'En las rocas',price:80},{label:'Frappe',price:85}]) },
    { id: 4,  name: 'Capuccino',               price: 75,  category: 'cafe',     variants: j([{label:'Caliente',price:75},{label:'Frappe',price:85}]) },
    { id: 5,  name: 'Moka',                    price: 80,  category: 'cafe',     variants: j([{label:'Caliente',price:80},{label:'En las rocas',price:85},{label:'Frappe',price:95}]) },
    { id: 6,  name: 'Caramelo agave',          price: 80,  category: 'cafe',     variants: j([{label:'Caliente',price:80},{label:'En las rocas',price:85},{label:'Frappe',price:95}]) },
    { id: 7,  name: 'Dirty chai',              price: 95,  category: 'cafe',     variants: j([{label:'Caliente',price:95},{label:'En las rocas',price:100},{label:'Frappe',price:110}]) },
    { id: 8,  name: 'Cold brew',               price: 105, category: 'cafe',     variants: null },
    // ── BEBIDAS SIN CAFÉ ───────────────────────────────────────────
    { id: 9,  name: 'Chai',                    price: 85,  category: 'sin cafe', variants: j([{label:'Caliente',price:85},{label:'En las rocas',price:90},{label:'Frappe',price:100}]) },
    { id: 10, name: 'Matcha',                  price: 85,  category: 'sin cafe', variants: j([{label:'Caliente',price:85},{label:'En las rocas',price:90},{label:'Frappe',price:100}]) },
    { id: 11, name: 'Taro',                    price: 85,  category: 'sin cafe', variants: j([{label:'Caliente',price:85},{label:'En las rocas',price:90},{label:'Frappe',price:100}]) },
    { id: 12, name: 'Horchata',                price: 80,  category: 'sin cafe', variants: j([{label:'Caliente',price:80},{label:'En las rocas',price:85},{label:'Frappe',price:95}]) },
    { id: 13, name: 'Arroz con leche',         price: 80,  category: 'sin cafe', variants: j([{label:'Caliente',price:80},{label:'En las rocas',price:85},{label:'Frappe',price:95}]) },
    { id: 14, name: 'Tisana frutos del bosque',price: 85,  category: 'sin cafe', variants: j([{label:'Caliente',price:85},{label:'En las rocas',price:90},{label:'Frappe',price:100}]) },
    { id: 15, name: 'Fresate',                 price: 80,  category: 'sin cafe', variants: j([{label:'Regular',price:80},{label:'Frappe',price:90}]) },
    // ── PANES ──────────────────────────────────────────────────────
    { id: 16, name: 'Concha',                  price: 25,  category: 'panes',    variants: null },
    { id: 17, name: 'Cuernito',                price: 30,  category: 'panes',    variants: null },
    { id: 18, name: 'Oreja',                   price: 25,  category: 'panes',    variants: null },
    { id: 19, name: 'Polvoron',                price: 20,  category: 'panes',    variants: null },
    // ── COMIDA ─────────────────────────────────────────────────────
    { id: 20, name: 'Brownie',                 price: 45,  category: 'comida',   variants: null },
    { id: 21, name: 'Brownie con nieve',       price: 60,  category: 'comida',   variants: null },
    { id: 22, name: 'Rol de canela',           price: 45,  category: 'comida',   variants: null },
    { id: 23, name: 'Pastel de chocolate',     price: 85,  category: 'comida',   variants: null },
    { id: 24, name: 'Cheesecake',              price: 90,  category: 'comida',   variants: null },
    { id: 25, name: 'Cuernito talacha',        price: 90,  category: 'comida',   variants: null },
    { id: 26, name: 'Panini talacha',          price: 95,  category: 'comida',   variants: null },
  ];

  const ins = db.prepare(
    'INSERT OR REPLACE INTO products (id, name, price, category, variants, active) VALUES (?, ?, ?, ?, ?, 1)'
  );
  db.transaction(() => { for (const p of menu) ins.run(p.id, p.name, p.price, p.category, p.variants); })();
  console.log('🌱 Menú cargado');
}

console.log(`📦 Base de datos: ${DB_PATH}`);
module.exports = db;
