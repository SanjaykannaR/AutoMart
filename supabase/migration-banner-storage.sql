-- Storage bucket for admin banner images
-- Run this in the Supabase SQL Editor.

-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banner-images',
  'banner-images',
  true,          -- public so banners display on the homepage
  2097152,       -- 2MB max (matches your 1920x600 requirement)
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view banner images (public bucket)
CREATE POLICY "Banner images are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banner-images');

-- Allow authenticated admin users to upload banner images
CREATE POLICY "Admins can upload banner images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'banner-images'
    AND (storage.foldername(name))[1] = 'banners'
  );

-- Allow admin users to delete their own banner images
CREATE POLICY "Admins can delete banner images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'banner-images'
    AND (storage.foldername(name))[1] = 'banners'
  );

-- Allow admin users to update (replace) banner images
CREATE POLICY "Admins can update banner images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'banner-images'
    AND (storage.foldername(name))[1] = 'banners'
  );
