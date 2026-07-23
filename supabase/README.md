# AutoMart — Supabase Setup Guide

> Created: 2026-07-23
> Status: Complete setup — account creation, database, storage, policies, and queries

---

## Step 1: Create Your Supabase Account & Project

1. Go to **https://supabase.com** → Click **"Start your project"**
2. Sign up with GitHub (recommended) or email
3. Click **"New Project"**
4. Fill in:
   - **Organization**: Create one (e.g., "AutoMart")
   - **Project Name**: `automart`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `East US` or `Mumbai`)
5. Wait ~2 minutes for the project to spin up
6. Go to **Settings → API** and copy:
   - `SUPABASE_URL` — e.g., `https://xxxx.supabase.co`
   - `SUPABASE_ANON_KEY` — public key for frontend
   - `SUPABASE_SERVICE_ROLE_KEY` — admin key for backend (keep secret!)

### Add to .env.docker
```env
# ── Supabase ────────────────────────────────────────────────────────────────
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

---

## Step 2: Database Tables (Run in Supabase SQL Editor)

Go to **Supabase Dashboard → SQL Editor → New Query** and run each section.

### 2a. Users Table (replaces auth-service Prisma schema)
```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- USERS TABLE — Core user accounts
-- Replaces: services/auth-service/prisma/schema.prisma → User model
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password      TEXT NOT NULL,                          -- bcrypt hashed
  role          TEXT NOT NULL DEFAULT 'individual'      -- mechanic | individual | shop
                CHECK (role IN ('mechanic', 'individual', 'shop')),
  phone         TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  address       TEXT,
  avatar        TEXT DEFAULT '👤',                      -- emoji or URL
  auth_provider TEXT DEFAULT 'email'                    -- google | apple | email | phone
                CHECK (auth_provider IN ('google', 'apple', 'email', 'phone')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for login lookup (email is already unique, but explicit index helps)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- Index for phone lookup (OTP flow)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
```

### 2b. Categories Table
```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- CATEGORIES TABLE — Product categories (Brakes, Engine, etc.)
-- Replaces: services/product-service/prisma/schema.prisma → Category model
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT UNIQUE NOT NULL,                           -- e.g., "Brake Parts"
  slug  TEXT UNIQUE NOT NULL,                           -- e.g., "brake-parts"
  icon  TEXT                                             -- icon name or emoji
);

-- Pre-seed the 8 categories from your product seed data
INSERT INTO categories (name, slug, icon) VALUES
  ('Brake Parts', 'brake-parts', '🛑'),
  ('Engine Parts', 'engine-parts', '⚙️'),
  ('Filters', 'filters', '🔧'),
  ('Electrical', 'electrical', '⚡'),
  ('Suspension', 'suspension', '🔩'),
  ('Exhaust', 'exhaust', '💨'),
  ('Lighting', 'lighting', '💡'),
  ('Accessories', 'accessories', '🚗')
ON CONFLICT (name) DO NOTHING;  -- safe to re-run
```

### 2c. Products Table
```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- PRODUCTS TABLE — Auto parts catalog
-- Replaces: services/product-service/prisma/schema.prisma → Product model
-- Note: imageUrl will eventually point to Supabase Storage bucket
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  slug                TEXT UNIQUE NOT NULL,              -- URL-friendly name
  description         TEXT NOT NULL,
  brand               TEXT NOT NULL,
  price               NUMERIC(10,2) NOT NULL CHECK (price > 0),
  image_url           TEXT,                              -- Supabase Storage URL or Unsplash
  category_id         UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  vehicle_type        TEXT NOT NULL DEFAULT 'both'       -- car | bike | both
                      CHECK (vehicle_type IN ('car', 'bike', 'both')),
  compatible_vehicles JSONB DEFAULT '[]'::JSONB,         -- array of vehicle strings
  specifications      JSONB,                             -- key-value spec pairs
  stock               INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_vehicle ON products(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
-- Full-text search index (PostgreSQL native — replaces Fuse.js for DB-level search)
CREATE INDEX IF NOT EXISTS idx_products_search ON products
  USING GIN (to_tsvector('english', name || ' ' || description || ' ' || brand));
```

### 2d. Orders Table
```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- ORDERS TABLE — Customer orders with status tracking
-- Replaces: services/order-service/prisma/schema.prisma → Order model
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  items               JSONB NOT NULL,                   -- [{id, name, price, qty}]
  total               NUMERIC(10,2) NOT NULL CHECK (total > 0),
  status              TEXT NOT NULL DEFAULT 'pending'   -- pending|confirmed|picked|shipped|delivered|cancelled
                      CHECK (status IN ('pending','confirmed','picked','shipped','delivered','cancelled')),
  address             TEXT NOT NULL,
  phone               TEXT NOT NULL,
  note                TEXT,
  estimated_delivery  TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for "my orders" query (most common)
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
-- Index for admin dashboard: orders by status
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
-- Index for recent orders
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
```

### 2e. Inventory Table
```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- INVENTORY TABLE — Stock tracking with reserve/release/confirm pattern
-- Replaces: services/inventory-service/prisma/schema.prisma → InventoryItem
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS inventory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved    INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  location    TEXT,                                     -- warehouse location
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  -- Safety: reserved can never exceed quantity
  CONSTRAINT reserved_lte_quantity CHECK (reserved <= quantity)
);

CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
```

### 2f. Wishlist & Cart Tables (replaces Redis storage)
```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- WISHLIST TABLE — Persistent wishlist (replaces Redis)
-- Currently stored in Redis as JSON; moving to Supabase for durability
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS wishlist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  -- Each user can only have a product in wishlist once
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist_items(user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- CART TABLE — Persistent cart (replaces Redis)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
```

### 2g. Notifications Table (replaces Redis pub/sub persistence)
```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS TABLE — In-app notification history
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT DEFAULT 'info'                        -- info | success | warning | error
              CHECK (type IN ('info', 'success', 'warning', 'error')),
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
```

---

## Step 3: Storage Buckets

Go to **Supabase Dashboard → Storage → New Bucket** and create:

### Bucket 1: `product-images`
| Setting | Value |
|---------|-------|
| **Name** | `product-images` |
| **Public** | ✅ Yes (product images are visible to everyone) |
| **File Size Limit** | 5 MB |
| **Allowed MIME Types** | `image/jpeg`, `image/png`, `image/webp` |

**Purpose**: Store all product photos. Currently using Unsplash URLs — migrate to your own images for:
- Faster load times (CDN-backed)
- No dependency on external services
- Consistent quality/branding

### Bucket 2: `avatars`
| Setting | Value |
|---------|-------|
| **Name** | `avatars` |
| **Public** | ✅ Yes (avatars visible on orders, reviews) |
| **File Size Limit** | 2 MB |
| **Allowed MIME Types** | `image/jpeg`, `image/png`, `image/webp` |

**Purpose**: Store user profile photos. Currently using emoji avatars (`👤`) — allow users to upload real photos.

---

## Step 4: Storage Policies (Row-Level Security)

Run these in **Supabase SQL Editor**:

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE POLICIES — product-images bucket
-- ═══════════════════════════════════════════════════════════════════════════

-- Anyone can view product images (public bucket, but explicit policy is best practice)
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Only authenticated admin users can upload product images
CREATE POLICY "product_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'                    -- must be logged in
    -- Additional admin check: verify user role in users table
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'shop'                            -- only shop/admin role
    )
  );

-- Only the uploader or admins can delete product images
CREATE POLICY "product_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]   -- owner check
      OR EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'shop'
      )
    )
  );

-- Admins can update (replace) product images
CREATE POLICY "product_images_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'shop'
    )
  );


-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE POLICIES — avatars bucket
-- ═══════════════════════════════════════════════════════════════════════════

-- Anyone can view avatars (public profile photos)
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar
-- File path convention: avatars/{user_id}/avatar.{ext}
CREATE POLICY "avatars_user_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text  -- must be in own folder
  );

-- Users can update their own avatar
CREATE POLICY "avatars_user_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own avatar
CREATE POLICY "avatars_user_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## Step 5: Row-Level Security (RLS) for Tables

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES — Enable Row-Level Security on all tables
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ─── USERS ─────────────────────────────────────────────────────────────────
-- Users can only read/update their own profile
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Public can see basic user info (for order display, etc.)
CREATE POLICY "users_select_public"
  ON users FOR SELECT
  USING (true)                    -- name, email, avatar are public; password is excluded via API

-- ─── PRODUCTS ──────────────────────────────────────────────────────────────
-- Everyone can read products (public catalog)
CREATE POLICY "products_select_public"
  ON products FOR SELECT
  USING (true);

-- Only admins (shop role) can create/update/delete products
CREATE POLICY "products_insert_admin"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );

CREATE POLICY "products_update_admin"
  ON products FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );

CREATE POLICY "products_delete_admin"
  ON products FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );

-- ─── CATEGORIES ────────────────────────────────────────────────────────────
-- Everyone can read categories
CREATE POLICY "categories_select_public"
  ON categories FOR SELECT
  USING (true);

-- Only admins can manage categories
CREATE POLICY "categories_insert_admin"
  ON categories FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );

CREATE POLICY "categories_update_admin"
  ON categories FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );

CREATE POLICY "categories_delete_admin"
  ON categories FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );

-- ─── ORDERS ────────────────────────────────────────────────────────────────
-- Users can only see their own orders
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can create orders
CREATE POLICY "orders_insert_own"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins can update order status
CREATE POLICY "orders_update_admin"
  ON orders FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );

-- ─── INVENTORY ─────────────────────────────────────────────────────────────
-- Only admins can view/modify inventory
CREATE POLICY "inventory_select_admin"
  ON inventory FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );

CREATE POLICY "inventory_insert_admin"
  ON inventory FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );

CREATE POLICY "inventory_update_admin"
  ON inventory FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );

-- ─── WISHLIST ──────────────────────────────────────────────────────────────
-- Users can only see/manage their own wishlist
CREATE POLICY "wishlist_select_own"
  ON wishlist_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "wishlist_insert_own"
  ON wishlist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wishlist_delete_own"
  ON wishlist_items FOR DELETE
  USING (auth.uid() = user_id);

-- ─── CART ──────────────────────────────────────────────────────────────────
-- Users can only see/manage their own cart
CREATE POLICY "cart_select_own"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "cart_insert_own"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cart_update_own"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "cart_delete_own"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- ─── NOTIFICATIONS ─────────────────────────────────────────────────────────
-- Users can only see their own notifications
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- System/admin can create notifications
CREATE POLICY "notifications_insert_admin"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'shop')
  );

-- Users can mark their own as read
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own
CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Step 6: Supabase Queries (with inline comments)

### 6a. Auth Queries

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// AUTH QUERIES — User registration, login, and profile management
// Using: @supabase/supabase-js client
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client — use in your backend services
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // service role = bypasses RLS for backend ops
)

// For frontend (RLS-enforced):
const supabaseFrontend = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Register new user ──────────────────────────────────────────────────────
// Insert into users table with bcrypt-hashed password
async function registerUser(name: string, email: string, password: string, role: string = 'individual') {
  const { data, error } = await supabase
    .from('users')                                      // target the users table
    .insert({                                           // INSERT INTO users
      name,
      email,
      password,                                         // must be bcrypt-hashed before this call!
      role,                                             // 'mechanic' | 'individual' | 'shop'
      auth_provider: 'email',                           // track how user signed up
    })
    .select('id, name, email, role, avatar, created_at') // return these fields only (exclude password!)
    .single()                                           // expect exactly one row

  if (error) throw error
  return data                                            // { id, name, email, role, avatar, created_at }
}

// ─── Login: find user by email ──────────────────────────────────────────────
// Query by unique email, then verify bcrypt hash in your code
async function findUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')                                      // users table
    .select('*')                                        // get all fields (including password hash)
    .eq('email', email)                                 // WHERE email = $1
    .single()                                           // expect one result

  if (error) return null                                // user not found
  return data                                           // full user row including password hash
}

// ─── Update user profile ────────────────────────────────────────────────────
// Partial update — only fields passed in `updates` are changed
async function updateUserProfile(userId: string, updates: {
  name?: string
  phone?: string
  address?: string
  avatar?: string
}) {
  const { data, error } = await supabase
    .from('users')                                      // users table
    .update(updates)                                    // UPDATE users SET ...
    .eq('id', userId)                                   // WHERE id = $1
    .select('id, name, email, role, avatar, phone, phone_verified, address') // exclude password!
    .single()

  if (error) throw error
  return data
}

// ─── Mark phone as verified ─────────────────────────────────────────────────
async function markPhoneVerified(userId: string) {
  const { error } = await supabase
    .from('users')
    .update({ phone_verified: true })                   // SET phone_verified = true
    .eq('id', userId)                                   // WHERE id = $1

  if (error) throw error
}
```

### 6b. Product Queries

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT QUERIES — Catalog browsing, search, and admin CRUD
// ═══════════════════════════════════════════════════════════════════════════

// ─── List products with filters ─────────────────────────────────────────────
// Supports: category, brand, price range, vehicle type, text search
async function listProducts(filters: {
  category?: string      // category UUID
  brand?: string         // brand name (partial match)
  minPrice?: number
  maxPrice?: number
  vehicleType?: string   // 'car' | 'bike' | 'both'
  search?: string        // full-text search query
  limit?: number         // pagination: max results (default 20)
  offset?: number        // pagination: skip N rows (default 0)
}) {
  let query = supabase
    .from('products')                                   // products table
    .select('*, categories(name, slug)')                 // JOIN categories, get category name/slug
    .order('created_at', { ascending: false })           // newest first

  // Apply filters conditionally — each .eq/.gte/.lte adds a WHERE clause
  if (filters.category) {
    query = query.eq('category_id', filters.category)   // WHERE category_id = $1
  }
  if (filters.brand) {
    query = query.ilike('brand', `%${filters.brand}%`)  // WHERE brand ILIKE '%brand%' (case-insensitive)
  }
  if (filters.minPrice) {
    query = query.gte('price', filters.minPrice)         // WHERE price >= $1
  }
  if (filters.maxPrice) {
    query = query.lte('price', filters.maxPrice)         // WHERE price <= $1
  }
  if (filters.vehicleType) {
    // Include parts marked 'both' since they fit any vehicle
    query = query.in('vehicle_type', [filters.vehicleType, 'both']) // WHERE vehicle_type IN ('car', 'both')
  }
  if (filters.search) {
    // PostgreSQL full-text search — much faster than Fuse.js for large catalogs
    query = query.textSearch('name', filters.search, {
      type: 'websearch',                                 // Google-like search syntax
      config: 'english',                                 // English stemming
    })
  }

  // Pagination
  const limit = filters.limit || 20
  const offset = filters.offset || 0
  query = query.range(offset, offset + limit - 1)        // LIMIT $1 OFFSET $2

  const { data, error } = await query
  if (error) throw error
  return data
}

// ─── Get single product by ID ───────────────────────────────────────────────
async function getProductById(id: string) {
  const { data, error } = await supabase
    .from('products')                                   // products table
    .select('*, categories(*)')                         // JOIN full category object
    .eq('id', id)                                       // WHERE id = $1
    .single()                                           // expect one result

  if (error) throw error
  return data
}

// ─── Full-text search (replaces Fuse.js + Trie) ─────────────────────────────
// PostgreSQL native search handles stemming, ranking, and fuzzy matching
async function searchProducts(query: string, limit: number = 20) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .textSearch('name', query, {
      type: 'websearch',                                 // supports AND, OR, NOT, quotes
      config: 'english',                                 // stems words: "running" → "run"
    })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// ─── Get products by category slug ──────────────────────────────────────────
async function getProductsByCategory(slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories!inner(name, slug)')           // INNER JOIN categories
    .eq('categories.slug', slug)                         // WHERE categories.slug = $1
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ─── Get popular products (by order count) ──────────────────────────────────
// Joins products with orders to find most-purchased items
async function getPopularProducts(limit: number = 10) {
  const { data, error } = await supabase
    .rpc('get_popular_products', { p_limit: limit })     // call a database function (see below)

  if (error) throw error
  return data
}

// ─── Admin: Create product ──────────────────────────────────────────────────
async function createProduct(product: {
  name: string
  description: string
  brand: string
  price: number
  category_id: string
  vehicle_type?: string
  compatible_vehicles?: string[]
  specifications?: Record<string, any>
  stock?: number
  image_url?: string
}) {
  // Auto-generate slug from name (same logic as current product-service)
  const slug = product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')                        // non-alphanumeric → hyphen
    .replace(/^-|-$/g, '')                               // trim leading/trailing hyphens

  const { data, error } = await supabase
    .from('products')
    .insert({
      ...product,
      slug,                                              // auto-generated slug
      compatible_vehicles: product.compatible_vehicles || [],
      specifications: product.specifications || {},
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

### 6c. Order Queries

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// ORDER QUERIES — Place orders, track status, admin management
// ═══════════════════════════════════════════════════════════════════════════

// ─── Create order ───────────────────────────────────────────────────────────
// Validates total matches items, sets estimated delivery (30 min)
async function createOrder(userId: string, order: {
  items: Array<{ id: string; name: string; price: number; qty: number }>
  total: number
  address: string
  phone: string
  note?: string
}) {
  // Server-side total validation (same as current order-service)
  const itemsTotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0)
  if (Math.abs(itemsTotal - order.total) > 0.01) {
    throw new Error(`Total mismatch: expected ${itemsTotal}, got ${order.total}`)
  }

  const estimatedDelivery = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now

  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      items: order.items,                                // PostgreSQL JSONB — stores array natively!
      total: order.total,
      address: order.address,
      phone: order.phone,
      note: order.note,
      status: 'pending',                                 // initial status
      estimated_delivery: estimatedDelivery.toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  // Auto-reserve inventory for each item (same as Redis event handler)
  for (const item of order.items) {
    await supabase.rpc('reserve_inventory', {            // call stored procedure
      p_product_id: item.id,
      p_quantity: item.qty,
    })
  }

  return data
}

// ─── Get user's orders ──────────────────────────────────────────────────────
// Returns all orders for the logged-in user, newest first
async function getUserOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')                                        // all order fields
    .eq('user_id', userId)                              // WHERE user_id = $1 (own orders only!)
    .order('created_at', { ascending: false })           // newest first

  if (error) throw error
  return data                                            // items field is already JSONB (no parsing needed!)
}

// ─── Get single order ───────────────────────────────────────────────────────
async function getOrderById(orderId: string, userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)                                  // WHERE id = $1
    .eq('user_id', userId)                              // AND user_id = $2 (security: only own orders!)
    .single()

  if (error) throw error
  return data
}

// ─── Update order status (admin only) ───────────────────────────────────────
// Enforces state machine: pending → confirmed → picked → shipped → delivered
async function updateOrderStatus(orderId: string, newStatus: string) {
  // State machine validation (same as current order-service)
  const validTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['picked', 'cancelled'],
    picked: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],                                       // terminal state
    cancelled: [],                                       // terminal state
  }

  // First, get current status to validate transition
  const { data: order } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('Order not found')
  if (!validTransitions[order.status]?.includes(newStatus)) {
    throw new Error(`Cannot transition from "${order.status}" to "${newStatus}"`)
  }

  const updateData: Record<string, any> = { status: newStatus }
  if (newStatus === 'delivered') {
    updateData.delivered_at = new Date().toISOString()  // set delivery timestamp
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)                                 // UPDATE orders SET status = $1 ...
    .eq('id', orderId)                                  // WHERE id = $2
    .select()
    .single()

  if (error) throw error
  return data
}
```

### 6d. Inventory Queries

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY QUERIES — Stock management with reserve/release/confirm
// ═══════════════════════════════════════════════════════════════════════════

// ─── Check stock availability ───────────────────────────────────────────────
async function checkStock(productId: string) {
  const { data, error } = await supabase
    .from('inventory')
    .select('product_id, quantity, reserved')            // raw counts
    .eq('product_id', productId)                        // WHERE product_id = $1
    .single()

  if (error) throw error

  return {
    productId: data.product_id,
    total: data.quantity,                                // physical stock
    reserved: data.reserved,                             // held by pending orders
    available: data.quantity - data.reserved,            // CAN be ordered = total - reserved
  }
}

// ─── Reserve stock (called when order is placed) ────────────────────────────
// Uses PostgreSQL atomic increment to prevent race conditions
async function reserveStock(productId: string, quantity: number) {
  // First check availability
  const stock = await checkStock(productId)
  if (stock.available < quantity) {
    throw new Error(`Insufficient stock: ${stock.available} available, ${quantity} requested`)
  }

  // Atomic increment — safe for concurrent requests
  const { data, error } = await supabase
    .from('inventory')
    .update({
      reserved: stock.reserved + quantity,               // reserved += quantity
    })
    .eq('product_id', productId)                        // WHERE product_id = $1
    .select('quantity, reserved')
    .single()

  if (error) throw error
  return {
    available: data.quantity - data.reserved,            // remaining available
    reserved: data.reserved,
  }
}

// ─── Release stock (called when order is cancelled) ─────────────────────────
async function releaseStock(productId: string, quantity: number) {
  const stock = await checkStock(productId)
  if (stock.reserved < quantity) {
    throw new Error(`Cannot release ${quantity}: only ${stock.reserved} reserved`)
  }

  const { error } = await supabase
    .from('inventory')
    .update({ reserved: stock.reserved - quantity })     // reserved -= quantity
    .eq('product_id', productId)

  if (error) throw error
}

// ─── Confirm stock (called when order is shipped) ───────────────────────────
// Decrements BOTH quantity and reserved (stock leaves warehouse)
async function confirmStock(productId: string, quantity: number) {
  const stock = await checkStock(productId)
  if (stock.reserved < quantity) {
    throw new Error(`Cannot confirm ${quantity}: only ${stock.reserved} reserved`)
  }

  const { error } = await supabase
    .from('inventory')
    .update({
      quantity: stock.total - quantity,                  // quantity -= units shipped
      reserved: stock.reserved - quantity,               // reserved -= units shipped
    })
    .eq('product_id', productId)

  if (error) throw error
}
```

