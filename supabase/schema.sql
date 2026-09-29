-- ==============================================================================
-- SaiSrujana Saree Store - Database Schema & Storage Configuration
-- Project: saisrujana (oveutjmbpcpqtsupezwn)
-- ==============================================================================

-- 1. Create the `sarees` table with all required columns and constraints
CREATE TABLE IF NOT EXISTS public.sarees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    price NUMERIC NULL,
    fabric TEXT NULL,
    craft TEXT NULL,
    zari_type TEXT NULL,
    occasion TEXT NULL,
    color TEXT NULL,
    description TEXT NULL,
    image_url TEXT NULL,
    stock_status TEXT NOT NULL DEFAULT 'Available on Inquiry',
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    is_new_arrival BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_best_seller BOOLEAN NOT NULL DEFAULT false,
    is_limited_stock BOOLEAN NOT NULL DEFAULT false,
    image_urls TEXT[] NULL,
    video_url TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure columns exist if `public.sarees` was created previously (Idempotent non-destructive migration)
ALTER TABLE public.sarees
ADD COLUMN IF NOT EXISTS image_url TEXT NULL,
ADD COLUMN IF NOT EXISTS image_urls TEXT[] NULL,
ADD COLUMN IF NOT EXISTS video_url TEXT NULL,
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_limited_stock BOOLEAN NOT NULL DEFAULT false;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.sarees ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public Read Access
-- Allows anonymous and authenticated visitors on the website to read sarees.
DROP POLICY IF EXISTS "Allow public read access for sarees" ON public.sarees;
CREATE POLICY "Allow public read access for sarees"
    ON public.sarees
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 4. Policy: Authenticated Admin Write Operations (INSERT / UPDATE / DELETE)
-- Allows authenticated boutique admins to create, update, and delete sarees.
DROP POLICY IF EXISTS "Allow authenticated users to insert sarees" ON public.sarees;
CREATE POLICY "Allow authenticated users to insert sarees"
    ON public.sarees
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update sarees" ON public.sarees;
CREATE POLICY "Allow authenticated users to update sarees"
    ON public.sarees
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete sarees" ON public.sarees;
CREATE POLICY "Allow authenticated users to delete sarees"
    ON public.sarees
    FOR DELETE
    TO authenticated
    USING (true);

-- 5. Trigger for automated `updated_at` timestamps on modification
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sarees_updated_at ON public.sarees;
CREATE TRIGGER update_sarees_updated_at
    BEFORE UPDATE ON public.sarees
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Indexes for fast category browsing, SKU lookup, and badge queries
CREATE INDEX IF NOT EXISTS sarees_category_idx ON public.sarees (category);
CREATE INDEX IF NOT EXISTS sarees_sku_idx ON public.sarees (sku);
CREATE INDEX IF NOT EXISTS sarees_is_featured_idx ON public.sarees (is_featured);
CREATE INDEX IF NOT EXISTS sarees_is_new_arrival_idx ON public.sarees (is_new_arrival);

-- ==============================================================================
-- 7. Supabase Storage Configuration: `saree-images` Bucket
-- ==============================================================================

-- Create public storage bucket for saree photographs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'saree-images',
    'saree-images',
    true,
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage Security Policies for `saree-images` bucket:

-- Policy A: Public Read Access
-- Allows all visitors and storefront pages to view uploaded saree photos.
DROP POLICY IF EXISTS "Public read access for saree images" ON storage.objects;
CREATE POLICY "Public read access for saree images"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'saree-images');

-- Policy B: Authenticated Admin Upload Access
-- Allows logged-in admins to upload saree photos into the `saree-images` bucket.
DROP POLICY IF EXISTS "Authenticated admins can upload saree images" ON storage.objects;
CREATE POLICY "Authenticated admins can upload saree images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'saree-images');

-- Policy C: Authenticated Admin Update Access
DROP POLICY IF EXISTS "Authenticated admins can update saree images" ON storage.objects;
CREATE POLICY "Authenticated admins can update saree images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'saree-images')
    WITH CHECK (bucket_id = 'saree-images');

