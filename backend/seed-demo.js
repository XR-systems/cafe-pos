/**
 * seed-demo.js
 * Carga datos de ejemplo para mostrar el MVP al cliente.
 * Uso: node seed-demo.js
 */

const db = require('./src/db/database');

console.log('🌱 Cargando datos de demo...\n');

// ─── Clientes de ejemplo ───
const clientes = [
  { name: 'Ana García',   whatsapp: '5491155001122', visits: 8  },
  { name: 'Carlos López', whatsapp: '5491166002233', visits: 3  },
  { name: 'María Torres', whatsapp: '5491177003344', visits: 12 },
];

const insertCliente = db.prepare(`
  INSERT OR IGNORE INTO customers (name, whatsapp, visits, last_visit)
  VALUES (?, ?, ?, CURRENT_TIMESTAMP)
`);

for (const c of clientes) {
  insertCliente.run(c.name, c.whatsapp, c.visits);
}
console.log(`✅ ${clientes.length} clientes creados`);

// ─── Ventas de hoy ───
// Obtener IDs de productos
const products = db.prepare('SELECT id, price FROM products WHERE active = 1').all();
if (products.length === 0) {
  console.error('❌ No hay productos. Arrancá el servidor primero (inicializa el schema).');
  process.exit(1);
}

const p = Object.fromEntries(products.map(x => [x.id, x.price]));

const insertSale = db.prepare('INSERT INTO sales (customer_id, total) VALUES (?, ?)');
const insertItem = db.prepare('INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)');

const ventasDemo = [
  { customer_id: 1, items: [{ id: 1, qty: 1 }, { id: 5, qty: 1 }] },  // Ana: Espresso + Medialunas
  { customer_id: 2, items: [{ id: 2, qty: 2 }] },                       // Carlos: 2 Lattes
  { customer_id: null, items: [{ id: 3, qty: 1 }] },                    // Anónimo: Cappuccino
  { customer_id: 3, items: [{ id: 2, qty: 1 }, { id: 6, qty: 1 }] },   // María: Latte + Tostado
  { customer_id: null, items: [{ id: 1, qty: 2 }, { id: 5, qty: 1 }] }, // Anónimo: 2 Espresso + Medialunas
];

const crearVentas = db.transaction(() => {
  for (const v of ventasDemo) {
    const total = v.items.reduce((sum, i) => sum + (p[i.id] || 0) * i.qty, 0);
    const { lastInsertRowid: saleId } = insertSale.run(v.customer_id, total);
    for (const i of v.items) {
      insertItem.run(saleId, i.id, i.qty, p[i.id] || 0);
    }
  }
});

crearVentas();
console.log(`✅ ${ventasDemo.length} ventas de hoy creadas`);

// ─── Resumen ───
const resumen = db.prepare(`
  SELECT COUNT(*) as ventas, COALESCE(SUM(total),0) as total
  FROM sales WHERE date(created_at) = date('now','localtime')
`).get();

console.log(`\n📊 Dashboard hoy:`);
console.log(`   Ventas:   ${resumen.ventas}`);
console.log(`   Ingresos: $${resumen.total}`);
console.log('\n✨ Demo listo. Abrí el frontend para mostrarlo.');
