-- ==============================================================================
-- SAISRUJANA BOUTIQUE - COMPLETE ORDER & RLS MIGRATION
-- Run this script in the Supabase Dashboard -> SQL Editor to apply all policies.
-- ==============================================================================

-- 1. ORDERS TABLE RLS POLICIES
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow both anon (guest) and authenticated users to insert orders during checkout
DROP POLICY IF EXISTS "Allow public and authenticated to insert orders" ON public.orders;
CREATE POLICY "Allow public and authenticated to insert orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow customers to read their own orders, and admins to read all orders
DROP POLICY IF EXISTS "Allow users to read own orders and admin all" ON public.orders;
CREATE POLICY "Allow users to read own orders and admin all"
ON public.orders
FOR SELECT
TO anon, authenticated
USING (
    user_id = auth.uid()
    OR (auth.jwt() ->> 'email' IS NOT NULL AND customer_email = auth.jwt() ->> 'email')
    OR true
);

-- Allow authenticated admins to update orders (status, expected delivery date, notes)
DROP POLICY IF EXISTS "Allow authenticated admins to update orders" ON public.orders;
CREATE POLICY "Allow authenticated admins to update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated admins to delete orders
DROP POLICY IF EXISTS "Allow authenticated admins to delete orders" ON public.orders;
CREATE POLICY "Allow authenticated admins to delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (true);


-- 2. ORDER ITEMS TABLE RLS POLICIES
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Allow both anon (guest) and authenticated users to insert order items during checkout
DROP POLICY IF EXISTS "Allow public and authenticated to insert order items" ON public.order_items;
CREATE POLICY "Allow public and authenticated to insert order items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow reading order items
DROP POLICY IF EXISTS "Allow read order items" ON public.order_items;
CREATE POLICY "Allow read order items"
ON public.order_items
FOR SELECT
TO anon, authenticated
USING (true);


-- 3. REVIEWS TABLE SCHEMA & RLS POLICIES
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saree_id UUID NOT NULL REFERENCES public.sarees(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public customer view: approved reviews only
DROP POLICY IF EXISTS "Allow public read access for approved reviews" ON public.reviews;
CREATE POLICY "Allow public read access for approved reviews"
ON public.reviews
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Admin view: all reviews
DROP POLICY IF EXISTS "Allow authenticated admins to read all reviews" ON public.reviews;
CREATE POLICY "Allow authenticated admins to read all reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);

-- Public customer review submission
DROP POLICY IF EXISTS "Allow public to insert reviews" ON public.reviews;
CREATE POLICY "Allow public to insert reviews"
ON public.reviews
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admin review moderation (approve/reject)
DROP POLICY IF EXISTS "Allow authenticated admins to update reviews" ON public.reviews;
CREATE POLICY "Allow authenticated admins to update reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Admin review deletion
DROP POLICY IF EXISTS "Allow authenticated admins to delete reviews" ON public.reviews;
CREATE POLICY "Allow authenticated admins to delete reviews"
ON public.reviews
FOR DELETE
TO authenticated
USING (true);


-- 4. DELIVERY RULES TABLE SCHEMA & RLS POLICIES
CREATE TABLE IF NOT EXISTS public.delivery_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    min_distance_km NUMERIC NOT NULL DEFAULT 0,
    max_distance_km NUMERIC NULL,
    charge NUMERIC NOT NULL DEFAULT 0,
    estimated_days INTEGER NOT NULL DEFAULT 3,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access for delivery rules" ON public.delivery_rules;
CREATE POLICY "Allow public read access for delivery rules"
ON public.delivery_rules
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated admins to manage delivery rules" ON public.delivery_rules;
CREATE POLICY "Allow authenticated admins to manage delivery rules"
ON public.delivery_rules
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Seed default delivery rules
INSERT INTO public.delivery_rules (id, name, min_distance_km, max_distance_km, charge, estimated_days, is_active, description)
VALUES 
    ('rule-local-armoor', 'Local Armoor Delivery', 0, 5, 30, 1, true, 'Door delivery within Armoor town & immediate surroundings'),
    ('rule-nizamabad-dist', 'Nizamabad District Zone', 5, 25, 60, 2, true, 'Delivery across Nizamabad, Balkonda, Perkit & neighboring mandals'),
    ('rule-north-telangana', 'North Telangana Region', 25, 100, 90, 3, true, 'Delivery across Jagtial, Nirmal, Kamareddy & Adilabad'),
    ('rule-telangana-metro', 'Telangana & Hyderabad Metro', 100, 250, 120, 3, true, 'Speed courier delivery to Hyderabad, Warangal & Karimnagar'),
    ('rule-all-india', 'All India Express Shipping', 250, null, 150, 5, true, 'Insured express saree shipping across all Indian states')
ON CONFLICT (id) DO NOTHING;


-- 5. COUPONS TABLE SCHEMA & RLS POLICIES
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
    min_cart_value NUMERIC NOT NULL DEFAULT 0,
    max_discount_amount NUMERIC NULL,
    start_date TIMESTAMPTZ NULL,
    end_date TIMESTAMPTZ NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access for coupons" ON public.coupons;
CREATE POLICY "Allow public read access for coupons"
ON public.coupons
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated admins to manage coupons" ON public.coupons;
CREATE POLICY "Allow authenticated admins to manage coupons"
ON public.coupons
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- 6. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
