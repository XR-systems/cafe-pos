import { useState, useEffect } from 'react'
import { getProducts, registerSale } from '../api/client'

export default function POS() {
  const [products, setProducts]       = useState([])
  const [cart, setCart]               = useState({})   // { [id]: { product, quantity } }
  const [whatsapp, setWhatsapp]       = useState('')
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading]         = useState(false)
  const [success, setSuccess]         = useState(null)
  const [error, setError]             = useState(null)

  useEffect(() => {
    getProducts().then(setProducts).catch(() => setError('No se pudieron cargar los productos'))
  }, [])

  // ─── Lógica del carrito ───
  const addToCart = (product) => {
    setCart(prev => ({
      ...prev,
      [product.id]: {
        product,
        quantity: (prev[product.id]?.quantity || 0) + 1
      }
    }))
  }

  const updateQty = (productId, delta) => {
    setCart(prev => {
      const newQty = (prev[productId]?.quantity || 0) + delta
      if (newQty <= 0) {
        const next = { ...prev }
        delete next[productId]
        return next
      }
      return { ...prev, [productId]: { ...prev[productId], quantity: newQty } }
    })
  }

  const cartItems = Object.values(cart)
  const total = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  // ─── Registrar venta ───
  const handleSubmit = async () => {
    if (cartItems.length === 0 || loading) return
    setLoading(true)
    setError(null)

    try {
      const result = await registerSale({
        items: cartItems.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
        customer_whatsapp: whatsapp || undefined,
        customer_name: customerName || undefined
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

  // ─── Categorías para agrupar productos ───
  const categories = [...new Set(products.map(p => p.category))]

  return (
    <div className="pos-layout">

      {/* ── Productos ── */}
      <section className="products-section">
        {categories.map(cat => (
          <div key={cat}>
            <p className="category-label">{cat}</p>
            <div className="products-grid">
              {products.filter(p => p.category === cat).map(product => (
                <button
                  key={product.id}
                  className="product-btn"
                  onClick={() => addToCart(product)}
                >
                  <span className="product-name">{product.name}</span>
                  <span className="product-price">${product.price}</span>
                  {cart[product.id] && (
                    <span className="product-badge">{cart[product.id].quantity}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ── Carrito ── */}
      <section className="cart-section">
        <h2>Pedido</h2>

        {cartItems.length === 0 ? (
          <p className="empty-cart">Toca un producto para agregar</p>
        ) : (
          <ul className="cart-list">
            {cartItems.map(({ product, quantity }) => (
              <li key={product.id} className="cart-item">
                <span className="cart-item-name">{product.name}</span>
                <div className="cart-item-controls">
                  <button onClick={() => updateQty(product.id, -1)}>−</button>
                  <span>{quantity}</span>
                  <button onClick={() => updateQty(product.id, +1)}>+</button>
                </div>
                <span className="cart-item-subtotal">${product.price * quantity}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="cart-total">
          <span>Total</span>
          <span>${total}</span>
        </div>

        {/* WhatsApp opcional */}
        <div className="customer-fields">
          <input
            type="tel"
            placeholder="WhatsApp (opcional) ej: 5491155..."
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

    </div>
  )
}
