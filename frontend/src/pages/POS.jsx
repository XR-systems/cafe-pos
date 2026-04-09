import { useState, useEffect } from 'react'
import { getProducts, registerSale } from '../api/client'

const CAT_ORDER = ['cafe', 'sin cafe', 'panes', 'comida']
const CAT_NAMES = { 'cafe': 'Café', 'sin cafe': 'Bebidas sin café', 'panes': 'Panes', 'comida': 'Comida' }
const DRINK_CATS  = ['cafe', 'sin cafe']
const MILK_OPTIONS  = ['Entera', 'Deslactosada', 'Light']
const SUGAR_OPTIONS = ['Splenda', 'Refinada', 'Morena']

export default function POS() {
  const [products, setProducts]         = useState([])
  const [cart, setCart]                 = useState({})
  const [customizer, setCustomizer]     = useState(null)
  const [customerName, setCustomerName]   = useState('')
  const [whatsapp, setWhatsapp]           = useState('')
  const [orderNote, setOrderNote]         = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [loading, setLoading]           = useState(false)
  const [success, setSuccess]           = useState(null)
  const [error, setError]               = useState(null)

  useEffect(() => {
    getProducts().then(setProducts).catch(() => setError('No se pudieron cargar los productos'))
  }, [])

  // ─── Carrito ──────────────────────────────────────────────────
  const addToCart = (product, variant, milk, sugar, price, note) => {
    const key = `${product.id}_${variant||''}_${milk||''}_${sugar||''}`
    setCart(prev => ({
      ...prev,
      [key]: { key, product, variant, milk, sugar, price, note, quantity: (prev[key]?.quantity || 0) + 1 }
    }))
  }

  const updateQty = (key, delta) => {
    setCart(prev => {
      const newQty = (prev[key]?.quantity || 0) + delta
      if (newQty <= 0) { const next = { ...prev }; delete next[key]; return next }
      return { ...prev, [key]: { ...prev[key], quantity: newQty } }
    })
  }

  const cartItems = Object.values(cart)
  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const getProductQty = (productId) =>
    Object.entries(cart)
      .filter(([k]) => k.startsWith(`${productId}_`))
      .reduce((sum, [, i]) => sum + i.quantity, 0)

  // ─── Click en producto ────────────────────────────────────────
  const handleProductClick = (product) => {
    if (DRINK_CATS.includes(product.category)) {
      setCustomizer({ product, variant: null, milk: null, sugar: null })
    } else {
      addToCart(product, null, null, null, product.price, null)
    }
  }

  const custPrice = (() => {
    if (!customizer) return null
    const { product, variant } = customizer
    if (product.variants?.length > 0)
      return product.variants.find(v => v.label === variant)?.price ?? null
    return product.price
  })()

  const custReady = customizer
    ? (!customizer.product.variants?.length || customizer.variant !== null)
    : false

  const handleAddFromCustomizer = () => {
    if (!custReady) return
    const { product, variant, milk, sugar } = customizer
    const itemNote = [variant, milk, sugar].filter(Boolean).join(' · ') || null
    addToCart(product, variant, milk, sugar, custPrice, itemNote)
    setCustomizer(null)
  }

  // ─── Registrar venta ──────────────────────────────────────────
  const handleSubmit = async () => {
    if (cartItems.length === 0 || loading) return
    setLoading(true)
    setError(null)
    try {
      const result = await registerSale({
        items: cartItems.map(i => ({
          product_id: i.product.id,
          quantity:   i.quantity,
          unit_price: i.price,
          note:       i.note || null,
        })),
        customer_name:     customerName.trim() || undefined,
        customer_whatsapp: whatsapp.trim()     || undefined,
        note:              orderNote.trim()     || undefined,
        payment_method:    paymentMethod,
      })
      setSuccess(`✓ Venta #${result.sale_id} — $${result.total}`)
      setCart({})
      setCustomerName('')
      setWhatsapp('')
      setOrderNote('')
      setPaymentMethod('efectivo')
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const categories = CAT_ORDER.filter(c => products.some(p => p.category === c))

  return (
    <div className="pos-layout">

      {/* ── Productos ─────────────────────────────────────────── */}
      <section className="products-section">
        {categories.map(cat => (
          <div key={cat}>
            <p className="category-label">{CAT_NAMES[cat] || cat}</p>
            <div className="products-grid">
              {products.filter(p => p.category === cat).map(product => {
                const qty = getProductQty(product.id)
                const hasVariants = product.variants?.length > 0
                return (
                  <button key={product.id} className="product-btn" onClick={() => handleProductClick(product)}>
                    <span className="product-name">{product.name}</span>
                    {hasVariants ? (
                      <span className="product-price-range">
                        ${product.variants[0].price}
                        {product.variants.length > 1 && ` – $${product.variants[product.variants.length - 1].price}`}
                      </span>
                    ) : (
                      <span className="product-price">${product.price}</span>
                    )}
                    {qty > 0 && <span className="product-badge">{qty}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      {/* ── Carrito ────────────────────────────────────────────── */}
      <section className="cart-section">
        <h2>Pedido</h2>

        {cartItems.length === 0 ? (
          <p className="empty-cart">Toca un producto para agregar</p>
        ) : (
          <ul className="cart-list">
            {cartItems.map(({ key, product, variant, milk, sugar, price, quantity }) => {
              const subs = [variant, milk, sugar].filter(Boolean).join(' · ')
              return (
                <li key={key} className="cart-item">
                  <div className="cart-item-info">
                    <span className="cart-item-name">{product.name}</span>
                    {subs && <span className="cart-item-subs">{subs}</span>}
                  </div>
                  <div className="cart-item-controls">
                    <button onClick={() => updateQty(key, -1)}>−</button>
                    <span>{quantity}</span>
                    <button onClick={() => updateQty(key, +1)}>+</button>
                  </div>
                  <span className="cart-item-subtotal">${price * quantity}</span>
                </li>
              )
            })}
          </ul>
        )}

        <div className="cart-total">
          <span>Total</span>
          <span>${total}</span>
        </div>

        {/* Datos del cliente y nota */}
        <div className="customer-fields">
          <input
            type="text"
            placeholder="Nombre del cliente (opcional)"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
          />
          <input
            type="tel"
            placeholder="WhatsApp (opcional)"
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
          />
          <textarea
            className="note-input"
            placeholder="Nota del pedido (ej. Para llevar, sin hielo...)"
            value={orderNote}
            onChange={e => setOrderNote(e.target.value)}
            rows={2}
          />
          <div className="payment-method-selector">
            {['efectivo', 'tarjeta', 'transferencia'].map(m => (
              <button
                key={m}
                className={`payment-btn ${paymentMethod === m ? 'selected' : ''}`}
                onClick={() => setPaymentMethod(m)}
              >
                {m === 'efectivo' ? '💵 Efectivo' : m === 'tarjeta' ? '💳 Tarjeta' : '📲 Transferencia'}
              </button>
            ))}
          </div>
        </div>

        {error   && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <button
          className="register-btn"
          onClick={handleSubmit}
          disabled={cartItems.length === 0 || loading}
        >
          {loading ? 'Registrando...' : `Registrar venta  $${total}`}
        </button>
      </section>

      {/* ── Modal personalizador ────────────────────────────────── */}
      {customizer && (
        <div className="variant-overlay" onClick={() => setCustomizer(null)}>
          <div className="customizer-modal" onClick={e => e.stopPropagation()}>
            <h3>{customizer.product.name}</h3>

            {customizer.product.variants?.length > 0 && (
              <div className="customizer-section">
                <p className="customizer-section-title">Preparación</p>
                <div className="customizer-chips">
                  {customizer.product.variants.map(v => (
                    <button
                      key={v.label}
                      className={`customizer-chip ${customizer.variant === v.label ? 'selected' : ''}`}
                      onClick={() => setCustomizer(c => ({ ...c, variant: c.variant === v.label ? null : v.label }))}
                    >
                      {v.label}<span className="customizer-chip-price"> ${v.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="customizer-section">
              <p className="customizer-section-title">Leche</p>
              <div className="customizer-chips">
                {MILK_OPTIONS.map(m => (
                  <button key={m}
                    className={`customizer-chip ${customizer.milk === m ? 'selected' : ''}`}
                    onClick={() => setCustomizer(c => ({ ...c, milk: c.milk === m ? null : m }))}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="customizer-section">
              <p className="customizer-section-title">Azúcar</p>
              <div className="customizer-chips">
                {SUGAR_OPTIONS.map(s => (
                  <button key={s}
                    className={`customizer-chip ${customizer.sugar === s ? 'selected' : ''}`}
                    onClick={() => setCustomizer(c => ({ ...c, sugar: c.sugar === s ? null : s }))}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button className="customizer-add-btn" onClick={handleAddFromCustomizer} disabled={!custReady}>
              {custReady ? `Agregar al pedido — $${custPrice}` : 'Selecciona la preparación'}
            </button>
            <button className="variant-cancel" onClick={() => setCustomizer(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
