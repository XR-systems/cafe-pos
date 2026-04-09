import { useState, useEffect } from 'react'
import { getAnalytics, createGoal, deleteGoal } from '../api/client'

const fmtMoney = (n) =>
  `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const CAT_FILTERS = [
  { value: 'all',      label: 'Todos' },
  { value: 'cafe',     label: 'Café' },
  { value: 'sin cafe', label: 'Sin café' },
  { value: 'panes',    label: 'Panes' },
  { value: 'comida',   label: 'Comida' },
]

export default function AdminAnaliticas() {
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [catFilter, setCatFilter] = useState('all')
  const [goalForm, setGoalForm]   = useState({ name: '', target: '', percentage: '' })
  const [goalError, setGoalError] = useState('')
  const [savingGoal, setSavingGoal] = useState(false)

  const load = async () => {
    const d = await getAnalytics()
    setData(d)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleAddGoal = async (e) => {
    e.preventDefault()
    setGoalError('')
    if (!goalForm.name.trim())                              return setGoalError('El nombre es requerido')
    if (!goalForm.target || Number(goalForm.target) <= 0)   return setGoalError('Monto inválido')
    if (!goalForm.percentage || goalForm.percentage < 1 || goalForm.percentage > 100)
                                                            return setGoalError('Porcentaje entre 1 y 100')
    setSavingGoal(true)
    try {
      await createGoal({ name: goalForm.name.trim(), target: Number(goalForm.target), percentage: Number(goalForm.percentage) })
      setGoalForm({ name: '', target: '', percentage: '' })
      await load()
    } catch (err) { setGoalError(err.message) }
    finally { setSavingGoal(false) }
  }

  const handleDeleteGoal = async (id) => { await deleteGoal(id); await load() }

  if (loading) return <div className="loading">Cargando analíticas...</div>

  const { total_sales, total_expenses, net_profit, weekly, goals, top_products = [] } = data
  const maxAbs       = Math.max(...weekly.map(d => Math.abs(d.net)), 1)
  const filteredRank = catFilter === 'all'
    ? top_products
    : top_products.filter(p => p.category === catFilter)

  return (
    <div className="admin-content">

      {/* ── Resumen ──────────────────────────────────────────── */}
      <div className="analiticas-summary">
        <div className="ana-card">
          <div className="ana-label">Ventas totales</div>
          <div className="ana-value green">{fmtMoney(total_sales)}</div>
        </div>
        <div className="ana-card">
          <div className="ana-label">Gastos totales</div>
          <div className="ana-value red">{fmtMoney(total_expenses)}</div>
        </div>
        <div className="ana-card ana-card-highlight">
          <div className="ana-label">Ganancia neta</div>
          <div className={`ana-value ${net_profit >= 0 ? 'green' : 'red'}`}>{fmtMoney(net_profit)}</div>
        </div>
      </div>

      {/* ── Gráfica + Ranking ────────────────────────────────── */}
      <div className="admin-card">
        <h3 className="admin-card-title">Últimos 7 días · Productos más vendidos</h3>
        <div className="chart-and-ranking">

          {/* Gráfica de barras (compacta) */}
          <div>
            <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: 8 }}>Ganancia neta por día</p>
            <div className="bar-chart bar-chart-sm">
              {weekly.map((d, i) => {
                const dayName = DAY_NAMES[new Date(d.day + 'T12:00:00').getDay()]
                const pct     = maxAbs > 0 ? Math.abs(d.net) / maxAbs * 100 : 0
                const isNeg   = d.net < 0
                return (
                  <div key={i} className="bar-col">
                    <div className="bar-val" style={{ color: isNeg ? '#c62828' : '#2e7d32' }}>
                      {d.net !== 0 ? fmtMoney(d.net) : '—'}
                    </div>
                    <div className="bar-wrap">
                      <div className={`bar ${isNeg ? 'bar-neg' : 'bar-pos'}`}
                        style={{ height: `${Math.max(pct, 2)}%` }} />
                    </div>
                    <div className="bar-day">{dayName}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ranking de productos */}
          <div className="ranking-section">
            <div className="ranking-filters">
              {CAT_FILTERS.map(c => (
                <button
                  key={c.value}
                  className={`ranking-filter-btn ${catFilter === c.value ? 'active' : ''}`}
                  onClick={() => setCatFilter(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {filteredRank.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: '0.85rem', padding: '16px 0' }}>Sin ventas en esta categoría</p>
            ) : (
              <ol className="ranking-list">
                {filteredRank.map((p, i) => (
                  <li key={p.name} className="ranking-item">
                    <span className="ranking-pos">{i + 1}</span>
                    <span className="ranking-name">{p.name}</span>
                    <span className="ranking-units">{p.units} uds</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>

      {/* ── Metas de ahorro ──────────────────────────────────── */}
      <div className="admin-card">
        <h3 className="admin-card-title">Metas de ahorro</h3>
        <form onSubmit={handleAddGoal}>
          <div className="admin-form" style={{ flexWrap: 'wrap' }}>
            <input placeholder="Nombre de la meta" value={goalForm.name}
              onChange={e => setGoalForm(f => ({ ...f, name: e.target.value }))} style={{ flex: 2, minWidth: 140 }} />
            <input type="number" placeholder="Meta ($)" value={goalForm.target}
              onChange={e => setGoalForm(f => ({ ...f, target: e.target.value }))} style={{ width: 110 }} />
            <input type="number" placeholder="% de ganancia" min="1" max="100" value={goalForm.percentage}
              onChange={e => setGoalForm(f => ({ ...f, percentage: e.target.value }))} style={{ width: 120 }} />
            <button type="submit" className="btn-primary" disabled={savingGoal}>
              {savingGoal ? '...' : '+ Crear meta'}
            </button>
          </div>
          {goalError && <p className="alert error" style={{ marginTop: 8 }}>{goalError}</p>}
        </form>

        {goals.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: '20px 0', fontSize: '0.9rem' }}>
            Sin metas creadas aún
          </p>
        ) : (
          <div className="goals-list">
            {goals.map(goal => (
              <div key={goal.id} className="goal-item">
                <div className="goal-header">
                  <span className="goal-name">{goal.name}</span>
                  <button className="btn-danger" style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                    onClick={() => handleDeleteGoal(goal.id)}>✕</button>
                </div>
                <div className="goal-meta">
                  {goal.percentage}% de ganancias netas → {fmtMoney(goal.progress)} acumulados de {fmtMoney(goal.target)}
                </div>
                <div className="goal-bar-wrap">
                  <div className="goal-bar" style={{ width: `${Math.min(100, goal.pct)}%` }} />
                </div>
                <div className="goal-pct">
                  {goal.pct >= 100 ? '🎉 ¡Meta alcanzada!' : `${goal.pct}% completado`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
