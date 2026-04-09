const router = require('express').Router();
const db = require('../db/database');

// GET /api/products — listar productos (activos, o todos con ?all=true)
router.get('/', (req, res) => {
  const products = req.query.all === 'true'
    ? db.prepare('SELECT * FROM products ORDER BY category, name').all()
    : db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY category, name').all();
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

// PUT /api/products/:id — editar producto (nombre, precio, categoría, estado)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

  const name     = req.body.name?.trim()                ?? product.name;
  const price    = req.body.price    != null ? Number(req.body.price)  : product.price;
  const category = req.body.category                    ?? product.category;
  const active   = req.body.active   != null ? req.body.active         : product.active;

  if (price <= 0) return res.status(400).json({ error: 'El precio debe ser mayor a 0' });

  db.prepare('UPDATE products SET name = ?, price = ?, category = ?, active = ? WHERE id = ?')
    .run(name, price, category, active, id);

  res.json({ ok: true });
});

// DELETE /api/products/:id — baja lógica (no se elimina el registro)
router.delete('/:id', (req, res) => {
  db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
