-- ==============================================================================
-- SaiSrujana Saree Store: Complete Database Orders Cleanup Script
-- ==============================================================================
-- Run this script in the Supabase Dashboard -> SQL Editor
-- This completely clears all orders, items, histories, and notifications,
-- leaving the order system completely fresh with 0 records.
-- ==============================================================================

DO $$
BEGIN
    -- 1. Delete dependent customer notifications first
    DELETE FROM public.customer_notifications;

    -- 2. Delete dependent order status history
    DELETE FROM public.order_status_history;

    -- 3. Delete dependent order items
    DELETE FROM public.order_items;

    -- 4. Delete the orders table records last
    DELETE FROM public.orders;

    RAISE NOTICE 'Successfully cleared all records from customer_notifications, order_status_history, order_items, and orders.';
END $$;

-- Verification Queries (all should return 0)
SELECT count(*) AS remaining_notifications FROM public.customer_notifications;
SELECT count(*) AS remaining_history FROM public.order_status_history;
SELECT count(*) AS remaining_order_items FROM public.order_items;
SELECT count(*) AS remaining_orders FROM public.orders;
