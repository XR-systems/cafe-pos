import { useState, useEffect } from 'react'
import { getAllProducts, createProduct, updateProduct, deleteProduct, getCustomers } from '../api/client'

const fmtPrice = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('es-AR') : '—'

export default function Admin() {
  const [tab, setTab]           = useState('products')
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]   = useState(true)

  // Formulario nuevo producto
  const [form, setForm]         = useState({ name: '', price: '', category: 'bebida' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving]     = useState(false)
  const [successMsg, setSuccess] = useState('')

  // Edición inline
  const [editId, setEditId]     = useState(null)
  const [editForm, setEditForm] = useState({})

  const loadProducts = async () => {
    const data = await getAllProducts()
    setProducts(data)
  }

  const loadCustomers = async () => {
    const data = await getCustomers()
    // ordenar por visitas desc en el cliente
    setCustomers([...data].sort((a, b) => b.visits - a.visits))
  }

  useEffect(() => {
    Promise.all([loadProducts(), loadCustomers()]).finally(() => setLoading(false))
  }, [])

  // ── Agregar producto ──────────────────────
  const handleAdd = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim())              return setFormError('El nombre es requerido')
    if (!form.price || Number(form.price) <= 0) return setFormError('Precio inválido')
    setSaving(true)
    try {
      await createProduct({ name: form.name.trim(), price: Number(form.price), category: form.category })
      setForm({ name: '', price: '', category: 'bebida' })
      setSuccess('Producto agregado')
      setTimeout(() => setSuccess(''), 2500)
      await loadProducts()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Activar / Desactivar ──────────────────
  const handleToggle = async (product) => {
    if (product.active) {
      await deleteProduct(product.id)
    } else {
      await updateProduct(product.id, { active: 1 })
    }
    await loadProducts()
  }

  // ── Editar inline ─────────────────────────
  const startEdit = (p) => {
    setEditId(p.id)
    setEditForm({ name: p.name, price: p.price, category: p.category })
  }

  const saveEdit = async (id) => {
    if (!editForm.name.trim() || Number(editForm.price) <= 0) return
    await updateProduct(id, {
      name: editForm.name.trim(),
      price: Number(editForm.price),
      category: editForm.category,
    })
    setEditId(null)
    await loadProducts()
  }

  if (loading) return <div className="loading">Cargando...</div>

  const active   = products.filter(p => p.active)
  const inactive = products.filter(p => !p.active)

  return (
    <div className="admin">
      <div className="admin-tabs">
        <button className={tab === 'products'  ? 'active' : ''} onClick={() => setTab('products')}>
          Productos
        </button>
        <button className={tab === 'customers' ? 'active' : ''} onClick={() => setTab('customers')}>
          Clientes
        </button>
      </div>

      {/* ══ PRODUCTOS ══════════════════════════ */}
      {tab === 'products' && (
        <div className="admin-content">

          {/* Formulario agregar */}
          <div className="admin-card">
            <h3 className="admin-card-title">Agregar producto</h3>
            <form className="admin-form" onSubmit={handleAdd}>
              <input
                placeholder="Nombre del producto"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <input
                type="number"
                placeholder="Precio"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              />
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                <option value="bebida">Bebida</option>
                <option value="comida">Comida</option>
                <option value="otro">Otro</option>
              </select>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : '+ Agregar'}
              </button>
            </form>
            {formError  && <p className="alert error"   style={{ marginTop: 10 }}>{formError}</p>}
            {successMsg && <p className="alert success" style={{ marginTop: 10 }}>{successMsg}</p>}
          </div>

          {/* Tabla de productos */}
          <div className="admin-card">
            <h3 className="admin-card-title">
              Productos activos <span className="admin-count">{active.length}</span>
              {inactive.length > 0 && (
                <span className="admin-count inactive-count"> · {inactive.length} inactivos</span>
              )}
            </h3>
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ opacity: p.active ? 1 : 0.45 }}>
                    {editId === p.id ? (
                      <>
                        <td>
                          <input
                            className="edit-input"
                            value={editForm.name}
                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                          />
                        </td>
                        <td>
                          <select
                            className="edit-input"
                            value={editForm.category}
                            onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                          >
                            <option value="bebida">Bebida</option>
                            <option value="comida">Comida</option>
                            <option value="otro">Otro</option>
                          </select>
                        </td>
                        <td>
                          <input
                            className="edit-input"
                            type="number"
                            value={editForm.price}
                            onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                          />
                        </td>
                        <td>—</td>
                        <td className="action-cell">
                          <button className="btn-save"   onClick={() => saveEdit(p.id)}>Guardar</button>
                          <button className="btn-cancel" onClick={() => setEditId(null)}>Cancelar</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td style={{ textTransform: 'capitalize', color: '#888' }}>{p.category}</td>
                        <td style={{ fontWeight: 700, color: '#b07d4e' }}>{fmtPrice(p.price)}</td>
                        <td>
                          <span className={`badge ${p.active ? 'badge-active' : 'badge-inactive'}`}>
                            {p.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="action-cell">
                          <button className="btn-edit" onClick={() => startEdit(p)}>Editar</button>
                          <button
                            className={p.active ? 'btn-danger' : 'btn-success'}
                            onClick={() => handleToggle(p)}
                          >
                            {p.active ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ CLIENTES ═══════════════════════════ */}
      {tab === 'customers' && (
        <div className="admin-content">
          <div className="admin-card">
            <h3 className="admin-card-title">
              Clientes fidelizados <span className="admin-count">{customers.length}</span>
            </h3>
            <table className="sales-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>WhatsApp</th>
                  <th>Visitas</th>
                  <th>Última visita</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>
                      Sin clientes registrados aún
                    </td>
                  </tr>
                )}
                {customers.map((c, i) => (
                  <tr key={c.id}>
                    <td style={{ color: '#ccc', fontWeight: 700, fontSize: '0.85rem' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>
                      {c.name || <span className="muted">Sin nombre</span>}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#555' }}>
                      {c.whatsapp}
                    </td>
                    <td>
                      <span className="visits-badge">{c.visits}</span>
                    </td>
                    <td style={{ color: '#aaa', fontSize: '0.9rem' }}>{fmtDate(c.last_visit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
