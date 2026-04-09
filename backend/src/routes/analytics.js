const router = require('express').Router();
const db = require('../db/database');

// GET /api/analytics — datos para la pantalla de analíticas
router.get('/', (req, res) => {

  // ── Totales generales ─────────────────────────────────────────
  const totalSales    = db.prepare("SELECT COALESCE(SUM(total),0) AS n FROM sales").get().n;
  const totalExpenses = db.prepare("SELECT COALESCE(SUM(amount),0) AS n FROM expenses").get().n;
  const netProfit     = totalSales - totalExpenses;

  // ── Últimos 7 días (ventas + gastos + neto) ───────────────────
  const salesByDay = db.prepare(`
    SELECT date(created_at,'localtime') AS day, COALESCE(SUM(total),0) AS total
    FROM sales
    WHERE created_at >= date('now','-6 days','localtime')
    GROUP BY day
  `).all();

  const expByDay = db.prepare(`
    SELECT date AS day, COALESCE(SUM(amount),0) AS total
    FROM expenses
    WHERE date >= date('now','-6 days','localtime')
    GROUP BY day
  `).all();

  const weekly = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const day = d.toISOString().split('T')[0];
    const sales    = salesByDay.find(r => r.day === day)?.total || 0;
    const expenses = expByDay.find(r => r.day === day)?.total   || 0;
    weekly.push({ day, sales, expenses, net: Math.round((sales - expenses) * 100) / 100 });
  }

  // ── Metas con progreso calculado ──────────────────────────────
  const goals = db.prepare('SELECT * FROM goals ORDER BY created_at ASC').all();

  const goalsWithProgress = goals.map(goal => {
    const s = db.prepare(
      "SELECT COALESCE(SUM(total),0) AS n FROM sales WHERE created_at >= ?"
    ).get(goal.created_at).n;
    const e = db.prepare(
      "SELECT COALESCE(SUM(amount),0) AS n FROM expenses WHERE created_at >= ?"
    ).get(goal.created_at).n;
    const net      = Math.max(0, s - e);
    const progress = Math.min(goal.target, Math.round(net * goal.percentage / 100 * 100) / 100);
    const pct      = goal.target > 0 ? Math.round(progress / goal.target * 100) : 0;
    return { ...goal, progress, pct };
  });

  res.json({ total_sales: totalSales, total_expenses: totalExpenses, net_profit: netProfit, weekly, goals: goalsWithProgress });
});

module.exports = router;
