-- ─────────────────────────────────────────
-- SCHEMA: Café POS
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  price      REAL    NOT NULL,
  category   TEXT    DEFAULT 'cafe',
  variants   TEXT,                    -- JSON: [{label, price}, ...]
  active     INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT,
  whatsapp   TEXT UNIQUE,          -- único por número
  visits     INTEGER DEFAULT 0,
  last_visit DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  total       REAL    NOT NULL,
  note        TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id    INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity   INTEGER NOT NULL DEFAULT 1,
  unit_price REAL    NOT NULL    -- precio al momento de la venta
);

-- ─── Índices para consultas frecuentes ───
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(whatsapp);

-- Menú se inicializa desde database.js para soportar variantes JSON

CREATE TABLE IF NOT EXISTS cash_registers (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  date                TEXT    NOT NULL UNIQUE,
  opening_cash        REAL    DEFAULT 0,
  total_sales         REAL    DEFAULT 0,
  sales_efectivo      REAL    DEFAULT 0,
  sales_tarjeta       REAL    DEFAULT 0,
  sales_transferencia REAL    DEFAULT 0,
  total_expenses      REAL    DEFAULT 0,
  expected_cash       REAL    DEFAULT 0,
  notes               TEXT,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT    NOT NULL,
  amount      REAL    NOT NULL,
  category    TEXT    DEFAULT 'general',
  date        TEXT    NOT NULL DEFAULT (date('now', 'localtime')),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goals (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  target      REAL    NOT NULL,
  percentage  INTEGER NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
