import { useState, useEffect } from 'react'
import { getCorte, closeDay } from '../api/client'

const fmt = (n) => Number(n).toLocaleString('es-AR')
const PAYMENT_ICON = { efectivo: '💵', tarjeta: '💳', transferencia: '📲' }

export default function Corte() {
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [openingCash, setOpeningCash] = useState('')
  const [notes, setNotes]         = useState('')
  const [closing, setClosing]     = useState(false)
  const [error, setError]         = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getCorte()
      setData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleClose = async () => {
    if (closing) return
    setClosing(true)
    setError(null)
    try {
      await closeDay({ opening_cash: Number(openingCash) || 0, notes })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setClosing(false)
    }
  }

  if (loading) return <div className="loading">Cargando...</div>
  if (error && !data) return <div className="alert error">{error}</div>

  const fmtDate = (d) =>
    new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="corte-page">
      <h2 className="corte-title">Corte de caja</h2>
      <p className="corte-date">{fmtDate(data.date)}</p>

      {/* ── Resumen del día ── */}
      <div className="corte-summary-grid">
        <div className="corte-card">
          <div className="corte-card-value">${fmt(data.total_sales)}</div>
          <div className="corte-card-label">Total vendido</div>
        </div>
        <div className="corte-card">
          <div className="corte-card-value">${fmt(data.total_expenses)}</div>
          <div className="corte-card-label">Gastos</div>
        </div>
        <div className="corte-card highlight">
          <div className="corte-card-value">${fmt(data.net_profit)}</div>
          <div className="corte-card-label">Ganancia neta</div>
        </div>
      </div>

      {/* ── Por método de pago ── */}
      <div className="corte-by-payment">
        {data.by_payment.map(p => (
          <div key={p.payment_method} className="corte-payment-row">
            <span className="corte-payment-icon">{PAYMENT_ICON[p.payment_method] || ''}</span>
            <span className="corte-payment-name">
              {p.payment_method.charAt(0).toUpperCase() + p.payment_method.slice(1)}
            </span>
            <span className="corte-payment-count">{p.count} venta{p.count !== 1 ? 's' : ''}</span>
            <span className="corte-payment-total">${fmt(p.total)}</span>
          </div>
        ))}
      </div>

      {/* ── Cerrar día / ya cerrado ── */}
      {data.already_closed ? (
        <div className="corte-closed-box">
          <div className="corte-closed-badge">✓ Día cerrado</div>
          <p>Efectivo esperado en caja: <strong>${fmt(data.close_data.expected_cash)}</strong></p>
          {data.close_data.notes && <p className="muted">{data.close_data.notes}</p>}
        </div>
      ) : (
        <div className="corte-close-form">
          <h3>Cerrar el día</h3>
          <div className="corte-form-row">
            <label>Fondo inicial (efectivo)</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={openingCash}
              onChange={e => setOpeningCash(e.target.value)}
            />
          </div>
          {openingCash !== '' && (
            <div className="corte-expected">
              Efectivo esperado en caja: <strong>${fmt((Number(openingCash) || 0) + data.cash_sales - data.total_expenses)}</strong>
              <span className="corte-expected-detail">
                ({openingCash} fondo + ${fmt(data.cash_sales)} efectivo − ${fmt(data.total_expenses)} gastos)
              </span>
            </div>
          )}
          <div className="corte-form-row">
            <label>Notas</label>
            <textarea
              className="note-input"
              rows={2}
              placeholder="Observaciones del día..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          {error && <div className="alert error">{error}</div>}
          <button className="corte-close-btn" onClick={handleClose} disabled={closing}>
            {closing ? 'Cerrando...' : 'Cerrar día'}
          </button>
        </div>
      )}

      {/* ── Historial de cortes ── */}
      {data.history?.length > 0 && (
        <div className="corte-history">
          <h3>Últimos cortes</h3>
          <table className="sales-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Ventas</th>
                <th>💵 Efectivo</th>
                <th>💳 Tarjeta</th>
                <th>📲 Transfer.</th>
                <th>Gastos</th>
                <th>Caja esperada</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map(h => (
                <tr key={h.id}>
                  <td>{h.date}</td>
                  <td><strong>${fmt(h.total_sales)}</strong></td>
                  <td>${fmt(h.sales_efectivo)}</td>
                  <td>${fmt(h.sales_tarjeta)}</td>
                  <td>${fmt(h.sales_transferencia)}</td>
                  <td className="muted">${fmt(h.total_expenses)}</td>
                  <td>${fmt(h.expected_cash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
