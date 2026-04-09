import { useState, useEffect } from 'react'
import { getDashboard, getTodaySales, getCorte } from '../api/client'

export default function Dashboard() {
  const [stats, setStats]   = useState(null)
  const [sales, setSales]   = useState([])
  const [corte, setCorte]   = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, d, c] = await Promise.all([getDashboard(), getTodaySales(), getCorte()])
      setStats(s)
      setSales(d)
      setCorte(c)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="loading">Cargando...</div>

  const fmt = (n) => Number(n).toLocaleString('es-AR')
  const fmtTime = (iso) =>
    new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="dashboard">

      {/* ── KPIs ── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">${fmt(stats?.total_revenue || 0)}</div>
          <div className="stat-label">Ventas hoy</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.total_transactions || 0}</div>
          <div className="stat-label">Transacciones</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${fmt(stats?.avg_ticket || 0)}</div>
          <div className="stat-label">Ticket promedio</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.best_product?.name || '—'}</div>
          <div className="stat-label">
            Más vendido
            {stats?.best_product && ` (${stats.best_product.units_sold} uds)`}
          </div>
        </div>
      </div>

      {/* ── Métodos de pago ── */}
      {corte && (
        <div className="payment-breakdown">
          {corte.by_payment.map(p => (
            <div key={p.payment_method} className="payment-breakdown-card">
              <div className="payment-breakdown-icon">
                {p.payment_method === 'efectivo' ? '💵' : p.payment_method === 'tarjeta' ? '💳' : '📲'}
              </div>
              <div className="payment-breakdown-label">
                {p.payment_method.charAt(0).toUpperCase() + p.payment_method.slice(1)}
              </div>
              <div className="payment-breakdown-total">${fmt(p.total)}</div>
              <div className="payment-breakdown-count">{p.count} venta{p.count !== 1 ? 's' : ''}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabla de ventas ── */}
      <div className="sales-table-container">
        <div className="sales-table-header">
          <h3>Ventas de hoy</h3>
          <button onClick={load}>↻ Actualizar</button>
        </div>

        {sales.length === 0 ? (
          <p className="muted" style={{ padding: '20px 0' }}>No hay ventas registradas hoy.</p>
        ) : (
          <table className="sales-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Productos</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id}>
                  <td className="muted">{sale.id}</td>
                  <td>{fmtTime(sale.created_at)}</td>
                  <td>
                    {sale.customer_name
                      ? <><strong>{sale.customer_name}</strong><br /><small className="muted">{sale.customer_whatsapp}</small></>
                      : <span className="muted">Sin cliente</span>
                    }
                  </td>
                  <td>{sale.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}</td>
                  <td><strong>${fmt(sale.total)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
