-- ================================================================
-- AutoMart - Supabase Setup (Part 1: Tables & Functions)
-- Run this FIRST in Supabase SQL Editor
-- ================================================================

-- Helper function: auto-updates updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password        TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'individual'
                  CHECK (role IN ('mechanic', 'individual', 'shop')),
  phone           TEXT,
  phone_verified  BOOLEAN DEFAULT FALSE,
  address         TEXT,
  avatar          TEXT DEFAULT 'user-avatar',
  auth_provider   TEXT DEFAULT 'email'
                  CHECK (auth_provider IN ('google', 'apple', 'email', 'phone')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT UNIQUE NOT NULL,
  slug  TEXT UNIQUE NOT NULL,
  icon  TEXT
);

INSERT INTO categories (name, slug, icon) VALUES
  ('Brake Parts', 'brake-parts', 'brake'),
  ('Engine Parts', 'engine-parts', 'engine'),
  ('Filters', 'filters', 'filter'),
  ('Electrical', 'electrical', 'electrical'),
  ('Suspension', 'suspension', 'suspension'),
  ('Exhaust', 'exhaust', 'exhaust'),
  ('Lighting', 'lighting', 'lighting'),
  ('Accessories', 'accessories', 'accessories')
ON CONFLICT (name) DO NOTHING;

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  slug                TEXT UNIQUE NOT NULL,
  description         TEXT NOT NULL,
  brand               TEXT NOT NULL,
  price               NUMERIC(10,2) NOT NULL CHECK (price > 0),
  image_url           TEXT,
  category_id         UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  vehicle_type        TEXT NOT NULL DEFAULT 'both'
                      CHECK (vehicle_type IN ('car', 'bike', 'both')),
  compatible_vehicles JSONB DEFAULT '[]'::JSONB,
  specifications      JSONB,
  stock               INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_vehicle ON products(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  items               JSONB NOT NULL,
  total               NUMERIC(10,2) NOT NULL CHECK (total > 0),
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','confirmed','picked','shipped','delivered','cancelled')),
  address             TEXT NOT NULL,
  phone               TEXT NOT NULL,
  note                TEXT,
  estimated_delivery  TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- INVENTORY
CREATE TABLE IF NOT EXISTS inventory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved    INTEGER NOT NULL DEFAULT 0 CHECK (reserved <= quantity),
  location    TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS inventory_updated_at ON inventory;
CREATE TRIGGER inventory_updated_at BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);

-- WISHLIST
CREATE TABLE IF NOT EXISTS wishlist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist_items(user_id);

-- CART
CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT DEFAULT 'info'
              CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- DATABASE FUNCTIONS
CREATE OR REPLACE FUNCTION reserve_inventory(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
DECLARE
  current_available INTEGER;
BEGIN
  SELECT quantity - reserved INTO current_available
  FROM inventory WHERE product_id = p_product_id;

  IF current_available IS NULL THEN
    RAISE EXCEPTION 'No inventory record for product %', p_product_id;
  END IF;

  IF current_available < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock: % available, % requested',
      current_available, p_quantity;
  END IF;

  UPDATE inventory
  SET reserved = reserved + p_quantity
  WHERE product_id = p_product_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION seed_inventory()
RETURNS VOID AS $$
BEGIN
  INSERT INTO inventory (product_id, quantity, reserved)
  SELECT id, 50, 0
  FROM products
  ON CONFLICT (product_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- DONE: Part 1 complete. Run Part 2 for RLS policies.
SELECT 'Part 1: Tables created successfully!' AS status;