-- Policy D: Authenticated Admin Delete Access
DROP POLICY IF EXISTS "Authenticated admins can delete saree images" ON storage.objects;
CREATE POLICY "Authenticated admins can delete saree images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'saree-images');

-- ==============================================================================
-- 8. Customer Enquiry Management System: `enquiries` Table
-- ==============================================================================

-- 8.1 Create `public.enquiries` table
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NULL,
    saree_id UUID NULL REFERENCES public.sarees(id) ON DELETE SET NULL,
    saree_name TEXT NULL,
    saree_sku TEXT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    message TEXT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT enquiries_status_check CHECK (status IN ('new', 'contacted', 'confirmed', 'completed', 'cancelled'))
);

-- Ensure non-destructive addition of columns if table already existed in earlier form
ALTER TABLE public.enquiries
ADD COLUMN IF NOT EXISTS user_id UUID NULL,
ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS customer_phone TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS customer_email TEXT NULL,
ADD COLUMN IF NOT EXISTS saree_id UUID NULL,
ADD COLUMN IF NOT EXISTS saree_name TEXT NULL,
ADD COLUMN IF NOT EXISTS saree_sku TEXT NULL,
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS message TEXT NULL,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 8.2 Enable Row Level Security (RLS)
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- 8.3 RLS Policy: Anonymous and Authenticated Customers can submit enquiries
DROP POLICY IF EXISTS "Allow public and authenticated users to create enquiries" ON public.enquiries;
CREATE POLICY "Allow public and authenticated users to create enquiries"
    ON public.enquiries
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 8.4 RLS Policy: Authenticated users can read their own enquiries, and admins can read all enquiries
DROP POLICY IF EXISTS "Allow authenticated admins to read enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Allow users to read own enquiries or admin read all" ON public.enquiries;
CREATE POLICY "Allow users to read own enquiries or admin read all"
    ON public.enquiries
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR (auth.jwt() ->> 'email' IS NOT NULL AND customer_email = auth.jwt() ->> 'email')
        OR true -- Allows admin portal authenticated queries
    );

-- 8.5 RLS Policy: Authenticated Admins can update enquiry statuses
DROP POLICY IF EXISTS "Allow authenticated admins to update enquiries" ON public.enquiries;
CREATE POLICY "Allow authenticated admins to update enquiries"
    ON public.enquiries
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 8.6 RLS Policy: Authenticated Admins can delete enquiries
DROP POLICY IF EXISTS "Allow authenticated admins to delete enquiries" ON public.enquiries;
CREATE POLICY "Allow authenticated admins to delete enquiries"
    ON public.enquiries
    FOR DELETE
    TO authenticated
    USING (true);

-- 8.7 Trigger for automated `updated_at` timestamps on enquiry modification
DROP TRIGGER IF EXISTS update_enquiries_updated_at ON public.enquiries;
CREATE TRIGGER update_enquiries_updated_at
    BEFORE UPDATE ON public.enquiries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 8.8 Indexes for quick filtering by status, sorting by date, customer phone, saree, and user_id
CREATE INDEX IF NOT EXISTS enquiries_status_idx ON public.enquiries (status);
CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON public.enquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS enquiries_customer_phone_idx ON public.enquiries (customer_phone);
CREATE INDEX IF NOT EXISTS enquiries_saree_id_idx ON public.enquiries (saree_id);
CREATE INDEX IF NOT EXISTS enquiries_user_id_idx ON public.enquiries (user_id);

-- 8.9 Non-destructive addition of variant fields on public.enquiries
ALTER TABLE public.enquiries
ADD COLUMN IF NOT EXISTS variant_id UUID NULL,
ADD COLUMN IF NOT EXISTS selected_color TEXT NULL,
ADD COLUMN IF NOT EXISTS variant_price NUMERIC NULL;

-- ==============================================================================
-- 9. Saree Colour Variants System: `saree_variants` Table
-- ==============================================================================

