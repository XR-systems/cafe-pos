const router = require('express').Router();
const db = require('../db/database');

// GET /api/expenses — listar gastos (últimos 30 días por defecto)
router.get('/', (req, res) => {
  const expenses = db.prepare(`
    SELECT * FROM expenses
    ORDER BY date DESC, created_at DESC
    LIMIT 100
  `).all();
  res.json(expenses);
});

// POST /api/expenses — registrar gasto
router.post('/', (req, res) => {
  const { description, amount, category = 'general', date } = req.body;
  if (!description || !amount) return res.status(400).json({ error: 'description y amount son requeridos' });
  if (amount <= 0)             return res.status(400).json({ error: 'El monto debe ser mayor a 0' });

  const result = db.prepare(
    "INSERT INTO expenses (description, amount, category, date) VALUES (?, ?, ?, COALESCE(?, date('now','localtime')))"
  ).run(description.trim(), amount, category, date || null);

  res.status(201).json({ id: result.lastInsertRowid, description, amount, category });
});

// DELETE /api/expenses/:id — eliminar gasto
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
