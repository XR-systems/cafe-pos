const router = require('express').Router();
const db = require('../db/database');

// GET /api/products — listar productos activos
router.get('/', (req, res) => {
  const products = db
    .prepare('SELECT * FROM products WHERE active = 1 ORDER BY category, name')
    .all();
  res.json(products);
});

// POST /api/products — crear producto
router.post('/', (req, res) => {
  const { name, price, category = 'bebida' } = req.body;

  if (!name || price == null) {
    return res.status(400).json({ error: 'name y price son requeridos' });
  }
  if (price <= 0) {
    return res.status(400).json({ error: 'El precio debe ser mayor a 0' });
  }

  const result = db
    .prepare('INSERT INTO products (name, price, category) VALUES (?, ?, ?)')
    .run(name.trim(), price, category);

  res.status(201).json({ id: result.lastInsertRowid, name, price, category });
});

// DELETE /api/products/:id — baja lógica (no se elimina el registro)
router.delete('/:id', (req, res) => {
  db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
