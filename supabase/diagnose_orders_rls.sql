-- ==============================================================================
-- SAISRUJANA - ORDERS & ORDER ITEMS RLS DIAGNOSTIC QUERIES
-- Run these queries in Supabase SQL Editor to inspect live database permissions.
-- ==============================================================================

-- 1. Database and User
SELECT current_database();

SELECT current_user;

-- 2. Tables Existence
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('orders', 'order_items');

-- 3. Role Table Grants for orders
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'orders'
ORDER BY grantee, privilege_type;

-- 4. Role Table Grants for order_items
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'order_items'
ORDER BY grantee, privilege_type;

-- 5. Active Row Level Security (RLS) Policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;

-- 6. RLS Enabled Status on Tables
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname IN ('orders', 'order_items');
