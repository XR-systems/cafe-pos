const router = require('express').Router();
const db = require('../db/database');

const todayStats = () => {
  const byMethod = db.prepare(`
    SELECT payment_method, COUNT(*) AS count, COALESCE(SUM(total),0) AS total
    FROM sales
    WHERE date(created_at,'localtime') = date('now','localtime')
    GROUP BY payment_method
  `).all();

  const totalSales    = byMethod.reduce((s, r) => s + r.total, 0);
  const cashSales     = byMethod.find(r => r.payment_method === 'efectivo')?.total      || 0;
  const cardSales     = byMethod.find(r => r.payment_method === 'tarjeta')?.total       || 0;
  const transferSales = byMethod.find(r => r.payment_method === 'transferencia')?.total || 0;
  const totalExpenses = db.prepare(
    "SELECT COALESCE(SUM(amount),0) AS n FROM expenses WHERE date = date('now','localtime')"
  ).get().n;

  return { byMethod, totalSales, cashSales, cardSales, transferSales, totalExpenses };
};

// GET /api/corte — resumen del día + histórico de cortes
router.get('/', (req, res) => {
  const { byMethod, totalSales, cashSales, cardSales, transferSales, totalExpenses } = todayStats();

  const closed = db.prepare(
    "SELECT * FROM cash_registers WHERE date = date('now','localtime')"
  ).get();

  const history = db.prepare(
    'SELECT * FROM cash_registers ORDER BY date DESC LIMIT 14'
  ).all();

  res.json({
    date:            new Date().toISOString().split('T')[0],
    by_payment:      byMethod,
    total_sales:     totalSales,
    cash_sales:      cashSales,
    card_sales:      cardSales,
    transfer_sales:  transferSales,
    total_expenses:  totalExpenses,
    net_profit:      totalSales - totalExpenses,
    already_closed:  !!closed,
    close_data:      closed || null,
    history,
  });
});

// POST /api/corte/close — cerrar el día
router.post('/close', (req, res) => {
  const already = db.prepare(
    "SELECT id FROM cash_registers WHERE date = date('now','localtime')"
  ).get();
  if (already) return res.status(409).json({ error: 'El día ya fue cerrado' });

  const { opening_cash = 0, notes = '' } = req.body;
  const { totalSales, cashSales, cardSales, transferSales, totalExpenses } = todayStats();
  const expectedCash = Number(opening_cash) + cashSales - totalExpenses;

  db.prepare(`
    INSERT INTO cash_registers
      (date, opening_cash, total_sales, sales_efectivo, sales_tarjeta, sales_transferencia, total_expenses, expected_cash, notes)
    VALUES (date('now','localtime'), ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(opening_cash, totalSales, cashSales, cardSales, transferSales, totalExpenses, expectedCash, notes?.trim() || null);

  res.json({ ok: true, expected_cash: expectedCash, net_profit: totalSales - totalExpenses });
});

module.exports = router;
