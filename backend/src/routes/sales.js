const router = require('express').Router();
const db = require('../db/database');
const { emitWebhook } = require('../webhooks/emitter');

// POST /api/sales — registrar una venta
router.post('/', (req, res) => {
  const { items, customer_whatsapp, customer_name, note } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Al menos un producto es requerido' });
  }

  const ids = items.map(i => i.product_id);
  const products = db
    .prepare(`SELECT * FROM products WHERE id IN (${ids.map(() => '?').join(',')}) AND active = 1`)
    .all(...ids);

  if (products.length !== ids.length) {
    return res.status(400).json({ error: 'Uno o más productos no encontrados' });
  }

  const productMap = Object.fromEntries(products.map(p => [p.id, p]));

  // Usar unit_price del frontend si viene (variantes); sino el precio base
  const getPrice = (i) => i.unit_price != null ? i.unit_price : productMap[i.product_id].price;
  const total = items.reduce((sum, i) => sum + getPrice(i) * i.quantity, 0);

  // ─── Upsert cliente ───────────────────────────────────────────
  let customer_id = null;
  let customer = null;

  if (customer_whatsapp) {
    const existing = db
      .prepare('SELECT * FROM customers WHERE whatsapp = ?')
      .get(customer_whatsapp.trim());

    if (existing) {
      db.prepare(`
        UPDATE customers
        SET visits = visits + 1, last_visit = CURRENT_TIMESTAMP, name = COALESCE(?, name)
        WHERE id = ?
      `).run(customer_name?.trim() || null, existing.id);
      customer_id = existing.id;
      customer = { ...existing, visits: existing.visits + 1, name: customer_name || existing.name };
    } else {
      const r = db
        .prepare('INSERT INTO customers (name, whatsapp, visits, last_visit) VALUES (?, ?, 1, CURRENT_TIMESTAMP)')
        .run(customer_name?.trim() || null, customer_whatsapp.trim());
      customer_id = r.lastInsertRowid;
      customer = { id: customer_id, name: customer_name || null, whatsapp: customer_whatsapp, visits: 1 };
    }
  }

  // ─── Transacción: venta + items ───────────────────────────────
  const insertItem = db.prepare(
    'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, note) VALUES (?, ?, ?, ?, ?)'
  );

  const saleId = db.transaction(() => {
    const { lastInsertRowid } = db
      .prepare("INSERT INTO sales (customer_id, total, note, status) VALUES (?, ?, ?, 'pending')")
      .run(customer_id, total, note?.trim() || null);

    for (const item of items) {
      insertItem.run(lastInsertRowid, item.product_id, item.quantity, getPrice(item), item.note || null);
    }
    return lastInsertRowid;
  })();

  const isNewCustomer = customer !== null && customer.visits === 1;

  const saleData = {
    sale_id:    saleId,
    created_at: new Date().toISOString(),
    total,
    customer: customer ? {
      id: customer.id, name: customer.name || null,
      whatsapp: customer.whatsapp, visits: customer.visits
    } : null,
    items: items.map(i => ({
      name:       productMap[i.product_id].name,
      category:   productMap[i.product_id].category,
      quantity:   i.quantity,
      unit_price: getPrice(i),
      subtotal:   getPrice(i) * i.quantity,
      note:       i.note || null,
    })),
    meta: {
      is_new_customer:   isNewCustomer,
      has_whatsapp:      customer !== null,
      loyalty_milestone: customer !== null && customer.visits % 5 === 0,
    }
  };

  emitWebhook('nueva-venta', saleData);
  res.status(201).json(saleData);
});

// GET /api/sales/today — ventas del día con detalle
router.get('/today', (req, res) => {
  const sales = db.prepare(`
    SELECT s.id, s.total, s.note, s.created_at,
           c.name AS customer_name, c.whatsapp AS customer_whatsapp, c.visits AS customer_visits
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE date(s.created_at) = date('now', 'localtime')
    ORDER BY s.created_at DESC
  `).all();

  const getItems = db.prepare(`
    SELECT p.name, si.quantity, si.unit_price, si.note
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    WHERE si.sale_id = ?
  `);

  res.json(sales.map(s => ({ ...s, items: getItems.all(s.id) })));
});

module.exports = router;
