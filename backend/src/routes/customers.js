const router = require('express').Router();
const db = require('../db/database');

// GET /api/customers?q=nombre — buscar o listar clientes
router.get('/', (req, res) => {
  const { q } = req.query;

  const customers = q
    ? db
        .prepare(`
          SELECT * FROM customers
          WHERE name LIKE ? OR whatsapp LIKE ?
          ORDER BY visits DESC LIMIT 20
        `)
        .all(`%${q}%`, `%${q}%`)
    : db
        .prepare('SELECT * FROM customers ORDER BY last_visit DESC LIMIT 50')
        .all();

  res.json(customers);
});

// POST /api/customers — crear cliente
router.post('/', (req, res) => {
  const { name, whatsapp } = req.body;

  if (!whatsapp) {
    return res.status(400).json({ error: 'whatsapp es requerido' });
  }

  try {
    const result = db
      .prepare('INSERT INTO customers (name, whatsapp) VALUES (?, ?)')
      .run(name?.trim() || null, whatsapp.trim());

    res.status(201).json({ id: result.lastInsertRowid, name, whatsapp });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Ya existe un cliente con ese WhatsApp' });
    }
    throw err;
  }
});

module.exports = router;
