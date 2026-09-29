"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Layers,
  Boxes,
  Users,
  BarChart3,
  Tag,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Calendar,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { createBrowserClient } from "@/lib/supabase/client";
import { Order, OrderStatus } from "@/types/order";
import { Saree } from "@/types/saree";
import { mapDbRowToSaree, DbSareeRow } from "@/lib/supabase/sarees";
import { mapDbRowToOrder, DbOrderRow } from "@/lib/supabase/orders";
import { formatCurrency, SHOP_CONFIG } from "@/config/shop";

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [sarees, setSarees] = useState<Saree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient();

      const [ordersRes, sareesRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*, order_items(*)")
          .order("created_at", { ascending: false }),
        supabase
          .from("sarees")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (ordersRes.error) {
        console.warn("Orders load warning:", ordersRes.error.message);
      }
      if (sareesRes.error) {
        console.warn("Sarees load warning:", sareesRes.error.message);
      }

      const mappedOrders: Order[] = (ordersRes.data || []).map((row) =>
        mapDbRowToOrder(row as DbOrderRow & { order_items?: any[] })
      );
      const mappedSarees: Saree[] = (sareesRes.data || []).map((row) =>
        mapDbRowToSaree(row as DbSareeRow)
      );

      setOrders(mappedOrders);
      setSarees(mappedSarees);
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError("Failed to load live dashboard statistics. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Real Metric Computations
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    const totalOrders = orders.length;
    const todayOrders = orders.filter((o) =>
      o.createdAt ? o.createdAt.startsWith(today) : false
    ).length;

    // Status breakdown
    const pendingOrders = orders.filter((o) => o.orderStatus === "placed").length;
    const confirmedOrders = orders.filter((o) => o.orderStatus === "confirmed").length;
    const packedOrders = orders.filter((o) => o.orderStatus === "preparing").length;
    const shippedOrders = orders.filter((o) => o.orderStatus === "out_for_delivery").length;
    const deliveredOrders = orders.filter((o) => o.orderStatus === "delivered").length;
    const cancelledOrders = orders.filter((o) => o.orderStatus === "cancelled").length;

    // Revenue
    const nonCancelledOrders = orders.filter((o) => o.orderStatus !== "cancelled");
    const totalRevenue = nonCancelledOrders.reduce(
      (sum, o) => sum + (Number(o.totalAmount) || 0),
      0
    );

    const todayRevenue = nonCancelledOrders
      .filter((o) => (o.createdAt ? o.createdAt.startsWith(today) : false))
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    // Products / Inventory Health
    const totalSarees = sarees.length;
    const lowStockSarees = sarees.filter(
      (s) => s.stockQuantity > 0 && s.stockQuantity <= 5
    ).length;
    const outOfStockSarees = sarees.filter(
      (s) => s.stockQuantity <= 0 || s.stockStatus.toLowerCase() === "out of stock"
    ).length;

    return {
      totalOrders,
      todayOrders,
      pendingOrders,
      confirmedOrders,
      packedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      todayRevenue,
      totalSarees,
      lowStockSarees,
      outOfStockSarees,
    };
  }, [orders, sarees]);

  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "placed":
        return { label: "New (Placed)", cls: "bg-amber-100 text-amber-900 border-amber-300" };
      case "confirmed":
        return { label: "Confirmed", cls: "bg-blue-100 text-blue-900 border-blue-300" };
      case "preparing":
        return { label: "Packed (Preparing)", cls: "bg-purple-100 text-purple-900 border-purple-300" };
      case "out_for_delivery":
        return { label: "Shipped (In Transit)", cls: "bg-cyan-100 text-cyan-900 border-cyan-300" };
      case "delivered":
        return { label: "Delivered", cls: "bg-emerald-100 text-emerald-900 border-emerald-300" };
      case "cancelled":
        return { label: "Cancelled", cls: "bg-rose-100 text-rose-900 border-rose-300" };
      default:
        return { label: status, cls: "bg-stone-100 text-stone-800 border-stone-300" };
    }
  };

  return (
    <AdminLayout
      title="Executive Dashboard"
      subtitle={`Real-time overview of ${SHOP_CONFIG.brandName} boutique orders, revenue, and inventory`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/admin/sarees/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#6E121E] hover:bg-[#821524] text-white text-xs font-semibold uppercase tracking-wider transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Saree</span>
          </Link>
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={loading}
            className="p-2 rounded-xl border border-[#E8E0D2] bg-white text-[#1E1715] hover:bg-[#FAF6EE] transition shadow-2xs cursor-pointer"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#C5A059]" : ""}`} />
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={loadDashboardData}
              className="font-bold underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. Primary Highlight Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-white p-5 rounded-3xl border border-[#E8E0D2] shadow-2xs space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-[#8C7A6B]">
              <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
              <div className="w-9 h-9 rounded-xl bg-[#FAF0DC] text-[#6E121E] flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#6E121E]">
                {formatCurrency(metrics.totalRevenue)}
              </p>
            </div>
            <p className="text-[11px] text-[#8C7A6B]">
              Today: <strong className="text-[#1E1715]">{formatCurrency(metrics.todayRevenue)}</strong> (real orders)
            </p>
          </div>

          {/* Total Orders */}
          <div className="bg-white p-5 rounded-3xl border border-[#E8E0D2] shadow-2xs space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-[#8C7A6B]">
              <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715]">
                {metrics.totalOrders}
              </p>
            </div>
            <p className="text-[11px] text-[#8C7A6B]">
              Today: <strong className="text-[#1E1715]">{metrics.todayOrders}</strong> placed today
            </p>
          </div>

          {/* Delivered Orders */}
          <div className="bg-white p-5 rounded-3xl border border-[#E8E0D2] shadow-2xs space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-[#8C7A6B]">
              <span className="text-xs font-bold uppercase tracking-wider">Delivered</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-emerald-700">
                {metrics.deliveredOrders}
              </p>
            </div>
            <p className="text-[11px] text-[#8C7A6B]">
              Active in transit: <strong className="text-[#1E1715]">{metrics.shippedOrders + metrics.packedOrders}</strong>
            </p>
          </div>

          {/* Catalogue Sarees */}
          <div className="bg-white p-5 rounded-3xl border border-[#E8E0D2] shadow-2xs space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-[#8C7A6B]">
              <span className="text-xs font-bold uppercase tracking-wider">Total Sarees</span>
              <div className="w-9 h-9 rounded-xl bg-[#FAF0DC] text-[#C5A059] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715]">
                {metrics.totalSarees}
              </p>
            </div>
            <p className="text-[11px] text-[#8C7A6B]">
              Low stock: <strong className="text-amber-700">{metrics.lowStockSarees}</strong> | Out of stock: <strong className="text-rose-700">{metrics.outOfStockSarees}</strong>
            </p>
          </div>
        </div>

        {/* 2. Detailed Order Status Grid (The full 8-point status breakdown) */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B] mb-3">
            Fulfillment & Order Pipeline Breakdown
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Pending / Placed */}
            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-900">Pending</span>
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <p className="font-serif-luxury text-2xl font-bold text-amber-700">
                {metrics.pendingOrders}
              </p>
              <p className="text-[10px] text-[#8C7A6B]">Awaiting confirmation</p>
            </div>

            {/* Confirmed */}
            <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-blue-900">Confirmed</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="font-serif-luxury text-2xl font-bold text-blue-700">
                {metrics.confirmedOrders}
              </p>
              <p className="text-[10px] text-[#8C7A6B]">Ready for packing</p>
            </div>

            {/* Packed / Preparing */}
            <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-purple-900">Packed</span>
                <Boxes className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <p className="font-serif-luxury text-2xl font-bold text-purple-700">
                {metrics.packedOrders}
              </p>
              <p className="text-[10px] text-[#8C7A6B]">Packed & inspected</p>
            </div>

            {/* Shipped */}
            <div className="bg-white p-4 rounded-2xl border border-cyan-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-cyan-900">Shipped</span>
                <Truck className="w-3.5 h-3.5 text-cyan-600" />
              </div>
              <p className="font-serif-luxury text-2xl font-bold text-cyan-700">
                {metrics.shippedOrders}
              </p>
              <p className="text-[10px] text-[#8C7A6B]">Out for delivery</p>
            </div>

            {/* Delivered */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-900">Delivered</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="font-serif-luxury text-2xl font-bold text-emerald-700">
                {metrics.deliveredOrders}
              </p>
              <p className="text-[10px] text-[#8C7A6B]">Successfully completed</p>
            </div>

            {/* Cancelled */}
            <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-rose-900">Cancelled</span>
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <p className="font-serif-luxury text-2xl font-bold text-rose-700">
                {metrics.cancelledOrders}
              </p>
              <p className="text-[10px] text-[#8C7A6B]">Restored to stock</p>
            </div>
          </div>
        </div>

        {/* 3. Quick Action Hub */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8E0D2] shadow-2xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B] mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/orders"
              className="p-3.5 rounded-2xl border border-[#E8E0D2] hover:border-[#6E121E] hover:bg-[#FAF6EE] transition flex flex-col items-center text-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#FAF0DC] text-[#6E121E] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#1E1715]">Manage Orders</span>
              <span className="text-[10px] text-[#8C7A6B]">Fulfillment & Status</span>
            </Link>

            <Link
              href="/admin/sarees/new"
              className="p-3.5 rounded-2xl border border-[#E8E0D2] hover:border-[#6E121E] hover:bg-[#FAF6EE] transition flex flex-col items-center text-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#821524] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#1E1715]">Add Saree</span>
              <span className="text-[10px] text-[#8C7A6B]">New Catalogue Item</span>
            </Link>

            <Link
              href="/admin/inventory"
              className="p-3.5 rounded-2xl border border-[#E8E0D2] hover:border-[#6E121E] hover:bg-[#FAF6EE] transition flex flex-col items-center text-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Boxes className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#1E1715]">Inventory</span>
              <span className="text-[10px] text-[#8C7A6B]">Stock Adjustments</span>
            </Link>

            <Link
              href="/admin/customers"
              className="p-3.5 rounded-2xl border border-[#E8E0D2] hover:border-[#6E121E] hover:bg-[#FAF6EE] transition flex flex-col items-center text-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#1E1715]">Customers</span>
              <span className="text-[10px] text-[#8C7A6B]">Patron Order History</span>
            </Link>

            <Link
              href="/admin/analytics"
              className="p-3.5 rounded-2xl border border-[#E8E0D2] hover:border-[#6E121E] hover:bg-[#FAF6EE] transition flex flex-col items-center text-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#1E1715]">Analytics</span>
              <span className="text-[10px] text-[#8C7A6B]">Sales & Conversion</span>
            </Link>

            <Link
              href="/admin/coupons"
              className="p-3.5 rounded-2xl border border-[#E8E0D2] hover:border-[#6E121E] hover:bg-[#FAF6EE] transition flex flex-col items-center text-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Tag className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#1E1715]">Offers & Deals</span>
              <span className="text-[10px] text-[#8C7A6B]">Coupon Codes</span>
            </Link>
          </div>
        </div>

        {/* 4. Two-Column Overview: Status Distribution & Low Stock Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Status Distribution */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E0D2] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif-luxury font-bold text-base text-[#1E1715]">
                  Order Pipeline Distribution
                </h3>
                <p className="text-xs text-[#8C7A6B]">
                  Percentage share across all order statuses
                </p>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-bold text-[#6E121E] hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {metrics.totalOrders === 0 ? (
              <div className="py-8 text-center space-y-2 text-[#8C7A6B]">
                <Package className="w-8 h-8 text-[#C5A059] mx-auto opacity-60" />
                <p className="text-xs">No orders placed yet to display distribution.</p>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {[
                  { label: "Delivered", count: metrics.deliveredOrders, color: "bg-emerald-500" },
                  { label: "Shipped", count: metrics.shippedOrders, color: "bg-cyan-500" },
                  { label: "Packed", count: metrics.packedOrders, color: "bg-purple-500" },
                  { label: "Confirmed", count: metrics.confirmedOrders, color: "bg-blue-500" },
                  { label: "Pending", count: metrics.pendingOrders, color: "bg-amber-500" },
                  { label: "Cancelled", count: metrics.cancelledOrders, color: "bg-rose-500" },
                ].map((item) => {
                  const pct = Math.round((item.count / metrics.totalOrders) * 100) || 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#1E1715]">{item.label}</span>
                        <span className="text-[#8C7A6B]">
                          {item.count} orders ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inventory Health & Low Stock Alerts */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E0D2] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif-luxury font-bold text-base text-[#1E1715]">
                  Inventory Alerts
                </h3>
                <p className="text-xs text-[#8C7A6B]">
                  Sarees requiring immediate restocking
                </p>
              </div>
              <Link
                href="/admin/inventory"
                className="text-xs font-bold text-[#6E121E] hover:underline flex items-center gap-1"
              >
                <span>Manage stock</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {metrics.lowStockSarees === 0 && metrics.outOfStockSarees === 0 ? (
              <div className="py-8 text-center space-y-2 text-[#8C7A6B]">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-medium text-emerald-900">
                  Inventory is healthy!
                </p>
                <p className="text-[11px]">All catalogue items currently have sufficient stock.</p>
              </div>
            ) : (
              <div className="space-y-2 pt-1 max-h-64 overflow-y-auto">
                {sarees
                  .filter((s) => s.stockQuantity <= 5 || s.stockStatus.toLowerCase() === "out of stock")
                  .slice(0, 5)
                  .map((saree) => (
                    <div
                      key={saree.id}
                      className="p-3 rounded-2xl border border-[#E8E0D2] bg-[#FAF7F2] flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="font-bold text-[#1E1715] truncate">{saree.name}</p>
                        <p className="text-[11px] text-[#8C7A6B]">
                          SKU: {saree.sku} • {saree.categoryLabel}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          saree.stockQuantity <= 0
                            ? "bg-rose-100 text-rose-900 border border-rose-300"
                            : "bg-amber-100 text-amber-900 border border-amber-300"
                        }`}
                      >
                        {saree.stockQuantity <= 0
                          ? "Out of Stock"
                          : `${saree.stockQuantity} left`}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* 5. Recent Orders Table */}
        <div className="bg-white rounded-3xl border border-[#E8E0D2] shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-[#E8E0D2] flex items-center justify-between">
            <div>
              <h3 className="font-serif-luxury font-bold text-lg text-[#1E1715]">
                Recent Orders
              </h3>
              <p className="text-xs text-[#8C7A6B]">
                Latest patron transactions recorded in Supabase
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E0D2] hover:bg-[#FAF6EE] text-[#6E121E] text-xs font-bold uppercase tracking-wider transition"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Package className="w-10 h-10 text-[#C5A059] mx-auto opacity-70" />
              <h4 className="font-serif-luxury text-base font-bold text-[#1E1715]">
                No orders yet
              </h4>
              <p className="text-xs text-[#8C7A6B] max-w-sm mx-auto">
                There are currently no orders in your boutique database. As patrons purchase sarees through SaiSrujana, genuine orders will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#8C7A6B] uppercase tracking-wider text-[10px] font-bold border-b border-[#E8E0D2]">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0D2]">
                  {recentOrders.map((order) => {
                    const badge = getStatusBadge(order.orderStatus);
                    return (
                      <tr key={order.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#6E121E]">
                          {order.orderNumber}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#1E1715]">
                          <div>{order.customerName}</div>
                          <div className="text-[11px] text-[#8C7A6B]">{order.customerPhone}</div>
                        </td>
                        <td className="py-3.5 px-4 text-[#8C7A6B]">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-[#5A4E46]">
                          {order.items.length} {order.items.length === 1 ? "saree" : "sarees"}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#1E1715]">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href="/admin/orders"
                            className="text-[#6E121E] hover:underline font-bold text-xs"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
