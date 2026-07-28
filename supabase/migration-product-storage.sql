-- Storage bucket for admin product images
-- Run this in the Supabase SQL Editor.

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,          -- public so products display on the storefront
  5242880,       -- 5MB max
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view product images (public bucket)
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "Product images are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Allow authenticated admin users to upload product images
DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Allow admin users to delete their own product images
DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- Allow admin users to update (replace) product images
DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');