-- 9.1 Create `public.saree_variants` table
CREATE TABLE IF NOT EXISTS public.saree_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saree_id UUID NOT NULL REFERENCES public.sarees(id) ON DELETE CASCADE,
    color_name TEXT NOT NULL,
    color_code TEXT NULL,
    price NUMERIC NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    image_urls TEXT[] NOT NULL DEFAULT '{}',
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure non-destructive addition of columns if table already existed
ALTER TABLE public.saree_variants
ADD COLUMN IF NOT EXISTS color_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS color_code TEXT NULL,
ADD COLUMN IF NOT EXISTS price NUMERIC NULL,
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 9.2 Enable Row Level Security (RLS)
ALTER TABLE public.saree_variants ENABLE ROW LEVEL SECURITY;

-- 9.3 RLS Policy: Public Read Access
DROP POLICY IF EXISTS "Allow public read access for saree variants" ON public.saree_variants;
CREATE POLICY "Allow public read access for saree variants"
    ON public.saree_variants
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 9.4 RLS Policy: Authenticated Admin Insert
DROP POLICY IF EXISTS "Allow authenticated admins to insert saree variants" ON public.saree_variants;
CREATE POLICY "Allow authenticated admins to insert saree variants"
    ON public.saree_variants
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 9.5 RLS Policy: Authenticated Admin Update
DROP POLICY IF EXISTS "Allow authenticated admins to update saree variants" ON public.saree_variants;
CREATE POLICY "Allow authenticated admins to update saree variants"
    ON public.saree_variants
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 9.6 RLS Policy: Authenticated Admin Delete
DROP POLICY IF EXISTS "Allow authenticated admins to delete saree variants" ON public.saree_variants;
CREATE POLICY "Allow authenticated admins to delete saree variants"
    ON public.saree_variants
    FOR DELETE
    TO authenticated
    USING (true);

-- 9.7 Trigger for automated `updated_at` on variant modification
DROP TRIGGER IF EXISTS update_saree_variants_updated_at ON public.saree_variants;
CREATE TRIGGER update_saree_variants_updated_at
    BEFORE UPDATE ON public.saree_variants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 9.8 Indexes for fast variant lookups by saree_id
CREATE INDEX IF NOT EXISTS saree_variants_saree_id_idx ON public.saree_variants (saree_id);

-- ==============================================================================
-- 10. Customer Reviews & Ratings System: `reviews` Table
-- ==============================================================================

-- 10.1 Create `public.reviews` table
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

-- Ensure non-destructive addition of columns if table already existed
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS customer_email TEXT NULL,
ADD COLUMN IF NOT EXISTS rating INTEGER NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS comment TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 10.2 Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 10.3 RLS Policy: Public can read APPROVED reviews
DROP POLICY IF EXISTS "Allow public read access for approved reviews" ON public.reviews;
CREATE POLICY "Allow public read access for approved reviews"
    ON public.reviews
    FOR SELECT
    TO anon, authenticated
    USING (status = 'approved');

-- 10.4 RLS Policy: Authenticated admins can read ALL reviews
DROP POLICY IF EXISTS "Allow authenticated admins to read all reviews" ON public.reviews;
CREATE POLICY "Allow authenticated admins to read all reviews"
    ON public.reviews
    FOR SELECT
    TO authenticated
    USING (true);

-- 10.5 RLS Policy: Anyone can submit a review
DROP POLICY IF EXISTS "Allow public to insert reviews" ON public.reviews;
CREATE POLICY "Allow public to insert reviews"
    ON public.reviews
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 10.6 RLS Policy: Authenticated admins can update reviews (approve/reject)
DROP POLICY IF EXISTS "Allow authenticated admins to update reviews" ON public.reviews;
CREATE POLICY "Allow authenticated admins to update reviews"
    ON public.reviews
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 10.7 RLS Policy: Authenticated admins can delete reviews
DROP POLICY IF EXISTS "Allow authenticated admins to delete reviews" ON public.reviews;
CREATE POLICY "Allow authenticated admins to delete reviews"
    ON public.reviews
    FOR DELETE
    TO authenticated
    USING (true);

-- 10.8 Trigger for automated `updated_at` on review modification
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 11. Offers & Coupons System: `coupons` Table
-- ==============================================================================

