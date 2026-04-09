import { useState, useEffect } from 'react'
import { getSalesHistory } from '../api/client'

const toDateStr = (d) => d.toISOString().split('T')[0]
const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
const fmt = (n) => Number(n).toLocaleString('es-AR')

const PAYMENT_ICON = { efectivo: '💵', tarjeta: '💳', transferencia: '📲' }

export default function Historial() {
  const [date, setDate]     = useState(toDateStr(new Date()))
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  const load = async (d) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getSalesHistory(d)
      setData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(date) }, [date])

  const shift = (days) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + days)
    setDate(toDateStr(d))
  }

  const fmtDate = (d) =>
    new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="historial-page">
      {/* ── Navegación de fecha ── */}
      <div className="historial-nav">
        <button className="hist-nav-btn" onClick={() => shift(-1)}>‹ Anterior</button>
        <div className="historial-date-picker">
          <input
            type="date"
            value={date}
            max={toDateStr(new Date())}
            onChange={e => setDate(e.target.value)}
          />
          <span className="historial-date-label">{fmtDate(date)}</span>
        </div>
        <button
          className="hist-nav-btn"
          onClick={() => shift(1)}
          disabled={date >= toDateStr(new Date())}
        >
          Siguiente ›
        </button>
      </div>

      {loading && <div className="loading">Cargando...</div>}
      {error   && <div className="alert error">{error}</div>}

      {data && !loading && (
        <>
          {/* ── Resumen ── */}
          <div className="historial-summary">
            <div className="hist-summary-card">
              <div className="hist-summary-value">${fmt(data.summary.total)}</div>
              <div className="hist-summary-label">Total vendido</div>
            </div>
            <div className="hist-summary-card">
              <div className="hist-summary-value">{data.summary.transactions}</div>
              <div className="hist-summary-label">Ventas</div>
            </div>
            {data.summary.by_payment.filter(p => p.total > 0).map(p => (
              <div key={p.method} className="hist-summary-card">
                <div className="hist-summary-value">
                  {PAYMENT_ICON[p.method]} ${fmt(p.total)}
                </div>
                <div className="hist-summary-label">
                  {p.method.charAt(0).toUpperCase() + p.method.slice(1)} ({p.count})
                </div>
              </div>
            ))}
          </div>

          {/* ── Tabla de ventas ── */}
          {data.sales.length === 0 ? (
            <div className="historial-empty">No hay ventas para este día.</div>
          ) : (
            <div className="sales-table-container">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Pago</th>
                    <th>Productos</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sales.map(sale => (
                    <tr key={sale.id}>
                      <td className="muted">{sale.id}</td>
                      <td>{fmtTime(sale.created_at)}</td>
                      <td>
                        {sale.customer_name
                          ? <><strong>{sale.customer_name}</strong>{sale.customer_whatsapp && <><br /><small className="muted">{sale.customer_whatsapp}</small></>}</>
                          : <span className="muted">—</span>
                        }
                      </td>
                      <td>{PAYMENT_ICON[sale.payment_method] || ''} {sale.payment_method}</td>
                      <td className="hist-items-cell">
                        {sale.items.map((i, idx) => (
                          <span key={idx}>{i.name} ×{i.quantity}{idx < sale.items.length - 1 ? ', ' : ''}</span>
                        ))}
                        {sale.note && <div className="hist-sale-note">📝 {sale.note}</div>}
                      </td>
                      <td><strong>${fmt(sale.total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
