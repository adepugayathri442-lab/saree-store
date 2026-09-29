"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  X,
  RefreshCw,
  Phone,
  Mail,
  ShoppingBag,
  IndianRupee,
  Calendar,
  ExternalLink,
  MessageCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Package,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { createBrowserClient } from "@/lib/supabase/client";
import { Order, OrderStatus } from "@/types/order";
import { mapDbRowToOrder, DbOrderRow } from "@/lib/supabase/orders";
import { formatCurrency, SHOP_CONFIG } from "@/config/shop";

interface CustomerProfile {
  id: string; // key by normalized phone or email
  name: string;
  phone: string;
  email: string | null;
  totalOrders: number;
  totalSpent: number;
  latestOrderDate: string;
  latestOrderNumber: string;
  addresses: string[];
  orders: Order[];
}

export default function AdminCustomersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"spent" | "orders" | "recent">("recent");

  // Selected customer for slide-over drawer
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { data, error: err } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (err) throw new Error(err.message);

      const mapped = (data as (DbOrderRow & { order_items?: any[] })[] || []).map(mapDbRowToOrder);
      setOrders(mapped);
    } catch (err) {
      console.error("Customers data load error:", err);
      setError("Unable to load customer history. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregate Customer Profiles from real order records
  const customers = useMemo(() => {
    const map = new Map<string, CustomerProfile>();

    orders.forEach((order) => {
      // Key by normalized phone number or email or customerName
      const cleanPhone = order.customerPhone ? order.customerPhone.replace(/[^0-9]/g, "") : "";
      const key = cleanPhone || (order.customerEmail ? order.customerEmail.toLowerCase().trim() : "") || order.customerName.trim().toLowerCase();

      if (!key) return;

      const addressStr = [
        `${order.houseNo}, ${order.street}`.trim(),
        order.landmark ? `Landmark: ${order.landmark}` : null,
        `${order.city}, ${order.state} - ${order.pincode}`.trim(),
      ]
        .filter(Boolean)
        .join(", ");

      const existing = map.get(key);
      const isCancelled = order.orderStatus === "cancelled";
      const orderAmount = isCancelled ? 0 : Number(order.totalAmount) || 0;

      if (!existing) {
        map.set(key, {
          id: key,
          name: order.customerName,
          phone: order.customerPhone,
          email: order.customerEmail || null,
          totalOrders: 1,
          totalSpent: orderAmount,
          latestOrderDate: order.createdAt,
          latestOrderNumber: order.orderNumber,
          addresses: addressStr ? [addressStr] : [],
          orders: [order],
        });
      } else {
        existing.totalOrders += 1;
        existing.totalSpent += orderAmount;
        existing.orders.push(order);

        // Keep most up-to-date name or email if available
        if (!existing.email && order.customerEmail) {
          existing.email = order.customerEmail;
        }
        if (addressStr && !existing.addresses.includes(addressStr)) {
          existing.addresses.push(addressStr);
        }
      }
    });

    const list = Array.from(map.values());

    // Sort
    list.sort((a, b) => {
      if (sortBy === "spent") return b.totalSpent - a.totalSpent;
      if (sortBy === "orders") return b.totalOrders - a.totalOrders;
      return new Date(b.latestOrderDate).getTime() - new Date(a.latestOrderDate).getTime();
    });

    return list;
  }, [orders, sortBy]);

  // Search filtering
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const q = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customers, searchTerm]);

  // Summary Metrics
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const repeatCustomers = customers.filter((c) => c.totalOrders > 1).length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgSpendPerCustomer = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;

    return {
      totalCustomers,
      repeatCustomers,
      totalRevenue,
      avgSpendPerCustomer,
    };
  }, [customers]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "placed":
        return { label: "New (Placed)", cls: "bg-amber-100 text-amber-900 border-amber-300" };
      case "confirmed":
        return { label: "Confirmed", cls: "bg-blue-100 text-blue-900 border-blue-300" };
      case "preparing":
        return { label: "Packed", cls: "bg-purple-100 text-purple-900 border-purple-300" };
      case "out_for_delivery":
        return { label: "Shipped", cls: "bg-cyan-100 text-cyan-900 border-cyan-300" };
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
      title="Customer Relationship Management"
      subtitle={`View customer order histories, lifetime value, and direct contact details`}
      actions={
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E0D2] bg-white text-[#1E1715] hover:bg-[#FAF6EE] text-xs font-semibold uppercase tracking-wider transition shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#C5A059]" : ""}`} />
          <span>Refresh</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={loadData} className="font-bold underline">
              Retry
            </button>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-[#E8E0D2] shadow-2xs space-y-1">
            <span className="text-xs font-bold text-[#8C7A6B] uppercase tracking-wider">
              Total Customers
            </span>
            <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715]">
              {stats.totalCustomers}
            </p>
            <p className="text-[11px] text-[#8C7A6B]">Unique purchasing patrons</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Repeat Patrons
            </span>
            <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-blue-700">
              {stats.repeatCustomers}
            </p>
            <p className="text-[11px] text-[#8C7A6B]">Placed 2+ orders</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#C5A059]/40 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-[#6E121E] uppercase tracking-wider">
              Lifetime Value
            </span>
            <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#6E121E]">
              {formatCurrency(stats.totalRevenue)}
            </p>
            <p className="text-[11px] text-[#8C7A6B]">Total spent by patrons</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-2xs space-y-1">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              Average Spend
            </span>
            <p className="font-serif-luxury text-2xl sm:text-3xl font-bold text-emerald-700">
              {formatCurrency(stats.avgSpendPerCustomer)}
            </p>
            <p className="text-[11px] text-[#8C7A6B]">Per unique customer</p>
          </div>
        </div>

        {/* Search & Sort Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8E0D2] shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7A6B]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, phone number, or email..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#E8E0D2] text-xs text-[#2C2420] placeholder-[#8C7A6B] focus:border-[#6E121E] outline-hidden"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7A6B] hover:text-[#1E1715]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#8C7A6B] whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort Customers by"
              className="py-2.5 px-3 rounded-xl border border-[#E8E0D2] bg-white text-xs text-[#2C2420] focus:border-[#6E121E] outline-hidden cursor-pointer"
            >
              <option value="recent">Most Recent Order</option>
              <option value="spent">Highest Lifetime Spend</option>
              <option value="orders">Most Orders Placed</option>
            </select>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-3xl border border-[#E8E0D2] shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#8C7A6B]">Loading customer records...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-[#C5A059] mx-auto opacity-70" />
              <h4 className="font-serif-luxury text-base font-bold text-[#1E1715]">
                {searchTerm ? "No customers match your search" : "No customers yet"}
              </h4>
              <p className="text-xs text-[#8C7A6B] max-w-sm mx-auto">
                {searchTerm
                  ? "Try searching with a different name or phone number."
                  : "Customer profiles will automatically form here as patrons place genuine orders through SaiSrujana."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#8C7A6B] uppercase tracking-wider text-[10px] font-bold border-b border-[#E8E0D2]">
                  <tr>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Total Orders</th>
                    <th className="py-3.5 px-4">Lifetime Spend</th>
                    <th className="py-3.5 px-4">Latest Order</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E0D2]">
                  {filteredCustomers.map((cust) => {
                    const cleanPhone = cust.phone.replace(/[^0-9]/g, "");
                    const targetPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
                    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(
                      `Hello ${cust.name}, greetings from ${SHOP_CONFIG.brandName}, Armoor!`
                    )}`;

                    return (
                      <tr
                        key={cust.id}
                        onClick={() => setSelectedCustomer(cust)}
                        className="hover:bg-[#FAF7F2]/60 transition-colors cursor-pointer"
                      >
                        {/* Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#FAF0DC] text-[#6E121E] font-bold text-xs flex items-center justify-center shrink-0">
                              {cust.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-[#1E1715]">{cust.name}</p>
                              {cust.totalOrders > 1 && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                  Repeat Patron
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 px-4 text-[#5A4E46]">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-[#C5A059]" />
                            <span>{cust.phone}</span>
                          </div>
                          {cust.email && (
                            <div className="flex items-center gap-1.5 text-[11px] text-[#8C7A6B] mt-0.5">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{cust.email}</span>
                            </div>
                          )}
                        </td>

                        {/* Total Orders */}
                        <td className="py-3.5 px-4 font-bold text-[#1E1715]">
                          {cust.totalOrders} {cust.totalOrders === 1 ? "order" : "orders"}
                        </td>

                        {/* Lifetime Spend */}
                        <td className="py-3.5 px-4 font-bold text-[#6E121E]">
                          {formatCurrency(cust.totalSpent)}
                        </td>

                        {/* Latest Order */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-semibold text-[#1E1715]">
                            {cust.latestOrderNumber}
                          </div>
                          <div className="text-[10px] text-[#8C7A6B]">
                            {cust.latestOrderDate ? new Date(cust.latestOrderDate).toLocaleDateString("en-IN") : "—"}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right">
                          <div
                            className="flex items-center justify-end gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg border border-[#E8E0D2] bg-white text-[#1E3F34] hover:bg-[#FAF6EE] transition"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            </a>

                            <button
                              type="button"
                              onClick={() => setSelectedCustomer(cust)}
                              className="px-2.5 py-1 rounded-lg border border-[#E8E0D2] bg-white text-xs font-semibold text-[#6E121E] hover:bg-[#FAF6EE] flex items-center gap-1 cursor-pointer"
                            >
                              <span>History</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
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

      {/* Customer Order History Drawer / Slide-Over Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-2xl bg-white rounded-3xl border border-[#E8E0D2] shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E0D2]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FAF0DC] text-[#6E121E] font-serif-luxury font-bold text-lg flex items-center justify-center">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-serif-luxury font-bold text-lg text-[#1E1715]">
                    {selectedCustomer.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-[#8C7A6B]">
                    <span>Phone: {selectedCustomer.phone}</span>
                    {selectedCustomer.email && <span>• {selectedCustomer.email}</span>}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-xl text-[#8C7A6B] hover:text-[#1E1715] hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D2] text-xs">
              <div>
                <span className="text-[#8C7A6B] block">Total Orders</span>
                <span className="font-bold text-base text-[#1E1715]">
                  {selectedCustomer.totalOrders}
                </span>
              </div>
              <div>
                <span className="text-[#8C7A6B] block">Total Spend</span>
                <span className="font-bold text-base text-[#6E121E]">
                  {formatCurrency(selectedCustomer.totalSpent)}
                </span>
              </div>
              <div>
                <span className="text-[#8C7A6B] block">Customer Status</span>
                <span className="font-bold text-base text-emerald-700">
                  {selectedCustomer.totalOrders > 1 ? "Repeat Patron" : "Verified Customer"}
                </span>
              </div>
            </div>

            {/* Order History Timeline */}
            <div className="space-y-3">
              <h4 className="font-serif-luxury font-bold text-sm text-[#1E1715]">
                Order History ({selectedCustomer.orders.length})
              </h4>

              <div className="space-y-3">
                {selectedCustomer.orders.map((order) => {
                  const badge = getStatusBadge(order.orderStatus);
                  return (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl border border-[#E8E0D2] bg-white space-y-3 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#6E121E]">
                            {order.orderNumber}
                          </span>
                          <span className="text-[#8C7A6B]">
                            • {new Date(order.createdAt).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-stone-100 text-xs text-[#5A4E46]">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-1.5 flex items-center justify-between">
                            <span className="truncate pr-2">
                              {item.quantity}x {item.sareeNameSnapshot}
                              {item.selectedColour ? ` (${item.selectedColour})` : ""}
                            </span>
                            <span className="font-bold shrink-0">
                              {formatCurrency(item.totalPrice)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#1E1715]">
                        <span className="text-[#8C7A6B]">Order Total:</span>
                        <span className="text-sm text-[#6E121E]">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Addresses */}
            {selectedCustomer.addresses.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#E8E0D2]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C7A6B]">
                  Delivery Address on Record
                </h4>
                {selectedCustomer.addresses.map((addr, idx) => (
                  <p key={idx} className="text-xs text-[#5A4E46] p-3 rounded-xl bg-stone-50 border border-stone-200">
                    {addr}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
