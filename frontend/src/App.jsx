import { useState } from 'react'
import POS from './pages/POS'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

export default function App() {
  const [page, setPage] = useState('pos')

  return (
    <div className="app">
      <header className="header">
        <h1>☕ Café POS</h1>
        <nav>
          <button className={page === 'pos'       ? 'active' : ''} onClick={() => setPage('pos')}>
            Ventas
          </button>
          <button className={page === 'dashboard' ? 'active' : ''} onClick={() => setPage('dashboard')}>
            Dashboard
          </button>
          <button className={page === 'admin'     ? 'active' : ''} onClick={() => setPage('admin')}>
            Admin
          </button>
        </nav>
      </header>

      <main>
        {page === 'pos'       && <POS />}
        {page === 'dashboard' && <Dashboard />}
        {page === 'admin'     && <Admin />}
      </main>
    </div>
  )
}
