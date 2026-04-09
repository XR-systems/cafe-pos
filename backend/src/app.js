const express = require('express');
const cors = require('cors');

const app = express();

// En producción solo permite el dominio del frontend (variable FRONTEND_URL)
// En desarrollo permite todo
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL || '').trim()
    : true
}));
app.use(express.json());

// ─── Rutas ───
app.use('/api/products',  require('./routes/products'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/sales',     require('./routes/sales'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/expenses',  require('./routes/expenses'));
app.use('/api/goals',     require('./routes/goals'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// Error handler global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅  Café POS backend → http://localhost:${PORT}`);
});
