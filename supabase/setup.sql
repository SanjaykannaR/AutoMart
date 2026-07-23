-- ================================================================
-- AutoMart - Supabase Setup
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ================================================================

-- PART 1: HELPER FUNCTION
-- Auto-updates updated_at timestamp when any row is modified
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $fn$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;


-- PART 2: TABLES

-- USERS TABLE
-- Core user accounts with auth info
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

-- CATEGORIES TABLE
-- Product categories seeded with 8 auto parts types
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

-- PRODUCTS TABLE
-- Auto parts catalog with full-text search index
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

-- ORDERS TABLE
-- Customer orders with status lifecycle tracking
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

-- INVENTORY TABLE
-- Stock tracking with reserve/release/confirm pattern
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

-- WISHLIST TABLE
-- Persistent wishlist replacing Redis storage
CREATE TABLE IF NOT EXISTS wishlist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist_items(user_id);

-- CART TABLE
-- Persistent cart replacing Redis storage
CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

-- NOTIFICATIONS TABLE
-- In-app notification history
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


-- PART 3: DATABASE FUNCTIONS

-- Atomically reserve inventory (prevents race conditions)
CREATE OR REPLACE FUNCTION reserve_inventory(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $fn$
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
$fn$ LANGUAGE plpgsql;

-- Seed inventory for all products with 50 units each
CREATE OR REPLACE FUNCTION seed_inventory()
RETURNS VOID AS $fn$
BEGIN
  INSERT INTO inventory (product_id, quantity, reserved)
  SELECT id, 50, 0
  FROM products
  ON CONFLICT (product_id) DO NOTHING;
END;
$fn$ LANGUAGE plpgsql;


-- PART 4: ROW-LEVEL SECURITY

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- USERS: read/update own profile only
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- PRODUCTS: public read, admin write
DROP POLICY IF EXISTS "products_select_public" ON products;
CREATE POLICY "products_select_public" ON products
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "products_insert_admin" ON products;
CREATE POLICY "products_insert_admin" ON products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );
DROP POLICY IF EXISTS "products_update_admin" ON products;
CREATE POLICY "products_update_admin" ON products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );
DROP POLICY IF EXISTS "products_delete_admin" ON products;
CREATE POLICY "products_delete_admin" ON products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );

-- CATEGORIES: public read, admin write
DROP POLICY IF EXISTS "categories_select_public" ON categories;
CREATE POLICY "categories_select_public" ON categories
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "categories_manage_admin" ON categories;
CREATE POLICY "categories_manage_admin" ON categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );

-- ORDERS: users see own, admin updates status
DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "orders_update_admin" ON orders;
CREATE POLICY "orders_update_admin" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );

-- INVENTORY: admin only
DROP POLICY IF EXISTS "inventory_manage_admin" ON inventory;
CREATE POLICY "inventory_manage_admin" ON inventory
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );

-- WISHLIST: users manage own
DROP POLICY IF EXISTS "wishlist_select_own" ON wishlist_items;
CREATE POLICY "wishlist_select_own" ON wishlist_items
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "wishlist_insert_own" ON wishlist_items;
CREATE POLICY "wishlist_insert_own" ON wishlist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "wishlist_delete_own" ON wishlist_items;
CREATE POLICY "wishlist_delete_own" ON wishlist_items
  FOR DELETE USING (auth.uid() = user_id);

-- CART: users manage own
DROP POLICY IF EXISTS "cart_select_own" ON cart_items;
CREATE POLICY "cart_select_own" ON cart_items
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "cart_insert_own" ON cart_items;
CREATE POLICY "cart_insert_own" ON cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "cart_update_own" ON cart_items;
CREATE POLICY "cart_update_own" ON cart_items
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "cart_delete_own" ON cart_items;
CREATE POLICY "cart_delete_own" ON cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- NOTIFICATIONS: users see own, admin creates
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_insert_admin" ON notifications;
CREATE POLICY "notifications_insert_admin" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE USING (auth.uid() = user_id);


-- PART 5: STORAGE POLICIES
-- First create these 2 buckets manually in Dashboard > Storage > New Bucket:
--   1. product-images  (Public, 5MB limit)
--   2. avatars          (Public, 2MB limit)

-- product-images: public read, admin write
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
CREATE POLICY "product_images_admin_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );

DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );

DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
CREATE POLICY "product_images_admin_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );

-- avatars: public read, users manage own folder
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_user_insert" ON storage.objects;
CREATE POLICY "avatars_user_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_user_update" ON storage.objects;
CREATE POLICY "avatars_user_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_user_delete" ON storage.objects;
CREATE POLICY "avatars_user_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DONE
-- Now create the 2 storage buckets in the dashboard:
--   1. Storage > New Bucket > "product-images" (Public, 5MB)
--   2. Storage > New Bucket > "avatars" (Public, 2MB)