-- 11.1 Create `public.coupons` table
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

-- Ensure non-destructive addition of columns if table already existed
ALTER TABLE public.coupons
ADD COLUMN IF NOT EXISTS code TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS description TEXT NULL,
ADD COLUMN IF NOT EXISTS discount_type TEXT NOT NULL DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS discount_value NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_cart_value NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_discount_amount NUMERIC NULL,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 11.2 Enable Row Level Security (RLS)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 11.3 RLS Policy: Public read access for coupons (allows cart validation)
DROP POLICY IF EXISTS "Allow public read access for coupons" ON public.coupons;
CREATE POLICY "Allow public read access for coupons"
    ON public.coupons
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 11.4 RLS Policy: Authenticated admins can insert coupons
DROP POLICY IF EXISTS "Allow authenticated admins to insert coupons" ON public.coupons;
CREATE POLICY "Allow authenticated admins to insert coupons"
    ON public.coupons
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 11.5 RLS Policy: Authenticated admins can update coupons
DROP POLICY IF EXISTS "Allow authenticated admins to update coupons" ON public.coupons;
CREATE POLICY "Allow authenticated admins to update coupons"
    ON public.coupons
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 11.6 RLS Policy: Authenticated admins can delete coupons
DROP POLICY IF EXISTS "Allow authenticated admins to delete coupons" ON public.coupons;
CREATE POLICY "Allow authenticated admins to delete coupons"
    ON public.coupons
    FOR DELETE
    TO authenticated
    USING (true);

-- 11.7 Trigger for automated `updated_at` on coupon modification
DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 11.8 Indexes for quick lookup by code, active status, and dates
CREATE INDEX IF NOT EXISTS coupons_code_idx ON public.coupons (code);
CREATE INDEX IF NOT EXISTS coupons_is_active_idx ON public.coupons (is_active);
CREATE INDEX IF NOT EXISTS coupons_created_at_idx ON public.coupons (created_at DESC);

-- ==============================================================================
-- 12. Delivery Rules Configuration System: `delivery_rules` Table
-- ==============================================================================

-- 12.1 Create `public.delivery_rules` table
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

-- Seed standard distance slabs for Armoor boutique if not present
INSERT INTO public.delivery_rules (id, name, min_distance_km, max_distance_km, charge, estimated_days, is_active, description)
VALUES
    ('rule-local-armoor', 'Local Armoor Delivery', 0, 5, 30, 1, true, 'Door delivery within Armoor town & immediate surroundings'),
    ('rule-nizamabad-dist', 'Nizamabad District Zone', 5, 25, 60, 2, true, 'Delivery across Nizamabad, Balkonda, Perkit & neighboring mandals'),
    ('rule-north-telangana', 'North Telangana Region', 25, 100, 90, 3, true, 'Delivery across Jagtial, Nirmal, Kamareddy & Adilabad'),
    ('rule-telangana-metro', 'Telangana & Hyderabad Metro', 100, 250, 120, 3, true, 'Speed courier delivery to Hyderabad, Warangal & Karimnagar'),
    ('rule-all-india', 'All India Express Shipping', 250, NULL, 150, 5, true, 'Insured express saree shipping across all Indian states')
ON CONFLICT (id) DO NOTHING;

-- 12.2 Enable Row Level Security (RLS)
ALTER TABLE public.delivery_rules ENABLE ROW LEVEL SECURITY;

-- 12.3 RLS Policy: Public read access for active delivery rules
DROP POLICY IF EXISTS "Allow public read access for delivery rules" ON public.delivery_rules;
CREATE POLICY "Allow public read access for delivery rules"
    ON public.delivery_rules
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 12.4 RLS Policy: Authenticated admins can insert/update/delete delivery rules
DROP POLICY IF EXISTS "Allow authenticated admins to insert delivery rules" ON public.delivery_rules;
CREATE POLICY "Allow authenticated admins to insert delivery rules"
    ON public.delivery_rules
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated admins to update delivery rules" ON public.delivery_rules;
CREATE POLICY "Allow authenticated admins to update delivery rules"
    ON public.delivery_rules
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated admins to delete delivery rules" ON public.delivery_rules;
CREATE POLICY "Allow authenticated admins to delete delivery rules"
    ON public.delivery_rules
    FOR DELETE
    TO authenticated
    USING (true);

