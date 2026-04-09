import { useState } from 'react'
import POS from './pages/POS'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Comandas from './pages/Comandas'
import Historial from './pages/Historial'
import Corte from './pages/Corte'

export default function App() {
  const [page, setPage] = useState('pos')

  return (
    <div className="app">
      <header className="header">
        <h1>Cafetería Verona</h1>
        <nav>
          <button className={page === 'pos'       ? 'active' : ''} onClick={() => setPage('pos')}>
            Ventas
          </button>
          <button className={page === 'comandas'  ? 'active' : ''} onClick={() => setPage('comandas')}>
            Comandas
          </button>
          <button className={page === 'dashboard' ? 'active' : ''} onClick={() => setPage('dashboard')}>
            Dashboard
          </button>
          <button className={page === 'historial' ? 'active' : ''} onClick={() => setPage('historial')}>
            Historial
          </button>
          <button className={page === 'corte'     ? 'active' : ''} onClick={() => setPage('corte')}>
            Corte
          </button>
          <button className={page === 'admin'     ? 'active' : ''} onClick={() => setPage('admin')}>
            Admin
          </button>
        </nav>
      </header>

      <main>
        {page === 'pos'       && <POS />}
        {page === 'comandas'  && <Comandas />}
        {page === 'dashboard' && <Dashboard />}
        {page === 'historial' && <Historial />}
        {page === 'corte'     && <Corte />}
        {page === 'admin'     && <Admin />}
      </main>
    </div>
  )
}
