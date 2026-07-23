-- ================================================================
-- AutoMart - Supabase Setup (Part 2: Row-Level Security)
-- Run this AFTER Part 1
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- USERS
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

-- DONE: Part 2 complete. Run Part 3 for storage policies.
SELECT 'Part 2: RLS policies created successfully!' AS status;