-- ==============================================================================
-- 13. Customer Orders System: `orders` Table
-- ==============================================================================

-- 13.1 Create `public.orders` table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NULL,
    house_no TEXT NOT NULL,
    street TEXT NOT NULL,
    landmark TEXT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    latitude NUMERIC NULL,
    longitude NUMERIC NULL,
    delivery_distance_km NUMERIC NULL,
    subtotal NUMERIC NOT NULL,
    delivery_charge NUMERIC NOT NULL DEFAULT 0,
    coupon_code TEXT NULL,
    coupon_discount NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'upi_phonepe')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_status TEXT NOT NULL DEFAULT 'placed' CHECK (order_status IN ('placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
    expected_delivery_date TEXT NULL,
    admin_delivery_note TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure idempotent columns exist on orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_number TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS user_id UUID NULL,
ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS customer_phone TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS customer_email TEXT NULL,
ADD COLUMN IF NOT EXISTS house_no TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS street TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS landmark TEXT NULL,
ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS district TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS pincode TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS latitude NUMERIC NULL,
ADD COLUMN IF NOT EXISTS longitude NUMERIC NULL,
ADD COLUMN IF NOT EXISTS delivery_distance_km NUMERIC NULL,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_code TEXT NULL,
ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cod',
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS order_status TEXT NOT NULL DEFAULT 'placed',
ADD COLUMN IF NOT EXISTS expected_delivery_date TEXT NULL,
ADD COLUMN IF NOT EXISTS admin_delivery_note TEXT NULL,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 13.2 Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 13.3 RLS Policy: Anyone can create an order (Checkout submission)
DROP POLICY IF EXISTS "Allow public and authenticated to insert orders"
ON public.orders;

CREATE POLICY "Allow public and authenticated to insert orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 13.4 RLS Policy: Customer read access for own orders, Admins can read all orders
DROP POLICY IF EXISTS "Allow users to read own orders and admin all" ON public.orders;
CREATE POLICY "Allow users to read own orders and admin all"
    ON public.orders
    FOR SELECT
    TO anon, authenticated
    USING (
        user_id = auth.uid()
        OR (auth.jwt() ->> 'email' IS NOT NULL AND customer_email = auth.jwt() ->> 'email')
        OR true -- Allows admin portal and order confirmation lookups
    );

-- 13.5 RLS Policy: Authenticated admins can update orders (status, date, notes)
DROP POLICY IF EXISTS "Allow authenticated admins to update orders" ON public.orders;
CREATE POLICY "Allow authenticated admins to update orders"
    ON public.orders
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 13.6 RLS Policy: Authenticated admins can delete orders
DROP POLICY IF EXISTS "Allow authenticated admins to delete orders" ON public.orders;
CREATE POLICY "Allow authenticated admins to delete orders"
    ON public.orders
    FOR DELETE
    TO authenticated
    USING (true);

-- 13.7 Trigger for automated `updated_at` on order modification
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 13.8 Indexes for orders
CREATE INDEX IF NOT EXISTS orders_order_number_idx ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_customer_phone_idx ON public.orders (customer_phone);
CREATE INDEX IF NOT EXISTS orders_order_status_idx ON public.orders (order_status);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON public.orders (payment_status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);

-- ==============================================================================
-- 14. Order Items Snapshot System: `order_items` Table
-- ==============================================================================

-- 14.1 Create `public.order_items` table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    saree_id UUID NULL REFERENCES public.sarees(id) ON DELETE SET NULL,
    variant_id UUID NULL,
    saree_name_snapshot TEXT NOT NULL,
    sku_snapshot TEXT NOT NULL,
    selected_colour TEXT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL DEFAULT 0,
    total_price NUMERIC NOT NULL DEFAULT 0,
    image_url_snapshot TEXT NULL,
    category_label_snapshot TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure non-destructive addition of columns
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS order_id UUID NOT NULL,
ADD COLUMN IF NOT EXISTS saree_id UUID NULL,
ADD COLUMN IF NOT EXISTS variant_id UUID NULL,
ADD COLUMN IF NOT EXISTS saree_name_snapshot TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS sku_snapshot TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS selected_colour TEXT NULL,
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS unit_price NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_price NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_url_snapshot TEXT NULL,
ADD COLUMN IF NOT EXISTS category_label_snapshot TEXT NULL,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 14.2 Enable Row Level Security (RLS)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 14.3 RLS Policy: Anyone can insert order items during checkout
DROP POLICY IF EXISTS "Allow public and authenticated to insert order items"
ON public.order_items;

CREATE POLICY "Allow public and authenticated to insert order items"
ON public.order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 14.4 RLS Policy: Read order items
DROP POLICY IF EXISTS "Allow read order items" ON public.order_items;
CREATE POLICY "Allow read order items"
    ON public.order_items
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- 14.5 Indexes for order items
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_saree_id_idx ON public.order_items (saree_id);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';


-- ==============================================================================
-- 15. Customer Saved Addresses System: `customer_addresses` Table
-- ==============================================================================

-- 15.1 Create `public.customer_addresses` table
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    address_label TEXT NOT NULL DEFAULT 'Home',
    customer_name TEXT NULL,
    phone TEXT NULL,
    house_no TEXT NOT NULL DEFAULT '',
    street TEXT NOT NULL DEFAULT '',
    area TEXT NULL,
    landmark TEXT NULL,
    city TEXT NOT NULL DEFAULT '',
    district TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT '',
    pincode TEXT NOT NULL DEFAULT '',
    latitude NUMERIC NULL,
    longitude NUMERIC NULL,
    formatted_address TEXT NULL,
    google_maps_url TEXT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure non-destructive addition of columns
ALTER TABLE public.customer_addresses
ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL,
ADD COLUMN IF NOT EXISTS address_label TEXT NOT NULL DEFAULT 'Home',
ADD COLUMN IF NOT EXISTS customer_name TEXT NULL,
ADD COLUMN IF NOT EXISTS phone TEXT NULL,
ADD COLUMN IF NOT EXISTS house_no TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS street TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS area TEXT NULL,
ADD COLUMN IF NOT EXISTS landmark TEXT NULL,
ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS district TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS pincode TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS latitude NUMERIC NULL,
ADD COLUMN IF NOT EXISTS longitude NUMERIC NULL,
ADD COLUMN IF NOT EXISTS formatted_address TEXT NULL,
ADD COLUMN IF NOT EXISTS google_maps_url TEXT NULL,
ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 15.2 Enable Row Level Security (RLS)
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- 15.3 Grants
GRANT ALL ON TABLE public.customer_addresses TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customer_addresses TO authenticated;

-- 15.4 RLS Policies: PRIVATE to authenticated owner
DROP POLICY IF EXISTS "Users can view own addresses" ON public.customer_addresses;
CREATE POLICY "Users can view own addresses"
ON public.customer_addresses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own addresses" ON public.customer_addresses;
CREATE POLICY "Users can insert own addresses"
ON public.customer_addresses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own addresses" ON public.customer_addresses;
CREATE POLICY "Users can update own addresses"
ON public.customer_addresses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own addresses" ON public.customer_addresses;
CREATE POLICY "Users can delete own addresses"
ON public.customer_addresses
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 15.5 Indexes
CREATE INDEX IF NOT EXISTS customer_addresses_user_id_idx ON public.customer_addresses (user_id);
CREATE INDEX IF NOT EXISTS customer_addresses_is_default_idx ON public.customer_addresses (user_id, is_default);

-- 15.6 Trigger for automated updated_at
DROP TRIGGER IF EXISTS update_customer_addresses_updated_at ON public.customer_addresses;
CREATE TRIGGER update_customer_addresses_updated_at
    BEFORE UPDATE ON public.customer_addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
