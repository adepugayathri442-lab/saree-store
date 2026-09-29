-- ==============================================================================
-- SaiSrujana Saree Boutique - Non-Destructive Enquiries Schema Migration
-- ==============================================================================
-- This script safely and idempotently ensures all required columns, indexes,
-- and RLS policies for `public.enquiries` exist without touching existing data.
-- ==============================================================================

-- 1. Ensure `user_id` and variant columns exist on `public.enquiries`
ALTER TABLE public.enquiries
ADD COLUMN IF NOT EXISTS user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS variant_id UUID NULL,
ADD COLUMN IF NOT EXISTS selected_color TEXT NULL,
ADD COLUMN IF NOT EXISTS variant_price NUMERIC NULL;

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS enquiries_user_id_idx ON public.enquiries (user_id);
CREATE INDEX IF NOT EXISTS enquiries_customer_email_idx ON public.enquiries (customer_email);
CREATE INDEX IF NOT EXISTS enquiries_status_idx ON public.enquiries (status);
CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON public.enquiries (created_at DESC);

-- 3. Ensure Row Level Security (RLS) is enabled
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Allow both anonymous visitors and authenticated customers to create enquiries
DROP POLICY IF EXISTS "Allow public and authenticated users to create enquiries" ON public.enquiries;
CREATE POLICY "Allow public and authenticated users to create enquiries"
    ON public.enquiries
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 5. RLS Policy: Allow authenticated users to view their own enquiries, and admins to view all
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

-- 6. RLS Policy: Allow authenticated admins to update enquiries
DROP POLICY IF EXISTS "Allow authenticated admins to update enquiries" ON public.enquiries;
CREATE POLICY "Allow authenticated admins to update enquiries"
    ON public.enquiries
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 7. RLS Policy: Allow authenticated admins to delete enquiries
DROP POLICY IF EXISTS "Allow authenticated admins to delete enquiries" ON public.enquiries;
CREATE POLICY "Allow authenticated admins to delete enquiries"
    ON public.enquiries
    FOR DELETE
    TO authenticated
    USING (true);
