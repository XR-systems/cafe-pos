const router = require('express').Router();
const db = require('../db/database');

// GET /api/orders — comandas pendientes con sus items
router.get('/', (req, res) => {
  const sales = db.prepare(`
    SELECT s.id, s.total, s.created_at, c.name AS customer_name
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.status = 'pending'
    ORDER BY s.created_at ASC
  `).all();

  const getItems = db.prepare(`
    SELECT p.name, si.quantity, si.unit_price, si.note
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    WHERE si.sale_id = ?
  `);

  res.json(sales.map(s => ({ ...s, items: getItems.all(s.id) })));
});

// PATCH /api/orders/:id/done — marcar comanda como terminada
router.patch('/:id/done', (req, res) => {
  db.prepare("UPDATE sales SET status = 'done' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
