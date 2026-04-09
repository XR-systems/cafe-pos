import { useState, useEffect } from 'react'
import { getAllProducts, createProduct, updateProduct, deleteProduct, getCustomers } from '../api/client'
import AdminGastos from './AdminGastos'
import AdminAnaliticas from './AdminAnaliticas'

const fmtPrice = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-AR') : '—'

const CATEGORIES = [
  { value: 'cafe',     label: 'Café' },
  { value: 'sin cafe', label: 'Sin café' },
  { value: 'panes',    label: 'Panes' },
  { value: 'comida',   label: 'Comida' },
]
const VARIANT_LABELS = ['Caliente', 'En las rocas', 'Frappe']

const emptyVariants = () => ({ Caliente: '', 'En las rocas': '', Frappe: '' })

const variantsFromProduct = (product) => {
  const prices = emptyVariants()
  if (product.variants) product.variants.forEach(v => { prices[v.label] = String(v.price) })
  return prices
}

const buildVariantsArray = (prices) =>
  VARIANT_LABELS
    .filter(l => prices[l] && Number(prices[l]) > 0)
    .map(l => ({ label: l, price: Number(prices[l]) }))

export default function Admin() {
  const [tab, setTab]             = useState('products')
  const [products, setProducts]   = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)

  // ── Formulario nuevo producto ──────────────────────────────
  const [form, setForm]           = useState({ name: '', price: '', category: 'cafe' })
  const [useVariants, setUseVariants] = useState(false)
  const [variantPrices, setVariantPrices] = useState(emptyVariants())
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccess]  = useState('')
  const [saving, setSaving]       = useState(false)

  // ── Edición inline ─────────────────────────────────────────
  const [editId, setEditId]               = useState(null)
  const [editForm, setEditForm]           = useState({})
  const [editUseVariants, setEditUseVariants] = useState(false)
  const [editVariantPrices, setEditVariantPrices] = useState(emptyVariants())

  const loadProducts = async () => {
    const data = await getAllProducts()
    setProducts(data)
  }
  const loadCustomers = async () => {
    const data = await getCustomers()
    setCustomers([...data].sort((a, b) => b.visits - a.visits))
  }

  useEffect(() => {
    Promise.all([loadProducts(), loadCustomers()]).finally(() => setLoading(false))
  }, [])

  // ── Agregar ────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) return setFormError('El nombre es requerido')

    const variants = useVariants ? buildVariantsArray(variantPrices) : null
    const price = useVariants && variants?.length > 0
      ? variants[0].price
      : Number(form.price)

    if (!useVariants && (!form.price || price <= 0)) return setFormError('Precio inválido')
    if (useVariants && (!variants || variants.length === 0)) return setFormError('Agrega al menos un precio de variante')

    setSaving(true)
    try {
      await createProduct({ name: form.name.trim(), price, category: form.category, variants })
      setForm({ name: '', price: '', category: 'cafe' })
      setUseVariants(false)
      setVariantPrices(emptyVariants())
      setSuccess('Producto agregado')
      setTimeout(() => setSuccess(''), 2500)
      await loadProducts()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle activo/inactivo ─────────────────────────────────
  const handleToggle = async (product) => {
    if (product.active) await deleteProduct(product.id)
    else await updateProduct(product.id, { active: 1 })
    await loadProducts()
  }

  // ── Edición inline ─────────────────────────────────────────
  const startEdit = (p) => {
    setEditId(p.id)
    setEditForm({ name: p.name, price: p.price, category: p.category })
    const hasVariants = p.variants && p.variants.length > 0
    setEditUseVariants(hasVariants)
    setEditVariantPrices(hasVariants ? variantsFromProduct(p) : emptyVariants())
  }

  const saveEdit = async (id) => {
    const variants = editUseVariants ? buildVariantsArray(editVariantPrices) : null
    const price = editUseVariants && variants?.length > 0
      ? variants[0].price
      : Number(editForm.price)
    if (!editForm.name.trim() || price <= 0) return
    await updateProduct(id, {
      name: editForm.name.trim(),
      price,
      category: editForm.category,
      variants: variants && variants.length > 0 ? variants : null,
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
        <button className={tab === 'products'   ? 'active' : ''} onClick={() => setTab('products')}>Productos</button>
        <button className={tab === 'customers'  ? 'active' : ''} onClick={() => setTab('customers')}>Clientes</button>
        <button className={tab === 'gastos'     ? 'active' : ''} onClick={() => setTab('gastos')}>Gastos</button>
        <button className={tab === 'analiticas' ? 'active' : ''} onClick={() => setTab('analiticas')}>Analíticas</button>
      </div>

      {/* ══ PRODUCTOS ══════════════════════════════════════════ */}
      {tab === 'products' && (
        <div className="admin-content">

          {/* Formulario agregar */}
          <div className="admin-card">
            <h3 className="admin-card-title">Agregar producto</h3>
            <form onSubmit={handleAdd}>
              <div className="admin-form">
                <input
                  placeholder="Nombre del producto"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                {!useVariants && (
                  <input
                    type="number"
                    placeholder="Precio"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  />
                )}
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : '+ Agregar'}
                </button>
              </div>

              <label className="variant-toggle-label">
                <input
                  type="checkbox"
                  checked={useVariants}
                  onChange={e => setUseVariants(e.target.checked)}
                />
                Tiene variantes (Caliente / En las rocas / Frappe)
              </label>

              {useVariants && (
                <div className="variant-price-grid">
                  {VARIANT_LABELS.map(label => (
                    <div key={label} className="variant-price-row">
                      <span className="variant-price-label">{label}</span>
                      <input
                        type="number"
                        placeholder="Precio"
                        value={variantPrices[label]}
                        onChange={e => setVariantPrices(v => ({ ...v, [label]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              )}
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
                  <th>Precio / Variantes</th>
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
                          <input className="edit-input" value={editForm.name}
                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                        </td>
                        <td>
                          <select className="edit-input" value={editForm.category}
                            onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}>
                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                        </td>
                        <td>
                          <label className="variant-toggle-label" style={{ fontSize: '0.8rem', marginBottom: 6 }}>
                            <input type="checkbox" checked={editUseVariants}
                              onChange={e => setEditUseVariants(e.target.checked)} />
                            Variantes
                          </label>
                          {editUseVariants ? (
                            <div className="variant-price-grid">
                              {VARIANT_LABELS.map(label => (
                                <div key={label} className="variant-price-row">
                                  <span className="variant-price-label">{label}</span>
                                  <input type="number" placeholder="Precio"
                                    value={editVariantPrices[label]}
                                    onChange={e => setEditVariantPrices(v => ({ ...v, [label]: e.target.value }))} />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <input className="edit-input" type="number" value={editForm.price}
                              onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} />
                          )}
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
                        <td style={{ textTransform: 'capitalize', color: '#888', fontSize: '0.85rem' }}>
                          {CATEGORIES.find(c => c.value === p.category)?.label || p.category}
                        </td>
                        <td>
                          {p.variants && p.variants.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {p.variants.map(v => (
                                <span key={v.label} className="variant-chip">
                                  {v.label} ${v.price}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontWeight: 700, color: '#b07d4e' }}>{fmtPrice(p.price)}</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${p.active ? 'badge-active' : 'badge-inactive'}`}>
                            {p.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="action-cell">
                          <button className="btn-edit" onClick={() => startEdit(p)}>Editar</button>
                          <button className={p.active ? 'btn-danger' : 'btn-success'} onClick={() => handleToggle(p)}>
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

      {tab === 'gastos'     && <AdminGastos />}
      {tab === 'analiticas' && <AdminAnaliticas />}

      {/* ══ CLIENTES ═══════════════════════════════════════════ */}
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
                    <td style={{ fontWeight: 600 }}>{c.name || <span className="muted">Sin nombre</span>}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#555' }}>{c.whatsapp}</td>
                    <td><span className="visits-badge">{c.visits}</span></td>
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
