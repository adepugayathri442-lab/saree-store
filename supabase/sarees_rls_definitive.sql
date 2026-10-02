-- ==============================================================================
-- SAISRUJANA - DEFINITIVE SAREES RLS & PERMISSIONS MIGRATION
-- Run this script in the Supabase Dashboard -> SQL Editor
-- This ensures authenticated admins have full DELETE, INSERT, and UPDATE permissions,
-- and that foreign key constraints allow cascade/safe deletion.
-- ==============================================================================

-- 1. Ensure RLS is active on public.sarees
ALTER TABLE public.sarees ENABLE ROW LEVEL SECURITY;

-- 2. Explicit PostgreSQL Grants for roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.sarees TO postgres, service_role;
GRANT SELECT ON TABLE public.sarees TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.sarees TO authenticated;

-- 3. SELECT Policy: Everyone (guest patrons & boutique admins) can view sarees
DROP POLICY IF EXISTS "Allow public read access for sarees" ON public.sarees;
DROP POLICY IF EXISTS "Allow select sarees" ON public.sarees;
CREATE POLICY "Allow select sarees"
ON public.sarees
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (true);

-- 4. INSERT Policy: Authenticated admins can insert new sarees
DROP POLICY IF EXISTS "Allow authenticated users to insert sarees" ON public.sarees;
DROP POLICY IF EXISTS "Allow authenticated admins to insert sarees" ON public.sarees;
CREATE POLICY "Allow authenticated admins to insert sarees"
ON public.sarees
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. UPDATE Policy: Authenticated admins can update sarees
DROP POLICY IF EXISTS "Allow authenticated users to update sarees" ON public.sarees;
DROP POLICY IF EXISTS "Allow authenticated admins to update sarees" ON public.sarees;
CREATE POLICY "Allow authenticated admins to update sarees"
ON public.sarees
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. DELETE Policy: Authenticated admins can delete sarees
DROP POLICY IF EXISTS "Allow authenticated users to delete sarees" ON public.sarees;
DROP POLICY IF EXISTS "Allow authenticated admins to delete sarees" ON public.sarees;
CREATE POLICY "Allow authenticated admins to delete sarees"
ON public.sarees
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (true);

-- 7. Ensure child tables have CASCADE or SET NULL on delete so foreign keys do not block deletion
DO $$
BEGIN
  -- saree_variants table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saree_variants') THEN
    ALTER TABLE public.saree_variants
      DROP CONSTRAINT IF EXISTS saree_variants_saree_id_fkey,
      ADD CONSTRAINT saree_variants_saree_id_fkey
        FOREIGN KEY (saree_id) REFERENCES public.sarees(id) ON DELETE CASCADE;
    GRANT ALL ON TABLE public.saree_variants TO postgres, service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.saree_variants TO authenticated;
  END IF;

  -- reviews table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    ALTER TABLE public.reviews
      DROP CONSTRAINT IF EXISTS reviews_saree_id_fkey,
      ADD CONSTRAINT reviews_saree_id_fkey
        FOREIGN KEY (saree_id) REFERENCES public.sarees(id) ON DELETE CASCADE;
    GRANT ALL ON TABLE public.reviews TO postgres, service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reviews TO authenticated;
  END IF;

  -- enquiries table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'enquiries') THEN
    ALTER TABLE public.enquiries
      DROP CONSTRAINT IF EXISTS enquiries_saree_id_fkey,
      ADD CONSTRAINT enquiries_saree_id_fkey
        FOREIGN KEY (saree_id) REFERENCES public.sarees(id) ON DELETE SET NULL;
  END IF;

  -- order_items table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    ALTER TABLE public.order_items
      DROP CONSTRAINT IF EXISTS order_items_saree_id_fkey,
      ADD CONSTRAINT order_items_saree_id_fkey
        FOREIGN KEY (saree_id) REFERENCES public.sarees(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 8. Storage bucket policy: allow authenticated users to delete images and videos
DROP POLICY IF EXISTS "Allow authenticated delete from saree-images" ON storage.objects;
CREATE POLICY "Allow authenticated delete from saree-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'saree-images');

-- 9. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
