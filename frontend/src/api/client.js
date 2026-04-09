// En desarrollo usa el proxy de Vite (/api → localhost:3001)
// En producción usa la URL real del backend (variable de entorno)
const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export const getProducts  = ()       => request('/products');
export const getDashboard = ()       => request('/dashboard');
export const getTodaySales = ()      => request('/sales/today');
export const registerSale = (body)   => request('/sales',    { method: 'POST', body: JSON.stringify(body) });
export const createProduct = (body)  => request('/products', { method: 'POST', body: JSON.stringify(body) });
