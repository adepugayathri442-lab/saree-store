"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Package,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { createBrowserClient } from "@/lib/supabase/client";
import { Order, OrderStatus } from "@/types/order";
import { Saree } from "@/types/saree";
import { mapDbRowToOrder, DbOrderRow } from "@/lib/supabase/orders";
import { mapDbRowToSaree, DbSareeRow } from "@/lib/supabase/sarees";
import { formatCurrency, SHOP_CONFIG } from "@/config/shop";

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [sarees, setSarees] = useState<Saree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date Range Filter: "7d" | "30d" | "this_month" | "all"
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "this_month" | "all">("all");

  const loadData = useCallback(async () => {
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

      if (ordersRes.error) throw new Error(ordersRes.error.message);
      if (sareesRes.error) throw new Error(sareesRes.error.message);

      const mappedOrders = (ordersRes.data as (DbOrderRow & { order_items?: any[] })[] || []).map(mapDbRowToOrder);
      const mappedSarees = (sareesRes.data as DbSareeRow[] || []).map(mapDbRowToSaree);

      setOrders(mappedOrders);
      setSarees(mappedSarees);
    } catch (err) {
      console.error("Error loading analytics:", err);
      setError("Unable to load analytics data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (dateRange === "all") return orders;

    const now = new Date();
    const cutoff = new Date();

    if (dateRange === "7d") {
      cutoff.setDate(now.getDate() - 7);
    } else if (dateRange === "30d") {
      cutoff.setDate(now.getDate() - 30);
    } else if (dateRange === "this_month") {
      cutoff.setDate(1); // 1st of current month
      cutoff.setHours(0, 0, 0, 0);
    }

    return orders.filter((o) => {
      if (!o.createdAt) return false;
      return new Date(o.createdAt) >= cutoff;
    });
  }, [orders, dateRange]);

  // Real Analytics Metrics
  const analytics = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Sales timeframes
    const dailySales = orders
      .filter((o) => o.orderStatus !== "cancelled" && o.createdAt?.startsWith(todayStr))
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    const weeklySales = orders
      .filter((o) => o.orderStatus !== "cancelled" && o.createdAt && new Date(o.createdAt) >= sevenDaysAgo)
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    const monthlySales = orders
      .filter((o) => o.orderStatus !== "cancelled" && o.createdAt && new Date(o.createdAt) >= thirtyDaysAgo)
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    // Active range totals
    const validRangeOrders = filteredOrders.filter((o) => o.orderStatus !== "cancelled");
    const totalRevenue = validRangeOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const orderCount = filteredOrders.length;
    const averageOrderValue = validRangeOrders.length > 0 ? Math.round(totalRevenue / validRangeOrders.length) : 0;

    const deliveredOrderValue = filteredOrders
      .filter((o) => o.orderStatus === "delivered")
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    const cancelledOrderValue = filteredOrders
      .filter((o) => o.orderStatus === "cancelled")
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    // Best-selling Sarees
    const itemSalesMap = new Map<string, { name: string; sku: string; quantity: number; revenue: number; image?: string }>();

    filteredOrders.forEach((o) => {
      if (o.orderStatus === "cancelled") return;
      o.items.forEach((item) => {
        const key = item.skuSnapshot || item.sareeNameSnapshot;
        const existing = itemSalesMap.get(key);
        if (!existing) {
          itemSalesMap.set(key, {
            name: item.sareeNameSnapshot,
            sku: item.skuSnapshot,
            quantity: item.quantity,
            revenue: Number(item.totalPrice) || 0,
            image: item.imageUrlSnapshot || undefined,
          });
        } else {
          existing.quantity += item.quantity;
          existing.revenue += Number(item.totalPrice) || 0;
        }
      });
    });

    const bestSellers = Array.from(itemSalesMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Order status breakdown
    const statusCounts: Record<OrderStatus, number> = {
      placed: 0,
      confirmed: 0,
      preparing: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    };
    filteredOrders.forEach((o) => {
      if (statusCounts[o.orderStatus] !== undefined) {
        statusCounts[o.orderStatus] += 1;
      }
    });

    // Daily Sales Timeline (Last 7 days buckets for bar chart)
    const dailyBuckets: { date: string; label: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });

      const dayOrders = orders.filter((o) => o.createdAt?.startsWith(dStr));
      const dayRev = dayOrders
        .filter((o) => o.orderStatus !== "cancelled")
        .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

      dailyBuckets.push({
        date: dStr,
        label: dayLabel,
        revenue: dayRev,
        orders: dayOrders.length,
      });
    }

    const maxBucketRevenue = Math.max(...dailyBuckets.map((b) => b.revenue), 1000);

    return {
      dailySales,
      weeklySales,
      monthlySales,
      totalRevenue,
      orderCount,
      averageOrderValue,
      deliveredOrderValue,
      cancelledOrderValue,
      bestSellers,
      statusCounts,
      dailyBuckets,
      maxBucketRevenue,
    };
  }, [orders, filteredOrders]);

  return (
    <AdminLayout
      title="E-Commerce Analytics & Sales Intelligence"
      subtitle={`Live boutique performance metrics, revenue trajectories, and conversion analytics`}
      actions={
        <div className="flex items-center gap-2">
          {/* Date range filter */}
          <div className="flex items-center rounded-xl bg-white border border-[#E8E0D2] p-1 text-xs shadow-2xs">
            {(["7d", "30d", "this_month", "all"] as const).map((range) => {
              const label =
                range === "7d"
                  ? "7 Days"
                  : range === "30d"
                  ? "30 Days"
                  : range === "this_month"
                  ? "This Month"
                  : "All Time";
              const active = dateRange === range;
              return (
                <button
                  key={range}
                  type="button"
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    active
                      ? "bg-[#6E121E] text-white shadow-2xs"
                      : "text-[#5A4E46] hover:text-[#1E1715]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl border border-[#E8E0D2] bg-white text-[#1E1715] hover:bg-[#FAF6EE] transition shadow-2xs cursor-pointer"
            title="Refresh metrics"
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
            <span>{error}</span>
            <button type="button" onClick={loadData} className="font-bold underline">
              Retry
            </button>
          </div>
        )}

        {/* 1. Core Sales Timeframe Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-[#E8E0D2] shadow-2xs space-y-1">
            <span className="text-xs font-bold text-[#8C7A6B] uppercase tracking-wider">
              Total Revenue ({dateRange.replace("_", " ").toUpperCase()})
            </span>
            <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#6E121E]">
              {formatCurrency(analytics.totalRevenue)}
            </p>
            <p className="text-[11px] text-[#8C7A6B]">
              Excluding cancelled orders
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#E8E0D2] shadow-2xs space-y-1">
            <span className="text-xs font-bold text-[#8C7A6B] uppercase tracking-wider">
              Average Order Value (AOV)
            </span>
            <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715]">
              {formatCurrency(analytics.averageOrderValue)}
            </p>
            <p className="text-[11px] text-[#8C7A6B]">
              Per fulfilled patron order
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              Delivered Value
            </span>
            <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-emerald-700">
              {formatCurrency(analytics.deliveredOrderValue)}
            </p>
            <p className="text-[11px] text-[#8C7A6B]">
              Fulfillment fully completed
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-rose-200 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
              Cancelled Value
            </span>
            <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-rose-700">
              {formatCurrency(analytics.cancelledOrderValue)}
            </p>
            <p className="text-[11px] text-[#8C7A6B]">
              Refunded or restored to stock
            </p>
          </div>
        </div>

        {/* 2. Sales Velocity Metrics (Daily, Weekly, Monthly) */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B] mb-3">
            Sales Velocity Benchmarks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E8E0D2] shadow-2xs space-y-1">
              <span className="text-xs font-semibold text-[#8C7A6B]">Today&apos;s Sales</span>
              <p className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#1E1715]">
                {formatCurrency(analytics.dailySales)}
              </p>
              <p className="text-[10px] text-[#8C7A6B]">Orders placed today</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E0D2] shadow-2xs space-y-1">
              <span className="text-xs font-semibold text-[#8C7A6B]">Weekly Sales (Last 7 Days)</span>
              <p className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#1E1715]">
                {formatCurrency(analytics.weeklySales)}
              </p>
              <p className="text-[10px] text-[#8C7A6B]">Rolling 7-day volume</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E8E0D2] shadow-2xs space-y-1">
              <span className="text-xs font-semibold text-[#8C7A6B]">Monthly Sales (Last 30 Days)</span>
              <p className="font-serif-luxury text-xl sm:text-2xl font-bold text-[#1E1715]">
                {formatCurrency(analytics.monthlySales)}
              </p>
              <p className="text-[10px] text-[#8C7A6B]">Rolling 30-day volume</p>
            </div>
          </div>
        </div>

        {/* 3. Visual Trajectory Charts (Revenue Over Time & Status Distribution) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Over Time Chart (Last 7 Days) */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E0D2] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif-luxury font-bold text-base text-[#1E1715]">
                  Revenue Trajectory (Last 7 Days)
                </h3>
                <p className="text-xs text-[#8C7A6B]">
                  Daily gross boutique revenue from real orders
                </p>
              </div>
              <span className="text-xs font-bold text-[#6E121E]">
                {formatCurrency(analytics.weeklySales)}
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="py-12 text-center space-y-2 text-[#8C7A6B]">
                <BarChart3 className="w-8 h-8 text-[#C5A059] mx-auto opacity-60" />
                <p className="text-xs">No orders placed yet to plot revenue chart.</p>
              </div>
            ) : (
              <div className="pt-6">
                <div className="h-44 flex items-end gap-3 sm:gap-4 justify-between border-b border-stone-200 pb-2">
                  {analytics.dailyBuckets.map((bucket) => {
                    const barHeightPct =
                      bucket.revenue > 0
                        ? Math.max(12, Math.round((bucket.revenue / analytics.maxBucketRevenue) * 100))
                        : 4;

                    return (
                      <div
                        key={bucket.date}
                        className="flex-1 flex flex-col items-center gap-2 group relative"
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1E1715] text-[#FAF7F2] text-[10px] py-1 px-2 rounded-md whitespace-nowrap pointer-events-none shadow-md z-10">
                          {formatCurrency(bucket.revenue)} ({bucket.orders} orders)
                        </div>

                        {/* Bar */}
                        <div className="w-full bg-[#FAF7F2] rounded-t-lg flex items-end h-36">
                          <div
                            className={`w-full rounded-t-lg transition-all duration-500 ${
                              bucket.revenue > 0
                                ? "bg-gradient-to-t from-[#6E121E] to-[#821524] shadow-xs"
                                : "bg-stone-200"
                            }`}
                            style={{ height: `${barHeightPct}%` }}
                          />
                        </div>

                        {/* Day label */}
                        <span className="text-[10px] font-medium text-[#8C7A6B] truncate max-w-full">
                          {bucket.label.split(" ")[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Order Status Distribution */}
          <div className="bg-white p-6 rounded-3xl border border-[#E8E0D2] shadow-2xs space-y-4">
            <div>
              <h3 className="font-serif-luxury font-bold text-base text-[#1E1715]">
                Order Status Breakdown
              </h3>
              <p className="text-xs text-[#8C7A6B]">
                Total: {filteredOrders.length} orders in selected timeframe
              </p>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center space-y-2 text-[#8C7A6B]">
                <Package className="w-8 h-8 text-[#C5A059] mx-auto opacity-60" />
                <p className="text-xs">No orders recorded in this date range.</p>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {[
                  { label: "Delivered", count: analytics.statusCounts.delivered, color: "bg-emerald-500" },
                  { label: "Shipped", count: analytics.statusCounts.out_for_delivery, color: "bg-cyan-500" },
                  { label: "Packed", count: analytics.statusCounts.preparing, color: "bg-purple-500" },
                  { label: "Confirmed", count: analytics.statusCounts.confirmed, color: "bg-blue-500" },
                  { label: "Pending", count: analytics.statusCounts.placed, color: "bg-amber-500" },
                  { label: "Cancelled", count: analytics.statusCounts.cancelled, color: "bg-rose-500" },
                ].map((item) => {
                  const pct = Math.round((item.count / filteredOrders.length) * 100) || 0;
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
        </div>

        {/* 4. Best-Selling Sarees */}
        <div className="bg-white rounded-3xl border border-[#E8E0D2] shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-[#E8E0D2] flex items-center justify-between">
            <div>
              <h3 className="font-serif-luxury font-bold text-base sm:text-lg text-[#1E1715]">
                Best-Selling Sarees
              </h3>
              <p className="text-xs text-[#8C7A6B]">
                Ranked by real revenue and quantity purchased by boutique patrons
              </p>
            </div>
            <Link
              href="/admin/sarees"
              className="text-xs font-bold text-[#6E121E] hover:underline flex items-center gap-1"
            >
              <span>Catalogue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {analytics.bestSellers.length === 0 ? (
            <div className="p-12 text-center space-y-2 text-[#8C7A6B]">
              <Layers className="w-8 h-8 text-[#C5A059] mx-auto opacity-70" />
              <p className="font-serif-luxury font-bold text-base text-[#1E1715]">
                No sales data yet
              </p>
              <p className="text-xs max-w-sm mx-auto">
                Once customer orders are completed on the store, your top-performing saree designs will be ranked here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#8C7A6B] uppercase tracking-wider text-[10px] font-bold border-b border-[#E8E0D2]">
                  <tr>
                    <th className="py-3.5 px-4">Rank</th>
                    <th className="py-3.5 px-4">Saree Design</th>
                    <th className="py-3.5 px-4">SKU</th>
                    <th className="py-3.5 px-4">Units Sold</th>
                    <th className="py-3.5 px-4 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0D2]">
                  {analytics.bestSellers.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF7F2]/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#C5A059]">
                        #{idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#1E1715]">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#8C7A6B]">
                        {item.sku}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#1E1715]">
                        {item.quantity} {item.quantity === 1 ? "unit" : "units"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-right text-[#6E121E]">
                        {formatCurrency(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
