const router = require('express').Router();
const db = require('../db/database');

// Preparar statements una sola vez (mejor rendimiento con better-sqlite3)
const stmtStats = db.prepare(`
  SELECT
    COUNT(*)                                        AS total_transactions,
    COALESCE(SUM(total), 0)                         AS total_revenue,
    COALESCE(ROUND(AVG(total), 2), 0)               AS avg_ticket,
    COUNT(DISTINCT customer_id)                     AS unique_customers
  FROM sales
  WHERE date(created_at) = date('now', 'localtime')
`);

const stmtTopProducts = db.prepare(`
  SELECT
    p.name,
    SUM(si.quantity)                  AS units_sold,
    ROUND(SUM(si.quantity * si.unit_price), 2) AS revenue
  FROM sale_items si
  JOIN products p ON si.product_id = p.id
  JOIN sales s    ON si.sale_id = s.id
  WHERE date(s.created_at) = date('now', 'localtime')
  GROUP BY p.id
  ORDER BY units_sold DESC
  LIMIT 5
`);

const stmtRecentSales = db.prepare(`
  SELECT
    s.id, s.total, s.created_at,
    c.name     AS customer_name,
    c.whatsapp AS customer_whatsapp
  FROM sales s
  LEFT JOIN customers c ON s.customer_id = c.id
  WHERE date(s.created_at) = date('now', 'localtime')
  ORDER BY s.created_at DESC
  LIMIT 10
`);

// GET /api/dashboard — métricas del día
router.get('/', (req, res) => {
  const stats       = stmtStats.get();
  const topProducts = stmtTopProducts.all();
  const recentSales = stmtRecentSales.all();

  res.json({
    // KPIs
    total_transactions: stats.total_transactions,
    total_revenue:      stats.total_revenue,
    avg_ticket:         stats.avg_ticket,
    unique_customers:   stats.unique_customers,

    // Ranking de productos (útil para gráfico de barras)
    top_products: topProducts,

    // Primer lugar separado para el header del dashboard
    best_product: topProducts[0] || null,

    // Tabla de actividad reciente
    recent_sales: recentSales
  });
});

module.exports = router;
