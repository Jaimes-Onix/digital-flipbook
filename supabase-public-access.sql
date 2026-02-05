-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- This allows public access without authentication
-- ============================================

-- 1. First, create the storage buckets (if not exists)
-- Go to Storage in Supabase Dashboard and create:
--   - Bucket named "pdfs" (set to PUBLIC)
--   - Bucket named "covers" (set to PUBLIC)

-- 2. Drop existing restrictive policies on books table
DROP POLICY IF EXISTS "Users can view own books" ON public.books;
DROP POLICY IF EXISTS "Users can insert own books" ON public.books;
DROP POLICY IF EXISTS "Users can update own books" ON public.books;
DROP POLICY IF EXISTS "Users can delete own books" ON public.books;

-- 3. Create public access policies (no auth required)
CREATE POLICY "Allow public read access"
  ON public.books FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access"
  ON public.books FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON public.books FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access"
  ON public.books FOR DELETE
  USING (true);

-- 4. Make user_id optional (since no auth)
ALTER TABLE public.books ALTER COLUMN user_id DROP NOT NULL;

-- 5. Storage bucket policies (run these separately if needed)
-- For the 'pdfs' bucket, add this policy:
-- Policy name: "Allow public uploads"
-- Allowed operation: INSERT
-- Policy definition: true

-- For the 'covers' bucket, add this policy:
-- Policy name: "Allow public uploads"  
-- Allowed operation: INSERT
-- Policy definition: true

-- ============================================
-- VERIFICATION: Check if it worked
-- ============================================
-- SELECT * FROM public.books LIMIT 5;
