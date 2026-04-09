import { useState, useEffect } from 'react'
import { getExpenses, createExpense, deleteExpense } from '../api/client'

const CATEGORIES = ['Insumos', 'Renta', 'Servicios', 'Personal', 'Equipo', 'Otro']

const fmtDate  = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
const fmtMoney = (n) => `$${Number(n).toLocaleString('es-MX')}`
const today    = () => new Date().toISOString().split('T')[0]

export default function AdminGastos() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState({ description: '', amount: '', category: 'Insumos', date: today() })
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const load = async () => {
    const data = await getExpenses()
    setExpenses(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.description.trim()) return setError('La descripción es requerida')
    if (!form.amount || Number(form.amount) <= 0) return setError('Monto inválido')
    setSaving(true)
    try {
      await createExpense({ ...form, amount: Number(form.amount) })
      setForm({ description: '', amount: '', category: 'Insumos', date: today() })
      setSuccess('Gasto registrado')
      setTimeout(() => setSuccess(''), 2500)
      await load()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    await deleteExpense(id)
    await load()
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  if (loading) return <div className="loading">Cargando gastos...</div>

  return (
    <div className="admin-content">

      {/* Formulario */}
      <div className="admin-card">
        <h3 className="admin-card-title">Registrar gasto</h3>
        <form onSubmit={handleAdd}>
          <div className="admin-form expense-form">
            <input
              placeholder="Descripción (ej. Café molido, Renta)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ flex: 2, minWidth: 160 }}
            />
            <input
              type="number"
              placeholder="Monto"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              style={{ width: 110 }}
            />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              style={{ width: 140 }}
            />
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : '+ Registrar'}
            </button>
          </div>
        </form>
        {error   && <p className="alert error"   style={{ marginTop: 10 }}>{error}</p>}
        {success && <p className="alert success" style={{ marginTop: 10 }}>{success}</p>}
      </div>

      {/* Lista */}
      <div className="admin-card">
        <h3 className="admin-card-title">
          Gastos registrados
          <span className="admin-count">{expenses.length}</span>
          <span style={{ marginLeft: 'auto', fontWeight: 800, color: '#c62828', fontSize: '0.9rem' }}>
            Total: {fmtMoney(total)}
          </span>
        </h3>
        {expenses.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: '30px 0' }}>Sin gastos registrados</p>
        ) : (
          <div className="table-scroll">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Monto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id}>
                    <td style={{ color: '#888', whiteSpace: 'nowrap' }}>{fmtDate(exp.date)}</td>
                    <td style={{ fontWeight: 500 }}>{exp.description}</td>
                    <td>
                      <span className="expense-cat-badge">{exp.category}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#c62828' }}>{fmtMoney(exp.amount)}</td>
                    <td>
                      <button className="btn-danger" style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        onClick={() => handleDelete(exp.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
