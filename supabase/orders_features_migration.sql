-- ==============================================================================
-- SaiSrujana Saree Store: Customer Orders, Status History & Notifications Migration
-- ==============================================================================

--- 1. Add cancellation metadata columns to orders if not already present
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by TEXT;

-- 2. Create order_status_history table
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);

-- Enable RLS on order_status_history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON TABLE public.order_status_history TO anon, authenticated, service_role;

-- Policies for order_status_history
DROP POLICY IF EXISTS "Allow select order_status_history" ON public.order_status_history;
CREATE POLICY "Allow select order_status_history"
ON public.order_status_history
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow insert order_status_history" ON public.order_status_history;
CREATE POLICY "Allow insert order_status_history"
ON public.order_status_history
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 3. Create customer_notifications table
CREATE TABLE IF NOT EXISTS public.customer_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'status_update',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_notifications_user_id ON public.customer_notifications(user_id);

-- Enable RLS on customer_notifications
ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON TABLE public.customer_notifications TO anon, authenticated, service_role;

-- Customer can read only their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.customer_notifications;
CREATE POLICY "Users can view own notifications"
ON public.customer_notifications
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow inserting notifications (from client/admin triggers)
DROP POLICY IF EXISTS "Allow insert notifications" ON public.customer_notifications;
CREATE POLICY "Allow insert notifications"
ON public.customer_notifications
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow user to mark their own notifications as read
DROP POLICY IF EXISTS "Users can update own notifications" ON public.customer_notifications;
CREATE POLICY "Users can update own notifications"
ON public.customer_notifications
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Enable Supabase Realtime for orders and notifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'customer_notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_notifications;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
