import { useState, useEffect, useCallback, useRef } from 'react'
import { getOrders, markOrderDone } from '../api/client'

const fmtTime = (d) => new Date(d).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

// ── Componente deslizar para completar ────────────────────────
function SlideToComplete({ onComplete, disabled }) {
  const isDragging  = useRef(false)
  const startX      = useRef(0)
  const offsetRef   = useRef(0)
  const trackRef    = useRef(null)
  const [offset, setOffset]   = useState(0)
  const [dragging, setDragging] = useState(false)

  const THUMB_W = 52

  const getMax = () =>
    trackRef.current ? trackRef.current.offsetWidth - THUMB_W - 8 : 220

  const onStart = (x) => {
    if (disabled) return
    isDragging.current = true
    setDragging(true)
    startX.current = x
  }

  const onMove = (x) => {
    if (!isDragging.current) return
    const next = Math.max(0, Math.min(x - startX.current, getMax()))
    offsetRef.current = next
    setOffset(next)
  }

  const onEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false
    setDragging(false)
    if (offsetRef.current >= getMax() * 0.65) {
      onComplete()
    }
    offsetRef.current = 0
    setOffset(0)
  }

  const fillPct = getMax() > 0 ? (offset / getMax()) * 100 : 0

  return (
    <div
      ref={trackRef}
      className="slide-track"
      onMouseMove={e => onMove(e.clientX)}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
      onTouchMove={e => { e.preventDefault(); onMove(e.touches[0].clientX) }}
      onTouchEnd={onEnd}
    >
      {/* Relleno de progreso */}
      <div className="slide-fill" style={{ width: `${fillPct}%` }} />
      {/* Texto hint (desaparece al deslizar) */}
      <span className="slide-hint" style={{ opacity: Math.max(0, 1 - fillPct / 50) }}>
        Desliza para completar →
      </span>
      {/* Thumb deslizable */}
      <div
        className="slide-thumb"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 0.3s ease',
        }}
        onMouseDown={e => { e.preventDefault(); onStart(e.clientX) }}
        onTouchStart={e => { e.preventDefault(); onStart(e.touches[0].clientX) }}
      >
        ✓
      </div>
    </div>
  )
}

// ── Página principal de Comandas ──────────────────────────────
export default function Comandas() {
  const [orders, setOrders]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [completing, setCompleting] = useState(null)

  const load = useCallback(async () => {
    try { const data = await getOrders(); setOrders(data) } catch (_) {}
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [load])

  const handleDone = async (id) => {
    setCompleting(id)
    try { await markOrderDone(id); await load() }
    finally { setCompleting(null) }
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
            <div key={order.id} className={`comanda-card ${completing === order.id ? 'completing' : ''}`}>
              <div className="comanda-header">
                <span className="comanda-num">#{order.id}</span>
                <span className="comanda-time">{fmtTime(order.created_at)}</span>
              </div>

              {order.customer_name && (
                <div className="comanda-customer">{order.customer_name}</div>
              )}

              {/* Nota general del pedido */}
              {order.order_note && (
                <div className="comanda-order-note">📝 {order.order_note}</div>
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

              <SlideToComplete
                onComplete={() => handleDone(order.id)}
                disabled={completing === order.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
