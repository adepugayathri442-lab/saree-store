-- ==============================================================================
-- SaiSrujana Saree Store: Customer Cancellation Request Workflow Migration
-- ==============================================================================

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cancellation_request_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS cancellation_request_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reject_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reviewed_by TEXT;

-- Index for quick lookup of pending cancellation requests in admin dashboard
CREATE INDEX IF NOT EXISTS idx_orders_cancellation_request_status 
ON public.orders(cancellation_request_status);
