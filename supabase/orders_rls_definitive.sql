-- ==============================================================================
-- SAISRUJANA - DEFINITIVE ORDERS & ORDER ITEMS RLS MIGRATION
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. ORDERS TABLE RLS & PERMISSIONS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Explicit PostgreSQL Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.orders TO postgres, service_role;
GRANT SELECT, INSERT ON TABLE public.orders TO anon, authenticated;
GRANT UPDATE, DELETE ON TABLE public.orders TO authenticated;

-- Allow both anon (guest) and authenticated users to insert orders
DROP POLICY IF EXISTS "Allow public and authenticated to insert orders" ON public.orders;
CREATE POLICY "Allow public and authenticated to insert orders"
ON public.orders
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow reading orders (order confirmation & history lookup)
DROP POLICY IF EXISTS "Allow users to read own orders and admin all" ON public.orders;
DROP POLICY IF EXISTS "Allow select orders" ON public.orders;
CREATE POLICY "Allow select orders"
ON public.orders
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated admins to update orders (status, date, notes)
DROP POLICY IF EXISTS "Allow authenticated admins to update orders" ON public.orders;
CREATE POLICY "Allow authenticated admins to update orders"
ON public.orders
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated admins to delete orders
DROP POLICY IF EXISTS "Allow authenticated admins to delete orders" ON public.orders;
CREATE POLICY "Allow authenticated admins to delete orders"
ON public.orders
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (true);


-- 2. ORDER ITEMS TABLE RLS & PERMISSIONS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Explicit PostgreSQL Grants
GRANT ALL ON TABLE public.order_items TO postgres, service_role;
GRANT SELECT, INSERT ON TABLE public.order_items TO anon, authenticated;
GRANT UPDATE, DELETE ON TABLE public.order_items TO authenticated;

-- Allow both anon and authenticated to insert order item snapshots
DROP POLICY IF EXISTS "Allow public and authenticated to insert order items" ON public.order_items;
CREATE POLICY "Allow public and authenticated to insert order items"
ON public.order_items
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow reading order items
DROP POLICY IF EXISTS "Allow read order items" ON public.order_items;
CREATE POLICY "Allow read order items"
ON public.order_items
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (true);


-- 3. RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
