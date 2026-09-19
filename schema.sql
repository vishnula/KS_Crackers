-- Cloudflare D1 schema.
--   local:  npx wrangler d1 execute ks-crackers-db --local  --file=./schema.sql
--   remote: npx wrangler d1 execute ks-crackers-db --remote --file=./schema.sql

-- Catalogue. Seeded from the client's PDF via `npm run db:seed`, then owned by
-- the admin panel. sort_order preserves the order items appear in the printed
-- price list; category order is derived from the lowest sort_order in each.
CREATE TABLE IF NOT EXISTS products (
  code       INTEGER PRIMARY KEY,
  category   TEXT NOT NULL,
  name       TEXT NOT NULL,
  unit       TEXT NOT NULL,
  mrp        REAL NOT NULL,
  price      REAL NOT NULL,
  in_stock   INTEGER NOT NULL DEFAULT 1,
  active     INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  image_url  TEXT,
  video_url  TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_sort ON products (active, sort_order);

CREATE TABLE IF NOT EXISTS orders (
  id                TEXT PRIMARY KEY,
  order_no          TEXT NOT NULL UNIQUE,
  seq               INTEGER NOT NULL,
  year              INTEGER NOT NULL,
  customer_name     TEXT NOT NULL,
  mobile            TEXT NOT NULL,
  whatsapp          TEXT,
  email             TEXT,
  address           TEXT NOT NULL,
  city              TEXT NOT NULL,
  state             TEXT NOT NULL,
  pincode           TEXT NOT NULL,
  transport_pref    TEXT,
  notes             TEXT,
  subtotal          REAL NOT NULL,
  discount          REAL NOT NULL,
  total             REAL NOT NULL,
  status            TEXT NOT NULL DEFAULT 'new',
  payment_method    TEXT,
  payment_status    TEXT NOT NULL DEFAULT 'unpaid',
  utr               TEXT,
  payment_proof_url TEXT,
  mobile_verified   INTEGER NOT NULL DEFAULT 0,
  order_ip          TEXT,
  created_at        TEXT NOT NULL
);

-- The owner's default view is "new orders, newest first".
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_mobile ON orders (mobile);

-- Order numbers are allocated per year. One row per year, incremented in place.
CREATE TABLE IF NOT EXISTS order_sequences (
  year INTEGER PRIMARY KEY,
  last INTEGER NOT NULL
);

-- Product details are copied in, not joined: prices change mid-season and a past
-- order must never silently re-price.
CREATE TABLE IF NOT EXISTS order_items (
  id         TEXT PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  code       TEXT NOT NULL,
  name       TEXT NOT NULL,
  unit       TEXT NOT NULL,
  price      REAL NOT NULL,
  qty        INTEGER NOT NULL,
  line_total REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
