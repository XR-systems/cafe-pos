import { useState } from 'react'
import POS from './pages/POS'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [page, setPage] = useState('pos')

  return (
    <div className="app">
      <header className="header">
        <h1>☕ Café POS</h1>
        <nav>
          <button
            className={page === 'pos' ? 'active' : ''}
            onClick={() => setPage('pos')}
          >
            Ventas
          </button>
          <button
            className={page === 'dashboard' ? 'active' : ''}
            onClick={() => setPage('dashboard')}
          >
            Dashboard
          </button>
        </nav>
      </header>

      <main>
        {page === 'pos' ? <POS /> : <Dashboard />}
      </main>
    </div>
  )
}
