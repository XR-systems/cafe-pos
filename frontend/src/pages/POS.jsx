import { useState, useEffect } from 'react'
import { getProducts, registerSale } from '../api/client'

const CAT_ORDER = ['cafe', 'sin cafe', 'panes', 'comida']
const CAT_NAMES = { 'cafe': 'Café', 'sin cafe': 'Bebidas sin café', 'panes': 'Panes', 'comida': 'Comida' }

const fmtMoney = (n) => `$${n}`

export default function POS() {
  const [products, setProducts]         = useState([])
  const [cart, setCart]                 = useState({})   // key: `${id}_${variant||'base'}`
  const [variantPicker, setVariantPicker] = useState(null) // product | null
  const [whatsapp, setWhatsapp]         = useState('')
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading]           = useState(false)
  const [success, setSuccess]           = useState(null)
  const [error, setError]               = useState(null)

  useEffect(() => {
    getProducts().then(setProducts).catch(() => setError('No se pudieron cargar los productos'))
  }, [])

  // ─── Carrito ──────────────────────────────────────────────────
  const addToCart = (product, variant, price) => {
    const key = `${product.id}_${variant || 'base'}`
    setCart(prev => ({
      ...prev,
      [key]: { key, product, variant, price, quantity: (prev[key]?.quantity || 0) + 1 }
    }))
  }

  const updateQty = (key, delta) => {
    setCart(prev => {
      const newQty = (prev[key]?.quantity || 0) + delta
      if (newQty <= 0) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: { ...prev[key], quantity: newQty } }
    })
  }

  const cartItems = Object.values(cart)
  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  // Cantidad total de un producto (sumando todas sus variantes)
  const getProductQty = (productId) =>
    Object.entries(cart)
      .filter(([k]) => k.startsWith(`${productId}_`))
      .reduce((sum, [, i]) => sum + i.quantity, 0)

  // ─── Click en producto ────────────────────────────────────────
  const handleProductClick = (product) => {
    if (product.variants && product.variants.length > 0) {
      setVariantPicker(product)
    } else {
      addToCart(product, null, product.price)
    }
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
        })),
        customer_whatsapp: whatsapp || undefined,
        customer_name:     customerName || undefined,
      })
      setSuccess(`✓ Venta #${result.sale_id} — $${result.total}`)
      setCart({})
      setWhatsapp('')
      setCustomerName('')
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
                const hasVariants = product.variants && product.variants.length > 0
                return (
                  <button
                    key={product.id}
                    className="product-btn"
                    onClick={() => handleProductClick(product)}
                  >
                    <span className="product-name">{product.name}</span>
                    {hasVariants ? (
                      <span className="product-price-range">
                        ${product.variants[0].price}
                        {product.variants.length > 1 && ` – $${product.variants[product.variants.length - 1].price}`}
                      </span>
                    ) : (
                      <span className="product-price">{fmtMoney(product.price)}</span>
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
            {cartItems.map(({ key, product, variant, price, quantity }) => (
              <li key={key} className="cart-item">
                <span className="cart-item-name">
                  {product.name}
                  {variant && <span className="variant-tag"> · {variant}</span>}
                </span>
                <div className="cart-item-controls">
                  <button onClick={() => updateQty(key, -1)}>−</button>
                  <span>{quantity}</span>
                  <button onClick={() => updateQty(key, +1)}>+</button>
                </div>
                <span className="cart-item-subtotal">${price * quantity}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="cart-total">
          <span>Total</span>
          <span>${total}</span>
        </div>

        <div className="customer-fields">
          <input
            type="tel"
            placeholder="WhatsApp (opcional) ej: 5211234567"
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
          />
          {whatsapp && (
            <input
              type="text"
              placeholder="Nombre del cliente (opcional)"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
          )}
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

      {/* ── Modal selector de variante ─────────────────────────── */}
      {variantPicker && (
        <div className="variant-overlay" onClick={() => setVariantPicker(null)}>
          <div className="variant-modal" onClick={e => e.stopPropagation()}>
            <h3>{variantPicker.name}</h3>
            <p className="variant-modal-sub">¿Cómo lo quieres?</p>
            <div className="variant-options">
              {variantPicker.variants.map(v => (
                <button
                  key={v.label}
                  className="variant-option-btn"
                  onClick={() => {
                    addToCart(variantPicker, v.label, v.price)
                    setVariantPicker(null)
                  }}
                >
                  <span className="variant-option-label">{v.label}</span>
                  <span className="variant-option-price">${v.price}</span>
                </button>
              ))}
            </div>
            <button className="variant-cancel" onClick={() => setVariantPicker(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
