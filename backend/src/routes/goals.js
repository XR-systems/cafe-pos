const router = require('express').Router();
const db = require('../db/database');

// GET /api/goals — listar metas
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM goals ORDER BY created_at ASC').all());
});

// POST /api/goals — crear meta
router.post('/', (req, res) => {
  const { name, target, percentage } = req.body;
  if (!name || !target || !percentage) return res.status(400).json({ error: 'name, target y percentage son requeridos' });
  if (target <= 0)                      return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  if (percentage < 1 || percentage > 100) return res.status(400).json({ error: 'El porcentaje debe ser entre 1 y 100' });

  const result = db.prepare(
    'INSERT INTO goals (name, target, percentage) VALUES (?, ?, ?)'
  ).run(name.trim(), target, percentage);

  res.status(201).json({ id: result.lastInsertRowid, name, target, percentage });
});

// DELETE /api/goals/:id — eliminar meta
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM goals WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
