-- ==============================================================================
-- SAISRUJANA - CUSTOMER SAVED ADDRESSES & LOCATION SYSTEM
-- Run this script in the Supabase Dashboard -> SQL Editor (Project: oveutjmbpcpqtsupezwn)
-- ==============================================================================

-- 1. Create `public.customer_addresses` table
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

-- Ensure non-destructive addition of columns if table already existed in earlier form
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

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- 3. Grants
GRANT ALL ON TABLE public.customer_addresses TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customer_addresses TO authenticated;

-- 4. RLS Policies: PRIVATE to authenticated owner
-- Note: Saved addresses are private customer data. Anon role has NO access.
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

-- 5. Indexes for performant lookup by user and default status
CREATE INDEX IF NOT EXISTS customer_addresses_user_id_idx ON public.customer_addresses (user_id);
CREATE INDEX IF NOT EXISTS customer_addresses_is_default_idx ON public.customer_addresses (user_id, is_default);

-- 6. Trigger for automated `updated_at` timestamps
DROP TRIGGER IF EXISTS update_customer_addresses_updated_at ON public.customer_addresses;
CREATE TRIGGER update_customer_addresses_updated_at
    BEFORE UPDATE ON public.customer_addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
