import { useState, useEffect, useCallback } from 'react'
import { getOrders, markOrderDone } from '../api/client'

const fmtTime = (d) => new Date(d).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

export default function Comandas() {
  const [orders, setOrders]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [completing, setCompleting] = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await getOrders()
      setOrders(data)
    } catch (_) {}
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000) // refresca cada 5 segundos
    return () => clearInterval(interval)
  }, [load])

  const handleDone = async (id) => {
    setCompleting(id)
    try {
      await markOrderDone(id)
      await load()
    } finally {
      setCompleting(null)
    }
  }

  if (loading) return <div className="loading">Cargando comandas...</div>

  return (
    <div className="comandas">
      <div className="comandas-header">
        <h2>Comandas activas</h2>
        {orders.length > 0 && <span className="comandas-badge">{orders.length}</span>}
        <span className="comandas-refresh">↻ Actualización automática</span>
      </div>

      {orders.length === 0 ? (
        <div className="comandas-empty">Sin comandas pendientes</div>
      ) : (
        <div className="comandas-grid">
          {orders.map(order => (
            <div
              key={order.id}
              className={`comanda-card ${completing === order.id ? 'completing' : ''}`}
            >
              <div className="comanda-header">
                <span className="comanda-num">#{order.id}</span>
                <span className="comanda-time">{fmtTime(order.created_at)}</span>
              </div>

              {order.customer_name && (
                <div className="comanda-customer">{order.customer_name}</div>
              )}

              <ul className="comanda-items">
                {order.items.map((item, i) => (
                  <li key={i} className="comanda-item">
                    <span className="comanda-item-qty">{item.quantity}x</span>
                    <div className="comanda-item-info">
                      <span className="comanda-item-name">{item.name}</span>
                      {item.note && <span className="comanda-item-note">{item.note}</span>}
                    </div>
                  </li>
                ))}
              </ul>

              <button
                className="comanda-done-btn"
                onClick={() => handleDone(order.id)}
                disabled={completing === order.id}
              >
                {completing === order.id ? 'Completando...' : '✓ Listo'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