### 6e. Wishlist & Cart Queries

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// WISHLIST QUERIES — Add/remove/view wishlist items
// ═══════════════════════════════════════════════════════════════════════════

// ─── Get user's wishlist with product details ───────────────────────────────
// JOINs wishlist_items → products → categories for a rich response
async function getWishlist(userId: string) {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select(`
      id,
      product_id,
      added_at,
      products (
        id, name, slug, price, image_url, brand,
        categories (name, slug)
      )
    `)                                                   // nested select = JOIN
    .eq('user_id', userId)                              // WHERE user_id = $1
    .order('added_at', { ascending: false })             // newest first

  if (error) throw error
  return data
}

// ─── Add to wishlist ────────────────────────────────────────────────────────
async function addToWishlist(userId: string, productId: string) {
  const { data, error } = await supabase
    .from('wishlist_items')
    .upsert(                                             // INSERT or ignore if exists (UNIQUE constraint)
      { user_id: userId, product_id: productId },
      { onConflict: 'user_id,product_id', ignoreDuplicates: true }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── Remove from wishlist ───────────────────────────────────────────────────
async function removeFromWishlist(userId: string, productId: string) {
  const { error } = await supabase
    .from('wishlist_items')
    .delete()                                            // DELETE FROM wishlist_items
    .eq('user_id', userId)                              // WHERE user_id = $1
    .eq('product_id', productId)                        // AND product_id = $2

  if (error) throw error
}

// ═══════════════════════════════════════════════════════════════════════════
// CART QUERIES — Add/update/remove/view cart items
// ═══════════════════════════════════════════════════════════════════════════

// ─── Get user's cart with product details ───────────────────────────────────
async function getCart(userId: string) {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      id,
      product_id,
      quantity,
      added_at,
      products (
        id, name, slug, price, image_url, brand, stock,
        categories (name, slug)
      )
    `)
    .eq('user_id', userId)
    .order('added_at', { ascending: false })

  if (error) throw error
  return data
}

// ─── Add to cart (upsert: increment qty if already exists) ──────────────────
async function addToCart(userId: string, productId: string, quantity: number = 1) {
  // Try to get existing cart item
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single()

  if (existing) {
    // Item exists → increment quantity
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity }) // quantity += $1
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    // New item → insert
    const { data, error } = await supabase
      .from('cart_items')
      .insert({ user_id: userId, product_id: productId, quantity })
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// ─── Update cart item quantity ───────────────────────────────────────────────
async function updateCartQuantity(userId: string, productId: string, quantity: number) {
  if (quantity <= 0) {
    // Quantity 0 or negative → remove from cart
    return removeFromCart(userId, productId)
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })                               // UPDATE quantity
    .eq('user_id', userId)                              // WHERE user_id = $1
    .eq('product_id', productId)                        // AND product_id = $2
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── Remove from cart ───────────────────────────────────────────────────────
async function removeFromCart(userId: string, productId: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)

  if (error) throw error
}

// ─── Clear entire cart ──────────────────────────────────────────────────────
async function clearCart(userId: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)                              // DELETE WHERE user_id = $1

  if (error) throw error
}
```

### 6f. Storage Upload Queries

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// STORAGE QUERIES — Upload/download product images and avatars
// ═══════════════════════════════════════════════════════════════════════════

// ─── Upload product image ───────────────────────────────────────────────────
// Path convention: product-images/{product-id}/{filename}
async function uploadProductImage(productId: string, file: File) {
  const fileExt = file.name.split('.').pop()             // extract extension (jpg, png, webp)
  const filePath = `${productId}/${Date.now()}.${fileExt}` // unique path with timestamp

  const { data, error } = await supabase
    .storage
    .from('product-images')                              // target bucket
    .upload(filePath, file, {                            // upload file
      contentType: `image/${fileExt}`,                   // set MIME type
      upsert: true,                                      // overwrite if exists
    })

  if (error) throw error

  // Get public URL for the uploaded image
  const { data: urlData } = supabase
    .storage
    .from('product-images')
    .getPublicUrl(filePath)                              // generates: https://xxx.supabase.co/storage/v1/object/public/product-images/...

  // Update product's image_url in the database
  await supabase
    .from('products')
    .update({ image_url: urlData.publicUrl })            // UPDATE products SET image_url = $1
    .eq('id', productId)                                 // WHERE id = $2

  return { path: filePath, url: urlData.publicUrl }
}

// ─── Upload user avatar ─────────────────────────────────────────────────────
// Path convention: avatars/{user-id}/avatar.{ext}
async function uploadAvatar(userId: string, file: File) {
  const fileExt = file.name.split('.').pop()
  const filePath = `${userId}/avatar.${fileExt}`         // fixed filename per user (overwrites old avatar)

  const { error } = await supabase
    .storage
    .from('avatars')
    .upload(filePath, file, {
      contentType: `image/${fileExt}`,
      upsert: true,                                      // replace existing avatar
    })

  if (error) throw error

  // Get public URL
  const { data: urlData } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(filePath)

  // Update user's avatar field in the database
  await supabase
    .from('users')
    .update({ avatar: urlData.publicUrl })               // UPDATE users SET avatar = $1
    .eq('id', userId)

  return { path: filePath, url: urlData.publicUrl }
}

// ─── Delete product image ───────────────────────────────────────────────────
async function deleteProductImage(productId: string, filePath: string) {
  const { error } = await supabase
    .storage
    .from('product-images')
    .remove([filePath])                                  // delete file from bucket

  if (error) throw error

  // Clear the image_url in the database
  await supabase
    .from('products')
    .update({ image_url: null })                         // SET image_url = NULL
    .eq('id', productId)
}
```

### 6g. Notification Queries

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION QUERIES — In-app notifications
// ═══════════════════════════════════════════════════════════════════════════

// ─── Get user's notifications ───────────────────────────────────────────────
async function getNotifications(userId: string, unreadOnly: boolean = false) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)                              // WHERE user_id = $1
    .order('created_at', { ascending: false })           // newest first

  if (unreadOnly) {
    query = query.eq('read', false)                      // AND read = false
  }

  const { data, error } = await query.limit(50)          // max 50 notifications
  if (error) throw error
  return data
}

// ─── Mark notification as read ──────────────────────────────────────────────
async function markNotificationRead(notificationId: string, userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })                              // SET read = true
    .eq('id', notificationId)                            // WHERE id = $1
    .eq('user_id', userId)                              // AND user_id = $2 (security!)

  if (error) throw error
}

// ─── Mark all as read ───────────────────────────────────────────────────────
async function markAllRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })                              // SET read = true
    .eq('user_id', userId)                              // WHERE user_id = $1
    .eq('read', false)                                   // AND read = false (only unread)

  if (error) throw error
}

// ─── Create notification (admin/system) ─────────────────────────────────────
async function createNotification(userId: string, title: string, message: string, type: string = 'info') {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type,                                              // 'info' | 'success' | 'warning' | 'error'
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

---

## Step 7: Database Functions (for complex operations)

Run these in **SQL Editor** — they handle operations that need atomic DB-level guarantees:

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- DATABASE FUNCTIONS — Stored procedures for atomic operations
-- ═══════════════════════════════════════════════════════════════════════════

-- Reserve inventory atomically (prevents race conditions)
CREATE OR REPLACE FUNCTION reserve_inventory(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
DECLARE
  current_available INTEGER;
BEGIN
  -- Get current available stock (quantity - reserved)
  SELECT quantity - reserved INTO current_available
  FROM inventory WHERE product_id = p_product_id;

  -- Check sufficient stock
  IF current_available < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock: % available, % requested',
      current_available, p_quantity;
  END IF;

  -- Atomically increment reserved
  UPDATE inventory
  SET reserved = reserved + p_quantity
  WHERE product_id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Get popular products (most ordered)
CREATE OR REPLACE FUNCTION get_popular_products(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  product_id UUID,
  name TEXT,
  slug TEXT,
  price NUMERIC,
  image_url TEXT,
  order_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.name,
    p.slug,
    p.price,
    p.image_url,
    COUNT(o.id) AS order_count                           -- count how many orders include this product
  FROM products p
  INNER JOIN orders o ON o.items @> jsonb_build_array(   -- JSONB containment: order items contain product
    jsonb_build_object('id', p.id::text)
  )
  GROUP BY p.id, p.name, p.slug, p.price, p.image_url
  ORDER BY order_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Seed inventory for all products (run after inserting products)
CREATE OR REPLACE FUNCTION seed_inventory()
RETURNS VOID AS $$
BEGIN
  INSERT INTO inventory (product_id, quantity, reserved)
  SELECT id, 50, 0                                      -- default: 50 units, 0 reserved
  FROM products
  ON CONFLICT (product_id) DO NOTHING;                   -- skip if already exists
END;
$$ LANGUAGE plpgsql;

-- Run it:
SELECT seed_inventory();
```

---

## Step 8: Frontend Integration (Next.js)

### Install Supabase client
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Create `lib/supabase.ts` (frontend client)
```typescript
// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT — Frontend (RLS-enforced)
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js'

// Public anon key — safe for browser, RLS protects data
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Create `lib/supabase-server.ts` (backend/API client)
```typescript
// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT — Backend (bypasses RLS with service role key)
// Use this in API routes and server-side code only!
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js'

// Service role key — FULL ACCESS, bypasses RLS — never expose to browser!
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

---

## Summary: What You Need

| Item | Action |
|------|--------|
| **1. Supabase Account** | Go to supabase.com → Sign up → New project |
| **2. Environment Variables** | Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` to `.env.docker` |
| **3. SQL Tables** | Run Sections 2a–2g in SQL Editor (creates all 8 tables) |
| **4. Storage Buckets** | Create `product-images` (public) and `avatars` (public) buckets in dashboard |
| **5. Storage Policies** | Run Section 4 in SQL Editor (RLS for buckets) |
| **6. Table RLS** | Run Section 5 in SQL Editor (row-level security on all tables) |
| **7. DB Functions** | Run Section 7 in SQL Editor (atomic inventory, popular products) |
| **8. npm install** | `npm install @supabase/supabase-js @supabase/ssr` |
| **9. Replace API calls** | Swap Express endpoints with Supabase client calls (see queries above) |
